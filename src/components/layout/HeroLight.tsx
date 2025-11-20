'use client';

import React from 'react';
import Link from 'next/link';
import AnimatedTextPrompt from '@/components/hero/AnimatedTextPrompt';
import RotatingModel3D from '@/components/hero/RotatingModel3D';

const HeroLight: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-white via-gray-50 to-blue-50 overflow-hidden min-h-[calc(100vh-4rem)] pt-20">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 102, 204, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 102, 204, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Decorative Gradient Blobs */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-cyan-100/40 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-purple-100/30 to-transparent blur-3xl pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column - Animated Text Prompt */}
          <div className="space-y-8 lg:pr-8">
            <AnimatedTextPrompt className="space-y-6" />
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/cad-generator"
                className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary via-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-1 transition-all duration-300 text-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Designing
                <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              
              <Link
                href="/cad-analyzer"
                className="group inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-semibold rounded-xl border-2 border-primary hover:bg-blue-50 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300 text-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Demo
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
              <div className="text-center group cursor-default">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  500+
                </div>
                <div className="text-gray-600 text-sm mt-2 font-medium">Models Generated</div>
              </div>
              <div className="text-center group cursor-default">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  98%
                </div>
                <div className="text-gray-600 text-sm mt-2 font-medium">AI Accuracy</div>
              </div>
              <div className="text-center group cursor-default">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-primary bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  24h
                </div>
                <div className="text-gray-600 text-sm mt-2 font-medium">Fast Quotes</div>
              </div>
            </div>
          </div>

          {/* Right Column - 3D Model Preview */}
          <div className="relative lg:pl-8">
            <RotatingModel3D />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroLight;





