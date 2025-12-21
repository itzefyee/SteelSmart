import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('Role')
      .eq('id', user.id)
      .single();

    if (profile?.Role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch audit logs without user email (since there's only one admin)
    const { data: auditLogs, error } = await (supabase as any)
      .from('audit_logs')
      .select(`
        log_id,
        user_id,
        action,
        module,
        status,
        details,
        created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Transform the data to include default user email
    const transformedLogs = auditLogs?.map((log: any) => ({
      ...log,
      user_email: 'Admin User' // Since there's only one admin
    })) || [];

    return NextResponse.json({ 
      data: transformedLogs,
      total: transformedLogs.length,
      limit,
      offset
    });
  } catch (error) {
    return handleApiError(error);
  }
}