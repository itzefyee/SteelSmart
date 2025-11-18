import React from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import ProductImagePlaceholder from '@/components/products/ProductImagePlaceholder';

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

const CATEGORY_STYLES: Record<
  string,
  { badge: string }
> = {
  robotic: {
    badge: 'bg-blue-200/85 border-blue-500/40 text-slate-900',
  },
  structural: {
    badge: 'bg-slate-200/85 border-slate-500/35 text-slate-900',
  },
  fasteners: {
    badge: 'bg-amber-200/85 border-amber-500/45 text-slate-900',
  },
  custom: {
    badge: 'bg-purple-200/85 border-purple-500/40 text-slate-900',
  },
};

const getCategoryColor = (category: string) => {
  return CATEGORY_STYLES[category]?.badge ?? 'bg-slate-200/85 border-slate-500/35 text-slate-900';
};

  const isCompact = className.includes('compact');
  const imageHeight = isCompact ? 'h-32' : 'h-48';
  
  return (
    <div className={`product-glass-card group ${className.replace('compact', '')}`}>
      {/* Product Image */}
      <div className="relative rounded-t-2xl overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/60">
        <div className={`w-full ${imageHeight}`}>
          <ProductImagePlaceholder product={product} className="w-full h-full" />
        </div>
        {/* Shimmer overlay on image */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>

      <div className="p-5 space-y-4 relative z-10 text-slate-900">
        {/* Category Badge */}
        <div className="flex items-center justify-between mb-2">
          <Link 
            href={`/catalog?category=${product.category}`}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(product.category)}`}
          >
            <span className="mr-1">{getCategoryIcon(product.category)}</span>
            {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
          </Link>
          
          {/* Stock Status */}
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-1 ${product.in_stock ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
            <span className="text-xs text-slate-500">
              {product.in_stock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 text-base">
          {product.name}
        </h3>

        {/* Key Specifications */}
        <div className="space-y-1 text-xs text-slate-600">
          {typeof product.specifications === 'object' && product.specifications !== null && 'dimensions' in product.specifications && (
            <div className="flex justify-between">
              <span>Dimensions:</span>
              <span className="font-semibold text-slate-900">{(product.specifications as any).dimensions}</span>
            </div>
          )}
          {product.material && (
            <div className="flex justify-between">
              <span>Material:</span>
              <span className="font-semibold text-slate-900">{product.material}</span>
            </div>
          )}
          {typeof product.specifications === 'object' && product.specifications !== null && 'loadCapacity' in product.specifications && (
            <div className="flex justify-between">
              <span>Capacity:</span>
              <span className="font-semibold text-slate-900">{(product.specifications as any).loadCapacity}</span>
            </div>
          )}
        </div>

        {/* Price and Lead Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-bold text-blue-700">
            {formatPrice(product.price)}
          </div>
          {product.lead_time && (
            <div className="text-xs text-slate-500">
              {product.lead_time}
            </div>
          )}
        </div>

        {/* Compatible Products (if enabled) */}
        {showCompatibility && product.compatible_with && product.compatible_with.length > 0 && (
          <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded text-xs text-blue-800">
            <span className="font-medium text-blue-900">Compatible with:</span>
            <span className="text-blue-800 ml-1">
              {product.compatible_with.length} product{product.compatible_with.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            href={`/catalog/${product.id}`}
            className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded-lg text-sm font-medium border border-blue-600 hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-all"
          >
            View Details
          </Link>
          <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all">
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