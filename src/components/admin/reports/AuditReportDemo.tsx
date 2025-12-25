'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditReportDesign } from './AuditReportDesign';
import { AuditReportPrint } from './AuditReportPrint';
import { 
  generateSampleAuditData, 
  printAuditReport, 
  exportAuditReportCSV,
  downloadAuditReportPDF 
} from '@/lib/audit-report-generator';
import { Download, Printer, FileText, Eye } from 'lucide-react';

export function AuditReportDemo() {
  const [viewMode, setViewMode] = useState<'screen' | 'print'>('screen');
  const [sampleData] = useState(() => generateSampleAuditData());

  const handlePrint = () => {
    setViewMode('print');
    setTimeout(() => {
      printAuditReport();
      setViewMode('screen');
    }, 100);
  };

  const handleDownloadPDF = async () => {
    setViewMode('print');
    setTimeout(async () => {
      await downloadAuditReportPDF(sampleData);
      setViewMode('screen');
    }, 100);
  };

  const handleExportCSV = () => {
    exportAuditReportCSV(sampleData);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Report Design Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={viewMode === 'screen' ? 'default' : 'outline'}
              onClick={() => setViewMode('screen')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Screen View
            </Button>
            
            <Button
              variant={viewMode === 'print' ? 'default' : 'outline'}
              onClick={() => setViewMode('print')}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Preview
            </Button>
            
            <div className="border-l border-gray-300 mx-2"></div>
            
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
            
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Design Features:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>SteelSmart Branding:</strong> Navy Blue (#1a3c5e) primary color scheme</li>
              <li>• <strong>Professional Layout:</strong> Two-column header with company info and report metadata</li>
              <li>• <strong>KPI Cards:</strong> 4-column grid showing key metrics with color-coded values</li>
              <li>• <strong>Data Table:</strong> Zebra-striped rows with navy header and status color coding</li>
              <li>• <strong>Print Optimized:</strong> A4 page format with proper margins and typography</li>
              <li>• <strong>Export Options:</strong> Print, PDF download, and CSV export functionality</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      <div className="border rounded-lg overflow-hidden">
        {viewMode === 'screen' ? (
          <AuditReportDesign 
            data={sampleData} 
            currentPage={1} 
            totalPages={1} 
          />
        ) : (
          <AuditReportPrint 
            data={sampleData} 
            currentPage={1} 
            totalPages={1} 
          />
        )}
      </div>

      {/* Sample Data Info */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Data Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-semibold text-gray-600">Report ID</div>
              <div>{sampleData.reportId}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-600">Period</div>
              <div>{sampleData.period}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-600">Total Actions</div>
              <div>{sampleData.summary.totalActions}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-600">Success Rate</div>
              <div>{sampleData.summary.successRate.toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}