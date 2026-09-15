# Architecture Diagram Updates

**Date**: December 13, 2025  
**Purpose**: Cross-check architecture diagrams with current implementation and suggest updates

## Executive Summary

After analyzing the current codebase implementation against the provided architecture diagrams, several discrepancies were found. The diagrams show an older architecture pattern without the **Service Layer** that was implemented in December 2025. This document provides detailed recommendations to update the diagrams to match the current 3-tier + MVC hybrid architecture.

---

## Current Architecture (As Implemented)

### Actual Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER (Client Tier)                            │
│ - React Components (Server & Client)                        │
│ - Next.js App Router Pages                                  │
│ - UI Components                                              │
└──────────────────────┬───────────────────────────────────────┘
                       │ uses hooks
┌──────────────────────▼───────────────────────────────────────┐
│ CLIENT-SIDE STATE MANAGEMENT                                 │
│ - React Query (Server State, 5-10 min cache)                │
│ - Zustand (Client State, localStorage)                      │
└──────────────────────┬───────────────────────────────────────┘
                       │ calls
┌──────────────────────▼───────────────────────────────────────┐
│ CLIENT API WRAPPERS (src/lib/api/)                          │
│ - ProductAPI                                                 │
│ - CADAPI                                                     │
│ - AdminReportsAPI                                            │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP fetch
┌──────────────────────▼───────────────────────────────────────┐
│ BUSINESS LOGIC LAYER (Application Tier)                     │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ CONTROLLERS (Thin - 30-90 lines)                       │  │
│ │ - /api/products/route.ts                               │  │
│ │ - /api/analyze-drawing/route.ts                        │  │
│ │ - /api/generate-cad/route.ts                           │  │
│ │ - /api/recommendations/route.ts                        │  │
│ │ - /api/submit-rfq/route.ts                             │  │
│ │                                                         │  │
│ │ Responsibilities:                                       │  │
│ │ - Parse HTTP requests                                   │  │
│ │ - Call service methods                                  │  │
│ │ - Return JSON responses                                 │  │
│ │ - Handle HTTP errors                                    │  │
│ └────────────────────┬───────────────────────────────────┘  │
│                      │ calls                                 │
│ ┌────────────────────▼───────────────────────────────────┐  │
│ │ SERVICES (Business Logic - 150-300 lines)              │  │
│ │ - ProductService                                        │  │
│ │ - CADAnalysisService                                    │  │
│ │ - CADGenerationService                                  │  │
│ │ - RecommendationService                                 │  │
│ │ - RFQService                                            │  │
│ │ - UserService                                           │  │
│ │                                                         │  │
│ │ Responsibilities:                                       │  │
│ │ - Input validation                                      │  │
│ │ - Business rules enforcement                            │  │
│ │ - Caching strategies (Redis)                            │  │
│ │ - Orchestration of repositories                         │  │
│ │ - External API coordination                             │  │
│ └────────────────────┬───────────────────────────────────┘  │
│                      │ uses                                  │
│ ┌────────────────────▼───────────────────────────────────┐  │
│ │ EXTERNAL API CLIENTS                                    │  │
│ │ - gemini-client.ts (Google Gemini AI)                  │  │
│ │ - zoo-client.ts (Zoo Dev API)                          │  │
│ │ - product-matcher.ts (ML matching)                     │  │
│ │ - alternative-product-suggester.ts                     │  │
│ └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                       │ calls
┌──────────────────────▼───────────────────────────────────────┐
│ DATA ACCESS LAYER (Data Tier)                               │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ REPOSITORIES (Database Queries)                        │  │
│ │ - ProductRepository                                     │  │
│ │ - CADHistoryRepository                                  │  │
│ │ - TechnicalDrawingRepository                            │  │
│ │ - RFQRepository                                         │  │
│ │ - UserRepository                                        │  │
│ │                                                         │  │
│ │ Responsibilities:                                       │  │
│ │ - Build SQL queries                                     │  │
│ │ - Execute database operations                           │  │
│ │ - Return raw data                                       │  │
│ │ - No business logic                                     │  │
│ └────────────────────┬───────────────────────────────────┘  │
│                      │ queries                               │
│ ┌────────────────────▼───────────────────────────────────┐  │
│ │ SUPABASE CLIENT                                         │  │
│ │ - supabase-server.ts (Server-side)                     │  │
│ │ - supabase.ts (Client-side)                            │  │
│ └─────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│ DATABASE                                                     │
│ - Supabase PostgreSQL                                        │
│ - Row Level Security (RLS)                                   │
│ - Storage Buckets                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SERVER-SIDE CACHING (Redis)                                  │
│ - @upstash/redis                                             │
│ - 5-10 minute TTL                                            │
│ - Pattern-based invalidation                                 │
│ - Used in Service Layer                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Diagram 1 Analysis: Component-Level Architecture

