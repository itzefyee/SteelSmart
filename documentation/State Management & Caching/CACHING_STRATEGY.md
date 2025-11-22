# Redis Caching Strategy

Complete guide to server-side caching with Upstash Redis in the SteelSmart application.

## Table of Contents

1. [Overview](#overview)
2. [Cache Architecture](#cache-architecture)
3. [TTL Strategy](#ttl-strategy)
4. [Cache Key Patterns](#cache-key-patterns)
5. [Implementation Guide](#implementation-guide)
6. [Cache Invalidation](#cache-invalidation)
7. [Performance Monitoring](#performance-monitoring)
8. [Best Practices](#best-practices)

---

## Overview

The SteelSmart application uses **Upstash Redis** for server-side caching to:

- ✅ Reduce database load by 80-90%
- ✅ Improve API response times (<50ms for cache hits)
- ✅ Handle traffic spikes gracefully
- ✅ Provide graceful fallback on cache failures

### Cache Flow

```
API Request
    ↓
Check Redis Cache
    ↓
Cache Hit? ──Yes──→ Return Cached Data (< 50ms)
    ↓
   No
    ↓
Query Database
    ↓
Cache Result in Redis
    ↓
Return Fresh Data (< 200ms)
```

---

## Cache Architecture

### Three-Layer Caching

```
┌─────────────────────────────────────────┐
│     React Query (Client Cache)          │
│     - In-memory cache                   │
│     - 60s default stale time            │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Redis Cache (Server Cache)          │
│     - Shared across all users           │
│     - 5min - 24hr TTL                   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Supabase Database                   │
│     - Source of truth                   │
└─────────────────────────────────────────┘
```

### Cache Utility Functions

Located in `src/lib/cache/redis-cache.ts`:

```typescript
// Get from cache or fetch
getCached<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T>

// Manually set cache
setCached<T>(key: string, data: T, ttl?: number): Promise<void>

// Delete cache entry
deleteCached(key: string): Promise<void>

// Invalidate multiple keys
invalidateCachePattern(keys: string[]): Promise<void>

// Clear all cache (use with caution)
clearAllCache(): Promise<void>
```

---

## TTL Strategy

### Recommended TTL Values

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| **Product Lists** | 300s (5 min) | Moderate update frequency, frequently accessed |
| **Product Details** | 600s (10 min) | Rarely changes, high read volume |
| **Categories** | 3600s (1 hour) | Very stable data |
| **CAD Analysis** | 86400s (24 hours) | Expensive computation, results don't change |
| **Recommendations** | 3600s (1 hour) | Personalized but cacheable |
| **User Profiles** | 600s (10 min) | User-specific, moderate changes |
| **CAD History** | 300s (5 min) | Frequently updated |
| **Search Results** | 300s (5 min) | Dynamic but cacheable |

### TTL Guidelines

**Short TTL (1-5 minutes)** - Use for:
- Frequently changing data
- User-generated content
- Real-time features
- Data that must be fresh

**Medium TTL (10-60 minutes)** - Use for:
- Product catalogs
- User profiles
- Configuration data
- Moderate update frequency

**Long TTL (1-24 hours)** - Use for:
- Expensive computations
- Static content
- Reference data
- Rarely changing data

---

## Cache Key Patterns

### Naming Conventions

```typescript
// Product caching
'products:all'                          // All products
'products:category={category}'          // Filtered by category
'products:category={cat}&material={mat}' // Multiple filters
'product:{id}'                          // Single product

// CAD caching
'cad:analysis:{hash}'                   // Analysis results
'cad:history:{userId}'                  // User's CAD history
'cad:generation:{operationId}'          // Generation result

// Recommendations
'recommendations:{productId}'           // Product recommendations
'recommendations:{productId}:filters={filters}' // Filtered recommendations

// User data
'user:profile:{userId}'                 // User profile
'user:favorites:{userId}'               // User favorites
```

### Key Generation Best Practices

```typescript
// ✅ Good: Descriptive and structured
const key = `products:category=${category}&page=${page}&limit=${limit}`;

// ❌ Bad: Generic and ambiguous
const key = `products_${category}`;

// ✅ Good: Use hash for complex filters
import crypto from 'crypto';
const filterHash = crypto.createHash('md5').update(JSON.stringify(filters)).digest('hex');
const key = `products:filters=${filterHash}`;

// ✅ Good: Include version for schema changes
const key = `products:v2:category=${category}`;
```

---

## Implementation Guide

### Basic Caching in API Routes

```typescript
// src/app/api/products/route.ts
import { getCached } from '@/lib/cache/redis-cache';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';
  
  // Generate cache key
  const cacheKey = `products:category=${category}`;
  
  try {
    // Try cache first, fallback to database
    const products = await getCached(
      cacheKey,
      async () => {
        // This function only runs on cache miss
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', category);
        
        if (error) throw error;
        return data;
      },
      300 // TTL: 5 minutes
    );
    
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
```

### Caching with Complex Filters

```typescript
// src/app/api/products/route.ts
import { getCached } from '@/lib/cache/redis-cache';
import crypto from 'crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Build filters object
  const filters = {
    category: searchParams.get('category'),
    material: searchParams.get('material'),
    inStock: searchParams.get('inStock') === 'true',
    minPrice: Number(searchParams.get('minPrice')) || 0,
    maxPrice: Number(searchParams.get('maxPrice')) || Infinity,
  };
  
  // Generate cache key from filter hash
  const filterHash = crypto
    .createHash('md5')
    .update(JSON.stringify(filters))
    .digest('hex');
  const cacheKey = `products:filters=${filterHash}`;
  
  const products = await getCached(
    cacheKey,
    async () => {
      let query = supabase.from('products').select('*');
      
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.material) query = query.eq('material', filters.material);
      if (filters.inStock) query = query.eq('in_stock', true);
      query = query.gte('price', filters.minPrice);
      query = query.lte('price', filters.maxPrice);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    300
  );
  
  return NextResponse.json({ products });
}
```

### Caching Expensive Computations

```typescript
// src/app/api/analyze-drawing/route.ts
import { getCached } from '@/lib/cache/redis-cache';
import crypto from 'crypto';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Generate hash of file content for cache key
  const buffer = await file.arrayBuffer();
  const fileHash = crypto
    .createHash('sha256')
    .update(Buffer.from(buffer))
    .digest('hex');
  
  const cacheKey = `cad:analysis:${fileHash}`;
  
  // Cache for 24 hours since analysis results don't change
  const analysis = await getCached(
    cacheKey,
    async () => {
      // Expensive AI analysis
      const result = await analyzeDrawingWithGemini(file);
      return result;
    },
    86400 // 24 hours
  );
  
  return NextResponse.json({ analysis });
}
```

---

## Cache Invalidation

### Manual Invalidation

```typescript
import { deleteCached, invalidateCachePattern } from '@/lib/cache/redis-cache';

// Delete single cache entry
await deleteCached('product:123');

// Invalidate multiple related keys
await invalidateCachePattern([
  'products:category=steel',
  'products:category=aluminum',
  'product:123'
]);
```

### Invalidation on Data Updates

```typescript
// src/app/api/products/[id]/route.ts
import { deleteCached, invalidateCachePattern } from '@/lib/cache/redis-cache';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const updates = await request.json();
  
  // Update database
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Invalidate affected caches
  await invalidateCachePattern([
    `product:${params.id}`,           // Single product
    'products:all',                    // All products list
    `products:category=${data.category}`, // Category list
  ]);
  
  return NextResponse.json({ product: data });
}
```

### Automatic Invalidation with React Query

```typescript
// In your mutation hook
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const updateProduct = useMutation({
  mutationFn: ProductService.updateProduct,
  onSuccess: (data, variables) => {
    // Invalidate React Query cache
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    
    // Redis cache is invalidated by the API route
  }
});
```

---

## Performance Monitoring

### Built-in Metrics

The Redis cache utility includes automatic performance tracking:

```typescript
import { getCacheMetrics, logCacheMetrics } from '@/lib/cache/redis-cache';

// Get current metrics
const metrics = getCacheMetrics();
console.log(`Cache hit rate: ${metrics.hitRate.toFixed(2)}%`);
console.log(`Average response time: ${metrics.avgResponseTime.toFixed(2)}ms`);

// Log detailed metrics
logCacheMetrics();
```

### Console Logging

Cache operations are automatically logged:

```
✓ Cache hit: products:category=steel (23.45ms)
✗ Cache miss: products:category=aluminum
✓ Cached data for key "products:category=aluminum" with TTL 300s (fetch: 156.78ms, total: 178.23ms)
```

### Performance Targets

| Metric | Target | Action if Below Target |
|--------|--------|------------------------|
| **Cache Hit Rate** | >80% | Increase TTL or review cache keys |
| **Cache Hit Response** | <50ms | Check Redis latency |
| **Cache Miss Response** | <200ms | Optimize database queries |
| **Error Rate** | <1% | Check Redis connection |

### Monitoring Dashboard

View real-time metrics at `/performance` or add to any page:

```tsx
import PerformanceMetricsDashboard from '@/components/performance/PerformanceMetricsDashboard';

{process.env.NODE_ENV === 'development' && <PerformanceMetricsDashboard />}
```

---

## Best Practices

### 1. Always Use Graceful Fallback

```typescript
// ✅ Good: Cache failures don't break the app
const data = await getCached(key, fetcher, ttl);
// getCached automatically falls back to fetcher on error

// ❌ Bad: Cache errors break the app
const cached = await redis.get(key);
if (!cached) throw new Error('Cache miss');
```

### 2. Cache Expensive Operations

```typescript
// ✅ Good: Cache expensive AI analysis
const analysis = await getCached(
  `analysis:${fileHash}`,
  () => analyzeWithAI(file),
  86400 // 24 hours
);

// ❌ Bad: Don't cache simple database queries
const user = await getCached(
  `user:${id}`,
  () => db.users.findById(id),
  60 // Too short, adds overhead
);
```

### 3. Use Appropriate TTL

```typescript
// ✅ Good: Match TTL to data volatility
const products = await getCached(key, fetcher, 300);      // 5 min for products
const analysis = await getCached(key, fetcher, 86400);    // 24 hr for analysis
const categories = await getCached(key, fetcher, 3600);   // 1 hr for categories

// ❌ Bad: One-size-fits-all TTL
const data = await getCached(key, fetcher, 60); // Too short for everything
```

### 4. Invalidate on Updates

```typescript
// ✅ Good: Invalidate after updates
await updateProduct(id, changes);
await deleteCached(`product:${id}`);

// ❌ Bad: Stale data in cache
await updateProduct(id, changes);
// Cache still has old data
```

### 5. Use Structured Cache Keys

```typescript
// ✅ Good: Structured and queryable
const key = `products:category=${cat}&material=${mat}&page=${page}`;

// ❌ Bad: Unstructured and hard to invalidate
const key = `products_${cat}_${mat}_${page}`;
```

### 6. Monitor Cache Performance

```typescript
// ✅ Good: Regular monitoring
setInterval(() => {
  const metrics = getCacheMetrics();
  if (metrics.hitRate < 80) {
    console.warn('Low cache hit rate:', metrics.hitRate);
  }
}, 60000); // Check every minute

// ❌ Bad: No monitoring
// Cache could be ineffective and you wouldn't know
```

### 7. Handle User-Specific Data Carefully

```typescript
// ✅ Good: Include user ID in cache key
const key = `favorites:user=${userId}`;

// ❌ Bad: Shared cache for user-specific data
const key = 'favorites'; // All users share same cache!
```

### 8. Version Your Cache Keys

```typescript
// ✅ Good: Version cache keys for schema changes
const key = `products:v2:category=${category}`;

// When schema changes, increment version
const key = `products:v3:category=${category}`;

// ❌ Bad: No versioning
const key = `products:category=${category}`;
// Old cached data with different schema causes errors
```

---

## Troubleshooting

### Cache Not Working

**Problem**: Data always fetched from database

**Solution**: Check Redis credentials in `.env.local`
```bash
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### Low Cache Hit Rate

**Problem**: Hit rate below 80%

**Solutions**:
- Increase TTL for stable data
- Review cache key generation (ensure consistency)
- Check if data is being invalidated too frequently

### Stale Data

**Problem**: Users see outdated information

**Solutions**:
- Reduce TTL for frequently changing data
- Implement cache invalidation on updates
- Use React Query's background refetch

### High Memory Usage

**Problem**: Redis memory usage growing

**Solutions**:
- Review TTL values (too long?)
- Implement cache eviction policies
- Clear unused cache keys
- Monitor with Upstash dashboard

### Cache Errors

**Problem**: Frequent cache operation failures

**Solutions**:
- Check Redis connection
- Verify Upstash plan limits
- Review error logs for patterns
- Ensure graceful fallback is working

---

## Next Steps

- Read [STATE_MANAGEMENT_GUIDE.md](./STATE_MANAGEMENT_GUIDE.md) for React Query patterns
- Read [PERFORMANCE_MONITORING.md](./PERFORMANCE_MONITORING.md) for optimization
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Review Upstash dashboard for usage metrics
