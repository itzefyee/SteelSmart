'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MotionConfig, motion } from 'framer-motion';
import { ArrowLeft, FileText, Calendar, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type ReportType = 'AUDIT_LOG' | 'RFQ_REPORT';

interface GenerateReportFormData {
  reportType: ReportType;
  reportName: string;
  description: string;
  month: number;
  year: number;
}

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function AdminGenerateReportContent() {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const now = new Date();
  const [formData, setFormData] = useState<GenerateReportFormData>({
    reportType: 'AUDIT_LOG',
    reportName: '',
    description: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  // Safe toast function
  const showToast = (toast: { title: string; description: string; type: 'success' | 'error' | 'info' | 'warning' }) => {
    if (!isClient) {
      console.log('Toast (SSR):', toast.title, '-', toast.description);
      return;
    }
    
    try {
      // Dynamic import to avoid SSR issues
      import('@/components/ui/ToastProvider').then(({ useToast }) => {
        const toastContext = useToast();
        toastContext.addToast(toast);
      }).catch(() => {
        console.log('Toast (fallback):', toast.title, '-', toast.description);
      });
    } catch {
      console.log('Toast (fallback):', toast.title, '-', toast.description);
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reportName.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'Please enter a report name',
        type: 'error',
      });
      return;
    }

    if (formData.reportType !== 'AUDIT_LOG' && formData.reportType !== 'RFQ_REPORT') {
      showToast({
        title: 'Invalid Report Type',
        description: 'Please select a valid report type',
        type: 'error',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.reportName,
          description: formData.description,
          report_type: formData.reportType,
          parameters: { month: formData.month, year: formData.year },
        }),
      });

      if (response.ok) {
        showToast({
          title: 'Report Generation Started',
          description: 'Your report is being generated. This may take a few moments.',
          type: 'success',
        });
        
        // Navigate back to reports page
        router.push('/admin/reports');
      } else {
        // Get the error details from the response
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate report. Please try again.',
        type: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'never'}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/reports')}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Generate New Report</h1>
          <p className="text-muted-foreground">Configure and generate a custom report</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Report Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Report Type
            </CardTitle>
            <CardDescription>Select the type of report you want to generate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Audit Log Report */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.reportType === 'AUDIT_LOG' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData({ ...formData, reportType: 'AUDIT_LOG' })}
              >
                <div className="font-medium text-foreground">Audit Log Report</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Admin activities and system events for the selected month
                </div>
              </div>

              {/* RFQ Report */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.reportType === 'RFQ_REPORT' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData({ ...formData, reportType: 'RFQ_REPORT' })}
              >
                <div className="font-medium text-foreground">RFQ Performance Report</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Sales performance, conversion rates, and RFQ analytics
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Report Details
            </CardTitle>
            <CardDescription>Provide information about your report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reportName">Report Name *</Label>
              <Input
                id="reportName"
                placeholder="e.g., December 2024 Audit Log Report"
                value={formData.reportName}
                onChange={(e) => setFormData({ ...formData, reportName: e.target.value })}
                className={formData.reportName ? 'bg-blue-50' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add a brief description of what this report should contain..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className={formData.description ? 'bg-blue-50' : ''}
              />
            </div>
          </CardContent>
        </Card>

        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Report Month
            </CardTitle>
            <CardDescription>Select the month and year for the report data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month *</Label>
                <Select
                  value={formData.month.toString()}
                  onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
                >
                  <SelectTrigger className={formData.month ? 'bg-blue-50' : ''}>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Year *</Label>
                <Select
                  value={formData.year.toString()}
                  onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
                >
                  <SelectTrigger className={formData.year ? 'bg-blue-50' : ''}>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/reports')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
    </MotionConfig>
  );
}
