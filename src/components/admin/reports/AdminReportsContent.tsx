'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Trash2, Search, FileText, Calendar, FilePlus } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Report } from '@/types';

export default function AdminReportsContent() {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });

  // Safe toast function that only works on client-side
  const showToast = (toast: { title: string; description: string; type: string }) => {
    if (!isClient) {
      console.log('Toast (SSR):', toast.title, '-', toast.description);
      return;
    }
    
    try {
      const { useToast } = require('@/components/ui/ToastProvider');
      const toastContext = useToast();
      toastContext.addToast(toast);
    } catch (error) {
      console.log('Toast (fallback):', toast.title, '-', toast.description);
    }
  };

  useEffect(() => {
    setIsClient(true);
    loadReports();
    loadStatistics();
  }, [currentPage]);

  // Filter reports based on search query
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const query = searchQuery.toLowerCase();
    return reports.filter(
      (report) =>
        report.title.toLowerCase().includes(query) ||
        report.report_type.toLowerCase().includes(query) ||
        report.status.toLowerCase().includes(query)
    );
  }, [reports, searchQuery]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?page=${currentPage}&limit=10`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.data) {
        setReports(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load reports',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/admin/reports/statistics');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.data) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
      // Don't show toast for statistics failure, just log it
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReports(reports.filter((r) => r.id !== reportId));
        showToast({
          title: 'Report Deleted',
          description: 'Report has been successfully deleted',
          type: 'success',
        });
        loadStatistics();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to delete report',
        type: 'error',
      });
    }
  };

  const handleDownload = (report: Report) => {
    if (report.status !== 'COMPLETED' || !report.file_url) {
      showToast({
        title: 'Error',
        description: 'Report is not ready for download',
        type: 'error',
      });
      return;
    }

    window.open(report.file_url, '_blank');
    showToast({
      title: 'Download Started',
      description: `Downloading ${report.title}...`,
      type: 'info',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'PROCESSING':
        return <Badge variant="default">Processing</Badge>;
      case 'COMPLETED':
        return (
          <Badge variant="default" className="bg-green-500">
            Completed
          </Badge>
        );
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" | "success" | "robotic" | "structural" | "fasteners" | "custom" => {
    switch (type) {
      case 'AUDIT_LOG':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report Management</h1>
          <p className="text-muted-foreground mt-1">View, download, and manage your generated reports</p>
        </div>
        <Link href="/admin/reports/generate">
          <Button className="bg-primary text-white hover:bg-primary/90 gap-2">
            <FilePlus className="w-4 h-4" />
            Generate Report
          </Button>
        </Link>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex items-center gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          Showing {filteredReports.length} of {reports.length} reports
        </span>
      </motion.div>

      {/* Statistics Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Report Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
                <div className="text-sm text-muted-foreground">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reports Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">Loading reports...</div>
            </CardContent>
          </Card>
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reports found matching your search criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg line-clamp-2">{report.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {`${report.report_type.replace(/_/g, ' ')} report generated on ${new Date(
                        report.created_at || ''
                      ).toLocaleDateString()}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={getTypeBadgeVariant(report.report_type)}>
                        {report.report_type.replace(/_/g, ' ')}
                      </Badge>
                      {getStatusBadge(report.status)}
                      <Badge variant="outline">PDF</Badge>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(report.created_at || '').toLocaleDateString()}</span>
                      </div>
                      {report.file_url && (
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className="font-medium text-green-600">Ready for download</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 pt-3">
                    <Link href={`/admin/reports/${report.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    {report.status === 'COMPLETED' && report.file_url && (
                      <Button variant="outline" size="sm" onClick={() => handleDownload(report)} className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                    <Button className="bg-red-600 text-white hover:bg-red-700" size="sm" onClick={() => handleDelete(report.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex justify-center items-center space-x-2"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </motion.div>
      )}
    </div>
  );
}