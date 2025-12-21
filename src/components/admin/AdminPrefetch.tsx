'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adminProductsKeys } from '@/hooks/admin/useAdminProducts';
import { dashboardKeys } from '@/hooks/admin/useAdminDashboard';

/**
 * Component to prefetch admin data for better performance
 * Should be mounted in the admin layout
 */
export function AdminPrefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch products data
    queryClient.prefetchQuery({
      queryKey: adminProductsKeys.list(),
      queryFn: async () => {
        const response = await fetch('/api/admin/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        return data.data;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });

    // Prefetch dashboard stats
    queryClient.prefetchQuery({
      queryKey: dashboardKeys.stats(),
      queryFn: async () => {
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
        let recentActivity = [];
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
      staleTime: 1 * 60 * 1000, // 1 minute
    });
  }, [queryClient]);

  return null; // This component doesn't render anything
}