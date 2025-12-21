import { getSupabaseServer } from '@/lib/supabase-server';
import { PDFGeneratorService } from '@/services/pdf-generator.service';

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

    // Create PDF document
    const doc = PDFGeneratorService.createDocument({
      size: 'A4',
      margins: { top: 50, bottom: 80, left: 50, right: 50 }
    });

    // Add header with Classic Corporate design
    let currentY = PDFGeneratorService.addHeader(doc, reportTitle, {
      date: reportDate,
      id: reportId,
      period: `${monthNames[reportData.month - 1]} ${reportData.year}`
    });

    currentY += 20;

    // Executive Summary Section
    currentY = PDFGeneratorService.addSectionTitle(doc, 'Executive Summary', currentY);
    
    // Summary cards in a grid
    const cardWidth = 120;
    const cardSpacing = 15;
    const startX = doc.page.margins.left;
    
    PDFGeneratorService.addSummaryCard(
      doc, startX, currentY, cardWidth,
      reportData.totalLogs.toString(),
      'Total Actions',
      '#2563eb'
    );
    
    PDFGeneratorService.addSummaryCard(
      doc, startX + cardWidth + cardSpacing, currentY, cardWidth,
      reportData.successfulActions.toString(),
      'Successful',
      '#059669'
    );
    
    PDFGeneratorService.addSummaryCard(
      doc, startX + 2 * (cardWidth + cardSpacing), currentY, cardWidth,
      reportData.failedActions.toString(),
      'Failed',
      '#dc2626'
    );
    
    PDFGeneratorService.addSummaryCard(
      doc, startX + 3 * (cardWidth + cardSpacing), currentY, cardWidth,
      `${((reportData.successfulActions / reportData.totalLogs) * 100).toFixed(1)}%`,
      'Success Rate',
      '#2563eb'
    );

    currentY += 80;

    // Action Breakdown Section
    currentY = PDFGeneratorService.addSectionTitle(doc, 'Action Breakdown', currentY);
    
    const actionHeaders = ['Action Type', 'Total', 'Successful', 'Failed', 'Success Rate'];
    const actionRows = reportData.actionBreakdown.map(action => [
      action.action,
      action.count.toString(),
      action.successCount.toString(),
      action.failedCount.toString(),
      action.count > 0 ? `${((action.successCount / action.count) * 100).toFixed(1)}%` : '0%'
    ]);
    
    currentY = PDFGeneratorService.addTable(
      doc, currentY, actionHeaders, actionRows,
      [120, 60, 80, 60, 80] // Column widths
    );

    // Module Breakdown Section
    currentY = PDFGeneratorService.addSectionTitle(doc, 'Module Activity', currentY);
    
    const moduleHeaders = ['Module', 'Total Actions', 'Successful', 'Failed', 'Success Rate'];
    const moduleRows = reportData.moduleBreakdown.map(module => [
      module.module,
      module.count.toString(),
      module.successCount.toString(),
      module.failedCount.toString(),
      module.count > 0 ? `${((module.successCount / module.count) * 100).toFixed(1)}%` : '0%'
    ]);
    
    currentY = PDFGeneratorService.addTable(
      doc, currentY, moduleHeaders, moduleRows,
      [100, 80, 80, 60, 80]
    );

    // User Activity Section (Top 10)
    currentY = PDFGeneratorService.addSectionTitle(doc, 'Top User Activity', currentY);
    
    const userHeaders = ['User Email', 'Total Actions', 'Successful', 'Failed', 'Success Rate'];
    const userRows = reportData.userActivity.slice(0, 10).map(user => [
      user.user_email,
      user.totalActions.toString(),
      user.successfulActions.toString(),
      user.failedActions.toString(),
      user.totalActions > 0 ? `${((user.successfulActions / user.totalActions) * 100).toFixed(1)}%` : '0%'
    ]);
    
    currentY = PDFGeneratorService.addTable(
      doc, currentY, userHeaders, userRows,
      [140, 70, 70, 60, 80]
    );

    // Add footer to all pages
    PDFGeneratorService.addFooter(doc, reportId, reportDate);

    // Generate PDF buffer
    return PDFGeneratorService.generatePDFFromStream(doc);
  }
}