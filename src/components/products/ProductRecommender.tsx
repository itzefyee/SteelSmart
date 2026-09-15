'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Product } from '@/lib/supabase';
import Link from 'next/link';
import { useToast } from '@/components/ui/ToastProvider';
import StagedProgress, { StagedProgressItem, StageStatus } from '@/components/ui/StagedProgress';
import { useCatalogMatches, useAlternatives } from '@/hooks/useRecommendations';
import type { ProductSpecs, CatalogMatchResult, AlternativeProduct } from '@/lib/api/recommendation-api';

interface RecommendationItem {
  type: 'catalog' | 'alternative';
  product?: Product;
  alternative?: AlternativeProduct;
  matchScore: number;
  reasoning: string;
}

const buildStageTemplate = (): StagedProgressItem[] => ([
  { id: 'catalog', label: 'Catalog Search', status: 'pending' },
  { id: 'alternatives', label: 'AI Alternatives', status: 'pending' }
]);

const ProductRecommender: React.FC = () => {
  const [requirements, setRequirements] = useState({
    productName: '',
    material: '',
    dimensions: '',
    loadCapacity: '',
    category: 'all'
  });

  const { addToast } = useToast();
  
  // State for search specs (triggers React Query when set)
  const [searchSpecs, setSearchSpecs] = useState<ProductSpecs | null>(null);
  
  // State to control when to fetch alternatives
  const [shouldFetchAlternatives, setShouldFetchAlternatives] = useState(false);
  
  // Dropdown states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  
  // Use separate hooks for catalog and alternatives
  const catalogQuery = useCatalogMatches(searchSpecs || {}, !!searchSpecs);
  const alternativesQuery = useAlternatives(searchSpecs || {}, !!searchSpecs && shouldFetchAlternatives);
  
  const catalogMatches = catalogQuery.data || [];
  const alternatives = alternativesQuery.data || [];
  const isLoading = catalogQuery.isLoading || (shouldFetchAlternatives && alternativesQuery.isLoading);
  const isError = catalogQuery.isError || alternativesQuery.isError;
  const error = catalogQuery.error || alternativesQuery.error;
  
  const [rankedRecommendations, setRankedRecommendations] = useState<RecommendationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'direct' | 'alternatives' | 'ranked'>('direct');
  const [sortBy, setSortBy] = useState<'score' | 'price'>('score');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loadingStages, setLoadingStages] = useState<StagedProgressItem[]>(() => buildStageTemplate());

  const stageProgressActive = useMemo(
    () => isLoading || loadingStages.some(stage => stage.status === 'active' || stage.status === 'error'),
    [isLoading, loadingStages]
  );

  const updateStage = (id: string, status: StageStatus, message?: string) => {
    setLoadingStages(prev =>
      prev.map(stage =>
        stage.id === id
          ? {
              ...stage,
              status,
              message
            }
          : stage
      )
    );
  };

  const resetStages = () => {
    setLoadingStages(buildStageTemplate());
  };

  // Helper function to map componentType to database category
  const mapComponentTypeToCategory = (componentType: string): string => {
    if (!componentType) return 'all';
    
    const type = componentType.toLowerCase();
    
    // Robotic components
    if (type.includes('servo') || type.includes('motor') || type.includes('actuator') || 
        type.includes('encoder') || type.includes('sensor') || type.includes('robot')) {
      return 'robotic';
    }
    
    // Structural components (including automotive/mechanical parts like brake rotors)
    if (type.includes('beam') || type.includes('structural') || type.includes('plate') || 
        type.includes('angle') || type.includes('channel') || type.includes('column') ||
        type.includes('automotive') || type.includes('mechanical') || type.includes('rotor') ||
        type.includes('brake') || type.includes('disc') || type.includes('frame') ||
        type.includes('chassis') || type.includes('suspension')) {
      return 'structural';
    }
    
    // Fasteners
    if (type.includes('bolt') || type.includes('nut') || type.includes('screw') || 
        type.includes('washer') || type.includes('fastener') || type.includes('rivet')) {
      return 'fasteners';
    }
    
    // Custom parts (brackets, mounts, adapters, etc.)
    if (type.includes('bracket') || type.includes('mount') || type.includes('adapter') || 
        type.includes('custom') || type.includes('fitting') || type.includes('connector')) {
      return 'custom';
    }
    
    // Default to 'all' if no match
    return 'all';
  };

  // Save results to localStorage when they change
  useEffect(() => {
    if (catalogMatches.length > 0 || alternatives.length > 0) {
      localStorage.setItem('recommenderResults', JSON.stringify({
        catalogMatches,
        alternatives,
        rankedRecommendations,
        timestamp: Date.now()
      }));
      localStorage.setItem('recommenderRequirements', JSON.stringify(requirements));
    }
  }, [catalogMatches, alternatives, rankedRecommendations, requirements]);

  // Restore results from localStorage on mount (if less than 5 minutes old)
  useEffect(() => {
    const savedResults = localStorage.getItem('recommenderResults');
    const savedRequirements = localStorage.getItem('recommenderRequirements');
    
    if (savedResults && savedRequirements) {
      try {
        const { catalogMatches: savedCatalog, alternatives: savedAlternatives, rankedRecommendations: savedRanked, timestamp } = JSON.parse(savedResults);
        const fiveMinutes = 5 * 60 * 1000;
        
        if (Date.now() - timestamp < fiveMinutes) {
          setRequirements(JSON.parse(savedRequirements));
          // Results will be restored via React Query cache
          addToast({
            type: 'info',
            title: 'Previous search restored',
            description: 'Your recent recommendations are still available'
          });
        } else {
          localStorage.removeItem('recommenderResults');
          localStorage.removeItem('recommenderRequirements');
        }
      } catch (error) {
        console.error('Error restoring results:', error);
        localStorage.removeItem('recommenderResults');
        localStorage.removeItem('recommenderRequirements');
      }
    }
  }, [addToast]);

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
            
            // Clear previous results when new analysis is loaded
            localStorage.removeItem('recommenderResults');
            localStorage.removeItem('recommenderRequirements');
            
            addToast({
              type: 'info',
              title: 'Loaded CAD analysis specs'
            });
            
            // Auto-populate requirements from analysis
            if (data.extractedSpecs) {
              // Map componentType to proper database category
              const mappedCategory = mapComponentTypeToCategory(data.extractedSpecs.componentType || '');
              
              // Use productName from analysis (which is the componentType) or fall back to componentType
              const productNameFromAnalysis = data.extractedSpecs.productName || data.extractedSpecs.componentType || '';
              
              const specs = {
                productName: productNameFromAnalysis,
                material: data.extractedSpecs.material || '',
                dimensions: data.extractedSpecs.dimensions || '',
                loadCapacity: data.extractedSpecs.loadRequirements || '',
                category: mappedCategory
              };
              
              console.log('📊 Mapped analysis data:', {
                originalComponentType: data.extractedSpecs.componentType,
                productName: productNameFromAnalysis,
                mappedCategory: mappedCategory,
                specs: specs
              });
              
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
  }, [addToast]); // Empty dependency array - only run once on mount

  const handleFindRecommendations = (specs?: any) => {
    resetStages();
    
    const newSearchSpecs = specs || requirements;
    
    // Map componentType to category if needed
    const mappedCategory = mapComponentTypeToCategory(newSearchSpecs.componentType || '');
    
    const specsToSearch: ProductSpecs = {
      productName: newSearchSpecs.productName || undefined,
      material: newSearchSpecs.material || undefined,
      dimensions: newSearchSpecs.dimensions || undefined,
      loadCapacity: newSearchSpecs.loadCapacity || undefined,
      category: newSearchSpecs.category !== 'all' ? newSearchSpecs.category : mappedCategory,
      componentType: newSearchSpecs.componentType || undefined,
    };
    
    console.log('🔍 Starting search with specs:', specsToSearch);
    
    // Clear previous results from localStorage on new search
    localStorage.removeItem('recommenderResults');
    localStorage.removeItem('recommenderRequirements');
    
    // Trigger React Query by setting search specs
    // Reset alternatives flag on new search
    setShouldFetchAlternatives(false);
    setSearchSpecs(specsToSearch);
  };

  // Effect to handle catalog search results
  useEffect(() => {
    if (!searchSpecs) return;
    
    if (catalogQuery.isLoading) {
      updateStage('catalog', 'active', 'Searching product catalog...');
    } else if (catalogQuery.isError) {
      updateStage('catalog', 'error', 'Search failed');
      addToast({
        type: 'error',
        title: 'Catalog search failed',
        description: catalogQuery.error?.message || 'Unable to search catalog'
      });
    } else if (catalogQuery.isSuccess) {
      updateStage('catalog', 'success', 
        catalogMatches.length ? `Found ${catalogMatches.length} catalog matches` : 'No direct catalog matches'
      );
    }
  }, [catalogQuery.isLoading, catalogQuery.isError, catalogQuery.isSuccess, catalogMatches.length, searchSpecs]);

  // Effect to handle alternatives results (only when requested)
  useEffect(() => {
    if (!searchSpecs || !shouldFetchAlternatives) return;
    
    if (alternativesQuery.isLoading) {
      updateStage('alternatives', 'active', 'Requesting AI alternatives...');
    } else if (alternativesQuery.isError) {
      updateStage('alternatives', 'error', 'AI request failed');
      addToast({
        type: 'error',
        title: 'AI alternatives failed',
        description: alternativesQuery.error?.message || 'Unable to fetch AI alternatives'
      });
    } else if (alternativesQuery.isSuccess) {
      updateStage('alternatives', 'success',
        alternatives.length ? `AI suggested ${alternatives.length} alternatives` : 'No AI alternatives available'
      );
    }
  }, [alternativesQuery.isLoading, alternativesQuery.isError, alternativesQuery.isSuccess, alternatives.length, shouldFetchAlternatives, searchSpecs]);

  // Effect to handle ranking (runs when we have results to rank)
  useEffect(() => {
    if (!searchSpecs) return;
    
    // Only rank when we have catalog results (and alternatives if they were requested)
    const hasCatalogResults = catalogQuery.isSuccess;
    const hasAlternativesResults = !shouldFetchAlternatives || alternativesQuery.isSuccess;
    
    if (hasCatalogResults && hasAlternativesResults && !catalogQuery.isLoading && !alternativesQuery.isLoading) {
      // Start ranking
      updateStage('ranking', 'active');
      
      // Rank results
      try {
        const ranked = combineAndRank(catalogMatches, alternatives, searchSpecs);
        setRankedRecommendations(ranked);
        
        setLoadingStages(prev =>
          prev.map(stage =>
            stage.id === 'ranking'
              ? {
                  ...stage,
                  status: 'success' as StageStatus,
                  message: ranked.length ? `Ranked ${ranked.length} results` : 'No recommendations to rank'
                }
              : stage
          )
        );
        
        if (ranked.length > 0) {
          addToast({
            type: 'success',
            title: 'Recommendations ready',
            description: `${ranked.length} results ranked by match score.`
          });
        } else {
          addToast({
            type: 'info',
            title: 'No recommendations found',
            description: 'Try broadening your requirements or adjusting filters.'
          });
        }
      } catch (error) {
        console.error('Ranking error:', error);
        setRankedRecommendations([]);
        setLoadingStages(prev =>
          prev.map(stage =>
            stage.id === 'ranking'
              ? { ...stage, status: 'error' as StageStatus, message: 'Failed to score recommendations' }
              : stage
          )
        );
      }
    }
  }, [isLoading, isError, catalogMatches.length, alternatives.length, searchSpecs]);

  const combineAndRank = (
    catalog: CatalogMatchResult[],
    alternatives: AlternativeProduct[],
    _specs: any
  ): RecommendationItem[] => {
    const recommendations: RecommendationItem[] = [];
    
    // Add catalog products with match scores
    catalog.forEach(match => {
      recommendations.push({
        type: 'catalog',
        product: match.product,
        matchScore: match.matchScore,
        reasoning: match.reasoning
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

      {/* Search Form */}
      <div className="glass-container glass-container-with-liquid-compact p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Requirements</h2>
        
        {/* Product Name Search - Featured */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Product Name or Keywords
          </label>
          <input
            type="text"
            value={requirements.productName}
            onChange={(e) => setRequirements({ ...requirements, productName: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleFindRecommendations();
              }
            }}
            placeholder="e.g., Servo Motor, Steel Beam, Hex Bolt, Mounting Bracket..."
            className="glass-input text-base"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Search by product name, type, or keywords for faster results.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
            <input
              type="text"
              value={requirements.material}
              onChange={(e) => setRequirements({ ...requirements, material: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleFindRecommendations();
                }
              }}
              placeholder="e.g., Steel, Aluminum, Stainless Steel"
              className="glass-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Category
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                onBlur={() => setTimeout(() => setCategoryDropdownOpen(false), 200)}
                className="glass-input w-full text-left flex items-center justify-between cursor-pointer"
              >
                <span>
                  {requirements.category === 'all' && 'All Categories'}
                  {requirements.category === 'structural' && 'Structural Steel'}
                  {requirements.category === 'fasteners' && 'Fasteners & Hardware'}
                  {requirements.category === 'robotic' && 'Robotic Components'}
                  {requirements.category === 'custom' && 'Custom Parts'}
                </span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {categoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="glass-card py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRequirements({ ...requirements, category: 'all' });
                        setCategoryDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      All Categories
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRequirements({ ...requirements, category: 'structural' });
                        setCategoryDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Structural Steel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRequirements({ ...requirements, category: 'fasteners' });
                        setCategoryDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Fasteners & Hardware
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRequirements({ ...requirements, category: 'robotic' });
                        setCategoryDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Robotic Components
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRequirements({ ...requirements, category: 'custom' });
                        setCategoryDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Custom Parts
                    </button>
                  </div>
                </div>
              )}
            </div>
            {requirements.category !== 'all' && (
              <p className="mt-1.5 text-xs text-blue-600 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Filtering by {requirements.category} category
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions</label>
            <input
              type="text"
              value={requirements.dimensions}
              onChange={(e) => setRequirements({ ...requirements, dimensions: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleFindRecommendations();
                }
              }}
              placeholder="e.g., 200mm x 100mm x 10mm"
              className="glass-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Load Capacity</label>
            <input
              type="text"
              value={requirements.loadCapacity}
              onChange={(e) => setRequirements({ ...requirements, loadCapacity: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleFindRecommendations();
                }
              }}
              placeholder="e.g., 500kg, 10kN"
              className="glass-input"
            />
          </div>
        </div>
        
        <div className="flex flex-col items-center space-y-3 mt-2">
          <Button 
            onClick={() => handleFindRecommendations()}
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Find Recommendations'}
          </Button>
        </div>

        {stageProgressActive && (
          <div className="mt-6">
            <StagedProgress
              title="Recommender Process"
              subtitle="We’ll show progress only while steps are running."
              stages={loadingStages}
              compact
            />
          </div>
        )}
      </div>

      {/* Results Section */}
      {(catalogMatches.length > 0 || alternatives.length > 0) && (
        <div className="glass-container glass-container-with-liquid">
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
                  <span>Direct Matches</span>
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
                <div className="relative" style={{ minWidth: '200px' }}>
                  <button
                    type="button"
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                    onBlur={() => setTimeout(() => setSortDropdownOpen(false), 200)}
                    className="glass-input w-full text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>
                      {sortBy === 'score' && 'Match Score (High to Low)'}
                      {sortBy === 'price' && 'Price (Low to High)'}
                    </span>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {sortDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="glass-card py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSortBy('score');
                            setSortDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Match Score (High to Low)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSortBy('price');
                            setSortDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Price (Low to High)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Direct Matches Tab */}
            {activeTab === 'direct' && (
              <div>
                {catalogMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {catalogMatches.map((match) => {
                      const { product } = match;
                      const score = match.matchScore;
                      const reasoning = match.reasoning;

                      return (
                        <div key={product.id} className="glass-card p-6 flex flex-col">
                          <div className="flex-1 flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 pr-3">
                                <div className="flex items-center space-x-2 mb-2 flex-wrap">
                                  <span className="text-lg font-semibold text-gray-900">{product.name}</span>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                    Catalog Match
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(score)}`}>
                                    {Math.round(score)}% Match
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{product.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Price</p>
                                <span className="text-lg font-bold text-gray-900">${product.price}</span>
                              </div>
                            </div>

                            {/* Specifications Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
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
                                  {match.matchedSpecs.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {match.matchedSpecs.map(spec => (
                                        <span
                                          key={`${product.id}-${spec}`}
                                          className="px-2 py-0.5 bg-white/60 text-blue-700 text-[11px] font-medium rounded-full border border-blue-200 capitalize"
                                        >
                                          {spec}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-auto flex space-x-3">
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => {
                                  // Store product data in sessionStorage for RFQ auto-fill
                                  sessionStorage.setItem('productForRFQ', JSON.stringify({
                                    productName: product.name,
                                    productId: product.id,
                                    material: product.material,
                                    specifications: product.specifications,
                                    price: product.price,
                                    category: product.category,
                                    description: product.description
                                  }));
                                  window.location.href = '/rfq?fromProduct=true';
                                }}
                              >
                                Add to Quote
                              </Button>
                              <Link href={`/catalog/${product.id}`}>
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="glass-container glass-container-with-liquid p-12 text-center">
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
                {!shouldFetchAlternatives && alternatives.length === 0 ? (
                  <div className="glass-container glass-container-with-liquid p-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-blue-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">AI Alternative Recommendations</h3>
                    <p className="text-gray-600 mb-6">
                      Get AI-powered alternative product suggestions based on your requirements
                    </p>
                    <Button 
                      onClick={() => setShouldFetchAlternatives(true)}
                      disabled={!searchSpecs}
                      className="mx-auto"
                    >
                      🤖 Get AI Alternatives
                    </Button>
                    {!searchSpecs && (
                      <p className="text-sm text-gray-500 mt-3">
                        Enter requirements first to get AI recommendations
                      </p>
                    )}
                  </div>
                ) : alternativesQuery.isLoading ? (
                  <div className="glass-container glass-container-with-liquid p-12 text-center">
                    <LoadingSpinner />
                    <p className="text-gray-600 mt-4">Requesting AI alternatives...</p>
                  </div>
                ) : alternatives.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {alternatives.map((alt, index) => (
                      <div key={index} className="glass-card p-5 flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 text-base line-clamp-1">{alt.name}</h3>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                alt.provenance?.status === 'retrieved'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {alt.provenance?.status === 'retrieved' ? 'Retrieved supplier result' : 'Inferred suggestion'}
                              </span>
                            </div>
                            {alt.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{alt.description}</p>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${getScoreColor(alt.confidence * 100)}`}>
                            {Math.round(alt.confidence * 100)}% Match
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                          {alt.material && (
                            <div>
                              <span className="text-[11px] uppercase tracking-wide text-gray-500">Material</span>
                              <p className="font-semibold text-gray-900 mt-0.5">{alt.material}</p>
                            </div>
                          )}
                          {alt.specifications.dimensions && (
                            <div>
                              <span className="text-[11px] uppercase tracking-wide text-gray-500">Size</span>
                              <p className="font-semibold text-gray-900 mt-0.5 line-clamp-1">{alt.specifications.dimensions}</p>
                            </div>
                          )}
                          {alt.specifications.loadCapacity && (
                            <div>
                              <span className="text-[11px] uppercase tracking-wide text-gray-500">Load</span>
                              <p className="font-semibold text-gray-900 mt-0.5">{alt.specifications.loadCapacity}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-[11px] uppercase tracking-wide text-gray-500">Category</span>
                            <p className="font-semibold text-gray-900 mt-0.5 capitalize">{alt.category}</p>
                          </div>
                        </div>

                        {alt.reasoning && (
                          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
                            <p className="text-[11px] font-semibold text-blue-900 mb-0.5">AI Note</p>
                            <p className="text-xs text-blue-800 line-clamp-3">{alt.reasoning}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                          {alt.provenance?.status === 'retrieved' && alt.provenance.sources?.slice(0, 1).map((source) => (
                            <a
                              key={source.url}
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="max-w-full truncate rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 underline underline-offset-2"
                              title={source.title || source.url}
                            >
                              Source: {source.title || 'Supplier catalogue'}
                            </a>
                          ))}
                          {alt.provenance?.status === 'inferred' && alt.provenance.groundedBy?.length ? (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-800">
                              Grounded by {alt.provenance.groundedBy.length} supplier source{alt.provenance.groundedBy.length === 1 ? '' : 's'}
                            </span>
                          ) : null}
                          {alt.supplierInfo?.suggestedSuppliers?.slice(0, 2).map((supplier, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {supplier}
                            </span>
                          ))}
                          {alt.supplierInfo?.estimatedPrice && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {alt.supplierInfo.estimatedPrice}
                            </span>
                          )}
                          {alt.supplierInfo?.leadTime && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {alt.supplierInfo.leadTime}
                            </span>
                          )}
                          {alt.standards?.slice(0, 2).map((standard, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              ✓ {standard.code}
                            </span>
                          ))}
                        </div>

                        <div className="mt-auto flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              // Store AI alternative data in sessionStorage for RFQ auto-fill
                              sessionStorage.setItem('productForRFQ', JSON.stringify({
                                productName: alt.name,
                                material: alt.material,
                                specifications: alt.specifications,
                                category: alt.category,
                                description: alt.description,
                                supplierInfo: alt.supplierInfo,
                                standards: alt.standards,
                                reasoning: alt.reasoning,
                                isAIAlternative: true
                              }));
                              window.location.href = '/rfq?fromProduct=true';
                            }}
                          >
                            Request Quote
                          </Button>
                          <Button size="sm" variant="ghost">
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-container glass-container-with-liquid p-12 text-center">
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
                        <div key={`${item.type}-${index}`} className="glass-card p-6 flex flex-col">
                          <div className="flex-1 flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2 flex-wrap">
                                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                                  <h3 className="font-semibold text-gray-900 text-lg">
                                    {item.type === 'catalog' ? item.product?.name : item.alternative?.name}
                                  </h3>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    item.type === 'catalog' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {item.type === 'catalog' ? 'Catalog' : 'AI Alternative'}
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
                              <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
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
                              <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
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
                            <div className="mt-auto flex space-x-3">
                              {item.type === 'catalog' && item.product && (
                                <>
                                  <Button size="sm" className="flex-1" onClick={() => window.location.href = `/catalog/${item.product?.id}`}>
                                    View Details
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      sessionStorage.setItem('productForRFQ', JSON.stringify({
                                        productName: item.product?.name,
                                        productId: item.product?.id,
                                        material: item.product?.material,
                                        specifications: item.product?.specifications,
                                        price: item.product?.price,
                                        category: item.product?.category,
                                        description: item.product?.description
                                      }));
                                      window.location.href = '/rfq?fromProduct=true';
                                    }}
                                  >
                                    Add to RFQ
                                  </Button>
                                </>
                              )}
                              {item.type === 'alternative' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => {
                                      sessionStorage.setItem('productForRFQ', JSON.stringify({
                                        productName: item.alternative?.name,
                                        material: item.alternative?.material,
                                        specifications: item.alternative?.specifications,
                                        category: item.alternative?.category,
                                        description: item.alternative?.description
                                      }));
                                      window.location.href = '/rfq?fromProduct=true';
                                    }}
                                  >
                                    Request Custom Quote
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    More Info
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="glass-container glass-container-with-liquid p-12 text-center">
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
        <div className="glass-container glass-container-with-liquid p-12 text-center">
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

export default ProductRecommender;
