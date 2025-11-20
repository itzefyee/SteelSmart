/**
 * React Query Performance Monitoring
 * 
 * Provides utilities for tracking and logging React Query performance metrics
 * including query timing, cache behavior, and mutation performance.
 * 
 * Requirements: 7.4, 7.5
 */

/**
 * Query Performance Metrics Interface
 */
export interface QueryMetrics {
  queryKey: string;
  duration: number;
  status: 'success' | 'error' | 'loading';
  cacheStatus: 'hit' | 'miss' | 'stale';
  timestamp: Date;
}

/**
 * Aggregated Query Performance Statistics
 */
export interface QueryPerformanceStats {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  avgQueryTime: number;
  cacheHitRate: number;
  slowestQueries: QueryMetrics[];
  lastReset: Date;
}

// In-memory storage for query metrics
let queryMetrics: QueryMetrics[] = [];
let performanceStats: QueryPerformanceStats = {
  totalQueries: 0,
  successfulQueries: 0,
  failedQueries: 0,
  avgQueryTime: 0,
  cacheHitRate: 0,
  slowestQueries: [],
  lastReset: new Date(),
};

/**
 * Log a query execution with timing information
 * 
 * @param queryKey - The React Query key
 * @param duration - Query duration in milliseconds
 * @param status - Query status (success/error/loading)
 * @param cacheStatus - Whether data came from cache
 * 
 * @example
 * const startTime = performance.now();
 * const result = await queryFn();
 * logQueryPerformance(['products', filters], performance.now() - startTime, 'success', 'miss');
 */
export function logQueryPerformance(
  queryKey: unknown[],
  duration: number,
  status: 'success' | 'error' | 'loading',
  cacheStatus: 'hit' | 'miss' | 'stale' = 'miss'
): void {
  const keyString = JSON.stringify(queryKey);
  
  const metric: QueryMetrics = {
    queryKey: keyString,
    duration,
    status,
    cacheStatus,
    timestamp: new Date(),
  };

  // Add to metrics array
  queryMetrics.push(metric);

  // Keep only last 100 metrics to prevent memory growth
  if (queryMetrics.length > 100) {
    queryMetrics.shift();
  }

  // Update aggregated stats
  updateQueryStats();

  // Log to console with color coding
  const statusIcon = status === 'success' ? '✓' : status === 'error' ? '✗' : '⏳';
  const cacheIcon = cacheStatus === 'hit' ? '🎯' : cacheStatus === 'stale' ? '⚠️' : '❌';
  
  console.log(
    `${statusIcon} Query ${keyString} - ${duration.toFixed(2)}ms ${cacheIcon} ${cacheStatus}`
  );

  // Warn about slow queries (>1000ms)
  if (duration > 1000) {
    console.warn(`⚠️ Slow query detected: ${keyString} took ${duration.toFixed(2)}ms`);
  }
}

/**
 * Update aggregated query statistics
 */
function updateQueryStats(): void {
  performanceStats.totalQueries = queryMetrics.length;
  
  performanceStats.successfulQueries = queryMetrics.filter(
    m => m.status === 'success'
  ).length;
  
  performanceStats.failedQueries = queryMetrics.filter(
    m => m.status === 'error'
  ).length;

  // Calculate average query time
  const totalTime = queryMetrics.reduce((sum, m) => sum + m.duration, 0);
  performanceStats.avgQueryTime = queryMetrics.length > 0 
    ? totalTime / queryMetrics.length 
    : 0;

  // Calculate cache hit rate
  const cacheHits = queryMetrics.filter(m => m.cacheStatus === 'hit').length;
  performanceStats.cacheHitRate = queryMetrics.length > 0 
    ? (cacheHits / queryMetrics.length) * 100 
    : 0;

  // Track slowest queries (top 5)
  performanceStats.slowestQueries = [...queryMetrics]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5);
}

/**
 * Get current query performance statistics
 * 
 * @returns Current performance statistics
 * 
 * @example
 * const stats = getQueryPerformanceStats();
 * console.log(`Average query time: ${stats.avgQueryTime.toFixed(2)}ms`);
 * console.log(`Cache hit rate: ${stats.cacheHitRate.toFixed(2)}%`);
 */
export function getQueryPerformanceStats(): QueryPerformanceStats {
  return { ...performanceStats };
}

/**
 * Reset query performance metrics
 * 
 * @example
 * resetQueryMetrics();
 */
export function resetQueryMetrics(): void {
  queryMetrics = [];
  performanceStats = {
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    avgQueryTime: 0,
    cacheHitRate: 0,
    slowestQueries: [],
    lastReset: new Date(),
  };
  console.log('Query performance metrics reset');
}

/**
 * Log current query performance statistics to console
 * 
 * @example
 * logQueryPerformanceStats();
 */
export function logQueryPerformanceStats(): void {
  const stats = getQueryPerformanceStats();
  
  console.log('\n=== React Query Performance Stats ===');
  console.log(`Total Queries: ${stats.totalQueries}`);
  console.log(`Successful: ${stats.successfulQueries}`);
  console.log(`Failed: ${stats.failedQueries}`);
  console.log(`Avg Query Time: ${stats.avgQueryTime.toFixed(2)}ms`);
  console.log(`Cache Hit Rate: ${stats.cacheHitRate.toFixed(2)}%`);
  
  if (stats.slowestQueries.length > 0) {
    console.log('\nSlowest Queries:');
    stats.slowestQueries.forEach((query, index) => {
      console.log(`  ${index + 1}. ${query.queryKey} - ${query.duration.toFixed(2)}ms`);
    });
  }
  
  console.log(`Last Reset: ${stats.lastReset.toISOString()}`);
  console.log('====================================\n');
}

/**
 * Create a performance-monitored query function wrapper
 * 
 * @param queryKey - The React Query key
 * @param queryFn - The original query function
 * @returns Wrapped query function with performance monitoring
 * 
 * @example
 * const monitoredFn = withQueryPerformance(
 *   ['products', filters],
 *   () => ProductService.getProducts(filters)
 * );
 */
export function withQueryPerformance<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>
): () => Promise<T> {
  return async () => {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;
      logQueryPerformance(queryKey, duration, 'success', 'miss');
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logQueryPerformance(queryKey, duration, 'error', 'miss');
      throw error;
    }
  };
}
