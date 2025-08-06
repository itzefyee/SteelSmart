import React from 'react';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductDetailClient from '@/components/ProductDetailClient';
import { Product } from '@/types';

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  // Load product data server-side
  try {
    const response = await import('@/data/products.json');
    const products = response.products as Product[];
    const product = products.find((p: Product) => p.id === id);
    
    if (!product) {
      notFound();
    }

    // Get related products (same category, excluding current product)  
    const relatedProducts = products
      .filter((p: Product) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <ProductDetailClient product={product} relatedProducts={relatedProducts} />
        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Error loading product:', error);
    notFound();
  }
}