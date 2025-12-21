import { getSupabaseServer } from '@/lib/supabase-server';

export interface RecentActivity {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  module: 'PRODUCT' | 'REPORT';
  description: string;
  created_at: string;
  user_email?: string; // Optional since there's only one admin
}

export class RecentActivityService {
  /**
   * Get recent activity from audit logs (products and reports only)
   * Limited to 3 most recent activities
   */
  static async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      const supabase = await getSupabaseServer();
      
      // Simplified query without user email since there's only one admin
      const { data: auditLogs, error } = await (supabase as any)
        .from('audit_logs')
        .select(`
          log_id,
          action,
          module,
          details,
          created_at
        `)
        .in('module', ['PRODUCT', 'REPORT'])
        .eq('status', 'SUCCESS')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.warn('Could not fetch recent activity from audit logs:', error.message);
        return [];
      }

      if (!auditLogs || auditLogs.length === 0) {
        return [];
      }

      return auditLogs.map((log: any) => ({
        id: log.log_id,
        action: log.action,
        module: log.module,
        description: this.formatActivityDescription(log),
        created_at: log.created_at,
        user_email: undefined // Not needed since there's only one admin
      }));

    } catch (error) {
      console.warn('Error fetching recent activity:', error);
      return [];
    }
  }

  /**
   * Format activity description based on action, module, and details
   */
  private static formatActivityDescription(log: any): string {
    const { action, module, details } = log;
    
    try {
      const parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
      
      if (module === 'PRODUCT') {
        const productName = parsedDetails?.name || parsedDetails?.id || 'Unknown Product';
        
        switch (action) {
          case 'CREATE':
            return `Created product "${productName}"`;
          case 'UPDATE':
            return `Updated product "${productName}"`;
          case 'DELETE':
            return `Deleted product "${productName}"`;
          default:
            return `${action.toLowerCase()} product "${productName}"`;
        }
      }
      
      if (module === 'REPORT') {
        const reportTitle = parsedDetails?.title || parsedDetails?.report_type || parsedDetails?.id || 'Unknown Report';
        
        switch (action) {
          case 'CREATE':
            return `Generated report "${reportTitle}"`;
          case 'UPDATE':
            return `Updated report "${reportTitle}"`;
          case 'DELETE':
            return `Deleted report "${reportTitle}"`;
          default:
            return `${action.toLowerCase()} report "${reportTitle}"`;
        }
      }
      
      // Fallback for unknown modules
      return `${action.toLowerCase()} ${module.toLowerCase()}`;
      
    } catch (parseError) {
      // Fallback if details parsing fails
      return `${action.toLowerCase()} ${module.toLowerCase()}`;
    }
  }

  /**
   * Format relative time in concise format (e.g., "2h ago", "1d ago")
   */
  static formatRelativeTime(dateString: string): string {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}w ago`;
    }

    // For older activities, show the actual date in short format
    return activityDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
}