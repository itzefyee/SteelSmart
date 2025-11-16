import React from 'react';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductDetailClient from '@/components/products/ProductDetailClient';
import { getSupabaseServer } from '@/lib/supabase-server';
import type { Product } from '@/lib/supabase';

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  
  // Load product data from Supabase
  try {
    const supabase = await getSupabaseServer();
    
    // Fetch the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (productError || !product) {
      console.error('Error loading product:', productError);
      notFound();
    }

    // Get related products (same category, excluding current product)
    const { data: relatedProducts, error: relatedError } = await supabase
      .from('products')
      .select('*')
      .eq('category', product.category)
      .neq('id', product.id)
      .limit(4);
    
    if (relatedError) {
      console.error('Error loading related products:', relatedError);
    }

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <ProductDetailClient product={product} relatedProducts={relatedProducts || []} />
        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Error loading product:', error);
    notFound();
  }
}