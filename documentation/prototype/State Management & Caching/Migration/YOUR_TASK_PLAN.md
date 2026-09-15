# 🎯 Your Task: Step-by-Step Implementation Plan

## 📋 Task Overview

You need to implement:
1. ✅ **React Query** - Server state management (PARTIALLY COMPLETE)
2. ✅ **Zustand** - Client state management (MINIMAL - NEEDS EXPANSION)
3. ✅ **Upstash Redis** - Server-side caching (PARTIALLY COMPLETE)

**Status**: Foundation is in place, but many components still use direct `fetch()` calls.

**Exclude**: Rate limiting and validation (already documented but not your task)

---

## 📊 Current Status (December 15, 2025)

### ✅ Already Implemented
- React Query: Products, CAD operations, categories, reports
- Zustand: CAD preferences store only
- Redis: Product service caching only

### 🚧 Needs Migration
- RFQ components (direct fetch)
- Recommendation components (direct fetch)
- Admin components (direct fetch)
- Auth provider (no caching)

### 📚 New Documentation Available
- **STATE_MANAGEMENT_EXPANSION_ANALYSIS.md** - Comprehensive analysis of what needs to be done
- **IMPLEMENTATION_ROADMAP.md** - 4-week step-by-step implementation plan

**👉 READ THESE FIRST before continuing with the original plan below!**

---

## 🚀 Phase 1: Setup & Foundation (Day 1-2)

### Step 1.1: Install Dependencies

```bash
cd SteelSmart
npm install @tanstack/react-query @upstash/redis zustand
npm install -D @tanstack/react-query-devtools
```

### Step 1.2: Set Up Environment Variables

Add to `SteelSmart/.env.local`:
```bash
# Upstash Redis - Get from https://console.upstash.com/
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

**How to get Upstash credentials:**
1. Go to https://console.upstash.com/
2. Sign up/login (free tier available)
3. Click "Create Database"
4. Choose region closest to your Vercel deployment
5. Copy REST URL and REST TOKEN

### Step 1.3: Create React Query Provider

**Create**: `SteelSmart/src/app/providers.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Step 1.4: Update Root Layout

**Update**: `SteelSmart/src/app/layout.tsx`

Find the existing layout and wrap children with Providers:

```typescript
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### Step 1.5: Create Redis Cache Utility

**Create**: `SteelSmart/src/lib/cache/redis-cache.ts`

```typescript
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Get data from cache or fetch if not available
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600 // 1 hour default
): Promise<T> {
  try {
    // Try to get from cache
    const cached = await redis.get<T>(key);
    
    if (cached !== null) {
      console.log(`Cache hit: ${key}`);
      return cached;
    }

    console.log(`Cache miss: ${key}`);
    
    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    await redis.setex(key, ttl, JSON.stringify(data));

    return data;
  } catch (error) {
    console.error('Cache error:', error);
    // Fallback to direct fetch if cache fails
    return fetcher();
  }
}

/**
 * Set data in cache
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttl: number = 3600
): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete data from cache
 */
export async function deleteCached(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Invalidate cache by pattern (manual key tracking)
 * Note: Upstash REST API doesn't support KEYS command
 * You need to maintain a list of keys or use prefixes
 */
export async function invalidateCachePattern(keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}
```

### Step 1.6: Test Setup

**Create**: `SteelSmart/src/app/test-setup/page.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';

export default function TestSetupPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['test'],
    queryFn: async () => {
      return { message: 'React Query is working!' };
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Setup Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-green-100 rounded">
          <h2 className="font-bold">✅ React Query</h2>
          <p>{isLoading ? 'Loading...' : data?.message}</p>
        </div>
        
        <div className="p-4 bg-blue-100 rounded">
          <h2 className="font-bold">ℹ️ Next Steps</h2>
          <p>Open React Query DevTools (bottom-left icon)</p>
        </div>
      </div>
    </div>
  );
}
```

**Test it:**
1. Run `npm run dev`
2. Visit `http://localhost:3000/test-setup`
3. Check if React Query DevTools appears (bottom-left)
4. Verify "React Query is working!" message

---

## 🎯 Phase 2: Migrate Products (Day 3-4)

### Step 2.1: Create Service Layer

**Create**: `SteelSmart/src/services/product.service.ts`

```typescript
import type { Product } from '@/lib/supabase';

export interface ProductFilters {
  category?: string;
  material?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface ProductResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ProductService {
  /**
   * Fetch products with filters
   */
  static async getProducts(
    filters: ProductFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ProductResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters.category) params.append('category', filters.category);
    if (filters.material) params.append('material', filters.material);
    if (filters.inStock !== undefined) params.append('inStock', filters.inStock.toString());
    if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`/api/products?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch single product by ID
   */
  static async getProduct(id: string): Promise<Product> {
    const response = await fetch(`/api/products/${id}`);

    if (!response.ok) {
      throw new Error(`Product not found: ${id}`);
    }

    return response.json();
  }
}
```

### Step 2.2: Create React Query Hook

**Update**: `SteelSmart/src/hooks/useProducts.ts`

```typescript
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { ProductService, ProductFilters, ProductResponse } from '@/services/product.service';
import type { Product } from '@/lib/supabase';

