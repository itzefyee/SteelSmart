# 🏗️ Architecture Visual Guide

## 📊 Current vs Target Architecture

### BEFORE (Current State)
```
┌─────────────────────────────────────────────────────────┐
│                    React Component                       │
│  ┌────────────────────────────────────────────────┐    │
│  │  useState + useEffect                          │    │
│  │  - Manual loading state                        │    │
│  │  - Manual error handling                       │    │
│  │  - No caching                                  │    │
│  │  - Duplicate requests                          │    │
│  └────────────────────────────────────────────────┘    │
│                         ↓                               │
│  ┌────────────────────────────────────────────────┐    │
│  │  Direct fetch() calls                          │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    API Route                             │
│  ┌────────────────────────────────────────────────┐    │
│  │  Direct Supabase query                         │    │
│  │  - No caching                                  │    │
│  │  - Every request hits database                 │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                  Supabase Database                       │
└─────────────────────────────────────────────────────────┘
```

### AFTER (Target State)
```
┌─────────────────────────────────────────────────────────┐
│                    React Component                       │
│  ┌────────────────────────────────────────────────┐    │
│  │  React Query Hook                              │    │
│  │  ✅ Automatic caching                          │    │
│  │  ✅ Automatic refetching                       │    │
│  │  ✅ Request deduplication                      │    │
│  │  ✅ Loading/error states                       │    │
│  └────────────────────────────────────────────────┘    │
│                         ↓                               │
│  ┌────────────────────────────────────────────────┐    │
│  │  Zustand Store (UI State)                      │    │
│  │  ✅ Format selection                           │    │
│  │  ✅ Recent prompts                             │    │
│  │  ✅ User preferences                           │    │
│  └────────────────────────────────────────────────┘    │
│                         ↓                               │
│  ┌────────────────────────────────────────────────┐    │
│  │  Service Layer                                 │    │
│  │  ✅ Business logic                             │    │
│  │  ✅ Type-safe methods                          │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    API Route                             │
│  ┌────────────────────────────────────────────────┐    │
│  │  Redis Cache Check                             │    │
│  │  ✅ Cache hit → Return immediately             │    │
│  │  ✅ Cache miss → Query database                │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         ↓
         ┌───────────────┴───────────────┐
         ↓                               ↓
┌──────────────────┐          ┌──────────────────┐
│  Upstash Redis   │          │    Supabase      │
│  (Cache Layer)   │          │    Database      │
│  ✅ 5-10 min TTL │          │  (Source of      │
│  ✅ Fast reads   │          │   Truth)         │
└──────────────────┘          └──────────────────┘
```

---

## 🔄 Data Flow Diagram

### Product Catalog Flow

```
User Action: "Load Products"
         ↓
┌────────────────────────────────────────┐
│  Component: ProductList                │
│  const { data, isLoading } =           │
│    useProducts({ category: 'steel' })  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  React Query Cache                     │
│  Check: ['products', { category }]     │
│  ├─ Cache Hit? → Return cached data    │
│  └─ Cache Miss? → Fetch from API       │
└────────────────────────────────────────┘
         ↓ (if cache miss)
┌────────────────────────────────────────┐
│  Service: ProductService.getProducts() │
│  Builds query params                   │
│  Makes fetch() call                    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  API Route: /api/products              │
│  1. Check Redis cache                  │
│  2. If miss, query Supabase            │
│  3. Cache result in Redis (5 min)      │
│  4. Return JSON response               │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Response flows back up                │
│  1. Service receives data              │
│  2. React Query caches it              │
│  3. Component re-renders               │
└────────────────────────────────────────┘
```

### CAD Generation Flow

