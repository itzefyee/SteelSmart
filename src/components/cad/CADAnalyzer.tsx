'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { FileRejection } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import CAD2DViewExtractor from '@/components/cad/CAD2DViewExtractor';
import { DrawingAnalysis, FileUploadState, APIResponse } from '@/types';
import { CADViewGenerator, type GeneratedView } from '@/lib/cad-view-generator';
import { CADModelData, getCADParser } from '@/lib/cad-parser';
import { useToast } from '@/components/ui/ToastProvider';
import { cadTemplates } from '@/data/sample-data';
import { SAMPLE_ANALYSIS_CACHE, type SampleCacheKey } from '@/data/sample-analysis-cache';

// Import eagerly loaded sub-components
import {
  UploadSection,
  SampleDrawings,
  ManufacturingSection,
  AnalysisResults
} from './analyzer';

// Lazy load tab components (only loaded when user switches to that tab)
const ValidationTab = lazy(() => import('./analyzer/ValidationTab').then(m => ({ default: m.ValidationTab })));
const VerificationTab = lazy(() => import('./analyzer/VerificationTab').then(m => ({ default: m.VerificationTab })));
const CADPreview3D = lazy(() => import('@/components/cad/CADPreview3D'));

/**
 * Loading fallback component for lazy-loaded tabs
 */
const TabLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <LoadingSpinner />
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

const CADPreviewLoadingFallback: React.FC = () => (
  <div className="w-full h-[350px] md:h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
    <LoadingSpinner />
  </div>
);

const CADIslandErrorFallback = (error: Error, retry: () => void) => (
  <div className="w-full min-h-48 rounded-lg border border-red-200 bg-red-50 p-6 text-center" role="alert">
    <p className="font-semibold text-red-800">Unable to load this CAD view</p>
    <p className="mt-2 text-sm text-red-700">{error.message || 'The 3D renderer encountered an unexpected error.'}</p>
    <button
      type="button"
      onClick={retry}
      className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      Retry view
    </button>
  </div>
);
import {
  convertManufacturingDataToUI,
  convertSpecificationDataToUI,
  type ManufacturabilityResult,
  type SpecificationResult
} from '@/lib/cad-manufacturing-analysis';

const CAD_MODEL_FORMATS = ['step', 'stp', 'stl', 'obj', 'dxf', 'gltf', 'glb'];

type KeyFinding = {
  title: string;
  status: 'Valid' | 'Warning' | 'Invalid';
  message: string;
  detail?: string;
  suggestion?: string;
};

type TemplateSample = {
  id: number;
  name: string;
  description: string;
  preview: string;
  file: string;
};

const SAMPLE_ANALYSIS_FILE_MAP: Record<string, SampleCacheKey> = {
  '/products-models/i-beam-steel-200mm-grade.step': 'iBeam',
  '/products-models/surgical_drill_guide.step': 'drillGuide',
  '/products-models/brake_rotor.step': 'brakeRotor',
};

