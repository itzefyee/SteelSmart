# Project Structure

## Architecture Overview

SteelSmart follows a **3-tier + MVC hybrid architecture** with clean separation of concerns:

- **Presentation Layer**: React components and pages
- **Business Logic Layer**: Services for domain logic
- **Data Access Layer**: Repositories for database operations
- **State Management**: Three-tier caching (React Query + Zustand + Redis)
- **API Layer**: Thin controllers in API routes

## Directory Organization

```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API route handlers (thin controllers)
│   │   ├── analyze-drawing/   # CAD analysis endpoint
│   │   ├── generate-cad/      # CAD generation endpoint
│   │   ├── products/          # Product CRUD endpoints
│   │   ├── recommendations/   # Product recommendations
│   │   └── submit-rfq/        # RFQ submission
│   ├── cad-analyzer/      # CAD analysis page
│   ├── cad-generator/     # CAD generation page
│   ├── catalog/           # Product catalog with [id] dynamic routes
│   ├── login/             # Authentication pages
│   ├── signup/
│   ├── rfq/              # Request for Quote
│   ├── reports/          # User reports/history
│   ├── account/          # User account management
│   ├── providers.tsx     # React Query & context providers
│   ├── layout.tsx        # Root layout with metadata
│   ├── page.tsx          # Homepage
│   └── globals.css       # Global styles + Tailwind
├── components/           # React components
│   ├── ui/              # Reusable UI primitives
│   ├── auth/            # Authentication components
│   ├── cad/             # CAD-related components
│   ├── products/        # Product components
│   ├── rfq/             # RFQ components
│   └── layout/          # Layout components
├── services/            # Business logic layer (NEW)
│   ├── product.service.ts
│   ├── cad-analysis.service.ts
│   ├── cad-generation.service.ts
│   ├── recommendation.service.ts
│   ├── rfq.service.ts
│   └── user.service.ts
├── repositories/        # Data access layer (NEW)
│   ├── product.repository.ts
│   ├── technical-drawing.repository.ts
│   ├── cad-history.repository.ts
│   ├── rfq.repository.ts
│   └── user.repository.ts
├── stores/              # Zustand state stores (NEW)
│   ├── ui.store.ts
│   └── cad.store.ts
├── hooks/               # Custom React hooks (with React Query)
│   ├── useProducts.ts
│   ├── useCADAnalysis.ts
│   ├── useCADGeneration.ts
│   └── useFileUpload.ts
├── lib/                 # Utility libraries & clients
│   ├── api/            # Client-side API wrappers
│   │   ├── product-api.ts
│   │   └── cad-api.ts
│   ├── cache/          # Redis caching utilities
│   │   ├── redis-cache.ts
│   │   └── cache-keys.ts
│   ├── supabase.ts     # Client-side Supabase
│   ├── supabase-server.ts  # Server-side Supabase
│   ├── gemini-client.ts    # Google Gemini AI client
│   ├── zoo-client.ts       # Zoo Dev API client
│   └── utils.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── data/                # Static JSON data (legacy)
└── __tests__/           # Test files
    ├── components/
    ├── cad/
    └── lib/
```

## Key Conventions

### API Routes (`src/app/api/`) - Thin Controllers

**CRITICAL**: API routes are **thin controllers** that only handle HTTP concerns:
- Parse request parameters
- Call service layer methods
- Return JSON responses
- Handle errors

**DO NOT** put business logic in controllers. Extract to services.

**Pattern:**
```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/services/product.service';

export async function GET(request: NextRequest) {
  try {
    // Parse request
    const { searchParams } = new URL(request.url);
    const filters = { category: searchParams.get('category') };
    
    // Call service (business logic)
    const result = await ProductService.getProducts(filters);
    
    // Return response
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### Services (`src/services/`) - Business Logic Layer

Services contain all business logic:
- Validation
- Caching strategies
- Business rules
- Orchestration of repositories and external APIs

**Pattern:**
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
    return getCached(cacheKey, async () => {
      const repository = new ProductRepository();
      return repository.findWithFilters(filters);
    }, 300);
  }
}
```

### Repositories (`src/repositories/`) - Data Access Layer

Repositories handle ONLY database operations:
- CRUD operations
- Query building
- No business logic
- Return raw data

