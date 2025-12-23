/**
 * UC403: Delete Report (Admin)
 * Tests the admin functionality of deleting reports and associated files
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportService } from '@/services/admin/report.service';
import { NotFoundError } from '@/lib/errors/app-errors';

vi.mock('@/repositories/admin/report.repository', () => {
  const mockRepository = {
    findById: vi.fn(),
    delete: vi.fn(),
  };
  return { ReportRepository: vi.fn(() => mockRepository) };
});

vi.mock('@/services/admin/audit/audit-log.service', () => ({
  AuditLogService: {
    logReport: vi.fn(),
  },
}));

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
      remove: vi.fn().mockResolvedValue({ error: null })
    }
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
  let mockRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    reportService = new ReportService();
    mockRepository = new (require('@/repositories/admin/report.repository').ReportRepository)();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_AR_UC403_001: delete report successfully', async () => {
    const mockSupabase = require('@/lib/supabase').getSupabaseAdmin();
    mockRepository.findById.mockResolvedValue(mockReport);
    mockRepository.delete.mockResolvedValue(undefined);

    await reportService.delete('report-001');

    expect(mockRepository.findById).toHaveBeenCalledWith('report-001');
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('admin-reports');
    expect(mockSupabase.storage.remove).toHaveBeenCalled();
    expect(mockRepository.delete).toHaveBeenCalledWith('report-001');
  });
});