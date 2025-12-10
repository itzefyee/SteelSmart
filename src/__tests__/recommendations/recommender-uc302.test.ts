/**
 * UC302: Recommend alternative products
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { productMatcher } from '@/lib/product-matcher';
import type { DrawingAnalysis } from '@/types';

vi.mock('@/lib/product-matcher', () => ({
  productMatcher: {
    getAlternativeSuggestions: vi.fn(),
  },
}));

const mockedMatcher = productMatcher as unknown as {
  getAlternativeSuggestions: Mock;
};

describe('UC302: Recommend alternative products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_REC_UC302_001: should return alternatives when catalog has no matches', async () => {
    const analysis: DrawingAnalysis = {
      extractedSpecs: {
        dimensions: '1000mm x 200mm x 10mm',
        material: 'S355',
        loadRequirements: 'Light duty',
        componentType: 'beam',
        tolerance: '±1mm',
      },
      recommendedProducts: [],
      totalRecommendations: 0,
      confidence: 0.8,
      reasoning: 'No direct catalog matches found',
      analysisId: 'analysis-1',
    };

    const altMock = mockedMatcher.getAlternativeSuggestions;
    altMock.mockResolvedValueOnce({
      alternatives: [
        {
          name: 'Alt Beam 1000x200',
          description: 'Comparable beam profile',
          category: 'beam',
          specifications: { dimensions: '1000x200', loadCapacity: 'Light' },
          source: 'external_catalog',
          confidence: 0.72,
          reasoning: 'Closest dimensional match from external catalog',
        },
      ],
      reasoning: 'No catalog match; suggested external equivalent',
      suggestedAction: 'external_supplier',
      estimatedCost: '$120',
      leadTime: '2 weeks',
    });

    const alternatives = await mockedMatcher.getAlternativeSuggestions(analysis);

    expect(mockedMatcher.getAlternativeSuggestions).toHaveBeenCalled();
    expect(alternatives?.alternatives).toHaveLength(1);
    expect(alternatives?.alternatives[0].name).toContain('Alt Beam');
  });
});


