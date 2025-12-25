import { getSupabaseServer } from '@/lib/supabase-server';

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

    try {
      // Try to generate PDF using jsPDF
      return await this.createPDFWithJsPDF(reportData, reportTitle, reportDate, reportId);
    } catch (error) {
      
      // Fallback to HTML if PDF generation fails
      const reportContent = `
AUDIT LOG REPORT
================

Title: ${reportTitle}
Generated: ${reportDate}
Report ID: ${reportId}
Period: ${monthNames[reportData.month - 1]} ${reportData.year}

EXECUTIVE SUMMARY
=================
Total Actions: ${reportData.totalLogs}
Successful: ${reportData.successfulActions}
Failed: ${reportData.failedActions}
Success Rate: ${reportData.totalLogs > 0 ? ((reportData.successfulActions / reportData.totalLogs) * 100).toFixed(1) : 0}%

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

Generated by SteelSmart Admin System
© ${new Date().getFullYear()} SteelSmart. All rights reserved.
      `.trim();

      return await this.createHTMLReport(reportContent, reportTitle);
    }
  }

  private static async createPDFWithJsPDF(
    reportData: AuditLogReportData,
    reportTitle: string,
    reportDate: string,
    reportId: string
  ): Promise<Buffer> {
    try {
      // Dynamic import of jsPDF
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        if (isBold) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach((line: string) => {
          if (yPosition > 270) { // Check if we need a new page
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });
        yPosition += 5; // Add some spacing after text
      };

      // Header
      doc.setTextColor(37, 99, 235); // Blue color
      addText(reportTitle, 18, true);
      
      doc.setTextColor(0, 0, 0); // Black color
      addText(`Generated: ${reportDate}`, 10);
      addText(`Report ID: ${reportId}`, 10);
      
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      addText(`Period: ${monthNames[reportData.month - 1]} ${reportData.year}`, 10);
      
      yPosition += 10;

      // Executive Summary
      addText('EXECUTIVE SUMMARY', 14, true);
      addText(`Total Actions: ${reportData.totalLogs}`, 10);
      addText(`Successful: ${reportData.successfulActions}`, 10);
      addText(`Failed: ${reportData.failedActions}`, 10);
      const successRate = reportData.totalLogs > 0 ? ((reportData.successfulActions / reportData.totalLogs) * 100).toFixed(1) : '0';
      addText(`Success Rate: ${successRate}%`, 10);
      
      yPosition += 10;

      // Action Breakdown
      addText('ACTION BREAKDOWN', 14, true);
      reportData.actionBreakdown.forEach(action => {
        addText(`${action.action}: ${action.count} (${action.successCount} success, ${action.failedCount} failed)`, 9);
      });
      
      yPosition += 10;

      // Module Breakdown
      addText('MODULE BREAKDOWN', 14, true);
      reportData.moduleBreakdown.forEach(module => {
        addText(`${module.module}: ${module.count} (${module.successCount} success, ${module.failedCount} failed)`, 9);
      });
      
      yPosition += 10;

      // User Activity
      addText('USER ACTIVITY', 14, true);
      reportData.userActivity.forEach(user => {
        addText(`${user.user_email}: ${user.totalActions} actions (${user.successfulActions} success, ${user.failedActions} failed)`, 9);
      });
      
      yPosition += 10;

      // Daily Activity (show first 15 entries to save space)
      addText('DAILY ACTIVITY (Recent)', 14, true);
      reportData.dailyActivity.slice(0, 15).forEach(day => {
        addText(`${day.date}: ${day.count} actions`, 9);
      });

      // Footer
      yPosition += 20;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by SteelSmart Admin System', margin, yPosition);
      yPosition += 4;
      doc.text(`© ${new Date().getFullYear()} SteelSmart. All rights reserved.`, margin, yPosition);

      // Convert to buffer
      const pdfArrayBuffer = doc.output('arraybuffer');
      const pdfBuffer = Buffer.from(pdfArrayBuffer);
      
      return pdfBuffer;
      
    } catch (error) {
      throw error;
    }
  }

  private static async createHTMLReport(content: string, title: string): Promise<Buffer> {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
            color: #1f2937;
        }
        .report-container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        h1 {
            color: #2563eb;
            font-size: 28px;
            margin: 0 0 10px 0;
            font-weight: 700;
        }
        .subtitle {
            color: #6b7280;
            font-size: 14px;
            margin: 5px 0;
        }
        h2 {
            color: #1e40af;
            font-size: 18px;
            margin: 30px 0 15px 0;
            padding: 10px 0;
            border-bottom: 2px solid #e5e7eb;
            font-weight: 600;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .summary-card {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #374151;
            font-size: 14px;
            font-weight: 600;
        }
        .summary-card .value {
            font-size: 24px;
            font-weight: 700;
            color: #2563eb;
        }
        .content-section {
            margin: 25px 0;
        }
        .data-list {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.5;
        }
        .data-item {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .data-item:last-child {
            border-bottom: none;
        }
        .success { color: #059669; }
        .failed { color: #dc2626; }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .print-button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin: 20px 0;
        }
        .print-button:hover {
            background: #1d4ed8;
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="header">
            <h1>${title}</h1>
            <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
            <button class="print-button no-print" onclick="window.print()">Print / Save as PDF</button>
        </div>
        
        <div class="content-section">
            <div class="data-list">${content.replace(/\n/g, '<br>')}</div>
        </div>
        
        <div class="footer">
            <p>Generated by SteelSmart Admin System</p>
            <p>This report can be printed or saved as PDF using your browser's print function.</p>
        </div>
    </div>
</body>
</html>`;

    return Buffer.from(htmlContent, 'utf-8');
  }

}