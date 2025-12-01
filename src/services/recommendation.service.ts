import { RecommendationScore } from '@/types';
import { productMatcher } from '@/lib/product-matcher';
import { getCached } from '@/lib/cache/redis-cache';

/**
 * RecommendationService handles business logic for product recommendations
 * Orchestrates: validation, caching, and product matching
 */
export class RecommendationService {
  private static readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Get compatible product recommendations
   * 
   * @param productId - Product ID to get recommendations for
   * @returns List of recommended products with scores
   */
  static async getRecommendations(productId: string): Promise<RecommendationScore[]> {
    // Business logic: Validate input
    this.validateProductId(productId);

    // Business logic: Generate cache key
    const cacheKey = `recommendations:${productId}`;

    // Business logic: Fetch with caching
    const recommendations = await getCached<RecommendationScore[]>(
      cacheKey,
      async () => {
        console.log(`Computing recommendations for product: ${productId}`);
        return productMatcher.getCompatibleProducts(productId);
      },
      this.CACHE_TTL
    );

    return recommendations;
  }

  /**
   * Business logic: Validate product ID
   */
  private static validateProductId(productId: string): void {
    if (!productId || typeof productId !== 'string') {
      throw new Error('Product ID is required');
    }

    if (productId.trim().length === 0) {
      throw new Error('Product ID cannot be empty');
    }
  }
}
