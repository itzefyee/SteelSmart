'use client';

import React from 'react';
import { DrawingAnalysis } from '@/types';

interface AnalysisResultsPanelProps {
  analysis: DrawingAnalysis;
}

const AnalysisResultsPanel: React.FC<AnalysisResultsPanelProps> = React.memo(({ analysis }) => {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">
            {Math.round(analysis.confidence * 100)}% confidence
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {Object.entries(analysis.extractedSpecs).map(([key, value]) => {
            // Skip if no value
            if (!value) return null;
            
            // Handle nested objects (like features)
            const displayValue = typeof value === 'object' && value !== null
              ? Object.entries(value)
                  .filter(([, v]) => v)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ')
              : String(value);
            
            return displayValue ? (
              <div key={key} className="bg-gray-50 p-3 rounded-lg">
                <span className="font-medium text-gray-700 capitalize block">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="text-gray-900">{displayValue}</span>
              </div>
            ) : null;
          })}
        </div>                        
        <div className="pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Analysis:</span> {analysis.reasoning}
          </p>
        </div>
      </div>
    </div>
  );
});

AnalysisResultsPanel.displayName = 'AnalysisResultsPanel';

export default AnalysisResultsPanel;