### Issues Found

1. **Missing Service Layer**: The diagram shows controllers directly calling DAOs (Data Access Objects), but the current implementation has a **Service Layer** between controllers and repositories.

2. **Incorrect Naming**: 
   - Diagram uses "DAO" terminology
   - Implementation uses "Repository" pattern

3. **Missing Components**:
   - No Redis caching layer shown
   - No client-side API wrappers (ProductAPI, CADAPI)
   - No React Query state management
   - No Zustand stores

4. **External API Clients**: 
   - Shown at same level as controllers
   - Should be called by services, not controllers

5. **Missing Repositories**:
   - TechnicalDrawingRepository (for CAD analysis storage)
   - CADHistoryRepository (for CAD generation history)

### Recommended Changes for Diagram 1

#### Update Component Structure

**OLD (Incorrect)**:
```
Controller → DAO → Database
Controller → External API Client
```

**NEW (Correct)**:
```
Client Component → Hook (React Query) → Client API Wrapper → 
Controller (Thin) → Service → Repository → Supabase Client → Database
                      ↓
                External API Client
                      ↓
                Redis Cache
```

#### Specific Component Updates

**1. Add Service Layer Components**:
```
┌─────────────────────────────────────────┐
│ ProductService                          │
├─────────────────────────────────────────┤
│ + getProducts(filters)                  │
│ + getProductById(id)                    │
│ + validateFilters(filters)              │
│ - generateCacheKey(filters)             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ CADAnalysisService                      │
├─────────────────────────────────────────┤
│ + analyzeDrawing(file, userId)          │
│ - validateFile(file)                    │
│ - performAnalysis(file, cadData)        │
│ - storeAnalysis(file, analysis, userId) │
│ - generateFileHash(file)                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ CADGenerationService                    │
├─────────────────────────────────────────┤
│ + generateCAD(request, userId)          │
│ - validateRequest(request)              │
│ - pollOperation(operationId, format)    │
│ - extractModelData(result, format)      │
│ - storeGeneration(...)                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ RecommendationService                   │
├─────────────────────────────────────────┤
│ + getRecommendations(productId)         │
│ - validateProductId(productId)          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ RFQService                              │
├─────────────────────────────────────────┤
│ + submitRFQ(userId, contact, req, files)│
│ + listForUser(userId)                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ UserService                             │
├─────────────────────────────────────────┤
│ + getProfile(userId)                    │
│ + updateProfile(userId, update)         │
└─────────────────────────────────────────┘
```

**2. Rename DAOs to Repositories**:
```
OLD: ProductDAO, CADDrawingDAO, RFQDAO, ReportDAO
NEW: ProductRepository, TechnicalDrawingRepository, 
     CADHistoryRepository, RFQRepository, UserRepository
```

**3. Add Client-Side API Wrappers**:
```
┌─────────────────────────────────────────┐
│ ProductAPI (Client-Side)                │
├─────────────────────────────────────────┤
│ + getProducts(filters): Promise         │
│ + getProductById(id): Promise           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ CADAPI (Client-Side)                    │
├─────────────────────────────────────────┤
│ + generateCAD(request): Promise         │
│ + getHistory(limit, offset): Promise    │
│ + deleteHistoryItem(id): Promise        │
│ + clearHistory(): Promise               │
└─────────────────────────────────────────┘
```