```
User Action: "Generate CAD"
         ↓
┌────────────────────────────────────────┐
│  Component: CADGenerator               │
│  const { mutate } = useCADGeneration() │
│  mutate({ prompt, format })            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Zustand Store: useCADStore            │
│  - Save format preference              │
│  - Add to recent prompts               │
│  - Persist to localStorage             │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  React Query Mutation                  │
│  1. Set isPending = true               │
│  2. Call mutation function             │
│  3. Handle success/error               │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Service: CADService.generateCAD()     │
│  POST to /api/generate-cad             │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  API Route: /api/generate-cad          │
│  1. Check Redis for duplicate prompt   │
│  2. If miss, call Zoo Dev API          │
│  3. Poll for completion                │
│  4. Cache result (24 hours)            │
│  5. Save to Supabase history           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Response flows back                   │
│  1. Service receives result            │
│  2. React Query calls onSuccess        │
│  3. Invalidate history cache           │
│  4. Component shows result             │
└────────────────────────────────────────┘
```

---

## 🗂️ File Structure Comparison

### BEFORE
```
src/
├── app/
│   ├── catalog/
│   │   └── page.tsx (❌ Direct hook usage)
│   └── api/
│       └── products/
│           └── route.ts (❌ Direct DB query)
├── hooks/
│   └── useProducts.ts (❌ useState + useEffect)
└── lib/
    └── supabase.ts
```

### AFTER
```
src/
├── app/
│   ├── catalog/
│   │   └── page.tsx (✅ Uses React Query hook)
│   └── api/
│       └── products/
│           └── route.ts (✅ Redis caching)
├── hooks/
│   └── useProducts.ts (✅ React Query wrapper)
├── services/ (✅ NEW)
│   └── product.service.ts (✅ Business logic)
├── stores/ (✅ NEW)
│   └── ui.store.ts (✅ Zustand state)
└── lib/
    ├── supabase.ts
    ├── query-client.ts (✅ NEW)
    └── cache/
        └── redis-cache.ts (✅ NEW)
```

---

## 🎯 State Management Layers

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT SIDE                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  React Query (Server State)                    │    │
│  │  ✅ Products, CAD history, user data           │    │
│  │  ✅ Automatic caching & refetching             │    │
│  │  ✅ Optimistic updates                         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Zustand (Client State)                        │    │
│  │  ✅ UI preferences (theme, view mode)          │    │
│  │  ✅ Form state (format, units)                 │    │
│  │  ✅ Recent searches/prompts                    │    │
│  │  ✅ Modal open/close                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  React State (Component State)                 │    │
│  │  ✅ Input values                               │    │
│  │  ✅ Temporary UI state                         │    │
│  │  ✅ Component-specific state                   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    SERVER SIDE                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Redis Cache (Temporary)                       │    │
│  │  ✅ API responses (5-10 min)                   │    │
│  │  ✅ Computed data (1 hour)                     │    │
│  │  ✅ AI results (24 hours)                      │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Supabase Database (Permanent)                 │    │
│  │  ✅ Products, users, history                   │    │
│  │  ✅ Source of truth                            │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Caching Strategy

### Cache Hierarchy (Fastest to Slowest)

```
1. React Query Cache (In-Memory)
   ├─ Duration: 5-10 minutes
   ├─ Scope: Per browser tab
   └─ Speed: Instant (0ms)
         ↓ (if stale or missing)

2. Redis Cache (Server-Side)
   ├─ Duration: 5 min - 24 hours
   ├─ Scope: All users
   └─ Speed: Very fast (10-50ms)
         ↓ (if missing)

3. Supabase Database (PostgreSQL)
   ├─ Duration: Permanent
   ├─ Scope: All users
   └─ Speed: Fast (50-200ms)
```

### Cache TTL Strategy

```
┌──────────────────────────┬──────────────┬──────────────┐
│ Data Type                │ React Query  │ Redis Cache  │
├──────────────────────────┼──────────────┼──────────────┤
│ Product Catalog          │ 5 minutes    │ 5 minutes    │
│ Product Details          │ 10 minutes   │ 10 minutes   │
│ Categories               │ 15 minutes   │ 1 hour       │
│ CAD Analysis Results     │ 1 hour       │ 24 hours     │
│ Product Recommendations  │ 5 minutes    │ 1 hour       │
│ User Profile             │ 5 minutes    │ 10 minutes   │
│ CAD Generation History   │ 2 minutes    │ 5 minutes    │
└──────────────────────────┴──────────────┴──────────────┘
```

