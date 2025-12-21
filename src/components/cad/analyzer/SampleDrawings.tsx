'use client';

import React, { memo } from 'react';

/**
 * Represents a sample CAD template for demonstration
 */
export interface TemplateSample {
  id: number;
  name: string;
  description: string;
  preview: string;
  file: string;
}

/**
 * Props for the SampleDrawings component
 */
export interface SampleDrawingsProps {
  /** Array of sample templates to display */
  samples: TemplateSample[];
  /** Callback when a sample is selected */
  onLoadSample: (filePath: string, displayName: string) => void;
}

/**
 * Displays a list of sample CAD drawings that users can load for testing.
 * Each sample shows a preview image, name, and description.
 */
export const SampleDrawings: React.FC<SampleDrawingsProps> = memo(({
  samples,
  onLoadSample,
}) => {
  return (
    <div className="glass-container glass-container-with-liquid p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-2">Try Sample Drawings</h3>
      <p className="text-gray-600 text-xs mb-3">
        Test with real CAD Generator templates loaded as STEP files.
      </p>
      
      <div className="space-y-2">
        {samples.map((sample) => (
          <div
            key={sample.id}
            className="glass-card-compact hover:shadow-md transition-shadow cursor-pointer flex items-center gap-3"
            onClick={() => onLoadSample(sample.file, sample.name)}
          >
            <div className="flex-shrink-0 w-16 h-12 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-gray-50 to-slate-100">
              <img
                src={sample.preview}
                alt={sample.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-xs truncate">{sample.name}</h4>
              <p className="text-xs text-gray-500 truncate">{sample.description}</p>
            </div>
            <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">STEP</span>
          </div>
        ))}
      </div>
    </div>
  );
});

SampleDrawings.displayName = 'SampleDrawings';
