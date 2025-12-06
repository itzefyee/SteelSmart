'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FileText, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    inStockProducts: 0,
    totalReports: 0,
    completedReports: 0,
    processingReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch products
      const productsRes = await fetch('/api/products');
      const productsData = await productsRes.json();
      const products = productsData.data || [];
      
      // Fetch report statistics
      const reportsRes = await fetch('/api/reports/statistics');
      const reportsData = await reportsRes.json();
      const reportStats = reportsData.data || {};

      setStats({
        totalProducts: products.length,
        inStockProducts: products.filter((p: any) => p.in_stock !== false).length,
        totalReports: reportStats.total || 0,
        completedReports: reportStats.completed || 0,
        processingReports: reportStats.processing || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: loading ? '...' : stats.totalProducts.toString(),
      description: `${stats.inStockProducts} in stock`,
      icon: Package,
      color: 'text-primary',
    },
    {
      title: 'Reports Generated',
      value: loading ? '...' : stats.totalReports.toString(),
      description: `${stats.completedReports} completed, ${stats.processingReports} processing`,
      icon: FileText,
      color: 'text-success',
    },
    {
      title: 'In Stock Products',
      value: loading ? '...' : stats.inStockProducts.toString(),
      description: `${stats.totalProducts - stats.inStockProducts} out of stock`,
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
        <Button onClick={loadData} disabled={loading} variant="outline">
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
