import { Redis } from '@upstash/redis';

/**
 * Redis Cache Utility Layer
 * 
 * Provides server-side caching with Upstash Redis to reduce database load
 * and improve API response times. All functions include graceful error handling
 * to ensure cache failures don't break the application.
 * 
 * TTL Strategy:
 * - Product lists: 300s (5 minutes)
 * - Product details: 600s (10 minutes)
 * - CAD analysis: 86400s (24 hours)
 * - Recommendations: 3600s (1 hour)
 */

// Initialize Redis client with environment variables
let redis: Redis | null = null;

/**
 * Performance Metrics Interface
 * Tracks cache performance statistics for monitoring and optimization
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  totalRequests: number;
  hitRate: number;
  avgResponseTime: number;
  lastReset: Date;
}

/**
 * In-memory performance metrics
 * Tracks cache hit/miss rates and response times
 */
let performanceMetrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  errors: 0,
  totalRequests: 0,
  hitRate: 0,
  avgResponseTime: 0,
  lastReset: new Date(),
};

// Track response times for averaging
let responseTimes: number[] = [];

/**
 * Get or initialize Redis client
 * Returns null if Redis credentials are not configured
 */
function getRedisClient(): Redis | null {
  if (redis) {
    return redis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('Redis credentials not configured. Caching will be disabled.');
    return null;
  }

  try {
    redis = new Redis({
      url,
      token,
    });
    return redis;
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    return null;
  }
}

/**
 * Get data from cache or fetch if not available
 * Includes performance monitoring with timing and hit/miss tracking
 * 
 * @param key - Unique cache key
 * @param fetcher - Function to fetch data if cache miss occurs
 * @param ttl - Time to live in seconds (default: 300)
 * @returns Cached or freshly fetched data
 * 
 * @example
 * const products = await getCached(
 *   'products:category=steel',
 *   () => fetchProductsFromDB(),
 *   300
 * );
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const startTime = performance.now();
  const client = getRedisClient();

  // If Redis is not available, fetch directly
  if (!client) {
    const data = await fetcher();
    const duration = performance.now() - startTime;
    logPerformance('cache-disabled', key, duration);
    return data;
  }

  performanceMetrics.totalRequests++;

  try {
    // Try to get from cache
    const cached = await client.get<T>(key);
    const duration = performance.now() - startTime;
    
    if (cached !== null) {
      performanceMetrics.hits++;
      updateMetrics(duration);
      console.log(`✓ Cache hit: ${key} (${duration.toFixed(2)}ms)`);
      return cached;
    }

    performanceMetrics.misses++;
    console.log(`✗ Cache miss: ${key}`);
  } catch (error) {
    performanceMetrics.errors++;
    const duration = performance.now() - startTime;
    updateMetrics(duration);
    console.error(`⚠ Cache read error for key "${key}":`, error);
    // Fall through to fetcher
  }

  // Cache miss or error - fetch fresh data
  try {
    const fetchStartTime = performance.now();
    const data = await fetcher();
    const fetchDuration = performance.now() - fetchStartTime;
    const totalDuration = performance.now() - startTime;

    // Try to cache the result
    try {
      await client.setex(key, ttl, JSON.stringify(data));
      console.log(`✓ Cached data for key "${key}" with TTL ${ttl}s (fetch: ${fetchDuration.toFixed(2)}ms, total: ${totalDuration.toFixed(2)}ms)`);
    } catch (cacheError) {
      console.error(`⚠ Cache write error for key "${key}":`, cacheError);
      // Continue - data is still returned to caller
    }

    updateMetrics(totalDuration);
    return data;
  } catch (fetchError) {
    const duration = performance.now() - startTime;
    updateMetrics(duration);
    // Re-throw fetch errors - these should be handled by the caller
    throw fetchError;
  }
}

/**
 * Manually set data in cache
 * 
 * @param key - Unique cache key
 * @param data - Data to cache
 * @param ttl - Time to live in seconds (default: 300)
 * 
 * @example
 * await setCached('product:123', productData, 600);
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttl: number = 300
): Promise<void> {
  const client = getRedisClient();

  if (!client) {
    return;
  }

  try {
    await client.setex(key, ttl, JSON.stringify(data));
    console.log(`Cached data for key "${key}" with TTL ${ttl}s`);
  } catch (error) {
    console.error(`Cache write error for key "${key}":`, error);
    // Graceful failure - don't throw
  }
}

/**
 * Delete data from cache
 * 
 * @param key - Cache key to delete
 * 
 * @example
 * await deleteCached('product:123');
 */
