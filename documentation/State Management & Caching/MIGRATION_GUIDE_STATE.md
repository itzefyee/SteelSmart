# State Management Migration Guide

Guide for migrating existing hooks and components to React Query and Zustand.

## Table of Contents

1. [Overview](#overview)
2. [Migration Checklist](#migration-checklist)
3. [Converting useState to React Query](#converting-usestate-to-react-query)
4. [Converting useState to Zustand](#converting-usestate-to-zustand)
5. [Migrating Custom Hooks](#migrating-custom-hooks)
6. [Component Migration Examples](#component-migration-examples)
7. [Common Pitfalls](#common-pitfalls)
8. [Testing After Migration](#testing-after-migration)

---

## Overview

This guide helps you migrate from traditional React state management to the new architecture:

**Before**: `useState` + `useEffect` + manual caching
**After**: React Query (server state) + Zustand (client state)

### When to Migrate

✅ **Migrate to React Query** when:
- Fetching data from APIs
- Data needs to be cached
- Multiple components need the same data
- Need automatic refetching

✅ **Migrate to Zustand** when:
- UI preferences need persistence
- State is shared across many components
- Need localStorage sync
- Form state that persists

❌ **Keep useState** when:
- Local component state only
- Temporary UI state (modals, dropdowns)
- Form inputs (unless persistence needed)

---

## Migration Checklist

### Pre-Migration

- [ ] Identify all data fetching in your component
- [ ] Determine if data is server state or client state
- [ ] Check if data is already cached elsewhere
- [ ] Review error handling requirements
- [ ] Plan cache invalidation strategy

### During Migration

- [ ] Create or use existing service layer function
- [ ] Replace useState/useEffect with React Query hook
- [ ] Update loading and error states
- [ ] Test cache behavior
- [ ] Add cache invalidation if needed

### Post-Migration

- [ ] Remove old useState and useEffect code
- [ ] Test all user flows
- [ ] Verify cache hit rates
- [ ] Check for memory leaks
- [ ] Update component tests

---

## Converting useState to React Query

### Pattern 1: Simple Data Fetching

**Before (useState + useEffect):**
```tsx
function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        const data = await response.json();
        setProducts(data.products);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <ProductGrid products={products} />;
}
```

**After (React Query):**
```tsx
import { useProducts } from '@/hooks/useProducts';

function ProductList() {
  const { data, isLoading, error } = useProducts();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <ProductGrid products={data.products} />;
}
```

**Benefits:**
- ✅ 15 lines → 5 lines
- ✅ Automatic caching
- ✅ No manual cleanup needed
- ✅ Automatic refetching

### Pattern 2: Data Fetching with Filters

**Before:**
```tsx
function FilteredProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ category: 'steel' });

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams(filters);
        const response = await fetch(`/api/products?${params}`);
        const data = await response.json();
        setProducts(data.products);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [filters]); // Refetch when filters change

  return (
    <div>
      <FilterPanel filters={filters} onChange={setFilters} />
      {loading ? <LoadingSpinner /> : <ProductGrid products={products} />}
    </div>
  );
}
```

**After:**
```tsx
import { useProducts } from '@/hooks/useProducts';

function FilteredProducts() {
  const [filters, setFilters] = useState({ category: 'steel' });
  const { data, isLoading } = useProducts({ filters });

  return (
    <div>
      <FilterPanel filters={filters} onChange={setFilters} />
      {isLoading ? <LoadingSpinner /> : <ProductGrid products={data.products} />}
    </div>
  );
}
```

**Benefits:**
- ✅ Automatic refetch when filters change
- ✅ Each filter combination cached separately
- ✅ No manual dependency tracking

### Pattern 3: Manual Refetch

**Before:**
```tsx
function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data.products);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div>
      <button onClick={fetchProducts} disabled={refreshing}>
        {refreshing ? 'Refreshing...' : 'Refresh'}
      </button>
      <ProductGrid products={products} />
    </div>
  );
}
```

**After:**
```tsx
import { useProducts } from '@/hooks/useProducts';

function ProductList() {
  const { data, refetch, isRefetching } = useProducts();

  return (
    <div>
      <button onClick={() => refetch()} disabled={isRefetching}>
        {isRefetching ? 'Refreshing...' : 'Refresh'}
      </button>
      <ProductGrid products={data.products} />
    </div>
  );
}
```

---

## Converting useState to Zustand

### Pattern 1: Persistent UI Preferences

**Before:**
```tsx
function CADGenerator() {
  const [format, setFormat] = useState('step');
  const [units, setUnits] = useState('mm');

  // Lost on page reload!
  
  return (
    <div>
      <select value={format} onChange={(e) => setFormat(e.target.value)}>
        <option value="step">STEP</option>
        <option value="stl">STL</option>
      </select>
      <select value={units} onChange={(e) => setUnits(e.target.value)}>
        <option value="mm">mm</option>
        <option value="cm">cm</option>
      </select>
    </div>
  );
}
```

**After:**
```tsx
import { useCADStore } from '@/stores/cad.store';

function CADGenerator() {
  const { selectedFormat, selectedUnits, setFormat, setUnits } = useCADStore();

  // Persists across page reloads!
  
  return (
    <div>
      <select value={selectedFormat} onChange={(e) => setFormat(e.target.value)}>
        <option value="step">STEP</option>
        <option value="stl">STL</option>
      </select>
      <select value={selectedUnits} onChange={(e) => setUnits(e.target.value)}>
        <option value="mm">mm</option>
        <option value="cm">cm</option>
      </select>
    </div>
  );
}
```

**Benefits:**
- ✅ Persists to localStorage automatically
- ✅ Shared across all components
- ✅ No prop drilling

### Pattern 2: Recent Items List

**Before:**
```tsx
function SearchBar() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const addSearch = (search: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== search);
      return [search, ...filtered].slice(0, 10);
    });
  };

  // Lost on page reload!
  
  return (
    <div>
      <input onSubmit={(e) => addSearch(e.target.value)} />
      <ul>
        {recentSearches.map(search => (
          <li key={search}>{search}</li>
        ))}
      </ul>
    </div>
  );
}
```

**After:**
```tsx
import { useCADStore } from '@/stores/cad.store';

function PromptInput() {
  const { recentPrompts, addRecentPrompt } = useCADStore();

  // Persists across page reloads!
  
  return (
    <div>
      <input onSubmit={(e) => addRecentPrompt(e.target.value)} />
      <ul>
        {recentPrompts.map(prompt => (
          <li key={prompt}>{prompt}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Migrating Custom Hooks

### Example: useProducts Hook

**Before (Custom Hook with useState):**
```tsx
// src/hooks/useProducts.ts
import { useState, useEffect } from 'react';

export function useProducts(filters = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const params = new URLSearchParams(filters);
        const response = await fetch(`/api/products?${params}`);
        const data = await response.json();
        setProducts(data.products);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [JSON.stringify(filters)]);

  return { products, loading, error };
}
```

**After (React Query Hook):**
```tsx
// src/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { ProductService } from '@/services/product.service';

export function useProducts(options = {}) {
  const { filters = {}, page = 1, limit = 20, enabled = true } = options;

  return useQuery({
    queryKey: ['products', filters, page, limit],
    queryFn: () => ProductService.getProducts(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  });
}
```

**Create Service Layer:**
```tsx
// src/services/product.service.ts
export class ProductService {
  static async getProducts(filters: ProductFilters, page: number, limit: number) {
    const params = new URLSearchParams({
      ...filters,
      page: String(page),
      limit: String(limit),
    });

    const response = await fetch(`/api/products?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

---

## Component Migration Examples

### Example 1: Product Catalog Page

**Before:**
```tsx
// src/app/catalog/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ category: '' });

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams(filters);
        const response = await fetch(`/api/products?${params}`);
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        setProducts(data.products);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [filters]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <FilterPanel filters={filters} onChange={setFilters} />
      <ProductGrid products={products} />
    </div>
  );
}
```

**After:**
```tsx
// src/app/catalog/page.tsx
'use client';

import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';

export default function CatalogPage() {
  const [filters, setFilters] = useState({ category: '' });
  const { data, isLoading, error } = useProducts({ filters });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <FilterPanel filters={filters} onChange={setFilters} />
      <ProductGrid products={data.products} />
    </div>
  );
}
```

### Example 2: CAD Generator Page

**Before:**
```tsx
// src/app/cad-generator/page.tsx
'use client';

import { useState } from 'react';

export default function CADGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [format, setFormat] = useState('step');
  const [units, setUnits] = useState('mm');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const response = await fetch('/api/generate-cad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: prompt, format, units }),
      });
      
      if (!response.ok) throw new Error('Generation failed');
      
      const data = await response.json();
      setResult(data);
      setPrompt('');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <select value={format} onChange={(e) => setFormat(e.target.value)}>
        <option value="step">STEP</option>
        <option value="stl">STL</option>
      </select>
      <select value={units} onChange={(e) => setUnits(e.target.value)}>
        <option value="mm">mm</option>
        <option value="cm">cm</option>
      </select>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button onClick={handleGenerate} disabled={generating}>
        {generating ? 'Generating...' : 'Generate'}
      </button>
      {error && <div>Error: {error}</div>}
      {result && <CADResult result={result} />}
    </div>
  );
}
```

**After:**
```tsx
// src/app/cad-generator/page.tsx
'use client';

import { useState } from 'react';
import { useCADGeneration } from '@/hooks/useCADGeneration';
import { useCADStore } from '@/stores/cad.store';

export default function CADGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const { selectedFormat, selectedUnits, setFormat, setUnits, addRecentPrompt } = useCADStore();
  
  const { mutate, isPending, data, error } = useCADGeneration({
    onSuccess: (result) => {
      addRecentPrompt(prompt);
      setPrompt('');
    }
  });

  const handleGenerate = () => {
    mutate({
      description: prompt,
      format: selectedFormat,
      units: selectedUnits,
    });
  };

  return (
    <div>
      <select value={selectedFormat} onChange={(e) => setFormat(e.target.value)}>
        <option value="step">STEP</option>
        <option value="stl">STL</option>
      </select>
      <select value={selectedUnits} onChange={(e) => setUnits(e.target.value)}>
        <option value="mm">mm</option>
        <option value="cm">cm</option>
      </select>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button onClick={handleGenerate} disabled={isPending}>
        {isPending ? 'Generating...' : 'Generate'}
      </button>
      {error && <div>Error: {error.message}</div>}
      {data && <CADResult result={data} />}
    </div>
  );
}
```

---

## Common Pitfalls

### 1. Forgetting to Update Loading States

```tsx
// ❌ Wrong: Using old loading variable
const { data, isLoading } = useProducts();
if (loading) return <LoadingSpinner />; // 'loading' doesn't exist!

// ✅ Correct: Use isLoading from React Query
if (isLoading) return <LoadingSpinner />;
```

### 2. Not Handling Undefined Data

```tsx
// ❌ Wrong: data might be undefined during loading
const { data, isLoading } = useProducts();
return <ProductGrid products={data.products} />; // Error if data is undefined!

// ✅ Correct: Check loading state first
if (isLoading) return <LoadingSpinner />;
return <ProductGrid products={data.products} />;
```

### 3. Incorrect Query Keys

```tsx
// ❌ Wrong: Query key doesn't include all dependencies
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: () => fetchProducts(filters), // filters not in key!
});

// ✅ Correct: Include all dependencies in query key
const { data } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => fetchProducts(filters),
});
```

### 4. Not Removing Old useEffect

```tsx
// ❌ Wrong: Keeping old useEffect causes double fetching
const { data } = useProducts();

