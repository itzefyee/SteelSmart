'use client';

import React, { memo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import ProductCard from '@/components/products/ProductCard';
import { DrawingAnalysis } from '@/types';

/**
 * Props for the AnalysisResults component
 */
export interface AnalysisResultsProps {
  analysis: DrawingAnalysis;
  fileName: string | undefined;
  onGetRecommendations: () => void;
  onBrowseCatalog: () => void;
  onCreateRFQ: () => void;
  /** Optional slot for manufacturing section between specs and recommendations */
  manufacturingSlot?: ReactNode;
}

/**
 * Displays AI analysis results including extracted specifications,
 * confidence score, and recommended products.
 */
export const AnalysisResults: React.FC<AnalysisResultsProps> = memo(({
  analysis,
  fileName,
  onGetRecommendations,
  onBrowseCatalog,
  onCreateRFQ,
  manufacturingSlot,
}) => {
  return (
    <div className="space-y-6">
      {/* Analysis Summary */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {Math.round(analysis.confidence * 100)}% confidence
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Specifications Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Product Name - Always show first in grid */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="font-medium text-gray-700 block">Product Name:</span>
              <span className="text-gray-900">
                {analysis.extractedSpecs.productName || 
                 analysis.extractedSpecs.componentType || 
                 'Unknown Component'}
              </span>
            </div>
            
            {/* Other Specifications */}
            {Object.entries(analysis.extractedSpecs).map(([key, value]) => {
              // Skip productName (already shown above) and empty values
              if (key === 'productName' || !value) return null;
              
              // Handle nested objects (like features)
              const displayValue = typeof value === 'object' && value !== null
                ? Object.entries(value)
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ')
                : String(value);
              
              return displayValue ? (
                <div key={key} className="bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium text-gray-700 capitalize block">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="text-gray-900">{displayValue}</span>
                </div>
              ) : null;
            })}
          </div>                        
          <div className="pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Analysis:</span> {analysis.reasoning}
            </p>
          </div>
        </div>
      </div>

      {/* Manufacturing Analysis Section Slot */}
      {manufacturingSlot}

      {/* Recommended Products */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Recommended Products ({analysis.totalRecommendations})
          </h3>
          {analysis.totalRecommendations > 3 && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              +{Math.max(0, analysis.totalRecommendations - 3)} more available
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mb-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              onClick={onGetRecommendations}
              className="w-full"
            >
              Get AI Recommendations
            </Button>
            {analysis.recommendedProducts.length > 0 && (
              <Button 
                onClick={onBrowseCatalog} 
                variant="outline" 
                className="w-full"
              >
                Browse All Products
              </Button>
            )}
          </div>
          
          <Button
            onClick={onCreateRFQ}
            variant="outline"
            className="w-full"
          >
            Create RFQ from Analysis
          </Button>
        </div>

        <div className="border-t border-gray-200 pt-6">
          {analysis.recommendedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analysis.recommendedProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  className="compact h-full"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No specific product matches found.</p>
              <p className="text-sm mt-1">Try browsing our catalog or submit an RFQ for custom parts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

AnalysisResults.displayName = 'AnalysisResults';
