'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Download, Trash2, FileText, Calendar, FileType } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Report } from '@/types';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    loadReport();
    // Auto-refresh if processing
    const interval = setInterval(() => {
      if (report?.status === 'PROCESSING' || report?.status === 'PENDING') {
        loadReport();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [id, report?.status]);

  const loadReport = async () => {
    try {
      const response = await fetch(`/api/reports/${id}`);
      const data = await response.json();

      if (data.data) {
        setReport(data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Report Deleted',
          description: 'Report has been successfully deleted',
        });
        router.push('/admin/reports');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete report',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    if (!report?.file_url) return;

    window.open(report.file_url, '_blank');
    toast({
      title: 'Download Started',
      description: `Downloading ${report.title}...`,
    });
  };

  const handleRetry = async () => {
    try {
      const response = await fetch(`/api/reports/${id}/retry`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Report Retry Initiated',
          description: 'The report generation has been restarted',
        });
        loadReport();
      } else {
        throw new Error('Failed to retry');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to retry report generation',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">Loading report...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">Report not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default';
      case 'PROCESSING':
        return 'secondary';
      case 'PENDING':
        return 'outline';
      case 'FAILED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{report.title}</h1>
            <p className="text-muted-foreground">
              Generated on {new Date(report.created_at || '').toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={report.status !== 'COMPLETED' || !report.file_url}
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Report</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{report.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant={getTypeBadgeVariant(report.report_type)}>
                  {report.report_type.replace(/_/g, ' ')}
                </Badge>
                <Badge variant={getStatusBadgeVariant(report.status)}>{report.status}</Badge>
                <Badge variant="outline">PDF</Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {report.description || `${report.report_type.replace(/_/g, ' ')} report generated automatically`}
              </p>

              {(report.status === 'PROCESSING' || report.status === 'PENDING') && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-blue-800">
                      {report.status === 'PENDING'
                        ? 'Report is queued for generation...'
                        : 'Report is being generated...'}
                    </span>
                  </div>
                </div>
              )}

              {report.status === 'FAILED' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-sm text-red-800">
                    Report generation failed. You can retry the generation using the button below.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {report.parameters && typeof report.parameters === 'object' && (
            <Card>
              <CardHeader>
                <CardTitle>Report Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(report.parameters as Record<string, any>).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </div>
                      <div className="text-lg font-semibold text-primary">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileType className="h-5 w-5" />
                File Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Format:</span>
                <span className="text-sm font-medium">PDF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Status:</span>
                <span className="text-sm font-medium">{report.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Type:</span>
                <span className="text-sm font-medium">{report.report_type.replace(/_/g, ' ')}</span>
              </div>
              {report.file_url && (
                <div className="flex justify-between">
                  <span className="text-sm">File Available:</span>
                  <span className="text-sm font-medium text-green-600">Yes</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Generation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Generated Date:</span>
                <span className="text-sm font-medium">{new Date(report.created_at || '').toLocaleDateString()}</span>
              </div>
              {report.updated_at && (
                <div className="flex justify-between">
                  <span className="text-sm">Last Updated:</span>
                  <span className="text-sm font-medium">{new Date(report.updated_at).toLocaleDateString()}</span>
                </div>
              )}
              <Separator />
              <div className="text-xs text-muted-foreground">Report ID: {report.id}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                disabled={report.status !== 'COMPLETED' || !report.file_url}
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
              {report.status === 'FAILED' && (
                <Button variant="outline" className="w-full" onClick={handleRetry}>
                  <FileText className="h-4 w-4 mr-2" />
                  Retry Generation
                </Button>
              )}
              <Link href="/admin/reports/generate" className="w-full">
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Similar
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
