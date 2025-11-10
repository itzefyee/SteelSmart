'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import CADPreview3D from '@/components/CADPreview3D';
import { CADModelData } from '@/lib/cad-parser';

export default function CADPreviewDemoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [modelData, setModelData] = useState<CADModelData | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/step': ['.step', '.stp'],
      'application/sla': ['.stl'],
      'model/obj': ['.obj'],
      'application/dxf': ['.dxf'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB for demo
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setModelData(null); // Clear previous model data
      }
    },
  });

  const handleClear = () => {
    setFile(null);
    setModelData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CAD 3D Preview Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your CAD files (STEP, STL, OBJ, DXF) to view them in 3D with interactive controls.
            Powered by OpenCascade.js and Three.js.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800">
              STEP
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800">
              STL
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800">
              OBJ
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800">
              DXF
            </span>
          </div>
        </div>

        {/* Upload Area */}
        {!file && (
          <div className="max-w-3xl mx-auto mb-12">
            <div
              {...getRootProps()}
              className={`
                border-4 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                ${isDragActive
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-100'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {isDragActive
                      ? 'Drop your CAD file here'
                      : 'Drop your CAD file or click to browse'}
                  </p>
                  <p className="text-gray-600">
                    Supports STEP (.step, .stp), STL (.stl), OBJ (.obj), DXF (.dxf)
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Maximum file size: 50MB</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3D Preview */}
        {file && (
          <div className="space-y-6">
            {/* File Info Card */}
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB •{' '}
                      {file.name.split('.').pop()?.toUpperCase()} Format
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* 3D Viewer */}
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Interactive 3D View</h2>
              <CADPreview3D 
                file={file} 
                showStats={true}
                className="rounded-xl"
              />
            </div>

            {/* Parts Information */}
            {modelData && modelData.parts.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Model Parts ({modelData.parts.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modelData.parts.map((part, index) => (
                    <div
                      key={part.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{part.name}</h4>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {part.type}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        {part.volume && (
                          <p>
                            <span className="font-medium">Volume:</span> {part.volume.toFixed(2)}{' '}
                            mm³
                          </p>
                        )}
                        {part.surfaceArea && (
                          <p>
                            <span className="font-medium">Surface:</span>{' '}
                            {part.surfaceArea.toFixed(2)} mm²
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Bounds:</span>
                          <br />
                          <span className="text-xs">
                            ({part.boundingBox.min.x.toFixed(1)},{' '}
                            {part.boundingBox.min.y.toFixed(1)},{' '}
                            {part.boundingBox.min.z.toFixed(1)})
                            <br />
                            to ({part.boundingBox.max.x.toFixed(1)},{' '}
                            {part.boundingBox.max.y.toFixed(1)},{' '}
                            {part.boundingBox.max.z.toFixed(1)})
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg border border-blue-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Features & Controls
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Rotate</h3>
                  <p className="text-sm text-gray-600">
                    Left click + drag to rotate the model around
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Zoom</h3>
                  <p className="text-sm text-gray-600">
                    Scroll wheel to zoom in and out of the model
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Pan</h3>
                  <p className="text-sm text-gray-600">
                    Right click + drag to pan the camera view
                  </p>
                </div>
              </div>
            </div>

            {/* Technology Stack */}
            <div className="bg-white rounded-xl shadow-lg border p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Powered By
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600">
                    OC.js
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">OpenCascade.js</h4>
                    <p className="text-sm text-gray-600">CAD kernel for parsing STEP & STL files</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center font-bold text-purple-600">
                    Three.js
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Three.js</h4>
                    <p className="text-sm text-gray-600">WebGL 3D rendering engine</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


