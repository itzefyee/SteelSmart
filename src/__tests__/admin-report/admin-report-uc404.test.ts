/**
 * UC404: Generate Report (Admin)
 * Tests the admin functionality of creating and generating new reports
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportService } from '@/services/admin/report.service';
import { ValidationError } from '@/lib/errors/app-errors';

// Mock the repository
const mockRepositoryInstance = {
  create: vi.fn(),
  update: vi.fn(),
};

vi.mock('@/repositories/admin/report.repository', () => ({
  ReportRepository: class MockReportRepository {
    create = mockRepositoryInstance.create;
    update = mockRepositoryInstance.update;
  }
}));

// Mock the ReportGeneratorService
vi.mock('@/services/admin/ReportGeneratorService', () => ({
  reportGeneratorService: {
    processReport: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock Supabase
vi.mock('@/lib/supabase-server', () => ({
  getSupabaseServer: vi.fn(async () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null
      })
    }
  }))
}));

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    storage: {
      from: vi.fn().mockReturnThis(),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.co/admin-reports/audit/report-001.pdf' }
      })
    }
  }))
}));

// Mock audit log service
vi.mock('@/services/admin/audit/audit-log.service', () => ({
  AuditLogService: {
    logReport: vi.fn().mockResolvedValue(undefined)
  }
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

  beforeEach(() => {
    vi.clearAllMocks();
    reportService = new ReportService();
    
    // Mock crypto.randomUUID
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'report-001')
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('TC_AR_UC404_001: generate report successfully', async () => {
    mockRepositoryInstance.create.mockResolvedValue(createdReport);

    const result = await reportService.createAndGenerate(validReportInput);

    expect(result).toBe('report-001');
    expect(mockRepositoryInstance.create).toHaveBeenCalledWith({
      ...validReportInput,
      status: 'PENDING'
    });
    // Note: processReport is called asynchronously, so we can't easily test it here
    // In a real scenario, we'd test the integration separately
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