'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Trash2, Search, FileText, FilePlus } from 'lucide-react';
import { MotionConfig, motion } from 'framer-motion';
import Link from 'next/link';
import type { Report } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';
import { useAdminReports, useAdminReportStatistics, useDeleteAdminReport, adminReportsKeys } from '@/hooks/admin/useAdminReports';
import { useQueryClient } from '@tanstack/react-query';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export default function AdminReportsContent() {
  const prefersReducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // Clear all report-related cache when component mounts to ensure fresh data
  useEffect(() => {
    queryClient.removeQueries({ queryKey: adminReportsKeys.all });
  }, [queryClient]);

  // Use React Query hooks instead of manual state management
  const { data: reportsData, isLoading, error } = useAdminReports(currentPage, 10);
  const { data: stats } = useAdminReportStatistics();
  const deleteReportMutation = useDeleteAdminReport();

  const reports = reportsData?.data || [];
  const totalPages = reportsData?.pagination?.totalPages || 1;

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

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await deleteReportMutation.mutateAsync(reportId);
      addToast({
        title: 'Report Deleted',
        description: 'Report has been successfully deleted',
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to delete report',
        type: 'error',
      });
    }
  };

  const handleDownload = (report: Report) => {
    if (report.status !== 'COMPLETED' || !report.file_url) {
      addToast({
        title: 'Error',
        description: 'Report is not ready for download',
        type: 'error',
      });
      return;
    }

    const fileType = report.file_url.endsWith('.html') ? 'HTML Report' : 'PDF Report';

    window.open(report.file_url, '_blank');
    addToast({
      title: 'Download Started',
      description: `Downloading ${fileType}: ${report.title}`,
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
      case 'RFQ_REPORT':
        return 'custom';
      default:
        return 'outline';
    }
  };

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'never'}>
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
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.processing || 0}</div>
                <div className="text-sm text-muted-foreground">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
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
        {isLoading && !reports.length ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">Failed to load reports</div>
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
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                        <CardTitle className="text-lg line-clamp-2 flex-1 leading-5 mt-1.5">{report.title}</CardTitle>
                      </div>
                      <div className="text-sm text-muted-foreground flex-shrink-0">
                        {new Date(report.created_at || '').toLocaleDateString()}
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {report.description || `${report.report_type.replace(/_/g, ' ')} report`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={getTypeBadgeVariant(report.report_type)}>
                        {report.report_type.replace(/_/g, ' ')}
                      </Badge>
                      {getStatusBadge(report.status)}
                      <Badge variant="outline">
                        {report.file_url ? 
                          (report.file_url.endsWith('.html') ? 'HTML' : 'PDF') 
                          : 'PDF'}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        {report.status === 'COMPLETED' && report.file_url ? (
                          <span className="font-medium text-green-600">Ready for download</span>
                        ) : report.status === 'FAILED' ? (
                          <span className="font-medium text-red-600">Generation failed</span>
                        ) : report.status === 'PROCESSING' ? (
                          <span className="font-medium text-blue-600">Processing...</span>
                        ) : (
                          <span className="font-medium text-yellow-600">Pending</span>
                        )}
                      </div>
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
    </MotionConfig>
  );
}
