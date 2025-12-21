import type { DrawingAnalysis } from '@/types';
import productsData from '@/data/products.json';

const rawProducts = productsData.products as Array<Record<string, any>>;

const pickProducts = (ids: string[]) => {
  return ids
    .map((id) => rawProducts.find((product) => product.id === id))
    .filter(Boolean) as DrawingAnalysis['recommendedProducts'];
};

export type SampleCacheKey = 'iBeam' | 'drillGuide' | 'brakeRotor';

export const SAMPLE_ANALYSIS_CACHE: Record<SampleCacheKey, DrawingAnalysis> = {
  iBeam: {
    extractedSpecs: {
      productName: 'I-Beam Steel',
      dimensions: '12" length x 4" height x 2.66" flange width',
      material: 'Grade S355 structural steel',
      loadRequirements: '≥120 kN/m² service load',
      componentType: 'Structural I-beam',
      tolerance: '±0.5 mm rolled tolerance',
    },
    recommendedProducts: pickProducts([
      'steel-beam-001',
      'steel-plate-001',
      'connection-bracket-001',
      'hex-bolt-m12',
    ]),
    totalRecommendations: 6,
    confidence: 0.93,
    reasoning:
      'Cached AI analysis from the I-Beam STEP sample (May 2024 run). Geometry validated against S355 span tables and matched to compatible plates, brackets, and M12 hardware.',
    analysisId: 'sample_analysis_ibeam_v1',
    isSampleDrawing: true,
  },
  drillGuide: {
    extractedSpecs: {
      productName: 'Surgical Drill Guide',
      dimensions: '150 mm handle with twin Ø2 / Ø3.2 mm sleeves',
      material: 'Surgical stainless steel',
      componentType: 'Surgical drill guide',
      tolerance: 'Sleeve runout ±0.02 mm',
      loadRequirements: 'Manual guidance only',
    },
    recommendedProducts: pickProducts([
      'surgical-drill-guide-001',
      'custom-bracket-001',
      'mounting-bracket-001',
      'socket-head-m8',
    ]),
    totalRecommendations: 5,
    confidence: 0.9,
    reasoning:
      'Cached AI analysis from the Drill Guide STEP sample. Identified stainless tooling requirements plus compatible brackets and hardware for fixture integration.',
    analysisId: 'sample_analysis_drillguide_v1',
    isSampleDrawing: true,
  },
  brakeRotor: {
    extractedSpecs: {
      productName: 'Brake Rotor',
      dimensions: 'Ø320 mm x 32 mm vented rotor, 5 x 114.3 mm pattern',
      material: 'High-carbon cast iron',
      componentType: 'Automotive brake rotor',
      tolerance: 'Face runout ≤ 0.03 mm',
      loadRequirements: 'Clamp load up to 45 kN',
    },
    recommendedProducts: pickProducts([
      'brake-rotor-001',
      'hex-bolt-m12',
      'hex-nut-m12',
      'washer-m12',
    ]),
    totalRecommendations: 7,
    confidence: 0.95,
    reasoning:
      'Cached AI analysis for the Brake Rotor STEP sample. Matched to heat-treated rotors plus supporting Grade 8 hardware for hub assemblies.',
    analysisId: 'sample_analysis_brakerotor_v1',
    isSampleDrawing: true,
  },
};








