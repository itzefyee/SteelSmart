import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductRecommenderNew from '@/components/products/ProductRecommenderNew';
import PageHero from '@/components/layout/PageHero';
import BlueprintDiagramLayer from '@/components/cad/BlueprintDiagramLayer';

export const metadata = {
  title: 'Product Recommender - Metalyze AI Marketplace',
  description: 'Get AI-powered product recommendations based on your CAD drawings and component requirements.',
};

export default function ProductRecommenderPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 home-wavy-bg relative overflow-hidden">
        <BlueprintDiagramLayer className="text-blue-500/40" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-10">
            <PageHero
              align="left"
              eyebrow="AI Buyer Assistant"
              title="Product Recommender"
              theme="light"
              highlightPlacement="side"
              description="Upload specs, BOM fragments, or quick callouts. Metalyze benchmarks every requirement against live inventory to surface compatible parts, alternates, and bundle-ready suggestions."
              highlights={[
                { label: 'Catalog Coverage', value: '3.2K+ SKUs' },
                { label: 'Response Time', value: '<4 Seconds' },
                { label: 'Similarity Engine', value: 'Spec + Vector' },
                { label: 'Confidence Labels', value: 'Auto Ranked' },
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

