'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, Download, Trash2, FileText, Calendar, Clock, User } from 'lucide-react';
import { MotionConfig, motion } from 'framer-motion';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/ToastProvider';
import { useAdminReport, useDeleteAdminReport } from '@/hooks/admin/useAdminReports';
import type { Report } from '@/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AdminReportDetailsContentProps {
  reportId: string;
}

export function AdminReportDetailsContent({ reportId }: AdminReportDetailsContentProps) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const { addToast } = useToast();

  // Use React Query hooks instead of manual state management
  const { data: report, isLoading, error } = useAdminReport(reportId);
  const deleteReportMutation = useDeleteAdminReport();

  const handleDownload = () => {
    if (!report || report.status !== 'COMPLETED' || !report.file_url) {
      addToast({
        title: 'Download unavailable',
        description: 'This report is not yet ready for download.',
        type: 'error',
      });
      return;
    }

    window.open(report.file_url, '_blank');
    addToast({
      title: 'Download started',
      description: `Downloading ${report.title}...`,
      type: 'info',
    });
  };

  const handleDelete = async () => {
    if (!reportId) return;

    try {
      await deleteReportMutation.mutateAsync(reportId);
      addToast({
        title: 'Report Deleted',
        description: 'Report has been deleted successfully',
        type: 'success',
      });
      router.push('/admin/reports');
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to delete report',
        type: 'error',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'PROCESSING':
        return <Badge variant="default">Processing</Badge>;
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        {/* Back Button - Close to Sidebar */}
        <div className="p-6 pb-0">
          <Link href="/admin/reports">
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">Failed to load report</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show not found state if no report and not loading
  if (!isLoading && !report) {
    return (
      <div className="min-h-screen bg-background">
        {/* Back Button - Close to Sidebar */}
        <div className="p-6 pb-0">
          <Link href="/admin/reports">
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Report Not Found</h2>
            <p className="text-muted-foreground mb-6">The report you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  // If still loading and no cached data, show minimal loading (this should rarely happen due to caching)
  if (isLoading && !report) {
    return (
      <div className="min-h-screen bg-background">
        {/* Back Button - Close to Sidebar */}
        <div className="p-6 pb-0">
          <Link href="/admin/reports">
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Minimal loading - should rarely show due to React Query caching */}
          <div className="min-h-[200px] flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  // At this point, report should be available (either from cache or fresh fetch)
  if (!report) {
    return (
      <div className="min-h-screen bg-background">
        {/* Back Button - Close to Sidebar */}
        <div className="p-6 pb-0">
          <Link href="/admin/reports">
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Report Not Found</h2>
            <p className="text-muted-foreground mb-6">The report you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const detailItems = [
    { icon: User, label: 'Author', value: 'Admin User' },
    { icon: FileText, label: 'Report Type', value: report.report_type.replace(/_/g, ' ') },
    { 
      icon: Calendar, 
      label: 'Created', 
      value: report.created_at ? format(new Date(report.created_at), 'MMMM d, yyyy \'at\' h:mm a') : 'N/A'
    },
    { 
      icon: Clock, 
      label: 'Last Updated', 
      value: report.updated_at ? format(new Date(report.updated_at), 'MMMM d, yyyy \'at\' h:mm a') : 'N/A'
    },
  ];

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'never'}>
    <div className="min-h-screen bg-background">
      {/* Back Button - Close to Sidebar */}
      <div className="p-6 pb-0">
        <Link href="/admin/reports">
          <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card rounded-lg border border-border p-6 shadow-sm mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-foreground mb-2">{report.title}</h1>
                  {getStatusBadge(report.status)}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownload}
                    disabled={report.status !== 'COMPLETED' || !report.file_url}
                    className="bg-primary text-white hover:bg-primary/90 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Report
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-red-600 text-white hover:bg-red-700">
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
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card rounded-lg border border-border p-6 shadow-sm mb-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">Description</h2>
          <p className="text-muted-foreground leading-relaxed">
            {report.description || `This is a ${report.report_type.replace(/_/g, ' ').toLowerCase()} report containing detailed analytics and insights.`}
          </p>
        </motion.div>

        {/* Details Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card rounded-lg border border-border p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Report Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {detailItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="font-medium text-foreground">{item.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-card rounded-lg border border-border p-6 shadow-sm mt-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Report Preview</h2>
          <div className="bg-muted/50 rounded-lg border border-border overflow-hidden min-h-[500px]">
            {report.status === 'COMPLETED' && report.file_url ? (
              <iframe
                src={report.file_url}
                className="w-full h-[500px] border-0"
                title="PDF Preview"
                onError={() => {
                  addToast({
                    title: 'Preview Error',
                    description: 'Unable to preview PDF. You can still download the report.',
                    type: 'warning',
                  });
                }}
              />
            ) : report.status === 'COMPLETED' ? (
              <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-primary/40 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">PDF Preview Unavailable</p>
                  <p className="text-sm text-muted-foreground">The report is ready for download</p>
                  <Button 
                    onClick={handleDownload}
                    className="mt-4 bg-primary text-white hover:bg-primary/90"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </div>
            ) : report.status === 'PROCESSING' ? (
              <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Report is being generated...</p>
                </div>
              </div>
            ) : report.status === 'PENDING' ? (
              <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                  <Clock className="w-16 h-16 text-yellow-500/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">Report is queued for processing</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-destructive/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">Report generation failed</p>
                  <p className="text-sm text-muted-foreground mt-1">Please try generating the report again</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
    </MotionConfig>
  );
}
