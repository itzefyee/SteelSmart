# 🚀 Metalyze Project Onboarding Guide

Welcome to the Metalyze project! This guide will help you understand the codebase and get started with your tasks.

## 📋 Project Overview

**Metalyze** is an AI-enhanced metal & steel parts marketplace built with Next.js 16. It features:
- **CAD Analysis**: AI-powered technical drawing analysis using Google Gemini
- **CAD Generation**: Text-to-CAD conversion using Zoo Dev API
- **3D Visualization**: Interactive model viewer with Three.js
- **Product Catalog**: 20+ products with smart recommendations
- **Authentication**: Supabase-based user management

## 🎯 Your Task Focus

You'll be working with these key technologies:
1. **@tanstack/react-query** - Server state management
2. **@upstash/redis** - Caching layer
3. **zustand** - Client state management

**Note**: Rate limiting (@upstash/ratelimit) and validation (zod) are already mentioned in the architecture docs but NOT YET IMPLEMENTED.

---

## 📦 Current State Analysis

### ✅ What's Already Implemented

1. **Supabase Integration**
   - PostgreSQL database with migrations
   - Authentication (email/password)
   - Row Level Security (RLS)
   - Storage for CAD files

2. **API Routes** (Next.js App Router)
   - `/api/generate-cad` - CAD generation
   - `/api/analyze-drawing` - Drawing analysis
   - `/api/products` - Product catalog
   - `/api/recommendations` - Product matching
   - `/api/submit-rfq` - Quote requests

3. **Custom Hooks** (Traditional useState pattern)
   - `useCADGeneration` - CAD generation state
   - `useProducts` - Product fetching with filters
   - `useCADAnalysis` - Drawing analysis
   - `useFileUpload` - File handling

4. **External APIs**
   - Google Gemini AI (CAD analysis)
   - Zoo Dev API (CAD generation)
   - OpenCascade.js (STEP file parsing)

### ❌ What Needs to be Added

1. **React Query** - Not installed or configured
2. **Zustand** - Not installed or configured
3. **Upstash Redis** - Not installed or configured
4. **Caching Strategy** - No caching layer exists
5. **Query Optimization** - Direct fetch calls without caching

---

## 🏗️ Architecture Overview

### Current Structure
```
src/
├── app/                    # Next.js 16 App Router
│   ├── api/               # API routes (REST endpoints)
│   ├── cad-analyzer/      # CAD analysis page
│   ├── cad-generator/     # CAD generation page
│   ├── catalog/           # Product catalog
│   ├── account/           # User account
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── cad/              # CAD-related components
│   ├── products/         # Product components
│   └── layout/           # Layout components
├── hooks/                 # Custom React hooks (useState-based)
├── lib/                   # Utilities & API clients
│   ├── supabase.ts       # Supabase client
│   ├── gemini-client.ts  # Google Gemini API
│   ├── zoo-client.ts     # Zoo Dev API
│   └── utils.ts          # Helper functions
└── types/                 # TypeScript definitions
```

### Target Structure (After Your Work)
```
src/
├── app/                    # Next.js App Router
├── components/            # React components
├── hooks/                 # React Query hooks + custom hooks
├── stores/                # Zustand stores (NEW)
├── services/              # Business logic layer (NEW)
├── repositories/          # Data access layer (NEW)
├── lib/
│   ├── cache/            # Redis caching (NEW)
│   └── query-client.ts   # React Query config (NEW)
└── types/
```

---

## 🔧 Technology Deep Dive

### 1. React Query (@tanstack/react-query)

**Purpose**: Server state management with automatic caching, refetching, and synchronization.

**Why it's needed**:
- Current hooks use `useState` + `useEffect` + `fetch` (manual caching, no deduplication)
- No automatic refetching or background updates
- No optimistic updates
- Manual loading/error state management

**Example Current Pattern** (useProducts.ts):
```typescript
// ❌ Current: Manual state management
const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);

useEffect(() => {
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  fetchProducts();
}, [filters, page]);
```

**Target Pattern with React Query**:
```typescript
// ✅ Target: React Query handles everything
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['products', filters, page],
  queryFn: () => productService.getProducts(filters, page),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

**Benefits**:
- Automatic caching and deduplication
- Background refetching
- Optimistic updates
- Request cancellation
- Pagination support
- Infinite scroll support

---

### 2. Zustand

**Purpose**: Lightweight client-side state management for UI state.

**Why it's needed**:
- Global UI state (modals, sidebars, filters)
- User preferences (theme, view mode)
- Temporary form data
- Client-only state that doesn't need server sync

**Use Cases in Metalyze**:
1. **CAD Generator State**
   - Current generation progress
   - Selected format/units
   - Generation history (client-side cache)

2. **Product Catalog State**
   - Active filters
   - View mode (grid/list)
   - Selected category

3. **UI State**
   - Modal open/close
   - Sidebar collapsed/expanded
   - Toast notifications

**Example Store**:
```typescript
// stores/cad.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CADStore {
  // State
  selectedFormat: 'step' | 'stl' | 'obj';
  selectedUnits: 'mm' | 'cm' | 'm' | 'in';
  recentPrompts: string[];
  
  // Actions
  setFormat: (format: string) => void;
  setUnits: (units: string) => void;
  addRecentPrompt: (prompt: string) => void;
}

