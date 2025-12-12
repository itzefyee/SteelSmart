'use client';

import React, { useState } from 'react';
import { sampleRecommendations, sampleDrawings } from '@/data/sample-data';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface RecommendedProduct {
  id: number;
  name: string;
  material: string;
  price: number;
  compatibility: number;
  description: string;
  supplier: string;
  leadTime: string;
}

const ProductRecommender: React.FC = () => {
  const [selectedDrawing, setSelectedDrawing] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [activeTab, setActiveTab] = useState<'matching' | 'alternatives' | 'ranked'>('matching');
  const [sortBy, setSortBy] = useState<'compatibility' | 'price' | 'leadTime'>('compatibility');
  const [filterMaterial, setFilterMaterial] = useState<string>('all');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [showAnalysisInfo, setShowAnalysisInfo] = useState(false);

  // Check for analysis data from CAD Analyzer
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('fromAnalysis') === 'true') {
      const storedAnalysis = sessionStorage.getItem('analysisForRecommendation');
      if (storedAnalysis) {
        try {
          const data = JSON.parse(storedAnalysis);
          setAnalysisData(data);
          setShowAnalysisInfo(true);
          // Auto-run recommendations based on analysis
          handleAnalysisBasedRecommendations(data);
          sessionStorage.removeItem('analysisForRecommendation');
        } catch (error) {
          console.error('Error parsing analysis data:', error);
        }
      }
    }
  }, []);

  const handleComponentMatching = async () => {
    if (selectedDrawing === null) return;
    
    setIsMatching(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setRecommendations(sampleRecommendations);
    setIsMatching(false);
    setActiveTab('matching');
  };

  const handleAnalysisBasedRecommendations = async (data: any) => {
    setIsMatching(true);
    
    // Simulate AI processing based on analysis data
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Generate enhanced recommendations based on analysis confidence and specs
    const enhancedRecommendations = sampleRecommendations.map(product => ({
      ...product,
      compatibility: Math.min(95, Math.max(70, product.compatibility + (data.confidence * 10))),
      description: `${product.description} - Optimized based on your CAD analysis`
    }));
    
    setRecommendations(enhancedRecommendations);
    setIsMatching(false);
    setActiveTab('matching');
  };

  const getAlternativeProducts = () => {
    // Return alternative materials/suppliers for the same basic component
    return sampleRecommendations.map(product => ({
      ...product,
      id: product.id + 100,
      name: `Alternative: ${product.name}`,
      material: product.material === 'SS304' ? 'Aluminum 6061' : 'Carbon Steel',
      price: Math.round(product.price * 0.8),
      compatibility: Math.max(product.compatibility - 10, 70),
      description: `Budget-friendly alternative to ${product.name.toLowerCase()}`,
      supplier: product.supplier === 'SteelCorp Ltd' ? 'BudgetMetal Co' : 'AlternateParts Inc'
    }));
  };

  const getRankedRecommendations = () => {
    const allProducts = [...recommendations, ...getAlternativeProducts()];
    
    return allProducts
      .filter(product => filterMaterial === 'all' || product.material.toLowerCase().includes(filterMaterial.toLowerCase()))
      .sort((a, b) => {
        switch (sortBy) {
          case 'price':
            return a.price - b.price;
          case 'leadTime':
            return parseInt(a.leadTime) - parseInt(b.leadTime);
          case 'compatibility':
          default:
            return b.compatibility - a.compatibility;
        }
      });
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 75) return 'Good Match';
    return 'Fair Match';
  };

  return (
    <div className="space-y-8">
      {/* Analysis Information */}
      {showAnalysisInfo && analysisData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Recommendations Based on CAD Analysis</h3>
                <p className="text-sm text-blue-700">
                  Generating AI-powered recommendations from your analyzed drawing: <span className="font-medium">{analysisData.drawingName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAnalysisInfo(false)}
              className="text-blue-400 hover:text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3">
              <div className="text-sm text-gray-600">Analysis Confidence</div>
              <div className="text-lg font-semibold text-blue-900">{Math.round(analysisData.confidence * 100)}%</div>
            </div>
            {analysisData.extractedSpecs?.material && (
              <div className="bg-white rounded-lg p-3">
                <div className="text-sm text-gray-600">Detected Material</div>
                <div className="text-lg font-semibold text-blue-900">{analysisData.extractedSpecs.material}</div>
              </div>
            )}
            {analysisData.extractedSpecs?.dimensions && (
              <div className="bg-white rounded-lg p-3">
                <div className="text-sm text-gray-600">Dimensions</div>
                <div className="text-lg font-semibold text-blue-900">{analysisData.extractedSpecs.dimensions}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawing Selection */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Component Drawing</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {sampleDrawings.map((drawing) => (
            <div
              key={drawing.id}
              onClick={() => setSelectedDrawing(drawing.id)}
              className={`cursor-pointer border rounded-lg p-3 transition-all ${
                selectedDrawing === drawing.id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="bg-gray-50 rounded-md mb-3 flex items-center justify-center overflow-hidden p-2">
                <img 
                  src={drawing.preview} 
                  alt={drawing.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="font-medium text-gray-900 mb-1 text-sm">{drawing.name}</h3>
              <p className="text-xs text-gray-600">{drawing.description}</p>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center">
          <Button 
            onClick={handleComponentMatching}
            disabled={selectedDrawing === null || isMatching}
            className="px-8"
          >
            {isMatching ? <LoadingSpinner size="sm" /> : 'Find Matching Components'}
          </Button>
        </div>
      </div>

      {/* Recommendations Results */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('matching')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'matching'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Direct Matches ({recommendations.length})
              </button>
              <button
                onClick={() => setActiveTab('alternatives')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'alternatives'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Alternative Products
              </button>
              <button
                onClick={() => setActiveTab('ranked')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ranked'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Ranked Recommendations
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Filters for Ranked Tab */}
            {activeTab === 'ranked' && (
              <div className="mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'compatibility' | 'price' | 'leadTime')}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="compatibility">Compatibility Score</option>
                    <option value="price">Price (Low to High)</option>
                    <option value="leadTime">Lead Time</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Material:</label>
                  <select
                    value={filterMaterial}
                    onChange={(e) => setFilterMaterial(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Materials</option>
                    <option value="steel">Steel</option>
                    <option value="aluminum">Aluminum</option>
                    <option value="carbon">Carbon Steel</option>
                  </select>
                </div>
              </div>
            )}

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeTab === 'matching' ? recommendations :
                activeTab === 'alternatives' ? getAlternativeProducts() :
                getRankedRecommendations()
              ).map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompatibilityColor(product.compatibility)}`}>
                      {product.compatibility}%
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Material:</span>
                      <span className="font-medium text-gray-900">{product.material}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-gray-900">${product.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Lead Time:</span>
                      <span className="font-medium text-gray-900">{product.leadTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Supplier:</span>
                      <span className="font-medium text-gray-900">{product.supplier}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Compatibility</span>
                      <span className="text-sm text-gray-600">{getCompatibilityLabel(product.compatibility)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          product.compatibility >= 90 ? 'bg-green-500' :
                          product.compatibility >= 75 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${product.compatibility}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Add to RFQ
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* No Results */}
            {activeTab === 'ranked' && getRankedRecommendations().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p>No products match the selected filters.</p>
                <p className="text-sm mt-1">Try adjusting your filter criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recommendations.length === 0 && (
        <div className="bg-white rounded-lg shadow border p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Recommendations</h3>
          <p className="text-gray-600">
            Select a component drawing above to get AI-powered product recommendations with compatibility scores.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductRecommender;
