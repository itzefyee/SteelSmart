'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CADAnalyzer from '@/components/cad/CADAnalyzer';
import PageHero from '@/components/layout/PageHero';
import BlueprintDiagramLayer from '@/components/cad/BlueprintDiagramLayer';

export default function CADAnalyzerPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 home-wavy-bg relative overflow-hidden">
        <BlueprintDiagramLayer className="text-blue-500/40" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          <div className="mb-10">
            <PageHero
              eyebrow="Insight Engine"
              eyebrowPlacement="inline-after"
              title="CAD Drawing Analyzer"
              highlightPlacement="side"
              theme="light"
              description="Upload a drawing once to get normalized dimensions, tolerance checks, and ready-to-use catalog matches."
              highlights={[
                { label: 'Files Parsed', value: '12K+' },
                { label: 'Spec Match', value: '98%' },
                { label: 'Views', value: '3D + 2D' },
                { label: 'Formats', value: 'STEP • PDF' },
              ]}
            />
          </div>
          
          <CADAnalyzer />
        </div>
      </main>
      <Footer />
    </div>
  );
}