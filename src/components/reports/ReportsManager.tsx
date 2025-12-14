'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

interface Report {
  id: number;
  title: string;
  type: 'Analysis' | 'Recommendation' | 'Validation';
  drawingName: string;
  createdDate: string;
  status: 'Completed' | 'Processing' | 'Failed';
  fileSize: string;
  summary: string;
  details: {
    manufacturability?: number;
    costEstimate?: string;
    leadTime?: string;
    recommendations?: string[];
    validationResults?: number;
    compatibilityScore?: number;
  };
}

const sampleReports: Report[] = [
  {
    id: 1,
    title: 'Steel Beam Analysis Report',
    type: 'Analysis',
    drawingName: 'Steel I-Beam 200x100mm',
    createdDate: '2024-01-20',
    status: 'Completed',
    fileSize: '2.4 MB',
    summary: 'Comprehensive analysis of structural steel beam with manufacturability assessment and cost estimates.',
    details: {
      manufacturability: 85,
      costEstimate: '$45-65 per unit',
      leadTime: '7-10 days',
      recommendations: [
        'Consider standard hole sizes for cost optimization',
        'Material SS304 is optimal for this application',
        'Surface finish requirements are achievable'
      ],
      validationResults: 4
    }
  },
  {
    id: 2,
    title: 'Servo Motor Mount Recommendations',
    type: 'Recommendation',
    drawingName: 'SG90 Servo Motor Mount',
    createdDate: '2024-01-19',
    status: 'Completed',
    fileSize: '1.8 MB',
    summary: 'Product recommendations for servo motor mounting solutions with compatibility analysis.',
    details: {
      compatibilityScore: 92,
      recommendations: [
        'Aluminum bracket offers best weight-to-strength ratio',
        'Consider integrated cable management features',
        'Standard mounting holes ensure universal compatibility'
      ]
    }
  },
  {
    id: 3,
    title: 'Mounting Bracket Validation',
    type: 'Validation',
    drawingName: 'L-Bracket 150x100mm',
    createdDate: '2024-01-18',
    status: 'Completed',
    fileSize: '1.2 MB',
    summary: 'Manufacturing validation report highlighting potential issues and optimization suggestions.',
    details: {
      manufacturability: 78,
      validationResults: 6,
      recommendations: [
        'Increase bend radius from 2mm to 5mm',
        'Wall thickness meets requirements',
        'Material selection is appropriate'
      ]
    }
  },
  {
    id: 4,
    title: 'Custom Bracket Analysis',
    type: 'Analysis',
    drawingName: 'Custom Mounting Bracket',
    createdDate: '2024-01-17',
    status: 'Processing',
    fileSize: 'Processing...',
    summary: 'Analysis in progress for custom fabricated mounting bracket design.',
    details: {}
  },
  {
    id: 5,
    title: 'Steel Plate Recommendations',
    type: 'Recommendation',
    drawingName: 'Steel Plate 300x200x15mm',
    createdDate: '2024-01-16',
    status: 'Failed',
    fileSize: 'N/A',
    summary: 'Report generation failed due to incomplete drawing specifications.',
    details: {}
  }
];

