'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/ProductCard';
import { DrawingAnalysis, FileUploadState, APIResponse } from '@/types';
import { formatFileSize } from '@/lib/utils';

const CADAnalyzerFull: React.FC = () => {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    progress: 0,
    status: 'idle',
    error: undefined
  });
  
  const [analysis, setAnalysis] = useState<DrawingAnalysis | null>(null);
  const [sampleLoadSuccess, setSampleLoadSuccess] = useState<string | null>(null);

  // Check for stored analysis results on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showResults') === 'true') {
      const storedResult = sessionStorage.getItem('cadAnalysisResult');
      if (storedResult) {
        try {
          const analysisData = JSON.parse(storedResult);
          setAnalysis(analysisData);
          // Clear the stored result
          sessionStorage.removeItem('cadAnalysisResult');
          // Clean up URL
          window.history.replaceState({}, '', '/cad-analyzer');
          // Show success message
          setSampleLoadSuccess('Analysis results loaded successfully!');
        } catch (error) {
          console.error('Error parsing stored analysis result:', error);
        }
      }
    }
  }, []);


  const maxSizeInMB = 10;

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      let errorMessage = 'File rejected';
      
      if (rejection.errors?.find((e) => e.code === 'file-too-large')) {
        errorMessage = `File size exceeds ${maxSizeInMB}MB limit`;
      } else if (rejection.errors?.find((e) => e.code === 'file-invalid-type')) {
        errorMessage = 'Invalid file type. Please upload PDF, PNG, or JPG files';
      }
      
      setUploadState({
        file: null,
        progress: 0,
        status: 'error',
        error: errorMessage
      });
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadState({
        file,
        progress: 0,
        status: 'idle',
        error: undefined
      });
      
      // Clear previous analysis results and success messages
      setAnalysis(null);
      setSampleLoadSuccess(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    maxSize: maxSizeInMB * 1024 * 1024,
    multiple: false
  });

  const analyzeDrawing = async () => {
    if (!uploadState.file) return;

    setUploadState(prev => ({ ...prev, status: 'uploading', progress: 0 }));

    try {
      const formData = new FormData();
      formData.append('file', uploadState.file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const response = await fetch('/api/analyze-drawing', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      const result: APIResponse<DrawingAnalysis> = await response.json();

      if (result.success && result.data) {
        setUploadState(prev => ({ ...prev, status: 'success', progress: 100 }));
        setAnalysis(result.data);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Analysis failed'
      }));
    }
  };

  const resetAnalysis = () => {
    setUploadState({
      file: null,
      progress: 0,
      status: 'idle',
      error: undefined
    });
    setAnalysis(null);
    setSampleLoadSuccess(null);
  };

  const tryWithSample = (filename: string, displayName: string) => {
    // Clear previous analysis results when loading a new sample
    setAnalysis(null);
    
    // Simulate loading a sample drawing
    setUploadState({
      file: new File(['sample'], filename, { type: 'application/pdf' }),
      progress: 0,
      status: 'idle',
      error: undefined
    });
    
    // Show success indicator
    setSampleLoadSuccess(displayName);
    setTimeout(() => setSampleLoadSuccess(null), 3000); // Hide after 3 seconds
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Upload and Controls */}
      <div className="space-y-6">
        {/* File Upload Area */}
        <div className="bg-white rounded-xl shadow-lg border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Drawing</h2>
          
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragActive 
                ? 'border-primary bg-blue-50' 
                : uploadState.status === 'error'
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              {uploadState.file ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-primary rounded-lg mx-auto flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{uploadState.file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(uploadState.file.size)}</p>
                  </div>
                  
                  {uploadState.status === 'uploading' && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadState.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">Analyzing... {uploadState.progress}%</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {isDragActive ? 'Drop your file here' : 'Drop your CAD file here'}
                    </p>
                    <p className="text-gray-500">or click to browse</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Supports PDF, PNG, JPG up to {maxSizeInMB}MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {uploadState.status === 'error' && uploadState.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{uploadState.error}</p>
            </div>
          )}

          {/* Sample Load Success */}
          {sampleLoadSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-700 text-sm font-medium">
                  Sample &quot;{sampleLoadSuccess}&quot; loaded successfully!
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={analyzeDrawing}
              disabled={!uploadState.file || uploadState.status === 'uploading'}
              isLoading={uploadState.status === 'uploading'}
              className="flex-1"
            >
              {uploadState.status === 'uploading' ? 'Analyzing...' : 'Analyze Drawing'}
            </Button>
            
            {uploadState.file && (
              <Button
                variant="outline"
                onClick={resetAnalysis}
                disabled={uploadState.status === 'uploading'}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Sample Drawings */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Try Sample Drawings</h3>
          <p className="text-gray-600 text-sm mb-4">
            Test the analyzer with our sample technical drawings to see AI recommendations.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Servo Motor Sample */}
            <div className="bg-white rounded-lg p-3 border border-blue-200 text-center hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full" 
                 onClick={() => tryWithSample('servo-motor-drawing.pdf', 'Servo Motor')}>
              <div className="mb-2">
                <img 
                  src="/images/sample-cad-preview.svg" 
                  alt="Servo Motor Drawing"
                  className="w-20 h-16 mx-auto rounded border border-gray-200"
                />
              </div>
              <div className="mb-2 flex-1 flex flex-col justify-center text-center">
                <h4 className="font-medium text-gray-900 mb-1">Servo Motor Drawing</h4>
                <p className="text-sm text-gray-600">50Nm torque, aluminum housing</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="w-full mt-auto"
                onClick={() => tryWithSample('servo-motor-drawing.pdf', 'Servo Motor')}
              >
                Load Sample
              </Button>
            </div>

            {/* Bracket Sample */}
            <div className="bg-white rounded-lg p-3 border border-blue-200 text-center hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
                 onClick={() => tryWithSample('bracket-drawing.pdf', 'Mounting Bracket')}>
              <div className="mb-2">
                <img 
                  src="/images/bracket-cad-preview.svg" 
                  alt="Bracket Drawing"
                  className="w-20 h-16 mx-auto rounded border border-gray-200"
                />
              </div>
              <div className="mb-2 flex-1 flex flex-col justify-center text-center">
                <h4 className="font-medium text-gray-900 mb-1">Mounting Bracket</h4>
                <p className="text-sm text-gray-600">Steel, 500N load capacity</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="w-full mt-auto"
                onClick={() => tryWithSample('bracket-drawing.pdf', 'Mounting Bracket')}
              >
                Load Sample
              </Button>
            </div>

            {/* Steel Beam Sample */}
            <div className="bg-white rounded-lg p-3 border border-blue-200 text-center hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
                 onClick={() => tryWithSample('steel-beam-drawing.pdf', 'I-Beam Steel')}>
              <div className="mb-2">
                <img 
                  src="/images/steel-beam-cad-preview.svg" 
                  alt="Steel Beam Drawing"
                  className="w-20 h-16 mx-auto rounded border border-gray-200"
                />
              </div>
              <div className="mb-2 flex-1 flex flex-col justify-center text-center">
                <h4 className="font-medium text-gray-900 mb-1">I-Beam Steel</h4>
                <p className="text-sm text-gray-600">200x100mm structural beam</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="w-full mt-auto"
                onClick={() => tryWithSample('steel-beam-drawing.pdf', 'I-Beam Steel')}
              >
                Load Sample
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Analysis Results */}
      <div className="space-y-6">
        {analysis ? (
          <>
            {/* Analysis Summary */}
            <div className="bg-white rounded-xl shadow-lg border p-6">
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
                  {Object.entries(analysis.extractedSpecs).map(([key, value]) => (
                    value && (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium text-gray-700 capitalize block">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="text-gray-900">{value}</span>
                      </div>
                    )
                  ))}
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Analysis:</span> {analysis.reasoning}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommended Products */}
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recommended Products ({analysis.totalRecommendations})
                </h3>
                {analysis.totalRecommendations > 3 && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    +{Math.max(0, analysis.totalRecommendations - 3)} more available
                  </span>
                )}
              </div>
              
              {analysis.recommendedProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {analysis.recommendedProducts.slice(0, 3).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No specific product matches found.</p>
                  <p className="text-sm mt-1">Try browsing our catalog or submit an RFQ for custom parts.</p>
                </div>
              )}

              {/* View All Products Button */}
              {analysis.recommendedProducts.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <Button 
                    onClick={() => window.open('/catalog', '_blank')} 
                    variant="outline" 
                    className="w-full"
                  >
                    Browse All Products
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Analysis</h3>
            <p className="text-gray-600">
              Upload a technical drawing or try one of our sample drawings to get started with AI-powered product recommendations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CADAnalyzerFull;