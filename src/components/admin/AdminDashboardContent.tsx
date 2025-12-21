'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FileText, TrendingUp, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useAdminDashboard } from '@/hooks/admin/useAdminDashboard';

// Utility function to format relative time (concise format)
function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const activityDate = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  // For older activities, show the actual date in short format
  return activityDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

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
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest product and report activities</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/5"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-2 text-sm">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex justify-between items-center gap-3">
                    <span className="text-foreground flex-1 truncate">
                      {activity.description}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                      {formatRelativeTime(activity.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity found</p>
                <p className="text-xs mt-1">
                  Activity will appear here when you create, update, or delete products and reports
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}