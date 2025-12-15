'use client';

import React from 'react';

interface SpecificationResult {
  specification: string;
  verified: boolean;
  value: string;
  standard: string;
  status: 'Valid' | 'Warning' | 'Invalid' | 'Missing';
  notes: string;
}

interface VerificationPanelProps {
  results: SpecificationResult[];
}

const VerificationPanel: React.FC<VerificationPanelProps> = React.memo(({ results }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Valid':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'Warning':
      case 'Missing':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'Invalid':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Valid':
        return 'bg-green-50 border-green-200';
      case 'Warning':
      case 'Missing':
        return 'bg-yellow-50 border-yellow-200';
      case 'Invalid':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Specification Data</h3>
        <p className="text-gray-600">Run manufacturing analysis to verify specifications</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border ${getStatusBg(result.status)}`}
        >
          <div className="flex items-start space-x-3">
            {getStatusIcon(result.status)}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{result.specification}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  result.status === 'Valid' ? 'bg-green-100 text-green-800' :
                  result.status === 'Warning' || result.status === 'Missing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {result.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{result.notes}</p>
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                <span><strong>Value:</strong> {result.value}</span>
                <span><strong>Standard:</strong> {result.standard}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

VerificationPanel.displayName = 'VerificationPanel';

export default VerificationPanel;
