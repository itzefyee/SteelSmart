import { getSupabaseServer } from '@/lib/supabase-server';

export interface AuditLogEntry {
  log_id?: string;
  user_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  module: 'PRODUCT' | 'REPORT' | 'AUTH';
  status: 'SUCCESS' | 'FAILED';
  details: Record<string, any>;
  created_at?: string;
}

export class AuditLogService {
  /**
   * Generic method to log CRUD operations (CREATE, UPDATE, DELETE)
   */
  static async logCrudOperation(
    userId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    module: 'PRODUCT' | 'REPORT',
    details: Record<string, any>
  ): Promise<void> {
    await this.createAuditLog({
      user_id: userId,
      action,
      module,
      status: 'SUCCESS',
      details
    });
  }

  /**
   * Log product-related actions
   */
  static async logProduct(
    userId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    details: Record<string, any>
  ): Promise<void> {
    await this.logCrudOperation(userId, action, 'PRODUCT', details);
  }

  /**
   * Log report-related actions
   */
  static async logReport(
    userId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    details: Record<string, any>
  ): Promise<void> {
    await this.logCrudOperation(userId, action, 'REPORT', details);
  }

  /**
   * Log authentication actions (LOGIN/LOGOUT - success only)
   */
  static async logAuth(
    userId: string,
    action: 'LOGIN' | 'LOGOUT',
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.createAuditLog({
      user_id: userId,
      action,
      module: 'AUTH',
      status: 'SUCCESS',
      details
    });
  }

  /**
   * Core method to create audit log entries
   */
  private static async createAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      const supabase = await getSupabaseServer();
      
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          log_id: crypto.randomUUID(),
          user_id: entry.user_id,
          action: entry.action,
          module: entry.module,
          status: entry.status,
          details: entry.details,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to create audit log:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }
}