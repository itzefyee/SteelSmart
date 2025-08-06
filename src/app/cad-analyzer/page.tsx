import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CADAnalyzerFull from '@/components/CADAnalyzerFull';

export const metadata = {
  title: 'CAD Drawing Analyzer - SteelSmart AI Marketplace',
  description: 'Upload your technical drawings and get AI-powered product recommendations with detailed analysis.',
};

export default function CADAnalyzerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              CAD Drawing Analyzer
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Upload your technical drawings and get AI-powered product recommendations. 
              Our advanced analysis extracts specifications and matches them with our comprehensive catalog.
            </p>
          </div>
          
          <CADAnalyzerFull />
        </div>
      </main>
      <Footer />
    </div>
  );
}