'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FileText, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useAdminDashboard } from '@/hooks/admin/useAdminDashboard';

export function AdminDashboardContent() {
  const { data: stats, isLoading: loading, refetch } = useAdminDashboard();

  const handleRefresh = () => {
    refetch();
  };

  const statCards = [
    {
      title: 'Total Products',
      value: loading ? '...' : (stats?.totalProducts || 0).toString(),
      description: `${stats?.inStockProducts || 0} in stock`,
      icon: Package,
      color: 'text-primary',
    },
    {
      title: 'Reports Generated',
      value: loading ? '...' : (stats?.totalReports || 0).toString(),
      description: `${stats?.completedReports || 0} completed, ${stats?.processingReports || 0} processing`,
      icon: FileText,
      color: 'text-success',
    },
    {
      title: 'In Stock Products',
      value: loading ? '...' : (stats?.inStockProducts || 0).toString(),
      description: `${(stats?.totalProducts || 0) - (stats?.inStockProducts || 0)} out of stock`,
      icon: TrendingUp,
      color: 'text-warning',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your admin dashboard. Manage products and reports efficiently.
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${loading ? 'animate-pulse' : ''}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col gap-2">
              <Link href="/admin/products/new" className="text-sm text-primary hover:underline">
                Add New Product
              </Link>
              <Link href="/admin/products" className="text-sm text-primary hover:underline">
                Manage Products
              </Link>
              <Link href="/admin/reports" className="text-sm text-primary hover:underline">
                View Reports
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Product updated</span>
                <span className="text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex justify-between">
                <span>New report generated</span>
                <span className="text-muted-foreground">4 hours ago</span>
              </div>
              <div className="flex justify-between">
                <span>Product added</span>
                <span className="text-muted-foreground">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}