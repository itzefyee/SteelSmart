'use client';

import React from 'react';

interface ManufacturabilityResult {
  check: string;
  value: string;
  requirement: string;
  status: 'Valid' | 'Warning' | 'Invalid';
  message: string;
  suggestion?: string;
}

interface ValidationPanelProps {
  results: ManufacturabilityResult[];
  isAnalyzing: boolean;
  analysisStage: string | null;
  analysisProgress: number;
  onRunAnalysis: () => void;
  hasCADModelData: boolean;
}

const ValidationPanel: React.FC<ValidationPanelProps> = React.memo(({
  results,
  isAnalyzing,
  analysisStage,
  analysisProgress,
  onRunAnalysis,
  hasCADModelData,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Valid':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'Warning':
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
        return 'bg-yellow-50 border-yellow-200';
      case 'Invalid':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Run Analysis Button */}
      {hasCADModelData && results.length === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Manufacturing Analysis
              </h3>
              <p className="text-sm text-gray-600">
                Run detailed manufacturing analysis to check dimensions, holes, welds, and compliance.
              </p>
            </div>
          </div>
          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Run Manufacturing Analysis'}
          </button>
        </div>
      )}

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-800 font-medium">{analysisStage || 'Analyzing...'}</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
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
                    <h4 className="font-medium text-gray-900">{result.check}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.status === 'Valid' ? 'bg-green-100 text-green-800' :
                      result.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span><strong>Value:</strong> {result.value}</span>
                    <span><strong>Requirement:</strong> {result.requirement}</span>
                  </div>
                  {result.suggestion && (
                    <div className="mt-2 p-2 bg-white/50 rounded border border-gray-200">
                      <p className="text-xs text-gray-700">
                        <strong>Suggestion:</strong> {result.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!hasCADModelData && results.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No CAD Model Data</h3>
          <p className="text-gray-600">Upload a STEP file to run manufacturing analysis</p>
        </div>
      )}
    </div>
  );
});

ValidationPanel.displayName = 'ValidationPanel';

export default ValidationPanel;
