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
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/catalog')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Catalog
            </button>
          </div>
        </div>
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
