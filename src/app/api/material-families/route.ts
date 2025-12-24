import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    
    // Get distinct material families from products table
    const { data, error } = await supabase
      .from('products')
      .select('material_family')
      .not('material_family', 'is', null)
      .order('material_family');
    
    if (error) {
      console.error('Error fetching material families:', error);
      // Fallback to hardcoded values if database query fails
      const fallbackFamilies = [
        'cast iron', // Exact match for database
        'Steel',
        'Aluminum',
        'Stainless Steel', 
        'Carbon Steel',
        'Alloy Steel',
        'Cast Iron',
        'Brass',
        'Bronze',
        'Copper',
        'Titanium',
        'Plastic',
        'Composite',
        'Ceramic'
      ];
      return NextResponse.json({ data: fallbackFamilies });
    }
    
    // Extract unique material families
    const uniqueFamilies = [...new Set(data?.map(item => item.material_family).filter(Boolean))] as string[];
    
    // Add some common ones if the list is empty
    if (uniqueFamilies.length === 0) {
      uniqueFamilies.push('cast iron', 'Steel', 'Aluminum', 'Cast Iron', 'Stainless Steel');
    }
    
    return NextResponse.json({ data: uniqueFamilies });
  } catch (error) {
    console.error('Error in material-families API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}