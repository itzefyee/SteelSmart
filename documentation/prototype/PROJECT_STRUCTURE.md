# Project Structure Guide

This document describes the complete project structure and architectural patterns used in SteelSmart AI Marketplace. This structure can be adapted for similar Next.js applications.

## Overview

This is a modern Next.js 16 application using the App Router with a clean, scalable architecture that separates concerns into distinct layers:

- **Presentation Layer**: React components and pages
- **Business Logic Layer**: Services for domain logic
- **Data Access Layer**: Repositories for database operations
- **State Management**: Three-tier caching and state system
- **API Layer**: RESTful endpoints with proper error handling

## Tech Stack

### Core Framework
- **Next.js 16.0.1**: App Router with React Server Components
- **React 19.1.0**: Latest React with modern hooks
- **TypeScript 5+**: Strict mode for type safety
- **Node.js 18+**: Required runtime

### Styling & UI
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Framer Motion 12.23**: Animation library
- **Lucide React**: Icon library

### Backend & Database
- **Supabase**: PostgreSQL database with Row Level Security
- **@supabase/supabase-js**: Database client
- **@supabase/ssr**: Server-side rendering support

### State Management (3-Layer Architecture)
- **@tanstack/react-query 5.90**: Server state management with automatic caching
- **Zustand 5.0**: Client-side UI state with persistence
- **@upstash/redis 1.35**: Server-side API response caching

### AI & External APIs
- **@google/generative-ai**: Google Gemini AI integration
- **@kittycad/lib**: Zoo Dev API for CAD operations

### 3D Visualization
- **Three.js 0.181**: 3D rendering engine
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers for Three.js
- **opencascade.js**: WASM-based CAD file parsing

### Testing
- **Vitest 4.0**: Fast test runner with jsdom
- **@testing-library/react**: Component testing
- **@testing-library/jest-dom**: Custom matchers

### Development Tools
- **ESLint 9**: Code linting
- **tsx**: TypeScript execution for scripts
- **@vitest/ui**: Visual test interface

## Directory Structure

```
project-root/
├── src/                          # Source code
│   ├── app/                      # Next.js App Router
│   ├── components/               # React components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utility libraries
│   ├── repositories/             # Data access layer
│   ├── services/                 # Business logic layer
│   ├── stores/                   # Zustand state stores
│   ├── types/                    # TypeScript definitions
│   ├── data/                     # Static JSON data
│   ├── __tests__/                # Test files
│   └── proxy.ts                  # API proxy config
├── supabase/                     # Database configuration
│   ├── migrations/               # SQL migrations
│   ├── seeds/                    # Seed data
│   └── storage_setup.sql         # Storage buckets
├── public/                       # Static assets
├── scripts/                      # Utility scripts
├── documentation/                # Project documentation
└── Configuration files
```

## Detailed Structure

### 1. App Directory (`src/app/`)

Next.js 16 App Router with file-based routing.

```
src/app/
├── api/                          # API Routes (Server-side)
│   ├── [feature]/
│   │   └── route.ts             # API endpoint handler
│   └── ...
├── [page-name]/                  # Feature pages
│   ├── page.tsx                 # Page component
│   └── layout.tsx               # Optional layout
├── layout.tsx                    # Root layout
├── page.tsx                      # Homepage
├── providers.tsx                 # Context providers (React Query, etc.)
└── globals.css                   # Global styles + Tailwind imports
```

**Key Conventions:**
- `page.tsx` - Page component (can be Server or Client Component)
- `layout.tsx` - Shared layout wrapper
- `route.ts` - API endpoint (always server-side)
- `loading.tsx` - Loading UI (optional)
- `error.tsx` - Error boundary (optional)
- `not-found.tsx` - 404 page (optional)

**API Routes Pattern:**
```typescript
// src/app/api/[feature]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FeatureService } from '@/services/feature.service';

export async function GET(request: NextRequest) {
  try {
    const service = new FeatureService();
    const data = await service.getData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const service = new FeatureService();
    const result = await service.createData(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 2. Components Directory (`src/components/`)

Organized by feature with a shared UI library.

```
src/components/
├── ui/                           # Base UI primitives (reusable)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── LoadingSpinner.tsx
│   └── ...
├── [feature]/                    # Feature-specific components
│   ├── FeatureComponent.tsx
│   ├── FeatureForm.tsx
│   └── ...
├── layout/                       # Layout components
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ...
├── auth/                         # Authentication components
│   └── AuthProvider.tsx
└── ErrorBoundary.tsx             # Global error boundary
```

**Component Patterns:**

**Client Component (Interactive):**
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function InteractiveComponent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <Button onClick={() => setCount(count + 1)}>
        Increment
      </Button>
    </div>
  );
}
```

