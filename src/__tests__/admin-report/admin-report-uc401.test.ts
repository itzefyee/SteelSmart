/**
 * UC401: View Report Details (Admin)
 * Tests the admin functionality of viewing detailed report information
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportService } from '@/services/admin/report.service';
import { NotFoundError } from '@/lib/errors/app-errors';

vi.mock('@/repositories/admin/report.repository', () => {
  const mockRepository = {
    findById: vi.fn(),
  };
  return { ReportRepository: vi.fn(() => mockRepository) };
});

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
  let mockRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    reportService = new ReportService();
    mockRepository = new (require('@/repositories/admin/report.repository').ReportRepository)();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_AR_UC401_001: retrieve report details successfully', async () => {
    mockRepository.findById.mockResolvedValue(mockReport);

    const result = await reportService.getById('report-001');

    expect(result).toEqual(mockReport);
    expect(mockRepository.findById).toHaveBeenCalledWith('report-001');
  });

  it('TC_AR_UC401_002: throw NotFoundError for non-existent report ID', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(reportService.getById('non-existent-id'))
      .rejects.toThrow(NotFoundError);
  });
});