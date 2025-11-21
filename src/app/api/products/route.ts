import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getCached } from '@/lib/cache/redis-cache';

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
    
    // Extract query parameters
    const ids = searchParams.getAll('id');
    const category = searchParams.get('category');
    const material = searchParams.get('material');
    const inStock = searchParams.get('inStock');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    
    // Generate cache key from query parameters
    // Format: products:{filters}
    const filterParts: string[] = [];
    if (ids.length > 0) filterParts.push(`ids=${ids.join(',')}`);
    if (category) filterParts.push(`category=${category}`);
    if (material) filterParts.push(`material=${material}`);
    if (inStock) filterParts.push(`inStock=${inStock}`);
    if (minPrice) filterParts.push(`minPrice=${minPrice}`);
    if (maxPrice) filterParts.push(`maxPrice=${maxPrice}`);
    if (search) filterParts.push(`search=${search}`);
    filterParts.push(`page=${page}`);
    filterParts.push(`limit=${limit}`);
    
    const cacheKey = `products:${filterParts.join('&')}`;
    
    // Use Redis cache with 300 second (5 minute) TTL
    const result = await getCached(
      cacheKey,
      async () => {
        // Database query fetcher function
        const supabase = getSupabaseServerClient();
        
        // Build query
        let query = supabase
          .from('products')
          .select('*', { count: 'exact' });
        
        // Apply filters
        // If specific IDs are requested, filter by those IDs
        if (ids.length > 0) {
          query = query.in('id', ids);
        }
        
        if (category) {
          query = query.eq('category', category);
        }
        
        if (material) {
          query = query.ilike('material', `%${material}%`);
        }
        
        if (inStock !== null && inStock !== undefined) {
          query = query.eq('in_stock', inStock === 'true');
        }
        
        if (minPrice) {
          query = query.gte('price', parseFloat(minPrice));
        }
        
        if (maxPrice) {
          query = query.lte('price', parseFloat(maxPrice));
        }
        
        if (search) {
          query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }
        
        // Apply pagination (skip pagination if specific IDs are requested)
        if (ids.length === 0) {
          const from = (page - 1) * limit;
          const to = from + limit - 1;
          query = query.range(from, to);
        }
        
        // Order by name
        query = query.order('name', { ascending: true });
        
        const { data: products, error, count } = await query;

        if (error) {
          console.error('Error fetching products:', error);
          throw new Error(`Failed to fetch products: ${error.message}`);
        }

        // Calculate pagination metadata
        const totalPages = count ? Math.ceil(count / limit) : 0;
        
        return {
          products: products || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages,
            hasMore: page < totalPages,
          },
        };
      },
      300 // TTL: 300 seconds (5 minutes)
    );
    
    // Add caching headers (cache for 30 minutes)
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Unexpected error in products API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
