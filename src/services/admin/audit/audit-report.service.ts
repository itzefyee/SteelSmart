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
    
    console.log(`🔍 Audit Report Input - Month: ${month}, Year: ${year}`);
    
    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    console.log(`🔍 Audit Date Range - Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`);
    
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

      // Color palette (matching RFQ report)
      const colors = {
        brandNavy: [26, 60, 94] as [number, number, number],
        darkGrey: [44, 62, 80] as [number, number, number],
        lightGrey: [245, 245, 245] as [number, number, number],
        success: [39, 174, 96] as [number, number, number],
        failed: [192, 57, 43] as [number, number, number]
      };

      // Helper function to check if we need a new page
      const checkNewPage = (requiredSpace: number = 20) => {
        if (yPosition + requiredSpace > 270) {
          doc.addPage();
          yPosition = 20;
        }
      };

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      // Section 1: Header (Two-column layout)
      doc.setTextColor(...colors.brandNavy);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('STEELSMART INC.', margin, yPosition);
      
      doc.setTextColor(...colors.darkGrey);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('System Audit Log', margin, yPosition + 6);
      
      // Right side - Report ID, Generated date, Period
      const rightX = pageWidth - margin - 60;
      doc.text(`Report ID: ${reportId}`, rightX, yPosition);
      doc.text(`Generated: ${reportDate}`, rightX, yPosition + 4);
      doc.text(`Period: ${monthNames[reportData.month - 1]} ${reportData.year}`, rightX, yPosition + 8);
      
      // Thick horizontal line under header
      yPosition += 15;
      doc.setDrawColor(...colors.brandNavy);
      doc.setLineWidth(2);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Section 2: Executive Summary (KPI Grid) - 4-column table with no borders
      checkNewPage(40);
      doc.setTextColor(...colors.darkGrey);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('EXECUTIVE SUMMARY', margin, yPosition);
      yPosition += 10;

      const cardWidth = contentWidth / 4;
      const cardHeaders = ['TOTAL ACTIONS', 'SUCCESS RATE', 'FAILED ACTIONS', 'ACTIVE USERS'];
      const successRate = reportData.totalLogs > 0 ? ((reportData.successfulActions / reportData.totalLogs) * 100).toFixed(1) : '0';
      const activeUsers = reportData.userActivity.length;
      const cardValues = [
        reportData.totalLogs.toString(),
        `${successRate}%`,
        reportData.failedActions.toString(),
        activeUsers.toString()
      ];

      // Draw KPI cards (no borders layout)
      for (let i = 0; i < 4; i++) {
        const x = margin + (i * cardWidth);
        
        // Header (small, grey, uppercase)
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.darkGrey);
        doc.text(cardHeaders[i], x + 2, yPosition + 5, { maxWidth: cardWidth - 4 });
        
        // Value (large, bold)
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        
        // Color logic: Red for failed actions > 0, Green for 100% success rate
        if (i === 1 && successRate === '100.0') {
          doc.setTextColor(...colors.success); // Green for 100%
        } else if (i === 2 && reportData.failedActions > 0) {
          doc.setTextColor(...colors.failed); // Red for failed actions > 0
        } else {
          doc.setTextColor(...colors.brandNavy);
        }
        
        doc.text(cardValues[i], x + 2, yPosition + 15, { maxWidth: cardWidth - 4 });
      }
      yPosition += 30;

      // Section 3: Breakdown Tables (Side-by-Side)
      checkNewPage(80);
      doc.setTextColor(...colors.darkGrey);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('BREAKDOWN ANALYSIS', margin, yPosition);
      yPosition += 10;

      // Left Column: Action Breakdown Table
      const leftTableWidth = (contentWidth / 2) - 5;
      const rightTableX = margin + leftTableWidth + 10;
      
      // Action Breakdown Table
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Action Breakdown', margin, yPosition);
      yPosition += 8;

      // Table headers
      const actionColWidths = [leftTableWidth * 0.4, leftTableWidth * 0.2, leftTableWidth * 0.2, leftTableWidth * 0.2];
      const actionHeaders = ['Action Type', 'Count', 'Success', 'Failed'];
      
      // Header row (Navy background, white text)
      doc.setFillColor(...colors.brandNavy);
      doc.rect(margin, yPosition, leftTableWidth, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      let currentX = margin;
      actionHeaders.forEach((header, i) => {
        doc.text(header, currentX + 2, yPosition + 5);
        currentX += actionColWidths[i];
      });
      yPosition += 8;

      // Data rows (first 8 actions)
      reportData.actionBreakdown.slice(0, 8).forEach((item, index) => {
        checkNewPage(8);
        
        // Zebra striping
        if (index % 2 === 0) {
          doc.setFillColor(...colors.lightGrey);
          doc.rect(margin, yPosition, leftTableWidth, 8, 'F');
        }
        
        doc.setTextColor(...colors.darkGrey);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        
        currentX = margin;
        const rowData = [
          item.action.length > 15 ? item.action.substring(0, 15) + '...' : item.action,
          item.count.toString(),
          item.successCount.toString(),
          item.failedCount.toString()
        ];
        
        rowData.forEach((data, i) => {
          doc.text(data, currentX + 2, yPosition + 5, { maxWidth: actionColWidths[i] - 4 });
          currentX += actionColWidths[i];
        });
        yPosition += 8;
      });

      // Reset yPosition for right table
      yPosition -= (Math.min(8, reportData.actionBreakdown.length) * 8) + 16;

      // Right Column: Module Breakdown Table
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.darkGrey);
      doc.text('Module Breakdown', rightTableX, yPosition);
      yPosition += 8;

      // Table headers
      const moduleColWidths = [leftTableWidth * 0.4, leftTableWidth * 0.2, leftTableWidth * 0.2, leftTableWidth * 0.2];
      const moduleHeaders = ['Module', 'Count', 'Success', 'Failed'];
      
      // Header row (Navy background, white text)
      doc.setFillColor(...colors.brandNavy);
      doc.rect(rightTableX, yPosition, leftTableWidth, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      currentX = rightTableX;
      moduleHeaders.forEach((header, i) => {
        doc.text(header, currentX + 2, yPosition + 5);
        currentX += moduleColWidths[i];
      });
      yPosition += 8;

      // Data rows (first 8 modules)
      reportData.moduleBreakdown.slice(0, 8).forEach((item, index) => {
        // Zebra striping
        if (index % 2 === 0) {
          doc.setFillColor(...colors.lightGrey);
          doc.rect(rightTableX, yPosition, leftTableWidth, 8, 'F');
        }
        
        doc.setTextColor(...colors.darkGrey);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        
        currentX = rightTableX;
        const rowData = [
          item.module.length > 15 ? item.module.substring(0, 15) + '...' : item.module,
          item.count.toString(),
          item.successCount.toString(),
          item.failedCount.toString()
        ];
        
        rowData.forEach((data, i) => {
          doc.text(data, currentX + 2, yPosition + 5, { maxWidth: moduleColWidths[i] - 4 });
          currentX += moduleColWidths[i];
        });
        yPosition += 8;
      });

      yPosition += 10;

      // Section 4: Daily Activity Log (Full-width table)
      checkNewPage(60);
      doc.setTextColor(...colors.darkGrey);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DAILY ACTIVITY LOG', margin, yPosition);
      yPosition += 10;

      // Table headers
      const dailyHeaders = ['Date', 'Total Actions', 'Status Summary'];
      const dailyColWidths = [40, 30, 100];
      
      // Header row
      doc.setFillColor(...colors.brandNavy);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      currentX = margin;
      dailyHeaders.forEach((header, i) => {
        doc.text(header, currentX + 2, yPosition + 5);
        currentX += dailyColWidths[i];
      });
      yPosition += 8;

      // Data rows (last 15 days)
      reportData.dailyActivity.slice(-15).forEach((item, index) => {
        checkNewPage(8);
        
        // Zebra striping
        if (index % 2 === 0) {
          doc.setFillColor(...colors.lightGrey);
          doc.rect(margin, yPosition, contentWidth, 8, 'F');
        }
        
        doc.setTextColor(...colors.darkGrey);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        currentX = margin;
        const formattedDate = new Date(item.date).toLocaleDateString();
        const statusSummary = `${item.count} actions recorded`;
        
        const rowData = [formattedDate, item.count.toString(), statusSummary];
        
        rowData.forEach((data, i) => {
          doc.text(data, currentX + 2, yPosition + 5, { maxWidth: dailyColWidths[i] - 4 });
          currentX += dailyColWidths[i];
        });
        yPosition += 8;
      });

      // Footer
      yPosition += 20;
      checkNewPage(20);
      doc.setFontSize(8);
      doc.setTextColor(...colors.darkGrey);
      doc.text('Confidential - System Audit Record', pageWidth / 2, yPosition, { align: 'center' });
      doc.text(`Page 1`, pageWidth - margin - 10, yPosition, { align: 'right' });

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