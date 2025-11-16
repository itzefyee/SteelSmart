import React from 'react';
import type { Product } from '@/lib/supabase';

interface ProductImagePlaceholderProps {
  product: Product;
  className?: string;
}

const ProductImagePlaceholder: React.FC<ProductImagePlaceholderProps> = ({ product, className = '' }) => {
  const getProductImage = (category: string, productName: string) => {
    const baseClass = `w-full h-full flex items-center justify-center`;
    
    switch (category) {
      case 'robotic':
        return (
          <div className={`${baseClass} bg-gradient-to-br from-blue-50 to-blue-100 relative overflow-hidden ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-400 opacity-20"></div>
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4">
              <div className="w-24 h-16 md:w-32 md:h-20 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg shadow-lg mb-2 relative">
                <div className="absolute top-1 left-1 md:top-2 md:left-2 w-3 h-3 md:w-4 md:h-4 bg-red-500 rounded-full"></div>
                <div className="absolute top-1 right-1 md:top-2 md:right-2 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full"></div>
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 md:bottom-2 w-6 h-6 md:w-8 md:h-8 bg-gray-400 rounded-full border-2 border-gray-600"></div>
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 md:-right-2 w-4 h-8 md:w-6 md:h-12 bg-gray-700 rounded-r-lg"></div>
              </div>
              <div className="text-xs text-gray-600 font-medium text-center px-2">
                {productName.split(' ').slice(0, 2).join(' ')}
              </div>
            </div>
          </div>
        );
      
      case 'structural':
        return (
          <div className={`${baseClass} bg-gradient-to-br from-amber-50 to-amber-100 relative overflow-hidden ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-amber-300 opacity-30"></div>
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4">
              <div className="w-32 h-12 md:w-40 md:h-16 relative">
                {/* I-Beam structure */}
                <div className="absolute top-0 left-0 w-full h-2 md:h-3 bg-gradient-to-r from-gray-500 to-gray-700 rounded-sm shadow-md"></div>
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 md:top-3 w-1.5 h-8 md:w-2 md:h-10 bg-gradient-to-r from-gray-600 to-gray-800"></div>
                <div className="absolute bottom-0 left-0 w-full h-2 md:h-3 bg-gradient-to-r from-gray-500 to-gray-700 rounded-sm shadow-md"></div>
                {/* Dimension lines */}
                <div className="absolute -top-1 left-0 md:-top-2 w-full h-px bg-red-400"></div>
                <div className="absolute -top-1 left-0 md:-top-1 text-xs text-gray-500">L = 6m</div>
              </div>
              <div className="text-xs text-gray-600 font-medium text-center px-2 mt-2">
                {productName.split(' ').slice(0, 2).join(' ')}
              </div>
            </div>
          </div>
        );
      
      case 'fasteners':
        return (
          <div className={`${baseClass} bg-gradient-to-br from-yellow-50 to-yellow-100 relative overflow-hidden ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-orange-300 opacity-20"></div>
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4">
              <div className="flex space-x-2 md:space-x-3">
                {/* Hex Bolt */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-gradient-to-br from-yellow-600 to-orange-700 transform rotate-45 mb-1"></div>
                  <div className="w-1.5 h-8 md:w-2 md:h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-sm relative">
                    {/* Thread lines */}
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="absolute left-0 right-0 border-t border-orange-800 opacity-60" style={{ top: `${i * 16}%` }}></div>
                    ))}
                  </div>
                </div>
                {/* Hex Nut */}
                <div className="flex flex-col items-center">
                  <div className="w-4 h-3 md:w-5 md:h-4 bg-gradient-to-br from-gray-400 to-gray-600 relative">
                    <div className="absolute inset-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-800 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                </div>
                {/* Washer */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full relative">
                    <div className="absolute inset-1 w-1 h-1 md:w-2 md:h-2 bg-white rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600 font-medium text-center px-2 mt-2">
                {productName.split(' ').slice(0, 2).join(' ')}
              </div>
            </div>
          </div>
        );
      
      case 'custom':
        return (
          <div className={`${baseClass} bg-gradient-to-br from-purple-50 to-purple-100 relative overflow-hidden ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-indigo-300 opacity-20"></div>
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4">
              <div className="w-24 h-20 md:w-32 md:h-24 relative">
                {/* L-shaped bracket */}
                <div className="absolute bottom-0 left-0 w-full h-3 md:h-4 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-sm shadow-lg"></div>
                <div className="absolute top-0 left-0 w-3 h-full md:w-4 bg-gradient-to-b from-purple-600 to-indigo-700 rounded-sm shadow-lg"></div>
                {/* Mounting holes */}
                <div className="absolute top-1 left-1 md:top-2 md:left-2 w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-800 rounded-full"></div>
                <div className="absolute bottom-1 left-6 md:bottom-2 md:left-8 w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-800 rounded-full"></div>
                <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-800 rounded-full"></div>
                {/* Dimension arrows */}
                <div className="absolute -right-3 top-0 md:-right-4 text-xs text-gray-500 transform rotate-90 origin-left">150mm</div>
              </div>
              <div className="text-xs text-gray-600 font-medium text-center px-2 mt-1">
                {productName.split(' ').slice(0, 2).join(' ')}
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className={`${baseClass} bg-gradient-to-br from-gray-100 to-gray-200 ${className}`}>
            <div className="flex flex-col items-center text-gray-500 p-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-400 rounded-lg mb-2 flex items-center justify-center">
                <span className="text-xl md:text-2xl font-bold text-white">?</span>
              </div>
              <span className="text-sm font-medium">Product</span>
            </div>
          </div>
        );
    }
  };

  // First try to show the actual image if it exists
  if (product.images && product.images.length > 0) {
    const imageSrc = product.images[0];
    return (
      <div className={`w-full h-full ${className}`}>
        <img 
          src={imageSrc} 
          alt={product.name}
          className="w-full h-full object-cover bg-white"
          onError={(e) => {
            // If image fails to load, hide it and show fallback
            (e.target as HTMLImageElement).style.display = 'none';
            const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div className="w-full h-full hidden">
          {getProductImage(product.category, product.name)}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`w-full h-full ${className}`}>
      {getProductImage(product.category, product.name)}
    </div>
  );
};

export default ProductImagePlaceholder;