**Server Component (Default):**
```typescript
import { getSupabaseServer } from '@/lib/supabase-server';

export default async function ServerComponent() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('items').select('*');

  return (
    <div>
      {data?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### 3. Hooks Directory (`src/hooks/`)

Custom React hooks for reusable logic with React Query integration.

```
src/hooks/
├── index.ts                      # Export all hooks
├── useFeatureData.ts             # Data fetching with React Query
├── useFeatureMutation.ts         # Data mutations
├── useFileUpload.ts              # File upload handling
└── useReducedMotion.ts           # Accessibility hooks
```

**React Query Hook Pattern:**
```typescript
// src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductService } from '@/services/product.service';

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => ProductService.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductInput) => 
      ProductService.createProduct(data),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

### 4. Libraries Directory (`src/lib/`)

Utility functions, API clients, and shared logic.

```
src/lib/
├── api/                          # API client utilities
│   ├── feature-api.ts
│   └── error-handler.ts
├── cache/                        # Redis caching system
│   ├── redis-cache.ts
│   ├── cache-keys.ts
│   └── README.md
├── errors/                       # Error handling
│   └── app-errors.ts
├── performance/                  # Performance monitoring
│   └── query-performance.ts
├── validation/                   # Validation schemas
│   └── schemas.ts
├── supabase.ts                   # Client-side Supabase
├── supabase-server.ts            # Server-side Supabase
├── external-api-client.ts        # External API integrations
├── logger.ts                     # Logging utility
├── utils.ts                      # Helper functions
└── database.types.ts             # Generated Supabase types
```

**Supabase Client Pattern:**
```typescript
// src/lib/supabase.ts (Client-side)
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// src/lib/supabase-server.ts (Server-side)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
```

**Redis Cache Pattern:**
```typescript
// src/lib/cache/redis-cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  const data = await fetcher();
  await redis.setex(key, ttl, data);
  return data;
}

export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### 5. Repositories Directory (`src/repositories/`)

Data access layer - abstracts database operations.

```
src/repositories/
├── feature.repository.ts
├── user.repository.ts
└── ...
```

**Repository Pattern:**
```typescript
// src/repositories/product.repository.ts
import { getSupabaseServer } from '@/lib/supabase-server';
import { Product, CreateProductInput } from '@/types';

export class ProductRepository {
  async findAll(filters?: ProductFilters): Promise<Product[]> {
    const supabase = await getSupabaseServer();
    
    let query = supabase.from('products').select('*');
    
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  async findById(id: string): Promise<Product | null> {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('products')
      .insert(input)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async update(id: string, input: Partial<Product>): Promise<Product> {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('products')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const supabase = await getSupabaseServer();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}
```

### 6. Services Directory (`src/services/`)

Business logic layer - orchestrates repositories and external APIs.

```
src/services/
├── feature.service.ts
├── user.service.ts
└── ...
```

**Service Pattern:**
```typescript
// src/services/product.service.ts
import { ProductRepository } from '@/repositories/product.repository';
import { getCached, invalidateCache } from '@/lib/cache/redis-cache';
import { Product, CreateProductInput } from '@/types';

export class ProductService {
  private repository: ProductRepository;

  constructor() {
    this.repository = new ProductRepository();
  }

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    const cacheKey = `products:${JSON.stringify(filters)}`;
    
    return getCached(
      cacheKey,
      () => this.repository.findAll(filters),
      300 // 5 minutes TTL
    );
  }

  async getProductById(id: string): Promise<Product | null> {
    const cacheKey = `product:${id}`;
    
    return getCached(
      cacheKey,
      () => this.repository.findById(id),
      600 // 10 minutes TTL
    );
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    const product = await this.repository.create(input);
    
    // Invalidate cache
    await invalidateCache('products:*');
    
    return product;
  }

  async updateProduct(id: string, input: Partial<Product>): Promise<Product> {
    const product = await this.repository.update(id, input);
    
    // Invalidate specific cache entries
    await invalidateCache(`product:${id}`);
    await invalidateCache('products:*');
    
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.repository.delete(id);
    
    // Invalidate cache
    await invalidateCache(`product:${id}`);
    await invalidateCache('products:*');
  }
}
```

### 7. Stores Directory (`src/stores/`)

Zustand stores for client-side UI state with persistence.

```
src/stores/
├── feature.store.ts
├── ui.store.ts
└── ...
```

**Zustand Store Pattern:**
```typescript
// src/stores/ui.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  selectedFormat: string;
  recentSearches: string[];
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setFormat: (format: string) => void;
  addRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarOpen: true,
      selectedFormat: 'step',
      recentSearches: [],

      setTheme: (theme) => set({ theme }),
      
      toggleSidebar: () => 
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setFormat: (format) => set({ selectedFormat: format }),
      
      addRecentSearch: (search) =>
        set((state) => ({
          recentSearches: [
            search,
            ...state.recentSearches.filter((s) => s !== search),
          ].slice(0, 10),
        })),
      
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'ui-storage', // localStorage key
      partialize: (state) => ({
        theme: state.theme,
        selectedFormat: state.selectedFormat,
        recentSearches: state.recentSearches,
      }),
    }
  )
);
```

### 8. Types Directory (`src/types/`)

Centralized TypeScript type definitions.

```
src/types/
└── index.ts                      # All interfaces and types
```

**Type Definition Pattern:**
```typescript
// src/types/index.ts

// Database Models
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  specifications: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  created_at: string;
}

