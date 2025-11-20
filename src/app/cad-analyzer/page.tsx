'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CADAnalyzerFull from '@/components/cad/CADAnalyzerFull';
import PageHero from '@/components/layout/PageHero';
import BlueprintDiagramLayer from '@/components/cad/BlueprintDiagramLayer';

export default function CADAnalyzerPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 home-wavy-bg relative overflow-hidden">
        <BlueprintDiagramLayer className="text-blue-500/40" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-10">
            <PageHero
              eyebrow="Insight Engine"
              title="CAD Drawing Analyzer"
              highlightPlacement="side"
              theme="light"
              description="Drop in multi-view drawings or PDFs and let AI extract dimensions, tolerances, and materials automatically. Instantly map the findings to catalog parts or RFQ packages."
              highlights={[
                { label: 'Drawings Parsed', value: '12K+ Files' },
                { label: 'Spec Accuracy', value: '99.1% Match' },
                { label: 'AI Suggestions', value: 'Ranked Results' },
                { label: 'Formats', value: 'DWG • PDF' },
              ]}
            />
          </div>
          
          <CADAnalyzerFull />
        </div>
      </main>
      <Footer />
    </div>
  );
}