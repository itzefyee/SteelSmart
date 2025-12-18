'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import type { Product } from '@/lib/supabase';

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

// Utility functions
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

// Catalog Match Card
interface CatalogMatchCardProps {
  match: CatalogMatchResult;
}

export const CatalogMatchCard: React.FC<CatalogMatchCardProps> = React.memo(({ match }) => {
  const { product } = match;
  const score = match.matchScore;
  const reasoning = match.reasoning;

  return (
    <div className="glass-card p-6 flex flex-col">
      <div className="flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-3">
            <div className="flex items-center space-x-2 mb-2 flex-wrap">
              <span className="text-lg font-semibold text-gray-900">{product.name}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                🏪 Catalog Match
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
    </div>
  );
});

CatalogMatchCard.displayName = 'CatalogMatchCard';

// Alternative Product Card
interface AlternativeCardProps {
  alternative: AlternativeProduct;
  index: number;
}

export const AlternativeCard: React.FC<AlternativeCardProps> = React.memo(({ alternative, index }) => {
  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-base line-clamp-1">{alternative.name}</h3>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              🤖 AI Suggest
            </span>
          </div>
          {alternative.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{alternative.description}</p>
          )}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${getScoreColor(alternative.confidence * 100)}`}>
          {Math.round(alternative.confidence * 100)}% Match
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
        {alternative.material && (
          <div>
            <span className="text-[11px] uppercase tracking-wide text-gray-500">Material</span>
            <p className="font-semibold text-gray-900 mt-0.5">{alternative.material}</p>
          </div>
        )}
        {alternative.specifications.dimensions && (
          <div>
            <span className="text-[11px] uppercase tracking-wide text-gray-500">Size</span>
            <p className="font-semibold text-gray-900 mt-0.5 line-clamp-1">{alternative.specifications.dimensions}</p>
          </div>
        )}
        {alternative.specifications.loadCapacity && (
          <div>
            <span className="text-[11px] uppercase tracking-wide text-gray-500">Load</span>
            <p className="font-semibold text-gray-900 mt-0.5">{alternative.specifications.loadCapacity}</p>
          </div>
        )}
        <div>
          <span className="text-[11px] uppercase tracking-wide text-gray-500">Category</span>
          <p className="font-semibold text-gray-900 mt-0.5 capitalize">{alternative.category}</p>
        </div>
      </div>

      {alternative.reasoning && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
          <p className="text-[11px] font-semibold text-blue-900 mb-0.5">AI Note</p>
          <p className="text-xs text-blue-800 line-clamp-3">{alternative.reasoning}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
        {alternative.supplierInfo?.suggestedSuppliers?.slice(0, 2).map((supplier, idx) => (
          <span key={idx} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {supplier}
          </span>
        ))}
        {alternative.supplierInfo?.estimatedPrice && (
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {alternative.supplierInfo.estimatedPrice}
          </span>
        )}
        {alternative.supplierInfo?.leadTime && (
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {alternative.supplierInfo.leadTime}
          </span>
        )}
        {alternative.standards?.slice(0, 2).map((standard, idx) => (
          <span key={idx} className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            ✓ {standard.code}
          </span>
        ))}
      </div>

      <div className="mt-auto flex gap-2">
        <Button size="sm" variant="outline" className="flex-1">
          Request Quote
        </Button>
        <Button size="sm" variant="ghost">
          Details
        </Button>
      </div>
    </div>
  );
});

AlternativeCard.displayName = 'AlternativeCard';

// Ranked Recommendation Card
interface RankedCardProps {
  item: RecommendationItem;
  index: number;
  sortBy: 'score' | 'price';
}

export const RankedCard: React.FC<RankedCardProps> = React.memo(({ item, index }) => {
  return (
    <div className="glass-card p-6 flex flex-col">
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
    </div>
  );
});

RankedCard.displayName = 'RankedCard';