export async function deleteCached(key: string): Promise<void> {
  const client = getRedisClient();

  if (!client) {
    return;
  }

  try {
    await client.del(key);
    console.log(`Deleted cache key: ${key}`);
  } catch (error) {
    console.error(`Cache delete error for key "${key}":`, error);
    // Graceful failure - don't throw
  }
}

/**
 * Invalidate multiple cache keys matching a pattern
 * 
 * @param keys - Array of cache keys to invalidate
 * 
 * @example
 * // Invalidate all product-related caches
 * await invalidateCachePattern([
 *   'products:category=steel',
 *   'products:category=aluminum',
 *   'product:123'
 * ]);
 */
export async function invalidateCachePattern(keys: string[]): Promise<void> {
  const client = getRedisClient();

  if (!client) {
    return;
  }

  if (keys.length === 0) {
    return;
  }

  try {
    // Delete all keys in parallel
    await Promise.all(keys.map(key => client.del(key)));
    console.log(`Invalidated ${keys.length} cache keys`);
  } catch (error) {
    console.error('Cache pattern invalidation error:', error);
    // Graceful failure - don't throw
  }
}

/**
 * Clear all cache entries (use with caution)
 * This is useful for development/testing but should be used sparingly in production
 * 
 * @example
 * await clearAllCache();
 */
export async function clearAllCache(): Promise<void> {
  const client = getRedisClient();

  if (!client) {
    return;
  }

  try {
    await client.flushdb();
    console.log('Cleared all cache entries');
  } catch (error) {
    console.error('Cache clear error:', error);
    // Graceful failure - don't throw
  }
}

/**
 * Update performance metrics with response time
 * 
 * @param duration - Response time in milliseconds
 */
function updateMetrics(duration: number): void {
  responseTimes.push(duration);
  
  // Keep only last 100 response times to prevent memory growth
  if (responseTimes.length > 100) {
    responseTimes.shift();
  }

  // Calculate average response time
  const sum = responseTimes.reduce((acc, time) => acc + time, 0);
  performanceMetrics.avgResponseTime = sum / responseTimes.length;

  // Calculate hit rate
  const totalCacheRequests = performanceMetrics.hits + performanceMetrics.misses;
  performanceMetrics.hitRate = totalCacheRequests > 0 
    ? (performanceMetrics.hits / totalCacheRequests) * 100 
    : 0;
}

/**
 * Log performance information for monitoring
 * 
 * @param type - Type of operation
 * @param key - Cache key
 * @param duration - Duration in milliseconds
 */
function logPerformance(type: string, key: string, duration: number): void {
  console.log(`[Performance] ${type}: ${key} - ${duration.toFixed(2)}ms`);
}

/**
 * Get current cache performance metrics
 * 
 * @returns Current performance metrics
 * 
 * @example
 * const metrics = getCacheMetrics();
 * console.log(`Cache hit rate: ${metrics.hitRate.toFixed(2)}%`);
 * console.log(`Average response time: ${metrics.avgResponseTime.toFixed(2)}ms`);
 */
export function getCacheMetrics(): CacheMetrics {
  return { ...performanceMetrics };
}

/**
 * Reset performance metrics
 * Useful for testing or periodic metric collection
 * 
 * @example
 * resetCacheMetrics();
 */
export function resetCacheMetrics(): void {
  performanceMetrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    totalRequests: 0,
    hitRate: 0,
    avgResponseTime: 0,
    lastReset: new Date(),
  };
  responseTimes = [];
  console.log('Cache metrics reset');
}

/**
 * Log current cache performance metrics to console
 * Useful for debugging and monitoring
 * 
 * @example
 * logCacheMetrics();
 */
export function logCacheMetrics(): void {
  const metrics = getCacheMetrics();
  console.log('\n=== Cache Performance Metrics ===');
  console.log(`Total Requests: ${metrics.totalRequests}`);
  console.log(`Cache Hits: ${metrics.hits}`);
  console.log(`Cache Misses: ${metrics.misses}`);
  console.log(`Cache Errors: ${metrics.errors}`);
  console.log(`Hit Rate: ${metrics.hitRate.toFixed(2)}%`);
  console.log(`Avg Response Time: ${metrics.avgResponseTime.toFixed(2)}ms`);
  console.log(`Last Reset: ${metrics.lastReset.toISOString()}`);
  console.log('================================\n');
}
