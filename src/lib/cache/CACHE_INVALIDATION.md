# Cache Invalidation Strategy

This document outlines the cache invalidation strategy for the Metalyze application. Cache invalidation ensures that users see updated data after mutations (create, update, delete operations).

## Overview

The application uses a two-tier caching strategy:
1. **Redis Cache** (server-side): Caches API responses to reduce database load
2. **React Query Cache** (client-side): Caches data in the browser for instant UI updates

When data is mutated, both caches need to be invalidated to ensure consistency.

## Cache Invalidation Principles

1. **Graceful Degradation**: Cache invalidation failures should never break the application
2. **Comprehensive Coverage**: Invalidate all related cache keys, not just the direct key
3. **Performance**: Use batch invalidation where possible
4. **Logging**: Always log cache invalidation operations for debugging

## Mutation-Triggered Cache Invalidation

### Product Mutations

#### PUT /api/products/[id] - Update Product

**Triggers:**
- Product details are updated (name, price, description, etc.)

**Cache Keys Invalidated:**
- `product:{id}` - Specific product detail cache
- `products:*` - All product list caches (common pagination scenarios)
- `recommendations:{id}*` - Related product recommendations

**Rationale:**
- Product lists need to reflect updated information
- Recommendations may change based on updated product attributes
- Category/material filters may now include or exclude this product

**Implementation:**
```typescript
// Invalidate specific product detail cache
const productDetailKey = generateProductDetailCacheKey(id);
await deleteCached(productDetailKey);

// Invalidate common product list caches
const commonProductListKeys = [
  generateProductCacheKey({ page: 1, limit: 20 }),
  generateProductCacheKey({ page: 1, limit: 50 }),
  generateProductCacheKey({ category: product.category, page: 1, limit: 20 }),
  generateProductCacheKey({ material: product.material, page: 1, limit: 20 }),
  generateProductCacheKey({ inStock: product.in_stock, page: 1, limit: 20 }),
];

await invalidateCachePattern(commonProductListKeys);

// Invalidate recommendation caches
const recommendationKeys = [
  `recommendations:${id}`,
  `recommendations:${id}:*`,
];

await invalidateCachePattern(recommendationKeys);
```

#### DELETE /api/products/[id] - Delete Product

**Triggers:**
- Product is permanently deleted

**Cache Keys Invalidated:**
- `product:{id}` - Specific product detail cache
- `products:*` - All product list caches
- `recommendations:{id}*` - Related product recommendations

**Rationale:**
- Product should no longer appear in any lists
- Recommendations referencing this product should be refreshed
- Category/material filters should reflect the removal

**Implementation:**
Same as PUT operation above.

---

### CAD History Mutations

#### POST /api/cad-history - Add CAD Generation to History

**Triggers:**
- New CAD model is generated and saved to history

**Cache Keys Invalidated:**
- `cad:history:{user_id}:*` - All user-specific history caches (multiple pagination scenarios)

**Rationale:**
- User's history list needs to show the new generation
- First page of history should display the latest item
- Pagination counts may change

**Implementation:**
```typescript
// Invalidate user-specific history caches (common pagination scenarios)
const historyKeys = [
  generateCADHistoryCacheKey(user.id, 1, 10),
  generateCADHistoryCacheKey(user.id, 1, 20),
  generateCADHistoryCacheKey(user.id, 1, 50),
  generateCADHistoryCacheKey(user.id, 2, 10),
  generateCADHistoryCacheKey(user.id, 3, 10),
];

await invalidateCachePattern(historyKeys);
```

#### DELETE /api/cad-history?id={id} - Delete Single History Item

**Triggers:**
- User deletes a specific CAD generation from history

**Cache Keys Invalidated:**
- `cad:history:{user_id}:*` - All user-specific history caches

**Rationale:**
- History list should no longer show the deleted item
- Pagination may shift items between pages
- Total count changes

**Implementation:**
Same as POST operation above.

#### DELETE /api/cad-history - Clear All History

**Triggers:**
- User clears entire CAD generation history

**Cache Keys Invalidated:**
- `cad:history:{user_id}:*` - All user-specific history caches

**Rationale:**
- All history pages should be empty
- Prevents showing stale cached history

**Implementation:**
Same as POST operation above.

---

## React Query Cache Invalidation

In addition to Redis cache invalidation, React Query caches on the client side need to be invalidated. This is handled in the React hooks using `queryClient.invalidateQueries()`.

### Product Mutations

When products are updated via the API, React Query hooks should invalidate:

```typescript
// In useProducts or useProduct hooks
const queryClient = useQueryClient();

// After successful mutation
queryClient.invalidateQueries({ queryKey: ['products'] }); // All product queries
queryClient.invalidateQueries({ queryKey: ['product', productId] }); // Specific product
```

### CAD History Mutations

When CAD history is modified, React Query hooks should invalidate:

