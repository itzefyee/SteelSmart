import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import ProductImagePlaceholder from '@/components/ProductImagePlaceholder';

interface ProductCardProps {
  product: Product;
  showCompatibility?: boolean;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  showCompatibility = false,
  className = '' 
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'robotic':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'structural':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'fasteners':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'custom':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'robotic':
        return 'bg-blue-100 text-blue-800';
      case 'structural':
        return 'bg-gray-100 text-gray-800';
      case 'fasteners':
        return 'bg-amber-100 text-amber-800';
      case 'custom':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isCompact = className.includes('compact');
  const imageHeight = isCompact ? 'h-32' : 'h-48';
  
  return (
    <div className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow ${className.replace('compact', '')}`}>
      {/* Product Image */}
      <div className="relative rounded-t-lg overflow-hidden bg-gray-50">
        <div className={`w-full ${imageHeight}`}>
          <ProductImagePlaceholder product={product} className="w-full h-full" />
        </div>
      </div>

      <div className="p-4">
        {/* Category Badge */}
        <div className="flex items-center justify-between mb-2">
          <Link 
            href={`/catalog?category=${product.category}`}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity ${getCategoryColor(product.category)}`}
          >
            <span className="mr-1">{getCategoryIcon(product.category)}</span>
            {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
          </Link>
          
          {/* Stock Status */}
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-1 ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
          {product.name}
        </h3>

        {/* Key Specifications */}
        <div className="space-y-1 mb-3 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Dimensions:</span>
            <span className="font-medium">{product.specifications.dimensions}</span>
          </div>
          <div className="flex justify-between">
            <span>Material:</span>
            <span className="font-medium">{product.material}</span>
          </div>
          {product.specifications.loadCapacity && (
            <div className="flex justify-between">
              <span>Capacity:</span>
              <span className="font-medium">{product.specifications.loadCapacity}</span>
            </div>
          )}
        </div>

        {/* Price and Lead Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-bold text-primary">
            {formatPrice(product.price)}
          </div>
          <div className="text-xs text-gray-500">
            {product.leadTime}
          </div>
        </div>

        {/* Compatible Products (if enabled) */}
        {showCompatibility && product.compatibleWith.length > 0 && (
          <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
            <span className="font-medium text-blue-900">Compatible with:</span>
            <span className="text-blue-700 ml-1">
              {product.compatibleWith.length} product{product.compatibleWith.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            href={`/catalog/${product.id}`}
            className="flex-1 bg-primary text-white text-center py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>
          <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;