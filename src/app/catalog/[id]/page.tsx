'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductDetailClient from '@/components/products/ProductDetailClient';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getSupabaseClient } from '@/lib/supabase';
import type { Product } from '@/lib/supabase';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset state when ID changes
  useEffect(() => {
    console.log('[Product Details] ID changed to:', id);
    setProduct(null);
    setRelatedProducts([]);
    setLoading(true);
    setError(null);
  }, [id]);

  useEffect(() => {
    const loadProduct = async () => {
      console.log('[Product Details] loadProduct called, id:', id);
      if (!id) {
        console.log('[Product Details] No ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('[Product Details] Fetching product from Supabase...');
        const supabase = getSupabaseClient();
        
        // Fetch the product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        console.log('[Product Details] Product fetch result:', { productData, productError });
        
        if (productError || !productData) {
          throw new Error('Product not found');
        }

        const typedProduct = productData as Product;
        setProduct(typedProduct);
        console.log('[Product Details] Product set successfully');

        // Get related products (same category, excluding current product)
        console.log('[Product Details] Fetching related products...');
        const { data: relatedData, error: relatedError } = await supabase
          .from('products')
          .select('*')
          .eq('category', typedProduct.category)
          .neq('id', typedProduct.id)
          .limit(4);
        
        console.log('[Product Details] Related products result:', { relatedData, relatedError });
        
        if (!relatedError && relatedData) {
          setRelatedProducts(relatedData as Product[]);
        }
      } catch (err) {
        console.error('[Product Details] Error loading product:', err);
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
      <Footer />
    </div>
  );
}
