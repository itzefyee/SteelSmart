'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface KeyFinding {
  title: string;
  status: 'Valid' | 'Warning' | 'Invalid';
  message: string;
  detail?: string;
  suggestion?: string;
}

interface ReportSummary {
  totalChecks: number;
  invalid: number;
  warnings: number;
  passes: number;
  statusLabel: string;
  statusDescription: string;
  tone: {
    badge: string;
    accent: string;
    chip: string;
  };
}

interface TechnicalSnapshot {
  label: string;
  value: string;
  helper?: string;
}

interface StandardBadge {
  label: string;
  description: string;
}

interface ReportPanelProps {
  reportSummary: ReportSummary;
  technicalSnapshot: TechnicalSnapshot[];
  standardBadges: StandardBadge[];
  keyFindings: KeyFinding[];
  recommendationList: string[];
  reportGenerated: boolean;
  reportTimestamp: string | null;
  isGeneratingReport: boolean;
  onGenerateReport: () => void;
  onDownloadReport: (format: 'pdf' | 'txt') => void;
}

const ReportPanel: React.FC<ReportPanelProps> = React.memo(({
  reportSummary,
  technicalSnapshot,
  standardBadges,
  keyFindings,
  recommendationList,
  reportGenerated,
  reportTimestamp,
  isGeneratingReport,
  onGenerateReport,
  onDownloadReport,
}) => {
  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Analysis Report</h3>
          {reportTimestamp && (
            <p className="text-sm text-gray-500">Generated: {reportTimestamp}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {!reportGenerated ? (
            <Button
              onClick={onGenerateReport}
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? <LoadingSpinner size="sm" /> : 'Generate Report'}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onDownloadReport('txt')}
              >
                Download TXT
              </Button>
              <Button
                onClick={() => onDownloadReport('pdf')}
              >
                Download PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className={`p-6 rounded-xl border ${reportSummary.tone.badge}`}>
        <div className="flex items-start justify-between">
          <div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${reportSummary.tone.chip}`}>
              {reportSummary.statusLabel}
            </span>
            <p className="mt-2 text-sm text-gray-600">{reportSummary.statusDescription}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{reportSummary.totalChecks}</div>
            <div className="text-sm text-gray-500">Total Checks</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{reportSummary.passes}</div>
            <div className="text-xs text-gray-500">Passed</div>
          </div>
          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{reportSummary.warnings}</div>
            <div className="text-xs text-gray-500">Warnings</div>
          </div>
          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{reportSummary.invalid}</div>
            <div className="text-xs text-gray-500">Issues</div>
          </div>
        </div>
      </div>

      {/* Technical Snapshot */}
      {technicalSnapshot.length > 0 && (
        <div className="glass-card p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Technical Snapshot</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {technicalSnapshot.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</div>
                <div className="font-medium text-gray-900 mt-1">{item.value}</div>
                {item.helper && (
                  <div className="text-xs text-gray-400 mt-1">{item.helper}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standards Referenced */}
      <div className="glass-card p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Standards Referenced</h4>
        <div className="flex flex-wrap gap-2">
          {standardBadges.map((badge, index) => (
            <div
              key={index}
              className="inline-flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <span className="font-medium text-blue-800">{badge.label}</span>
              <span className="ml-2 text-xs text-blue-600">{badge.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Findings */}
      <div className="glass-card p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Key Findings</h4>
        <div className="space-y-3">
          {keyFindings.map((finding, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                finding.status === 'Valid' ? 'bg-green-50 border-green-200' :
                finding.status === 'Warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <h5 className="font-medium text-gray-900">{finding.title}</h5>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  finding.status === 'Valid' ? 'bg-green-100 text-green-800' :
                  finding.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {finding.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{finding.message}</p>
              {finding.detail && (
                <p className="text-xs text-gray-500 mt-2">{finding.detail}</p>
              )}
              {finding.suggestion && (
                <p className="text-xs text-blue-600 mt-2">
                  <strong>Suggestion:</strong> {finding.suggestion}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="glass-card p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Recommendations</h4>
        <ul className="space-y-2">
          {recommendationList.map((recommendation, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </span>
              <span className="text-sm text-gray-700">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});

ReportPanel.displayName = 'ReportPanel';

export default ReportPanel;
