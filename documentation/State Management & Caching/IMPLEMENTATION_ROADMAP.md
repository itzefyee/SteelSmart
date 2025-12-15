# State Management & Caching Implementation Roadmap

**Date**: December 15, 2025  
**Status**: Ready for Implementation  
**Estimated Duration**: 4 weeks

## 🎯 Overview

This roadmap provides a step-by-step implementation plan for expanding React Query, Zustand, and Redis caching across the SteelSmart application.

---

## 📅 Phase 1: Critical Components (Week 1)

**Status**: ✅ **COMPLETE** (December 15, 2025)  
**Documentation**: See `PHASE1_COMPLETE.md` for full details

### Day 1-2: RFQ System Migration ✅

#### Task 1.1: Create RFQ API Wrapper
**File**: `src/lib/api/rfq-api.ts`

```typescript
export interface RFQFormData {
  contactInfo: {
    name: string;
    email: string;
    company: string;
    phone?: string;
  };
  requirements: {
    projectDescription: string;
    quantity: number;
    material?: string;
    specifications?: string;
    deadline?: string;
    budget?: string;
  };
  attachedFiles?: File[];
}

export interface RFQ {
  id: string;
  drawing: string;
  quantity: number;
  status: 'Submitted' | 'In Review' | 'Approved' | 'Rejected' | 'Completed';
  submittedDate: string;
  expectedDelivery: string;
  priority: 'Low' | 'Medium' | 'High';
  contactInfo?: RFQFormData['contactInfo'];
  requirements?: RFQFormData['requirements'];
  attachedFiles?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export class RFQAPI {
  static async getList(): Promise<RFQ[]> {
    const response = await fetch('/api/rfq-list');
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch RFQs');
    }
    
    return result.data || [];
  }
  
  static async getById(id: string): Promise<RFQ> {
    const response = await fetch(`/api/rfq/${id}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch RFQ');
    }
    
    return result.data;
  }
  
  static async submit(data: RFQFormData): Promise<RFQ> {
    const formData = new FormData();
    formData.append('contactInfo', JSON.stringify(data.contactInfo));
    formData.append('requirements', JSON.stringify(data.requirements));
    
    if (data.attachedFiles) {
      data.attachedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    }
    
    const response = await fetch('/api/submit-rfq', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to submit RFQ');
    }
    
    return result.data;
  }
  
  static async update(id: string, updates: Partial<RFQ>): Promise<RFQ> {
    const response = await fetch(`/api/rfq/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update RFQ');
    }
    
    return result.data;
  }
  
  static async delete(id: string): Promise<void> {
    const response = await fetch(`/api/rfq/${id}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete RFQ');
    }
  }
}
```

#### Task 1.2: Create RFQ React Query Hooks
**File**: `src/hooks/useRFQ.ts`

```typescript
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { RFQAPI, type RFQ, type RFQFormData } from '@/lib/api/rfq-api';

/**
 * Fetch list of RFQs for current user
 */
export function useRFQList(): UseQueryResult<RFQ[], Error> {
  return useQuery({
    queryKey: ['rfqs'],
    queryFn: () => RFQAPI.getList(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch single RFQ by ID
 */
export function useRFQ(id: string): UseQueryResult<RFQ, Error> {
  return useQuery({
    queryKey: ['rfq', id],
    queryFn: () => RFQAPI.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

/**
 * Submit new RFQ
 */
export function useRFQSubmit(): UseMutationResult<RFQ, Error, RFQFormData> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RFQFormData) => RFQAPI.submit(data),
    onSuccess: (newRFQ) => {
      // Invalidate RFQ list to refetch
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      
      // Optimistically add to cache
      queryClient.setQueryData(['rfq', newRFQ.id], newRFQ);
    },
  });
}

/**
 * Update existing RFQ
 */
export function useRFQUpdate(): UseMutationResult<RFQ, Error, { id: string; updates: Partial<RFQ> }> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }) => RFQAPI.update(id, updates),
    onSuccess: (updatedRFQ, { id }) => {
      // Update single RFQ cache
      queryClient.setQueryData(['rfq', id], updatedRFQ);
      
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    },
  });
}

/**
 * Delete RFQ
 */
