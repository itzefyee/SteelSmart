import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/categories
 * Fetches all categories from Supabase
 * Public endpoint - no authentication required
 */
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories', details: error.message },
        { status: 500 }
      );
    }

    // Add caching headers (cache for 1 hour)
    return NextResponse.json(
      { categories: categories || [] },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in categories API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
