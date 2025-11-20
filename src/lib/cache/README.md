# Cache Utilities

This directory contains utilities for server-side caching with Upstash Redis.

## Files

- **redis-cache.ts**: Core Redis caching functions (getCached, setCached, deleteCached, invalidateCachePattern)
- **cache-keys.ts**: Cache key generation utilities for consistent key naming
- **CACHE_INVALIDATION.md**: Comprehensive documentation on cache invalidation strategy

## Quick Start

### Reading from Cache

```typescript
import { getCached } from '@/lib/cache/redis-cache';

const data = await getCached(
  'my-cache-key',
  async () => {
    // Fetcher function - called on cache miss
    return await fetchDataFromDatabase();
  },
  300 // TTL in seconds
);
```

### Writing to Cache

```typescript
import { setCached } from '@/lib/cache/redis-cache';

await setCached('my-cache-key', data, 300);
```

### Invalidating Cache

```typescript
import { deleteCached, invalidateCachePattern } from '@/lib/cache/redis-cache';

// Delete single key
await deleteCached('my-cache-key');

// Delete multiple keys
await invalidateCachePattern(['key1', 'key2', 'key3']);
```

### Generating Cache Keys

```typescript
import { 
  generateProductCacheKey,
  generateProductDetailCacheKey,
  generateCADHistoryCacheKey 
} from '@/lib/cache/cache-keys';

const listKey = generateProductCacheKey({ category: 'steel', page: 1, limit: 20 });
const detailKey = generateProductDetailCacheKey('123');
const historyKey = generateCADHistoryCacheKey('user123', 1, 10);
```

## Adding Cache Invalidation to New Endpoints

When creating mutation endpoints (POST, PUT, PATCH, DELETE), follow these steps:

1. Import cache utilities at the top of your route file
2. Perform the database mutation
3. Add cache invalidation in a try-catch block
4. Log invalidation operations
5. Document in CACHE_INVALIDATION.md

See CACHE_INVALIDATION.md for detailed examples and patterns.
