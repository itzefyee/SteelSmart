'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductDetailClient from '@/components/products/ProductDetailClient';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useProduct, useProducts } from '@/hooks';
import type { Product } from '@/lib/supabase';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  // Use React Query hooks for automatic caching and background updates
  const { data: product, isLoading: productLoading, error: productError } = useProduct(id);
  
  // Fetch related products using React Query (only when product is loaded)
  const { data: relatedProductsData } = useProducts({
    filters: product?.category ? { category: product.category } : {},
    limit: 8,
    enabled: !!product?.category
  });

  // Filter and limit related products
  const relatedProducts = useMemo(() => {
    if (!relatedProductsData?.products || !product) return [];
    return relatedProductsData.products
      .filter((p) => p.id !== product.id)
      .slice(0, 4);
  }, [relatedProductsData, product]);

  const loading = productLoading;
  const error = productError ? productError.message : null;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col catalog-shell">
        <Header />
        <main className="flex-1 relative">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20 text-slate-100">
            {/* Breadcrumb Skeleton */}
            <nav className="mb-8">
              <ol className="flex items-center space-x-2 text-sm text-blue-200">
                <li>
                  <span className="hover:text-white transition-colors">Home</span>
                </li>
                <li className="text-slate-400">/</li>
                <li>
                  <span className="hover:text-white transition-colors">Catalog</span>
                </li>
                <li className="text-slate-400">/</li>
                <li className="text-white font-medium">Loading...</li>
              </ol>
            </nav>

            {/* Loading Content with Same Design */}
            <div className="catalog-glass-container p-8 mb-12 bg-white/95 text-slate-900 shadow-[0_35px_120px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-slate-600">Loading product details...</p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col catalog-shell">
        <Header />
        <main className="flex-1 relative">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20 text-slate-100">
            {/* Breadcrumb */}
            <nav className="mb-8">
              <ol className="flex items-center space-x-2 text-sm text-blue-200">
                <li>
                  <span className="hover:text-white transition-colors">Home</span>
                </li>
                <li className="text-slate-400">/</li>
                <li>
                  <span className="hover:text-white transition-colors">Catalog</span>
                </li>
                <li className="text-slate-400">/</li>
                <li className="text-white font-medium">Product Not Found</li>
              </ol>
            </nav>

            {/* Error Content with Same Design */}
            <div className="catalog-glass-container p-8 mb-12 bg-white/95 text-slate-900 shadow-[0_35px_120px_rgba(15,23,42,0.45)]">
              <div className="text-center py-20">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">Product Not Found</h1>
                <p className="text-slate-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
                <button
                  onClick={() => router.push('/catalog')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Catalog
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col catalog-shell">
      <Header />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
      <Footer />
    </div>
  );
}
