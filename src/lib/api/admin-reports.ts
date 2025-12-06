import type { Report, ReportStatistics } from '@/types';

export interface ReportGenerateParams {
  title: string;
  report_type: 'MONTHLY_MOST_QUOTED' | 'PRODUCT_ANALYTICS' | 'USER_ACTIVITY' | 'CUSTOM';
  parameters?: Record<string, any>;
}

export interface ReportListResponse {
  reports: Report[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export async function getReportListing(
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse<ReportListResponse>> {
  try {
    const response = await fetch(`/api/admin/reports?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to fetch reports' };
    }
    
    const data = await response.json();
    return { data: data.data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getReportDetails(reportId: string): Promise<ApiResponse<Report>> {
  try {
    const response = await fetch(`/api/admin/reports/${reportId}`);
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to fetch report' };
    }
    
    const data = await response.json();
    return { data: data.data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function generateReport(
  params: ReportGenerateParams
): Promise<ApiResponse<{ reportId: string }>> {
  try {
    const response = await fetch('/api/admin/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to generate report' };
    }
    
    const data = await response.json();
    return { data: { reportId: data.data.reportId } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteReport(reportId: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/admin/reports/${reportId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to delete report' };
    }
    
    return { data: undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function retryReport(reportId: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/admin/reports/${reportId}/retry`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to retry report' };
    }
    
    return { data: undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function createMonthlyMostQuotedReport(
  month: number,
  year: number
): Promise<ApiResponse<{ reportId: string }>> {
  try {
    const response = await fetch('/api/admin/reports/monthly-most-quoted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to create monthly report' };
    }
    
    const data = await response.json();
    return { data: { reportId: data.data.reportId } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getReportStatistics(): Promise<ApiResponse<ReportStatistics>> {
  try {
    const response = await fetch('/api/admin/reports/statistics');
    
    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Failed to fetch statistics' };
    }
    
    const data = await response.json();
    return { data: data.data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