export interface UseProductsOptions {
  filters?: ProductFilters;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

/**
 * Fetch products with React Query
 */
export function useProducts(
  options: UseProductsOptions = {}
): UseQueryResult<ProductResponse, Error> {
  const {
    filters = {},
    page = 1,
    limit = 20,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: ['products', filters, page, limit],
    queryFn: () => ProductService.getProducts(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  });
}

/**
 * Fetch single product by ID
 */
export function useProduct(id: string): UseQueryResult<Product, Error> {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => ProductService.getProduct(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id,
  });
}
```

### Step 2.3: Add Redis Caching to API Route

**Update**: `SteelSmart/src/app/api/products/route.ts`

Add Redis caching at the top of the GET handler:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getCached } from '@/lib/cache/redis-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = searchParams.toString();
    const cacheKey = `products:${filters || 'all'}`;

    // Use Redis cache
    const result = await getCached(
      cacheKey,
      async () => {
        // Fetch from database
        const supabase = await getSupabaseServer();
        let query = supabase.from('products').select('*', { count: 'exact' });

        // Apply filters
        const category = searchParams.get('category');
        if (category) query = query.eq('category', category);

        const material = searchParams.get('material');
        if (material) query = query.eq('material', material);

        const search = searchParams.get('search');
        if (search) query = query.ilike('name', `%${search}%`);

        const { data, error, count } = await query;

        if (error) throw error;

        return {
          products: data || [],
          pagination: {
            page: parseInt(searchParams.get('page') || '1'),
            limit: parseInt(searchParams.get('limit') || '20'),
            total: count || 0,
            totalPages: Math.ceil((count || 0) / 20),
          },
        };
      },
      300 // 5 minutes TTL
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
```

### Step 2.4: Update Components

**Update**: `SteelSmart/src/app/catalog/page.tsx`

Replace the old hook usage with the new one:

```typescript
'use client';

import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';

export default function CatalogPage() {
  const [filters, setFilters] = useState({});
  const { data, isLoading, error, refetch } = useProducts({ filters });

  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Product Catalog</h1>
      <button onClick={() => refetch()}>Refresh</button>
      
      <div className="grid grid-cols-3 gap-4">
        {data?.products.map((product) => (
          <div key={product.id} className="border p-4">
            <h3>{product.name}</h3>
            <p>${product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎨 Phase 3: Migrate CAD Generation (Day 5-6)

### Step 3.1: Create Zustand Store

**Create**: `SteelSmart/src/stores/cad.store.ts`

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

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

export const useCADStore = create<CADStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        selectedFormat: 'step',
        selectedUnits: 'mm',
        selectedCategory: 'custom',
        recentPrompts: [],

        // Actions
        setFormat: (format) => set({ selectedFormat: format }),
        setUnits: (units) => set({ selectedUnits: units }),
        setCategory: (category) => set({ selectedCategory: category }),

        addRecentPrompt: (prompt) =>
          set((state) => ({
            recentPrompts: [
              prompt,
              ...state.recentPrompts.filter((p) => p !== prompt),
            ].slice(0, 10), // Keep last 10
          })),

        clearRecentPrompts: () => set({ recentPrompts: [] }),
      }),
      {
        name: 'cad-store', // localStorage key
        partialize: (state) => ({
          selectedFormat: state.selectedFormat,
          selectedUnits: state.selectedUnits,
          recentPrompts: state.recentPrompts,
        }),
      }
    ),
    {
      name: 'CADStore', // DevTools name
    }
  )
);
```

### Step 3.2: Create CAD Service

**Create**: `SteelSmart/src/services/cad.service.ts`

```typescript
export interface CADGenerationRequest {
  description: string;
  format?: 'step' | 'stl' | 'obj' | 'gltf';
  units?: 'mm' | 'cm' | 'm' | 'in' | 'ft';
  category?: string;
}

export interface CADGenerationResult {
  id: string;
  status: 'completed' | 'failed';
  model_data?: string;
  parameters?: Record<string, any>;
}

export class CADService {
  /**
   * Generate CAD model from text prompt
   */
  static async generateCAD(
    request: CADGenerationRequest
  ): Promise<CADGenerationResult> {
    const response = await fetch('/api/generate-cad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate CAD');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get CAD generation history
   */
  static async getHistory(): Promise<any[]> {
    const response = await fetch('/api/cad-history');

    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }

    return response.json();
  }
}
```

### Step 3.3: Create React Query Hook

**Update**: `SteelSmart/src/hooks/useCADGeneration.ts`

