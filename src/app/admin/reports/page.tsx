'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Trash2, Search, FileText, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import Link from 'next/link';
import type { Report } from '@/types';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadReports();
    loadStatistics();
  }, [currentPage]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?page=${currentPage}&limit=10`);
      const data = await response.json();

      if (data.data) {
        setReports(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      addToast({
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
      const data = await response.json();

      if (data.data) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const filteredReports = reports.filter(
    (report) =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.report_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReports(reports.filter((r) => r.id !== reportId));
        addToast({
          title: 'Report Deleted',
          description: 'Report has been successfully deleted',
          type: 'success',
        });
        loadStatistics();
      } else {
        throw new Error('Failed to delete');
      }
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

    window.open(report.file_url, '_blank');
    addToast({
      title: 'Download Started',
      description: `Downloading ${report.title}...`,
      type: 'info',
    });
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'MONTHLY_MOST_QUOTED':
        return 'default';
      case 'MONTHLY_MOST_FAV':
        return 'secondary';
      case 'USER_TOP_QUOTATION':
        return 'outline';
      default:
        return 'default';
    }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report Management</h1>
          <p className="text-muted-foreground">View, download, and manage your generated reports</p>
        </div>
        <Link href="/admin/reports/generate">
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredReports.length} of {reports.length} reports
        </div>
      </div>

      {/* Statistics Section */}
      <Card className="mb-6">
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

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
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
                <Button variant="outline" size="sm" onClick={() => handleDelete(report.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredReports.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <div className="text-muted-foreground">No reports found matching your search criteria.</div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
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
        </div>
      )}
    </div>
  );
}
