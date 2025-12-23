/**
 * UC403: Delete Report (Admin)
 * Tests the admin functionality of deleting reports and associated files
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportService } from '@/services/admin/report.service';
import { NotFoundError } from '@/lib/errors/app-errors';

// Mock the repository
const mockRepositoryInstance = {
  findById: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@/repositories/admin/report.repository', () => ({
  ReportRepository: class MockReportRepository {
    findById = mockRepositoryInstance.findById;
    delete = mockRepositoryInstance.delete;
  }
}));

// Mock the ReportGeneratorService
vi.mock('@/services/admin/ReportGeneratorService', () => ({
  reportGeneratorService: {
    processReport: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock audit log service
vi.mock('@/services/admin/audit/audit-log.service', () => ({
  AuditLogService: {
    logReport: vi.fn().mockResolvedValue(undefined)
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

const mockSupabaseStorage = {
  from: vi.fn().mockReturnThis(),
  remove: vi.fn().mockResolvedValue({ error: null })
};

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    storage: mockSupabaseStorage
  }))
}));

const mockReport = {
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

describe('UC403: Delete Report (Admin)', () => {
  let reportService: ReportService;

  beforeEach(() => {
    vi.clearAllMocks();
    reportService = new ReportService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_AR_UC403_001: delete report successfully', async () => {
    mockRepositoryInstance.findById.mockResolvedValue(mockReport);
    mockRepositoryInstance.delete.mockResolvedValue(undefined);

    await reportService.delete('report-001');

    expect(mockRepositoryInstance.findById).toHaveBeenCalledWith('report-001');
    expect(mockSupabaseStorage.from).toHaveBeenCalledWith('admin-reports');
    expect(mockSupabaseStorage.remove).toHaveBeenCalled();
    expect(mockRepositoryInstance.delete).toHaveBeenCalledWith('report-001');
  });
});