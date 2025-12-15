import { useQuery } from '@tanstack/react-query';

interface DashboardStats {
  totalProducts: number;
  inStockProducts: number;
  totalReports: number;
  completedReports: number;
  processingReports: number;
}

const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    // Fetch both endpoints in parallel for better performance
    const [productsRes, reportsRes] = await Promise.all([
      fetch('/api/admin/products'),
      fetch('/api/admin/reports/statistics'),
    ]);

    if (!productsRes.ok || !reportsRes.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    const [productsData, reportsData] = await Promise.all([
      productsRes.json(),
      reportsRes.json(),
    ]);

    const products = productsData.data || [];
    const reportStats = reportsData.data || {};

    return {
      totalProducts: products.length,
      inStockProducts: products.filter((p: any) => p.in_stock !== false).length,
      totalReports: reportStats.total || 0,
      completedReports: reportStats.completed || 0,
      processingReports: reportStats.processing || 0,
    };
  },
};

export const dashboardKeys = {
  all: ['admin', 'dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: dashboardApi.getStats,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });
}