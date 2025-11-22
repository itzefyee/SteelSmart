# Cache Invalidation Strategy Guide

This document describes the cache invalidation strategy for the SteelSmart application using React Query and Redis.

## Overview

The application uses a two-tier caching strategy:
1. **Client-side caching** with React Query (in-memory)
2. **Server-side caching** with Redis (persistent)

Cache invalidation ensures that users always see up-to-date data after mutations (create, update, delete operations).

## Cache Invalidation Patterns

### 1. Automatic Invalidation (Recommended)

Mutations automatically invalidate related queries using React Query's `invalidateQueries` method.

**Example: CAD Generation**
```typescript
const { mutate } = useCADGeneration({
  onSuccess: () => {
    // Automatically invalidates all CAD history queries
    queryClient.invalidateQueries({ queryKey: ['cad-history'] });
  }
});
```

**How it works:**
1. User generates a new CAD model
2. Mutation succeeds
3. `invalidateQueries` marks all `['cad-history']` queries as stale
4. React Query automatically refetches in the background
5. UI updates with new data

### 2. Manual Invalidation

Components can manually trigger refetch using the `refetch` function returned by hooks.

**Example: Refresh Button**
```typescript
const { data, refetch, isRefetching } = useCADHistory();

return (
  <button onClick={() => refetch()} disabled={isRefetching}>
    {isRefetching ? 'Refreshing...' : 'Refresh'}
  </button>
);
```

**When to use:**
- User-initiated refresh actions
- After operations that don't use React Query mutations
- When you need immediate feedback (bypassing staleTime)

### 3. Optimistic Updates (Future Enhancement)

For better UX, mutations can optimistically update the cache before the server responds.

**Example: Delete CAD History Item**
```typescript
const deleteHistoryItem = useMutation({
  mutationFn: (id: string) => CADService.deleteHistoryItem(id),
  onMutate: async (id) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['cad-history'] });
    
    // Snapshot previous value
    const previousHistory = queryClient.getQueryData(['cad-history']);
    
    // Optimistically update cache
    queryClient.setQueryData(['cad-history'], (old) => 
      old.filter(item => item.id !== id)
    );
    
    return { previousHistory };
  },
  onError: (err, id, context) => {
    // Rollback on error
    queryClient.setQueryData(['cad-history'], context.previousHistory);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['cad-history'] });
  }
});
```

## Cache Keys

### CAD Generation
- `['cad-history']` - Base key for all CAD history queries
- `['cad-history', limit, offset]` - Paginated history queries

**Invalidation scope:**
```typescript
// Invalidates ALL cad-history queries (including paginated)
queryClient.invalidateQueries({ queryKey: ['cad-history'] });

// Invalidates only specific pagination
queryClient.invalidateQueries({ queryKey: ['cad-history', 10, 0] });
```

### Products
- `['products', filters, page, limit]` - Product list queries
- `['product', id]` - Single product queries

**Invalidation scope:**
```typescript
// Invalidates ALL product queries
queryClient.invalidateQueries({ queryKey: ['products'] });

// Invalidates specific product
queryClient.invalidateQueries({ queryKey: ['product', productId] });

// Invalidates products with specific filters
queryClient.invalidateQueries({ 
  queryKey: ['products', { category: 'steel' }] 
});
```

## Server-Side Cache Invalidation

When data is mutated, both client and server caches should be invalidated.

### Redis Cache Invalidation

**Example: Product Update API Route**
```typescript
// src/app/api/products/[id]/route.ts
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const updates = await request.json();
  
  // Update in database
  const updatedProduct = await updateProductInDB(id, updates);
  
  // Invalidate Redis cache
  await deleteCached(`product:${id}`);
  await invalidateCachePattern([`products:*`]); // Clear all product list caches
  
  return Response.json({ success: true, data: updatedProduct });
}
```

**Cache Key Patterns:**
- `product:{id}` - Single product
- `products:{filters_hash}` - Product lists with filters
- `cad:analysis:{hash}` - CAD analysis results
- `recommendations:{product_id}` - Product recommendations

## Best Practices

### 1. Invalidate Broadly, Cache Specifically

