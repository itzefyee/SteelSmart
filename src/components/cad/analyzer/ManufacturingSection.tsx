'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/**
 * Props for the ManufacturingSection component
 */
export interface ManufacturingSectionProps {
  hasResults: boolean;
  isAnalyzing: boolean;
  analysisStage: string | null;
  analysisProgress: number;
  onRunAnalysis: () => void;
  onViewManufacturability: () => void;
  onViewSpecifications: () => void;
}

/**
 * Manufacturing analysis control panel with progress tracking.
 * Shows analysis stages, progress bar, and action buttons.
 */
export const ManufacturingSection: React.FC<ManufacturingSectionProps> = memo(({
  hasResults,
  isAnalyzing,
  analysisStage,
  analysisProgress,
  onRunAnalysis,
  onViewManufacturability,
  onViewSpecifications,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Manufacturing Analysis
          </h3>
          <p className="text-sm text-gray-600">
            {hasResults
              ? 'Analysis complete! View results in Manufacturability and Specifications tabs.'
              : 'Run detailed manufacturing analysis to check dimensions, holes, welds, and compliance.'}
          </p>
        </div>
        {hasResults && (
          <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800">Complete</span>
          </div>
        )}
      </div>

      {isAnalyzing ? (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{analysisStage}</span>
              <span className="text-gray-600">{analysisProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${analysisProgress}%` }}
              >
                <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Stage Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {[
              { name: 'Geometry', progress: 20 },
              { name: 'Holes', progress: 50 },
              { name: 'Thickness', progress: 60 },
              { name: 'Edges', progress: 70 },
              { name: 'Welds', progress: 80 },
              { name: 'Bends', progress: 90 },
              { name: 'Validate', progress: 100 }
            ].map((stage) => (
              <div
                key={stage.name}
                className={`flex items-center space-x-2 px-2 py-1 rounded ${
                  analysisProgress >= stage.progress
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {analysisProgress >= stage.progress ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-3 h-3 border-2 border-current rounded-full"></div>
                )}
                <span className="font-medium">{stage.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : hasResults ? (
        <div className="flex items-center space-x-3">
          <Button
            onClick={onRunAnalysis}
            variant="outline"
            size="sm"
          >
            Re-run Analysis
          </Button>
          <Button
            onClick={onViewManufacturability}
            size="sm"
          >
            View Manufacturability Results
          </Button>
          <Button
            onClick={onViewSpecifications}
            size="sm"
            variant="outline"
          >
            View Specifications
          </Button>
        </div>
      ) : (
        <div className="flex items-center space-x-3">
          <Button
            onClick={onRunAnalysis}
            size="lg"
            className="flex items-center space-x-2 min-w-[280px] justify-center whitespace-nowrap px-6"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Run Manufacturing Analysis</span>
          </Button>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Checks:</span> Dimensions, Holes, Edges, Welds, Bends, Compliance
          </div>
        </div>
      )}
    </div>
  );
});

ManufacturingSection.displayName = 'ManufacturingSection';
