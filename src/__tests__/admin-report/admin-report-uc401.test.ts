/**
 * UC401: View Report Details (Admin)
 * Tests the admin functionality of viewing detailed report information
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportService } from '@/services/admin/report.service';
import { NotFoundError } from '@/lib/errors/app-errors';

// Mock the repository
const mockRepositoryInstance = {
  findById: vi.fn(),
};

vi.mock('@/repositories/admin/report.repository', () => ({
  ReportRepository: class MockReportRepository {
    findById = mockRepositoryInstance.findById;
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

const mockReport = {
  id: 'report-001',
  title: 'Monthly Product Analysis',
  report_type: 'AUDIT_LOG' as const,
  status: 'COMPLETED' as const,
  parameters: {
    month: 1,
    year: 2024
  },
  file_url: 'https://storage.supabase.co/admin-reports/audit/report-001.pdf',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:02:00Z',
  completed_at: '2024-01-01T00:05:00Z',
  error_message: undefined
};

describe('UC401: View Report Details (Admin)', () => {
  let reportService: ReportService;

  beforeEach(() => {
    vi.clearAllMocks();
    reportService = new ReportService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_AR_UC401_001: retrieve report details successfully', async () => {
    mockRepositoryInstance.findById.mockResolvedValue(mockReport);

    const result = await reportService.getById('report-001');

    expect(result).toEqual(mockReport);
    expect(mockRepositoryInstance.findById).toHaveBeenCalledWith('report-001');
  });

  it('TC_AR_UC401_002: throw NotFoundError for non-existent report ID', async () => {
    mockRepositoryInstance.findById.mockResolvedValue(null);

    await expect(reportService.getById('non-existent-id'))
      .rejects.toThrow(NotFoundError);
  });
});