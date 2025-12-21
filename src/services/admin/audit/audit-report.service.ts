import { getSupabaseServer } from '@/lib/supabase-server';
import PDFDocument from 'pdfkit';

export interface AuditLogReportData {
  month: number;
  year: number;
  totalLogs: number;
  successfulActions: number;
  failedActions: number;
  actionBreakdown: {
    action: string;
    count: number;
    successCount: number;
    failedCount: number;
  }[];
  moduleBreakdown: {
    module: string;
    count: number;
    successCount: number;
    failedCount: number;
  }[];
  userActivity: {
    user_id: string;
    user_email: string;
    totalActions: number;
    successfulActions: number;
    failedActions: number;
  }[];
  dailyActivity: {
    date: string;
    count: number;
  }[];
  topActions: {
    action: string;
    count: number;
  }[];
}

export class AuditReportService {
  static async generateMonthlyAuditReport(month: number, year: number): Promise<AuditLogReportData> {
    const supabase = await getSupabaseServer();
    
    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    try {
      // Get all audit logs for the month with user information
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
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch audit logs: ${error.message}`);
      }

      const logs = auditLogs || [];
      
      // Calculate basic statistics
      const totalLogs = logs.length;
      const successfulActions = logs.filter((log: any) => log.status === 'SUCCESS').length;
      const failedActions = logs.filter((log: any) => log.status === 'FAILED').length;

      // Action breakdown
      const actionMap = new Map<string, { total: number; success: number; failed: number }>();
      logs.forEach((log: any) => {
        const current = actionMap.get(log.action) || { total: 0, success: 0, failed: 0 };
        current.total++;
        if (log.status === 'SUCCESS') current.success++;
        else current.failed++;
        actionMap.set(log.action, current);
      });

      const actionBreakdown = Array.from(actionMap.entries()).map(([action, stats]) => ({
        action,
        count: stats.total,
        successCount: stats.success,
        failedCount: stats.failed
      })).sort((a, b) => b.count - a.count);

      // Module breakdown
      const moduleMap = new Map<string, { total: number; success: number; failed: number }>();
      logs.forEach((log: any) => {
        const current = moduleMap.get(log.module) || { total: 0, success: 0, failed: 0 };
        current.total++;
        if (log.status === 'SUCCESS') current.success++;
        else current.failed++;
        moduleMap.set(log.module, current);
      });

      const moduleBreakdown = Array.from(moduleMap.entries()).map(([module, stats]) => ({
        module,
        count: stats.total,
        successCount: stats.success,
        failedCount: stats.failed
      })).sort((a, b) => b.count - a.count);

      // User activity breakdown
      const userMap = new Map<string, { 
        email: string; 
        total: number; 
        success: number; 
        failed: number; 
      }>();
      
      logs.forEach((log: any) => {
        const current = userMap.get(log.user_id) || { 
          email: 'Admin User', // Since there's only one admin
          total: 0, 
          success: 0, 
          failed: 0 
        };
        current.total++;
        if (log.status === 'SUCCESS') current.success++;
        else current.failed++;
        userMap.set(log.user_id, current);
      });

      const userActivity = Array.from(userMap.entries()).map(([user_id, stats]) => ({
        user_id,
        user_email: stats.email,
        totalActions: stats.total,
        successfulActions: stats.success,
        failedActions: stats.failed
      })).sort((a, b) => b.totalActions - a.totalActions);

      // Daily activity breakdown
      const dailyMap = new Map<string, number>();
      logs.forEach((log: any) => {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
      });

      const dailyActivity = Array.from(dailyMap.entries()).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Top actions (simplified)
      const topActions = actionBreakdown.slice(0, 10).map(item => ({
        action: item.action,
        count: item.count
      }));

      return {
        month,
        year,
        totalLogs,
        successfulActions,
        failedActions,
        actionBreakdown,
        moduleBreakdown,
        userActivity,
        dailyActivity,
        topActions
      };

    } catch (error) {
      console.error('Error generating audit report:', error);
      throw error;
    }
  }

  static async generateAuditReportPDF(reportData: AuditLogReportData): Promise<Buffer> {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const reportTitle = `Audit Log Report - ${monthNames[reportData.month - 1]} ${reportData.year}`;
    const reportDate = new Date().toLocaleDateString();
    const reportId = `ALR-${reportData.year}-${reportData.month.toString().padStart(2, '0')}-${Date.now()}`;

    // Create report content with actions first, then executive summary
    const reportContent = `
AUDIT LOG REPORT
================

Title: ${reportTitle}
Generated: ${reportDate}
Report ID: ${reportId}
Period: ${monthNames[reportData.month - 1]} ${reportData.year}

ACTION BREAKDOWN
================
${reportData.actionBreakdown.map(action => 
  `${action.action}: ${action.count} (${action.successCount} success, ${action.failedCount} failed)`
).join('\n')}

MODULE BREAKDOWN
================
${reportData.moduleBreakdown.map(module => 
  `${module.module}: ${module.count} (${module.successCount} success, ${module.failedCount} failed)`
).join('\n')}

USER ACTIVITY
=============
${reportData.userActivity.map(user => 
  `${user.user_email}: ${user.totalActions} actions (${user.successfulActions} success, ${user.failedActions} failed)`
).join('\n')}

DAILY ACTIVITY
==============
${reportData.dailyActivity.map(day => 
  `${day.date}: ${day.count} actions`
).join('\n')}

EXECUTIVE SUMMARY
=================
Total Actions: ${reportData.totalLogs}
Successful: ${reportData.successfulActions}
Failed: ${reportData.failedActions}
Success Rate: ${reportData.totalLogs > 0 ? ((reportData.successfulActions / reportData.totalLogs) * 100).toFixed(1) : 0}%

Generated by SteelSmart Admin System
© ${new Date().getFullYear()} SteelSmart. All rights reserved.
    `.trim();

    // Convert text to PDF using a simpler approach
    return new Promise((resolve, reject) => {
      try {
        // Create a minimal PDF with just text content
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });
        
        const chunks: Buffer[] = [];
        
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (error) => {
          console.error('PDF generation error:', error);
          // If PDF generation fails, create a simple text buffer
          const textBuffer = Buffer.from(reportContent, 'utf-8');
          resolve(textBuffer);
        });
        
        // Add content line by line to avoid complex formatting
        const lines = reportContent.split('\n');
        let yPosition = 50;
        
        lines.forEach((line, index) => {
          if (yPosition > 750) { // Start new page if needed
            doc.addPage();
            yPosition = 50;
          }
          
          if (line.includes('=====')) {
            // Skip separator lines
            return;
          }
          
          if (line.startsWith('AUDIT LOG REPORT') || 
              line.startsWith('ACTION BREAKDOWN') ||
              line.startsWith('MODULE BREAKDOWN') ||
              line.startsWith('USER ACTIVITY') ||
              line.startsWith('DAILY ACTIVITY') ||
              line.startsWith('EXECUTIVE SUMMARY')) {
            doc.fontSize(14).text(line, 50, yPosition);
            yPosition += 25;
          } else if (line.trim()) {
            doc.fontSize(10).text(line, 50, yPosition);
            yPosition += 15;
          } else {
            yPosition += 10; // Empty line spacing
          }
        });
        
        doc.end();
        
      } catch (error) {
        console.error('Error creating PDF:', error);
        // Fallback: return text content as buffer
        const textBuffer = Buffer.from(reportContent, 'utf-8');
        resolve(textBuffer);
      }
    });
  }
}