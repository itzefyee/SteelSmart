import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductRecommenderNew from '@/components/products/ProductRecommenderNew';
import PageHero from '@/components/layout/PageHero';
import ProductRecommenderBlueprintLayer from '@/components/cad/ProductRecommenderBlueprintLayer';

export const metadata = {
  title: 'Product Recommender - Metalyze AI Marketplace',
  description: 'Get AI-powered product recommendations based on your CAD drawings and component requirements.',
};

export default function ProductRecommenderPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 home-wavy-bg relative overflow-hidden">
        <ProductRecommenderBlueprintLayer />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-10">
            <PageHero
              align="left"
              eyebrow="AI Buyer Assistant"
              eyebrowPlacement="inline-after"
              title="Product Recommender"
              theme="light"
              highlightPlacement="side"
              description="Drop in requirements and receive shortlists of stocked parts, alternates, and bundles with confidence tags."
              highlights={[
                { label: 'Catalog', value: '3.2K SKUs' },
                { label: 'Answer Time', value: '<4s' },
                { label: 'Ranking', value: 'Spec + Vector' },
                { label: 'Bundles', value: 'Auto Built' },
              ]}
            />
          </div>
          
          <ProductRecommenderNew />
        </div>
      </main>
      <Footer />
    </div>
  );
}