**Pattern:**
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
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data;
  }
}
```

### Components (`src/components/`)

- **Client Components**: Use `'use client'` directive for interactivity
- **Server Components**: Default, no directive needed
- **UI Components**: Reusable primitives in `components/ui/` (Button, Input, Modal, etc.)
- **Feature Components**: Domain-specific (CADAnalyzer, ProductCard, RFQForm)

### Data Layer (`src/data/`)

- `products.json`: Product catalog (20+ items)
- `categories.json`: Category definitions
- `sample-data.ts`: Mock data for development

### Hooks (`src/hooks/`) - React Query Integration

Custom hooks use **React Query** for server state management:

**Pattern:**
```typescript
// src/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { ProductAPI } from '@/lib/api/product-api';

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => ProductAPI.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Client API Wrappers (`src/lib/api/`)

Client-side fetch wrappers for React components:
- Used by hooks
- Simple HTTP calls
- No business logic

**Pattern:**
```typescript
// src/lib/api/product-api.ts
export class ProductAPI {
  static async getProducts(filters?: ProductFilters) {
    const response = await fetch('/api/products?' + new URLSearchParams(filters));
    return response.json();
  }
}
```

### Libraries (`src/lib/`)

- **API Wrappers**: `api/product-api.ts`, `api/cad-api.ts` (client-side)
- **External Clients**: `gemini-client.ts`, `zoo-client.ts` (server-side)
- **Supabase**: `supabase.ts` (client), `supabase-server.ts` (server)
- **Caching**: `cache/redis-cache.ts`, `cache/cache-keys.ts`
- **Utilities**: `utils.ts`, `logger.ts`

### Types (`src/types/`)

- All TypeScript interfaces and types in `index.ts`
- Shared across entire application
- Examples: `Product`, `CADHistoryItem`, `DrawingAnalysis`, `RFQSubmission`

## File Naming

- **Components**: PascalCase (e.g., `ProductCard.tsx`)
- **Utilities**: kebab-case (e.g., `product-matcher.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useCADAnalysis.ts`)
- **API Routes**: `route.ts` (Next.js convention)

## Import Patterns

Use path alias for cleaner imports:
```typescript
// Good
import { Product } from '@/types';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

// Avoid
import { Product } from '../../../types';
```

## Component Patterns

### Client Components
```typescript
'use client';

import { useState } from 'react';

export default function MyComponent() {
  const [state, setState] = useState();
  // Interactive logic
}
```

### Server Components
```typescript
import { getSupabaseServer } from '@/lib/supabase-server';

export default async function MyPage() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('products').select('*');
  // Server-side data fetching
}
```

## State Management - Three-Tier Architecture

### 1. React Query - Server State
- Automatic caching with background refetching
- Used in hooks for API data
- 5-10 minute stale times
- Optimistic updates

### 2. Zustand - Client State
- UI preferences (theme, format selection)
- Recent searches/history
- localStorage persistence
- No server data

### 3. Redis - Server-Side Cache
- API response caching (5-10 minute TTL)
- Reduces database load by 80-90%
- Pattern-based invalidation
- Used in service layer

## Database Access

**CRITICAL**: Always use repositories for database access, never query directly in controllers or services.

- **Client-side**: Use `@/lib/supabase` (respects RLS)
- **Server-side**: Use repositories that use `@/lib/supabase-server`
- All tables have Row Level Security policies
- Users can only access their own data by default

**Pattern:**
```typescript
// ❌ BAD: Direct database access in controller
export async function GET() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('products').select('*');
  return NextResponse.json(data);
}

// ✅ GOOD: Use service → repository pattern
export async function GET() {
  const products = await ProductService.getProducts();
  return NextResponse.json(products);
}
```

## Storage Buckets

- `cad-models`: User-generated CAD files (private)
- `technical-drawings`: Uploaded drawings for analysis (private)
- `rfq-attachments`: RFQ submission files (private)
- `product-images`: Public product images (public)

## Testing Structure

```
src/__tests__/
├── components/        # Component tests
│   └── ProductCard.test.tsx
├── cad/              # CAD feature tests
│   ├── cad-generator-uc101.test.ts
│   ├── cad-generator-uc102.test.ts
│   └── cad-generator-uc104.test.ts
└── lib/              # Utility function tests
```

**Testing Tools:**
- **Vitest**: Test runner with jsdom environment
- **@testing-library/react**: Component testing
- **@testing-library/jest-dom**: Custom matchers

**Test Pattern:**
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('ProductCard', () => {
  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Steel Beam')).toBeInTheDocument();
  });
});
```

## Architecture Benefits

### Controller Size Reduction
- **Before refactor**: 100-400 lines per controller
- **After refactor**: 30-90 lines per controller
- **Reduction**: 70-90% smaller controllers

### Testability
- Each layer can be tested independently
- No need to mock HTTP for business logic tests
- Easy to mock repositories in service tests

### Maintainability
- Clear separation of concerns
- Business logic centralized in services
- Easy to find and modify code
- Consistent patterns across codebase
