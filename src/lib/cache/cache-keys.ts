import crypto from 'crypto';

/**
 * Cache Key Generation Utilities
 * 
 * Provides consistent cache key generation for Redis caching across the application.
 * All functions generate deterministic keys based on input parameters to ensure
 * cache hits for identical requests.
 * 
 * Key Format Conventions:
 * - Products: products:{filters_hash}
 * - Product detail: product:{id}
 * - CAD analysis: cad:analysis:{content_hash}
 * - Recommendations: recommendations:{product_id}:{filters_hash}
 */

/**
 * Product filter interface matching the API route parameters
 */
export interface ProductFilters {
  ids?: string[];
  category?: string;
  material?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * CAD generation parameters interface
 */
export interface CADParameters {
  description: string;
  format?: string;
  units?: string;
  category?: string;
}

/**
 * Recommendation filter interface
 */
export interface RecommendationFilters {
  category?: string;
  material?: string;
  priceRange?: string;
  limit?: number;
}

/**
 * Generate a deterministic hash from an object
 * Uses SHA-256 to create a unique identifier for complex filter objects
 * 
 * @param obj - Object to hash
 * @returns Hex string hash (first 16 characters for brevity)
 * 
 * @example
 * const hash = hashObject({ category: 'steel', page: 1 });
 * // Returns: "a3f5b2c1d4e6f7g8"
 */
export function hashObject(obj: Record<string, any>): string {
  // Sort keys to ensure consistent ordering
  const sortedKeys = Object.keys(obj).sort();
  const normalized = sortedKeys.reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {} as Record<string, any>);
  
  const jsonString = JSON.stringify(normalized);
  const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
  
  // Return first 16 characters for brevity while maintaining uniqueness
  return hash.substring(0, 16);
}

/**
 * Generate cache key for product list queries
 * 
 * @param filters - Product filter parameters
 * @returns Cache key string in format "products:{filters}"
 * 
 * @example
 * const key = generateProductCacheKey({ category: 'steel', page: 1, limit: 20 });
 * // Returns: "products:category=steel&page=1&limit=20"
 * 
 * const keyWithHash = generateProductCacheKey({ 
 *   category: 'steel', 
 *   material: 'aluminum',
 *   search: 'bracket',
 *   page: 1 
 * });
 * // Returns: "products:hash:a3f5b2c1d4e6f7g8"
 */
export function generateProductCacheKey(filters: ProductFilters = {}): string {
  const filterParts: string[] = [];
  
  // Add each filter parameter if present
  if (filters.ids && filters.ids.length > 0) {
    filterParts.push(`ids=${filters.ids.join(',')}`);
  }
  if (filters.category) {
    filterParts.push(`category=${filters.category}`);
  }
  if (filters.material) {
    filterParts.push(`material=${filters.material}`);
  }
  if (filters.inStock !== undefined) {
    filterParts.push(`inStock=${filters.inStock}`);
  }
  if (filters.minPrice !== undefined) {
    filterParts.push(`minPrice=${filters.minPrice}`);
  }
  if (filters.maxPrice !== undefined) {
    filterParts.push(`maxPrice=${filters.maxPrice}`);
  }
  if (filters.search) {
    filterParts.push(`search=${filters.search}`);
  }
  if (filters.page !== undefined) {
    filterParts.push(`page=${filters.page}`);
  }
  if (filters.limit !== undefined) {
    filterParts.push(`limit=${filters.limit}`);
  }
  
  // If filter string is too long (>100 chars), use hash instead
  const filterString = filterParts.join('&');
  if (filterString.length > 100) {
    const hash = hashObject(filters);
    return `products:hash:${hash}`;
  }
  
  return `products:${filterString}`;
}

/**
 * Generate cache key for single product detail queries
 * 
 * @param productId - Product ID
 * @returns Cache key string in format "product:{id}"
 * 
 * @example
 * const key = generateProductDetailCacheKey('123');
 * // Returns: "product:123"
 */
export function generateProductDetailCacheKey(productId: string): string {
  return `product:${productId}`;
}

/**
 * Generate cache key for CAD generation requests
 * Uses content hash to ensure identical requests hit the same cache
 * 
 * @param params - CAD generation parameters
 * @returns Cache key string in format "cad:generation:{hash}"
 * 
 * @example
 * const key = generateCADCacheKey({
 *   description: 'Create a mounting bracket',
 *   format: 'step',
 *   units: 'mm'
 * });
 * // Returns: "cad:generation:a3f5b2c1d4e6f7g8"
 */
