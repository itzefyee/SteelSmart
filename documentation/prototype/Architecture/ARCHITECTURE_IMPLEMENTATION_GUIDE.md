# Architecture Implementation Guide

This guide provides practical code examples for implementing the recommended architecture patterns in the SteelSmart codebase.

## Table of Contents

1. [Service Layer Implementation](#service-layer-implementation)
2. [Repository Pattern](#repository-pattern)
3. [API Route Refactoring](#api-route-refactoring)
4. [State Management Setup](#state-management-setup)
5. [Caching Implementation](#caching-implementation)
6. [Error Handling](#error-handling)
7. [Validation Setup](#validation-setup)

---

## Service Layer Implementation

### Example: CAD Generation Service

```typescript
// src/services/cad/CADGenerationService.ts
import { ml } from '@kittycad/lib';
import { CADHistoryRepository } from '@/repositories/cad-history.repository';
import { StorageService } from '@/services/storage/StorageService';
import { logger } from '@/lib/logger';
import { AppError, NotFoundError } from '@/lib/errors/app-errors';
import type { CADGenerationRequest, CADGenerationResult } from '@/types/cad.types';

export class CADGenerationService {
  constructor(
    private historyRepo: CADHistoryRepository,
    private storageService: StorageService
  ) {}

  async generate(request: CADGenerationRequest, userId: string): Promise<CADGenerationResult> {
    try {
      logger.info('Starting CAD generation', { userId, request });

      // Create operation
      const operation = await ml.create_text_to_cad({
        prompt: request.description,
        output_format: request.format || 'step',
      });

      // Poll for completion
      const result = await this.pollOperation(operation.id);

      // Store in history
      const historyItem = await this.historyRepo.create({
        user_id: userId,
        prompt: request.description,
        category: request.category,
        format: request.format,
        units: request.units,
        status: 'completed',
        operation_id: operation.id,
        model_data: result.model_data,
      });

      // Upload to storage
      const fileUrl = await this.storageService.uploadCADModel(
        result.model_data,
        `${historyItem.id}.${request.format}`
      );

      logger.info('CAD generation completed', { userId, historyId: historyItem.id });

      return {
        id: historyItem.id,
        modelData: result.model_data,
        fileUrl,
        format: request.format,
        parameters: result.parameters,
      };
    } catch (error) {
      logger.error('CAD generation failed', error, { userId, request });
      
      // Store failed attempt
      await this.historyRepo.create({
        user_id: userId,
        prompt: request.description,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  private async pollOperation(operationId: string, maxAttempts = 30): Promise<any> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const operation = await ml.get_operation({ id: operationId });

      if (operation.status === 'completed') {
        return operation.result;
      }

      if (operation.status === 'failed') {
        throw new AppError('CAD_GENERATION_FAILED', 'CAD generation operation failed');
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new AppError('CAD_GENERATION_TIMEOUT', 'CAD generation timed out');
  }

  async getHistory(userId: string, limit = 20): Promise<CADHistoryItem[]> {
    return this.historyRepo.findByUserId(userId, limit);
  }

  async getById(id: string, userId: string): Promise<CADHistoryItem> {
    const item = await this.historyRepo.findById(id);
    
    if (!item || item.user_id !== userId) {
      throw new NotFoundError('CAD history item');
    }

    return item;
  }
}
```

### Example: Product Service

```typescript
// src/services/products/ProductService.ts
import { ProductRepository } from '@/repositories/product.repository';
import { getCached } from '@/lib/cache/redis-cache';
import { logger } from '@/lib/logger';
import type { Product, ProductFilters } from '@/types/product.types';

export class ProductService {
  constructor(private productRepo: ProductRepository) {}

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    const cacheKey = `products:${JSON.stringify(filters)}`;
    
    return getCached(
      cacheKey,
      () => this.productRepo.findByFilters(filters),
      3600 // 1 hour cache
    );
  }

  async getProduct(id: string): Promise<Product | null> {
    const cacheKey = `product:${id}`;
    
    return getCached(
      cacheKey,
      () => this.productRepo.findById(id),
      1800 // 30 minutes cache
    );
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `products:search:${query.toLowerCase()}`;
    
    return getCached(
      cacheKey,
      () => this.productRepo.search(query),
      600 // 10 minutes cache
    );
  }

  async getRecommendations(specs: ProductSpecs): Promise<Product[]> {
    // Implementation with AI matching
    return this.productRepo.findBySpecs(specs);
  }
}
```

---

## Repository Pattern

### Example: Product Repository

```typescript
// src/repositories/product.repository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { RepositoryError } from '@/lib/errors/app-errors';
import type { Product, ProductFilters } from '@/types/product.types';

export class ProductRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new RepositoryError('Failed to fetch product', error);
    }

    return this.mapToProduct(data);
  }

  async findByFilters(filters?: ProductFilters): Promise<Product[]> {
    let query = this.supabase
      .from('products')
      .select('id, name, category, material, price, images, description, in_stock');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.material) {
      query = query.eq('material', filters.material);
    }

    if (filters?.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters?.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters?.inStock !== undefined) {
      query = query.eq('in_stock', filters.inStock);
    }

    // Pagination
    const page = filters?.page || 0;
    const limit = filters?.limit || 20;
    query = query.range(page * limit, (page + 1) * limit - 1);

    // Sorting
    const sortBy = filters?.sortBy || 'created_at';
    const sortOrder = filters?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) {
      throw new RepositoryError('Failed to fetch products', error);
    }

    return data.map(this.mapToProduct);
  }

  async search(query: string): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(50);

    if (error) {
      throw new RepositoryError('Search failed', error);
    }

    return data.map(this.mapToProduct);
  }

  async findBySpecs(specs: ProductSpecs): Promise<Product[]> {
    // Complex query based on specifications
    // Implementation depends on your schema
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .contains('specifications', specs);

    if (error) {
      throw new RepositoryError('Failed to find products by specs', error);
    }

    return data.map(this.mapToProduct);
  }

  private mapToProduct(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      material: row.material,
      price: parseFloat(row.price),
      images: row.images || [],
      description: row.description,
      specifications: row.specifications,
      inStock: row.in_stock,
      // ... map other fields
    };
  }
}
```

### Example: CAD History Repository

```typescript
// src/repositories/cad-history.repository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { RepositoryError } from '@/lib/errors/app-errors';
import type { CADHistoryItem, CADHistoryCreate } from '@/types/cad.types';

export class CADHistoryRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async create(data: CADHistoryCreate): Promise<CADHistoryItem> {
    const { data: result, error } = await this.supabase
      .from('cad_history')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new RepositoryError('Failed to create CAD history', error);
    }

    return this.mapToHistoryItem(result);
  }

  async findById(id: string): Promise<CADHistoryItem | null> {
    const { data, error } = await this.supabase
      .from('cad_history')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new RepositoryError('Failed to fetch CAD history', error);
    }

    return this.mapToHistoryItem(data);
  }

  async findByUserId(userId: string, limit = 20): Promise<CADHistoryItem[]> {
    const { data, error } = await this.supabase
      .from('cad_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new RepositoryError('Failed to fetch CAD history', error);
    }

    return data.map(this.mapToHistoryItem);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('cad_history')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Ensure user can only delete their own

    if (error) {
      throw new RepositoryError('Failed to delete CAD history', error);
    }
  }

  private mapToHistoryItem(row: any): CADHistoryItem {
    return {
      id: row.id,
      user_id: row.user_id,
      prompt: row.prompt,
      category: row.category,
      format: row.format,
      units: row.units,
      status: row.status,
      model_data: row.model_data,
      created_at: row.created_at,
      // ... map other fields
    };
  }
}
```

---

## API Route Refactoring

### Before (Current Pattern)

```typescript
// src/app/api/generate-cad/route.ts (Current)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Direct API calls, no validation, mixed concerns
    const result = await ml.create_text_to_cad({...});
    // ...
  } catch (error) {
    // Basic error handling
  }
}
```

### After (Recommended Pattern)

```typescript
// src/app/api/generate-cad/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CADGenerationService } from '@/services/cad/CADGenerationService';
import { CADHistoryRepository } from '@/repositories/cad-history.repository';
import { StorageService } from '@/services/storage/StorageService';
import { validateRequest } from '@/lib/validation';
import { handleApiError } from '@/lib/api/error-handler';
import { rateLimiter } from '@/lib/api/rate-limiter';
import { requireAuth } from '@/lib/auth/require-auth';
import { cadGenerationSchema } from '@/lib/validation/cad.schemas';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimiter.limit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // 2. Authentication
    const { user, supabase } = await requireAuth(request);

    // 3. Validation
    const body = await request.json();
    const validated = await validateRequest(body, cadGenerationSchema);

    // 4. Service layer
    const historyRepo = new CADHistoryRepository(supabase);
    const storageService = new StorageService(supabase);
    const service = new CADGenerationService(historyRepo, storageService);
    
    const result = await service.generate(validated, user.id);

    // 5. Response
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## State Management Setup

### React Query Setup

```typescript
// src/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Using React Query in Components

```typescript
// src/hooks/products/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { ProductService } from '@/services/products/ProductService';
import { getSupabaseServer } from '@/lib/supabase-server';
import type { ProductFilters } from '@/types/product.types';

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const supabase = await getSupabaseServer();
      const repo = new ProductRepository(supabase);
      const service = new ProductService(repo);
      return service.getProducts(filters);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const supabase = await getSupabaseServer();
      const repo = new ProductRepository(supabase);
      const service = new ProductService(repo);
      return service.getProduct(id);
    },
    enabled: !!id,
  });
}
```

### Zustand Store Example

```typescript
// src/stores/cad.store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface CADStore {
  currentModel: CADModel | null;
  generationParams: CADGenerationParams | null;
  setCurrentModel: (model: CADModel | null) => void;
  setGenerationParams: (params: CADGenerationParams) => void;
  clear: () => void;
}

export const useCADStore = create<CADStore>()(
  devtools(
    persist(
      (set) => ({
        currentModel: null,
        generationParams: null,
        setCurrentModel: (model) => set({ currentModel: model }),
        setGenerationParams: (params) => set({ generationParams: params }),
        clear: () => set({ currentModel: null, generationParams: null }),
      }),
      {
        name: 'cad-storage',
        partialize: (state) => ({ generationParams: state.generationParams }),
      }
    ),
    { name: 'CADStore' }
  )
);
```

---

## Caching Implementation

### Redis Cache Setup

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
  ttl: number = 3600
): Promise<T> {
  try {
    // Try to get from cache
    const cached = await redis.get<T>(key);
    if (cached !== null) {
      return cached;
    }

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

export async function invalidateCache(pattern: string): Promise<void> {
  // Implementation for cache invalidation
  // Note: Upstash Redis REST API doesn't support KEYS command
  // You'll need to maintain a list of keys or use a different approach
}
```

### Using Cache in Services

```typescript
// In ProductService
async getProducts(filters?: ProductFilters): Promise<Product[]> {
  const cacheKey = `products:${JSON.stringify(filters)}`;
  
  return getCached(
    cacheKey,
    () => this.productRepo.findByFilters(filters),
    3600 // 1 hour
  );
}
```

---

## Error Handling

### Error Classes

```typescript
// src/lib/errors/app-errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403);
  }
}

export class RepositoryError extends AppError {
  constructor(message: string, public originalError: any) {
    super('REPOSITORY_ERROR', message, 500, { originalError });
  }
}
```

### Error Handler

```typescript
// src/lib/api/error-handler.ts
import { NextResponse } from 'next/server';
import { AppError, ValidationError } from '@/lib/errors/app-errors';
import { ZodError } from 'zod';
import { logger } from '@/lib/logger';

export function handleApiError(error: unknown): NextResponse {
  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: error.errors,
      },
      { status: 400 }
    );
  }

  // App errors
  if (error instanceof AppError) {
    logger.warn('App error:', error.message, { code: error.code, details: error.details });
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Unexpected errors
  logger.error('Unexpected API error:', error);
  
  return NextResponse.json(
    {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}
```

---

## Validation Setup

### Validation Schemas

```typescript
// src/lib/validation/cad.schemas.ts
import { z } from 'zod';

export const cadGenerationSchema = z.object({
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  category: z.enum(['bracket', 'plate', 'beam', 'fastener', 'custom']).optional(),
  format: z.enum(['step', 'stl', 'obj', 'gltf', 'glb']).default('step'),
  units: z.enum(['mm', 'cm', 'm', 'in', 'ft']).default('mm'),
});

export const cadAnalysisSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      file => ['application/pdf', 'image/png', 'image/jpeg'].includes(file.type),
      'File must be PDF, PNG, or JPG'
    ),
});

export const productFiltersSchema = z.object({
  category: z.enum(['robotic', 'structural', 'fasteners', 'custom']).optional(),
  material: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  inStock: z.boolean().optional(),
  page: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'price', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
```

### Validation Helper

```typescript
// src/lib/validation/index.ts
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/lib/errors/app-errors';

export async function validateRequest<T>(
  data: unknown,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
}
```

---

## Next Steps

1. **Install Dependencies**:
   ```bash
   npm install @tanstack/react-query @upstash/redis @upstash/ratelimit zod zustand
   ```

2. **Create Directory Structure**:
   - Create `src/services/`, `src/repositories/`, `src/stores/` directories

3. **Start with One Feature**:
   - Refactor CAD generation first
   - Then move to products
   - Then RFQ system

4. **Add Tests**:
   - Write tests for services and repositories
   - Test API routes

5. **Monitor and Iterate**:
   - Add monitoring
   - Measure performance improvements
   - Iterate based on metrics

