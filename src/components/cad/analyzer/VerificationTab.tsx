'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { SpecificationResult } from '@/lib/cad-manufacturing-analysis';

/**
 * Props for the VerificationTab component
 */
export interface VerificationTabProps {
  /** Array of specification verification results */
  results: SpecificationResult[];
  /** Whether analysis is currently running */
  isAnalyzing: boolean;
  /** Callback to trigger analysis */
  onRunAnalysis: () => void;
}

/**
 * Displays specification verification results against industry standards.
 * Shows compliance status for AISC, AWS, and ASTM standards.
 */
export const VerificationTab: React.FC<VerificationTabProps> = memo(({
  results,
  isAnalyzing,
  onRunAnalysis,
}) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="bg-purple-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-900 mb-2">Specification Verification Not Run</p>
        <p className="text-sm text-gray-600 mb-4">
          Run the manufacturing analysis to verify specifications against<br />
          AISC 360, AWS D1.1, and ASTM standards.
        </p>
        <Button onClick={onRunAnalysis} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Analyzing...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Run Manufacturing Analysis
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Specification Verification</h3>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div 
            key={index}
            className={`glass-card p-4 border ${
              result.status === 'Valid' ? 'border-green-200' :
              result.status === 'Missing' ? 'border-yellow-200' :
              'border-red-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  result.verified ? 'bg-green-500' : 'bg-gray-400'
                }`}>
                  {result.verified ? (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <h4 className="font-medium text-gray-900">{result.specification}</h4>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                result.status === 'Valid' ? 'bg-green-100 text-green-800' :
                result.status === 'Missing' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {result.status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="font-medium text-gray-700">Current Value:</span>
                <p className="text-gray-900">{result.value}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Standard:</span>
                <p className="text-gray-900">{result.standard}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-700">{result.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

VerificationTab.displayName = 'VerificationTab';