export const useCADStore = create<CADStore>()(
  persist(
    (set) => ({
      selectedFormat: 'step',
      selectedUnits: 'mm',
      recentPrompts: [],
      
      setFormat: (format) => set({ selectedFormat: format }),
      setUnits: (units) => set({ selectedUnits: units }),
      addRecentPrompt: (prompt) => 
        set((state) => ({
          recentPrompts: [prompt, ...state.recentPrompts].slice(0, 10)
        })),
    }),
    { name: 'cad-store' }
  )
);
```

---

### 3. Upstash Redis

**Purpose**: Serverless Redis for caching API responses and computed data.

**Why it's needed**:
- Reduce database queries
- Cache expensive AI operations
- Rate limiting (with @upstash/ratelimit)
- Session storage

**Use Cases in Metalyze**:
1. **Product Catalog Caching**
   - Cache product lists (5-10 minutes)
   - Cache product details (15 minutes)
   - Cache category data (1 hour)

2. **AI Response Caching**
   - Cache CAD analysis results (24 hours)
   - Cache product recommendations (1 hour)
   - Cache similar prompts (prevent duplicate AI calls)

3. **Computed Data**
   - Cache compatibility matrices
   - Cache search results
   - Cache aggregated statistics

**Example Usage**:
```typescript
// lib/cache/redis-cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCachedProducts(filters: string) {
  const cacheKey = `products:${filters}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return cached;
  
  // Fetch from database
  const products = await fetchProductsFromDB(filters);
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(products));
  
  return products;
}
```

---

## 🎓 Learning Resources

### React Query
- **Official Docs**: https://tanstack.com/query/latest
- **Key Concepts**:
  - `useQuery` - Fetch data
  - `useMutation` - Modify data
  - `queryKey` - Cache key
  - `staleTime` - How long data is fresh
  - `cacheTime` - How long to keep in cache
  - `refetchOnWindowFocus` - Auto-refetch on tab focus

### Zustand
- **Official Docs**: https://zustand-demo.pmnd.rs/
- **Key Concepts**:
  - `create()` - Create store
  - `persist` - LocalStorage persistence
  - `devtools` - Redux DevTools integration
  - Selectors - Optimize re-renders

### Upstash Redis
- **Official Docs**: https://upstash.com/docs/redis
- **Key Concepts**:
  - `get/set` - Basic operations
  - `setex` - Set with expiration
  - `del` - Delete key
  - `keys` - Pattern matching
  - REST API - HTTP-based (serverless-friendly)

---

## 🚀 Getting Started

### Step 1: Install Dependencies

```bash
cd Metalyze
npm install @tanstack/react-query @upstash/redis zustand
npm install -D @tanstack/react-query-devtools
```

### Step 2: Set Up Environment Variables

Add to `.env.local`:
```bash
# Upstash Redis (get from https://console.upstash.com/)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### Step 3: Create React Query Provider

Create `src/lib/query-client.ts`:
```typescript
'use client';

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

Update `src/app/layout.tsx`:
```typescript
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### Step 4: Create Your First Zustand Store

Create `src/stores/ui.store.ts`:
```typescript
import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

### Step 5: Create Redis Cache Utility

