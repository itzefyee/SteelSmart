import React from 'react';
import { Product } from '@/types';

interface ProductImageProps {
  product: Product;
  className?: string;
}

const ProductImage: React.FC<ProductImageProps> = ({ product, className = '' }) => {
  const getProductSVG = (category: string) => {
    switch (category) {
      case 'robotic':
        return (
          <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`}>
            {/* Servo Motor SVG */}
            <defs>
              <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#e5e7eb', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#9ca3af', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#6b7280', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <rect x="40" y="60" width="120" height="80" rx="8" fill="url(#metalGradient)" stroke="#374151" strokeWidth="2"/>
            <circle cx="100" cy="100" r="25" fill="#1f2937" stroke="#374151" strokeWidth="2"/>
            <circle cx="100" cy="100" r="15" fill="#4b5563"/>
            <rect x="45" y="65" width="20" height="8" rx="2" fill="#ef4444"/>
            <rect x="45" y="75" width="20" height="8" rx="2" fill="#22c55e"/>
            <rect x="135" y="65" width="20" height="70" rx="4" fill="#374151"/>
            <text x="100" y="45" textAnchor="middle" className="text-xs fill-gray-600">Servo Motor</text>
          </svg>
        );
      
      case 'structural':
        return (
          <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`}>
            {/* Steel Beam SVG */}
            <defs>
              <linearGradient id="steelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#f3f4f6', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#d1d5db', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#9ca3af', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <rect x="20" y="40" width="160" height="20" fill="url(#steelGradient)" stroke="#6b7280" strokeWidth="1"/>
            <rect x="20" y="90" width="160" height="20" fill="url(#steelGradient)" stroke="#6b7280" strokeWidth="1"/>
            <rect x="20" y="140" width="160" height="20" fill="url(#steelGradient)" stroke="#6b7280" strokeWidth="1"/>
            <rect x="60" y="40" width="8" height="120" fill="url(#steelGradient)" stroke="#6b7280" strokeWidth="1"/>
            <rect x="132" y="40" width="8" height="120" fill="url(#steelGradient)" stroke="#6b7280" strokeWidth="1"/>
            <text x="100" y="35" textAnchor="middle" className="text-xs fill-gray-600">I-Beam Steel</text>
          </svg>
        );
      
      case 'fasteners':
        return (
          <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`}>
            {/* Bolt SVG */}
            <defs>
              <linearGradient id="boltGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <polygon points="85,50 115,50 120,60 115,70 85,70 80,60" fill="url(#boltGradient)" stroke="#92400e" strokeWidth="1"/>
            <rect x="90" y="70" width="20" height="100" fill="url(#boltGradient)" stroke="#92400e" strokeWidth="1"/>
            {/* Thread lines */}
            {[...Array(8)].map((_, i) => (
              <line key={i} x1="88" y1={75 + i * 12} x2="112" y2={75 + i * 12} stroke="#92400e" strokeWidth="1"/>
            ))}
            <text x="100" y="40" textAnchor="middle" className="text-xs fill-gray-600">Hex Bolt</text>
          </svg>
        );
      
      case 'custom':
        return (
          <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`}>
            {/* Custom Bracket SVG */}
            <defs>
              <linearGradient id="bracketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#9333ea', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path d="M40 60 L40 140 L160 140 L160 120 L120 120 L120 80 L160 80 L160 60 Z" 
                  fill="url(#bracketGradient)" stroke="#5b21b6" strokeWidth="2"/>
            <circle cx="50" cy="70" r="4" fill="none" stroke="#5b21b6" strokeWidth="2"/>
            <circle cx="50" cy="130" r="4" fill="none" stroke="#5b21b6" strokeWidth="2"/>
            <circle cx="150" cy="70" r="4" fill="none" stroke="#5b21b6" strokeWidth="2"/>
            <text x="100" y="50" textAnchor="middle" className="text-xs fill-gray-600">Custom Bracket</text>
          </svg>
        );
      
      default:
        return (
          <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`}>
            <rect x="50" y="50" width="100" height="100" rx="8" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2"/>
            <text x="100" y="105" textAnchor="middle" className="text-sm fill-gray-500">Product</text>
          </svg>
        );
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 flex items-center justify-center">
      {getProductSVG(product.category)}
    </div>
  );
};

export default ProductImage;