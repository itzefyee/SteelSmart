# ⚡ Quick Start Cheat Sheet

## 🚀 Installation (Run First!)

```bash
cd SteelSmart
npm install @tanstack/react-query @upstash/redis zustand
npm install -D @tanstack/react-query-devtools
```

## 📝 Environment Variables

Add to `.env.local`:
```bash
# Upstash Redis (get from https://console.upstash.com/)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

---

## 🎯 React Query Patterns

### Basic Query (Fetch Data)
```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['products', filters],
  queryFn: async () => {
    const res = await fetch('/api/products');
    return res.json();
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Mutation (Create/Update/Delete)
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: async (data) => {
    const res = await fetch('/api/generate-cad', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['cad-history'] });
  },
});

// Usage
mutation.mutate({ prompt: 'Create a bracket' });
```

### Query with Pagination
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['products'],
  queryFn: ({ pageParam = 1 }) => fetchProducts(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextPage,
});
```

---

## 🎨 Zustand Patterns

### Basic Store
```typescript
import { create } from 'zustand';

interface Store {
  count: number;
  increment: () => void;
}

export const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Usage in component
const count = useStore((state) => state.count);
const increment = useStore((state) => state.increment);
```

### Store with Persistence
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCADStore = create<CADStore>()(
  persist(
    (set) => ({
      format: 'step',
      setFormat: (format) => set({ format }),
    }),
    { name: 'cad-store' } // localStorage key
  )
);
```

### Store with DevTools
```typescript
import { devtools } from 'zustand/middleware';

export const useStore = create<Store>()(
  devtools(
    (set) => ({
      // ... state and actions
    }),
    { name: 'MyStore' }
  )
);
```

---

## 💾 Redis Caching Patterns

### Basic Cache Operations
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Get
const data = await redis.get('key');

// Set with expiration (seconds)
await redis.setex('key', 300, JSON.stringify(data));

// Delete
await redis.del('key');

// Check if exists
const exists = await redis.exists('key');
```

### Cache Wrapper Function
```typescript
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Try cache
  const cached = await redis.get(key);
  if (cached) return cached as T;
  
  // Fetch and cache
  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// Usage
const products = await getCached(
  'products:all',
  () => fetchProductsFromDB(),
  300 // 5 minutes
);
```

---

## 🔧 Common Patterns

### API Route with Caching
```typescript
// app/api/products/route.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
  const cacheKey = 'products:all';
  
  // Try cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }
  
  // Fetch from DB
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('products').select('*');
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(data));
  
  return NextResponse.json(data);
}
```

### Service Layer Pattern
```typescript
// services/product.service.ts
export class ProductService {
  static async getProducts(filters: ProductFilters) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/products?${params}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  }
  
  static async getProduct(id: string) {
    const response = await fetch(`/api/products/${id}`);
    if (!response.ok) throw new Error('Product not found');
    return response.json();
  }
}

// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { ProductService } from '@/services/product.service';

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => ProductService.getProducts(filters),
    staleTime: 5 * 60 * 1000,
  });
}
```

---

## 🎯 Migration Checklist

### Converting a Hook to React Query

1. **Create Service** (business logic)
```typescript
// services/cad.service.ts
export class CADService {
  static async generateCAD(prompt: string, format: string) {
    const res = await fetch('/api/generate-cad', {
      method: 'POST',
      body: JSON.stringify({ prompt, format }),
    });
    return res.json();
  }
}
```

2. **Create React Query Hook**
```typescript
// hooks/useCADGeneration.ts
import { useMutation } from '@tanstack/react-query';
import { CADService } from '@/services/cad.service';

export function useCADGeneration() {
  return useMutation({
    mutationFn: ({ prompt, format }) => 
      CADService.generateCAD(prompt, format),
    onSuccess: (data) => {
      console.log('Generated:', data);
    },
  });
}
```

3. **Use in Component**
```typescript
function CADGenerator() {
  const { mutate, isPending, data } = useCADGeneration();
  
  const handleGenerate = () => {
    mutate({ prompt: 'Create bracket', format: 'step' });
  };
  
  return (
    <button onClick={handleGenerate} disabled={isPending}>
      {isPending ? 'Generating...' : 'Generate'}
    </button>
  );
}
```

---

## 🐛 Debugging Tips

### React Query DevTools
```typescript
// Add to layout.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Zustand DevTools
```typescript
// Install Redux DevTools extension in browser
// Stores with devtools() middleware will appear automatically
```

### Redis Debugging
```typescript
// Check if key exists
const exists = await redis.exists('products:all');
console.log('Cache exists:', exists);

// Get TTL (time to live)
const ttl = await redis.ttl('products:all');
console.log('Expires in:', ttl, 'seconds');

// List all keys (use carefully in production!)
const keys = await redis.keys('products:*');
console.log('Cached keys:', keys);
```

---

## 📊 Performance Tips

### React Query
- Use `staleTime` to reduce refetches (5-10 minutes for static data)
- Use `cacheTime` to keep data in memory (10-15 minutes)
- Disable `refetchOnWindowFocus` for stable data
- Use `select` to transform data and prevent re-renders

### Zustand
- Use selectors to prevent unnecessary re-renders
- Split large stores into smaller ones
- Use `shallow` for comparing objects

### Redis
- Set appropriate TTL (5 min for dynamic, 1 hour for static)
- Use key prefixes for organization (`products:`, `cad:`)
- Implement cache invalidation on updates
- Monitor cache hit rates

---

## 🔗 Quick Links

- **React Query Docs**: https://tanstack.com/query/latest
- **Zustand Docs**: https://docs.pmnd.rs/zustand
- **Upstash Console**: https://console.upstash.com/
- **Upstash Docs**: https://upstash.com/docs/redis

---

## 🆘 Common Errors

### "Cannot find module '@tanstack/react-query'"
**Fix**: Run `npm install @tanstack/react-query`

### "Redis connection failed"
**Fix**: Check `.env.local` has correct `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### "QueryClient not found"
**Fix**: Wrap app in `<QueryClientProvider>` in `layout.tsx`

### "Zustand state not updating"
**Fix**: Make sure you're calling the action function, not just accessing it

---

**Keep this cheat sheet handy while coding! 🚀**
