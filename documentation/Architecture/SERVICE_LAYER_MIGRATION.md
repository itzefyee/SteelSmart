# Service Layer Migration Guide

## ✅ Completed: Product Module

The product module has been successfully refactored to use the service layer pattern.

### Changes Made

#### 1. Renamed Client-Side API Wrapper
```
src/services/product.service.ts → src/lib/api/product-api.ts
```
- Changed class name: `ProductService` → `ProductAPI`
- This is a client-side fetch wrapper for React components
- Used by hooks like `useProducts()`

#### 2. Created Server-Side Service Layer
```
src/services/product.service.ts (NEW)
```
- Contains business logic: validation, caching, orchestration
- Used by API routes (controllers)
- Calls repositories for data access

#### 3. Refactored API Routes (Controllers)
```
src/app/api/products/route.ts
src/app/api/products/[id]/route.ts
```
- Now thin controllers (20-30 lines)
- Only handle: parse request → call service → return response
- No business logic in controllers

#### 4. Updated Client Hooks
```
src/hooks/useProducts.ts
```
- Changed import from `@/services/product.service` to `@/lib/api/product-api`
- Changed class name from `ProductService` to `ProductAPI`

### Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Client Component                                             │
│  └─ useProducts() hook                                       │
└──────────────────────┬───────────────────────────────────────┘
                       │ uses
┌──────────────────────▼───────────────────────────────────────┐
│ Client-Side API Wrapper                                      │
│  └─ ProductAPI.getProducts() (fetch call)                    │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP
┌──────────────────────▼───────────────────────────────────────┐
│ Controller (Thin)                                            │
│  └─ /api/products/route.ts                                   │
│     - Parse request                                          │
│     - Call service                                           │
│     - Return response                                        │
└──────────────────────┬───────────────────────────────────────┘
                       │ calls
┌──────────────────────▼───────────────────────────────────────┐
│ Service Layer (Business Logic)                              │
│  └─ ProductService.getProducts()                             │
│     - Validate filters                                       │
│     - Generate cache key                                     │
│     - Apply business rules                                   │
└──────────────────────┬───────────────────────────────────────┘
                       │ calls
┌──────────────────────▼───────────────────────────────────────┐
│ Repository (Data Access)                                     │
│  └─ ProductRepository.findWithFilters()                      │
│     - Build SQL query                                        │
│     - Execute query                                          │
│     - Return data                                            │
└──────────────────────┬───────────────────────────────────────┘
                       │ queries
┌──────────────────────▼───────────────────────────────────────┐
│ Database                                                     │
│  └─ Supabase PostgreSQL                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Next: Apply Pattern to Remaining Modules

### Priority Order

1. **CAD Analysis** (High complexity)
   - `/api/analyze-drawing/route.ts`
   - Create: `src/services/cad-analysis.service.ts`
   - Create: `src/repositories/technical-drawing.repository.ts`

2. **CAD Generation** (High complexity)
   - `/api/generate-cad/route.ts`
   - Update: `src/services/cad.service.ts` (already exists but needs refactoring)
   - Repository: `src/repositories/cad-history.repository.ts` (already exists)

3. **RFQ** (Medium complexity)
   - `/api/submit-rfq/route.ts`
   - `/api/rfq-list/route.ts`
   - Update: `src/services/rfq.service.ts` (already exists)
   - Repository: `src/repositories/rfq.repository.ts` (already exists)

4. **User/Account** (Medium complexity)
   - Create: `/api/user/route.ts` (MISSING)
   - Create: `/api/user/profile/route.ts`
   - Update: `src/services/user.service.ts` (already exists)
   - Repository: `src/repositories/user.repository.ts` (already exists)

5. **Recommendations** (Low complexity)
   - `/api/recommendations/route.ts`
   - Create: `src/services/recommendation.service.ts`
   - Create: `src/repositories/product-matching.repository.ts`

---

## 📋 Refactoring Checklist (Per Module)

### Step 1: Identify Current State
- [ ] Does a client-side service exist? (in `src/services/`)
- [ ] Does a server-side service exist?
- [ ] Does a repository exist? (in `src/repositories/`)
- [ ] What business logic is in the API route?

### Step 2: Rename Client-Side Service (if exists)
- [ ] Move `src/services/X.service.ts` → `src/lib/api/X-api.ts`
- [ ] Rename class: `XService` → `XAPI`
- [ ] Update all client-side imports

### Step 3: Create/Update Server-Side Service
- [ ] Create `src/services/X.service.ts`
- [ ] Extract business logic from API route
- [ ] Add validation methods
- [ ] Add caching logic
- [ ] Call repository for data access

