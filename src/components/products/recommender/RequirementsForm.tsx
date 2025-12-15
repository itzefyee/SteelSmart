'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { StagedProgress, StagedProgressItem } from '@/components/ui/StagedProgress';

interface Requirements {
  material: string;
  dimensions: string;
  loadCapacity: string;
  category: string;
}

interface RequirementsFormProps {
  requirements: Requirements;
  onRequirementsChange: (requirements: Requirements) => void;
  onFindRecommendations: () => void;
  isLoading: boolean;
  loadingStages: StagedProgressItem[];
  stageProgressActive: boolean;
  analysisData?: any;
}

const RequirementsForm: React.FC<RequirementsFormProps> = React.memo(({
  requirements,
  onRequirementsChange,
  onFindRecommendations,
  isLoading,
  loadingStages,
  stageProgressActive,
  analysisData,
}) => {
  return (
    <>
      {/* Analysis Information Banner */}
      {analysisData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">AI-Powered Recommendations</h3>
                <p className="text-sm text-blue-700">
                  Based on your CAD analysis with {Math.round(analysisData.confidence * 100)}% confidence
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Form */}
      <div className="glass-container glass-container-with-liquid-compact p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Requirements</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
            <input
              type="text"
              value={requirements.material}
              onChange={(e) => onRequirementsChange({ ...requirements, material: e.target.value })}
              placeholder="e.g., Steel, Aluminum, Stainless Steel"
              className="glass-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={requirements.category}
              onChange={(e) => onRequirementsChange({ ...requirements, category: e.target.value })}
              className="glass-input"
            >
              <option value="all">All Categories</option>
              <option value="structural">Structural</option>
              <option value="fasteners">Fasteners</option>
              <option value="robotic">Robotic</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions</label>
            <input
              type="text"
              value={requirements.dimensions}
              onChange={(e) => onRequirementsChange({ ...requirements, dimensions: e.target.value })}
              placeholder="e.g., 200mm x 100mm x 10mm"
              className="glass-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Load Capacity</label>
            <input
              type="text"
              value={requirements.loadCapacity}
              onChange={(e) => onRequirementsChange({ ...requirements, loadCapacity: e.target.value })}
              placeholder="e.g., 500kg, 10kN"
              className="glass-input"
            />
          </div>
        </div>
        
        <div className="inline-flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 w-fit">
          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 18.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z" />
          </svg>
          <p>Add a quick material, dimension, or load hint to help us surface direct matches faster.</p>
        </div>
        
        <div className="flex flex-col items-center space-y-3 mt-2">
          <Button 
            onClick={onFindRecommendations}
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Find Recommendations'}
          </Button>
        </div>

        {stageProgressActive && (
          <div className="mt-6">
            <StagedProgress
              title="Recommender Process"
              subtitle="We'll show progress only while steps are running."
              stages={loadingStages}
              compact
            />
          </div>
        )}
      </div>
    </>
  );
});

RequirementsForm.displayName = 'RequirementsForm';

export default RequirementsForm;
