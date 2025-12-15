'use client';

import React, { Suspense, lazy } from 'react';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const CADPreview3D = lazy(() => import('@/components/cad/CADPreview3D'));

interface GeneratedDrawing {
  id: number;
  name: string;
  description: string;
  preview: string;
  dxf: string;
  parameters?: Record<string, any>;
}

interface GeneratedDrawingDisplayProps {
  generatedDrawing: GeneratedDrawing;
  cadFileForPreview: File | null;
  onEditDrawing: () => void;
  onDownload: (format: 'step' | 'stl' | 'obj' | 'dxf' | 'pdf' | 'gltf' | 'glb') => void;
  onAnalyze: () => void;
}

const GeneratedDrawingDisplay: React.FC<GeneratedDrawingDisplayProps> = React.memo(({
  generatedDrawing,
  cadFileForPreview,
  onEditDrawing,
  onDownload,
  onAnalyze,
}) => {
  return (
    <div className="glass-container p-6" data-generated-drawing>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generated Drawing</h2>
          <p className="text-gray-600">{generatedDrawing.description}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={onAnalyze}
            className="flex items-center justify-center space-x-2 h-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Analyze Drawing</span>
          </Button>
          <Button variant="outline" onClick={onEditDrawing} className="h-auto">
            Edit Drawing
          </Button>
          <div className="flex space-x-2">
            <div className="relative group/download">
              <Button className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
              
              {/* Dropdown Menu */}
              <div className="absolute top-full right-0 mt-2 w-48 opacity-0 invisible pointer-events-none group-hover/download:pointer-events-auto group-hover/download:opacity-100 group-hover/download:visible transition-all duration-200 z-30">
                <div className="glass-card py-1">
                  <button
                    onClick={() => onDownload('step')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Download STEP (.step)
                  </button>
                  <button
                    disabled
                    className="block w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                  >
                    Other formats – coming soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3D Model Preview */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">3D Model Preview</h3>
          <div className="glass-card p-4">
            {cadFileForPreview ? (
              <Suspense fallback={<div className="w-full h-96 flex items-center justify-center"><LoadingSpinner /></div>}>
                <CADPreview3D
                  key={`cad-preview-${generatedDrawing?.id}-${Date.now()}`}
                  file={cadFileForPreview}
                  showStats={true}
                />
              </Suspense>
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                <div className="text-center p-4">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-600">Model preview unavailable</p>
                  <p className="text-xs text-gray-500 mt-2">Download the file to view in CAD software</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Parameters */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Drawing Parameters</h3>
          <div className="glass-card p-4">
            <div className="space-y-3 mb-6">
              {generatedDrawing.parameters ? (
                Object.entries(generatedDrawing.parameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-200/50">
                    <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-medium text-gray-900">{String(value)}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic">No parameters available</div>
              )}
            </div>

            {/* Compatibility Info */}
            {generatedDrawing.dxf && (generatedDrawing.dxf.includes('base64') || generatedDrawing.dxf.length > 50) && (
              <div className="mt-6 pt-6 border-t border-gray-200/50">
                <div className="text-xs text-gray-500">
                  <p className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Compatible with AutoCAD, SolidWorks, FreeCAD, Fusion 360
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

GeneratedDrawingDisplay.displayName = 'GeneratedDrawingDisplay';

export default GeneratedDrawingDisplay;
