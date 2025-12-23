/**
 * UC402: Download Report (Admin)
 * Tests the admin functionality of downloading generated reports
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportService } from '@/services/admin/report.service';

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

const mockCompletedReport = {
  id: 'report-001',
  title: 'Monthly Product Analysis',
  report_type: 'AUDIT_LOG' as const,
  status: 'COMPLETED' as const,
  parameters: { month: 1, year: 2024 },
  file_url: 'https://storage.supabase.co/admin-reports/audit/report-001.pdf',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:02:00Z',
  completed_at: '2024-01-01T00:05:00Z',
  error_message: undefined
};

const mockPendingReport = {
  ...mockCompletedReport,
  status: 'PENDING' as const,
  file_url: undefined,
  completed_at: undefined
};

describe('UC402: Download Report (Admin)', () => {
  let reportService: ReportService;

  beforeEach(() => {
    vi.clearAllMocks();
    reportService = new ReportService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_AR_UC402_001: download report successfully', async () => {
    const result = await reportService.getReportFileUrl(mockCompletedReport);

    expect(result).toBe('https://storage.supabase.co/admin-reports/audit/report-001.pdf');
  });

  it('TC_AR_UC402_002: return null for report without file URL', async () => {
    const reportWithoutFile = { ...mockCompletedReport, file_url: undefined };

    const result = await reportService.getReportFileUrl(reportWithoutFile);

    expect(result).toBeNull();
  });
});