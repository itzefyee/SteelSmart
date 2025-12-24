import { NextRequest, NextResponse } from 'next/server';
import { AuditLogService } from '@/services/admin/audit/audit-log.service';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Audit log timeout')), 3000); // 3 second timeout
    });

    const auditLogPromise = (async () => {
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
    })();

    // Race between audit log operation and timeout
    return await Promise.race([auditLogPromise, timeoutPromise]);
  } catch (error) {
    console.error('Audit log API error:', error);
    // Return success even on error to prevent blocking logout
    return NextResponse.json({ success: true, warning: 'Audit log failed but operation continued' });
  }
}