```typescript
import { useMutation, useQuery, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { CADService, CADGenerationRequest, CADGenerationResult } from '@/services/cad.service';
import { useCADStore } from '@/stores/cad.store';

export interface UseCADGenerationOptions {
  onSuccess?: (result: CADGenerationResult) => void;
  onError?: (error: Error) => void;
}

/**
 * Generate CAD models with React Query mutation
 */
export function useCADGeneration(
  options: UseCADGenerationOptions = {}
): UseMutationResult<CADGenerationResult, Error, CADGenerationRequest> {
  const queryClient = useQueryClient();
  const addRecentPrompt = useCADStore((state) => state.addRecentPrompt);

  return useMutation({
    mutationFn: (request: CADGenerationRequest) => CADService.generateCAD(request),

    onSuccess: (data, variables) => {
      // Add to recent prompts
      addRecentPrompt(variables.description);

      // Invalidate history cache
      queryClient.invalidateQueries({ queryKey: ['cad-history'] });

      // Call custom success handler
      options.onSuccess?.(data);
    },

    onError: (error) => {
      console.error('CAD generation failed:', error);
      options.onError?.(error);
    },
  });
}

/**
 * Fetch CAD generation history
 */
export function useCADHistory() {
  return useQuery({
    queryKey: ['cad-history'],
    queryFn: () => CADService.getHistory(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
```

### Step 3.4: Update CAD Generator Component

**Update**: `SteelSmart/src/app/cad-generator/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useCADGeneration } from '@/hooks/useCADGeneration';
import { useCADStore } from '@/stores/cad.store';

export default function CADGeneratorPage() {
  const [prompt, setPrompt] = useState('');

  // Zustand for UI state
  const format = useCADStore((state) => state.selectedFormat);
  const units = useCADStore((state) => state.selectedUnits);
  const setFormat = useCADStore((state) => state.setFormat);
  const setUnits = useCADStore((state) => state.setUnits);
  const recentPrompts = useCADStore((state) => state.recentPrompts);

  // React Query mutation
  const { mutate, isPending, data, error } = useCADGeneration({
    onSuccess: (result) => {
      console.log('Generated:', result.id);
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    mutate({ description: prompt, format, units });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">CAD Generator</h1>

      {/* Format Selection */}
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as any)}
        className="mb-4"
      >
        <option value="step">STEP</option>
        <option value="stl">STL</option>
        <option value="obj">OBJ</option>
      </select>

      {/* Prompt Input */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the part..."
        disabled={isPending}
        className="w-full p-2 border mb-4"
      />

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isPending || !prompt.trim()}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {isPending ? 'Generating...' : 'Generate CAD'}
      </button>

      {/* Error */}
      {error && <div className="text-red-500 mt-4">{error.message}</div>}

      {/* Recent Prompts */}
      {recentPrompts.length > 0 && (
        <div className="mt-8">
          <h3 className="font-bold mb-2">Recent Prompts</h3>
          {recentPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => setPrompt(p)}
              className="block text-sm text-blue-600 hover:underline"
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Testing Checklist

### Test React Query
- [ ] Open React Query DevTools (bottom-left icon)
- [ ] Navigate to catalog page
- [ ] Check if 'products' query appears in DevTools
- [ ] Verify cache behavior (navigate away and back)
- [ ] Check staleTime (data should stay fresh for 5 min)

### Test Zustand
- [ ] Open Redux DevTools (browser extension)
- [ ] Change format/units in CAD generator
- [ ] Refresh page - settings should persist
- [ ] Check localStorage for 'cad-store' key
- [ ] Generate CAD - check recent prompts

### Test Redis
- [ ] Go to Upstash dashboard
- [ ] Check "Data Browser" tab
- [ ] Look for keys like `products:all`
- [ ] Verify TTL (time to live)
- [ ] Check console logs for "Cache hit" / "Cache miss"

---

## 🎯 Success Criteria

You're done when:
1. ✅ Products load from React Query cache
2. ✅ CAD generation uses React Query mutations
3. ✅ Format/units persist in Zustand
4. ✅ Redis caches API responses
5. ✅ React Query DevTools shows queries
6. ✅ No breaking changes to existing features

---

## 🆘 Troubleshooting

### "Cannot find module '@tanstack/react-query'"
```bash
npm install @tanstack/react-query
```

### "Redis connection failed"
Check `.env.local` has correct credentials from Upstash dashboard

### "QueryClient not found"
Make sure `Providers` component wraps your app in `layout.tsx`

### "Zustand state not persisting"
Check browser localStorage for 'cad-store' key

---

## 📚 What to Read

1. **Start here**: `ONBOARDING_GUIDE.md` - Full context
2. **Quick reference**: `QUICK_START_CHEATSHEET.md` - Code patterns
3. **Examples**: `MIGRATION_EXAMPLES.md` - Step-by-step migrations
4. **Visual**: `ARCHITECTURE_VISUAL.md` - Diagrams

---

**Start with Phase 1 (Setup), then Phase 2 (Products), then Phase 3 (CAD). Good luck! 🚀**
