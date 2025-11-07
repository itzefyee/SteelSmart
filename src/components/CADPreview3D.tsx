'use client';

import React, { useEffect, useState, useRef } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CADPreview3DProps {
  modelData: string; // base64 encoded model data
  format: 'step' | 'stl' | 'obj';
  className?: string;
}

const CADPreview3D: React.FC<CADPreview3DProps> = ({ 
  modelData, 
  format, 
  className = '' 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fileSize, setFileSize] = useState<number>(0);

  useEffect(() => {
    if (!modelData) {
      setError('No model data available');
      setIsLoading(false);
      return;
    }

    try {
      // Extract base64 data
      let base64Data = modelData;
      if (modelData.startsWith('data:')) {
        base64Data = modelData.split(',')[1] || modelData.replace(/^data:.*;base64,/, '');
      }

      // Calculate file size
      const size = Math.round((base64Data.length * 3) / 4);
      setFileSize(size);

      // Simulate loading
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    } catch (err: any) {
      console.error('Error processing model:', err);
      setError(`Failed to process model: ${err.message}`);
      setIsLoading(false);
    }
  }, [modelData]);

  // Handle mouse drag for rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - rotation.y, y: e.clientY - rotation.x });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setRotation({
        x: e.clientY - dragStart.y,
        y: e.clientX - dragStart.x
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel for zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(2, prev * delta)));
  };

  // Handle fullscreen
  const handleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Update canvas size for fullscreen
  useEffect(() => {
    if (!canvasRef.current) return;

    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const container = containerRef.current;
        if (container) {
          canvasRef.current.width = container.clientWidth;
          canvasRef.current.height = container.clientHeight;
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isFullscreen]);

  // Draw wireframe preview
  useEffect(() => {
    if (isLoading || error || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width || 800;
    const height = canvas.height || 600;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw 3D wireframe representation
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.3 * zoom;

    // Apply rotation
    const radX = (rotation.x * Math.PI) / 180;
    const radY = (rotation.y * Math.PI) / 180;

    // Draw a 3D wireframe cube as placeholder
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';

    // Define cube vertices (simplified 3D projection)
    const vertices = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ];

    // Project 3D to 2D
    const project = (x: number, y: number, z: number) => {
      const cosX = Math.cos(radX);
      const sinX = Math.sin(radX);
      const cosY = Math.cos(radY);
      const sinY = Math.sin(radY);

      // Rotate around Y axis
      let x1 = x * cosY - z * sinY;
      let y1 = y;
      let z1 = x * sinY + z * cosY;

      // Rotate around X axis
      let x2 = x1;
      let y2 = y1 * cosX - z1 * sinX;
      let z2 = y1 * sinX + z1 * cosX;

      // Perspective projection
      const distance = 3;
      const scale = distance / (distance + z2);
      return {
        x: centerX + x2 * size * scale,
        y: centerY + y2 * size * scale
      };
    };

    // Draw edges
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // front face
      [4, 5], [5, 6], [6, 7], [7, 4], // back face
      [0, 4], [1, 5], [2, 6], [3, 7]  // connecting edges
    ];

    edges.forEach(([i, j]) => {
      const v1 = project(vertices[i][0], vertices[i][1], vertices[i][2]);
      const v2 = project(vertices[j][0], vertices[j][1], vertices[j][2]);
      ctx.beginPath();
      ctx.moveTo(v1.x, v1.y);
      ctx.lineTo(v2.x, v2.y);
      ctx.stroke();
    });

    // Draw vertices
    ctx.fillStyle = '#3b82f6';
    vertices.forEach(vertex => {
      const p = project(vertex[0], vertex[1], vertex[2]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [rotation, zoom, isLoading, error, isFullscreen]);

  if (isLoading) {
    return (
      <div className={`w-full h-96 bg-gray-50 rounded-lg border-2 border-gray-200 flex items-center justify-center relative overflow-hidden ${className}`}>
        <div className="text-center z-10">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-gray-600">Loading 3D model...</p>
        </div>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full h-96 bg-gray-50 rounded-lg border-2 border-red-200 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-600 font-medium">{error}</p>
          <p className="text-xs text-gray-500 mt-2">3D preview unavailable. You can still download the file.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full h-96 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border-2 border-gray-200 relative overflow-hidden cursor-grab active:cursor-grabbing ${isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none' : ''} ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Canvas for 3D preview */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full"
        style={{ imageRendering: 'crisp-edges', display: 'block' }}
      />

      {/* Controls overlay */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setRotation({ x: 0, y: 0 })}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Reset view"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Reset zoom"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <button
              onClick={handleFullscreen}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Format badge */}
      <div className="absolute top-4 left-4">
        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
          {format.toUpperCase()}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <p className="text-xs text-gray-600 text-center">
            <span className="font-medium">Drag to rotate</span> • <span className="font-medium">Scroll to zoom</span>
          </p>
        </div>
      </div>

      {/* File info tooltip */}
      <div className="absolute bottom-16 left-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{fileSize > 1024 ? `${(fileSize / 1024).toFixed(1)} MB` : `${fileSize} KB`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CADPreview3D;
