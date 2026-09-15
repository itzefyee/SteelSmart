# State Management Guide

Complete guide to using React Query and Zustand in the SteelSmart application.

## Table of Contents

1. [Overview](#overview)
2. [React Query Usage](#react-query-usage)
3. [Zustand Store Patterns](#zustand-store-patterns)
4. [Cache Invalidation](#cache-invalidation)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)
7. [Common Patterns](#common-patterns)

---

## Overview

The SteelSmart application uses a three-layer state management architecture:

```
┌─────────────────────────────────────────┐
│         React Components                │
│  ┌───────────────────────────────────┐ │
│  │  React Query (Server State)       │ │
│  │  + Zustand (Client State)         │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Service Layer                   │
│  (ProductService, CADService)           │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         API Routes                      │
│  (Redis Cache → Database)               │
└─────────────────────────────────────────┘
```

### When to Use What

**React Query** - Use for server state:
- Fetching data from APIs
- Mutations that update server data
- Data that needs to be cached and synchronized
- Examples: products, CAD history, user profiles

**Zustand** - Use for client state:
- UI preferences (theme, view mode)
- Form state that persists across sessions
- Temporary UI state (selected items, filters)
- Examples: CAD format preferences, recent prompts

---

## React Query Usage

### Basic Query

```tsx
import { useProducts } from '@/hooks/useProducts';

function ProductList() {
  const { data, isLoading, error, refetch, isRefetching } = useProducts({
    filters: { category: 'steel' },
    page: 1,
    limit: 20,
    enabled: true // Optional: disable query conditionally
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <ProductGrid products={data.products} />
      <Pagination {...data.pagination} />
      <button 
        onClick={() => refetch()} 
        disabled={isRefetching}
      >
        {isRefetching ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
}
```

### Query with Filters

```tsx
function FilteredProducts() {
  const [filters, setFilters] = useState({
    category: 'steel',
    material: 'stainless',
    inStock: true,
    minPrice: 0,
    maxPrice: 1000
  });

  // Query automatically refetches when filters change
  const { data, isLoading } = useProducts({ filters });

  return (
    <div>
      <FilterPanel filters={filters} onChange={setFilters} />
      {isLoading ? <LoadingSpinner /> : <ProductGrid products={data.products} />}
    </div>
  );
}
```

### Single Product Query

```tsx
import { useProduct } from '@/hooks/useProducts';

function ProductDetail({ productId }: { productId: string }) {
  const { data: product, isLoading, error } = useProduct(productId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!product) return <NotFound />;

  return <ProductDetailView product={product} />;
}
```

### Mutations (CAD Generation)

```tsx
import { useCADGeneration } from '@/hooks/useCADGeneration';
import { useCADStore } from '@/stores/cad.store';

function CADGenerator() {
  const [prompt, setPrompt] = useState('');
  const { selectedFormat, selectedUnits, addRecentPrompt } = useCADStore();
  
  const { mutate, isPending, data, error } = useCADGeneration({
    onSuccess: (result) => {
      console.log('CAD generated:', result);
      addRecentPrompt(prompt);
      setPrompt('');
    },
    onError: (error) => {
      console.error('Generation failed:', error);
    }
  });

  const handleGenerate = () => {
    mutate({
      description: prompt,
      format: selectedFormat,
      units: selectedUnits
    });
  };

  return (
    <div>
      <textarea 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your CAD model..."
      />
      <button 
        onClick={handleGenerate} 
        disabled={isPending || !prompt}
      >
        {isPending ? 'Generating...' : 'Generate CAD'}
      </button>
      {error && <ErrorMessage error={error} />}
      {data && <CADResult result={data} />}
    </div>
  );
}
```

### Query History

```tsx
import { useCADHistory } from '@/hooks/useCADGeneration';

function CADHistoryList() {
  const { data: history, isLoading, refetch } = useCADHistory();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Generation History</h2>
      <button onClick={() => refetch()}>Refresh</button>
      <ul>
        {history?.map(item => (
          <li key={item.id}>
            <span>{item.description}</span>
            <span>{item.format}</span>
            <span>{new Date(item.created_at).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Zustand Store Patterns

### Basic Store Usage

```tsx
import { useCADStore } from '@/stores/cad.store';

function CADSettings() {
  const { 
    selectedFormat, 
    selectedUnits, 
    setFormat, 
    setUnits 
  } = useCADStore();

  return (
    <div>
      <select 
        value={selectedFormat} 
        onChange={(e) => setFormat(e.target.value)}
      >
        <option value="step">STEP</option>
        <option value="stl">STL</option>
        <option value="obj">OBJ</option>
        <option value="gltf">glTF</option>
      </select>

      <select 
        value={selectedUnits} 
        onChange={(e) => setUnits(e.target.value)}
      >
        <option value="mm">Millimeters</option>
        <option value="cm">Centimeters</option>
        <option value="m">Meters</option>
        <option value="in">Inches</option>
        <option value="ft">Feet</option>
      </select>
    </div>
  );
}
```

### Recent Prompts

```tsx
function RecentPrompts() {
  const { recentPrompts, addRecentPrompt, clearRecentPrompts } = useCADStore();

  return (
    <div>
      <h3>Recent Prompts</h3>
      {recentPrompts.length === 0 ? (
        <p>No recent prompts</p>
      ) : (
        <ul>
          {recentPrompts.map((prompt, index) => (
            <li key={index} onClick={() => addRecentPrompt(prompt)}>
              {prompt}
            </li>
          ))}
        </ul>
      )}
      {recentPrompts.length > 0 && (
        <button onClick={clearRecentPrompts}>Clear All</button>
      )}
    </div>
  );
}
```

### Selective Subscription

```tsx
// Only subscribe to specific state slices for better performance
function FormatSelector() {
  // Only re-renders when selectedFormat changes
  const selectedFormat = useCADStore(state => state.selectedFormat);
  const setFormat = useCADStore(state => state.setFormat);

  return (
    <select value={selectedFormat} onChange={(e) => setFormat(e.target.value)}>
      <option value="step">STEP</option>
      <option value="stl">STL</option>
    </select>
  );
}
```

---

## Cache Invalidation

### Manual Refetch

```tsx
function ProductListWithRefresh() {
  const { data, refetch, isRefetching } = useProducts();

  return (
    <div>
      <button onClick={() => refetch()} disabled={isRefetching}>
        {isRefetching ? 'Refreshing...' : 'Refresh Products'}
      </button>
      <ProductGrid products={data?.products} />
    </div>
  );
}
```

### Invalidate After Mutation

```tsx
import { useQueryClient } from '@tanstack/react-query';

function ProductEditor({ productId }: { productId: string }) {
  const queryClient = useQueryClient();

  const updateProduct = async (updates: Partial<Product>) => {
    await ProductService.updateProduct(productId, updates);
    
    // Invalidate all product queries
    queryClient.invalidateQueries({ queryKey: ['products'] });
    
    // Invalidate specific product
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
  };

  return <ProductForm onSubmit={updateProduct} />;
}
```

### Automatic Invalidation in Mutations

```tsx
const { mutate } = useCADGeneration({
  onSuccess: () => {
    // CAD history is automatically invalidated by the hook
    // No manual invalidation needed
  }
});
```

---

## Error Handling

### Query Errors

```tsx
function ProductListWithErrors() {
  const { data, error, isError, refetch } = useProducts();

  if (isError) {
    return (
      <div className="error-container">
        <h3>Failed to load products</h3>
        <p>{error.message}</p>
        <button onClick={() => refetch()}>Try Again</button>
      </div>
    );
  }

  return <ProductGrid products={data?.products} />;
}
```

### Mutation Errors

```tsx
function CADGeneratorWithErrors() {
  const [errorMessage, setErrorMessage] = useState('');

  const { mutate, isPending, error } = useCADGeneration({
    onError: (error) => {
      setErrorMessage(error.message);
      // Log to monitoring service
      console.error('CAD generation failed:', error);
    },
    onSuccess: () => {
      setErrorMessage('');
    }
  });

  return (
    <div>
      {errorMessage && (
        <div className="error-banner">
          {errorMessage}
          <button onClick={() => setErrorMessage('')}>Dismiss</button>
        </div>
      )}
      <button onClick={() => mutate({ description: 'bracket' })} disabled={isPending}>
        Generate
      </button>
    </div>
  );
}
```

### Global Error Boundary

The application includes a global error boundary that catches React Query errors:

```tsx
// Already configured in src/app/providers.tsx
<ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
</ErrorBoundary>
```

---

## Best Practices

### 1. Use Descriptive Query Keys

```tsx
// ❌ Bad: Generic keys
['products']

// ✅ Good: Specific keys with parameters
['products', { category: 'steel', page: 1, limit: 20 }]
```

### 2. Set Appropriate Stale Times

```tsx
// Fast-changing data (user activity)
staleTime: 30 * 1000 // 30 seconds

// Moderate data (product lists)
staleTime: 5 * 60 * 1000 // 5 minutes

// Slow-changing data (categories, settings)
staleTime: 15 * 60 * 1000 // 15 minutes

// Expensive computations (CAD analysis)
staleTime: 60 * 60 * 1000 // 1 hour
```

### 3. Handle Loading States

```tsx
function ProductList() {
  const { data, isLoading, isFetching } = useProducts();

  return (
    <div>
      {/* Show spinner only on initial load */}
      {isLoading && <LoadingSpinner />}
      
      {/* Show subtle indicator on background refetch */}
      {isFetching && !isLoading && <RefreshIndicator />}
      
      {data && <ProductGrid products={data.products} />}
    </div>
  );
}
```

### 4. Optimize Re-renders with Zustand

```tsx
// ❌ Bad: Subscribes to entire store
const store = useCADStore();

// ✅ Good: Subscribe only to needed values
const selectedFormat = useCADStore(state => state.selectedFormat);
const setFormat = useCADStore(state => state.setFormat);
```

### 5. Use Enabled Option for Conditional Queries

```tsx
function ProductDetail({ productId }: { productId: string | null }) {
  // Only fetch when productId is available
  const { data } = useProduct(productId, {
    enabled: !!productId
  });

  return productId ? <ProductView product={data} /> : <SelectProduct />;
}
```

---

## Common Patterns

### Pagination

```tsx
function PaginatedProducts() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProducts({ page, limit: 20 });

  return (
    <div>
      <ProductGrid products={data?.products} />
      <div className="pagination">
        <button 
          onClick={() => setPage(p => p - 1)} 
          disabled={page === 1 || isLoading}
        >
          Previous
        </button>
        <span>Page {page} of {data?.pagination.totalPages}</span>
        <button 
          onClick={() => setPage(p => p + 1)} 
          disabled={page === data?.pagination.totalPages || isLoading}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### Search with Debounce

```tsx
import { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';

function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useProducts({
    filters: { search: debouncedSearch },
    enabled: debouncedSearch.length > 2
  });

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search products..."
      />
      {isLoading && <LoadingSpinner />}
      {data && <ProductGrid products={data.products} />}
    </div>
  );
}
```

### Optimistic Updates

```tsx
import { useQueryClient } from '@tanstack/react-query';

function ProductFavorite({ productId }: { productId: string }) {
  const queryClient = useQueryClient();

  const toggleFavorite = async () => {
    // Optimistically update UI
    queryClient.setQueryData(['product', productId], (old: Product) => ({
      ...old,
      isFavorite: !old.isFavorite
    }));

    try {
      await ProductService.toggleFavorite(productId);
    } catch (error) {
      // Rollback on error
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    }
  };

  return <button onClick={toggleFavorite}>Toggle Favorite</button>;
}
```

### Prefetching

```tsx
import { useQueryClient } from '@tanstack/react-query';

function ProductCard({ product }: { product: Product }) {
  const queryClient = useQueryClient();

  const prefetchProduct = () => {
    queryClient.prefetchQuery({
      queryKey: ['product', product.id],
      queryFn: () => ProductService.getProduct(product.id),
      staleTime: 5 * 60 * 1000
    });
  };

  return (
    <div onMouseEnter={prefetchProduct}>
      <Link href={`/catalog/${product.id}`}>
        {product.name}
      </Link>
    </div>
  );
}
```

---

## Troubleshooting

### Query Not Refetching

**Problem**: Data doesn't update after changes

**Solution**: Check staleTime and manually invalidate if needed
```tsx
queryClient.invalidateQueries({ queryKey: ['products'] });
```

### Too Many Requests

**Problem**: API called too frequently

**Solution**: Increase staleTime or disable refetchOnWindowFocus
```tsx
const { data } = useProducts({
  staleTime: 10 * 60 * 1000, // 10 minutes
});
```

### Store Not Persisting

**Problem**: Zustand state resets on page reload

**Solution**: Verify persist middleware is configured
```tsx
// Check src/stores/cad.store.ts has persist middleware
persist(
  (set) => ({ /* state */ }),
  { name: 'cad-store' }
)
```

### Memory Leaks

**Problem**: Application slows down over time

**Solution**: Use selective subscriptions in Zustand
```tsx
// Instead of: const store = useCADStore();
const format = useCADStore(state => state.selectedFormat);
```

---

## Next Steps

- Read [CACHING_STRATEGY.md](./CACHING_STRATEGY.md) for Redis caching patterns
- Read [MIGRATION_GUIDE_STATE.md](./MIGRATION_GUIDE_STATE.md) to migrate existing hooks
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Review [PERFORMANCE_MONITORING.md](./PERFORMANCE_MONITORING.md) for optimization tips
