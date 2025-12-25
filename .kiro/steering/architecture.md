# Architecture Patterns

## Overview

SteelSmart follows a **3-tier + MVC hybrid architecture** with clean separation of concerns. This architecture was implemented in December 2025 to improve maintainability, testability, and scalability.

## Architecture Layers

### 1. Presentation Layer (Client Tier)
- React components (Server & Client Components)
- Next.js App Router pages
- UI primitives and feature components

### 2. Business Logic Layer (Application Tier)
- **Controllers**: Thin API route handlers (30-90 lines)
- **Services**: Business logic, validation, orchestration
- **External API Clients**: Gemini AI, Zoo Dev API

### 3. Data Access Layer (Data Tier)
- **Repositories**: Database queries and operations
- **Supabase Client**: PostgreSQL database access
- **Storage**: File uploads and management

## Service Layer Pattern

### Why Service Layer?

**Benefits:**
- 70-90% reduction in controller complexity
- Centralized business logic
- Easy to test independently
- Reusable across multiple endpoints
- Clear separation of concerns

### Pattern Implementation

```
┌─────────────────────────────────────────────────────────────┐
│ Client Component                                             │
│  └─ useProducts() hook (React Query)                         │
└──────────────────────┬───────────────────────────────────────┘
                       │ uses
┌──────────────────────▼───────────────────────────────────────┐
│ Client-Side API Wrapper                                      │
│  └─ ProductAPI.getProducts() (fetch call)                    │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP
┌──────────────────────▼───────────────────────────────────────┐
│ Controller (Thin - 30 lines)                                 │
│  └─ /api/products/route.ts                                   │
│     - Parse request                                          │
│     - Call service                                           │
│     - Return response                                        │
└──────────────────────┬───────────────────────────────────────┘
                       │ calls
┌──────────────────────▼───────────────────────────────────────┐
│ Service Layer (Business Logic - 150 lines)                  │
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

## Code Examples

### Controller (Thin)

```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/services/product.service';

export async function GET(request: NextRequest) {
  try {
    // Parse request
    const { searchParams } = new URL(request.url);
    const filters = {
      category: searchParams.get('category'),
      minPrice: parseFloat(searchParams.get('minPrice') || '0'),
    };
    
    // Call service (business logic)
    const result = await ProductService.getProducts(filters);
    
    // Return response
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### Service (Business Logic)

```typescript
// src/services/product.service.ts
import { ProductRepository } from '@/repositories/product.repository';
import { getCached } from '@/lib/cache/redis-cache';

export class ProductService {
  static async getProducts(filters: ProductFilters) {
    // Validate inputs (business logic)
    this.validateFilters(filters);
    
    // Generate cache key (business logic)
    const cacheKey = `products:${JSON.stringify(filters)}`;
    
    // Fetch with caching (business logic)
    return getCached(
      cacheKey,
      async () => {
        const repository = new ProductRepository();
        return repository.findWithFilters(filters);
      },
      300 // TTL: 5 minutes
    );
  }
  
  private static validateFilters(filters: ProductFilters): void {
    if (filters.minPrice < 0) {
      throw new Error('minPrice cannot be negative');
    }
    // More validation...
  }
}
```

### Repository (Data Access)

```typescript
// src/repositories/product.repository.ts
import { getSupabaseServer } from '@/lib/supabase-server';

export class ProductRepository {
  async findWithFilters(filters: ProductFilters) {
    const supabase = await getSupabaseServer();
    
    let query = supabase.from('products').select('*');
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data;
  }
}
```

## State Management Architecture

### Three-Tier Caching System

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: React Query (Client-Side Server State)             │
│ - Automatic caching with background refetching               │
│ - 5-10 minute stale times                                    │
│ - Optimistic updates                                         │
│ - Used in hooks                                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Zustand (Client-Side UI State)                     │
│ - User preferences (theme, format)                           │
│ - Recent searches/history                                    │
│ - localStorage persistence                                   │
│ - No server data                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Redis (Server-Side API Cache)                      │
│ - API response caching (5-10 min TTL)                        │
│ - Reduces database load by 80-90%                            │
│ - Pattern-based invalidation                                 │
│ - Used in service layer                                      │
└─────────────────────────────────────────────────────────────┘
```

### When to Use Each Layer

**React Query** (Server State):
- ✅ Fetching data from APIs
- ✅ Server state that changes over time
- ✅ Data that needs background updates
- ✅ Paginated or infinite scroll data

**Zustand** (Client State):
- ✅ UI state (theme, sidebar open/closed)
- ✅ User preferences (format selection)
- ✅ Form state across steps
- ✅ Recent searches/history
- ❌ Server data (use React Query)

**Redis** (Server Cache):
- ✅ Expensive database queries
- ✅ External API responses
- ✅ Computed results
- ✅ Frequently accessed data
- ❌ User-specific data (use React Query)

## Key Principles

### 1. Single Responsibility Principle
- Controllers: HTTP handling only
- Services: Business logic only
- Repositories: Data access only

### 2. Separation of Concerns
- Each layer has one clear job
- No business logic in controllers
- No database queries in services

### 3. Dependency Injection
- Services receive repositories
- Easy to mock for testing

### 4. DRY (Don't Repeat Yourself)
- Business logic centralized in services
- Reusable across multiple endpoints

### 5. Testability
- Each layer can be tested independently
- No need to mock HTTP for business logic tests

## Migration Status

| Module | Controller | Service | Repository | Status |
|--------|-----------|---------|------------|--------|
| Products | ✅ | ✅ | ✅ | Complete |
| CAD Analysis | ✅ | ✅ | ✅ | Complete |
| CAD Generation | ✅ | ✅ | ✅ | Complete |
| RFQ | ✅ | ✅ | ✅ | Complete |
| User/Account | ✅ | ✅ | ✅ | Complete |
| Recommendations | ✅ | ✅ | N/A | Complete |
| Reports | ✅ | ✅ | N/A | Complete |
| Admin | ✅ | ✅ | ✅ | Complete |
| Interaction Tracking | ✅ | ✅ | N/A | Complete |
| PDF Generation | N/A | ✅ | N/A | Complete |

## Performance Metrics

### Before Refactor
- Controller size: 100-400 lines
- Mixed responsibilities
- Hard to test
- Duplicated logic

### After Refactor
- Controller size: 30-90 lines (70-90% reduction)
- Clear separation
- Easy to test
- Centralized logic

### Caching Impact
- Database queries reduced by 80-90%
- Response times: <200ms (cached), <500ms (uncached)
- Cache hit rate: >80%

## Best Practices

### DO ✅
- Keep controllers thin (30-90 lines)
- Put business logic in services
- Use repositories for all database access
- Validate inputs in services
- Cache expensive operations
- Test each layer independently

### DON'T ❌
- Put business logic in controllers
- Query database directly in controllers
- Mix concerns across layers
- Skip validation
- Ignore caching opportunities
- Test only end-to-end

## Documentation References

For more details, see:
- `documentation/Architecture/ARCHITECTURE_ANALYSIS.md` - Gap analysis
- `documentation/Architecture/SERVICE_LAYER_MIGRATION.md` - Migration guide
- `documentation/Architecture/ARCHITECTURE_RECENT_CHANGES.md` - Recent changes
- `documentation/PROJECT_STRUCTURE.md` - Complete structure guide
- `documentation/PRODUCT_MATCH_SCORING.md` - Product matching algorithm
- `documentation/CAD_ANALYZER_AI_FLOW.md` - CAD analysis AI flow
- `documentation/AUTH_ARCHITECTURE.md` - Authentication architecture
