/**
 * UC301: Match similar components
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

describe('UC301: Match similar components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_REC_UC301_001: should return compatible products for a valid product ID', async () => {
    const productId = 'prod-1';

    const recommendations = await RecommendationService.getRecommendations(productId);

    expect(mockGetCached).toHaveBeenCalled();
    const matcher = productMatcher as unknown as { getCompatibleProducts: ReturnType<typeof vi.fn> };
    expect(matcher.getCompatibleProducts).toHaveBeenCalledWith(productId);
    expect(recommendations).toHaveLength(2);
    expect(recommendations[0].productId).toBe('prod-2');
    expect(recommendations[1].productId).toBe('prod-3');
  });

  it('TC_REC_UC301_002: should throw when product ID is missing or empty', async () => {
    await expect(RecommendationService.getRecommendations('' as any)).rejects.toThrow(
      'Product ID is required',
    );

    await expect(RecommendationService.getRecommendations(undefined as any)).rejects.toThrow(
      'Product ID is required',
    );
  });
});


