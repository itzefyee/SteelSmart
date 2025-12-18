'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { CADModelData } from '@/lib/cad-parser';
import { CADViewGenerator, GeneratedView } from '@/lib/cad-view-generator';

interface CAD2DViewExtractorProps {
  cadModelData: CADModelData | null;
  fileName?: string;
  initialOrthographicViews?: GeneratedView[];
  initialPerspectiveViews?: GeneratedView[];
  disabled?: boolean;
  loadingMessage?: string;
}

const CAD2DViewExtractor: React.FC<CAD2DViewExtractorProps> = ({
  cadModelData,
  fileName = 'model',
  initialOrthographicViews,
  initialPerspectiveViews,
  disabled = false,
  loadingMessage,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedViews, setGeneratedViews] = useState<GeneratedView[]>([]);
  const [perspectiveViews, setPerspectiveViews] = useState<GeneratedView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasShownViews, setHasShownViews] = useState(false);

  useEffect(() => {
    if (initialOrthographicViews && initialOrthographicViews.length > 0) {
      setGeneratedViews(initialOrthographicViews);
    }
  }, [initialOrthographicViews]);

  useEffect(() => {
    if (initialPerspectiveViews && initialPerspectiveViews.length > 0) {
      setPerspectiveViews(initialPerspectiveViews);
    }
  }, [initialPerspectiveViews]);

  useEffect(() => {
    setHasShownViews(false);
  }, [fileName]);

  const createViewGenerator = () =>
    new CADViewGenerator({
      width: 800,
      height: 600,
      backgroundColor: '#f5f5f5',
      showGrid: false,
      showAxes: false,
    });

  const generateAllViews = async () => {
    if (!cadModelData) {
      setError('No CAD model data available');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const viewGenerator = createViewGenerator();

    try {
      viewGenerator.loadModel(cadModelData);
      const orthoViews = viewGenerator.generateAllViews();
      const perspViews = viewGenerator.generatePerspectiveViews();

      setGeneratedViews(orthoViews);
      setPerspectiveViews(perspViews);
      setHasShownViews(true);
    } catch (err) {
      console.error('Error generating views:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate views');
    } finally {
      viewGenerator.dispose();
      setIsGenerating(false);
    }
  };

  const handleExtractViews = async () => {
    if (hasShownViews) {
      return;
    }

    const hasPrefetchedViews = generatedViews.length > 0 || perspectiveViews.length > 0;
    if (hasPrefetchedViews) {
      setHasShownViews(true);
      return;
    }

    await generateAllViews();
  };

  const handleRegenerateViews = async () => {
    await generateAllViews();
  };

  const handleDownloadView = (view: GeneratedView) => {
    const link = document.createElement('a');
    link.href = view.dataUrl;
    link.download = `${fileName}_${view.name}_view.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    const allViews = [...generatedViews, ...perspectiveViews];
    allViews.forEach((view) => {
      setTimeout(() => handleDownloadView(view), 100);
    });
  };

  const handleClearViews = () => {
    setGeneratedViews([]);
    setPerspectiveViews([]);
    setError(null);
    setHasShownViews(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border p-6 relative">
      {/* Loading Overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-sm font-medium text-gray-700">
              {loadingMessage || 'Loading 3D model...'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              View extraction will be available once the model loads
            </p>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          2D View Extraction
        </h3>
        <p className="text-sm text-gray-600">
          Capture orthographic and perspective snapshots from the loaded 3D preview to document every critical angle.
        </p>
      </div>

      {/* Generate Button */}
      {!hasShownViews && (
        <div className="mb-4 space-y-3">
          <Button
            onClick={handleExtractViews}
            disabled={isGenerating || disabled}
            isLoading={isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Preparing Views...' : 'Extract 2D + Perspective Views'}
          </Button>
          {!cadModelData && generatedViews.length === 0 && perspectiveViews.length === 0 && !disabled && (
            <p className="text-sm text-gray-500 mt-2">
              Upload a compatible 3D CAD file to unlock automated view extraction.
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Generated Views Display */}
      {hasShownViews && (generatedViews.length > 0 || perspectiveViews.length > 0) && (
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              onClick={handleRegenerateViews}
              variant="outline"
              size="sm"
              disabled={isGenerating || disabled}
              isLoading={isGenerating}
              className="w-full"
            >
              Regenerate Views
            </Button>
            <Button
              onClick={handleDownloadAll}
              variant="outline"
              size="sm"
              disabled={disabled}
              className="w-full"
            >
              Download Views
            </Button>
            <Button
              onClick={handleClearViews}
              variant="outline"
              size="sm"
              disabled={disabled}
              className="w-full"
            >
              Clear Views
            </Button>
          </div>

          {/* Views Grid */}
          {generatedViews.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedViews.map((view) => (
                <div
                  key={view.name}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900 capitalize text-sm">
                      {view.name} View
                    </h4>
                  </div>
                  <div className="p-2">
                    <img
                      src={view.dataUrl}
                      alt={`${view.name} view`}
                      className="w-full h-auto rounded"
                    />
                  </div>
                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                    <button
                      onClick={() => handleDownloadView(view)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Download PNG
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Perspective Views */}
          {perspectiveViews.length > 0 && (
            <div className="space-y-3">
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 mb-1">Perspective Snapshots</h4>
                <p className="text-sm text-gray-600">
                  Six additional oblique angles to visualize the 3D geometry without orbiting the preview.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {perspectiveViews.map((view) => (
                  <div
                    key={view.name}
                    className="border border-indigo-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="bg-indigo-50 px-3 py-2 border-b border-indigo-100">
                      <h4 className="font-medium text-indigo-900 capitalize text-sm">
                        {view.name.replace(/-/g, ' ')}
                      </h4>
                    </div>
                    <div className="p-2">
                      <img
                        src={view.dataUrl}
                        alt={`${view.name} view`}
                        className="w-full h-auto rounded"
                      />
                    </div>
                    <div className="px-3 py-2 bg-indigo-50 border-t border-indigo-100">
                      <button
                        onClick={() => handleDownloadView(view)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Download PNG
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default CAD2DViewExtractor;