// Input Types
export interface CreateProductInput {
  name: string;
  category: string;
  price: number;
  description: string;
  specifications?: Record<string, any>;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

// Filter Types
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: any;
}

// Feature-specific Types
export interface CADAnalysisResult {
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  material: string;
  confidence: number;
  recommendations: Product[];
}
```

### 9. Testing Directory (`src/__tests__/`)

Organized by feature with Vitest.

```
src/__tests__/
├── components/                   # Component tests
│   ├── Button.test.tsx
│   └── ProductCard.test.tsx
├── lib/                          # Utility tests
│   └── utils.test.ts
├── hooks/                        # Hook tests
│   └── useProducts.test.ts
└── [feature]/                    # Feature tests
    └── feature.test.ts
```

**Test Pattern:**
```typescript
// src/__tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### 10. Database Directory (`supabase/`)

Database migrations and seed data.

```
supabase/
├── migrations/                   # SQL migrations (ordered)
│   ├── 20250115000000_initial_schema.sql
│   ├── 20250116000000_add_feature.sql
│   └── ...
├── seeds/                        # Seed data
│   └── initial_data.sql
└── storage_setup.sql             # Storage bucket configuration
```

**Migration Pattern:**
```sql
-- supabase/migrations/20250115000000_initial_schema.sql

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  specifications JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_products_category ON products(category);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public read access"
  ON products FOR SELECT
  TO public
  USING (true);

-- Create policy for authenticated write access
CREATE POLICY "Authenticated write access"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

## State Management Architecture

### Three-Layer Caching System

1. **React Query** - Server state with automatic caching
   - Automatic background refetching
   - Optimistic updates
   - Cache invalidation
   - Stale-while-revalidate pattern

2. **Zustand** - Client-side UI state
   - User preferences
   - UI selections
   - Form state
   - localStorage persistence

3. **Redis** - Server-side API caching
   - Reduce database load
   - Fast response times
   - TTL-based expiration
   - Pattern-based invalidation

### When to Use Each

**React Query:**
- Fetching data from APIs
- Server state that changes over time
- Data that needs background updates
- Paginated or infinite scroll data

**Zustand:**
- UI state (theme, sidebar open/closed)
- User preferences (format selection)
- Form state across steps
- Recent searches/history

**Redis:**
- Expensive database queries
- External API responses
- Computed results
- Frequently accessed data

## Configuration Files

### package.json
```json
{
  "name": "your-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build --webpack",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.81.1",
    "@tanstack/react-query": "^5.90.10",
    "@upstash/redis": "^1.35.6",
    "framer-motion": "^12.23.24",
    "lucide-react": "^0.554.0",
    "next": "^16.0.1",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "tailwindcss": "^3.4.17",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.1",
    "@types/node": "^20",
    "@types/react": "^19",
    "@vitejs/plugin-react": "^4.3.4",
    "@vitest/ui": "^4.0.14",
    "eslint": "^9",
    "eslint-config-next": "15.4.5",
    "typescript": "^5",
    "vitest": "^4.0.14"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  webpack: (config, { isServer }) => {
    // WASM support for OpenCascade.js or similar
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
```

## Environment Variables

### .env.local (Development)
```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Redis (Optional)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# External APIs (Optional)
GEMINI_API_KEY=your_key
EXTERNAL_API_TOKEN=your_token

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Best Practices

### 1. File Naming
- **Components**: PascalCase (`ProductCard.tsx`)
- **Utilities**: kebab-case (`product-matcher.ts`)
- **Hooks**: camelCase with `use` prefix (`useProducts.ts`)
- **API Routes**: `route.ts` (Next.js convention)

### 2. Import Patterns
```typescript
// Use path alias
import { Product } from '@/types';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

// Avoid relative paths
// import { Product } from '../../../types';
```

### 3. Component Organization
- Keep components small and focused
- Extract reusable logic into hooks
- Use composition over inheritance
- Separate presentational and container components

### 4. State Management
- Use React Query for server state
- Use Zustand for UI state
- Keep state as local as possible
- Lift state only when necessary

### 5. Error Handling
```typescript
// API routes
try {
  const result = await service.getData();
  return NextResponse.json(result);
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

// Components with error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <YourComponent />
</ErrorBoundary>
```

### 6. Performance
- Use React Server Components by default
- Add `'use client'` only when needed
- Implement proper caching strategies
- Optimize images with Next.js Image component
- Use dynamic imports for code splitting

### 7. Security
- Never commit `.env` files
- Use Row Level Security in Supabase
- Validate all user inputs
- Sanitize data before rendering
- Use HTTPS in production

## Adapting This Structure

To use this structure in a new project:

1. **Copy the directory structure**
2. **Install dependencies** from package.json
3. **Set up Supabase** with migrations
4. **Configure environment variables**
5. **Update types** in `src/types/index.ts`
6. **Create repositories** for your data models
7. **Build services** for business logic
8. **Create hooks** with React Query
9. **Build components** following the patterns
10. **Write tests** for critical functionality

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/)

---

**Last Updated**: December 2, 2025
**Version**: 1.0.0
