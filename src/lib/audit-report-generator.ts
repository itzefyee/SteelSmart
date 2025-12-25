// Utility functions for generating audit reports

export interface AuditReportData {
  reportId: string;
  period: string;
  generatedAt: string;
  summary: {
    totalActions: number;
    successRate: number;
    failedCount: number;
    uniqueUsers: number;
  };
  logs: Array<{
    timestamp: string;
    userEmail: string;
    action: string;
    module: string;
    status: "SUCCESS" | "FAILED";
  }>;
}

/**
 * Generate a unique report ID
 */
export function generateReportId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `AUD-${year}${month}${day}-${random}`;
}

/**
 * Calculate summary statistics from audit logs
 */
export function calculateSummary(logs: AuditReportData['logs']): AuditReportData['summary'] {
  const totalActions = logs.length;
  const successfulActions = logs.filter(log => log.status === 'SUCCESS').length;
  const failedCount = logs.filter(log => log.status === 'FAILED').length;
  const uniqueUsers = new Set(logs.map(log => log.userEmail)).size;
  const successRate = totalActions > 0 ? (successfulActions / totalActions) * 100 : 0;

  return {
    totalActions,
    successRate,
    failedCount,
    uniqueUsers
  };
}

/**
 * Format period string from date range
 */
export function formatPeriod(startDate: Date, endDate: Date): string {
  const start = startDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const end = endDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // If same month and year, show "November 1-30, 2025"
  if (startDate.getMonth() === endDate.getMonth() && 
      startDate.getFullYear() === endDate.getFullYear()) {
    const month = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return `${month} ${startDate.getDate()}-${endDate.getDate()}`;
  }
  
  return `${start} - ${end}`;
}

/**
 * Generate complete audit report data
 */
export function generateAuditReport(
  logs: AuditReportData['logs'],
  startDate: Date,
  endDate: Date
): AuditReportData {
  return {
    reportId: generateReportId(),
    period: formatPeriod(startDate, endDate),
    generatedAt: new Date().toISOString(),
    summary: calculateSummary(logs),
    logs: logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  };
}

/**
 * Print audit report (opens browser print dialog)
 */
export function printAuditReport(): void {
  window.print();
}

/**
 * Download audit report as PDF (requires additional setup with libraries like jsPDF or Puppeteer)
 * This is a placeholder - you'll need to implement based on your PDF generation preference
 */
export async function downloadAuditReportPDF(data: AuditReportData): Promise<void> {
  // Option 1: Use browser's print to PDF
  printAuditReport();
  
  // Option 2: Implement with jsPDF (requires additional setup)
  // const { jsPDF } = await import('jspdf');
  // const pdf = new jsPDF();
  // ... generate PDF content
  // pdf.save(`audit-report-${data.reportId}.pdf`);
  
  // Option 3: Server-side PDF generation with Puppeteer
  // const response = await fetch('/api/generate-pdf', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data)
  // });
  // const blob = await response.blob();
  // const url = URL.createObjectURL(blob);
  // const a = document.createElement('a');
  // a.href = url;
  // a.download = `audit-report-${data.reportId}.pdf`;
  // a.click();
}

/**
 * Export audit report data as CSV
 */
export function exportAuditReportCSV(data: AuditReportData): void {
  const headers = ['Timestamp', 'User', 'Action', 'Module', 'Status'];
  const rows = data.logs.map(log => [
    log.timestamp,
    log.userEmail,
    log.action,
    log.module,
    log.status
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-report-${data.reportId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Sample data generator for testing
 */
export function generateSampleAuditData(): AuditReportData {
  const now = new Date();
  const logs = [
    {
      timestamp: new Date(now.getTime() - 3600000).toISOString(),
      userEmail: "admin@steelsmart.com",
      action: "CREATE_PRODUCT",
      module: "INVENTORY",
      status: "SUCCESS" as const
    },
    {
      timestamp: new Date(now.getTime() - 7200000).toISOString(),
      userEmail: "manager@steelsmart.com",
      action: "UPDATE_PRODUCT",
      module: "INVENTORY",
      status: "SUCCESS" as const
    },
    {
      timestamp: new Date(now.getTime() - 10800000).toISOString(),
      userEmail: "user@steelsmart.com",
      action: "DELETE_REPORT",
      module: "REPORTS",
      status: "FAILED" as const
    },
    {
      timestamp: new Date(now.getTime() - 14400000).toISOString(),
      userEmail: "admin@steelsmart.com",
      action: "LOGIN",
      module: "AUTH",
      status: "SUCCESS" as const
    },
    {
      timestamp: new Date(now.getTime() - 18000000).toISOString(),
      userEmail: "analyst@steelsmart.com",
      action: "GENERATE_REPORT",
      module: "REPORTS",
      status: "SUCCESS" as const
    }
  ];

  const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const endDate = now;

  return generateAuditReport(logs, startDate, endDate);
}