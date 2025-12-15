/**
 * Recommendation API Client
 * 
 * Client-side API wrapper for product recommendation operations.
 * Used by React Query hooks to fetch catalog matches and AI alternatives.
 * 
 * Architecture:
 * Component → useRecommendations hook → RecommendationAPI → HTTP → Controller → Service → Repository
 * 
 * Cache Strategy:
 * - Catalog matches: 5 minutes (React Query)
 * - AI alternatives: 10 minutes (React Query) + 1 hour (Redis)
 * - Product recommendations: 10 minutes (React Query)
 */

import type { Product } from '@/types';

export interface ProductSpecs {
  material?: string;
  dimensions?: string;
  loadCapacity?: string;
  category?: string;
  componentType?: string;
}

export interface CatalogMatchResult {
  product: Product;
  matchScore: number;
  rawScore: number;
  reasoning: string;
  matchedSpecs: string[];
}

export interface AlternativeProduct {
  name: string;
  description: string;
  category: string;
  material?: string;
  specifications: {
    dimensions?: string;
    loadCapacity?: string;
    standards?: string[];
    partNumber?: string;
  };
  source: string;
  confidence: number;
  reasoning: string;
  supplierInfo?: {
    suggestedSuppliers: string[];
    estimatedPrice?: string;
    leadTime?: string;
  };
  standards?: Array<{
    code: string;
    name: string;
    section?: string;
  }>;
}

export interface CatalogMatchResponse {
  success: boolean;
  matches?: CatalogMatchResult[];
  error?: string;
}

export interface AlternativesResponse {
  success: boolean;
  alternatives?: AlternativeProduct[];
  error?: string;
}

export interface ProductRecommendationsResponse {
  success: boolean;
  data?: Product[];
  error?: string;
}

/**
 * Recommendation API Client
 * 
 * Provides methods for fetching product recommendations, catalog matches,
 * and AI-generated alternatives.
 */
export class RecommendationAPI {
  /**
   * Get catalog matches for given specifications
   * 
   * Searches the product catalog for items matching the provided specs.
   * Results are scored based on how well they match the requirements.
   * 
   * @param specs - Product specifications to match
   * @returns Array of catalog matches with scores
   * @throws Error if request fails
   * 
   * @example
   * ```typescript
   * const matches = await RecommendationAPI.getMatches({
   *   material: 'steel',
   *   dimensions: '200x100x10',
   *   category: 'structural'
   * });
   * ```
   */
  static async getMatches(specs: ProductSpecs): Promise<CatalogMatchResult[]> {
    const response = await fetch('/api/recommendations/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specs }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch catalog matches: ${response.statusText}`);
    }
    
    const result: CatalogMatchResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch catalog matches');
    }
    
    return result.matches || [];
  }
  
  /**
   * Get AI-generated alternative suggestions
   * 
   * Uses Gemini AI to generate alternative product suggestions when
   * catalog matches are insufficient. This is an expensive operation
   * and results are cached for 1 hour on the server.
   * 
   * @param specs - Product specifications
   * @returns Array of AI-generated alternatives
   * @throws Error if request fails
   * 
   * @example
   * ```typescript
   * const alternatives = await RecommendationAPI.getAlternatives({
   *   material: 'aluminum',
   *   dimensions: '150x75x8',
   *   loadCapacity: '500kg'
   * });
   * ```
   */
  static async getAlternatives(specs: ProductSpecs): Promise<AlternativeProduct[]> {
    const response = await fetch('/api/recommendations/alternatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specifications: specs }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get alternative suggestions: ${response.statusText}`);
    }
    
    const result: AlternativesResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get alternative suggestions');
    }
    
    return result.alternatives || [];
  }
  
  /**
   * Get product recommendations for a specific product
   * 
   * Fetches "You may also like" recommendations based on a product ID.
   * Uses compatibility analysis and user behavior patterns.
   * 
   * @param productId - Product ID to get recommendations for
   * @param maxRecommendations - Maximum number of recommendations (default: 4)
   * @returns Array of recommended products
   * @throws Error if request fails
   * 
   * @example
   * ```typescript
   * const recommendations = await RecommendationAPI.getProductRecommendations('123', 4);
   * ```
   */
  static async getProductRecommendations(
    productId: string,
    maxRecommendations: number = 4
  ): Promise<Product[]> {
    const response = await fetch(
      `/api/recommendations?productId=${productId}&limit=${maxRecommendations}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
    }
    
    const result: ProductRecommendationsResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch recommendations');
    }
    
    return result.data || [];
  }
}
