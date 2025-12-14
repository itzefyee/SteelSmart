import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { deleteCached, invalidateCachePattern } from '@/lib/cache/redis-cache';
import { generateProductDetailCacheKey, generateProductCacheKey } from '@/lib/cache/cache-keys';
import { ProductRepository } from '@/repositories/product.repository';
import { ProductService } from '@/services/product.service';
import { getSupabaseServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/[id]
 * Fetches a single product by ID from Supabase
 * Public endpoint - no authentication required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Controller responsibility: Validate request parameters
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Controller responsibility: Initialize dependencies
    const supabase = getSupabaseServerClient();
    const repository = new ProductRepository(supabase);
    const service = new ProductService(repository);

    // Service layer handles business logic, caching, and data access
    const product = await service.getProductById(id);

    // Controller responsibility: Return response with appropriate headers
    return NextResponse.json(
      { product },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Product API error:', error);
    
    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/[id]
 * Updates a product by ID
 * Requires authentication
 * 
 * Cache Invalidation Strategy:
 * - Invalidates the specific product detail cache (product:{id})
 * - Invalidates all product list caches (products:*)
 * - Invalidates related recommendation caches (recommendations:{id}*)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description, price, category, material, in_stock, image_url, specifications } = body;

    // Validate at least one field is provided
    if (!name && !description && price === undefined && !category && !material && 
        in_stock === undefined && !image_url && !specifications) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (category !== undefined) updateData.category = category;
    if (material !== undefined) updateData.material = material;
    if (in_stock !== undefined) updateData.in_stock = in_stock;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (specifications !== undefined) updateData.specifications = specifications;

    const repository = new ProductRepository(supabase);
    const product = await repository.updateProduct(id, updateData);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // ===== CACHE INVALIDATION =====
    // When a product is updated, we need to invalidate:
    // 1. The specific product detail cache
    // 2. All product list caches (since filters might match this product)
    // 3. Related recommendation caches
    
    try {
      // Invalidate specific product detail cache
      const productDetailKey = generateProductDetailCacheKey(id);
      await deleteCached(productDetailKey);
      
      // Invalidate product list caches
      // Note: Since we can't use wildcard patterns with Upstash Redis,
      // we invalidate common cache keys. In production, consider using
      // Redis SCAN or maintaining a cache key registry.
      const commonProductListKeys = [
        generateProductCacheKey({ page: 1, limit: 20 }),
        generateProductCacheKey({ page: 1, limit: 50 }),
        generateProductCacheKey({ category: product.category, page: 1, limit: 20 }),
        ...(product.material ? [generateProductCacheKey({ material: product.material, page: 1, limit: 20 })] : []),
        ...(product.in_stock !== null ? [generateProductCacheKey({ inStock: product.in_stock, page: 1, limit: 20 })] : []),
      ];
      
      await invalidateCachePattern(commonProductListKeys);
      
      // Invalidate recommendation caches for this product
      const recommendationKeys = [
        `recommendations:${id}`,
        `recommendations:${id}:*`,
      ];
      
      await invalidateCachePattern(recommendationKeys);
      
      console.log(`Cache invalidated for product update: ${id}`);
    } catch (cacheError) {
      // Log but don't fail the request if cache invalidation fails
      console.error('Cache invalidation error:', cacheError);
    }

    return NextResponse.json(
      { 
        success: true,
        product,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in product update API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]
 * Deletes a product by ID
 * Requires authentication
 * 
 * Cache Invalidation Strategy:
 * - Invalidates the specific product detail cache (product:{id})
 * - Invalidates all product list caches (products:*)
 * - Invalidates related recommendation caches (recommendations:{id}*)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Get product details before deletion for cache invalidation
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('category, material, in_stock')
      .eq('id', id)
      .single();

    if (fetchError) {
      if ((fetchError as any).code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      console.error('Error fetching product:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch product', details: fetchError.message },
        { status: 500 }
      );
    }

    const repository = new ProductRepository(supabase);
    await repository.deleteProduct(id);

    // ===== CACHE INVALIDATION =====
    // When a product is deleted, we need to invalidate:
    // 1. The specific product detail cache
    // 2. All product list caches (since this product should no longer appear)
    // 3. Related recommendation caches
    
    try {
      // Invalidate specific product detail cache
      const productDetailKey = generateProductDetailCacheKey(id);
      await deleteCached(productDetailKey);
      
      // Invalidate product list caches
      const commonProductListKeys = [
        generateProductCacheKey({ page: 1, limit: 20 }),
        generateProductCacheKey({ page: 1, limit: 50 }),
        generateProductCacheKey({ category: product.category, page: 1, limit: 20 }),
        ...(product.material ? [generateProductCacheKey({ material: product.material, page: 1, limit: 20 })] : []),
        ...(product.in_stock !== null ? [generateProductCacheKey({ inStock: product.in_stock, page: 1, limit: 20 })] : []),
      ];
      
      await invalidateCachePattern(commonProductListKeys);
      
      // Invalidate recommendation caches for this product
      const recommendationKeys = [
        `recommendations:${id}`,
        `recommendations:${id}:*`,
      ];
      
      await invalidateCachePattern(recommendationKeys);
      
      console.log(`Cache invalidated for product deletion: ${id}`);
    } catch (cacheError) {
      // Log but don't fail the request if cache invalidation fails
      console.error('Cache invalidation error:', cacheError);
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Product deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in product delete API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
