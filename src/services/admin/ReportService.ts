import { supabase } from '@/lib/supabase';
import { reportGeneratorService } from './ReportGeneratorService';
import type { Report } from '@/types';

export interface CreateReportRequest {
  title: string;
  reportType: 'MONTHLY_MOST_FAV' | 'MONTHLY_MOST_QUOTED' | 'USER_TOP_QUOTATION';
  parameters: Record<string, any>;
}

export class ReportService {
  /**
   * Create a new report and trigger generation
   */
  static async createAndGenerateReport(request: CreateReportRequest): Promise<string> {
    try {
      // Create report record
      const { data, error } = await supabase
        .from('reports')
        .insert({
          title: request.title,
          report_type: request.reportType,
          parameters: request.parameters,
          status: 'PENDING'
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to create report: ${error.message}`);
      }

      const reportId = data.id;

      // Trigger report generation asynchronously
      reportGeneratorService.processReport(reportId).catch(error => {
        console.error(`Report generation failed for ID ${reportId}:`, error);
      });

      return reportId;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  /**
   * Get report by ID
   */
  static async getReport(reportId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch report: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all reports with pagination
   */
  static async getReports(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }

    return {
      reports: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  /**
   * Delete a report
   */
  static async deleteReport(reportId: string): Promise<void> {
    // First, try to delete the file from storage if it exists
    const report = await this.getReport(reportId);
    if (report.file_url) {
      const fileName = report.file_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('admin-reports')
          .remove([fileName]);
      }
    }

    // Delete the report record
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      throw new Error(`Failed to delete report: ${error.message}`);
    }
  }

  /**
   * Retry failed report generation
   */
  static async retryReport(reportId: string): Promise<void> {
    const report = await this.getReport(reportId);
    
    if (report.status !== 'FAILED') {
      throw new Error('Only failed reports can be retried');
    }

    // Reset status and trigger generation
    await supabase
      .from('reports')
      .update({ status: 'PENDING' })
      .eq('id', reportId);

    // Trigger report generation asynchronously
    reportGeneratorService.processReport(reportId).catch(error => {
      console.error(`Report retry failed for ID ${reportId}:`, error);
    });
  }

  /**
   * Helper method to create monthly most quoted report
   */
  static async createMonthlyMostQuotedReport(month: number, year: number): Promise<string> {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return this.createAndGenerateReport({
      title: `Monthly Most Quoted Products - ${monthNames[month - 1]} ${year}`,
      reportType: 'MONTHLY_MOST_QUOTED',
      parameters: { month, year }
    });
  }
}