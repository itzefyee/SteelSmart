import { NextRequest, NextResponse } from 'next/server';
import { AuditLogService } from '@/services/admin/audit/audit-log.service';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, module, entityId, entityName, status = 'SUCCESS' } = body;

    // Validate required fields
    if (!action || !module) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Log based on module type
    if (module === 'PRODUCT') {
      await AuditLogService.logProduct(
        user.id,
        action,
        { id: entityId, name: entityName }
      );
    } else if (module === 'REPORT') {
      await AuditLogService.logReport(
        user.id,
        action,
        { id: entityId, title: entityName }
      );
    } else if (module === 'AUTH') {
      await AuditLogService.logAuth(user.id, action, { email: user.email });
    } else {
      return NextResponse.json({ error: 'Invalid module' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Audit log API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}