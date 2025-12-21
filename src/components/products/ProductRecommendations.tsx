'use client';

import React from 'react';
import ProductCard from '@/components/products/ProductCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Product } from '@/lib/supabase';
import { useProductRecommendations } from '@/hooks/useRecommendations';

interface ProductRecommendationsProps {
  productId: string;
  title?: string;
  maxRecommendations?: number;
}

const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  productId,
  title = "You Might Also Need",
  maxRecommendations = 4
}) => {
  // Use React Query hook for recommendations with automatic caching
  const { 
    data: recommendations = [], 
    isLoading: loading, 
    error 
  } = useProductRecommendations(productId, maxRecommendations);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow border p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner className="mb-2" />
            <p className="text-gray-600 text-sm">Loading recommendations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow border p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations available</h3>
          <p className="text-gray-600">
            {error ? `Unable to load recommendations: ${error.message}` : 'Check back later for personalized product suggestions.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow border p-8 mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Powered
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
            showCompatibility={false}
          />
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">Why these recommendations?</h4>
              <p className="text-sm text-blue-700">
                Our AI analyzes product compatibility, usage patterns, and technical specifications to suggest items that work well together or serve similar functions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductRecommendations;