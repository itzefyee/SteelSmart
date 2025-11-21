import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getSupabaseServer } from '@/lib/supabase-server';
import { deleteCached, invalidateCachePattern } from '@/lib/cache/redis-cache';
import { generateProductDetailCacheKey, generateProductCacheKey } from '@/lib/cache/cache-keys';

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
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseServerClient();
    
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching product:', error);
      return NextResponse.json(
        { error: 'Failed to fetch product', details: error.message },
        { status: 500 }
      );
    }

    // Add caching headers (cache for 1 hour)
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
    console.error('Unexpected error in product API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
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

    // Update the product
    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      
      console.error('Error updating product:', error);
      return NextResponse.json(
        { error: 'Failed to update product', details: error.message },
        { status: 500 }
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
        product 
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
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching product for deletion:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch product', details: fetchError.message },
        { status: 500 }
      );
    }

    // Delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json(
        { error: 'Failed to delete product', details: error.message },
        { status: 500 }
      );
    }

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
        message: 'Product deleted successfully'
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
