'use client';

import React from 'react';
import Link from 'next/link';
import CADAnalyzer from '@/components/cad/CADAnalyzer';
import TechnicalPattern from '@/components/TechnicalPattern';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-primary via-blue-600 to-blue-700 text-white overflow-hidden">
      <TechnicalPattern />
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 items-start lg:items-center">
          {/* Left Column - Text Content */}
          <div className="lg:col-span-4 space-y-6 lg:-mt-44">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="text-gradient bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  AI-Powered
                </span>
                <br />
                Steel Parts Marketplace
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100 max-w-2xl">
                Upload your CAD drawings and get instant product recommendations powered by advanced AI analysis.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-blue-50 transition-colors text-lg"
              >
                Browse Catalog
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              <Link
                href="/rfq"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary transition-colors text-lg"
              >
                Request Quote
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold">500+</div>
                <div className="text-blue-200 text-sm">Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold">98%</div>
                <div className="text-blue-200 text-sm">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold">24h</div>
                <div className="text-blue-200 text-sm">Fast Quotes</div>
              </div>
            </div>
          </div>

          {/* Right Column - CAD Analyzer Widget */}
          <div className="lg:col-span-6 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <CADAnalyzer />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;