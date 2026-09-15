# Performance Monitoring Guide

This document describes the performance monitoring system implemented for the SteelSmart application's state management and caching architecture.

## Overview

The performance monitoring system tracks and logs metrics for both Redis cache operations and React Query performance, providing insights into:

- Cache hit/miss rates
- Response times
- Query performance
- Optimization opportunities

## Components

### 1. Redis Cache Performance Monitoring

**Location**: `src/lib/cache/redis-cache.ts`

#### Features

- **Cache Hit/Miss Tracking**: Automatically tracks every cache operation
- **Response Time Logging**: Measures and logs operation duration
- **Error Tracking**: Monitors cache operation failures
- **Hit Rate Calculation**: Computes cache effectiveness percentage
- **Average Response Time**: Tracks performance trends

#### Metrics Tracked

```typescript
interface CacheMetrics {
  hits: number;              // Number of cache hits
  misses: number;            // Number of cache misses
  errors: number;            // Number of cache errors
  totalRequests: number;     // Total cache requests
  hitRate: number;           // Hit rate percentage
  avgResponseTime: number;   // Average response time in ms
  lastReset: Date;          // When metrics were last reset
}
```

#### Usage

```typescript
import { getCacheMetrics, logCacheMetrics, resetCacheMetrics } from '@/lib/cache/redis-cache';

// Get current metrics
const metrics = getCacheMetrics();
console.log(`Cache hit rate: ${metrics.hitRate.toFixed(2)}%`);

// Log metrics to console
logCacheMetrics();

// Reset metrics (useful for testing)
resetCacheMetrics();
```

#### Console Output

Cache operations are logged with visual indicators:

- `✓` - Successful operation
- `✗` - Cache miss
- `⚠` - Error or warning

Example:
```
✓ Cache hit: products:category=steel (12.45ms)
✗ Cache miss: products:category=aluminum
✓ Cached data for key "products:category=aluminum" with TTL 300s (fetch: 145.23ms, total: 156.78ms)
```

### 2. React Query Performance Monitoring

**Location**: `src/lib/performance/query-performance.ts`

#### Features

- **Query Timing**: Measures execution time for all queries
- **Cache Status Tracking**: Identifies cache hits vs misses
- **Success/Error Tracking**: Monitors query outcomes
- **Slow Query Detection**: Warns about queries >1000ms
- **Aggregated Statistics**: Provides overall performance metrics

#### Metrics Tracked

```typescript
interface QueryPerformanceStats {
  totalQueries: number;        // Total queries executed
  successfulQueries: number;   // Successful queries
  failedQueries: number;       // Failed queries
  avgQueryTime: number;        // Average query time in ms
  cacheHitRate: number;        // Cache hit rate percentage
  slowestQueries: QueryMetrics[]; // Top 5 slowest queries
  lastReset: Date;            // When metrics were last reset
}
```

#### Usage

```typescript
import { 
  logQueryPerformance, 
  getQueryPerformanceStats, 
  logQueryPerformanceStats,
  withQueryPerformance 
} from '@/lib/performance/query-performance';

// Manual logging
const startTime = performance.now();
const result = await queryFn();
logQueryPerformance(['products', filters], performance.now() - startTime, 'success', 'miss');

// Automatic wrapper
const monitoredFn = withQueryPerformance(
  ['products', filters],
  () => ProductService.getProducts(filters)
);

// Get statistics
const stats = getQueryPerformanceStats();
console.log(`Average query time: ${stats.avgQueryTime.toFixed(2)}ms`);

// Log statistics
logQueryPerformanceStats();
```

#### Console Output

Query operations are logged with status indicators:

- `✓` - Successful query
- `✗` - Failed query
- `⏳` - Loading query
- `🎯` - Cache hit
- `⚠️` - Stale cache
- `❌` - Cache miss

Example:
```
✓ Query ["products",{"category":"steel"},1,20] - 45.23ms 🎯 hit
✗ Query ["products",{"category":"invalid"},1,20] - 123.45ms ❌ miss
⚠️ Slow query detected: ["cad-history",10,0] took 1234.56ms
```

### 3. Performance Metrics Dashboard

**Location**: `src/components/performance/PerformanceMetricsDashboard.tsx`

#### Features

- **Real-time Metrics Display**: Shows current performance statistics
- **Auto-refresh**: Updates every 5 seconds
- **Visual Indicators**: Color-coded metrics for quick assessment
- **Slowest Queries**: Identifies performance bottlenecks
- **Collapsible UI**: Minimizes to a button when not needed

#### Usage

Add to any page for development monitoring:

```tsx
import PerformanceMetricsDashboard from '@/components/performance/PerformanceMetricsDashboard';

export default function Page() {
  return (
    <>
      {/* Your page content */}
      
      {/* Add dashboard for development */}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceMetricsDashboard />
      )}
    </>
  );
}
```

#### Dashboard Sections

1. **Redis Cache Metrics** (Server-Side)
   - Note: Server-side metrics are logged to console
   - Check server logs for detailed cache statistics

2. **React Query Performance**
   - Total queries executed
   - Success/failure counts
   - Average query time
   - Cache hit rate with color coding:
     - Green: ≥80% (excellent)
     - Yellow: 50-79% (good)
     - Red: <50% (needs optimization)

3. **Slowest Queries**
   - Top 3 slowest queries
   - Duration in milliseconds
   - Color-coded warnings for slow queries

