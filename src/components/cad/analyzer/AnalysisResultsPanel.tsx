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
        {/* Product Name - Featured */}
        {analysis.extractedSpecs.productName && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
            <div className="flex items-center space-x-2 mb-1">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="font-semibold text-blue-900 text-sm">Product Name</span>
            </div>
            <span className="text-lg font-bold text-blue-900 block">{analysis.extractedSpecs.productName}</span>
            <p className="text-xs text-blue-700 mt-1">AI-identified product for precise search results</p>
          </div>
        )}
        
        {/* Other Specifications */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {Object.entries(analysis.extractedSpecs).map(([key, value]) => {
            // Skip productName (already shown above) and empty values
            if (key === 'productName' || !value) return null;
            
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
