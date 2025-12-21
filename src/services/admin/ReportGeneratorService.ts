import { ReportRepository } from '@/repositories/admin/report.repository';
import { AuditReportService } from '@/services/admin/audit/audit-report.service';
import { createClient } from '@supabase/supabase-js';

class ReportGeneratorService {
  private repository: ReportRepository;

  constructor() {
    this.repository = new ReportRepository();
  }

  private getSupabaseAdmin() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  async processReport(reportId: string): Promise<void> {
    try {
      // Get report details
      const report = await this.repository.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Update status to processing
      await this.repository.update(reportId, {
        status: 'PROCESSING',
      });

      let fileUrl: string;

      // Generate report based on type
      const reportType = report.report_type as string;
      
      if (reportType === 'MONTHLY_AUDIT_LOG') {
        fileUrl = await this.generateAuditLogReport(reportId, report);
      } else if (reportType === 'MONTHLY_PRODUCT_PERFORMANCE') {
        // Placeholder for product performance report
        throw new Error('Product performance reports are not yet implemented');
      } else {
        // Legacy report types - simulate generation
        await new Promise((resolve) => setTimeout(resolve, 2000));
        fileUrl = `legacy/${reportId}.pdf`;
      }

      // Update status to completed with file path
      await this.repository.update(reportId, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        file_url: fileUrl, // This will be the storage path like "audit/uuid.pdf"
      });
    } catch (error) {
      console.error(`Report generation failed for ${reportId}:`, error);
      
      await this.repository.update(reportId, {
        status: 'FAILED',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async generateAuditLogReport(reportId: string, report: any): Promise<string> {
    const { month, year } = report.parameters as { month: number; year: number };

    // Generate audit report data
    const reportData = await AuditReportService.generateMonthlyAuditReport(month, year);

    // Generate PDF content
    const pdfBuffer = await AuditReportService.generateAuditReportPDF(reportData);

    // Upload to Supabase Storage in audit folder with UUID filename
    const supabase = this.getSupabaseAdmin();
    const fileUuid = crypto.randomUUID();
    const fileName = `audit/${fileUuid}.pdf`;
    
    const { error } = await supabase.storage
      .from('admin-reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      throw new Error(`Failed to upload report: ${error.message}`);
    }

    // Return the storage path (not the public URL) for database storage
    return fileName;
  }
}

export const reportGeneratorService = new ReportGeneratorService();