**4. Add Caching Layer**:
```
┌─────────────────────────────────────────┐
│ Redis Cache (Upstash)                   │
├─────────────────────────────────────────┤
│ + getCached<T>(key, fn, ttl)            │
│ + invalidatePattern(pattern)            │
│ + set(key, value, ttl)                  │
│ + get(key)                              │
└─────────────────────────────────────────┘
```

**5. Update Controller Responsibilities**:
```
OLD:
┌─────────────────────────────────────────┐
│ ProductController                       │
├─────────────────────────────────────────┤
│ + handleGetProducts()                   │
│ + handleGetProductById()                │
│ + validateFilters()                     │
│ + buildQuery()                          │
│ + cacheResults()                        │
└─────────────────────────────────────────┘

NEW (Thin):
┌─────────────────────────────────────────┐
│ /api/products/route.ts                  │
├─────────────────────────────────────────┤
│ + GET(request): NextResponse            │
│   - Parse searchParams                  │
│   - Call ProductService.getProducts()   │
│   - Return JSON response                │
└─────────────────────────────────────────┘
```

---

## Diagram 2 Analysis: High-Level Architecture

### Issues Found

1. **Business Logic Layer Mislabeled**: Shows "Controllers" and "External API Clients" at the same level, but services are missing.

2. **Missing Service Layer**: No indication of the service layer that contains business logic.

3. **Data Access Layer**: Shows "DAOs" instead of "Repositories".

4. **Missing Caching**: No Redis caching layer shown.

5. **Client Tier**: Doesn't show React Query or Zustand state management.

### Recommended Changes for Diagram 2

#### Update High-Level Structure

**OLD (Incorrect)**:
```
┌─────────────────────────────────────────────────────────────┐
│ Application Logic Tier (Application Server)                 │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Presentation Layer                                      │ │
│ │ - User Account UI, RFQ UI, CAD Drawing UI, etc.        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Business Logic Layer                                    │ │
│ │ - User Controller, RFQ Controller, CAD Controller       │ │
│ │ - Product Recommendation Controller, Report Controller  │ │
│ │ - Zoo Dev API Client, Gemini API Client                 │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Data Tier (Database Server)                                 │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Data Access Layer                                       │ │
│ │ - User DAO, CAD Drawing DAO, Part Specification DAO     │ │
│ │ - Product Recommendation DAO, RFQ DAO, Report DAO       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Data Source                                             │ │
│ │ - Database (Supabase PostgreSQL)                        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**NEW (Correct)**:
```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT TIER (Browser)                                        │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Presentation Layer (React Components)                   │ │
│ │ - User Account UI, RFQ UI, CAD Drawing UI               │ │
│ │ - Product Catalog UI, CAD Analysis UI, Report UI        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Client State Management                                 │ │
│ │ - React Query (Server State, 5-10 min cache)           │ │
│ │ - Zustand (Client State, localStorage)                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Client API Wrappers (src/lib/api/)                     │ │
│ │ - ProductAPI, CADAPI, AdminReportsAPI                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP (fetch)
┌──────────────────────────▼───────────────────────────────────┐
│ APPLICATION TIER (Next.js Server)                            │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Controllers (Thin - 30-90 lines)                        │ │
│ │ - /api/products/route.ts                                │ │
│ │ - /api/analyze-drawing/route.ts                         │ │
│ │ - /api/generate-cad/route.ts                            │ │
│ │ - /api/recommendations/route.ts                         │ │
│ │ - /api/submit-rfq/route.ts                              │ │
│ │                                                         │ │
│ │ Responsibilities: Parse requests, call services, return │ │
│ └────────────────────┬────────────────────────────────────┘ │
│                      │ calls                                 │
│ ┌────────────────────▼────────────────────────────────────┐ │
│ │ Services (Business Logic - 150-300 lines)               │ │
│ │ - ProductService                                        │ │
│ │ - CADAnalysisService                                    │ │
│ │ - CADGenerationService                                  │ │
│ │ - RecommendationService                                 │ │
│ │ - RFQService                                            │ │
│ │ - UserService                                           │ │
│ │                                                         │ │
│ │ Responsibilities: Validation, business rules, caching,  │ │
│ │ orchestration, external API coordination                │ │
│ └────────────────────┬────────────────────────────────────┘ │
│                      │ uses                                  │
│ ┌────────────────────▼────────────────────────────────────┐ │
│ │ External API Clients (src/lib/)                         │ │
│ │ - gemini-client.ts (Google Gemini AI)                  │ │
│ │ - zoo-client.ts (Zoo Dev API)                          │ │
│ │ - product-matcher.ts (ML matching)                     │ │
│ │ - alternative-product-suggester.ts                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────┘
                           │ calls
