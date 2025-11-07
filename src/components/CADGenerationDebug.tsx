'use client';

import React from 'react';

interface DebugStep {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp?: string;
  details?: string;
  error?: string;
  duration?: number;
}

interface CADGenerationDebugProps {
  steps: DebugStep[];
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}

const CADGenerationDebug: React.FC<CADGenerationDebugProps> = ({ 
  steps, 
  isVisible, 
  onToggle, 
  className = '' 
}) => {
  const getStatusIcon = (status: DebugStep['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
        );
      case 'in_progress':
        return (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      case 'completed':
        return (
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const getStatusColor = (status: DebugStep['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'in_progress': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isVisible) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-3 ${className}`}>
        <button
          onClick={onToggle}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Show Debug Info</span>
          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
            {steps.filter(s => s.status === 'completed').length}/{steps.length} steps
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">Generation Debug Info</h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              DEV MODE
            </span>
          </div>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(step.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className={`text-sm font-medium ${getStatusColor(step.status)}`}>
                    {step.title}
                  </h4>
                  {step.duration && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {formatDuration(step.duration)}
                    </span>
                  )}
                  {step.timestamp && (
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(step.timestamp)}
                    </span>
                  )}
                </div>
                
                {step.details && (
                  <p className="text-xs text-gray-600 mt-1 font-mono bg-gray-50 p-2 rounded">
                    {step.details}
                  </p>
                )}
                
                {step.error && (
                  <p className="text-xs text-red-600 mt-1 font-mono bg-red-50 p-2 rounded border border-red-200">
                    Error: {step.error}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {steps.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No debug information available</p>
            <p className="text-sm">Debug steps will appear here during generation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CADGenerationDebug;
