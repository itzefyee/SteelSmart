'use client';

import React from 'react';

interface GenerationProgressProps {
  isPending: boolean;
  generationProgress: string;
  errorMessage: string;
}

const GenerationProgress: React.FC<GenerationProgressProps> = React.memo(({
  isPending,
  generationProgress,
  errorMessage,
}) => {
  return (
    <>
      {/* Loading State */}
      {isPending && (
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 shadow">
            <div className="w-3 h-3 animate-spin rounded-full border border-white border-t-transparent"></div>
          </div>
          <div className="flex-1">
            <div className="glass-card rounded-2xl rounded-tl-md p-4">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-gray-600 text-sm">
                  {generationProgress || 'Generating your CAD drawing...'}
                </span>
              </div>
              {generationProgress && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-600 h-1 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2 ml-4">SteelBot • Powered by Zoo Dev</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="glass-card rounded-2xl rounded-tl-md p-4 border-red-200">
              <p className="text-red-800 text-sm">{errorMessage}</p>
              <p className="text-red-600 text-xs mt-2">Don't worry - we've loaded a sample drawing for you to explore the interface.</p>
            </div>
            <p className="text-xs text-gray-500 mt-2 ml-4">SteelBot</p>
          </div>
        </div>
      )}
    </>
  );
});

GenerationProgress.displayName = 'GenerationProgress';

export default GenerationProgress;
