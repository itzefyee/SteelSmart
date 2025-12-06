import { ReportRepository, type ReportFilters, type CreateReportInput } from '@/repositories/admin/report.repository';
import type { Report } from '@/types';
import { NotFoundError, ValidationError } from '@/lib/errors/app-errors';
import { reportGeneratorService } from './ReportGeneratorService';

export class ReportService {
  private repository: ReportRepository;

  constructor() {
    this.repository = new ReportRepository();
  }

  async getAll(filters?: ReportFilters, page: number = 1, limit: number = 10) {
    const { reports, total } = await this.repository.findAll(filters, page, limit);
    
    return {
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string): Promise<Report> {
    const report = await this.repository.findById(id);
    
    if (!report) {
      throw new NotFoundError('Report');
    }
    
    return report;
  }

  async createAndGenerate(input: CreateReportInput): Promise<string> {
    // Validate
    if (!input.title || input.title.trim().length === 0) {
      throw new ValidationError('Title is required', { title: 'Title is required' });
    }
    
    if (!input.report_type) {
      throw new ValidationError('Report type is required', { report_type: 'Report type is required' });
    }
    
    // Create report
    const report = await this.repository.create({
      ...input,
      status: 'PENDING',
    });
    
    // Trigger generation asynchronously
    reportGeneratorService.processReport(report.id).catch(error => {
      console.error(`Report generation failed for ID ${report.id}:`, error);
    });
    
    return report.id;
  }

  async update(id: string, input: Partial<CreateReportInput>): Promise<Report> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Report');
    }
    
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    const report = await this.repository.findById(id);
    if (!report) {
      throw new NotFoundError('Report');
    }
    
    // Delete file from storage if exists
    if (report.file_url) {
      const { getSupabaseAdmin } = require('@/lib/supabase-server');
      const supabase = getSupabaseAdmin();
      const fileName = report.file_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('admin-reports').remove([fileName]);
      }
    }
    
    await this.repository.delete(id);
  }

  async retry(id: string): Promise<void> {
    const report = await this.repository.findById(id);
    
    if (!report) {
      throw new NotFoundError('Report');
    }
    
    if (report.status !== 'FAILED') {
      throw new ValidationError('Only failed reports can be retried');
    }
    
    // Reset status
    await this.repository.update(id, { status: 'PENDING' });
    
    // Trigger generation
    reportGeneratorService.processReport(id).catch(error => {
      console.error(`Report retry failed for ID ${id}:`, error);
    });
  }

  async getStatistics() {
    return this.repository.getStatistics();
  }

  async createMonthlyMostQuotedReport(month: number, year: number): Promise<string> {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return this.createAndGenerate({
      title: `Monthly Most Quoted Products - ${monthNames[month - 1]} ${year}`,
      report_type: 'MONTHLY_MOST_QUOTED',
      parameters: { month, year },
    });
  }
}