const ReportsManager: React.FC = () => {
  const [reports, setReports] = useState<Report[]>(sampleReports);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Analysis':
        return 'bg-blue-100 text-blue-800';
      case 'Recommendation':
        return 'bg-purple-100 text-purple-800';
      case 'Validation':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.drawingName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const downloadReport = (report: Report, format: 'pdf' | 'json' | 'csv') => {
    // Simulate download
    const blob = new Blob([`${report.title} - ${format.toUpperCase()} Report`], { 
      type: format === 'pdf' ? 'application/pdf' : 
           format === 'json' ? 'application/json' : 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.replace(/\s+/g, '_')}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const deleteReport = (id: number) => {
    setReports(prev => prev.filter(report => report.id !== id));
    setShowDeleteConfirm(null);
  };

  const regenerateReport = (id: number) => {
    setReports(prev => prev.map(report => 
      report.id === id 
        ? { ...report, status: 'Processing' as const, fileSize: 'Processing...' }
        : report
    ));
    
    // Simulate regeneration
    setTimeout(() => {
      setReports(prev => prev.map(report => 
        report.id === id 
          ? { ...report, status: 'Completed' as const, fileSize: '2.1 MB' }
          : report
      ));
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass-container glass-container-with-liquid-compact p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Search Reports"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by title or drawing name..."
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="glass-input"
            >
              <option value="all">All Types</option>
              <option value="Analysis">Analysis</option>
              <option value="Recommendation">Recommendation</option>
              <option value="Validation">Validation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Processing">Processing</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <div key={report.id} className="glass-card">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                      {report.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{report.drawingName}</p>
                  <p className="text-xs text-gray-500">Created: {report.createdDate}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{report.summary}</p>

              {/* Report Metrics */}
              {report.status === 'Completed' && (
                <div className="space-y-2 mb-4">
                  {report.details.manufacturability && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Manufacturability:</span>
                      <span className="font-medium">{report.details.manufacturability}%</span>
                    </div>
                  )}
                  {report.details.compatibilityScore && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Compatibility:</span>
                      <span className="font-medium">{report.details.compatibilityScore}%</span>
                    </div>
                  )}
                  {report.details.costEstimate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cost Estimate:</span>
                      <span className="font-medium">{report.details.costEstimate}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">File Size:</span>
                    <span className="font-medium">{report.fileSize}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                {report.status === 'Completed' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    <div className="relative group">
                      <Button size="sm" variant="outline">
                        Download
                      </Button>
                      <div className="absolute bottom-full left-0 mb-2 w-32 bg-white rounded-md shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => downloadReport(report, 'pdf')}
                            className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => downloadReport(report, 'json')}
                            className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            JSON
                          </button>
                          <button
                            onClick={() => downloadReport(report, 'csv')}
                            className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            CSV
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {report.status === 'Processing' && (
                  <div className="flex-1 flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-gray-600">Processing...</span>
                  </div>
                )}
                
                {report.status === 'Failed' && (
                  <Button
                    size="sm"
                    onClick={() => regenerateReport(report.id)}
                    className="flex-1"
                  >
                    Regenerate
                  </Button>
                )}
              </div>

              {/* Delete Button */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setShowDeleteConfirm(report.id)}
                  className="text-xs text-red-600 hover:text-red-800 transition-colors"
                >
                  Delete Report
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <div className="glass-container glass-container-with-liquid p-12 text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
              ? 'No reports match your current filters.' 
              : 'You haven\'t generated any reports yet.'}
          </p>
          <div className="flex justify-center space-x-3">
            <Button onClick={() => window.location.href = '/cad-analyzer'}>
              Analyze Drawing
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/product-recommender'}>
              Get Recommendations
            </Button>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={selectedReport.title}
        >
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedReport.type)}`}>
                {selectedReport.type} Report
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReport.status)}`}>
                {selectedReport.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Drawing:</span>
                <p className="text-gray-900">{selectedReport.drawingName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <p className="text-gray-900">{selectedReport.createdDate}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">File Size:</span>
                <p className="text-gray-900">{selectedReport.fileSize}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <p className="text-gray-900">{selectedReport.type}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
              <p className="text-gray-700">{selectedReport.summary}</p>
            </div>

            {selectedReport.details.recommendations && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Recommendations</h4>
                <ul className="space-y-2">
                  {selectedReport.details.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <span className="text-blue-600 mr-2 mt-0.5">•</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex space-x-3 pt-4 border-t">
              <Button onClick={() => downloadReport(selectedReport, 'pdf')} className="flex-1">
                Download PDF
              </Button>
              <Button onClick={() => downloadReport(selectedReport, 'json')} variant="outline" className="flex-1">
                Download JSON
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          title="Delete Report"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this report? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => deleteReport(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete Report
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ReportsManager;





















