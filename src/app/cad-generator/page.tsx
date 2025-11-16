import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CADGenerator from '@/components/cad/CADGenerator';

export const metadata = {
  title: 'CAD Drawing Generator - SteelSmart AI Marketplace',
  description: 'Generate technical drawings from text descriptions or templates with AI-powered CAD generation.',
};

export default function CADGeneratorPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">CAD Drawing Generator</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Generate technical drawings from text descriptions or choose from our template library. 
              Create precise CAD drawings for your steel and metal components in seconds.
            </p>
          </div>
          
          <CADGenerator />
        </div>
      </main>
      <Footer />
    </div>
  );
}

