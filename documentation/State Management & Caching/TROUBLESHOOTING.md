# Troubleshooting Guide

Common issues and solutions for React Query, Zustand, and Redis caching.

## Table of Contents

1. [React Query Issues](#react-query-issues)
2. [Zustand Issues](#zustand-issues)
3. [Redis Cache Issues](#redis-cache-issues)
4. [Performance Issues](#performance-issues)
5. [Development Tools](#development-tools)

---

## React Query Issues

### Query Not Refetching

**Symptoms:**
- Data doesn't update after changes
- Stale data displayed to users
- Manual refetch doesn't work

**Possible Causes & Solutions:**

#### 1. StaleTime Too Long

```tsx
// Problem: Data considered fresh for too long
const { data } = useProducts({
  staleTime: 60 * 60 * 1000 // 1 hour - too long!
});

// Solution: Reduce staleTime
const { data } = useProducts({
  staleTime: 5 * 60 * 1000 // 5 minutes
});
```

#### 2. Query Not Invalidated After Mutation

```tsx
// Problem: Cache not invalidated after update
const updateProduct = async (id, updates) => {
  await ProductService.updateProduct(id, updates);
  // Cache still has old data!
};

// Solution: Invalidate queries after mutation
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
const updateProduct = async (id, updates) => {
  await ProductService.updateProduct(id, updates);
  queryClient.invalidateQueries({ queryKey: ['products'] });
  queryClient.invalidateQueries({ queryKey: ['product', id] });
};
```

#### 3. Query Disabled

```tsx
// Problem: Query is disabled
const { data } = useProducts({
  enabled: false // Query won't run!
});

// Solution: Check enabled condition
const { data } = useProducts({
  enabled: true // or conditional: !!userId
});
```

### Too Many API Requests

**Symptoms:**
- Network tab shows repeated requests
- API rate limits hit
- Slow performance

**Possible Causes & Solutions:**

#### 1. StaleTime Too Short

```tsx
// Problem: Data becomes stale too quickly
const { data } = useProducts({
  staleTime: 0 // Refetches on every render!
});

// Solution: Increase staleTime
const { data } = useProducts({
  staleTime: 5 * 60 * 1000 // 5 minutes
});
```

#### 2. RefetchOnWindowFocus Enabled

```tsx
// Problem: Refetches every time window gains focus
// This is the default behavior

// Solution: Disable in QueryClient config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});
```

#### 3. Query Key Changes Too Often

```tsx
// Problem: Query key includes unstable reference
const filters = { category: 'steel' }; // New object every render!
const { data } = useQuery({
  queryKey: ['products', filters], // Key changes every render!
  queryFn: () => fetchProducts(filters),
});

// Solution: Memoize or use stable reference
const [filters, setFilters] = useState({ category: 'steel' });
const { data } = useQuery({
  queryKey: ['products', filters], // Stable reference
  queryFn: () => fetchProducts(filters),
});
```

### Data is Undefined

**Symptoms:**
- `data` is undefined even after loading
- TypeScript errors about undefined
- Components crash

**Possible Causes & Solutions:**

#### 1. Not Checking Loading State

```tsx
// Problem: Accessing data before it loads
const { data } = useProducts();
return <div>{data.products.length}</div>; // Error: data is undefined!

// Solution: Check loading state
const { data, isLoading } = useProducts();
if (isLoading) return <LoadingSpinner />;
return <div>{data.products.length}</div>;
```

#### 2. Query Failed

```tsx
// Problem: Query failed but not handling error
const { data } = useProducts();
return <div>{data.products.length}</div>; // Error if query failed!

// Solution: Handle error state
const { data, isLoading, error } = useProducts();
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <div>{data.products.length}</div>;
```

### Mutations Not Working

**Symptoms:**
- `mutate()` doesn't trigger
- `isPending` always false
- No API call made

**Possible Causes & Solutions:**

#### 1. Not Calling mutate()

```tsx
// Problem: Mutation defined but not called
const { mutate } = useCADGeneration();

return <button>Generate</button>; // Doesn't do anything!

// Solution: Call mutate in event handler
return <button onClick={() => mutate({ description: 'bracket' })}>
  Generate
</button>;
```

#### 2. Mutation Function Throws

```tsx
// Problem: Mutation function has error
const { mutate } = useMutation({
  mutationFn: async (data) => {
    throw new Error('Not implemented'); // Always fails!
  }
});

// Solution: Implement mutation function properly
const { mutate } = useMutation({
  mutationFn: async (data) => {
    const response = await fetch('/api/generate-cad', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }
});
```

---

## Zustand Issues

### State Not Persisting

**Symptoms:**
- State resets on page reload
- localStorage empty
- Preferences not saved

**Possible Causes & Solutions:**

#### 1. Persist Middleware Not Configured

```tsx
// Problem: No persist middleware
const useStore = create((set) => ({
  format: 'step',
  setFormat: (format) => set({ format }),
}));

// Solution: Add persist middleware
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      format: 'step',
      setFormat: (format) => set({ format }),
    }),
    { name: 'my-store' }
  )
);
```

#### 2. State Not in Partialize

```tsx
// Problem: State excluded from persistence
const useStore = create(
  persist(
    (set) => ({
      format: 'step',
      tempData: null,
      setFormat: (format) => set({ format }),
    }),
    {
      name: 'my-store',
      partialize: (state) => ({
        // format not included!
        tempData: state.tempData,
      }),
    }
  )
);

// Solution: Include state in partialize
partialize: (state) => ({
  format: state.format, // Include this!
  // tempData excluded (session-only)
}),
```

#### 3. localStorage Disabled

```tsx
// Problem: Browser has localStorage disabled
// Check in browser console:
console.log(typeof localStorage); // 'undefined' if disabled

// Solution: Handle gracefully
try {
  const useStore = create(persist(...));
} catch (error) {
  console.warn('localStorage not available, state will not persist');
  const useStore = create(...); // Fallback without persist
}
```

### State Not Updating

**Symptoms:**
- Component doesn't re-render
- State changes but UI doesn't update
- Old values displayed

**Possible Causes & Solutions:**

#### 1. Mutating State Directly

```tsx
// Problem: Mutating state instead of replacing
const useStore = create((set) => ({
  items: [],
  addItem: (item) => {
    // DON'T DO THIS!
    useStore.getState().items.push(item);
  },
}));

// Solution: Create new state object
const useStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item], // New array
  })),
}));
```

#### 2. Not Subscribing to State

```tsx
// Problem: Not using the hook
const store = useCADStore; // Just the function, not subscribed!
return <div>{store.selectedFormat}</div>; // Won't update!

// Solution: Call the hook
const { selectedFormat } = useCADStore(); // Subscribed!
return <div>{selectedFormat}</div>;
```

### Too Many Re-renders

**Symptoms:**
- Component re-renders excessively
- Performance issues
- "Maximum update depth exceeded" error

**Possible Causes & Solutions:**

#### 1. Subscribing to Entire Store

```tsx
// Problem: Re-renders on any state change
const store = useCADStore(); // Subscribes to everything!

// Solution: Subscribe to specific values
const selectedFormat = useCADStore(state => state.selectedFormat);
const setFormat = useCADStore(state => state.setFormat);
```

#### 2. Creating New Objects in Selector

```tsx
// Problem: Selector returns new object every time
const data = useStore(state => ({
  format: state.format,
  units: state.units,
})); // New object every time!

// Solution: Use shallow equality or separate selectors
import { shallow } from 'zustand/shallow';

const { format, units } = useStore(
  state => ({ format: state.format, units: state.units }),
  shallow
);
```

---

## Redis Cache Issues

### Cache Not Working

**Symptoms:**
- All requests hit database
- No cache hit logs
- Performance not improved

**Possible Causes & Solutions:**

#### 1. Redis Credentials Missing

```bash
# Problem: Environment variables not set
# Check .env.local

# Solution: Add Redis credentials
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

#### 2. Redis Client Not Initialized

```tsx
// Problem: Redis client returns null
const client = getRedisClient(); // null

// Solution: Check initialization and credentials
// See console for warnings:
// "Redis credentials not configured. Caching will be disabled."
```

#### 3. Cache Key Inconsistent

```tsx
// Problem: Different cache keys for same data
const key1 = `products:category=${category}&page=${page}`;
const key2 = `products:page=${page}&category=${category}`; // Different order!

// Solution: Use consistent key generation
function generateProductKey(filters, page) {
  const sortedFilters = Object.keys(filters)
    .sort()
    .map(key => `${key}=${filters[key]}`)
    .join('&');
  return `products:${sortedFilters}&page=${page}`;
}
```

### Low Cache Hit Rate

**Symptoms:**
- Hit rate below 80%
- Most requests miss cache
- Poor performance

**Possible Causes & Solutions:**

#### 1. TTL Too Short

```tsx
// Problem: Cache expires too quickly
await getCached(key, fetcher, 60); // 1 minute - too short!

// Solution: Increase TTL for stable data
await getCached(key, fetcher, 300); // 5 minutes
```

#### 2. Cache Keys Not Consistent

```tsx
// Problem: Query parameters in different order
// Request 1: /api/products?category=steel&page=1
// Request 2: /api/products?page=1&category=steel
// Different cache keys!

// Solution: Sort parameters
const params = new URLSearchParams();
Object.keys(filters).sort().forEach(key => {
  params.append(key, filters[key]);
});
```

#### 3. Cache Invalidated Too Often

```tsx
// Problem: Invalidating too broadly
await invalidateCachePattern(['products:*']); // Clears everything!

// Solution: Invalidate specific keys only
await invalidateCachePattern([
  `product:${productId}`,
  `products:category=${category}`,
]);
```

### Stale Data in Cache

**Symptoms:**
- Users see outdated information
- Changes not reflected
- Cache not invalidated

**Possible Causes & Solutions:**

#### 1. TTL Too Long

```tsx
// Problem: Cache lives too long
await getCached(key, fetcher, 86400); // 24 hours - too long for products!

// Solution: Reduce TTL for frequently changing data
await getCached(key, fetcher, 300); // 5 minutes
```

#### 2. Missing Cache Invalidation

```tsx
// Problem: Not invalidating after updates
export async function PUT(request: Request) {
  await updateProduct(id, updates);
  return NextResponse.json({ success: true });
  // Cache still has old data!
}

// Solution: Invalidate after updates
export async function PUT(request: Request) {
  await updateProduct(id, updates);
  await deleteCached(`product:${id}`);
  await invalidateCachePattern([`products:*`]);
  return NextResponse.json({ success: true });
}
```

### Redis Connection Errors

**Symptoms:**
- "Connection refused" errors
- Cache operations fail
- Timeout errors

**Possible Causes & Solutions:**

#### 1. Invalid Credentials

```bash
# Problem: Wrong URL or token
UPSTASH_REDIS_REST_URL=https://wrong-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=invalid_token

# Solution: Get correct credentials from Upstash dashboard
# Settings > REST API > Copy URL and Token
```

#### 2. Network Issues

```bash
# Problem: Can't reach Upstash servers
# Check network connectivity

# Solution: Test connection
curl https://your-redis-url.upstash.io/ping \
  -H "Authorization: Bearer your-token"

# Should return: {"result":"PONG"}
```

#### 3. Rate Limits

```bash
# Problem: Exceeded Upstash plan limits
# Check Upstash dashboard for usage

# Solution: Upgrade plan or reduce cache operations
# - Increase TTL to reduce writes
# - Use batch operations
# - Implement request throttling
```

---

## Performance Issues

### Slow Initial Load

**Symptoms:**
- First page load takes long
- Loading spinner shows for seconds
- Users complain about speed

**Possible Causes & Solutions:**

#### 1. No Caching

```tsx
// Problem: Every load hits database
const { data } = useProducts({
  staleTime: 0, // No caching!
});

// Solution: Enable caching
const { data } = useProducts({
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

#### 2. Slow Database Queries

```sql
-- Problem: Missing indexes
SELECT * FROM products WHERE category = 'steel'; -- Slow!

-- Solution: Add indexes
CREATE INDEX idx_products_category ON products(category);
```

#### 3. Large Payload

```tsx
// Problem: Fetching too much data
const { data } = useProducts({
  limit: 1000, // Too many!
});

// Solution: Use pagination
const { data } = useProducts({
  limit: 20, // Reasonable page size
  page: currentPage,
});
```

### Memory Leaks

**Symptoms:**
- Browser memory grows over time
- Tab becomes slow
- Eventually crashes

**Possible Causes & Solutions:**

#### 1. Not Cleaning Up Subscriptions

```tsx
// Problem: Subscribing to entire store
function MyComponent() {
  const store = useCADStore(); // Subscribes to everything!
  return <div>{store.selectedFormat}</div>;
}

// Solution: Subscribe to specific values
function MyComponent() {
  const selectedFormat = useCADStore(state => state.selectedFormat);
  return <div>{selectedFormat}</div>;
}
```

#### 2. Infinite Query Growth

```tsx
// Problem: Queries never garbage collected
// Check React Query DevTools for query count

// Solution: Set cacheTime
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

---

## Development Tools

### React Query DevTools

**Enable DevTools:**
```tsx
// src/app/providers.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Using DevTools:**
- View all active queries
- Inspect query data and state
- Manually trigger refetch
- Clear cache
- Monitor query performance

### Zustand DevTools

**Enable DevTools:**
```tsx
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set) => ({ /* state */ }),
    { name: 'MyStore' }
  )
);
```

**Using DevTools:**
- Install Redux DevTools extension
- View state changes in real-time
- Time-travel debugging
- Track action history

### Redis Monitoring

**Console Logs:**
```
✓ Cache hit: products:category=steel (23.45ms)
✗ Cache miss: products:category=aluminum
✓ Cached data for key "products:category=aluminum" with TTL 300s
```

**Get Metrics:**
```tsx
import { getCacheMetrics, logCacheMetrics } from '@/lib/cache/redis-cache';

// Get metrics object
const metrics = getCacheMetrics();
console.log(`Hit rate: ${metrics.hitRate}%`);

// Log detailed metrics
logCacheMetrics();
```

**Upstash Dashboard:**
- Visit [console.upstash.com](https://console.upstash.com)
- View real-time metrics
- Monitor command usage
- Check memory usage
- View stored keys

---

## Getting Help

If you're still experiencing issues:

1. **Check Console Logs**: Look for errors and warnings
2. **Use DevTools**: React Query and Redux DevTools
3. **Review Documentation**: 
   - [STATE_MANAGEMENT_GUIDE.md](./STATE_MANAGEMENT_GUIDE.md)
   - [CACHING_STRATEGY.md](./CACHING_STRATEGY.md)
   - [MIGRATION_GUIDE_STATE.md](./MIGRATION_GUIDE_STATE.md)
4. **Check GitHub Issues**: Search for similar problems
5. **Ask for Help**: Create a detailed issue with:
   - Error messages
   - Code snippets
   - Steps to reproduce
   - Expected vs actual behavior