useEffect(() => {
  fetchProducts(); // Still here! Remove this!
}, []);

// ✅ Correct: Remove old useEffect
const { data } = useProducts();
// That's it!
```

### 5. Mutating Zustand State Directly

```tsx
// ❌ Wrong: Mutating state directly
const store = useCADStore();
store.recentPrompts.push(newPrompt); // Don't mutate!

// ✅ Correct: Use action methods
const { addRecentPrompt } = useCADStore();
addRecentPrompt(newPrompt);
```

---

## Testing After Migration

### Test Checklist

- [ ] **Initial Load**: Data loads correctly on first render
- [ ] **Loading States**: Loading spinner shows during fetch
- [ ] **Error States**: Errors display properly
- [ ] **Refetch**: Manual refetch works
- [ ] **Filters**: Changing filters refetches data
- [ ] **Cache**: Navigating away and back uses cache
- [ ] **Persistence**: Zustand state persists across reloads
- [ ] **Mutations**: Mutations update cache correctly

### Example Test

```tsx
// Before migration test
import { render, screen, waitFor } from '@testing-library/react';
import ProductList from './ProductList';

test('loads and displays products', async () => {
  render(<ProductList />);
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('Product 1')).toBeInTheDocument();
  });
});
```

```tsx
// After migration test (with React Query wrapper)
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductList from './ProductList';

test('loads and displays products', async () => {
  const queryClient = new QueryClient();
  
  render(
    <QueryClientProvider client={queryClient}>
      <ProductList />
    </QueryClientProvider>
  );
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('Product 1')).toBeInTheDocument();
  });
});
```

---

## Next Steps

1. Start with simple components (read-only data)
2. Move to complex components (filters, pagination)
3. Migrate mutations last (create, update, delete)
4. Test thoroughly after each migration
5. Monitor cache performance

For more information:
- [STATE_MANAGEMENT_GUIDE.md](./STATE_MANAGEMENT_GUIDE.md) - Complete usage guide
- [CACHING_STRATEGY.md](./CACHING_STRATEGY.md) - Redis caching patterns
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
