'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { ManufacturabilityResult } from '@/lib/cad-manufacturing-analysis';

/**
 * Props for the ValidationTab component
 */
export interface ValidationTabProps {
  /** Array of manufacturability check results */
  results: ManufacturabilityResult[];
  /** Whether analysis is currently running */
  isAnalyzing: boolean;
  /** Callback to trigger analysis */
  onRunAnalysis: () => void;
}

/**
 * Displays manufacturability validation results with status indicators.
 * Shows empty state with CTA when no results are available.
 */
export const ValidationTab: React.FC<ValidationTabProps> = memo(({
  results,
  isAnalyzing,
  onRunAnalysis,
}) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="bg-blue-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-900 mb-2">Manufacturing Analysis Not Run</p>
        <p className="text-sm text-gray-600 mb-4">
          Run the manufacturing analysis to check dimensions, tolerances,<br />
          hole spacing, edge distances, and manufacturing feasibility.
        </p>
        <Button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="px-6 whitespace-nowrap min-w-[280px]"
        >
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
        <h3 className="text-lg font-semibold text-gray-900">Manufacturability Validation</h3>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div 
            key={index}
            className={`glass-card p-4 border-l-4 ${
              result.status === 'Valid' ? 'border-green-500' :
              result.status === 'Warning' ? 'border-yellow-500' :
              'border-red-500'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">{result.check}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                result.status === 'Valid' ? 'bg-green-100 text-green-800' :
                result.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {result.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Current Value:</span> {result.value} | 
              <span className="font-medium ml-2">Requirement:</span> {result.requirement}
            </div>
            <p className="text-sm text-gray-700 mb-2">{result.message}</p>
            {result.suggestion && (
              <div className="glass-card-compact bg-blue-50 border border-blue-200 mt-2">
                <div className="flex items-start">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Suggestion:</p>
                    <p className="text-sm text-blue-700">{result.suggestion}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

ValidationTab.displayName = 'ValidationTab';