```typescript
// ✅ Good: Invalidates all related queries
queryClient.invalidateQueries({ queryKey: ['products'] });

// ❌ Bad: Too specific, might miss related queries
queryClient.invalidateQueries({ 
  queryKey: ['products', { category: 'steel' }, 1, 20] 
});
```

### 2. Use Stale Time Appropriately

```typescript
// Frequently changing data: Short stale time
useQuery({
  queryKey: ['cad-history'],
  staleTime: 2 * 60 * 1000, // 2 minutes
});

// Rarely changing data: Long stale time
useQuery({
  queryKey: ['product-categories'],
  staleTime: 15 * 60 * 1000, // 15 minutes
});
```

### 3. Provide Manual Refetch for User Control

```typescript
// Always expose refetch for user-initiated refresh
const { data, refetch, isRefetching } = useProducts();

return (
  <>
    <ProductList products={data} />
    <RefreshButton onClick={refetch} loading={isRefetching} />
  </>
);
```

### 4. Document Cache Invalidation in Mutations

```typescript
/**
 * Mutation for updating product
 * 
 * Cache Invalidation:
 * - Invalidates ['products'] to refresh product lists
 * - Invalidates ['product', id] to refresh single product view
 * - Clears Redis cache for affected product
 */
const updateProduct = useMutation({
  mutationFn: ProductService.updateProduct,
  onSuccess: (data, variables) => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
  }
});
```

## Troubleshooting

### Cache Not Updating After Mutation

**Problem:** UI doesn't show new data after mutation succeeds.

**Solutions:**
1. Check that `invalidateQueries` is called in `onSuccess`
2. Verify the query key matches exactly
3. Ensure the component is using the query (not just cached data)
4. Check React Query DevTools to see cache state

### Stale Data Persisting

**Problem:** Old data shows even after invalidation.

**Solutions:**
1. Reduce `staleTime` for frequently changing data
2. Use `refetch()` instead of `invalidateQueries()` for immediate updates
3. Check if Redis cache is also being cleared
4. Verify cache keys are consistent across queries and invalidations

### Too Many Refetches

**Problem:** Network requests happening too frequently.

**Solutions:**
1. Increase `staleTime` to reduce background refetches
2. Use `refetchOnWindowFocus: false` for stable data
3. Implement request deduplication
4. Consider using `refetchInterval` instead of manual refetches

## Testing Cache Invalidation

### Unit Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

test('invalidates cache after CAD generation', async () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  const { result } = renderHook(() => useCADGeneration(), { wrapper });
  
  // Generate CAD
  result.current.mutate({ description: 'test' });
  
  await waitFor(() => {
    // Verify cache was invalidated
    const cacheState = queryClient.getQueryState(['cad-history']);
    expect(cacheState.isInvalidated).toBe(true);
  });
});
```

### Integration Tests

```typescript
test('UI updates after mutation', async () => {
  render(<CADGeneratorPage />);
  
  // Generate CAD
  await userEvent.type(screen.getByRole('textbox'), 'test prompt');
  await userEvent.click(screen.getByText('Generate'));
  
  // Wait for generation to complete
  await waitFor(() => {
    expect(screen.getByText('Generation complete')).toBeInTheDocument();
  });
  
  // Verify history list updated
  expect(screen.getByText('test prompt')).toBeInTheDocument();
});
```

## Related Files

- `src/hooks/useCADGeneration.ts` - CAD generation hooks with cache invalidation
- `src/hooks/useProducts.ts` - Product hooks with cache invalidation
- `src/lib/cache/redis-cache.ts` - Redis cache utilities
- `src/lib/cache/cache-keys.ts` - Cache key generation utilities
- `src/app/providers.tsx` - React Query client configuration

## Requirements

This cache invalidation strategy satisfies the following requirements:
- **10.1**: Cache invalidation on CAD generation completion
- **10.2**: Cache invalidation on product updates
- **10.3**: Using queryClient.invalidateQueries with appropriate query keys
- **10.4**: Manual cache invalidation via refetch function
- **10.5**: Redis cache clearing on data updates
