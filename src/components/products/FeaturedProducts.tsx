'use client';

import React from 'react';
import Link from 'next/link';
import ProductCard from '@/components/products/ProductCard';
import { useProducts } from '@/hooks';

const FeaturedProducts: React.FC = () => {
  // Fetch first 4 products as featured products
  const { products, loading } = useProducts({
    limit: 4,
    autoFetch: true,
  });

  return (
    <section className="section bg-white">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our most popular components for robotics and structural applications
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="loading-card">
                <div className="h-48 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="loading-line-long"></div>
                  <div className="loading-line-short"></div>
                  <div className="loading-line w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <ProductCard product={product} showCompatibility={false} />
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/catalog">
            <button className="btn btn-outline btn-lg">
              View All Products
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;