/**
 * UC303: Display ranked recommendations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RecommendationService } from '@/services/recommendation.service';
import { productMatcher } from '@/lib/product-matcher';
import type { RecommendationScore } from '@/types';

const { mockGetCached, compatibleProducts } = vi.hoisted(() => {
  const compatibleProducts: RecommendationScore[] = [
    {
      productId: 'prod-2',
      score: 0.95,
      matchedSpecs: ['dimensions', 'material'],
      reasoning: 'Highly compatible: same dimensions and material',
    },
    {
      productId: 'prod-3',
      score: 0.8,
      matchedSpecs: ['dimensions'],
      reasoning: 'Compatible dimensions, different material',
    },
  ];

  const mockGetCached = vi.fn(
    async (_key: string, fetcher: () => Promise<RecommendationScore[]>) => fetcher(),
  );

  return { mockGetCached, compatibleProducts };
});

vi.mock('@/lib/cache/redis-cache', () => ({
  getCached: mockGetCached,
}));

vi.mock('@/lib/product-matcher', () => ({
  productMatcher: {
    getCompatibleProducts: vi.fn(async () => compatibleProducts),
  },
}));

describe('UC303: Display ranked recommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_REC_UC303_001: should preserve ranking order from product matcher', async () => {
    const productId = 'prod-1';

    const recommendations = await RecommendationService.getRecommendations(productId);

    const matcher = productMatcher as unknown as { getCompatibleProducts: ReturnType<typeof vi.fn> };
    expect(matcher.getCompatibleProducts).toHaveBeenCalledWith(productId);
    expect(recommendations[0].score).toBeGreaterThan(recommendations[1].score);
    expect(recommendations.map((r) => r.productId)).toEqual(['prod-2', 'prod-3']);
  });
});


