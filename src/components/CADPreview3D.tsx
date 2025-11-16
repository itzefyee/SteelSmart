'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { CADModelData, getCADParser } from '@/lib/cad-parser';

interface CADPreview3DProps {
  file?: File;
  modelData?: CADModelData;
  className?: string;
  showStats?: boolean;
  onParsingStart?: () => void;
  onParsingComplete?: (ok: boolean) => void;
  onPreviewLoaded?: (ok: boolean) => void;
  onModelDataParsed?: (data: CADModelData) => void;
}

const CADPreview3D: React.FC<CADPreview3DProps> = ({
  file,
  modelData: initialModelData,
  className = '',
  showStats = true,
  onParsingStart,
  onParsingComplete,
  onPreviewLoaded,
  onModelDataParsed,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [modelData, setModelData] = useState<CADModelData | null>(initialModelData || null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Color control states
  const [modelColor, setModelColor] = useState('#777777');
  const [wireframeColor, setWireframeColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // UI control states
  const [showControls, setShowControls] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Parse file if provided
  useEffect(() => {
    if (file && !initialModelData) {
      parseFile(file);
    } else if (initialModelData) {
      setModelData(initialModelData);
      setIsLoading(false);
      if (onParsingComplete) onParsingComplete(true);
    }
  }, [file, initialModelData, onParsingComplete]);

  const parseFile = async (file: File) => {
    setIsLoading(true);
    setError('');

    try {
      if (onParsingStart) onParsingStart();
      if (onPreviewLoaded) onPreviewLoaded(false);
      const parser = getCADParser();
      const data = await parser.parseFile(file);
      setModelData(data);
      setIsLoading(false);
      if (onParsingComplete) onParsingComplete(true);
      if (onModelDataParsed) onModelDataParsed(data);
    } catch (err: any) {
      console.error('Error parsing CAD file:', err);
      setError(`Failed to parse file: ${err.message}`);
      setIsLoading(false);
      if (onParsingComplete) onParsingComplete(false);
      if (onPreviewLoaded) onPreviewLoaded(false);
    }
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !modelData || isLoading) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    cameraRef.current = camera;

    // Calculate bounding box center and size
    const bbox = modelData.boundingBox;
    const center = new THREE.Vector3(
      (bbox.min.x + bbox.max.x) / 2,
      (bbox.min.y + bbox.max.y) / 2,
      (bbox.min.z + bbox.max.z) / 2
    );
    const size = Math.max(
      bbox.max.x - bbox.min.x,
      bbox.max.y - bbox.min.y,
      bbox.max.z - bbox.min.z
    );

    // Position camera
    const distance = size * 2;
    camera.position.set(center.x + distance, center.y + distance, center.z + distance);
    camera.lookAt(center);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(center);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.update();
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    // Grid
    const gridHelper = new THREE.GridHelper(size * 2, 20, 0xcccccc, 0xe0e0e0);
    gridHelper.position.set(center.x, bbox.min.y, center.z);
    scene.add(gridHelper);

    // Axes
    const axesHelper = new THREE.AxesHelper(size / 2);
    axesHelper.position.copy(center);
    scene.add(axesHelper);

    // Create geometry from model data
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(modelData.vertices, 3));
    
    // Calculate normals if needed
    if (modelData.normals.length === modelData.vertices.length) {
      geometry.setAttribute('normal', new THREE.BufferAttribute(modelData.normals, 3));
    } else {
      geometry.computeVertexNormals();
    }
    
    if (modelData.indices.length > 0) {
      geometry.setIndex(new THREE.BufferAttribute(modelData.indices, 1));
    }

    // Material with improved settings
    const material = new THREE.MeshPhongMaterial({
      color: parseInt(modelColor.replace('#', '0x')),
      specular: 0x444444,
      shininess: 30,
      side: THREE.DoubleSide,
      flatShading: false,
      vertexColors: false, // Use material color instead of vertex colors
    });

    // Mesh
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // Wireframe overlay
    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ 
      color: parseInt(wireframeColor.replace('#', '0x')),
      linewidth: 1 
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    mesh.add(wireframe);
    wireframeRef.current = wireframe;

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      geometry.dispose();
      material.dispose();
      wireframeGeometry.dispose();
      wireframeMaterial.dispose();
      renderer.dispose();
      controls.dispose();
    };
  }, [modelData, isLoading, modelColor, wireframeColor]);

  // Update colors dynamically without reloading scene
  useEffect(() => {
    if (!meshRef.current || !wireframeRef.current) return;

    const material = meshRef.current.material as THREE.MeshPhongMaterial;
    const wireframeMaterial = wireframeRef.current.material as THREE.LineBasicMaterial;

    material.color.set(parseInt(modelColor.replace('#', '0x')));
    wireframeMaterial.color.set(parseInt(wireframeColor.replace('#', '0x')));
  }, [modelColor, wireframeColor]);

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

  // Reset view
  const handleResetView = () => {
    if (!cameraRef.current || !controlsRef.current || !modelData) return;

    const bbox = modelData.boundingBox;
    const center = new THREE.Vector3(
      (bbox.min.x + bbox.max.x) / 2,
      (bbox.min.y + bbox.max.y) / 2,
      (bbox.min.z + bbox.max.z) / 2
    );
    const size = Math.max(
      bbox.max.x - bbox.min.x,
      bbox.max.y - bbox.min.y,
      bbox.max.z - bbox.min.z
    );

    const distance = size * 2;
    cameraRef.current.position.set(center.x + distance, center.y + distance, center.z + distance);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };

  // Toggle wireframe
  const handleToggleWireframe = () => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.MeshPhongMaterial;
    material.wireframe = !material.wireframe;
  };

  // Color presets
  const modelPresets = ['#999999', '#777777', '#666666', '#555555', '#444444', '#333333'];
  const wireframePresets = ['#000000', '#222222', '#444444', '#666666', '#888888', '#ffffff'];

  const fileExtension = file?.name.split('.').pop()?.toLowerCase() || 'model';

  useEffect(() => {
    if (!onPreviewLoaded) return;
    if (isLoading) {
      onPreviewLoaded(false);
    } else if (error) {
      onPreviewLoaded(false);
    } else if (modelData) {
      onPreviewLoaded(true);
    }
  }, [isLoading, error, modelData, onPreviewLoaded]);

  if (isLoading) {
    return (
      <div className={`w-full h-96 bg-gray-50 rounded-lg border-2 border-gray-200 flex items-center justify-center relative overflow-hidden ${className}`}>
        <div className="text-center z-10">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-gray-600">Loading 3D model...</p>
          <p className="text-xs text-gray-500 mt-2">Parsing with OpenCascade.js</p>
        </div>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    if (onPreviewLoaded) onPreviewLoaded(false);
    return (
      <div className={`w-full h-96 bg-gray-50 rounded-lg border-2 border-red-200 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-600 font-medium">{error}</p>
          <p className="text-xs text-gray-500 mt-2">Please check the file format and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full h-96 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border-2 border-gray-200 relative overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none' : ''} ${className}`}
    >
      {/* Controls overlay */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleResetView}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Reset view"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={handleToggleWireframe}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Toggle wireframe"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            
            {/* Color Picker Button */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </button>
              
              {/* Color Picker Dropdown */}
              {showColorPicker && (
                <div className={`absolute top-0 bg-white rounded-lg shadow-xl border border-gray-200 ${
                  isFullscreen ? 'right-12 w-64' : 'right-12 w-44'
                }`}>
                  <div className={isFullscreen ? 'p-4 space-y-4' : 'p-2 space-y-2'}>
                    {/* Model Color */}
                    <div>
                      <label className={`block font-medium text-gray-700 mb-1.5 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                        {isFullscreen ? 'Model Color' : 'Model'}
                      </label>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="color"
                          value={modelColor}
                          onChange={(e) => setModelColor(e.target.value)}
                          className={`rounded cursor-pointer flex-shrink-0 ${isFullscreen ? 'w-10 h-10' : 'w-7 h-7'}`}
                        />
                        <input
                          type="text"
                          value={modelColor}
                          onChange={(e) => setModelColor(e.target.value)}
                          className={`flex-1 min-w-0 border border-gray-300 rounded px-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                            isFullscreen ? 'py-1.5 text-sm' : 'py-1 text-xs'
                          }`}
                          placeholder="#777777"
                          maxLength={7}
                        />
                      </div>
                      <div className={`grid grid-cols-6 gap-1 ${isFullscreen ? 'mt-2' : 'mt-1.5'}`}>
                        {modelPresets.map((color) => (
                          <button
                            key={color}
                            onClick={() => setModelColor(color)}
                            className={`rounded border-2 transition-all ${
                              modelColor === color ? 'border-blue-500 scale-110' : 'border-gray-300 hover:border-gray-400'
                            } ${isFullscreen ? 'w-8 h-8' : 'w-5 h-5'}`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Wireframe Color */}
                    <div>
                      <label className={`block font-medium text-gray-700 mb-1.5 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                        {isFullscreen ? 'Wireframe Color' : 'Wireframe'}
                      </label>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="color"
                          value={wireframeColor}
                          onChange={(e) => setWireframeColor(e.target.value)}
                          className={`rounded cursor-pointer flex-shrink-0 ${isFullscreen ? 'w-10 h-10' : 'w-7 h-7'}`}
                        />
                        <input
                          type="text"
                          value={wireframeColor}
                          onChange={(e) => setWireframeColor(e.target.value)}
                          className={`flex-1 min-w-0 border border-gray-300 rounded px-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                            isFullscreen ? 'py-1.5 text-sm' : 'py-1 text-xs'
                          }`}
                          placeholder="#000000"
                          maxLength={7}
                        />
                      </div>
                      <div className={`grid grid-cols-6 gap-1 ${isFullscreen ? 'mt-2' : 'mt-1.5'}`}>
                        {wireframePresets.map((color) => (
                          <button
                            key={color}
                            onClick={() => setWireframeColor(color)}
                            className={`rounded border-2 transition-all ${
                              wireframeColor === color ? 'border-blue-500 scale-110' : 'border-gray-300 hover:border-gray-400'
                            } ${isFullscreen ? 'w-8 h-8' : 'w-5 h-5'}`}
                            style={{ 
                              backgroundColor: color,
                              border: color === '#ffffff' ? '2px solid #e5e7eb' : undefined
                            }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
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
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg uppercase">
          {fileExtension}
        </div>
      </div>

      {/* Instructions - Top Center, Collapsible */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className={`rounded-lg shadow-lg overflow-hidden ${
          isFullscreen ? 'bg-white/90 backdrop-blur-sm' : 'bg-white/95'
        }`}>
          <button
            onClick={() => setShowControls(!showControls)}
            className="w-full px-4 py-2 flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className={`font-medium text-gray-700 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
              Controls
            </span>
            <svg 
              className={`w-4 h-4 text-gray-600 transition-transform duration-500 ${showControls ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div 
            className="overflow-hidden transition-all duration-500 ease-in-out"
            style={{ 
              maxHeight: showControls ? '200px' : '0px',
              opacity: showControls ? 1 : 0 
            }}
          >
            <div className={`border-t border-gray-200 ${isFullscreen ? 'p-4' : 'p-3'}`}>
              <div className={`space-y-2 ${isFullscreen ? 'text-sm' : 'text-xs'} text-gray-600`}>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Rotate:</span>
                  <span>Left click + drag</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Pan:</span>
                  <span>Right click + drag</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Zoom:</span>
                  <span>Scroll wheel</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Info - Bottom Center, Collapsible */}
      {showStats && modelData && (
        <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 ${
          isFullscreen ? 'w-11/12 max-w-6xl' : 'w-11/12 max-w-3xl'
        }`}>
          <div className="bg-white backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => setShowModelInfo(!showModelInfo)}
              className="w-full px-4 py-2 flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className={`font-medium text-gray-700 ${isFullscreen ? 'text-base' : 'text-sm'}`}>
                Model Info
              </span>
              <svg 
                className={`w-4 h-4 text-gray-600 transition-transform duration-500 ${showModelInfo ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <div 
              className="overflow-hidden transition-all duration-500 ease-in-out"
              style={{ 
                maxHeight: showModelInfo ? '300px' : '0px',
                opacity: showModelInfo ? 1 : 0 
              }}
            >
              <div className={`border-t border-gray-200`}>
                <div className={`${isFullscreen ? 'p-3' : 'p-2'} bg-gray-50/80 rounded`}>
                  <div className={`grid gap-0 ${
                  isFullscreen 
                    ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6' 
                    : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6'
                }`}>
                  <div className="text-center p-2">
                    <p className={`text-gray-600 truncate ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                      Vertices
                    </p>
                    <p className={`font-semibold text-gray-900 truncate ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                      {modelData.vertices_count.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-2">
                    <p className={`text-gray-600 truncate ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                      Faces
                    </p>
                    <p className={`font-semibold text-gray-900 truncate ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                      {modelData.faces.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-2">
                    <p className={`text-gray-600 truncate ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                      Edges
                    </p>
                    <p className={`font-semibold text-gray-900 truncate ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                      {modelData.edges.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-2">
                    <p className={`text-gray-600 truncate ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                      Parts
                    </p>
                    <p className={`font-semibold text-gray-900 truncate ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                      {modelData.parts.length}
                    </p>
                  </div>
                  {modelData.volume !== undefined && (
                    <div className="text-center p-2">
                      <p className={`text-gray-600 truncate ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                        Volume (mm³)
                      </p>
                      <p className={`font-semibold text-gray-900 truncate ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                        {modelData.volume.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {modelData.surfaceArea !== undefined && (
                    <div className="text-center p-2">
                      <p className={`text-gray-600 truncate ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                        Surface (mm²)
                      </p>
                      <p className={`font-semibold text-gray-900 truncate ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                        {modelData.surfaceArea.toFixed(2)}
                      </p>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CADPreview3D;


