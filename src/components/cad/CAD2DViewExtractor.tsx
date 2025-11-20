'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { CADModelData } from '@/lib/cad-parser';
import { CADViewGenerator, GeneratedView } from '@/lib/cad-view-generator';

interface CAD2DViewExtractorProps {
  cadModelData: CADModelData | null;
  fileName?: string;
  onAnalysisComplete?: (analysisResult: any) => void;
}

const CAD2DViewExtractor: React.FC<CAD2DViewExtractorProps> = ({
  cadModelData,
  fileName = 'model',
  onAnalysisComplete,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedViews, setGeneratedViews] = useState<GeneratedView[]>([]);
  const [perspectiveViews, setPerspectiveViews] = useState<GeneratedView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isGeneratingPerspective, setIsGeneratingPerspective] = useState(false);

  const createViewGenerator = () =>
    new CADViewGenerator({
      width: 800,
      height: 600,
      backgroundColor: '#f5f5f5',
      showGrid: false,
      showAxes: false,
    });

  const handleGenerateViews = async () => {
    if (!cadModelData) {
      setError('No CAD model data available');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const viewGenerator = createViewGenerator();
      // Load model
      viewGenerator.loadModel(cadModelData);

      // Generate all 6 views
      const views = viewGenerator.generateAllViews();

      setGeneratedViews(views);

      // Cleanup
      viewGenerator.dispose();
    } catch (err) {
      console.error('Error generating views:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate views');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePerspectiveViews = async () => {
    if (!cadModelData) {
      setError('No CAD model data available');
      return;
    }

    setIsGeneratingPerspective(true);
    setError(null);

    try {
      const viewGenerator = createViewGenerator();
      viewGenerator.loadModel(cadModelData);
      const views = viewGenerator.generatePerspectiveViews();
      setPerspectiveViews(views);
      viewGenerator.dispose();
    } catch (err) {
      console.error('Error generating perspective views:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate perspective views');
    } finally {
      setIsGeneratingPerspective(false);
    }
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
    setAnalysisResult(null);
  };

  const handleAnalyzeWithAI = async () => {
    const allViews = [...generatedViews, ...perspectiveViews];

    if (allViews.length === 0) {
      setError('Please generate views first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Create FormData with all views
      const formData = new FormData();
      
      allViews.forEach((view) => {
        formData.append(`view_${view.name}`, view.blob, `${view.name}.png`);
      });

      // Send to multi-view analysis API
      const response = await fetch('/api/analyze-multiview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setAnalysisResult(result.data);
        
        // Notify parent component
        if (onAnalysisComplete) {
          onAnalysisComplete(result.data);
        }
      } else {
        throw new Error(result.error || 'Analysis failed');
      }

    } catch (err) {
      console.error('Error analyzing views:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze views with AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          2D View Extraction
        </h3>
        <p className="text-sm text-gray-600">
          Extract 2D orthographic views (top, bottom, front, back, left, right) from your 3D CAD model.
        </p>
      </div>

      {/* Generate Button */}
      {generatedViews.length === 0 && perspectiveViews.length === 0 && (
                <div className="mb-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGenerateViews}
              disabled={!cadModelData || isGenerating}
              isLoading={isGenerating}
              className="flex-1 sm:flex-none"
            >
              {isGenerating ? 'Generating Views...' : 'Extract 2D Views'}
            </Button>
            <Button
              onClick={handleGeneratePerspectiveViews}
              disabled={!cadModelData || isGeneratingPerspective}
              isLoading={isGeneratingPerspective}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              {isGeneratingPerspective ? 'Rendering Angles...' : 'Generate Perspective Views'}
            </Button>
          </div>
          {!cadModelData && (
            <p className="text-sm text-gray-500 mt-2">
              Upload a 3D CAD file (STEP, STL, OBJ) to enable view extraction
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
      {(generatedViews.length > 0 || perspectiveViews.length > 0) && (
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleAnalyzeWithAI}
              disabled={isAnalyzing}
              isLoading={isAnalyzing}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isAnalyzing ? 'Analyzing with AI...' : '🤖 Analyze with Gemini AI'}
            </Button>
            <Button
              onClick={handleDownloadAll}
              variant="outline"
              size="sm"
            >
              Download All Views
            </Button>
            <Button
              onClick={handleGenerateViews}
              variant="outline"
              size="sm"
            >
              Regenerate Views
            </Button>
            <Button
              onClick={handleGeneratePerspectiveViews}
              variant="outline"
              size="sm"
              disabled={!cadModelData || isGeneratingPerspective}
              isLoading={isGeneratingPerspective}
            >
              {perspectiveViews.length > 0 ? 'Regenerate Perspective Views' : 'Generate Perspective Views'}
            </Button>
            <Button
              onClick={handleClearViews}
              variant="outline"
              size="sm"
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

          {/* AI Analysis Results */}
          {analysisResult && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-green-900 mb-1">
                    AI Multi-View Analysis Complete
                  </h4>
                  <p className="text-sm text-green-700">
                    Analyzed {analysisResult.viewCount || (generatedViews.length + perspectiveViews.length)} multi-angle views with Gemini AI
                    {' • '}
                    Confidence: {Math.round((analysisResult.confidence || 0) * 100)}%
                  </p>
                </div>
              </div>

              {/* Extracted Specifications */}
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h5 className="font-semibold text-gray-900 mb-3">Extracted Specifications</h5>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {analysisResult.extractedSpecs?.dimensions && (
                      <div>
                        <dt className="font-medium text-gray-700">Dimensions</dt>
                        <dd className="text-gray-900 mt-1">{analysisResult.extractedSpecs.dimensions}</dd>
                      </div>
                    )}
                    {analysisResult.extractedSpecs?.material && (
                      <div>
                        <dt className="font-medium text-gray-700">Material</dt>
                        <dd className="text-gray-900 mt-1">{analysisResult.extractedSpecs.material}</dd>
                      </div>
                    )}
                    {analysisResult.extractedSpecs?.componentType && (
                      <div>
                        <dt className="font-medium text-gray-700">Component Type</dt>
                        <dd className="text-gray-900 mt-1">{analysisResult.extractedSpecs.componentType}</dd>
                      </div>
                    )}
                    {analysisResult.extractedSpecs?.tolerance && (
                      <div>
                        <dt className="font-medium text-gray-700">Tolerance</dt>
                        <dd className="text-gray-900 mt-1">{analysisResult.extractedSpecs.tolerance}</dd>
                      </div>
                    )}
                    {analysisResult.extractedSpecs?.features && (
                      <div>
                        <dt className="font-medium text-gray-700">Features</dt>
                        <dd className="text-gray-900 mt-1">
                          {typeof analysisResult.extractedSpecs.features === 'string' 
                            ? analysisResult.extractedSpecs.features
                            : (
                              <div className="space-y-1">
                                {analysisResult.extractedSpecs.features.holes && (
                                  <div>Holes: {analysisResult.extractedSpecs.features.holes}</div>
                                )}
                                {analysisResult.extractedSpecs.features.cutouts && (
                                  <div>Cutouts: {analysisResult.extractedSpecs.features.cutouts}</div>
                                )}
                                {analysisResult.extractedSpecs.features.mountingPoints && (
                                  <div>Mounting: {analysisResult.extractedSpecs.features.mountingPoints}</div>
                                )}
                              </div>
                            )
                          }
                        </dd>
                      </div>
                    )}
                    {analysisResult.extractedSpecs?.loadRequirements && (
                      <div>
                        <dt className="font-medium text-gray-700">Load Requirements</dt>
                        <dd className="text-gray-900 mt-1">{analysisResult.extractedSpecs.loadRequirements}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* AI Reasoning */}
                {analysisResult.reasoning && (
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h5 className="font-semibold text-gray-900 mb-2">AI Analysis</h5>
                    <p className="text-sm text-gray-700">{analysisResult.reasoning}</p>
                  </div>
                )}

                {/* View-Specific Analysis */}
                {analysisResult.viewAnalysis && (
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h5 className="font-semibold text-gray-900 mb-3">View-Specific Insights</h5>
                    <div className="space-y-2 text-sm">
                      {analysisResult.viewAnalysis.topView && (
                        <div>
                          <span className="font-medium text-gray-700">Top View:</span>
                          <span className="text-gray-600 ml-2">{analysisResult.viewAnalysis.topView}</span>
                        </div>
                      )}
                      {analysisResult.viewAnalysis.frontView && (
                        <div>
                          <span className="font-medium text-gray-700">Front View:</span>
                          <span className="text-gray-600 ml-2">{analysisResult.viewAnalysis.frontView}</span>
                        </div>
                      )}
                      {analysisResult.viewAnalysis.sideView && (
                        <div>
                          <span className="font-medium text-gray-700">Side Views:</span>
                          <span className="text-gray-600 ml-2">{analysisResult.viewAnalysis.sideView}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Manufacturing Notes */}
                {analysisResult.manufacturingNotes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h5 className="font-semibold text-amber-900 mb-2">Manufacturing Considerations</h5>
                    <p className="text-sm text-amber-800">{analysisResult.manufacturingNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Generated {generatedViews.length} orthographic and {perspectiveViews.length} perspective views
                </h4>
                <p className="text-sm text-blue-700">
                  These captures can be used for manufacturing drawings, documentation, or AI analysis.
                  Click "Analyze with Gemini AI" to send every available view—orthographic plus the new perspective angles.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CAD2DViewExtractor;
