'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Calendar, TrendingUp, Users } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export default function ReportGenerationPage() {
  const [reportType, setReportType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const { addToast } = useToast();
  const router = useRouter();

  const reportTypes = [
    {
      value: 'MONTHLY_MOST_QUOTED',
      label: 'Monthly Most Quoted Products',
      description: 'Generate a report of the most quoted products for a specific month',
      icon: TrendingUp,
    },
    {
      value: 'MONTHLY_MOST_FAV',
      label: 'Monthly Most Favorited',
      description: 'Generate a report of the most favorited products for a specific month',
      icon: Users,
    },
    {
      value: 'USER_TOP_QUOTATION',
      label: 'User Top Quotations',
      description: 'Generate a report of top quotations by users',
      icon: FileText,
    },
  ];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportType || !title) {
      addToast({
        title: 'Error',
        description: 'Please fill in all required fields',
        type: 'error',
      });
      return;
    }

    setLoading(true);

    const parameters: Record<string, any> = {};

    if (reportType === 'MONTHLY_MOST_QUOTED' || reportType === 'MONTHLY_MOST_FAV') {
      parameters.month = month;
      parameters.year = year;
    }

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          report_type: reportType,
          parameters,
          description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addToast({
          title: 'Report Generation Started',
          description: 'Your report is being generated. You can monitor its progress in the reports list.',
          type: 'success',
        });
        router.push(`/admin/reports/${data.data.reportId}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate report');
      }
    } catch (error: any) {
      addToast({
        title: 'Error',
        description: error.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedReportType = reportTypes.find((type) => type.value === reportType);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate New Report</h1>
        <p className="text-muted-foreground">Create custom reports based on your data requirements</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Configure the parameters for your new report</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type *</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Report Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a descriptive title for your report"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description for the report"
                    rows={3}
                  />
                </div>

                {(reportType === 'MONTHLY_MOST_QUOTED' || reportType === 'MONTHLY_MOST_FAV') && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="month">Month</Label>
                      <Select value={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((m) => (
                            <SelectItem key={m.value} value={m.value.toString()}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((y) => (
                            <SelectItem key={y} value={y.toString()}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Generating...' : 'Generate Report'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push('/admin/reports')}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {selectedReportType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <selectedReportType.icon className="h-5 w-5" />
                  {selectedReportType.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{selectedReportType.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Report Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Format:</span>
                <span className="text-sm font-medium">PDF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Processing Time:</span>
                <span className="text-sm font-medium">2-5 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Auto-refresh:</span>
                <span className="text-sm font-medium">Every 2 seconds</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
