import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductRecommender from '@/components/products/ProductRecommender';

export const metadata = {
  title: 'Product Recommender - SteelSmart AI Marketplace',
  description: 'Get AI-powered product recommendations based on your CAD drawings and component requirements.',
};

export default function ProductRecommenderPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Recommender</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find the perfect components for your project with AI-powered recommendations. 
              Match similar products, discover alternatives, and get ranked suggestions based on your requirements.
            </p>
          </div>
          
          <ProductRecommender />
        </div>
      </main>
      <Footer />
    </div>
  );
}

