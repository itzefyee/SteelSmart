import { useQuery } from '@tanstack/react-query';

interface DashboardStats {
  totalProducts: number;
  inStockProducts: number;
  totalReports: number;
  completedReports: number;
  processingReports: number;
  recentActivity: RecentActivity[];
}

interface RecentActivity {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  module: 'PRODUCT' | 'REPORT';
  description: string;
  created_at: string;
  user_email?: string;
}

const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    // Fetch all data in parallel for better performance
    const [productsRes, reportsRes, activityRes] = await Promise.all([
      fetch('/api/admin/products'),
      fetch('/api/admin/reports/statistics'),
      fetch('/api/admin/recent-activity'),
    ]);

    if (!productsRes.ok) {
      throw new Error('Failed to fetch products data');
    }

    const productsData = await productsRes.json();
    const products = productsData.data || [];

    // Handle reports statistics gracefully - don't fail if reports table doesn't exist
    let reportStats = { total: 0, completed: 0, processing: 0 };
    if (reportsRes.ok) {
      try {
        const reportsData = await reportsRes.json();
        reportStats = reportsData.data || reportStats;
      } catch (error) {
        console.warn('Reports statistics not available:', error);
      }
    } else {
      console.warn('Reports statistics endpoint not available, using defaults');
    }

    // Handle recent activity gracefully
    let recentActivity: RecentActivity[] = [];
    if (activityRes.ok) {
      try {
        const activityData = await activityRes.json();
        recentActivity = activityData.data || [];
      } catch (error) {
        console.warn('Recent activity not available:', error);
      }
    } else {
      console.warn('Recent activity endpoint not available, using empty array');
    }

    return {
      totalProducts: products.length,
      inStockProducts: products.filter((p: any) => p.in_stock !== false).length,
      totalReports: reportStats.total || 0,
      completedReports: reportStats.completed || 0,
      processingReports: reportStats.processing || 0,
      recentActivity,
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