import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');
    const excludeId = searchParams.get('excludeId'); // For edit mode
    
    if (!sku) {
      return NextResponse.json(
        { error: 'SKU parameter is required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();
    
    let query = supabase
      .from('products')
      .select('id')
      .eq('sku', sku);
    
    // Exclude current product when editing
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query.single();
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which means SKU is available
      throw error;
    }
    
    const isAvailable = !data; // If no data found, SKU is available
    
    return NextResponse.json({
      available: isAvailable,
      sku: sku
    });
    
  } catch (error: any) {
    console.error('SKU check error:', error);
    return NextResponse.json(
      { error: 'Failed to check SKU availability' },
      { status: 500 }
    );
  }
}