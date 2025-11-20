'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import Button from '@/components/ui/Button';
import { FileUploadState, APIResponse, DrawingAnalysis } from '@/types';
import { formatFileSize } from '@/lib/utils';

const CADAnalyzer: React.FC = () => {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    progress: 0,
    status: 'idle',
    error: undefined
  });
  
  const [sampleLoadSuccess, setSampleLoadSuccess] = useState<string | null>(null);


  const maxSizeInMB = 10;

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      let errorMessage = 'File rejected';
      
      if (rejection.errors?.find((e) => e.code === 'file-too-large')) {
        errorMessage = `File size exceeds ${maxSizeInMB}MB limit`;
      } else       if (rejection.errors?.find((e) => e.code === 'file-invalid-type')) {
        errorMessage = 'Invalid file type. Please upload PDF, PNG, JPG, STEP, STL, OBJ, DXF, glTF, or GLB files';
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
      
      // Clear any previous success messages
      setSampleLoadSuccess(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/step': ['.step', '.stp'],
      'application/sla': ['.stl'],
      'model/obj': ['.obj'],
      'application/dxf': ['.dxf'],
      'model/gltf+json': ['.gltf'],
      'model/gltf-binary': ['.glb']
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
        
        // Store analysis data in sessionStorage for the full page
        sessionStorage.setItem('cadAnalysisResult', JSON.stringify(result.data));
        
        // Show success message
        setSampleLoadSuccess('Analysis Complete! Redirecting...');
        
        // Redirect to full CAD analyzer page after a brief delay to show success
        setTimeout(() => {
          window.location.href = '/cad-analyzer?showResults=true';
        }, 1500);
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
  };

  const tryWithSample = (filename: string, displayName: string) => {
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
    <div className="w-full max-w-2xl mx-auto">
      <div className="glass-container glass-container-with-liquid p-6">
        <div className="text-center mb-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">CAD Drawing Analyzer</h2>
            <a 
              href="/cad-analyzer" 
              className="text-primary hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>Full Experience</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <p className="text-gray-600 text-sm">
            Upload your technical drawing and get AI-powered product recommendations
          </p>
        </div>

        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`
            glass-upload-zone p-6 text-center cursor-pointer
            ${isDragActive 
              ? 'border-primary bg-blue-50' 
              : uploadState.status === 'error'
              ? 'border-red-300 bg-red-50'
              : ''
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
                    Supports PDF, PNG, JPG, STEP, STL, OBJ, DXF up to {maxSizeInMB}MB
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

        {/* Sample Drawing Demo */}
        <div className="mt-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Try with Sample Drawings</h4>
            <p className="text-blue-700 text-sm mb-4">
              Test the CAD analyzer with our sample technical drawings to see AI recommendations.
            </p>
            
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Servo Motor Sample */}
                      <div className="glass-card-compact text-center flex flex-col h-full">
                        <img 
                          src="/images/sample-cad-preview.svg" 
                          alt="Servo Motor Drawing"
                          className="w-16 h-12 mx-auto rounded border border-gray-200"
                        />
                        <div className="flex-1 flex flex-col justify-center text-center">
                          <p className="text-sm font-medium text-gray-900">Servo Motor</p>
                          <p className="text-xs text-gray-600">50Nm Torque</p>
                        </div>
                        <button
                          onClick={() => tryWithSample('servo-motor-drawing.pdf', 'Servo Motor')}
                          className="w-full text-xs text-primary hover:text-blue-700 underline font-medium py-1 mt-auto"
                          disabled={uploadState.status === 'uploading'}
                        >
                          Load Sample
                        </button>
                      </div>

                      {/* Bracket Sample */}
                      <div className="glass-card-compact text-center flex flex-col h-full">
                        <img 
                          src="/images/bracket-cad-preview.svg" 
                          alt="Bracket Drawing"
                          className="w-16 h-12 mx-auto rounded border border-gray-200"
                        />
                        <div className=" flex-1 flex flex-col justify-center text-center">
                          <p className="text-sm font-medium text-gray-900">Mounting Bracket</p>
                          <p className="text-xs text-gray-600">Steel, 500N Load</p>
                        </div>
                        <button
                          onClick={() => tryWithSample('bracket-drawing.pdf', 'Mounting Bracket')}
                          className="w-full text-xs text-primary hover:text-blue-700 underline font-medium py-1 mt-auto"
                          disabled={uploadState.status === 'uploading'}
                        >
                          Load Sample
                        </button>
                      </div>

                      {/* Steel Beam Sample */}
                      <div className="glass-card-compact text-center flex flex-col h-full">
                        <img 
                          src="/images/steel-beam-cad-preview.svg" 
                          alt="Steel Beam Drawing"
                          className="w-16 h-12 mx-auto rounded border border-gray-200"
                        />
                        <div className="flex-1 flex flex-col justify-center text-center">
                          <p className="text-sm font-medium text-gray-900">I-Beam Steel</p>
                          <p className="text-xs text-gray-600">200x100mm</p>
                        </div>
                        <button
                          onClick={() => tryWithSample('steel-beam-drawing.pdf', 'I-Beam Steel')}
                          className="w-full text-xs text-primary hover:text-blue-700 underline font-medium py-1 mt-auto"
                          disabled={uploadState.status === 'uploading'}
                        >
                          Load Sample
                        </button>
                      </div>
                    </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default CADAnalyzer;