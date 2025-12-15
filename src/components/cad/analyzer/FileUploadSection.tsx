'use client';

import React from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { formatFileSize } from '@/lib/utils';

interface FileUploadState {
  file: File | null;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface TemplateSample {
  id: number;
  name: string;
  description: string;
  preview: string;
  file: string;
}

interface FileUploadSectionProps {
  uploadState: FileUploadState;
  onDrop: (acceptedFiles: File[], rejectedFiles: FileRejection[]) => void;
  onStartAnalysis: () => void;
  onReset: () => void;
  sampleLoadSuccess: string | null;
  templateSamples: TemplateSample[];
  onLoadSample: (filePath: string, displayName: string) => void;
  showSampleDrawings: boolean;
  pendingSampleFile: File | null;
  maxSizeInMB?: number;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = React.memo(({
  uploadState,
  onDrop,
  onStartAnalysis,
  onReset,
  sampleLoadSuccess,
  templateSamples,
  onLoadSample,
  showSampleDrawings,
  pendingSampleFile,
  maxSizeInMB = 10,
}) => {
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

  return (
    <div className="w-full lg:w-[40%] space-y-6">
      {/* File Upload Area */}
      <div className="glass-container glass-container-with-liquid p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Drawing</h2>
        
        <div
          {...getRootProps()}
          className={`
            glass-upload-zone p-8 text-center cursor-pointer
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
            onClick={onStartAnalysis}
            disabled={(!uploadState.file && !pendingSampleFile) || uploadState.status === 'uploading'}
            isLoading={uploadState.status === 'uploading'}
            className="flex-1"
          >
            {uploadState.status === 'uploading' ? 'Analyzing...' : 'Analyze Drawing'}
          </Button>
          
          {(uploadState.file || pendingSampleFile) && (
            <Button
              variant="outline"
              onClick={onReset}
              disabled={uploadState.status === 'uploading'}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Sample Drawings */}
      {showSampleDrawings && (
        <div className="glass-container glass-container-with-liquid p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2">Try Sample Drawings</h3>
          <p className="text-gray-600 text-xs mb-3">
            Test with real CAD Generator templates loaded as STEP files.
          </p>
          
          <div className="space-y-2">
            {templateSamples.map((sample) => (
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
      )}
    </div>
  );
});

FileUploadSection.displayName = 'FileUploadSection';

export default FileUploadSection;
