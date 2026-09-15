'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CADGenerator from '@/components/cad/CADGenerator';
import PageHero from '@/components/layout/PageHero';
const BlueprintModel3D = dynamic(() => import('@/components/cad/BlueprintModel3D'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

const GENERATOR_BLUEPRINTS: Array<{
  className: string;
  modelType: 'gear' | 'shaft' | 'bracket' | 'beam';
  opacity: number;
  animation: string;
}> = [
  { className: 'top-[6%] left-[-6%] w-[360px] h-[360px]', modelType: 'gear', opacity: 0.95, animation: 'blueprintFloat 8s ease-in-out infinite, blueprintPulse 6s ease-in-out infinite' },
  { className: 'top-[10%] left-[-1%] w-[300px] h-[300px]', modelType: 'shaft', opacity: 0.9, animation: 'blueprintFloatAlt 11s ease-in-out infinite, blueprintPulse 8s ease-in-out infinite 1s' },
  { className: 'top-[4%] right-[-10%] w-[330px] h-[330px]', modelType: 'bracket', opacity: 0.94, animation: 'blueprintFloat 9s ease-in-out infinite, blueprintPulse 7s ease-in-out infinite 2s' },
  { className: 'top-[9%] right-[-4%] w-[315px] h-[315px]', modelType: 'gear', opacity: 0.9, animation: 'blueprintFloatAlt 10s ease-in-out infinite, blueprintPulse 9s ease-in-out infinite 1.5s' },
  { className: 'top-[13%] right-[-12%] w-[360px] h-[360px]', modelType: 'beam', opacity: 0.97, animation: 'blueprintFloat 12s ease-in-out infinite, blueprintPulse 7s ease-in-out infinite 3s' },
  { className: 'top-[32%] left-[-5%] w-[320px] h-[320px]', modelType: 'bracket', opacity: 0.92, animation: 'blueprintFloatAlt 13s ease-in-out infinite, blueprintPulse 8s ease-in-out infinite 2.5s' },
  { className: 'top-[38%] left-[-9%] w-[260px] h-[260px]', modelType: 'shaft', opacity: 0.9, animation: 'blueprintFloat 10s ease-in-out infinite, blueprintPulse 9s ease-in-out infinite 1s' },
  { className: 'top-[37%] right-[-8%] w-[270px] h-[270px]', modelType: 'gear', opacity: 0.9, animation: 'blueprintFloatAlt 11s ease-in-out infinite, blueprintPulse 7s ease-in-out infinite 3.5s' },
  { className: 'top-[43%] right-[-4%] w-[310px] h-[310px]', modelType: 'bracket', opacity: 0.94, animation: 'blueprintFloat 9s ease-in-out infinite, blueprintPulse 8s ease-in-out infinite 2s' },
  { className: 'bottom-[17%] left-[-7%] w-[360px] h-[360px]', modelType: 'beam', opacity: 0.98, animation: 'blueprintFloat 12s ease-in-out infinite, blueprintPulse 8s ease-in-out infinite 4s' },
  { className: 'bottom-[21%] left-[-1%] w-[280px] h-[280px]', modelType: 'gear', opacity: 0.92, animation: 'blueprintFloatAlt 10s ease-in-out infinite, blueprintPulse 9s ease-in-out infinite 2.5s' },
  { className: 'bottom-[14%] right-[-9%] w-[260px] h-[260px]', modelType: 'shaft', opacity: 0.9, animation: 'blueprintFloat 11s ease-in-out infinite, blueprintPulse 7s ease-in-out infinite 3s' },
  { className: 'bottom-[19%] right-[-4%] w-[310px] h-[310px]', modelType: 'bracket', opacity: 0.94, animation: 'blueprintFloatAlt 13s ease-in-out infinite, blueprintPulse 8s ease-in-out infinite 1.5s' },
  { className: 'bottom-[11%] right-[-12%] w-[335px] h-[335px]', modelType: 'shaft', opacity: 0.96, animation: 'blueprintFloat 9s ease-in-out infinite, blueprintPulse 7s ease-in-out infinite 4s' },
];

export default function CADGeneratorPage() {
  const blueprintShadow = 'drop-shadow(0 0 28px rgba(0, 116, 230, 0.85))';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 home-wavy-bg relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-[1]">
          {GENERATOR_BLUEPRINTS.map(({ className, modelType, opacity, animation }, index) => (
            <div
              key={`${modelType}-${index}`}
              className={`absolute ${className}`}
              style={{ opacity, animation, filter: blueprintShadow }}
            >
              <BlueprintModel3D modelType={modelType} />
            </div>
          ))}
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
          <div className="mb-10">
            <PageHero
              eyebrow="Blueprint Studio"
              eyebrowPlacement="inline-after"
              title="CAD Drawing Generator"
              highlightPlacement="side"
              theme="light"
              description="Turn a short prompt or preset into production-ready STEP files without leaving the page."
              highlights={[
                { label: 'Templates', value: '4 Ready' },
                { label: 'Avg Render', value: '~6s' },
                { label: 'Formats', value: 'STEP' },
                { label: 'Edits', value: 'Live Parametric' },
              ]}
            />
          </div>
          
          <Suspense fallback={<div className="text-sm text-muted-foreground">Loading CAD generator...</div>}>
            <CADGenerator />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
