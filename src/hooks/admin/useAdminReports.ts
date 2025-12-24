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
    staleTime: 2 * 60 * 1000, // 2 minutes cache for admin data
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnMount: false, // Use cache if available
    refetchOnWindowFocus: false, // Don't refetch on focus
  });
}

export function useAdminReport(id: string) {
  return useQuery({
    queryKey: adminReportsKeys.detail(id),
    queryFn: () => adminReportsApi.getById(id),
    staleTime: 2 * 60 * 1000, // 2 minutes cache for admin data
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnMount: false, // Use cache if available
    refetchOnWindowFocus: false, // Don't refetch on focus
    enabled: !!id,
  });
}

export function useAdminReportStatistics() {
  return useQuery({
    queryKey: adminReportsKeys.statistics(),
    queryFn: adminReportsApi.getStatistics,
    staleTime: 5 * 60 * 1000, // 5 minutes cache for statistics
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: false, // Use cache if available
    refetchOnWindowFocus: false, // Don't refetch on focus
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
      
      // Invalidate list queries to trigger background refetch
      queryClient.invalidateQueries({ 
        queryKey: adminReportsKeys.lists(),
        refetchType: 'none' // Don't refetch immediately
      });
      
      // Invalidate statistics
      queryClient.invalidateQueries({ 
        queryKey: adminReportsKeys.statistics(),
        refetchType: 'none'
      });
      
      // Trigger background refetch after a short delay
      setTimeout(() => {
        queryClient.refetchQueries({ 
          queryKey: adminReportsKeys.lists(),
          type: 'active'
        });
        queryClient.refetchQueries({ 
          queryKey: adminReportsKeys.statistics(),
          type: 'active'
        });
      }, 100);
    },
  });
}