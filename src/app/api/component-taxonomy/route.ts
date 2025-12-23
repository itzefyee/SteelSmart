import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    
    const { data, error } = await supabase
      .from('component_taxonomy')
      .select('id, canonical_name, category, description')
      .order('canonical_name');
    
    if (error) {
      throw new Error(`Failed to fetch component taxonomy: ${error.message}`);
    }
    
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Component taxonomy fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch component taxonomy' },
      { status: 500 }
    );
  }
}