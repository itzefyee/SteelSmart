/**
 * UC404: Generate Report (Admin)
 * Tests the admin functionality of creating and generating new reports
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportService } from '@/services/admin/report.service';
import { ValidationError } from '@/lib/errors/app-errors';

vi.mock('@/repositories/admin/report.repository', () => {
  const mockRepository = {
    create: vi.fn(),
    update: vi.fn(),
  };
  return { ReportRepository: vi.fn(() => mockRepository) };
});

vi.mock('@/services/admin/ReportGeneratorService', () => ({
  reportGeneratorService: {
    processReport: vi.fn(),
  },
}));

const validReportInput = {
  title: 'Monthly Product Analysis',
  report_type: 'AUDIT_LOG' as const,
  parameters: {
    month: 1,
    year: 2024
  }
};

const createdReport = {
  id: 'report-001',
  ...validReportInput,
  status: 'PENDING' as const,
  file_url: undefined,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  completed_at: undefined,
  error_message: undefined
};

describe('UC404: Generate Report (Admin)', () => {
  let reportService: ReportService;
  let mockRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    reportService = new ReportService();
    mockRepository = new (require('@/repositories/admin/report.repository').ReportRepository)();
    
    // Mock crypto.randomUUID
    Object.defineProperty(global, 'crypto', {
      value: {
        randomUUID: vi.fn(() => 'report-001')
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_AR_UC404_001: generate report successfully', async () => {
    const { reportGeneratorService } = require('@/services/admin/ReportGeneratorService');
    mockRepository.create.mockResolvedValue(createdReport);
    reportGeneratorService.processReport.mockResolvedValue(undefined);

    const result = await reportService.createAndGenerate(validReportInput);

    expect(result).toBe('report-001');
    expect(mockRepository.create).toHaveBeenCalledWith({
      ...validReportInput,
      status: 'PENDING'
    });
    expect(reportGeneratorService.processReport).toHaveBeenCalledWith('report-001');
  });

  it('TC_AR_UC404_002: reject invalid input', async () => {
    // Test empty title
    const emptyTitleInput = { ...validReportInput, title: '' };
    await expect(reportService.createAndGenerate(emptyTitleInput))
      .rejects.toThrow(ValidationError);

    // Test missing report type
    const missingTypeInput = { ...validReportInput, report_type: '' as any };
    await expect(reportService.createAndGenerate(missingTypeInput))
      .rejects.toThrow(ValidationError);
  });
});