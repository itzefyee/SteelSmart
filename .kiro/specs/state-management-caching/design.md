# Design Document

## Overview

This design implements a three-layer state management and caching architecture for the SteelSmart application:

1. **React Query Layer**: Manages server state with automatic caching, background refetching, and request deduplication
2. **Zustand Layer**: Manages client-side UI state with localStorage persistence
3. **Redis Cache Layer**: Server-side caching to reduce database load and improve API response times

The architecture follows a service-oriented pattern where business logic is separated from React hooks, making the codebase more maintainable and testable.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│  ┌────────────────────────────────────────────────┐    │
│  │  React Query Hooks (useProducts, useCAD)       │    │
│  │  + Zustand Stores (useCADStore, useUIStore)    │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                         │
│  ┌────────────────────────────────────────────────┐    │
│  │  ProductService, CADService                    │    │
│  │  (Business Logic + API Calls)                  │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    API Routes                            │
│  ┌────────────────────────────────────────────────┐    │
│  │  Redis Cache Check → Database Query            │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         ↓
         ┌───────────────┴───────────────┐
         ↓                               ↓
┌──────────────────┐          ┌──────────────────┐
│  Upstash Redis   │          │    Supabase      │
│  (Cache Layer)   │          │    Database      │
└──────────────────┘          └──────────────────┘
```

### Data Flow

1. **Component** requests data via React Query hook
2. **React Query** checks in-memory cache
   - Cache hit: Return immediately
   - Cache miss: Call service layer
3. **Service Layer** makes HTTP request to API route
4. **API Route** checks Redis cache
   - Cache hit: Return cached data
   - Cache miss: Query database, cache result, return data
5. **Response** flows back through layers, React Query caches it

## Components and Interfaces

### 1. React Query Provider Setup

**File**: `src/app/providers.tsx`

```typescript
interface ProvidersProps {
  children: React.ReactNode;
}

// QueryClient configuration with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 1 minute
      refetchOnWindowFocus: false,  // Prevent excessive refetches
      retry: 1,                     // Retry failed requests once
    },
  },
});
```

**Integration**: Wrap root layout with `<Providers>` component

### 2. Service Layer

**File**: `src/services/product.service.ts`

```typescript
interface ProductFilters {
  category?: string;
  material?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

interface ProductResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ProductService {
  static async getProducts(
    filters: ProductFilters,
    page: number,
    limit: number
  ): Promise<ProductResponse>;
  
  static async getProduct(id: string): Promise<Product>;
}
```

**File**: `src/services/cad.service.ts`

```typescript
interface CADGenerationRequest {
  description: string;
  format?: 'step' | 'stl' | 'obj' | 'gltf';
  units?: 'mm' | 'cm' | 'm' | 'in' | 'ft';
  category?: string;
}

interface CADGenerationResult {
  id: string;
  status: 'completed' | 'failed';
  model_data?: string;
  parameters?: Record<string, any>;
}

class CADService {
  static async generateCAD(
    request: CADGenerationRequest
  ): Promise<CADGenerationResult>;
  
  static async getHistory(): Promise<any[]>;
}
```

### 3. React Query Hooks

**File**: `src/hooks/useProducts.ts`

```typescript
interface UseProductsOptions {
  filters?: ProductFilters;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

function useProducts(options: UseProductsOptions): UseQueryResult<ProductResponse>;
function useProduct(id: string): UseQueryResult<Product>;
```

**Query Key Strategy**:
- Products list: `['products', filters, page, limit]`
- Single product: `['product', id]`
- CAD history: `['cad-history']`

**File**: `src/hooks/useCADGeneration.ts`

```typescript
interface UseCADGenerationOptions {
  onSuccess?: (result: CADGenerationResult) => void;
  onError?: (error: Error) => void;
}

function useCADGeneration(
  options: UseCADGenerationOptions
): UseMutationResult<CADGenerationResult, Error, CADGenerationRequest>;

function useCADHistory(): UseQueryResult<any[]>;
```

### 4. Zustand Stores

**File**: `src/stores/cad.store.ts`

```typescript
interface CADStore {
  // State
  selectedFormat: 'step' | 'stl' | 'obj' | 'gltf';
  selectedUnits: 'mm' | 'cm' | 'm' | 'in' | 'ft';
  selectedCategory: string;
  recentPrompts: string[];

