import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Report } from '@/types';

interface ReportFilters {
  search?: string;
  status?: string;
  type?: string;
}

interface ReportStatistics {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

// Admin Reports API
const adminReportsApi = {
  getAll: async (page = 1, limit = 10, filters?: ReportFilters): Promise<{ data: Report[]; pagination: any }> => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.type) params.set('type', filters.type);
    
    const response = await fetch(`/api/admin/reports?${params}`);
    if (!response.ok) throw new Error('Failed to fetch reports');
    const data = await response.json();
    return data;
  },

  getById: async (id: string): Promise<Report> => {
    const response = await fetch(`/api/admin/reports/${id}`);
    if (!response.ok) throw new Error('Failed to fetch report');
    const data = await response.json();
    return data.data;
  },

  getStatistics: async (): Promise<ReportStatistics> => {
    const response = await fetch('/api/admin/reports/statistics');
    if (!response.ok) throw new Error('Failed to fetch statistics');
    const data = await response.json();
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/admin/reports/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete report');
  },
};

// Query Keys
export const adminReportsKeys = {
  all: ['admin', 'reports'] as const,
  lists: () => [...adminReportsKeys.all, 'list'] as const,
  list: (page?: number, limit?: number, filters?: ReportFilters) => [...adminReportsKeys.lists(), { page, limit, filters }] as const,
  details: () => [...adminReportsKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminReportsKeys.details(), id] as const,
  statistics: () => [...adminReportsKeys.all, 'statistics'] as const,
};

// Hooks
export function useAdminReports(page = 1, limit = 10, filters?: ReportFilters) {
  return useQuery({
    queryKey: adminReportsKeys.list(page, limit, filters),
    queryFn: () => adminReportsApi.getAll(page, limit, filters),
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache data in memory
    refetchOnMount: 'always', // Always refetch when component mounts (even if data exists)
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: false, // Don't retry failed requests to avoid stale data
  });
}

export function useAdminReport(id: string) {
  return useQuery({
    queryKey: adminReportsKeys.detail(id),
    queryFn: () => adminReportsApi.getById(id),
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache data in memory
    refetchOnMount: 'always', // Always refetch when component mounts (even if data exists)
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: false, // Don't retry failed requests to avoid stale data
    enabled: !!id,
  });
}

export function useAdminReportStatistics() {
  return useQuery({
    queryKey: adminReportsKeys.statistics(),
    queryFn: adminReportsApi.getStatistics,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache data in memory
    refetchOnMount: 'always', // Always refetch when component mounts (even if data exists)
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: false, // Don't retry failed requests to avoid stale data
  });
}

export function useDeleteAdminReport() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminReportsApi.delete,
    onSuccess: (_, deletedId) => {
      // Remove specific report from cache
      queryClient.removeQueries({ 
        queryKey: adminReportsKeys.detail(deletedId) 
      });
      
      // Immediately refetch list queries to get fresh data
      queryClient.invalidateQueries({ 
        queryKey: adminReportsKeys.lists(),
        refetchType: 'active' // Immediately refetch active queries
      });
      
      // Immediately refetch statistics
      queryClient.invalidateQueries({ 
        queryKey: adminReportsKeys.statistics(),
        refetchType: 'active' // Immediately refetch active queries
      });
    },
  });
}