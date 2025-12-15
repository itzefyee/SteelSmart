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
      staleTime: 1 * 60 * 1000, // 1 minute
    });
  }, [queryClient]);

  return null; // This component doesn't render anything
}