  // Actions
  setFormat: (format: CADStore['selectedFormat']) => void;
  setUnits: (units: CADStore['selectedUnits']) => void;
  setCategory: (category: string) => void;
  addRecentPrompt: (prompt: string) => void;
  clearRecentPrompts: () => void;
}
```

**Persistence Strategy**:
- Use `persist` middleware with localStorage
- Key: `'cad-store'`
- Persist: `selectedFormat`, `selectedUnits`, `recentPrompts`
- Exclude: `selectedCategory` (session-only)

**File**: `src/stores/ui.store.ts` (optional, for future use)

```typescript
interface UIStore {
  viewMode: 'grid' | 'list';
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  
  setViewMode: (mode: 'grid' | 'list') => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}
```

### 5. Redis Cache Utilities

**File**: `src/lib/cache/redis-cache.ts`

```typescript
interface CacheOptions {
  ttl?: number;  // Time to live in seconds
}

// Get data from cache or fetch if not available
async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T>;

// Set data in cache
async function setCached<T>(
  key: string,
  data: T,
  ttl?: number
): Promise<void>;

// Delete data from cache
async function deleteCached(key: string): Promise<void>;

// Invalidate multiple keys
async function invalidateCachePattern(keys: string[]): Promise<void>;
```

**Cache Key Conventions**:
- Products: `products:{filters_hash}`
- Product detail: `product:{id}`
- CAD analysis: `cad:analysis:{hash}`
- Recommendations: `recommendations:{product_id}`

## Data Models

### React Query Cache Structure

```typescript
// Query cache entry
{
  queryKey: ['products', { category: 'steel' }, 1, 20],
  data: {
    products: Product[],
    pagination: {
      page: 1,
      limit: 20,
      total: 150,
      totalPages: 8
    }
  },
  dataUpdatedAt: 1700000000000,
  staleTime: 300000,  // 5 minutes
  cacheTime: 600000   // 10 minutes
}
```

### Zustand Store Structure

```typescript
// localStorage: 'cad-store'
{
  state: {
    selectedFormat: 'step',
    selectedUnits: 'mm',
    recentPrompts: [
      'Create a mounting bracket',
      'Design a flange',
      // ... up to 10 items
    ]
  },
  version: 0
}
```

### Redis Cache Structure

```typescript
// Key: "products:category=steel&page=1"
// Value: JSON string
{
  products: [...],
  pagination: {...},
  cached_at: '2024-01-01T00:00:00Z'
}

// TTL: 300 seconds (5 minutes)
```

## Error Handling

### React Query Error Handling

```typescript
// Automatic retry with exponential backoff
const { data, error, isError } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  retry: 1,  // Retry once on failure
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Error boundary for critical failures
if (isError) {
  return <ErrorMessage error={error} />;
}
```

### Redis Error Handling

```typescript
// Graceful degradation - never throw errors
try {
  const cached = await redis.get(key);
  if (cached) return cached;
} catch (error) {
  console.error('Cache error:', error);
  // Fall through to database query
}

// Always return data even if caching fails
try {
  await redis.setex(key, ttl, data);
} catch (error) {
  console.error('Cache set error:', error);
  // Continue - data is still returned to client
}
```

### Service Layer Error Handling

```typescript
// Throw descriptive errors for React Query to catch
static async getProducts(filters: ProductFilters) {
  const response = await fetch('/api/products?' + params);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }
  