```typescript
// In useCADGeneration or useCADHistory hooks
const queryClient = useQueryClient();

// After successful mutation
queryClient.invalidateQueries({ queryKey: ['cad-history'] }); // All history queries
```

---

## Cache Key Patterns

### Product Cache Keys

| Pattern | Example | Description |
|---------|---------|-------------|
| `product:{id}` | `product:123` | Single product detail |
| `products:{filters}` | `products:category=steel&page=1&limit=20` | Product list with filters |
| `products:hash:{hash}` | `products:hash:a3f5b2c1d4e6f7g8` | Product list with complex filters (hashed) |

### CAD Cache Keys

| Pattern | Example | Description |
|---------|---------|-------------|
| `cad:history:{user_id}:{page}:{limit}` | `cad:history:user123:1:10` | User's CAD history (paginated) |
| `cad:generation:{hash}` | `cad:generation:a3f5b2c1d4e6f7g8` | CAD generation result (by params hash) |
| `cad:analysis:{hash}` | `cad:analysis:a3f5b2c1d4e6f7g8` | CAD file analysis result |

### Recommendation Cache Keys

| Pattern | Example | Description |
|---------|---------|-------------|
| `recommendations:{product_id}` | `recommendations:123` | Recommendations for a product |
| `recommendations:{product_id}:{hash}` | `recommendations:123:a3f5b2c1` | Recommendations with filters |

---

## Limitations and Considerations

### Wildcard Pattern Limitations

Upstash Redis does not support wildcard deletion (e.g., `DEL products:*`). Therefore, we invalidate common cache key patterns explicitly:

- First few pages of paginated results (pages 1-3)
- Common page sizes (10, 20, 50 items)
- Common filter combinations

**Trade-off**: Some edge case cache keys may not be invalidated immediately and will expire naturally based on TTL.

### Cache Invalidation Failures

Cache invalidation is designed to fail gracefully:

```typescript
try {
  await deleteCached(key);
  console.log(`Cache invalidated: ${key}`);
} catch (error) {
  console.error('Cache invalidation error:', error);
  // Continue - don't fail the mutation
}
```

**Rationale**: A failed cache invalidation should not prevent a successful database mutation. Stale cache will expire based on TTL.

### TTL as Fallback

All cached data has a Time To Live (TTL):

- Product lists: 300 seconds (5 minutes)
- Product details: 600 seconds (10 minutes)
- CAD history: 300 seconds (5 minutes)
- CAD analysis: 86400 seconds (24 hours)
- Recommendations: 3600 seconds (1 hour)

Even if cache invalidation fails, stale data will eventually expire.

---

## Testing Cache Invalidation

### Manual Testing

1. **Product Update Test**:
   ```bash
   # View product list
   curl http://localhost:3000/api/products?page=1&limit=20
   
   # Update a product
   curl -X PUT http://localhost:3000/api/products/123 \
     -H "Content-Type: application/json" \
     -d '{"name": "Updated Product Name"}'
   
   # View product list again - should show updated name
   curl http://localhost:3000/api/products?page=1&limit=20
   ```

2. **CAD History Test**:
   ```bash
   # View history
   curl http://localhost:3000/api/cad-history?limit=10
   
   # Add new generation
   curl -X POST http://localhost:3000/api/cad-history \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Test", "category": "bracket", "format": "step", "units": "mm", "status": "completed"}'
   
   # View history again - should show new item
   curl http://localhost:3000/api/cad-history?limit=10
   ```

### Monitoring Cache Invalidation

Check server logs for cache invalidation messages:

```
Cache invalidated for product update: 123
Invalidated 5 cache keys
Cache invalidated for CAD history addition: user abc123
```

---

## Future Improvements

1. **Cache Key Registry**: Maintain a registry of all active cache keys for comprehensive invalidation
2. **Event-Driven Invalidation**: Use Redis Pub/Sub or webhooks for distributed cache invalidation
3. **Selective Invalidation**: More granular invalidation based on specific field changes
4. **Cache Warming**: Pre-populate cache after invalidation for frequently accessed data
5. **Metrics Dashboard**: Track cache hit rates and invalidation patterns

---

## Summary

| Mutation | Endpoint | Cache Keys Invalidated | React Query Keys |
|----------|----------|------------------------|------------------|
| Update Product | `PUT /api/products/[id]` | `product:{id}`, `products:*`, `recommendations:{id}*` | `['products']`, `['product', id]` |
| Delete Product | `DELETE /api/products/[id]` | `product:{id}`, `products:*`, `recommendations:{id}*` | `['products']`, `['product', id]` |
| Add CAD History | `POST /api/cad-history` | `cad:history:{user_id}:*` | `['cad-history']` |
| Delete CAD History Item | `DELETE /api/cad-history?id={id}` | `cad:history:{user_id}:*` | `['cad-history']` |
| Clear CAD History | `DELETE /api/cad-history` | `cad:history:{user_id}:*` | `['cad-history']` |

---

**Last Updated**: 2024-01-01  
**Maintained By**: Development Team