┌──────────────────────────▼───────────────────────────────────┐
│ DATA TIER (Supabase)                                         │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Repositories (Data Access - src/repositories/)          │ │
│ │ - ProductRepository                                     │ │
│ │ - CADHistoryRepository                                  │ │
│ │ - TechnicalDrawingRepository                            │ │
│ │ - RFQRepository                                         │ │
│ │ - UserRepository                                        │ │
│ │                                                         │ │
│ │ Responsibilities: Build queries, execute operations,    │ │
│ │ return raw data                                         │ │
│ └────────────────────┬────────────────────────────────────┘ │
│                      │ queries                               │
│ ┌────────────────────▼────────────────────────────────────┐ │
│ │ Supabase Client                                         │ │
│ │ - supabase-server.ts (Server-side with service role)   │ │
│ │ - supabase.ts (Client-side with anon key)              │ │
│ └────────────────────┬────────────────────────────────────┘ │
│                      │                                       │
│ ┌────────────────────▼────────────────────────────────────┐ │
│ │ Data Source                                             │ │
│ │ - PostgreSQL Database (with RLS)                        │ │
│ │ - Storage Buckets (cad-models, technical-drawings, etc)│ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CACHING TIER (Upstash Redis)                                │
│ - Server-side API response caching                          │
│ - 5-10 minute TTL                                            │
│ - Pattern-based invalidation                                 │
│ - Used by Service Layer                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ EXTERNAL APIS                                                │
│ - Google Gemini API (CAD analysis)                           │
│ - Zoo Dev API (CAD generation)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Architecture Principles (For Diagram Annotations)

### 1. Controller Responsibilities (30-90 lines)
- Parse HTTP request parameters
- Call service layer methods
- Return JSON responses
- Handle HTTP errors
- **NO business logic**

### 2. Service Responsibilities (150-300 lines)
- Input validation
- Business rules enforcement
- Caching strategies (Redis)
- Orchestration of repositories
- External API coordination
- **ALL business logic**

### 3. Repository Responsibilities
- Build SQL queries
- Execute database operations
- Return raw data
- **NO business logic**

### 4. Client API Wrapper Responsibilities
- Simple HTTP fetch calls
- Used by React hooks
- **NO business logic**

### 5. State Management
- **React Query**: Server state with automatic caching
- **Zustand**: Client UI state with localStorage
- **Redis**: Server-side API response caching

---

## Implementation Evidence

### Example 1: Product Flow

**Client Component** (`src/components/products/ProductList.tsx`):
```typescript
const { data, isLoading } = useProducts(filters);
```

**Hook** (`src/hooks/useProducts.ts`):
```typescript
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => ProductAPI.getProducts(filters),
    staleTime: 5 * 60 * 1000,
  });
}
```

**Client API Wrapper** (`src/lib/api/product-api.ts`):
```typescript
export class ProductAPI {
  static async getProducts(filters?: ProductFilters) {
    const response = await fetch('/api/products?' + new URLSearchParams(filters));
    return response.json();
  }
}
```