### Step 4: Create/Update Repository (if needed)
- [ ] Create `src/repositories/X.repository.ts`
- [ ] Move database queries from service/route
- [ ] Implement CRUD methods
- [ ] Return plain data (no business logic)

### Step 5: Refactor API Route (Controller)
- [ ] Import service layer
- [ ] Remove business logic
- [ ] Keep only: parse → call service → return
- [ ] Add error handling

### Step 6: Update Client Hooks (if exists)
- [ ] Change import to `@/lib/api/X-api`
- [ ] Change class name to `XAPI`

### Step 7: Test
- [ ] Run diagnostics: `getDiagnostics`
- [ ] Test API endpoint manually
- [ ] Verify caching works
- [ ] Check error handling

---

## 🎯 Pattern Template

### Controller Template
```typescript
// src/app/api/X/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { XService } from '@/services/X.service';

export async function GET(request: NextRequest) {
  try {
    // Parse request
    const { searchParams } = new URL(request.url);
    const param1 = searchParams.get('param1');
    const param2 = searchParams.get('param2');
    
    // Call service (business logic)
    const result = await XService.doSomething(param1, param2);
    
    // Return response
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('X API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### Service Template
```typescript
// src/services/X.service.ts
import { XRepository } from '@/repositories/X.repository';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getCached } from '@/lib/cache/redis-cache';

export class XService {
  /**
   * Business logic method
   */
  static async doSomething(param1: string, param2: string) {
    // Validate inputs (business logic)
    this.validateInputs(param1, param2);
    
    // Generate cache key (business logic)
    const cacheKey = `x:${param1}:${param2}`;
    
    // Fetch with caching (business logic)
    return getCached(
      cacheKey,
      async () => {
        const supabase = getSupabaseServerClient();
        const repository = new XRepository(supabase);
        
        // Call repository (data access)
        return repository.findSomething(param1, param2);
      },
      300 // TTL
    );
  }
  
  /**
   * Validation (business logic)
   */
  private static validateInputs(param1: string, param2: string): void {
    if (!param1) {
      throw new Error('param1 is required');
    }
    
    if (param2 && param2.length > 100) {
      throw new Error('param2 too long');
    }
  }
}
```

### Repository Template
```typescript
// src/repositories/X.repository.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export class XRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}
  
  /**
   * Data access method (no business logic)
   */
  async findSomething(param1: string, param2: string) {
    const { data, error } = await this.supabase
      .from('table_name')
      .select('*')
      .eq('column1', param1)
      .eq('column2', param2);
    
    if (error) throw error;
    
    return data;
  }
}
```

### Client API Template
```typescript
// src/lib/api/X-api.ts
export class XAPI {
  private static readonly BASE_URL = '/api/X';
  
  /**
   * Client-side fetch wrapper
   */
  static async doSomething(param1: string, param2: string) {
    const params = new URLSearchParams();
    params.append('param1', param1);
    params.append('param2', param2);
    
    const response = await fetch(`${this.BASE_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

---

## 📊 Migration Status

| Module | Controller | Service | Repository | Status |
|--------|-----------|---------|------------|--------|
| Products | ✅ | ✅ | ✅ | **Complete** |
| CAD Analysis | ✅ | ✅ | ✅ | **Complete** |
| CAD Generation | ✅ | ✅ | ✅ | **Complete** |
| RFQ | ✅ | ✅ | ✅ | **Already Good** |
| User/Account | ✅ | ✅ | ✅ | **Complete** |
| Recommendations | ✅ | ✅ | N/A | **Complete** |
| Categories | ✅ | N/A | N/A | **Simple (no service needed)** |

---

## 🚀 Benefits Achieved (Products Module)

### Before
- API route: **~100 lines** with mixed responsibilities
- Business logic scattered across route and repository
- Hard to test (requires HTTP mocking)
- Cache logic duplicated

### After
- Controller: **~30 lines** (thin, focused)
- Service: **~150 lines** (reusable business logic)
- Repository: **unchanged** (already good)
- Easy to test each layer independently
- Cache logic centralized in service

### Code Reduction
- Controller: 70% smaller
- Business logic: Centralized and reusable
- Testability: 10x easier

---

## 🎓 Key Principles

1. **Controllers are thin** - Only HTTP handling
2. **Services contain business logic** - Validation, caching, orchestration
3. **Repositories are dumb** - Only database queries
4. **Client APIs are fetch wrappers** - Used by React components
5. **Each layer has one job** - Single Responsibility Principle

---

## Next Steps

Ready to refactor the next module? Recommended order:
1. CAD Analysis (most complex, highest value)
2. CAD Generation (already has service, just needs cleanup)
3. RFQ (already has service, just needs cleanup)
4. User/Account (need to create missing endpoints)
5. Recommendations (straightforward)
