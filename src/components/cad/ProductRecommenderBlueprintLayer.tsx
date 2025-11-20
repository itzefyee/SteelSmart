'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const BlueprintModel3D = dynamic(() => import('@/components/cad/BlueprintModel3D'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />
});

const dropShadow = 'drop-shadow(0 0 28px rgba(0, 116, 230, 0.65))';

const ProductRecommenderBlueprintLayer: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none z-[1]">
    <div
      className="absolute top-[4%] left-[-4%] w-[320px] h-[320px]"
      style={{ opacity: 0.85, animation: 'blueprintFloat 10s ease-in-out infinite, blueprintPulse 7s ease-in-out infinite', filter: dropShadow }}
    >
      <BlueprintModel3D modelType="gear" />
    </div>
    <div
      className="absolute top-[6%] right-[-4%] w-[300px] h-[300px]"
      style={{ opacity: 0.83, animation: 'blueprintFloatAlt 11s ease-in-out infinite, blueprintPulse 8s ease-in-out infinite 1s', filter: dropShadow }}
    >
      <BlueprintModel3D modelType="shaft" />
    </div>
    <div
      className="absolute top-1/3 left-[-6%] w-[260px] h-[260px]"
      style={{ opacity: 0.84, animation: 'blueprintFloat 12s ease-in-out infinite, blueprintPulse 7s ease-in-out infinite 2s', filter: dropShadow }}
    >
      <BlueprintModel3D modelType="bracket" />
    </div>
    <div
      className="absolute top-[40%] right-[-6%] w-[260px] h-[260px]"
      style={{ opacity: 0.86, animation: 'blueprintFloatAlt 13s ease-in-out infinite, blueprintPulse 8s ease-in-out infinite 2.5s', filter: dropShadow }}
    >
      <BlueprintModel3D modelType="beam" />
    </div>
    <div
      className="absolute bottom-[12%] left-[-5%] w-[290px] h-[290px]"
      style={{ opacity: 0.88, animation: 'blueprintFloat 12s ease-in-out infinite, blueprintPulse 7s ease-in-out infinite 3s', filter: dropShadow }}
    >
      <BlueprintModel3D modelType="shaft" />
    </div>
    <div
      className="absolute bottom-[10%] right-[-5%] w-[310px] h-[310px]"
      style={{ opacity: 0.85, animation: 'blueprintFloatAlt 10s ease-in-out infinite, blueprintPulse 6s ease-in-out infinite 3.5s', filter: dropShadow }}
    >
      <BlueprintModel3D modelType="gear" />
    </div>
  </div>
);

export default ProductRecommenderBlueprintLayer;