**Controller** (`src/app/api/products/route.ts` - 45 lines):
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters = { category: searchParams.get('category') };
  const result = await ProductService.getProducts(filters);
  return NextResponse.json(result);
}
```

**Service** (`src/services/product.service.ts` - 180 lines):
```typescript
export class ProductService {
  static async getProducts(filters: ProductFilters) {
    this.validateFilters(filters);
    const cacheKey = `products:${JSON.stringify(filters)}`;
    return getCached(cacheKey, async () => {
      const repository = new ProductRepository(await getSupabaseServer());
      return repository.findWithFilters(filters);
    }, 300);
  }
}
```

**Repository** (`src/repositories/product.repository.ts` - 120 lines):
```typescript
export class ProductRepository {
  async findWithFilters(filters: ProductFilters) {
    let query = this.supabase.from('products').select('*');
    if (filters.category) query = query.eq('category', filters.category);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}
```

### Example 2: CAD Analysis Flow

**Controller** (`src/app/api/analyze-drawing/route.ts` - 65 lines):
```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const analysis = await CADAnalysisService.analyzeDrawing(file, userId);
  return NextResponse.json({ success: true, data: analysis });
}
```

**Service** (`src/services/cad-analysis.service.ts` - 280 lines):
```typescript
export class CADAnalysisService {
  static async analyzeDrawing(file: File, userId?: string) {
    const validation = this.validateFile(file);
    const fileHash = await this.generateFileHash(file);
    const cacheKey = `cad:analysis:${fileHash}`;
    const analysis = await getCached(cacheKey, async () => {
      return this.performAnalysis(file, cadModelData);
    }, 86400);
    if (userId) await this.storeAnalysis(file, analysis, userId);
    return analysis;
  }
}
```

**Repository** (`src/repositories/technical-drawing.repository.ts` - 95 lines):
```typescript
export class TechnicalDrawingRepository {
  async createAnalysis(input: TechnicalDrawingCreateInput) {
    const { data, error } = await this.supabase
      .from('technical_drawings')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
```

---

## Summary of Required Diagram Changes

### Diagram 1 (Component-Level)

1. ✅ **Add Service Layer** between Controllers and Repositories
2. ✅ **Rename DAOs** to Repositories
3. ✅ **Add Client API Wrappers** (ProductAPI, CADAPI)
4. ✅ **Add Redis Cache** component
5. ✅ **Add React Query** and **Zustand** state management
6. ✅ **Move External API Clients** to be called by Services
7. ✅ **Add missing repositories**: TechnicalDrawingRepository, CADHistoryRepository
8. ✅ **Update controller methods** to show thin responsibilities
9. ✅ **Add service methods** with business logic responsibilities

### Diagram 2 (High-Level)

1. ✅ **Add Client Tier** with React Query and Zustand
2. ✅ **Add Service Layer** in Application Tier
3. ✅ **Rename Business Logic Layer** to show Controllers + Services
4. ✅ **Rename DAOs** to Repositories
5. ✅ **Add Caching Tier** (Redis)
6. ✅ **Separate External APIs** from Application Tier
7. ✅ **Add Client API Wrappers** layer
8. ✅ **Update layer responsibilities** with accurate descriptions

---

## Migration Status Reference

| Module | Controller | Service | Repository | Status |
|--------|-----------|---------|------------|--------|
| Products | ✅ 45 lines | ✅ 180 lines | ✅ 120 lines | Complete |
| CAD Analysis | ✅ 65 lines | ✅ 280 lines | ✅ 95 lines | Complete |
| CAD Generation | ✅ 55 lines | ✅ 250 lines | ✅ 85 lines | Complete |
| RFQ | ✅ 50 lines | ✅ 60 lines | ✅ 45 lines | Complete |
| User/Account | ✅ 40 lines | ✅ 35 lines | ✅ 40 lines | Complete |
| Recommendations | ✅ 35 lines | ✅ 45 lines | N/A | Complete |

**Total Reduction**: 70-90% smaller controllers after service layer migration

---

## Conclusion

The current architecture diagrams do not reflect the **Service Layer** implementation completed in December 2025. The diagrams should be updated to show:

1. **Three-tier architecture**: Presentation → Business Logic (Controllers + Services) → Data Access (Repositories)
2. **Service layer** as the primary location for business logic
3. **Thin controllers** (30-90 lines) that only handle HTTP concerns
4. **Repositories** instead of DAOs
5. **Client-side state management** with React Query and Zustand
6. **Server-side caching** with Redis
7. **Client API wrappers** for fetch calls

These changes will ensure the diagrams accurately represent the current implementation and architecture patterns.