  return response.json();
}
```

## Testing Strategy

### Unit Tests

1. **Service Layer Tests**
   - Mock fetch calls
   - Test error handling
   - Test request parameter building

2. **Zustand Store Tests**
   - Test state updates
   - Test persistence
   - Test action side effects

3. **Cache Utility Tests**
   - Mock Redis client
   - Test cache hit/miss scenarios
   - Test TTL behavior

### Integration Tests

1. **React Query Integration**
   - Test cache behavior with real components
   - Test refetch on stale data
   - Test mutation invalidation

2. **API Route Tests**
   - Test Redis cache integration
   - Test fallback to database
   - Test cache key generation

### Performance Tests

1. **Cache Hit Rate Monitoring**
   - Log cache hits vs misses
   - Target: >80% hit rate for product catalog

2. **Response Time Metrics**
   - Measure API response times
   - Target: <50ms for cache hits, <200ms for cache misses

3. **Database Load Reduction**
   - Monitor database query count
   - Target: 80-90% reduction in repeated queries

## Migration Strategy

### Phase 1: Foundation (Week 1)
1. Install dependencies
2. Set up React Query provider
3. Configure Upstash Redis
4. Create base utilities

### Phase 2: Products (Week 2)
1. Create ProductService
2. Convert useProducts to React Query
3. Add Redis caching to products API
4. Update product catalog components

### Phase 3: CAD Generation (Week 3)
1. Create CADService
2. Convert useCADGeneration to React Query
3. Create CAD Zustand store
4. Update CAD generator components

### Phase 4: Optimization (Week 4)
1. Fine-tune cache TTLs
2. Add cache invalidation logic
3. Performance testing
4. Documentation

## Performance Considerations

### Cache TTL Strategy

| Data Type | React Query Stale Time | Redis TTL | Rationale |
|-----------|------------------------|-----------|-----------|
| Product List | 5 minutes | 5 minutes | Moderate update frequency |
| Product Detail | 10 minutes | 10 minutes | Rarely changes |
| Categories | 15 minutes | 1 hour | Very stable |
| CAD Analysis | 1 hour | 24 hours | Expensive computation |
| Recommendations | 5 minutes | 1 hour | Personalized but cacheable |
| User Profile | 5 minutes | 10 minutes | User-specific |
| CAD History | 2 minutes | 5 minutes | Frequently updated |

### Memory Management

1. **React Query Cache Size**
   - Default: 50 queries in memory
   - Automatic garbage collection after cacheTime expires

2. **Redis Memory**
   - Upstash free tier: 10,000 commands/day
   - Monitor usage in Upstash dashboard
   - Implement cache eviction for low-priority data

3. **LocalStorage Limits**
   - Zustand stores: <1MB per store
   - Limit recentPrompts to 10 items
   - Clear old data on version updates

## Security Considerations

1. **Environment Variables**
   - Store Redis credentials in `.env.local`
   - Never commit credentials to git
   - Use different Redis instances for dev/prod

2. **Cache Key Security**
   - Don't include sensitive data in cache keys
   - Sanitize user input before using in keys
   - Use hashing for complex filter objects

3. **Data Privacy**
   - Don't cache user-specific sensitive data
   - Implement cache isolation per user where needed
   - Clear cache on logout

## Monitoring and Debugging

### Development Tools

1. **React Query DevTools**
   - View all queries and their states
   - Inspect cache contents
   - Manually trigger refetches

2. **Redux DevTools** (for Zustand)
   - Track state changes
   - Time-travel debugging
   - Action history

3. **Upstash Dashboard**
   - Monitor cache hit rates
   - View stored keys
   - Check memory usage

### Logging Strategy

```typescript
// Cache operations
console.log(`Cache hit: ${key}`);
console.log(`Cache miss: ${key}`);

// Query operations
console.log(`Query fetching: ${queryKey}`);
console.log(`Query success: ${queryKey}`);
console.log(`Query error: ${queryKey}`, error);

// Mutation operations
console.log(`Mutation started: ${mutationKey}`);
console.log(`Mutation success: ${mutationKey}`);
```

## Future Enhancements

1. **Optimistic Updates**
   - Implement for product updates
   - Rollback on error

2. **Prefetching**
   - Prefetch next page in pagination
   - Prefetch related products

3. **Background Sync**
   - Sync offline changes when online
   - Queue mutations during network failures

4. **Advanced Caching**
   - Implement cache warming
   - Add cache preloading for common queries
   - Implement stale-while-revalidate pattern