---

## 🎨 Component Patterns

### Pattern 1: Data Fetching Component

```typescript
// ✅ GOOD: Separation of concerns
function ProductList() {
  // React Query for server state
  const { data, isLoading, error } = useProducts({ category: 'steel' });
  
  // Zustand for UI state
  const viewMode = useUIStore((state) => state.viewMode);
  const setViewMode = useUIStore((state) => state.setViewMode);
  
  // Local state for component-specific state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      <ViewToggle mode={viewMode} onChange={setViewMode} />
      <ProductGrid products={data.products} onSelect={setSelectedId} />
    </div>
  );
}
```

### Pattern 2: Mutation Component

```typescript
// ✅ GOOD: Optimistic updates
function CADGenerator() {
  const queryClient = useQueryClient();
  
  // Mutation with optimistic update
  const { mutate, isPending } = useMutation({
    mutationFn: CADService.generateCAD,
    
    // Optimistic update
    onMutate: async (newCAD) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cad-history'] });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['cad-history']);
      
      // Optimistically update
      queryClient.setQueryData(['cad-history'], (old) => [
        { ...newCAD, status: 'pending' },
        ...old,
      ]);
      
      return { previous };
    },
    
    // Rollback on error
    onError: (err, newCAD, context) => {
      queryClient.setQueryData(['cad-history'], context.previous);
    },
    
    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cad-history'] });
    },
  });
  
  return <button onClick={() => mutate(data)}>Generate</button>;
}
```

---

## 📊 Performance Metrics

### Expected Improvements

```
┌─────────────────────────┬──────────┬──────────┬──────────┐
│ Metric                  │ Before   │ After    │ Improve  │
├─────────────────────────┼──────────┼──────────┼──────────┤
│ Initial Load Time       │ 800ms    │ 800ms    │ Same     │
│ Subsequent Loads        │ 800ms    │ 0ms      │ 100%     │
│ API Calls (5 min)       │ 50       │ 5        │ 90%      │
│ Database Queries        │ 50       │ 5        │ 90%      │
│ User Perceived Speed    │ Slow     │ Instant  │ +++      │
│ Server Load             │ High     │ Low      │ 80%      │
└─────────────────────────┴──────────┴──────────┴──────────┘
```

---

## 🎯 Decision Tree: Which State Manager?

```
Need to store data?
    ↓
    ├─ Is it from the server? (API data)
    │  └─ YES → Use React Query
    │     Examples: Products, user data, CAD history
    │
    ├─ Is it UI preference? (persists across sessions)
    │  └─ YES → Use Zustand with persist
    │     Examples: Theme, view mode, recent searches
    │
    ├─ Is it temporary UI state? (modal open, selected item)
    │  └─ YES → Use Zustand (no persist)
    │     Examples: Sidebar open, active tab
    │
    └─ Is it component-specific? (input value, hover state)
       └─ YES → Use React useState
          Examples: Form inputs, hover effects
```

---

## 🚀 Migration Roadmap

```
Week 1: Foundation
├─ Install dependencies
├─ Set up React Query provider
├─ Set up Upstash Redis
└─ Create first Zustand store

Week 2: Products
├─ Create ProductService
├─ Convert useProducts to React Query
├─ Add Redis caching to /api/products
└─ Test and verify

Week 3: CAD Generation
├─ Create CADService
├─ Convert useCADGeneration to React Query
├─ Create CAD Zustand store
└─ Add Redis caching for duplicate prompts

Week 4: Polish
├─ Optimize cache times
├─ Add error boundaries
├─ Performance testing
└─ Documentation
```

---

**Use this visual guide as a reference while implementing! 🎨**
