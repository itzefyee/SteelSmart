import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    
    const { data, error } = await supabase
      .from('material_synonyms')
      .select('family')
      .order('family');
    
    if (error) {
      throw new Error(`Failed to fetch material families: ${error.message}`);
    }
    
    // Extract unique families
    const families = data?.map(item => item.family) || [];
    
    return NextResponse.json({ data: families });
  } catch (error) {
    console.error('Material families fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material families' },
      { status: 500 }
    );
  }
}