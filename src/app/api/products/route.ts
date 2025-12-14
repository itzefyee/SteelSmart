import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/services/product.service';
import { ProductRepository } from '@/repositories/product.repository';
import type { ProductFilters } from '@/repositories/product.repository';
import { getSupabaseServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products
 * Fetches products from Supabase with optional filters and pagination
 * Public endpoint - no authentication required
 * 
 * Query parameters:
 * - id: Filter by specific product ID(s) (can be used multiple times: ?id=1&id=2&id=3)
 * - category: Filter by category ID
 * - material: Filter by material (partial match)
 * - inStock: Filter by stock status (true/false)
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - search: Search in name and description
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Controller responsibility: Parse request parameters
    const filters: ProductFilters = {
      category: searchParams.get('category') || undefined,
      material: searchParams.get('material') || undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : 
               searchParams.get('inStock') === 'false' ? false : undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      search: searchParams.get('search') || undefined,
    };
    
    const options = {
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '20', 10), 100),
      ids: searchParams.getAll('id'),
    };
    
    // Controller responsibility: Initialize dependencies
    const supabase = getSupabaseServerClient();
    const repository = new ProductRepository(supabase);
    const service = new ProductService(repository);
    
    // Service layer handles business logic, validation, caching, and data access
    const result = await service.getProducts(filters, options);
    
    // Controller responsibility: Return response with appropriate headers
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
