import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await getSupabaseServer();
    
    // Try to get from database first
    const { data, error } = await supabase
      .from('component_taxonomy')
      .select('*')
      .order('canonical_name');
    
    if (error || !data || data.length === 0) {
      console.log('Component taxonomy table not found or empty, using fallback data');
      // Fallback to hardcoded values with UUIDs that might match database
      const componentTypes = [
        { id: '00000000-0000-4000-8000-000000000101', canonical_name: 'bolt', category: 'fastener', description: 'Threaded fastener' },
        { id: '00000000-0000-4000-8000-000000000102', canonical_name: 'nut', category: 'fastener', description: 'Threaded nut' },
        { id: '00000000-0000-4000-8000-000000000103', canonical_name: 'washer', category: 'fastener', description: 'Flat washer' },
        { id: '00000000-0000-4000-8000-000000000104', canonical_name: 'screw', category: 'fastener', description: 'Threaded screw' },
        { id: '00000000-0000-4000-8000-000000000105', canonical_name: 'bracket', category: 'structural', description: 'Support bracket' },
        { id: '00000000-0000-4000-8000-000000000106', canonical_name: 'rotor', category: 'structural', description: 'Brake rotor' },
        { id: '00000000-0000-4000-8000-000000000107', canonical_name: 'plate', category: 'structural', description: 'Metal plate' },
        { id: '00000000-0000-4000-8000-000000000108', canonical_name: 'motor', category: 'robotic', description: 'Electric motor' },
        { id: '00000000-0000-4000-8000-000000000109', canonical_name: 'sensor', category: 'robotic', description: 'Electronic sensor' },
        { id: '00000000-0000-4000-8000-000000000110', canonical_name: 'actuator', category: 'robotic', description: 'Linear actuator' },
      ];
      return NextResponse.json({ data: componentTypes });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in component-taxonomy API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}