export function useRFQDelete(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => RFQAPI.delete(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['rfqs'] });
      
      // Snapshot previous value
      const previousRFQs = queryClient.getQueryData<RFQ[]>(['rfqs']);
      
      // Optimistically remove from list
      queryClient.setQueryData<RFQ[]>(['rfqs'], (old) =>
        old?.filter((rfq) => rfq.id !== id) || []
      );
      
      return { previousRFQs };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousRFQs) {
        queryClient.setQueryData(['rfqs'], context.previousRFQs);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    },
  });
}
```

#### Task 1.3: Add Redis Caching to RFQ Service
**File**: `src/services/rfq.service.ts`

```typescript
import { RFQRepository } from '@/repositories/rfq.repository';
import { getCached, deleteCached, invalidateCachePattern } from '@/lib/cache/redis-cache';
import type { RFQ, RFQFormData } from '@/lib/api/rfq-api';

export class RFQService {
  /**
   * Get RFQ list for user with caching
   */
  static async getRFQList(userId: string): Promise<RFQ[]> {
    const cacheKey = `rfq:list:${userId}`;
    
    return getCached(
      cacheKey,
      async () => {
        const repository = new RFQRepository();
        return repository.findByUser(userId);
      },
      120 // 2 minutes TTL
    );
  }
  
  /**
   * Get single RFQ by ID with caching
   */
  static async getRFQById(id: string, userId: string): Promise<RFQ> {
    const cacheKey = `rfq:${id}`;
    
    return getCached(
      cacheKey,
      async () => {
        const repository = new RFQRepository();
        return repository.findById(id, userId);
      },
      300 // 5 minutes TTL
    );
  }
  
  /**
   * Submit new RFQ and invalidate cache
   */
  static async submitRFQ(data: RFQFormData, userId: string): Promise<RFQ> {
    const repository = new RFQRepository();
    const rfq = await repository.create(data, userId);
    
    // Invalidate user's RFQ list cache
    await deleteCached(`rfq:list:${userId}`);
    
    return rfq;
  }
  
  /**
   * Update RFQ and invalidate cache
   */
  static async updateRFQ(id: string, updates: Partial<RFQ>, userId: string): Promise<RFQ> {
    const repository = new RFQRepository();
    const rfq = await repository.update(id, updates, userId);
    
    // Invalidate both single RFQ and list caches
    await invalidateCachePattern([
      `rfq:${id}`,
      `rfq:list:${userId}`
    ]);
    
    return rfq;
  }
  
