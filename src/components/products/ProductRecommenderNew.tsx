'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getSupabaseClient } from '@/lib/supabase';
import type { Product } from '@/lib/supabase';
import Link from 'next/link';

interface AlternativeProduct {
  name: string;
  description: string;
  category: string;
  material?: string;
  specifications: {
    dimensions?: string;
    loadCapacity?: string;
    standards?: string[];
    partNumber?: string;
  };
  source: string;
  confidence: number;
  reasoning: string;
  supplierInfo?: {
    suggestedSuppliers: string[];
    estimatedPrice?: string;
    leadTime?: string;
  };
  standards?: Array<{
    code: string;
    name: string;
    section?: string;
  }>;
}

interface RecommendationItem {
  type: 'catalog' | 'alternative';
  product?: Product;
  alternative?: AlternativeProduct;
  matchScore: number;
  reasoning: string;
}

const ProductRecommenderNew: React.FC = () => {
  const [requirements, setRequirements] = useState({
    material: '',
    dimensions: '',
    loadCapacity: '',
    category: 'all'
  });

  const [catalogMatches, setCatalogMatches] = useState<Product[]>([]);
  const [alternatives, setAlternatives] = useState<AlternativeProduct[]>([]);
  const [rankedRecommendations, setRankedRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'direct' | 'alternatives' | 'ranked'>('direct');
  const [sortBy, setSortBy] = useState<'score' | 'price'>('score');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Check for analysis data from CAD Analyzer (only once on mount)
  useEffect(() => {
    let isMounted = true;
    
    const loadAnalysisData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('fromAnalysis') === 'true') {
        const storedAnalysis = sessionStorage.getItem('analysisForRecommendation');
        if (storedAnalysis && isMounted) {
          try {
            const data = JSON.parse(storedAnalysis);
            setAnalysisData(data);
            
            // Auto-populate requirements from analysis
            if (data.extractedSpecs) {
              const specs = {
                material: data.extractedSpecs.material || '',
                dimensions: data.extractedSpecs.dimensions || '',
                loadCapacity: data.extractedSpecs.loadRequirements || '',
                category: data.extractedSpecs.componentType || 'all'
              };
              setRequirements(specs);
              
              // Auto-run recommendations with the specs
              await handleFindRecommendations(specs);
            }
            
            // Clean up
            sessionStorage.removeItem('analysisForRecommendation');
            window.history.replaceState({}, '', '/product-recommender');
          } catch (error) {
            console.error('Error parsing analysis data:', error);
          }
        }
      }
    };
    
    loadAnalysisData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  const handleFindRecommendations = async (specs?: any) => {
    console.log('🔍 Starting recommendations search...');
    setIsLoading(true);
    setDebugInfo('Starting search...');
    
    try {
      const searchSpecs = specs || requirements;
      console.log('📋 Search specs:', searchSpecs);
      
      // Step 1: Search catalog for direct matches
      let catalogResults: Product[] = [];
      try {
        setDebugInfo('Searching catalog...');
        console.log('🏪 Searching catalog...');
        catalogResults = await searchCatalog(searchSpecs);
        console.log('✅ Catalog results:', catalogResults.length);
        setCatalogMatches(catalogResults);
        setDebugInfo(`Found ${catalogResults.length} catalog matches`);
      } catch (error) {
        console.error('❌ Catalog search error:', error);
        setDebugInfo('Catalog search failed');
        setCatalogMatches([]);
      }
      
      // Step 2: Get alternative suggestions from AI
      let alternativeResults: AlternativeProduct[] = [];
      try {
        setDebugInfo('Getting AI alternatives...');
        console.log('🤖 Getting AI alternatives...');
        alternativeResults = await getAlternativeSuggestions(searchSpecs);
        console.log('✅ AI alternatives:', alternativeResults.length);
        setAlternatives(alternativeResults);
        setDebugInfo(`Found ${alternativeResults.length} AI alternatives`);
      } catch (error) {
        console.error('❌ Alternative suggestions error:', error);
        setDebugInfo('AI alternatives failed');
        setAlternatives([]);
      }
      
      // Step 3: Combine and rank all recommendations
      try {
        setDebugInfo('Ranking results...');
        console.log('⭐ Ranking results...');
        const ranked = combineAndRank(catalogResults, alternativeResults, searchSpecs);
        console.log('✅ Ranked:', ranked.length);
        setRankedRecommendations(ranked);
        setDebugInfo(`Complete! ${ranked.length} total recommendations`);
      } catch (error) {
        console.error('❌ Ranking error:', error);
        setDebugInfo('Ranking failed');
        setRankedRecommendations([]);
      }
      
    } catch (error) {
      console.error('❌ Error finding recommendations:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Ensure we reset states even on error
      setCatalogMatches([]);
      setAlternatives([]);
      setRankedRecommendations([]);
    } finally {
      console.log('✅ Search complete');
      setIsLoading(false);
    }
  };

  const searchCatalog = async (specs: any): Promise<Product[]> => {
    try {
      const supabase = getSupabaseClient();
      
      let query = supabase.from('products').select('*');
      
      // Filter by category if specified (not 'all')
      if (specs.category && specs.category !== 'all') {
        query = query.eq('category', specs.category);
      }
      
      // Filter by material if specified (case-insensitive partial match)
      if (specs.material && specs.material.trim() !== '') {
        query = query.ilike('material', `%${specs.material}%`);
      }
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Catalog search timeout')), 20000);
      });
      
      const queryPromise = query.limit(50);
      
      // Execute query with timeout
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (error) {
        console.error('Catalog search error:', error);
        return [];
      }
      
      const results = (data as Product[]) || [];
      
      // If no results with filters, try without material filter as fallback
      if (results.length === 0 && specs.material) {
        console.log('No results with material filter, trying without...');
        let fallbackQuery = supabase.from('products').select('*');
        
        if (specs.category && specs.category !== 'all') {
          fallbackQuery = fallbackQuery.eq('category', specs.category);
        }
        
        const { data: fallbackData } = await fallbackQuery.limit(50);
        return (fallbackData as Product[]) || [];
      }
      
      return results;
    } catch (error) {
      console.error('Catalog search exception:', error);
      return [];
    }
  };

  const getAlternativeSuggestions = async (specs: any): Promise<AlternativeProduct[]> => {
    try {
      const response = await fetch('/api/recommendations/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specifications: specs })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get alternative suggestions');
      }
      
      const result = await response.json();
      return result.alternatives || [];
    } catch (error) {
      console.error('Alternative suggestions error:', error);
      return [];
    }
  };

  const combineAndRank = (
    catalog: Product[],
    alternatives: AlternativeProduct[],
    specs: any
  ): RecommendationItem[] => {
    const recommendations: RecommendationItem[] = [];
    
    // Add catalog products with match scores
    catalog.forEach(product => {
      const matchScore = calculateMatchScore(product, specs);
      recommendations.push({
        type: 'catalog',
        product,
        matchScore,
        reasoning: generateMatchReasoning(product, specs, matchScore)
      });
    });
    
    // Add alternatives with their confidence scores
    alternatives.forEach(alt => {
      recommendations.push({
        type: 'alternative',
        alternative: alt,
        matchScore: alt.confidence * 100,
        reasoning: alt.reasoning
      });
    });
    
    // Sort by match score
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  };

  const calculateMatchScore = (product: Product, specs: any): number => {
    let score = 70; // Base score
    
    // Material match
    if (specs.material && product.material) {
      if (product.material.toLowerCase().includes(specs.material.toLowerCase())) {
        score += 15;
      }
    }
    
    // Category match
    if (specs.category && specs.category !== 'all') {
      if (product.category === specs.category) {
        score += 10;
      }
    }
    
    // Availability bonus
    if (product.in_stock) {
      score += 5;
    }
    
    return Math.min(score, 100);
  };

  const generateMatchReasoning = (product: Product, specs: any, score: number): string => {
    const reasons: string[] = [];
    
    if (specs.material && product.material?.toLowerCase().includes(specs.material.toLowerCase())) {
      reasons.push(`Material match: ${product.material}`);
    }
    
    if (product.in_stock) {
      reasons.push('In stock');
    }
    
    if (product.lead_time) {
      reasons.push(`Lead time: ${product.lead_time}`);
    }
    
    if (reasons.length === 0) {
      return 'General compatibility based on category and specifications';
    }
    
    return reasons.join(' • ');
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent Match';
    if (score >= 70) return 'Good Match';
    return 'Fair Match';
  };

  return (
    <div className="space-y-8">
      {/* Analysis Information Banner */}
      {analysisData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">AI-Powered Recommendations</h3>
                <p className="text-sm text-blue-700">
                  Based on your CAD analysis with {Math.round(analysisData.confidence * 100)}% confidence
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info (remove in production) */}
      {debugInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-yellow-800 font-medium">Debug: {debugInfo}</span>
          </div>
        </div>
      )}

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Requirements</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
            <input
              type="text"
              value={requirements.material}
              onChange={(e) => setRequirements({ ...requirements, material: e.target.value })}
              placeholder="e.g., Steel, Aluminum, Stainless Steel"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={requirements.category}
              onChange={(e) => setRequirements({ ...requirements, category: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="structural">Structural</option>
              <option value="fasteners">Fasteners</option>
              <option value="robotic">Robotic</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions</label>
            <input
              type="text"
              value={requirements.dimensions}
              onChange={(e) => setRequirements({ ...requirements, dimensions: e.target.value })}
              placeholder="e.g., 200mm x 100mm x 10mm"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Load Capacity</label>
            <input
              type="text"
              value={requirements.loadCapacity}
              onChange={(e) => setRequirements({ ...requirements, loadCapacity: e.target.value })}
              placeholder="e.g., 500kg, 10kN"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button 
            onClick={() => handleFindRecommendations()}
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Find Recommendations'}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {(catalogMatches.length > 0 || alternatives.length > 0) && (
        <div className="bg-white rounded-lg shadow border">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('direct')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'direct'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>🏪 Direct Matches</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {catalogMatches.length}
                  </span>
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('alternatives')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'alternatives'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>🤖 AI Alternatives</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {alternatives.length}
                  </span>
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('ranked')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'ranked'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>⭐ Ranked All</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {rankedRecommendations.length}
                  </span>
                </span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Sorting Controls for Ranked Tab */}
            {activeTab === 'ranked' && (
              <div className="mb-6 flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'score' | 'price')}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="score">Match Score (High to Low)</option>
                  <option value="price">Price (Low to High)</option>
                </select>
              </div>
            )}

            {/* Direct Matches Tab */}
            {activeTab === 'direct' && (
              <div>
                {catalogMatches.length > 0 ? (
                  <div className="space-y-6">
                    {catalogMatches.map((product) => {
                      const score = calculateMatchScore(product, requirements);
                      const reasoning = generateMatchReasoning(product, requirements, score);

                      return (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                  🏪 Catalog Match
                                </span>
                                {/* Match Score Badge - Similar to AI Alternatives */}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(score)}`}>
                                  {Math.round(score)}% Match
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-gray-900">${product.price}</span>
                            </div>
                          </div>

                          {/* Specifications Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <span className="text-xs text-gray-600">Material</span>
                              <p className="font-medium text-gray-900">{product.material || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-600">Category</span>
                              <p className="font-medium text-gray-900 capitalize">{product.category || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-600">Lead Time</span>
                              <p className="font-medium text-gray-900">{product.lead_time || 'N/A'}</p>
                            </div>
                             <div>
                              <span className="text-xs text-gray-600">Availability</span>
                              <p className={`font-medium ${product.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                                {product.in_stock ? '✓ In Stock' : '✗ Out of Stock'}
                              </p>
                            </div>
                          </div>

                          {/* Reasoning Box */}
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="flex-1">
                                <h4 className="text-xs font-semibold text-blue-900 mb-1">Match Analysis</h4>
                                <p className="text-xs text-blue-800">{reasoning}</p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-3">
                            <Link href="/rfq" className="flex-1">
                              <Button size="sm" className="w-full">
                                Add to Quote
                              </Button>
                            </Link>
                            <Link href={`/catalog/${product.id}`}>
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Direct Matches Found</h3>
                    <p className="text-gray-600">Try adjusting your requirements or check AI Alternatives</p>
                  </div>
                )}
              </div>
            )}

            {/* AI Alternatives Tab */}
            {activeTab === 'alternatives' && (
              <div>
                {alternatives.length > 0 ? (
                  <div className="space-y-6">
                    {alternatives.map((alt, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-900 text-lg">{alt.name}</h3>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                🤖 AI Suggested
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(alt.confidence * 100)}`}>
                                {Math.round(alt.confidence * 100)}% Match
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{alt.description}</p>
                          </div>
                        </div>

                        {/* Specifications */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                          {alt.material && (
                            <div>
                              <span className="text-xs text-gray-600">Material</span>
                              <p className="font-medium text-gray-900">{alt.material}</p>
                            </div>
                          )}
                          {alt.specifications.dimensions && (
                            <div>
                              <span className="text-xs text-gray-600">Dimensions</span>
                              <p className="font-medium text-gray-900">{alt.specifications.dimensions}</p>
                            </div>
                          )}
                          {alt.specifications.loadCapacity && (
                            <div>
                              <span className="text-xs text-gray-600">Load Capacity</span>
                              <p className="font-medium text-gray-900">{alt.specifications.loadCapacity}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-xs text-gray-600">Category</span>
                            <p className="font-medium text-gray-900 capitalize">{alt.category}</p>
                          </div>
                        </div>

                        {/* AI Reasoning */}
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-blue-900 mb-1">Why This Alternative?</h4>
                              <p className="text-sm text-blue-800">{alt.reasoning}</p>
                            </div>
                          </div>
                        </div>

                        {/* Supplier Information */}
                        {alt.supplierInfo && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {alt.supplierInfo.suggestedSuppliers && alt.supplierInfo.suggestedSuppliers.length > 0 && (
                              <div>
                                <span className="text-xs font-medium text-gray-700">Suggested Suppliers</span>
                                <p className="text-sm text-gray-900 mt-1">
                                  {alt.supplierInfo.suggestedSuppliers.join(', ')}
                                </p>
                              </div>
                            )}
                            {alt.supplierInfo.estimatedPrice && (
                              <div>
                                <span className="text-xs font-medium text-gray-700">Estimated Price</span>
                                <p className="text-sm text-gray-900 mt-1">{alt.supplierInfo.estimatedPrice}</p>
                              </div>
                            )}
                            {alt.supplierInfo.leadTime && (
                              <div>
                                <span className="text-xs font-medium text-gray-700">Lead Time</span>
                                <p className="text-sm text-gray-900 mt-1">{alt.supplierInfo.leadTime}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Standards */}
                        {alt.standards && alt.standards.length > 0 && (
                          <div className="mb-4">
                            <span className="text-xs font-medium text-gray-700 block mb-2">Compliance Standards</span>
                            <div className="flex flex-wrap gap-2">
                              {alt.standards.map((standard, idx) => (
                                <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  ✓ {standard.code} - {standard.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex space-x-3">
                          <Button size="sm" variant="outline" className="flex-1">
                            Request Custom Quote
                          </Button>
                          <Button size="sm" variant="outline">
                            More Info
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Alternatives Available</h3>
                    <p className="text-gray-600">The AI couldn't generate alternative suggestions for these requirements</p>
                  </div>
                )}
              </div>
            )}

            {/* Ranked Recommendations Tab */}
            {activeTab === 'ranked' && (
              <div>
                {rankedRecommendations.length > 0 ? (
                  <div className="space-y-4">
                    {rankedRecommendations
                      .sort((a, b) => {
                        if (sortBy === 'price') {
                          const priceA = a.product?.price || 0;
                          const priceB = b.product?.price || 0;
                          return priceA - priceB;
                        }
                        return b.matchScore - a.matchScore;
                      })
                      .map((item, index) => (
                        <div key={`${item.type}-${index}`} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {item.type === 'catalog' ? item.product?.name : item.alternative?.name}
                                </h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  item.type === 'catalog' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {item.type === 'catalog' ? '🏪 Catalog' : '🤖 AI Alternative'}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(item.matchScore)}`}>
                                  {Math.round(item.matchScore)}% {getScoreLabel(item.matchScore)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Match Score Breakdown */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Match Score</span>
                              <span className="text-sm text-gray-600">{Math.round(item.matchScore)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full transition-all ${
                                  item.matchScore >= 85 ? 'bg-green-500' :
                                  item.matchScore >= 70 ? 'bg-yellow-500' :
                                  'bg-orange-500'
                                }`}
                                style={{ width: `${item.matchScore}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Product Details */}
                          {item.type === 'catalog' && item.product && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <span className="text-xs text-gray-600">Material</span>
                                <p className="font-medium text-gray-900">{item.product.material || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-600">Price</span>
                                <p className="font-medium text-gray-900">${item.product.price}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-600">Lead Time</span>
                                <p className="font-medium text-gray-900">{item.product.lead_time || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-600">Availability</span>
                                <p className={`font-medium ${item.product.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                                  {item.product.in_stock ? '✓ In Stock' : '✗ Out of Stock'}
                                </p>
                              </div>
                            </div>
                          )}

                          {item.type === 'alternative' && item.alternative && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <span className="text-xs text-gray-600">Material</span>
                                <p className="font-medium text-gray-900">{item.alternative.material || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-600">Est. Price</span>
                                <p className="font-medium text-gray-900">
                                  {item.alternative.supplierInfo?.estimatedPrice || 'Contact for quote'}
                                </p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-600">Lead Time</span>
                                <p className="font-medium text-gray-900">
                                  {item.alternative.supplierInfo?.leadTime || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-600">Category</span>
                                <p className="font-medium text-gray-900 capitalize">{item.alternative.category}</p>
                              </div>
                            </div>
                          )}

                          {/* Reasoning */}
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="flex-1">
                                <h4 className="text-xs font-semibold text-blue-900 mb-1">Why Recommended</h4>
                                <p className="text-xs text-blue-800">{item.reasoning}</p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-3">
                            {item.type === 'catalog' && item.product && (
                              <>
                                <Button size="sm" className="flex-1" onClick={() => window.location.href = `/catalog/${item.product?.id}`}>
                                  View Details
                                </Button>
                                <Button size="sm" variant="outline">
                                  Add to RFQ
                                </Button>
                              </>
                            )}
                            {item.type === 'alternative' && (
                              <>
                                <Button size="sm" variant="outline" className="flex-1">
                                  Request Custom Quote
                                </Button>
                                <Button size="sm" variant="outline">
                                  More Info
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
                    <p className="text-gray-600">Enter your requirements above to get started</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && catalogMatches.length === 0 && alternatives.length === 0 && (
        <div className="bg-white rounded-lg shadow border p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Ready to Find Your Perfect Match</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Enter your product requirements above to get AI-powered recommendations from our catalog 
            and intelligent alternative suggestions.
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">1</span>
              <span>Enter specs</span>
            </div>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">2</span>
              <span>Get matches</span>
            </div>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">3</span>
              <span>Compare & choose</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductRecommenderNew;