export function generateCADCacheKey(params: CADParameters): string {
  const hash = hashObject(params);
  return `cad:generation:${hash}`;
}

/**
 * Generate cache key for CAD analysis results
 * Uses file content hash to ensure identical files hit the same cache
 * 
 * @param fileHash - SHA-256 hash of file content
 * @returns Cache key string in format "cad:analysis:{hash}"
 * 
 * @example
 * const key = generateCADAnalysisCacheKey('a3f5b2c1d4e6f7g8...');
 * // Returns: "cad:analysis:a3f5b2c1d4e6f7g8..."
 */
export function generateCADAnalysisCacheKey(fileHash: string): string {
  return `cad:analysis:${fileHash}`;
}

/**
 * Generate cache key for product recommendations
 * 
 * @param productId - Product ID to get recommendations for
 * @param filters - Optional filters for recommendations
 * @returns Cache key string in format "recommendations:{product_id}" or "recommendations:{product_id}:{filters_hash}"
 * 
 * @example
 * const key = generateRecommendationCacheKey('123');
 * // Returns: "recommendations:123"
 * 
 * const keyWithFilters = generateRecommendationCacheKey('123', { 
 *   category: 'steel',
 *   limit: 5 
 * });
 * // Returns: "recommendations:123:a3f5b2c1d4e6f7g8"
 */
export function generateRecommendationCacheKey(
  productId: string,
  filters?: RecommendationFilters
): string {
  if (!filters || Object.keys(filters).length === 0) {
    return `recommendations:${productId}`;
  }
  
  const hash = hashObject(filters);
  return `recommendations:${productId}:${hash}`;
}

/**
 * Generate cache key for CAD history queries
 * 
 * @param userId - User ID (optional, for user-specific history)
 * @param page - Page number for pagination
 * @param limit - Items per page
 * @returns Cache key string in format "cad:history:{user_id}:{page}:{limit}"
 * 
 * @example
 * const key = generateCADHistoryCacheKey('user123', 1, 10);
 * // Returns: "cad:history:user123:1:10"
 * 
 * const globalKey = generateCADHistoryCacheKey(undefined, 1, 10);
 * // Returns: "cad:history:global:1:10"
 */
export function generateCADHistoryCacheKey(
  userId?: string,
  page: number = 1,
  limit: number = 10
): string {
  const userPart = userId || 'global';
  return `cad:history:${userPart}:${page}:${limit}`;
}

/**
 * Generate wildcard pattern for invalidating related cache keys
 * Note: This returns an array of potential keys since Redis doesn't support
 * wildcard deletion in Upstash. Use with invalidateCachePattern function.
 * 
 * @param prefix - Cache key prefix to match
 * @returns Array of cache key patterns
 * 
 * @example
 * // Invalidate all product caches
 * const patterns = generateCacheInvalidationPattern('products');
 * // Returns: ['products:*']
 * 
 * // Invalidate all caches for a specific product
 * const patterns = generateCacheInvalidationPattern('product:123');
 * // Returns: ['product:123', 'recommendations:123*']
 */
export function generateCacheInvalidationPattern(prefix: string): string[] {
  // For product updates, also invalidate related recommendations
  if (prefix.startsWith('product:')) {
    const productId = prefix.split(':')[1];
    return [
      prefix,
      `recommendations:${productId}`,
      `recommendations:${productId}:*`
    ];
  }
  
  // For other prefixes, just return the prefix pattern
  return [`${prefix}:*`];
}

/**
 * Parse cache key to extract components
 * Useful for debugging and logging
 * 
 * @param cacheKey - Cache key to parse
 * @returns Object with parsed components
 * 
 * @example
 * const parsed = parseCacheKey('products:category=steel&page=1');
 * // Returns: { type: 'products', filters: 'category=steel&page=1' }
 */
export function parseCacheKey(cacheKey: string): {
  type: string;
  identifier?: string;
  filters?: string;
} {
  const parts = cacheKey.split(':');
  
  if (parts.length === 1) {
    return { type: parts[0] };
  }
  
  if (parts.length === 2) {
    return {
      type: parts[0],
      identifier: parts[1]
    };
  }
  
  return {
    type: parts[0],
    identifier: parts[1],
    filters: parts.slice(2).join(':')
  };
}
