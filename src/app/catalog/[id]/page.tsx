'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductDetailClient from '@/components/products/ProductDetailClient';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Product } from '@/lib/supabase';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      console.log('[Product Details] Loading product, id:', id);
      
      if (!id) {
        console.log('[Product Details] No ID provided');
        setLoading(false);
        return;
      }

      try {
        // Reset state
        setProduct(null);
        setRelatedProducts([]);
        setLoading(true);
        setError(null);
        
        console.log('[Product Details] Fetching product from API...');

        // Fetch main product via API route (server-side Supabase, cached)
        const productRes = await fetch(`/api/products/${encodeURIComponent(id)}`);

        if (!productRes.ok) {
          const body = await productRes.json().catch(() => ({}));
          throw new Error(body.error || `Failed to load product (${productRes.status})`);
        }

        const productJson = await productRes.json();
        const productData = productJson.product as Product | undefined;

        if (!productData) {
          throw new Error('Product not found');
        }

        setProduct(productData);

        // Fetch related products (same category) via list API, then filter out current product
        console.log('[Product Details] Fetching related products via API...');
        const params = new URLSearchParams({
          category: productData.category ?? '',
          limit: '8',
        });
        const relatedRes = await fetch(`/api/products?${params.toString()}`);

        if (relatedRes.ok) {
          const relatedJson = await relatedRes.json();
          const allRelated = (relatedJson.products || []) as Product[];
          const filtered = allRelated.filter((p) => p.id !== productData.id).slice(0, 4);
          console.log('[Product Details] Related products count:', filtered.length);
          setRelatedProducts(filtered);
        } else {
          console.warn('[Product Details] Related products API returned non-OK status:', relatedRes.status);
        }
      } catch (err) {
        console.error('[Product Details] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        console.log('[Product Details] Loading complete');
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

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