  /**
   * Delete RFQ and invalidate cache
   */
  static async deleteRFQ(id: string, userId: string): Promise<void> {
    const repository = new RFQRepository();
    await repository.delete(id, userId);
    
    // Invalidate both single RFQ and list caches
    await invalidateCachePattern([
      `rfq:${id}`,
      `rfq:list:${userId}`
    ]);
  }
}
```

#### Task 1.4: Update RFQTracking Component
**File**: `src/components/rfq/RFQTracking.tsx`

**Changes**:
1. Remove `useState` for rfqs, loading, error
2. Remove `useEffect` and `fetchRFQs` function
3. Replace with `useRFQList()` hook
4. Use `refetch` from hook instead of manual refresh

```typescript
// Before
const [rfqs, setRfqs] = useState<RFQ[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string>('');

useEffect(() => {
  fetchRFQs();
}, []);

const fetchRFQs = async () => {
  // ... manual fetch logic
};

// After
const { data: rfqs = [], isLoading: loading, error: queryError, refetch } = useRFQList();
const error = queryError?.message || '';
```

#### Task 1.5: Update RFQForm Component
**File**: `src/components/rfq/RFQForm.tsx`

**Changes**:
1. Replace manual `fetch()` with `useRFQSubmit()` hook
2. Use `mutate` function for submission
3. Remove manual loading state
4. Add success/error handling

```typescript
// Before
const handleSubmit = async () => {
  const response = await fetch('/api/submit-rfq', {
    method: 'POST',
    body: formDataToSubmit,
  });
  // ... manual handling
};

// After
const { mutate: submitRFQ, isPending, isSuccess, error } = useRFQSubmit({
  onSuccess: () => {
    addToast({ type: 'success', title: 'RFQ submitted successfully' });
    router.push('/account?tab=rfqs');
  },
  onError: (error) => {
    addToast({ type: 'error', title: 'Failed to submit RFQ', description: error.message });
  },
});

const handleSubmit = () => {
  submitRFQ(formData);
};
```

---

### Day 3-4: Recommendation System Migration ✅

#### Task 2.1: Create Recommendation API Wrapper
**File**: `src/lib/api/recommendation-api.ts`

```typescript
export interface ProductSpecs {
  material?: string;
  dimensions?: string;
  loadCapacity?: string;
  category?: string;
  componentType?: string;
}

export interface CatalogMatchResult {
  product: Product;
  matchScore: number;
  rawScore: number;
  reasoning: string;
  matchedSpecs: string[];
}

export interface AlternativeProduct {
  name: string;
  description: string;
  category: string;
  material?: string;
  specifications: {
    dimensions?: string;
    loadCapacity?: string;
    standards?: string[];
    partNumber?: string;
  };
  source: string;
  confidence: number;
  reasoning: string;
  supplierInfo?: {
    suggestedSuppliers: string[];
    estimatedPrice?: string;
    leadTime?: string;
  };
  standards?: Array<{
    code: string;
    name: string;
    section?: string;
  }>;
}

export class RecommendationAPI {
  static async getMatches(specs: ProductSpecs): Promise<CatalogMatchResult[]> {
    const response = await fetch('/api/recommendations/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specs }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch catalog matches');
    }
    
    const result = await response.json();
    return result.matches || [];
  }
  
  static async getAlternatives(specs: ProductSpecs): Promise<AlternativeProduct[]> {
    const response = await fetch('/api/recommendations/alternatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specifications: specs }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get alternative suggestions');
    }
    
    const result = await response.json();
    return result.alternatives || [];
  }
  
  static async getProductRecommendations(productId: string): Promise<Product[]> {
    const response = await fetch(`/api/recommendations?productId=${productId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch recommendations');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch recommendations');
    }
    
    return result.data || [];
  }
}
```

#### Task 2.2: Create Recommendation React Query Hooks
**File**: `src/hooks/useRecommendations.ts`

```typescript
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { RecommendationAPI, type ProductSpecs, type CatalogMatchResult, type AlternativeProduct } from '@/lib/api/recommendation-api';
import type { Product } from '@/types';

/**
 * Fetch catalog matches for given specs
 * Caches results for 5 minutes to avoid duplicate searches
 */
export function useCatalogMatches(
  specs: ProductSpecs,
  enabled: boolean = true
): UseQueryResult<CatalogMatchResult[], Error> {
  return useQuery({
    queryKey: ['catalog-matches', specs],
    queryFn: () => RecommendationAPI.getMatches(specs),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && (!!specs.material || !!specs.dimensions || !!specs.category),
  });
}

/**
 * Fetch AI-generated alternatives for given specs
 * Caches results for 10 minutes (AI calls are expensive)
 */
export function useAlternatives(
  specs: ProductSpecs,
  enabled: boolean = true
): UseQueryResult<AlternativeProduct[], Error> {
  return useQuery({
    queryKey: ['alternatives', specs],
    queryFn: () => RecommendationAPI.getAlternatives(specs),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: enabled && (!!specs.material || !!specs.dimensions),
  });
}

/**
 * Fetch product recommendations for a specific product
 * Used for "You may also like" sections
 */
export function useProductRecommendations(
  productId: string,
  maxRecommendations: number = 4
): UseQueryResult<Product[], Error> {
  return useQuery({
    queryKey: ['product-recommendations', productId, maxRecommendations],
    queryFn: () => RecommendationAPI.getProductRecommendations(productId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!productId,
    select: (data) => data.slice(0, maxRecommendations),
  });
}
```

#### Task 2.3: Add Redis Caching to Recommendation Service
**File**: `src/services/recommendation.service.ts`

```typescript
import { getCached } from '@/lib/cache/redis-cache';
import { RecommendationRepository } from '@/repositories/recommendation.repository';
import type { ProductSpecs, CatalogMatchResult, AlternativeProduct } from '@/lib/api/recommendation-api';

export class RecommendationService {
  /**
   * Get catalog matches with Redis caching
   */
  static async getCatalogMatches(specs: ProductSpecs): Promise<CatalogMatchResult[]> {
    const cacheKey = `recommendations:catalog:${JSON.stringify(specs)}`;
    
    return getCached(
      cacheKey,
      async () => {
        const repository = new RecommendationRepository();
        return repository.findMatches(specs);
      },
      300 // 5 minutes TTL
    );
  }
  
  /**
   * Get AI alternatives with Redis caching (expensive operation)
   */
  static async getAlternatives(specs: ProductSpecs): Promise<AlternativeProduct[]> {
    const cacheKey = `recommendations:alternatives:${JSON.stringify(specs)}`;
    
    return getCached(
      cacheKey,
      async () => {
        // This calls Gemini AI - very expensive
        const repository = new RecommendationRepository();
        return repository.generateAlternatives(specs);
      },
      3600 // 1 hour TTL (AI results are expensive)
    );
  }
  
  /**
   * Get product recommendations with caching
   */
  static async getProductRecommendations(productId: string): Promise<Product[]> {
    const cacheKey = `recommendations:product:${productId}`;
    
    return getCached(
      cacheKey,
      async () => {
        const repository = new RecommendationRepository();
        return repository.findRelatedProducts(productId);
      },
      600 // 10 minutes TTL
    );
  }
}
```

#### Task 2.4: Update ProductRecommenderNew Component
**File**: `src/components/products/ProductRecommenderNew.tsx`

**Changes**:
1. Replace manual `searchCatalog` with `useCatalogMatches` hook
2. Replace manual `getAlternativeSuggestions` with `useAlternatives` hook
3. Remove `catalogCacheRef` (React Query handles caching)
4. Simplify loading states

```typescript
// Before
const [catalogMatches, setCatalogMatches] = useState<CatalogMatchResult[]>([]);
const [alternatives, setAlternatives] = useState<AlternativeProduct[]>([]);
const [isLoading, setIsLoading] = useState(false);

const searchCatalog = async (specs: any): Promise<CatalogMatchResult[]> => {
  // ... manual fetch with caching
};

// After
const [searchSpecs, setSearchSpecs] = useState<ProductSpecs | null>(null);

const { 
  data: catalogMatches = [], 
  isLoading: catalogLoading 
} = useCatalogMatches(searchSpecs || {}, !!searchSpecs);

const { 
  data: alternatives = [], 
  isLoading: alternativesLoading 
} = useAlternatives(searchSpecs || {}, !!searchSpecs);

const isLoading = catalogLoading || alternativesLoading;

const handleFindRecommendations = (specs?: any) => {
  const searchSpecs = specs || requirements;
  setSearchSpecs(searchSpecs);
};
```

#### Task 2.5: Update ProductRecommendations Component
**File**: `src/components/products/ProductRecommendations.tsx`

**Changes**:
1. Replace manual `fetch()` with `useProductRecommendations` hook
2. Remove manual loading/error state
3. Simplify component logic

```typescript
// Before
const [recommendations, setRecommendations] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchRecommendations = async () => {
    // ... manual fetch logic
  };
  fetchRecommendations();
}, [productId]);

// After
const { 
  data: recommendations = [], 
  isLoading: loading, 
  error 
} = useProductRecommendations(productId, maxRecommendations);
```

---

### Day 5: Testing & Validation

#### Task 3.1: Test RFQ System
- [ ] Test RFQ list loading
- [ ] Test RFQ submission
- [ ] Test cache invalidation after submission
- [ ] Test optimistic updates
- [ ] Test error handling
- [ ] Verify Redis caching in logs

#### Task 3.2: Test Recommendation System
- [ ] Test catalog matches
- [ ] Test AI alternatives
- [ ] Test product recommendations
- [ ] Verify cache hit rates
- [ ] Test parallel query execution
- [ ] Verify Redis caching in logs

#### Task 3.3: Performance Metrics
- [ ] Measure API call reduction
- [ ] Measure response time improvement
- [ ] Check cache hit rates
- [ ] Monitor Gemini API usage
- [ ] Verify no regressions

---

## 📅 Phase 2: High Priority (Week 2)

**Status**: 🟡 In Progress  
**Completed**: Days 5-7 (CAD Analysis) ✅  
**Documentation**: See `PHASE2_DAY5-7_COMPLETION.md` for full details

### Day 5-7: CAD Analysis System Migration ✅

#### Task 4.1: Enhance CAD Analysis Hooks
**File**: `src/hooks/useCADAnalysis.ts`

Add caching for sample files and analysis results.

#### Task 4.2: Update CAD Analyzer Components
**Files**:
- `src/components/cad/CADAnalyzerFull.tsx`
- `src/components/cad/CADAnalyzer.tsx`

Replace direct fetch calls with hooks.

---

### Day 8-9: Admin Product Management

#### Task 5.1: Create Admin Product Hooks
**File**: `src/hooks/useAdminProducts.ts`

Implement CRUD operations with optimistic updates.

#### Task 5.2: Update Admin Components
**Files**:
- `src/app/admin/products/page.tsx`
- `src/app/admin/products/[id]/page.tsx`
- `src/app/admin/products/[id]/edit/page.tsx`
- `src/app/admin/products/new/page.tsx`

---

### Day 10: Zustand Stores

#### Task 6.1: Create UI Store
**File**: `src/stores/ui.store.ts`

#### Task 6.2: Create Search Store
**File**: `src/stores/search.store.ts`

---

## 📅 Phase 3: Medium Priority (Week 3)

### Day 11-12: Admin Reports

#### Task 7.1: Create Admin Report Hooks
**File**: `src/hooks/useAdminReports.ts`

#### Task 7.2: Update Admin Report Components
**Files**:
- `src/app/admin/reports/page.tsx`
- `src/app/admin/reports/[id]/page.tsx`
- `src/app/admin/reports/generate/page.tsx`

---

### Day 13-14: User Profile & Additional Stores

#### Task 8.1: Create User Profile Hooks
**File**: `src/hooks/useUserProfile.ts`

#### Task 8.2: Create RFQ Draft Store
**File**: `src/stores/rfq.store.ts`

#### Task 8.3: Enhance CAD History Store
**File**: `src/stores/cad-history.store.ts`

---

## 📅 Phase 4: Polish & Documentation (Week 4)

### Day 15-16: Performance Monitoring

#### Task 9.1: Add Performance Metrics Dashboard
**File**: `src/app/admin/performance/page.tsx`

Display cache metrics, API call stats, response times.

#### Task 9.2: Add Cache Metrics Endpoint
**File**: `src/app/api/cache-metrics/route.ts`

Expose Redis cache metrics.

---

### Day 17-18: Documentation & Testing

#### Task 10.1: Update Documentation
- [ ] Update `ARCHITECTURE.md`
- [ ] Update `PROJECT_STRUCTURE.md`
- [ ] Create migration guide
- [ ] Document new hooks
- [ ] Document new stores

#### Task 10.2: Comprehensive Testing
- [ ] Unit tests for all hooks
- [ ] Integration tests
- [ ] Performance tests
- [ ] Load tests
- [ ] User acceptance testing

---

### Day 19-20: Final Validation

#### Task 11.1: Code Review
- [ ] Review all changes
- [ ] Check for regressions
- [ ] Verify best practices
- [ ] Ensure consistency

#### Task 11.2: Deployment Preparation
- [ ] Update environment variables
- [ ] Configure Redis in production
- [ ] Update deployment scripts
- [ ] Prepare rollback plan

---

## ✅ Success Metrics

### Technical Metrics
- [ ] 100% of components use React Query for server state
- [ ] 0 direct `fetch()` calls in components
- [ ] Cache hit rate > 80%
- [ ] API calls reduced by > 70%
- [ ] Response times improved by > 60%

### Business Metrics
- [ ] API costs reduced by > 70%
- [ ] Database load reduced by > 80%
- [ ] User satisfaction improved
- [ ] Page load times < 500ms
- [ ] Zero breaking changes

---

## 🚨 Risk Mitigation

### Risks
1. **Breaking Changes**: Extensive refactoring could introduce bugs
2. **Performance Regression**: Incorrect caching could slow down app
3. **Cache Invalidation**: Complex invalidation logic could cause stale data
4. **Memory Leaks**: Improper cleanup could cause memory issues

### Mitigation Strategies
1. **Incremental Migration**: Migrate one component at a time
2. **Comprehensive Testing**: Test each change thoroughly
3. **Feature Flags**: Use flags to enable/disable new caching
4. **Monitoring**: Add extensive logging and metrics
5. **Rollback Plan**: Prepare to revert changes if needed

---

## 📚 Resources

- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Zustand Patterns](https://docs.pmnd.rs/zustand/guides/practice-with-no-store-actions)
- [Redis Caching Strategies](https://redis.io/docs/manual/patterns/)
- [Performance Optimization](https://web.dev/performance/)

---

**Next Action**: Begin Phase 1, Day 1 - Create RFQ API Wrapper
