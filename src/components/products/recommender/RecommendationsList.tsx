'use client';

import React from 'react';
import type { Product } from '@/lib/supabase';
import { CatalogMatchCard, AlternativeCard, RankedCard } from './RecommendationCard';

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

interface CatalogMatchResult {
  product: Product;
  matchScore: number;
  rawScore: number;
  reasoning: string;
  matchedSpecs: string[];
}

interface RecommendationItem {
  type: 'catalog' | 'alternative';
  product?: Product;
  alternative?: AlternativeProduct;
  matchScore: number;
  reasoning: string;
}

interface RecommendationsListProps {
  activeTab: 'direct' | 'alternatives' | 'ranked';
  catalogMatches: CatalogMatchResult[];
  alternatives: AlternativeProduct[];
  rankedRecommendations: RecommendationItem[];
  sortBy: 'score' | 'price';
  onSortChange: (sort: 'score' | 'price') => void;
  onTabChange: (tab: 'direct' | 'alternatives' | 'ranked') => void;
}

const EmptyState: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
  <div className="glass-container glass-container-with-liquid p-12 text-center">
    {icon}
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const RecommendationsList: React.FC<RecommendationsListProps> = React.memo(({
  activeTab,
  catalogMatches,
  alternatives,
  rankedRecommendations,
  sortBy,
  onSortChange,
  onTabChange,
}) => {
  if (catalogMatches.length === 0 && alternatives.length === 0) {
    return null;
  }

  return (
    <div className="glass-container glass-container-with-liquid">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => onTabChange('direct')}
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
            onClick={() => onTabChange('alternatives')}
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
            onClick={() => onTabChange('ranked')}
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
              onChange={(e) => onSortChange(e.target.value as 'score' | 'price')}
              className="glass-input"
              style={{ width: 'auto', minWidth: '200px' }}
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {catalogMatches.map((match) => (
                  <CatalogMatchCard key={match.product.id} match={match} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Direct Matches Found"
                description="Try adjusting your requirements or check AI Alternatives"
                icon={
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                }
              />
            )}
          </div>
        )}

        {/* AI Alternatives Tab */}
        {activeTab === 'alternatives' && (
          <div>
            {alternatives.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {alternatives.map((alt, index) => (
                  <AlternativeCard key={index} alternative={alt} index={index} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No AI Alternatives Available"
                description="The AI couldn't generate alternative suggestions for these requirements"
                icon={
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                }
              />
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
                    <RankedCard key={`${item.type}-${index}`} item={item} index={index} sortBy={sortBy} />
                  ))}
              </div>
            ) : (
              <EmptyState
                title="No Recommendations Yet"
                description="Enter your requirements above to get started"
                icon={
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
});

RecommendationsList.displayName = 'RecommendationsList';

export default RecommendationsList;
