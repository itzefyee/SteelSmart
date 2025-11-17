'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/products/ProductCard';
import ProductRecommendations from '@/components/products/ProductRecommendations';
import Button from '@/components/ui/Button';
import ProductImagePlaceholder from '@/components/products/ProductImagePlaceholder';
import type { Product } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

const ProductDetailClient: React.FC<ProductDetailClientProps> = ({ 
  product, 
  relatedProducts 
}) => {
  const [selectedImage, setSelectedImage] = useState(0);

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

  return (
    <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-primary">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/catalog" className="hover:text-primary">Catalog</Link>
            </li>
            <li>/</li>
            <li className="text-gray-900">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden">
              <div className="w-full h-96">
                <ProductImagePlaceholder product={product} className="h-full" />
              </div>
            </div>
            
            {/* Image thumbnails (placeholder) */}
            <div className="flex space-x-2">
              {[...Array(3)].map((_, index) => (
                <button
                  key={index}
                  className={`w-16 h-16 bg-gray-100 rounded-lg border-2 ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Category Badge */}
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(product.category)}`}>
                {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
              </span>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${product.in_stock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {product.in_stock ? 'In Stock' : 'Out of Stock'}{product.lead_time && ` • ${product.lead_time}`}
                </span>
              </div>
            </div>

            {/* Product Name and Price */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <div className="text-3xl font-bold text-primary mb-2">
                {formatPrice(product.price)}
              </div>
              <p className="text-gray-600">{product.description}</p>
            </div>

            {/* Key Specifications */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Key Specifications</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {typeof product.specifications === 'object' && product.specifications !== null && 'dimensions' in product.specifications && (
                  <div>
                    <dt className="font-medium text-gray-700">Dimensions</dt>
                    <dd className="text-gray-900">{(product.specifications as any).dimensions}</dd>
                  </div>
                )}
                {typeof product.specifications === 'object' && product.specifications !== null && 'weight' in product.specifications && (
                  <div>
                    <dt className="font-medium text-gray-700">Weight</dt>
                    <dd className="text-gray-900">{(product.specifications as any).weight}</dd>
                  </div>
                )}
                {product.material && (
                  <div>
                    <dt className="font-medium text-gray-700">Material</dt>
                    <dd className="text-gray-900">{product.material}</dd>
                  </div>
                )}
                {typeof product.specifications === 'object' && product.specifications !== null && 'loadCapacity' in product.specifications && (
                  <div>
                    <dt className="font-medium text-gray-700">Load Capacity</dt>
                    <dd className="text-gray-900">{(product.specifications as any).loadCapacity}</dd>
                  </div>
                )}
                {typeof product.specifications === 'object' && product.specifications !== null && 'tolerance' in product.specifications && (
                  <div>
                    <dt className="font-medium text-gray-700">Tolerance</dt>
                    <dd className="text-gray-900">{(product.specifications as any).tolerance}</dd>
                  </div>
                )}
                {typeof product.specifications === 'object' && product.specifications !== null && 'operatingTemp' in product.specifications && (
                  <div>
                    <dt className="font-medium text-gray-700">Operating Temperature</dt>
                    <dd className="text-gray-900">{(product.specifications as any).operatingTemp}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/rfq" className="flex-1">
                <Button className="w-full">
                  Request Quote
                </Button>
              </Link>
              <Link 
                href={`/cad-generator?prompt=${encodeURIComponent(`Generate a technical drawing for ${product.name}. Material: ${product.material || 'steel'}. ${typeof product.specifications === 'object' && product.specifications !== null && 'dimensions' in product.specifications ? `Dimensions: ${(product.specifications as any).dimensions}` : ''}`)}`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  <span>Generate Drawing</span>
                </Button>
              </Link>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
              <p className="text-blue-700 text-sm mb-3">
                Our technical experts are here to help you find the right solution.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 text-sm">
                <a href="mailto:info@metalyze.com" className="text-blue-600 hover:text-blue-800">
                  info@metalyze.com
                </a>
                <span className="hidden sm:inline text-blue-400">•</span>
                <a href="tel:+1-555-0123" className="text-blue-600 hover:text-blue-800">
                  +1 (555) 012-3456
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-lg shadow border p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Technical Details</h2>
          <div className="prose max-w-none">
            <p className="text-gray-600 leading-relaxed">
              {product.technical_details}
            </p>
          </div>

          {/* Compatibility */}
          {product.compatible_with && product.compatible_with.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compatible Products</h3>
              <div className="flex flex-wrap gap-2">
                {product.compatible_with.map((compatibleId) => (
                  <span
                    key={compatibleId}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {compatibleId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        <ProductRecommendations productId={product.id} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow border p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default ProductDetailClient;