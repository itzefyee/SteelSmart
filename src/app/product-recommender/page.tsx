'use client';

import React, { lazy, Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PageHero from '@/components/layout/PageHero';
import ProductRecommenderBlueprintLayer from '@/components/cad/ProductRecommenderBlueprintLayer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const ProductRecommender = lazy(() => import('@/components/products/ProductRecommender'));

export default function ProductRecommenderPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 home-wavy-bg relative overflow-hidden">
        <ProductRecommenderBlueprintLayer />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
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
          
          <Suspense fallback={
            <div className="glass-container glass-container-with-liquid p-12 text-center">
              <LoadingSpinner />
              <p className="text-gray-600 mt-4">Loading Product Recommender...</p>
            </div>
          }>
            <ProductRecommender />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}