Create `src/lib/cache/redis-cache.ts`:
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data as T;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  expirationSeconds: number = 300
): Promise<void> {
  try {
    await redis.setex(key, expirationSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function deleteCached(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}
```

---

## 📝 Migration Tasks

### Priority 1: Convert useProducts to React Query

**Current**: `src/hooks/useProducts.ts` (manual state management)
**Target**: React Query hook with caching

**Steps**:
1. Create `src/services/product.service.ts` (business logic)
2. Create `src/hooks/useProducts.ts` (React Query wrapper)
3. Update components to use new hook
4. Add Redis caching to API route

### Priority 2: Convert useCADGeneration to React Query

**Current**: `src/hooks/useCADGeneration.ts` (manual state management)
**Target**: React Query mutation with optimistic updates

**Steps**:
1. Create `src/services/cad.service.ts`
2. Convert to `useMutation`
3. Add Zustand store for UI state (progress, format selection)
4. Add Redis caching for duplicate prompts

### Priority 3: Add Caching Layer

**Target**: Redis caching for expensive operations

**Steps**:
1. Cache product catalog (5 minutes)
2. Cache CAD analysis results (24 hours)
3. Cache product recommendations (1 hour)
4. Add cache invalidation logic

---

## 🔍 Code Examples

### Example 1: Convert useProducts to React Query

**Before** (current):
```typescript
// hooks/useProducts.ts
export function useProducts(filters: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProducts();
  }, [filters]);
  
  return { products, loading };
}
```

**After** (with React Query):
```typescript
// services/product.service.ts
export class ProductService {
  static async getProducts(filters: ProductFilters) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/products?${params}`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  }
}

// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => ProductService.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Usage in component
function ProductList() {
  const { data, isLoading, error } = useProducts({ category: 'steel' });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{data.products.map(p => <ProductCard key={p.id} {...p} />)}</div>;
}
```

### Example 2: Add Redis Caching to API Route

**Before**:
```typescript
// app/api/products/route.ts
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('products').select('*');
  return NextResponse.json({ products: data });
}
```

**After** (with Redis):
```typescript
// app/api/products/route.ts
import { getCached, setCached } from '@/lib/cache/redis-cache';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters = searchParams.toString();
  const cacheKey = `products:${filters}`;
  
  // Try cache first
  const cached = await getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }
  
  // Fetch from database
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('products').select('*');
  const result = { products: data };
  
  // Cache for 5 minutes
  await setCached(cacheKey, result, 300);
  
  return NextResponse.json(result);
}
```

---

## 🎯 Your Implementation Checklist

### Week 1: Setup & React Query
- [ ] Install dependencies (@tanstack/react-query, zustand, @upstash/redis)
- [ ] Set up React Query provider in layout.tsx
- [ ] Create query-client.ts configuration
- [ ] Convert useProducts to React Query
- [ ] Test product catalog with React Query DevTools

### Week 2: Zustand & More React Query
- [ ] Create Zustand stores (ui.store.ts, cad.store.ts)
- [ ] Convert useCADGeneration to React Query mutation
- [ ] Add Zustand for CAD UI state (format, units, recent prompts)
- [ ] Test state persistence with localStorage

### Week 3: Redis Caching
- [ ] Set up Upstash Redis account
- [ ] Create redis-cache.ts utility
- [ ] Add caching to /api/products
- [ ] Add caching to /api/analyze-drawing
- [ ] Add caching to /api/recommendations

### Week 4: Optimization & Testing
- [ ] Add cache invalidation logic
- [ ] Optimize query keys and stale times
- [ ] Test cache hit rates
- [ ] Document caching strategy
- [ ] Performance testing

---

## 🤝 Working with the Team

### Communication
- Ask questions about architecture decisions
- Share progress on migrations
- Report any breaking changes
- Document new patterns

### Code Review
- Follow existing TypeScript patterns
- Use consistent naming conventions
- Add JSDoc comments for complex logic
- Write tests for new services

### Git Workflow
- Create feature branches: `feature/react-query-products`
- Commit frequently with clear messages
- Test locally before pushing
- Request code review for major changes

---

## 📚 Additional Resources

### Project Documentation
- `documentation/Architecture/` - Architecture guides
- `documentation/CAD Generation/` - CAD generation docs
- `README.md` - Project overview

### External Resources
- [React Query Tutorial](https://tanstack.com/query/latest/docs/react/overview)
- [Zustand Guide](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Upstash Redis Docs](https://upstash.com/docs/redis/overall/getstarted)
- [Next.js 16 App Router](https://nextjs.org/docs/app)

---

## 🆘 Common Issues & Solutions

### Issue: React Query not refetching
**Solution**: Check `staleTime` and `cacheTime` settings. Use `refetch()` manually if needed.

### Issue: Zustand state not persisting
**Solution**: Ensure `persist` middleware is configured correctly. Check browser localStorage.

### Issue: Redis connection errors
**Solution**: Verify environment variables. Check Upstash dashboard for connection status.

### Issue: Type errors with React Query
**Solution**: Properly type `queryFn` return value. Use generics: `useQuery<Product[]>(...)`

---

## 🎉 Success Criteria

You'll know you're done when:
1. ✅ All product fetching uses React Query
2. ✅ CAD generation uses React Query mutations
3. ✅ UI state managed with Zustand
4. ✅ Redis caching reduces API calls by 50%+
5. ✅ React Query DevTools shows proper cache behavior
6. ✅ No breaking changes to existing features
7. ✅ Documentation updated

---

**Good luck! Feel free to ask questions as you work through the implementation. 🚀**