const CADAnalyzer: React.FC = () => {
  // State management
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    progress: 0,
    status: 'idle',
    error: undefined
  });

  const [analysis, setAnalysis] = useState<DrawingAnalysis | null>(null);
  const [cadModelData, setCADModelData] = useState<CADModelData | null>(null);
  const [sampleLoadSuccess, setSampleLoadSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'validation' | 'verification' | 'report'>('analysis');
  const validationRef = useRef<HTMLDivElement>(null);
  const verificationRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef<'validation' | 'verification' | null>(null);
  const [manufacturabilityResults, setManufacturabilityResults] = useState<ManufacturabilityResult[]>([]);
  const [specificationResults, setSpecificationResults] = useState<SpecificationResult[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportTimestamp, setReportTimestamp] = useState<string | null>(null);
  const [isAnalyzingManufacturing, setIsAnalyzingManufacturing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const { addToast } = useToast();
  const cadModelDataRef = useRef<CADModelData | null>(null);
  const [isModelPreviewReady, setIsModelPreviewReady] = useState(false);
  const [analysisRequested, setAnalysisRequested] = useState(false);
  const [previewResetKey, setPreviewResetKey] = useState(0);
  const parseJobIdRef = useRef(0);
  const [isParsingModel, setIsParsingModel] = useState(false);
  const [modelParseError, setModelParseError] = useState<string | null>(null);
  const [pendingSampleAnalysisKey, setPendingSampleAnalysisKey] = useState<SampleCacheKey | null>(null);
  const [pendingSampleFile, setPendingSampleFile] = useState<File | null>(null);

  // Drawing analysis progress tracking
  const [drawingAnalysisStage, setDrawingAnalysisStage] = useState<string | null>(null);
  const [drawingAnalysisProgress, setDrawingAnalysisProgress] = useState(0);

  useEffect(() => {
    cadModelDataRef.current = cadModelData;
  }, [cadModelData]);

  useEffect(() => {
    setIsModelPreviewReady(false);
    setAnalysisRequested(false);
  }, [uploadState.file]);

  const is3DFile = useMemo(() => {
    if (!uploadState.file) return false;
    const ext = uploadState.file.name.split('.').pop()?.toLowerCase() || '';
    return CAD_MODEL_FORMATS.includes(ext);
  }, [uploadState.file]);

  const cloneSampleAnalysis = useCallback((key: SampleCacheKey): DrawingAnalysis => {
    const cached = SAMPLE_ANALYSIS_CACHE[key];
    return {
      ...cached,
      extractedSpecs: { ...cached.extractedSpecs },
      recommendedProducts: cached.recommendedProducts.map((product) => ({ ...product })),
      analysisId: `${cached.analysisId}-${Date.now()}`,
    };
  }, []);

  const isAnalysisRunning = uploadState.status === 'uploading';
  const show2DExtractor = Boolean(uploadState.file && is3DFile);
  const is2DExtractorReady = Boolean(isModelPreviewReady && cadModelData);
  const showSampleDrawings = !analysis;
  const isParserReady = !is3DFile || Boolean(cadModelData);
  const isWaitingForParserBeforeAnalysis =
    analysisRequested && is3DFile && !cadModelData && !modelParseError && !isAnalysisRunning;
  const isWaitingForPreviewBeforeAnalysis =
    analysisRequested && is3DFile && !!cadModelData && !isModelPreviewReady && !isAnalysisRunning;

  // CAD Model Parsing Effect
  useEffect(() => {
    if (!uploadState.file) {
      setCADModelData(null);
      cadModelDataRef.current = null;
      setModelParseError(null);
      setIsParsingModel(false);
      return;
    }

    if (!is3DFile) {
      setIsModelPreviewReady(true);
      setModelParseError(null);
      setIsParsingModel(false);
      setCADModelData(null);
      cadModelDataRef.current = null;
      return;
    }

    const currentFile = uploadState.file;

    parseJobIdRef.current += 1;
    const jobId = parseJobIdRef.current;
    setIsParsingModel(true);
    setModelParseError(null);
    setCADModelData(null);
    cadModelDataRef.current = null;
    setIsModelPreviewReady(false);

    (async () => {
      try {
        const parser = await getCADParser();
        const parsedModel = await parser.parseFile(currentFile);
        if (parseJobIdRef.current !== jobId) {
          return;
        }
        setCADModelData(parsedModel);
        cadModelDataRef.current = parsedModel;
      } catch (error) {
        if (parseJobIdRef.current !== jobId) {
          return;
        }
        console.error('Failed to parse CAD file:', error);
        setModelParseError(
          error instanceof Error ? error.message : 'Failed to parse CAD file. Please try another file.'
        );
        setCADModelData(null);
        cadModelDataRef.current = null;
      } finally {
        if (parseJobIdRef.current === jobId) {
          setIsParsingModel(false);
        }
      }
    })();

    return () => {
      parseJobIdRef.current += 1;
    };
  }, [uploadState.file, is3DFile]);

  const scrollToSection = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const top = ref.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (pendingScrollRef.current === 'validation') {
      scrollToSection(validationRef);
      pendingScrollRef.current = null;
    } else if (pendingScrollRef.current === 'verification') {
      scrollToSection(verificationRef);
      pendingScrollRef.current = null;
    }
  }, [activeTab, scrollToSection]);

  const templateSamples = useMemo<TemplateSample[]>(() => {
    const templateMap = new Map(cadTemplates.map((template) => [template.id, template]));
    const definitions = [
      {
        id: 1,
        file: '/products-models/i-beam-steel-200mm-grade.step',
        previewFallback: '/images/products/steel-beam-001.png',
      },
      {
        id: 2,
        file: '/products-models/surgical_drill_guide.step',
        previewFallback: '/images/products/surgical-drill-guide-001.png',
      },
      {
        id: 4,
        file: '/products-models/brake_rotor.step',
        previewFallback: '/images/products/brake-rotor-001.png',
      },
    ];

    return definitions
      .map((definition) => {
        const template = templateMap.get(definition.id);
        if (!template) {
          return null;
        }

        return {
          id: template.id,
          name: template.name,
          description: template.description,
          preview: template.preview || definition.previewFallback,
          file: definition.file,
        };
      })
      .filter((sample): sample is TemplateSample => Boolean(sample));
  }, []);

  const clearPreviewCache = useCallback(() => {
    setCADModelData(null);
    setManufacturabilityResults([]);
    setSpecificationResults([]);
    setReportGenerated(false);
    setReportTimestamp(null);
    setPreviewResetKey((prev) => prev + 1);
    setPendingSampleAnalysisKey(null);
    setPendingSampleFile(null);

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cadFileToAnalyze');
      sessionStorage.removeItem('cadAnalysisResult');
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
      clearPreviewCache();
      setUploadState({
        file,
        progress: 0,
        status: 'idle',
        error: undefined
      });

      setAnalysis(null);
      setSampleLoadSuccess(null);
    }
  }, [clearPreviewCache]);

  const resetAnalysis = () => {
    clearPreviewCache();
    // Clear saved results when resetting
    localStorage.removeItem('cadAnalyzerResults');
    setUploadState({
      file: null,
      progress: 0,
      status: 'idle',
      error: undefined
    });
    setAnalysis(null);
    setSampleLoadSuccess(null);
  };

  const loadSampleFromStep = async (filePath: string, displayName: string) => {
    try {
      clearPreviewCache();
      setAnalysis(null);
      setSampleLoadSuccess(null);

      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error('Failed to download sample STEP file.');
      }

      const blob = await response.blob();
      const extension = filePath.split('.').pop() || 'step';
      const safeName = `${displayName.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
      const sampleFile = new File([blob], safeName, { type: blob.type || 'application/step' });

      setPendingSampleFile(sampleFile);

      setSampleLoadSuccess(displayName);
      setTimeout(() => setSampleLoadSuccess(null), 3000);
      const cacheKey = SAMPLE_ANALYSIS_FILE_MAP[filePath] ?? null;
      setPendingSampleAnalysisKey(cacheKey);
      addToast({
        type: 'info',
        title: `Sample prepared: ${displayName}`,
        description: 'Click "Analyze Drawing" to load this file and run AI analysis.',
      });
    } catch (error) {
      console.error('Error loading sample STEP file:', error);
      addToast({
        type: 'error',
        title: 'Unable to load sample',
        description: error instanceof Error ? error.message : 'Download failed, please try again.',
      });
    }
  };

  const generateViewPayload = useCallback(async (modelData: CADModelData) => {
    const viewGenerator = new CADViewGenerator({
      width: 640,
      height: 480,
      backgroundColor: '#f5f5f5',
      showGrid: false,
      showAxes: false,
    });

    try {
      viewGenerator.loadModel(modelData);
      // AI analysis only needs four representative views. The full 12-view PNG
      // set is generated later, on demand, by CAD2DViewExtractor.
      return [
        ...viewGenerator.generateAllViews(['front', 'top']),
        ...viewGenerator.generatePerspectiveViews(2),
      ];
    } finally {
      viewGenerator.dispose();
    }
  }, []);

  const handleAutoViewExtraction = useCallback(
    async (file: File) => {
      try {
        let parsedModel = cadModelDataRef.current;

        if (!parsedModel) {
          const parser = await getCADParser();
          parsedModel = await parser.parseFile(file);
          setCADModelData(parsedModel);
          cadModelDataRef.current = parsedModel;
        }

        if (!parsedModel) {
          throw new Error('Unable to prepare CAD model for view extraction.');
        }

        return await generateViewPayload(parsedModel);
      } catch (error) {
        console.warn('Automatic view extraction skipped:', error);
        addToast({
          type: 'warning',
          title: 'View extraction skipped',
          description:
            error instanceof Error ? error.message : 'Unable to generate orthographic views for this file.',
        });
        return null;
      }
    },
    [addToast, generateViewPayload]
  );

  const analyzeDrawing = useCallback(
    async (file: File, modelData: CADModelData | null, views: GeneratedView[] = []) => {
      const formData = new FormData();
      formData.append('file', file);

      if (modelData) {
        const cleanedCADData = {
          boundingBox: modelData.boundingBox,
          boundingBoxWithTolerance: modelData.boundingBoxWithTolerance,
          faceCount: modelData.faces,
          edgeCount: modelData.edges,
          vertexCount: modelData.vertices_count,
          holeAnalysis: modelData.holeAnalysis,
          thicknessAnalysis: modelData.thicknessAnalysis,
          edgeAnalysis: modelData.edgeAnalysis,
          weldJointAnalysis: modelData.weldJointAnalysis,
          bendAnalysis: modelData.bendAnalysis,
        };
        formData.append('cadModelData', JSON.stringify(cleanedCADData));
      }

      views.forEach((view) => {
        formData.append(`view_${view.name}`, view.blob, `${view.name}.png`);
      });

      const response = await fetch('/api/analyze-drawing', {
        method: 'POST',
        body: formData,
      });

      const result: APIResponse<DrawingAnalysis> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Analysis failed');
      }

      setAnalysis(result.data);
    },
    []
  );

  const runFullAnalysisPipeline = useCallback(async () => {
    if (!uploadState.file) return;
    setUploadState((prev) => ({ ...prev, status: 'uploading', progress: 0 }));
    setDrawingAnalysisProgress(0);
    setDrawingAnalysisStage('Preparing file...');

    try {
      const ext = uploadState.file.name.split('.').pop()?.toLowerCase() || '';
      let combinedViews: GeneratedView[] = [];

      setDrawingAnalysisProgress(15);
      setDrawingAnalysisStage('Processing file format...');

      if (CAD_MODEL_FORMATS.includes(ext)) {
        setDrawingAnalysisProgress(25);
        setDrawingAnalysisStage('Extracting CAD views...');
        const generatedViews = await handleAutoViewExtraction(uploadState.file);
        if (generatedViews) {
          combinedViews = generatedViews;

          console.log(`Selected ${combinedViews.length} views for AI analysis:`,
            combinedViews.map(v => v.name).join(', '));
        }
        setDrawingAnalysisProgress(45);
      } else {
        setDrawingAnalysisProgress(30);
      }

      setDrawingAnalysisStage('Running AI analysis...');
      setDrawingAnalysisProgress(55);

      await analyzeDrawing(uploadState.file, cadModelDataRef.current, combinedViews);

      setDrawingAnalysisProgress(95);
      setDrawingAnalysisStage('Finalizing results...');
      await new Promise(resolve => setTimeout(resolve, 300));

      setDrawingAnalysisProgress(100);
      setDrawingAnalysisStage('Complete!');
      addToast({ type: 'success', title: 'Drawing analyzed successfully' });
    } catch (error) {
      console.error('Full analysis failed:', error);
      setDrawingAnalysisStage('Analysis failed');
      addToast({ type: 'error', title: 'Drawing analysis failed' });
    } finally {
      setUploadState((prev) => ({ ...prev, status: 'idle', progress: 100 }));
      // Reset progress after a short delay
      setTimeout(() => {
        setDrawingAnalysisProgress(0);
        setDrawingAnalysisStage(null);
      }, 1000);
    }
  }, [addToast, analyzeDrawing, handleAutoViewExtraction, uploadState.file]);

  useEffect(() => {
    if (!analysisRequested) {
      return;
    }

    if (!uploadState.file) {
      setAnalysisRequested(false);
      return;
    }

    if (pendingSampleAnalysisKey) {
      setAnalysisRequested(false);
      return;
    }

    const readyToAnalyze = isParserReady;
    if (readyToAnalyze && uploadState.status !== 'uploading') {
      runFullAnalysisPipeline();
      setAnalysisRequested(false);
    }
  }, [
    analysisRequested,
    pendingSampleAnalysisKey,
    isParserReady,
    runFullAnalysisPipeline,
    uploadState.file,
    uploadState.status
  ]);

  useEffect(() => {
    if (analysisRequested && modelParseError) {
      setAnalysisRequested(false);
      addToast({
        type: 'error',
        title: 'CAD parsing failed',
        description: modelParseError,
      });
    }
  }, [analysisRequested, modelParseError, addToast]);

  // Check for stored analysis results on mount
  // Save analysis results to localStorage (5 min retention)
  useEffect(() => {
    if (analysis && uploadState.file) {
      // Convert file to data URL for storage
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const fileData = {
            dataUrl: reader.result as string,
            name: uploadState.file!.name,
            type: uploadState.file!.type,
            size: uploadState.file!.size
          };

          localStorage.setItem('cadAnalyzerResults', JSON.stringify({
            analysis,
            fileData,
            timestamp: Date.now()
          }));
        } catch (error) {
          // If file is too large for localStorage, save without file
          console.warn('File too large for localStorage, saving analysis only:', error);
          localStorage.setItem('cadAnalyzerResults', JSON.stringify({
            analysis,
            fileName: uploadState.file!.name,
            timestamp: Date.now()
          }));
        }
      };
      reader.readAsDataURL(uploadState.file);
    }
  }, [analysis, uploadState.file]);

  // Restore analysis results from localStorage on mount
  useEffect(() => {
    const savedResults = localStorage.getItem('cadAnalyzerResults');
    if (savedResults && !analysis) {
      try {
        const parsed = JSON.parse(savedResults);
        const { analysis: savedAnalysis, fileData, fileName, timestamp } = parsed;
        const fiveMinutes = 5 * 60 * 1000;

        if (Date.now() - timestamp < fiveMinutes) {
          setAnalysis(savedAnalysis);

          // Restore file if available
          if (fileData) {
            // Convert data URL back to File
            fetch(fileData.dataUrl)
              .then(res => res.blob())
              .then(blob => {
                const file = new File([blob], fileData.name, { type: fileData.type });
                setUploadState({
                  file,
                  status: 'success',
                  progress: 100,
                  error: undefined
                });
                setSampleLoadSuccess(`Previous analysis restored: ${fileData.name}`);
                addToast({
                  type: 'info',
                  title: 'Analysis and file restored',
                  description: `${fileData.name} is ready to view`
                });
              })
              .catch(err => {
                console.error('Error restoring file:', err);
                setSampleLoadSuccess(`Previous analysis restored: ${fileName || 'Unknown file'} (file not available)`);
                addToast({
                  type: 'info',
                  title: 'Analysis restored',
                  description: 'Your previous CAD analysis is available (file not restored)'
                });
              });
          } else {
            setSampleLoadSuccess(`Previous analysis restored: ${fileName || 'Unknown file'} (file not available)`);
            addToast({
              type: 'info',
              title: 'Analysis restored',
              description: 'Your previous CAD analysis is available'
            });
          }
        } else {
          localStorage.removeItem('cadAnalyzerResults');
        }
      } catch (error) {
        console.error('Error restoring analysis:', error);
        localStorage.removeItem('cadAnalyzerResults');
      }
    }
  }, [addToast]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('showResults') === 'true') {
      const storedResult = sessionStorage.getItem('cadAnalysisResult');
      if (storedResult) {
        try {
          const analysisData = JSON.parse(storedResult);
          setAnalysis(analysisData);
          sessionStorage.removeItem('cadAnalysisResult');
          window.history.replaceState({}, '', '/cad-analyzer');
          setSampleLoadSuccess('Analysis results loaded successfully!');

          // Clear localStorage when new analysis is loaded
          localStorage.removeItem('cadAnalyzerResults');
        } catch (error) {
          console.error('Error parsing stored analysis result:', error);
        }
      }
    }

    if (urlParams.get('autoAnalyze') === 'true') {
      const storedFile = sessionStorage.getItem('cadFileToAnalyze');
      if (storedFile) {
        try {
          const fileData = JSON.parse(storedFile);

          let base64Data = fileData.data;
          if (base64Data.startsWith('data:')) {
            const parts = base64Data.split(',');
            base64Data = parts.length > 1 ? parts[1] : base64Data.replace(/^data:.*;base64,/, '');
          }

          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const mimeTypes: Record<string, string> = {
            'step': 'application/step',
            'stp': 'application/step',
            'stl': 'model/stl',
            'obj': 'model/obj',
            'dxf': 'application/dxf',
            'gltf': 'model/gltf+json',
            'glb': 'model/gltf-binary',
          };

          const mimeType = mimeTypes[fileData.type.toLowerCase()] || 'application/octet-stream';
          const file = new File([bytes], fileData.name, { type: mimeType });

          setUploadState({
            file,
            progress: 0,
            status: 'idle',
            error: undefined
          });

          sessionStorage.removeItem('cadFileToAnalyze');
          window.history.replaceState({}, '', '/cad-analyzer');
          setSampleLoadSuccess('Preparing analysis from CAD Generator...');
          setAnalysisRequested(true);
        } catch (error) {
          console.error('Error loading file from storage:', error);
          sessionStorage.removeItem('cadFileToAnalyze');
        }
      }
    }
  }, []);

  const handleStartAnalysis = useCallback(async () => {
    const targetFile = pendingSampleFile ?? uploadState.file;

    if (!targetFile || uploadState.status === 'uploading') {
      return;
    }

    if (pendingSampleFile) {
      setUploadState({
        file: pendingSampleFile,
        progress: 0,
        status: 'idle',
        error: undefined,
      });
      setPendingSampleFile(null);
    }

    if (pendingSampleAnalysisKey) {
      // Simulate progress for sample drawings to match real analysis UX
      setUploadState((prev) => ({ ...prev, status: 'uploading', progress: 0 }));
      setDrawingAnalysisProgress(0);
      setDrawingAnalysisStage('Loading sample data...');

      await new Promise(resolve => setTimeout(resolve, 400));
      setDrawingAnalysisProgress(25);
      setDrawingAnalysisStage('Processing cached analysis...');

      await new Promise(resolve => setTimeout(resolve, 400));
      setDrawingAnalysisProgress(60);
      setDrawingAnalysisStage('Preparing results...');

      await new Promise(resolve => setTimeout(resolve, 400));
      setDrawingAnalysisProgress(90);
      setDrawingAnalysisStage('Finalizing...');

      await new Promise(resolve => setTimeout(resolve, 300));
      setDrawingAnalysisProgress(100);
      setDrawingAnalysisStage('Complete!');

      const cached = cloneSampleAnalysis(pendingSampleAnalysisKey);
      setAnalysis(cached);
      setPendingSampleAnalysisKey(null);

      setUploadState((prev) => ({ ...prev, status: 'idle', progress: 100 }));
      addToast({ type: 'success', title: 'Sample analysis loaded' });

      // Reset progress after a short delay
      setTimeout(() => {
        setDrawingAnalysisProgress(0);
        setDrawingAnalysisStage(null);
      }, 1000);
      return;
    }

    setAnalysisRequested(true);
  }, [
    pendingSampleFile,
    uploadState.file,
    uploadState.status,
    pendingSampleAnalysisKey,
    cloneSampleAnalysis,
    addToast,
  ]);

  const runManufacturingAnalysis = async () => {
    if (!cadModelData) {
      console.warn('No CAD model data available for analysis');
      return;
    }

    setIsAnalyzingManufacturing(true);
    setAnalysisProgress(0);

    try {
      setAnalysisStage('Preparing analysis...');
      setAnalysisProgress(20);
      await new Promise(resolve => setTimeout(resolve, 300));

      setAnalysisStage('Generating validation results...');
      setAnalysisProgress(50);
      await new Promise(resolve => setTimeout(resolve, 300));

      const mfgResults = convertManufacturingDataToUI(cadModelData);
      const specResults = convertSpecificationDataToUI(cadModelData);

      setAnalysisProgress(80);
      await new Promise(resolve => setTimeout(resolve, 200));

      setManufacturabilityResults(mfgResults);
      setSpecificationResults(specResults);

      setAnalysisStage('Analysis complete!');
      setAnalysisProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      addToast({
        type: 'success',
        title: 'Manufacturing analysis complete'
      });

      console.log('Manufacturing validation results generated:', {
        manufacturability: mfgResults.length,
        specifications: specResults.length,
        holes: cadModelData.holeAnalysis?.count || 0,
        thickness: cadModelData.thicknessAnalysis?.estimatedThickness || 0,
        welds: cadModelData.weldJointAnalysis?.totalJoints || 0
      });

    } catch (error) {
      console.error('Error generating manufacturing validation:', error);
      setAnalysisStage('Analysis failed');
      addToast({
        type: 'error',
        title: 'Manufacturing analysis failed'
      });

      setManufacturabilityResults([
        {
          check: 'Manufacturing Analysis Error',
          value: 'Failed',
          requirement: 'N/A',
          status: 'Invalid',
          message: 'Unable to generate validation results. ' + (error instanceof Error ? error.message : 'Unknown error'),
        },
      ]);
    } finally {
      setIsAnalyzingManufacturing(false);
      setAnalysisStage(null);
      setAnalysisProgress(0);
    }
  };

  // Report generation functions
  const generateComprehensiveReport = () => {
    const timestamp = new Date().toLocaleString();
    const fileName = uploadState.file?.name || 'Unknown File';

    let report = '';

    report += '═══════════════════════════════════════════════════════════════\n';
    report += '              CAD MODEL ANALYSIS REPORT\n';
    report += '═══════════════════════════════════════════════════════════════\n\n';
    report += `File Name: ${fileName}\n`;
    report += `Analysis Date: ${timestamp}\n`;
    report += `Analysis ID: ${analysis?.analysisId || 'N/A'}\n\n`;

    report += '───────────────────────────────────────────────────────────────\n';
    report += '1. EXECUTIVE SUMMARY\n';
    report += '───────────────────────────────────────────────────────────────\n\n';

    if (analysis) {
      report += `Confidence Level: ${Math.round(analysis.confidence * 100)}%\n`;
      report += `Component Type: ${analysis.extractedSpecs.componentType || 'Not specified'}\n`;
      report += `Analysis: ${analysis.reasoning}\n\n`;
    }

    const totalChecks = manufacturabilityResults.length + specificationResults.length;
    const validChecks = [
      ...manufacturabilityResults.filter(r => r.status === 'Valid'),
      ...specificationResults.filter(r => r.status === 'Valid')
    ].length;
    const warningChecks = [
      ...manufacturabilityResults.filter(r => r.status === 'Warning'),
      ...specificationResults.filter(r => r.status === 'Warning' || r.status === 'Missing')
    ].length;
    const invalidChecks = [
      ...manufacturabilityResults.filter(r => r.status === 'Invalid'),
      ...specificationResults.filter(r => r.status === 'Invalid')
    ].length;

    report += `Overall Status: ${invalidChecks === 0 ? (warningChecks === 0 ? 'PASS' : 'PASS WITH WARNINGS') : 'FAIL'}\n`;
    report += `Total Checks: ${totalChecks}\n`;
    report += `  ✓ Valid: ${validChecks}\n`;
    report += `  ⚠ Warnings: ${warningChecks}\n`;
    report += `  ✗ Issues: ${invalidChecks}\n\n`;

    // Extracted Specifications
    if (analysis) {
      report += '───────────────────────────────────────────────────────────────\n';
      report += '2. EXTRACTED SPECIFICATIONS\n';
      report += '───────────────────────────────────────────────────────────────\n\n';

      Object.entries(analysis.extractedSpecs).forEach(([key, value]) => {
        if (value) {
          const displayValue = typeof value === 'object' && value !== null
            ? Object.entries(value).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
            : String(value);
          if (displayValue) {
            report += `${key.replace(/([A-Z])/g, ' $1').trim()}: ${displayValue}\n`;
          }
        }
      });
      report += '\n';
    }

    // Manufacturability Results
    if (manufacturabilityResults.length > 0) {
      report += '───────────────────────────────────────────────────────────────\n';
      report += '3. MANUFACTURABILITY VALIDATION\n';
      report += '───────────────────────────────────────────────────────────────\n\n';

      manufacturabilityResults.forEach((result, index) => {
        const statusIcon = result.status === 'Valid' ? '✓' : result.status === 'Warning' ? '⚠' : '✗';
        report += `${index + 1}. [${statusIcon}] ${result.check}\n`;
        report += `   Status: ${result.status}\n`;
        report += `   Value: ${result.value} | Requirement: ${result.requirement}\n`;
        report += `   ${result.message}\n`;
        if (result.suggestion) {
          report += `   → Suggestion: ${result.suggestion}\n`;
        }
        report += '\n';
      });
    }

    // Specification Results
    if (specificationResults.length > 0) {
      report += '───────────────────────────────────────────────────────────────\n';
      report += '4. SPECIFICATION VERIFICATION\n';
      report += '───────────────────────────────────────────────────────────────\n\n';

      specificationResults.forEach((result, index) => {
        const statusIcon = result.status === 'Valid' ? '✓' : result.status === 'Missing' ? '?' : '✗';
        report += `${index + 1}. [${statusIcon}] ${result.specification}\n`;
        report += `   Status: ${result.status} | Verified: ${result.verified ? 'Yes' : 'No'}\n`;
        report += `   Value: ${result.value}\n`;
        report += `   Standard: ${result.standard}\n`;
        if (result.notes) {
          report += `   Notes: ${result.notes}\n`;
        }
        report += '\n';
      });
    }

    report += '═══════════════════════════════════════════════════════════════\n';
    report += '                    END OF REPORT\n';
    report += `                Generated by SteelSmart AI\n`;
    report += '═══════════════════════════════════════════════════════════════\n';

    return report;
  };

  /** Generate styled HTML report for PDF printing */
  const generateHTMLReport = () => {
    const timestamp = new Date().toLocaleString();
    const fileName = uploadState.file?.name || 'Unknown File';

    const totalChecks = manufacturabilityResults.length + specificationResults.length;
    const validChecks = [...manufacturabilityResults.filter(r => r.status === 'Valid'), ...specificationResults.filter(r => r.status === 'Valid')].length;
    const warningChecks = [...manufacturabilityResults.filter(r => r.status === 'Warning'), ...specificationResults.filter(r => r.status === 'Warning' || r.status === 'Missing')].length;
    const invalidChecks = [...manufacturabilityResults.filter(r => r.status === 'Invalid'), ...specificationResults.filter(r => r.status === 'Invalid')].length;
    const overallStatus = invalidChecks === 0 ? (warningChecks === 0 ? 'PASS' : 'PASS WITH WARNINGS') : 'NEEDS ATTENTION';
    const statusColor = invalidChecks > 0 ? '#dc2626' : warningChecks > 0 ? '#d97706' : '#059669';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CAD Analysis Report - ${fileName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.6; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #2563eb; font-size: 28px; margin-bottom: 5px; }
    .header .subtitle { color: #6b7280; font-size: 14px; }
    .meta-info { display: flex; justify-content: space-between; background: #f8fafc; padding: 15px 20px; border-radius: 8px; margin-bottom: 25px; font-size: 13px; }
    .meta-info div { text-align: center; }
    .meta-info .label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-info .value { font-weight: 600; color: #1f2937; margin-top: 3px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
    .summary-card { padding: 20px; border-radius: 10px; text-align: center; }
    .summary-card.status { background: ${statusColor}15; border: 2px solid ${statusColor}40; }
    .summary-card.status .value { color: ${statusColor}; font-size: 20px; font-weight: 700; }
    .summary-card.confidence { background: #f0f9ff; border: 2px solid #bae6fd; }
    .summary-card.confidence .value { color: #0369a1; font-size: 32px; font-weight: 700; }
    .summary-card.checks { background: #f8fafc; border: 2px solid #e2e8f0; }
    .summary-card .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; }
    .checks-breakdown { display: flex; justify-content: space-around; margin-top: 10px; font-size: 12px; }
    .checks-breakdown .item { text-align: center; }
    .checks-breakdown .pass { color: #059669; }
    .checks-breakdown .warn { color: #d97706; }
    .checks-breakdown .fail { color: #dc2626; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 16px; font-weight: 600; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
    .section-title::before { content: ''; width: 4px; height: 20px; background: #2563eb; border-radius: 2px; }
    .specs-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .spec-item { background: #f8fafc; padding: 12px 15px; border-radius: 6px; border-left: 3px solid #2563eb; }
    .spec-item .key { font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }
    .spec-item .value { font-weight: 600; color: #1f2937; margin-top: 2px; }
    .result-item { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 12px; }
    .result-item.valid { border-left: 4px solid #059669; }
    .result-item.warning { border-left: 4px solid #d97706; }
    .result-item.invalid { border-left: 4px solid #dc2626; }
    .result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .result-title { font-weight: 600; color: #1f2937; }
    .result-status { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
    .result-status.valid { background: #d1fae5; color: #065f46; }
    .result-status.warning { background: #fef3c7; color: #92400e; }
    .result-status.invalid { background: #fee2e2; color: #991b1b; }
    .result-details { font-size: 13px; color: #4b5563; }
    .result-details .row { margin-bottom: 4px; }
    .result-suggestion { background: #eff6ff; padding: 10px 12px; border-radius: 6px; margin-top: 10px; font-size: 12px; color: #1e40af; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
    .footer .brand { color: #2563eb; font-weight: 600; }
  </style>
  <style media="print">
    /* A4 Vertical Layout Settings for Print */
    html, body { 
      width: 210mm; 
      min-height: 297mm;
      padding: 0;
      margin: 0;
      font-size: 11px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body { 
      padding: 15mm 15mm 20mm 15mm; 
      max-width: none;
    }
    .header { 
      padding-bottom: 15px; 
      margin-bottom: 20px;
      page-break-after: avoid;
    }
    .header h1 { font-size: 22px; }
    .meta-info { 
      padding: 10px 15px; 
      margin-bottom: 15px; 
      font-size: 10px;
      page-break-after: avoid;
    }
    .summary-grid { 
      grid-template-columns: repeat(3, 1fr); 
      gap: 10px;
      margin-bottom: 20px;
      page-break-after: avoid;
      page-break-inside: avoid;
    }
    .summary-card { padding: 12px; }
    .summary-card.confidence .value { font-size: 24px; }
    .summary-card.status .value { font-size: 16px; }
    .section { 
      margin-bottom: 20px; 
      margin-top: 30px;
      page-break-inside: avoid;
    }
    .section-title { 
      font-size: 14px; 
      margin-bottom: 10px;
      padding-top: 10px;
    }
    .specs-grid { 
      gap: 8px;
      page-break-inside: avoid;
    }
    .spec-item { padding: 8px 10px; }
    .result-item { 
      padding: 10px; 
      margin-bottom: 8px; 
      page-break-inside: avoid;
    }
    .result-suggestion { padding: 8px 10px; font-size: 10px; }
    .footer { 
      margin-top: 20px; 
      padding-top: 15px; 
      font-size: 10px;
      page-break-inside: avoid;
    }
  </style>
  <style type="text/css" media="print">
    @page { 
      size: A4 portrait; 
      margin: 15mm 15mm 20mm 15mm;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>CAD Model Analysis Report</h1>
    <p class="subtitle">Comprehensive manufacturing and specification analysis</p>
  </div>
  
  <div class="meta-info">
    <div><span class="label">File Name</span><div class="value">${fileName}</div></div>
    <div><span class="label">Analysis Date</span><div class="value">${timestamp}</div></div>
    <div><span class="label">Report ID</span><div class="value">${analysis?.analysisId || 'N/A'}</div></div>
  </div>
  
  <div class="summary-grid">
    <div class="summary-card status">
      <div class="label">Overall Status</div>
      <div class="value">${overallStatus}</div>
    </div>
    <div class="summary-card confidence">
      <div class="label">AI Confidence</div>
      <div class="value">${analysis ? Math.round(analysis.confidence * 100) : 0}%</div>
    </div>
    <div class="summary-card checks">
      <div class="label">Quality Checks</div>
      <div class="checks-breakdown">
        <div class="item pass"><strong>${validChecks}</strong><br/>Pass</div>
        <div class="item warn"><strong>${warningChecks}</strong><br/>Warn</div>
        <div class="item fail"><strong>${invalidChecks}</strong><br/>Fail</div>
      </div>
    </div>
  </div>
  
  ${analysis ? `
  <div class="section">
    <h2 class="section-title">Extracted Specifications</h2>
    <div class="specs-grid">
      ${Object.entries(analysis.extractedSpecs).map(([key, value]) => {
      if (!value) return '';
      const displayValue = typeof value === 'object' && value !== null
        ? Object.entries(value).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
        : String(value);
      return displayValue ? `<div class="spec-item"><div class="key">${key.replace(/([A-Z])/g, ' $1').trim()}</div><div class="value">${displayValue}</div></div>` : '';
    }).join('')}
    </div>
    <p style="margin-top: 15px; font-size: 13px; color: #6b7280;"><strong>Analysis:</strong> ${analysis.reasoning}</p>
  </div>
  ` : ''}
  
  ${manufacturabilityResults.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Manufacturability Validation</h2>
    ${manufacturabilityResults.map(r => `
      <div class="result-item ${r.status.toLowerCase()}">
        <div class="result-header">
          <span class="result-title">${r.check}</span>
          <span class="result-status ${r.status.toLowerCase()}">${r.status}</span>
        </div>
        <div class="result-details">
          <div class="row"><strong>Value:</strong> ${r.value} | <strong>Requirement:</strong> ${r.requirement}</div>
          <div class="row">${r.message}</div>
        </div>
        ${r.suggestion ? `<div class="result-suggestion">💡 ${r.suggestion}</div>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  ${specificationResults.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Specification Verification</h2>
    ${specificationResults.map(r => `
      <div class="result-item ${r.status.toLowerCase()}">
        <div class="result-header">
          <span class="result-title">${r.specification}</span>
          <span class="result-status ${r.status.toLowerCase()}">${r.status}</span>
        </div>
        <div class="result-details">
          <div class="row"><strong>Value:</strong> ${r.value}</div>
          <div class="row"><strong>Standard:</strong> ${r.standard}</div>
          ${r.notes ? `<div class="row">${r.notes}</div>` : ''}
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  <div class="footer">
    <p>Generated by <span class="brand">SteelSmart AI</span> • ${timestamp}</p>
    <p style="margin-top: 5px;">This report is for reference purposes. Always verify critical specifications.</p>
  </div>
</body>
</html>`;
  };

  const generateReport = async (forceRegenerate = false) => {
    if (!analysis && !cadModelData) return;

    setIsGeneratingReport(true);

    // Run manufacturing analysis first if not already done and we have CAD data
    const needsManufacturingAnalysis = cadModelData &&
      manufacturabilityResults.length === 0 &&
      specificationResults.length === 0;

    if (needsManufacturingAnalysis) {
      addToast({
        type: 'info',
        title: 'Running manufacturing analysis...',
        description: 'This is required before generating the report.'
      });
      await runManufacturingAnalysis();
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    setReportGenerated(true);
    setReportTimestamp(new Date().toLocaleString());
    setIsGeneratingReport(false);

    if (!forceRegenerate) {
      setShowReportModal(true);
    }

    addToast({
      type: 'success',
      title: forceRegenerate ? 'Report regenerated successfully' : 'Report generated successfully'
    });
  };

  const downloadReport = (format: 'pdf' | 'txt') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileBaseName = uploadState.file?.name.split('.')[0] || 'analysis';

    if (format === 'txt') {
      const reportContent = generateComprehensiveReport();
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileBaseName}_report_${timestamp}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Use styled HTML report for PDF
      const htmlContent = generateHTMLReport();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }
  };

  const reportSummary = useMemo(() => {
    const totalChecks = manufacturabilityResults.length + specificationResults.length;
    const invalid = manufacturabilityResults.filter(r => r.status === 'Invalid').length +
      specificationResults.filter(r => r.status === 'Invalid').length;
    const warnings = manufacturabilityResults.filter(r => r.status === 'Warning').length +
      specificationResults.filter(r => r.status === 'Warning' || r.status === 'Missing').length;
    const passes = Math.max(0, totalChecks - invalid - warnings);

    const statusLabel = invalid > 0 ? 'Needs Attention' : warnings > 0 ? 'Review Warnings' : 'Production Ready';
    const statusDescription = invalid > 0
      ? 'Resolve blocking compliance issues before releasing to manufacturing.'
      : warnings > 0
        ? 'Minor advisories detected. Review before final approval.'
        : 'All checks passed. Ready for procurement.';

    const tone = invalid > 0
      ? { badge: 'bg-red-50 text-red-700 border-red-100', accent: 'text-red-600', chip: 'bg-red-100 text-red-800' }
      : warnings > 0
        ? { badge: 'bg-amber-50 text-amber-700 border-amber-100', accent: 'text-amber-600', chip: 'bg-amber-100 text-amber-800' }
        : { badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', accent: 'text-emerald-600', chip: 'bg-emerald-100 text-emerald-800' };

    return {
      totalChecks,
      invalid,
      warnings,
      passes,
      statusLabel,
      statusDescription,
      tone,
    };
  }, [manufacturabilityResults, specificationResults]);

  const keyFindings = useMemo<KeyFinding[]>(() => {
    const issues: KeyFinding[] = [
      ...manufacturabilityResults
        .filter((result) => result.status !== 'Valid')
        .map((result) => ({
          title: result.check,
          status: result.status,
          message: result.message,
          detail: `${result.value} • Req: ${result.requirement}`,
          suggestion: result.suggestion,
        })),
      ...specificationResults
        .filter((result) => result.status === 'Warning' || result.status === 'Invalid' || result.status === 'Missing')
        .map((result) => ({
          title: result.specification,
          status: result.status === 'Missing' ? 'Warning' : result.status,
          message: result.notes || result.value,
          detail: result.standard,
        })),
    ];

    if (issues.length === 0) {
      return [{
        title: 'All checks passed',
        status: 'Valid',
        message: 'No warnings or blocking issues detected in manufacturability or specifications.',
        detail: 'Full compliance achieved',
      }];
    }

    return issues.slice(0, 4);
  }, [manufacturabilityResults, specificationResults]);

  const recommendationList = useMemo(() => {
    const manufacturingSuggestions = manufacturabilityResults
      .filter((result) => result.suggestion)
      .map((result) => result.suggestion as string);

    const specificationNotes = specificationResults
      .filter((result) => result.status === 'Invalid' || result.status === 'Warning')
      .map((result) => result.notes || result.value)
      .filter(Boolean) as string[];

    const combined = [...manufacturingSuggestions, ...specificationNotes];

    if (combined.length === 0) {
      return ['Maintain current configuration — all standards satisfied.'];
    }

    return combined.slice(0, 5);
  }, [manufacturabilityResults, specificationResults]);

  // Handler functions for sub-components
  const handleGetRecommendations = () => {
    if (!analysis) return;
    
    // Phrases to strip from dimension values (case-insensitive)
    const irrelevantPhrases = [
      'extracted from cad data',
      'based on 3d cad data',
      'custom (based on 3d cad data)',
      'from cad analysis',
      'cad extracted',
      'n/a',
      'not available',
      'unknown',
    ];
    
    // Helper to clean dimension value (remove trailing " inch symbol and irrelevant phrases)
    const cleanValue = (val: unknown): string => {
      if (!val) return '';
      let str = String(val);
      // Remove trailing " (inch symbol) for cleaner display
      str = str.replace(/"$/, '').trim();
      // Remove irrelevant phrases
      const lowerStr = str.toLowerCase();
      for (const phrase of irrelevantPhrases) {
        if (lowerStr.includes(phrase)) {
          str = str.replace(new RegExp(phrase, 'gi'), '').trim();
        }
      }
      // Clean up any leftover punctuation from removed phrases
      str = str.replace(/^[,\s:]+|[,\s:]+$/g, '').trim();
      return str;
    };
    
    // Helper to convert dimensions object to string
    const formatDimensions = (dims: unknown): string => {
      if (!dims) return '';
      if (typeof dims === 'string') return cleanValue(dims);
      if (typeof dims === 'object' && dims !== null) {
        // Extract meaningful dimension values from object
        const dimObj = dims as Record<string, unknown>;
        const parts: string[] = [];
        
        // Priority: look for common dimension keys
        if (dimObj.boundingBox && typeof dimObj.boundingBox === 'string') {
          const cleaned = cleanValue(dimObj.boundingBox);
          if (cleaned) parts.push(cleaned);
        }
        if (dimObj.width) {
          const cleaned = cleanValue(dimObj.width);
          if (cleaned) parts.push(`Width: ${cleaned}`);
        }
        if (dimObj.height) {
          const cleaned = cleanValue(dimObj.height);
          if (cleaned) parts.push(`Height: ${cleaned}`);
        }
        if (dimObj.depth) {
          const cleaned = cleanValue(dimObj.depth);
          if (cleaned) parts.push(`Depth: ${cleaned}`);
        }
        if (dimObj.length) {
          const cleaned = cleanValue(dimObj.length);
          if (cleaned) parts.push(`Length: ${cleaned}`);
        }
        if (dimObj.diameter) {
          const cleaned = cleanValue(dimObj.diameter);
          if (cleaned) parts.push(`Diameter: ${cleaned}`);
        }
        if (dimObj.materialThickness) {
          const cleaned = cleanValue(dimObj.materialThickness);
          if (cleaned) parts.push(`Thickness: ${cleaned}`);
        }
        
        return parts.length > 0 ? parts.join(', ') : '';
      }
      return cleanValue(dims);
    };
    
    const analysisData = {
      drawingName: uploadState.file?.name || 'Analyzed Drawing',
      extractedSpecs: {
        ...analysis.extractedSpecs,
        // Use productName if available, otherwise fall back to componentType
        productName: analysis.extractedSpecs.productName || analysis.extractedSpecs.componentType || '',
        // Ensure dimensions is a string, not an object
        dimensions: formatDimensions(analysis.extractedSpecs.dimensions),
      },
      confidence: analysis.confidence
    };
    sessionStorage.setItem('analysisForRecommendation', JSON.stringify(analysisData));
    window.location.href = '/product-recommender?fromAnalysis=true';
  };

  const handleBrowseCatalog = () => {
    window.open('/catalog', '_blank');
  };

  const handleCreateRFQ = () => {
    if (!analysis) return;
    const rfqData = {
      drawingName: uploadState.file?.name || 'Analyzed Drawing',
      specifications: Object.entries(analysis.extractedSpecs)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', '),
      material: analysis.extractedSpecs.material || 'Steel',
      analysisConfidence: analysis.confidence
    };
    sessionStorage.setItem('analysisForRFQ', JSON.stringify(rfqData));
    window.location.href = '/rfq?fromAnalysis=true';
  };

  const handleViewManufacturability = () => {
    setActiveTab('validation');
    pendingScrollRef.current = 'validation';
    scrollToSection(validationRef);
  };

  const handleViewSpecifications = () => {
    setActiveTab('verification');
    pendingScrollRef.current = 'verification';
    scrollToSection(verificationRef);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column - Upload and Controls - 40% width on desktop */}
      <div className="w-full lg:w-[40%] space-y-6">
        {/* File Upload Section */}
        <UploadSection
          uploadState={uploadState}
          onDrop={onDrop}
          onAnalyze={handleStartAnalysis}
          onReset={resetAnalysis}
          sampleLoadSuccess={sampleLoadSuccess}
          maxSizeInMB={maxSizeInMB}
          isAnalyzing={isAnalysisRunning}
          hasPendingSample={!!pendingSampleFile}
        />

        {/* Sample Drawings */}
        {showSampleDrawings && (
          <SampleDrawings
            samples={templateSamples}
            onLoadSample={loadSampleFromStep}
          />
        )}

        {/* 2D View Extractor */}
        {show2DExtractor && (
          <div className="glass-container glass-container-with-liquid p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2"></h3>
            <ErrorBoundary fallback={CADIslandErrorFallback}>
              <CAD2DViewExtractor
                cadModelData={cadModelData}
                fileName={uploadState.file ? uploadState.file.name.split('.')[0] : 'model'}
                disabled={!is2DExtractorReady}
                loadingMessage={
                  isParsingModel
                    ? 'Parsing CAD geometry...'
                    : !cadModelData
                      ? 'Loading CAD model...'
                      : !isModelPreviewReady
                        ? 'Rendering 3D preview...'
                        : undefined
                }
              />
            </ErrorBoundary>
          </div>
        )}
      </div>

      {/* Right Column - Analysis Results - 60% width on desktop */}
      <div className="w-full lg:w-[60%] space-y-6">
        {analysis ? (
          <>
            {/* Tab Navigation */}
            <div className="glass-container glass-container-with-liquid">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-6 px-6 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'analysis'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Analysis Results
                  </button>
                  <button
                    onClick={() => setActiveTab('validation')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'validation'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Manufacturability
                    {manufacturabilityResults.length > 0 && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {manufacturabilityResults.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('verification')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'verification'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Specifications
                    {specificationResults.length > 0 && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {specificationResults.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('report')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'report'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Report
                    {reportGenerated && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ready
                      </span>
                    )}
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'analysis' && (
                  <div className="space-y-6">
                    {/* 3D Model Preview */}
                    {uploadState.file && is3DFile && (
                      <div className="glass-container glass-container-with-liquid p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">3D Model Preview</h3>
                        {modelParseError ? (
                          <div className="w-full h-[350px] md:h-[400px] border-2 border-red-200 rounded-lg flex flex-col items-center justify-center text-center p-6 bg-red-50">
                            <svg className="w-10 h-10 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-base font-semibold text-red-700">Unable to load 3D preview</p>
                            <p className="text-sm text-red-600 mt-2">{modelParseError}</p>
                          </div>
                        ) : isParsingModel || !cadModelData ? (
                          <div className="w-full h-[350px] md:h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center px-6">
                            <LoadingSpinner />
                            <p className="mt-4 text-sm text-gray-600 font-medium">Parsing CAD geometry...</p>
                          </div>
                        ) : (
                          <ErrorBoundary
                            key={`cad-preview-${previewResetKey}-${uploadState.file.name}-${uploadState.file.lastModified}`}
                            fallback={CADIslandErrorFallback}
                          >
                            <Suspense fallback={<CADPreviewLoadingFallback />}>
                              <CADPreview3D
                                file={uploadState.file}
                                modelData={cadModelData || undefined}
                                showStats={true}
                                className="!h-[350px] md:!h-[400px]"
                                onPreviewLoaded={setIsModelPreviewReady}
                                onModelDataParsed={(data) => {
                                  setCADModelData(data);
                                  cadModelDataRef.current = data;
                                }}
                              />
                            </Suspense>
                          </ErrorBoundary>
                        )}
                      </div>
                    )}

                    {/* Analysis Results with Manufacturing Section */}
                    <AnalysisResults
                      analysis={analysis}
                      fileName={uploadState.file?.name}
                      onGetRecommendations={handleGetRecommendations}
                      onBrowseCatalog={handleBrowseCatalog}
                      onCreateRFQ={handleCreateRFQ}
                      manufacturingSlot={
                        is3DFile && cadModelData ? (
                          <ManufacturingSection
                            hasResults={manufacturabilityResults.length > 0}
                            isAnalyzing={isAnalyzingManufacturing}
                            analysisStage={analysisStage}
                            analysisProgress={analysisProgress}
                            onRunAnalysis={runManufacturingAnalysis}
                            onViewManufacturability={handleViewManufacturability}
                            onViewSpecifications={handleViewSpecifications}
                          />
                        ) : undefined
                      }
                    />
                  </div>
                )}

                {activeTab === 'validation' && (
                  <div ref={validationRef}>
                    <Suspense fallback={<TabLoadingFallback />}>
                      <ValidationTab
                        results={manufacturabilityResults}
                        isAnalyzing={isAnalyzingManufacturing}
                        onRunAnalysis={runManufacturingAnalysis}
                      />
                    </Suspense>
                  </div>
                )}

                {activeTab === 'verification' && (
                  <div ref={verificationRef}>
                    <Suspense fallback={<TabLoadingFallback />}>
                      <VerificationTab
                        results={specificationResults}
                        isAnalyzing={isAnalyzingManufacturing}
                        onRunAnalysis={runManufacturingAnalysis}
                      />
                    </Suspense>
                  </div>
                )}

                {activeTab === 'report' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Analysis Report</h3>
                      <div className="flex items-center gap-2">
                        {reportGenerated && (
                          <Button
                            onClick={() => generateReport(true)}
                            disabled={isGeneratingReport}
                            size="sm"
                            variant="outline"
                          >
                            {isGeneratingReport ? <LoadingSpinner size="sm" /> : 'Regenerate'}
                          </Button>
                        )}
                        {!reportGenerated && (
                          <Button onClick={() => generateReport()} disabled={isGeneratingReport} size="sm">
                            {isGeneratingReport ? <LoadingSpinner size="sm" /> : 'Generate Report'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {reportGenerated ? (
                      <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className={`glass-card p-5 ${reportSummary.tone.badge}`}>
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Overall Status</p>
                            <p className={`mt-2 text-2xl font-semibold ${reportSummary.tone.accent}`}>
                              {reportSummary.statusLabel}
                            </p>
                            <p className="text-sm mt-3">{reportSummary.statusDescription}</p>
                          </div>
                          <div className="glass-card p-5">
                            <p className="text-xs uppercase tracking-[0.25em] text-gray-500">AI Confidence</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                              {analysis ? `${Math.round(analysis.confidence * 100)}%` : '—'}
                            </p>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${analysis ? Math.round(analysis.confidence * 100) : 0}%` }}
                              />
                            </div>
                          </div>
                          <div className="glass-card p-5">
                            <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Check Breakdown</p>
                            <div className="mt-3 space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Total</span>
                                <span className="font-semibold text-gray-900">{reportSummary.totalChecks}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-gray-500">
                                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Pass
                                </span>
                                <span className="font-semibold text-emerald-600">{reportSummary.passes}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-gray-500">
                                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span> Warnings
                                </span>
                                <span className="font-semibold text-amber-600">{reportSummary.warnings}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-gray-500">
                                  <span className="w-2 h-2 bg-red-500 rounded-full"></span> Issues
                                </span>
                                <span className="font-semibold text-red-600">{reportSummary.invalid}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Key Findings Preview */}
                        {keyFindings.length > 0 && (
                          <div className="glass-card p-5">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Key Findings
                            </h4>
                            <div className="space-y-2">
                              {keyFindings.slice(0, 3).map((finding, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-start gap-3 p-3 rounded-lg ${finding.status === 'Valid' ? 'bg-emerald-50' :
                                    finding.status === 'Warning' ? 'bg-amber-50' : 'bg-red-50'
                                    }`}
                                >
                                  <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${finding.status === 'Valid' ? 'bg-emerald-500 text-white' :
                                    finding.status === 'Warning' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                                    }`}>
                                    {finding.status === 'Valid' ? '✓' : finding.status === 'Warning' ? '!' : '✗'}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{finding.title}</p>
                                    <p className="text-xs text-gray-600 mt-0.5">{finding.message}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendations Preview */}
                        {recommendationList.length > 0 && (
                          <div className="glass-card p-5">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              Recommendations
                            </h4>
                            <ul className="space-y-2">
                              {recommendationList.slice(0, 3).map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="text-blue-500 mt-1">→</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Report Metadata */}
                        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                          <span>Generated: {reportTimestamp}</span>
                          <span>Report ID: {analysis?.analysisId || 'N/A'}</span>
                        </div>

                        {/* Download Buttons */}
                        <div className="flex flex-wrap gap-3">
                          <Button onClick={() => downloadReport('pdf')} className="flex-1 min-w-[160px]">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download PDF
                          </Button>
                          <Button onClick={() => downloadReport('txt')} variant="outline" className="flex-1 min-w-[160px]">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Text
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="glass-card text-center py-12 text-gray-500 border border-dashed border-gray-200">
                        <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-900">No report generated yet</p>
                        <p className="text-sm mt-2 text-gray-500">
                          Click "Generate Report" to create a comprehensive analysis summary.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card p-6 text-center text-gray-600">
            {isAnalysisRunning ? (
              <>
                <div className="w-16 h-16 rounded-full bg-blue-50 mx-auto mb-4 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Analyzing with AI</p>
                <p className="text-sm text-gray-600 mb-4">
                  {drawingAnalysisStage || 'Processing your drawing...'}
                </p>

                {/* Progress Bar */}
                <div className="max-w-xs mx-auto">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{drawingAnalysisProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${drawingAnalysisProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Upload</span>
                    <span>Process</span>
                    <span>AI Analysis</span>
                    <span>Done</span>
                  </div>
                </div>
              </>
            ) : isWaitingForParserBeforeAnalysis ? (
              <>
                <div className="w-16 h-16 rounded-full bg-blue-50 mx-auto mb-4 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Parsing CAD geometry</p>
                <p className="text-sm text-gray-600">
                  Extracting STEP mesh before AI analysis can begin.
                </p>
              </>
            ) : isWaitingForPreviewBeforeAnalysis ? (
              <>
                <div className="w-16 h-16 rounded-full bg-blue-50 mx-auto mb-4 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Preparing 3D Preview</p>
                <p className="text-sm text-gray-600">
                  Once the 3D model finishes loading we'll automatically run AI analysis.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Analysis</h3>
                <p className="text-gray-600">
                  {uploadState.file
                    ? 'Click "Analyze Drawing" to run AI analysis.'
                    : 'Upload a technical drawing or try a sample.'}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Analysis Report Generated">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h4 className="font-medium text-green-900">Report Ready!</h4>
              <p className="text-sm text-green-700">Your detailed analysis report has been generated successfully.</p>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <Button onClick={() => downloadReport('pdf')} className="flex-1">
              Download PDF
            </Button>
            <Button onClick={() => downloadReport('txt')} variant="outline" className="flex-1">
              Download Text
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => {
                setShowReportModal(false);
                setActiveTab('report');
              }}
              className="text-sm"
            >
              View Report Details
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CADAnalyzer;