4. **Expected Performance**
   - Target metrics for comparison
   - Performance goals

## Performance Targets

### Cache Performance

| Metric | Target | Description |
|--------|--------|-------------|
| Cache Hit Rate | >80% | Percentage of requests served from cache |
| Cache Hit Response | <50ms | Time to retrieve from cache |
| Cache Miss Response | <200ms | Time to fetch and cache new data |
| DB Query Reduction | 80-90% | Reduction in database queries |

### Query Performance

| Metric | Target | Description |
|--------|--------|-------------|
| Average Query Time | <100ms | Average time for all queries |
| Cache Hit Rate | >70% | React Query cache effectiveness |
| Slow Query Threshold | <1000ms | Queries exceeding this trigger warnings |
| Error Rate | <5% | Percentage of failed queries |

## Monitoring in Production

### Server-Side Monitoring

For production environments, implement server-side logging:

```typescript
// In API routes or server components
import { logCacheMetrics } from '@/lib/cache/redis-cache';

// Log metrics periodically
setInterval(() => {
  logCacheMetrics();
}, 60000); // Every minute
```

### Client-Side Monitoring

For production client monitoring:

```typescript
// In app initialization
import { logQueryPerformanceStats } from '@/lib/performance/query-performance';

// Log query stats periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    logQueryPerformanceStats();
  }, 300000); // Every 5 minutes
}
```

### Integration with Monitoring Services

To integrate with external monitoring services (e.g., Datadog, New Relic):

```typescript
import { getCacheMetrics } from '@/lib/cache/redis-cache';
import { getQueryPerformanceStats } from '@/lib/performance/query-performance';

// Send to monitoring service
function sendMetricsToMonitoring() {
  const cacheMetrics = getCacheMetrics();
  const queryStats = getQueryPerformanceStats();
  
  // Example: Send to your monitoring service
  monitoringService.track('cache.hit_rate', cacheMetrics.hitRate);
  monitoringService.track('cache.avg_response_time', cacheMetrics.avgResponseTime);
  monitoringService.track('query.avg_time', queryStats.avgQueryTime);
  monitoringService.track('query.cache_hit_rate', queryStats.cacheHitRate);
}

// Call periodically
setInterval(sendMetricsToMonitoring, 60000);
```

## Optimization Strategies

### Low Cache Hit Rate (<50%)

**Possible Causes:**
- TTL too short
- Cache keys not properly generated
- High data volatility
- Cache not being used consistently

**Solutions:**
1. Increase TTL for stable data
2. Review cache key generation logic
3. Ensure all API routes use caching
4. Implement cache warming for common queries

### Slow Query Performance (>1000ms)

**Possible Causes:**
- Large data sets
- Complex database queries
- Network latency
- Missing database indexes

**Solutions:**
1. Implement pagination
2. Optimize database queries
3. Add database indexes
4. Use Redis caching more aggressively
5. Consider data denormalization

### High Error Rate (>5%)

**Possible Causes:**
- Redis connection issues
- Network problems
- Invalid cache keys
- Serialization errors

**Solutions:**
1. Check Redis connection configuration
2. Implement retry logic
3. Validate cache keys
4. Review error logs for patterns

## Best Practices

### 1. Regular Monitoring

- Check metrics daily in development
- Set up alerts for production metrics
- Review slow queries weekly
- Analyze trends over time

### 2. Cache Strategy

- Use appropriate TTLs for different data types
- Implement cache warming for critical data
- Clear cache on data mutations
- Monitor cache memory usage

### 3. Query Optimization

- Use React Query's staleTime effectively
- Implement proper cache invalidation
- Avoid over-fetching data
- Use pagination for large datasets

### 4. Performance Testing

- Load test with realistic data volumes
- Test cache behavior under load
- Measure impact of cache failures
- Verify graceful degradation

## Troubleshooting

### Metrics Not Updating

**Issue**: Dashboard shows stale or no data

**Solutions:**
1. Check browser console for errors
2. Verify component is mounted
3. Ensure auto-refresh is working
4. Check if metrics are being tracked

### Server-Side Metrics Not Available

**Issue**: Cache metrics not showing in dashboard

**Solutions:**
1. Cache metrics are server-side only
2. Check server logs instead
3. Use `logCacheMetrics()` in API routes
4. Implement server-side monitoring endpoint

### Inaccurate Metrics

**Issue**: Metrics don't match expected behavior

**Solutions:**
1. Reset metrics: `resetCacheMetrics()` and `resetQueryMetrics()`
2. Check for multiple instances
3. Verify timing calculations
4. Review metric collection logic

## Future Enhancements

### Planned Features

1. **Historical Metrics**
   - Store metrics over time
   - Trend analysis
   - Performance regression detection

2. **Advanced Analytics**
   - Query pattern analysis
   - Cache efficiency scoring
   - Automatic optimization suggestions

3. **Real-time Alerts**
   - Slack/email notifications
   - Performance threshold alerts
   - Error rate monitoring

4. **Export Functionality**
   - CSV export of metrics
   - Integration with BI tools
   - Custom reporting

## Related Documentation

- [Architecture Quick Reference](./Architecture/ARCHITECTURE_QUICK_REFERENCE.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [State Management Design](../.kiro/specs/state-management-caching/design.md)

## Support

For questions or issues with performance monitoring:

1. Check server logs for detailed cache metrics
2. Review browser console for query performance
3. Use the Performance Dashboard in development
4. Consult the design document for architecture details
