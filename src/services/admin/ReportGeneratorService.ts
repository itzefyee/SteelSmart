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
      
      if (reportType === 'AUDIT_LOG') {
        // This will throw an error if PDF generation fails
        fileUrl = await this.generateAuditLogReport(reportId, report);
      } else {
        // Legacy report types - simulate generation
        await new Promise((resolve) => setTimeout(resolve, 2000));
        fileUrl = `legacy/${reportId}.pdf`;
      }

      // Only update to completed if we successfully got a file URL
      await this.repository.update(reportId, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        file_url: fileUrl, // This will be the storage path like "audit/uuid.pdf"
      });
    } catch (error) {
      console.error(`Report generation failed for ${reportId}:`, error);
      
      // Update status to failed - this might be redundant if generateAuditLogReport already did it,
      // but it ensures the status is set correctly for any other type of failure
      try {
        await this.repository.update(reportId, {
          status: 'FAILED',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch (updateError) {
        console.error(`Failed to update report status for ${reportId}:`, updateError);
      }
    }
  }

  private async generateAuditLogReport(reportId: string, report: any): Promise<string> {
    const { month, year } = report.parameters as { month: number; year: number };

    try {
      // Generate audit report data
      const reportData = await AuditReportService.generateMonthlyAuditReport(month, year);

      // Generate PDF content - this might fail and fallback to HTML
      const reportBuffer = await AuditReportService.generateAuditReportPDF(reportData);

      // Upload to Supabase Storage in audit folder with UUID filename
      const supabase = this.getSupabaseAdmin();
      const fileUuid = crypto.randomUUID();
      
      // Determine file extension based on content type
      const contentString = reportBuffer.toString('utf-8').trim();
      const isHTML = contentString.startsWith('<!DOCTYPE html>') || contentString.startsWith('<html');
      const fileExtension = isHTML ? 'html' : 'pdf';
      const contentType = isHTML ? 'text/html' : 'application/pdf';
      const fileName = `audit/${fileUuid}.${fileExtension}`;
      
      const { error } = await supabase.storage
        .from('admin-reports')
        .upload(fileName, reportBuffer, {
          contentType: contentType,
          upsert: true
        });

      if (error) {
        throw new Error(`Failed to upload report: ${error.message}`);
      }

      // Generate and return the full public URL
      const { data: { publicUrl } } = supabase.storage
        .from('admin-reports')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error(`Audit report generation failed for report ${reportId}:`, error);
      
      // Update the report status to FAILED with error message
      await this.repository.update(reportId, {
        status: 'FAILED',
        error_message: error instanceof Error ? error.message : 'Report generation failed',
      });
      
      // Re-throw the error to be caught by the main processReport method
      throw error;
    }
  }
}

export const reportGeneratorService = new ReportGeneratorService();
