'use client';

import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense, startTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { cadTemplates } from '@/data/sample-data';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/ToastProvider';
import { StagedProgress, StagedProgressItem, StageStatus } from '@/components/ui/StagedProgress';
import { useCADGeneration } from '@/hooks/useCADGeneration';
import { CADGenerationRequest } from '@/services/cad-generation.service';
import { useCADStore } from '@/stores/cad.store';
import { convertBase64ToFile } from '@/lib/utils/base64-worker';

// Import sub-components
import {
  TemplateSelector,
  TextInputPanel,
  GenerationProgress,
  GeneratedDrawingDisplay,
  DrawingEditorModal,
} from '@/components/cad/generator';

// Lazy load heavy components for code splitting
const CADHistory = lazy(() => import('@/components/cad/CADHistory'));

interface GeneratedDrawing {
  id: number;
  name: string;
  description: string;
  preview: string;
  dxf: string;
  parameters?: Record<string, any>;
}

const sanitizeNumericId = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null) {
    return Date.now();
  }
  const digitsOnly = String(value).replace(/\D/g, '');
  const parsed = parseInt(digitsOnly, 10);
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

const isSupportedCategory = (category?: string): category is CADGenerationRequest['category'] => {
  return category === 'bracket' || category === 'plate' || category === 'beam' || category === 'fastener' || category === 'custom';
};

const normalizeCategory = (category?: string): CADGenerationRequest['category'] => {
  if (!category) return 'custom';
  return isSupportedCategory(category) ? category : 'custom';
};

const slugifyTemplateName = (name: string) =>
  name.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

const CADGenerator: React.FC = () => {
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  // Zustand store for CAD preferences
  const { 
    selectedFormat, 
    selectedUnits, 
    recentPrompts,
    setFormat,
    setUnits,
    clearRecentPrompts
  } = useCADStore();

  // State
  const [activeTab, setActiveTab] = useState<'text' | 'template'>('text');
  const [textInput, setTextInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [generatedDrawing, setGeneratedDrawing] = useState<GeneratedDrawing | null>(null);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editParameters, setEditParameters] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [debugSteps, setDebugSteps] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string>('');
  const [cadFileForPreview, setCadFileForPreview] = useState<File | null>(null);
  const [shouldScrollToResult, setShouldScrollToResult] = useState(false);
  const [prefilledPromptHighlight, setPrefilledPromptHighlight] = useState(false);
  const [stageDelayNotices, setStageDelayNotices] = useState<Record<string, boolean>>({});

  // React Query mutation for CAD generation
  const { mutate: generateCAD, isPending } = useCADGeneration({
    onSuccess: (result) => {
      const parameters = result.parameters ?? {};
      setGeneratedDrawing({
        id: sanitizeNumericId(result.id),
        name: `Generated CAD Model`,
        description: `AI-generated model from: "${textInput}"`,
        preview: '/images/sample-cad-preview.svg',
        dxf: `data:application/octet-stream;base64,${result.model_data}`,
        parameters: {
          format: parameters.format ?? selectedFormat,
          units: parameters.units ?? selectedUnits,
          category: parameters.category ?? 'custom',
          generated_at: parameters.generated_at ?? new Date().toISOString(),
          prompt: textInput
        }
      });

      setConversationId(result.id);
      addDebugStep('api_request', 'Generating Drawing', 'completed', 'Drawing successfully generated');
      addDebugStep('process_response', 'Retrieving Drawing', 'completed', 'Drawing data retrieved and parsed');
      addDebugStep('finalize', 'Finalize & Preview', 'completed', 'Model ready for preview');
      setShouldScrollToResult(true);
      
      addToast({ type: 'success', title: 'CAD model generated successfully' });
    },
    onError: (error) => {
      console.error('CAD generation error:', error);
      addDebugStep('api_request', 'Generating Drawing', 'failed', undefined, error.message);
      addDebugStep('process_response', 'Retrieving Drawing', 'failed', undefined, error.message);
      addDebugStep('finalize', 'Finalize & Preview', 'failed', undefined, error.message);
      
      const message = `CAD generation failed: ${error.message}`;
      setErrorMessage(message);
      addToast({ type: 'error', title: 'CAD generation failed' });
    }
  });

  // URL parameter handling
  useEffect(() => {
    const templateSlug = searchParams.get('template');
    const tabParam = searchParams.get('tab');
    if (tabParam === 'template') setActiveTab('template');
    if (templateSlug) {
      const templateMatch = cadTemplates.find(
        (template) => slugifyTemplateName(template.name) === templateSlug
      );
      if (templateMatch) {
        setSelectedTemplate(templateMatch.id);
        setActiveTab('template');
        requestAnimationFrame(() => {
          document.getElementById(`template-card-${templateSlug}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
    }
  }, [searchParams]);

  // Check for URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const promptParam = params.get('prompt');
    if (promptParam) {
      setTextInput(decodeURIComponent(promptParam));
      setPrefilledPromptHighlight(true);
      window.history.replaceState({}, '', '/cad-generator');
    }
  }, []);

  // Debug step management
  const addDebugStep = useCallback((id: string, title: string, status: 'pending' | 'in_progress' | 'completed' | 'failed', details?: string, error?: string) => {
    const timestamp = new Date().toISOString();
    setDebugSteps(prev => {
      const existing = prev.find(step => step.id === id);
      if (existing) {
        return prev.map(step => 
          step.id === id 
            ? { ...step, status, timestamp, details, error, duration: status === 'completed' || status === 'failed' ? Date.now() - new Date(step.timestamp).getTime() : undefined }
            : step
        );
      }
      return [...prev, { id, title, status, timestamp, details, error }];
    });
  }, []);

  const clearDebugSteps = useCallback(() => {
    setDebugSteps([]);
    setStageDelayNotices({});
  }, []);

  // Convert generated drawing to File for preview
  useEffect(() => {
    setCadFileForPreview(null);
    if (generatedDrawing?.dxf) {
      const timer = setTimeout(async () => {
        const format = (generatedDrawing.parameters?.format || 'step') as string;
        const result = await convertBase64ToFile({
          base64Data: generatedDrawing.dxf,
          format,
          filename: `model.${format.toLowerCase()}`
        });
        if (result.file) {
          setCadFileForPreview(result.file);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [generatedDrawing]);

  // Auto-scroll to result
  useEffect(() => {
    if (!shouldScrollToResult || !generatedDrawing) return;
    const timer = setTimeout(() => {
      const drawingElement = document.querySelector('[data-generated-drawing]');
      if (drawingElement) {
        drawingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.scrollBy({ top: -80, behavior: 'smooth' });
      }
      setShouldScrollToResult(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [shouldScrollToResult, generatedDrawing]);

  // Generation stages
  const generationStageTemplate = useMemo(() => [
    { id: 'init', label: 'Prepare Prompt', aliases: ['init', 'init_template'] },
    { id: 'api_request', label: 'Generating Drawing', aliases: ['api_request'] },
    { id: 'process_response', label: 'Retrieving Drawing', aliases: ['process_response'] },
    { id: 'finalize', label: 'Finalize & Preview', aliases: ['finalize'] },
  ], []);

  const debugStepsMap = useMemo(() => {
    const map = new Map<string, typeof debugSteps[0]>();
    debugSteps.forEach(step => map.set(step.id, step));
    return map;
  }, [debugSteps]);

  const hasStartedGeneration = useMemo(
    () => debugSteps.length > 0 || isPending,
    [debugSteps.length, isPending]
  );

  const generationStages = useMemo<StagedProgressItem[]>(() => {
    return generationStageTemplate.map((stage, index) => {
      const debug = stage.aliases.map(alias => debugStepsMap.get(alias)).find(step => step !== undefined);
      
      let status: StageStatus = 'pending';
      const messageParts: string[] = [];

      if (debug) {
        switch (debug.status) {
          case 'in_progress': status = 'active'; break;
          case 'completed': status = 'success'; break;
          case 'failed': status = 'error'; break;
        }
        if (debug.error) messageParts.push(debug.error);
        else if (debug.details) messageParts.push(debug.details);
      } else if (isPending && index === 0) {
        status = 'active';
        messageParts.push('Initializing generation...');
      }

      if (stageDelayNotices[stage.id]) {
        messageParts.push('It might take longer than expected for complex models.');
      }

      return {
        id: stage.id,
        label: stage.label,
        status,
        message: messageParts.join(' ').trim() || undefined,
      };
    });
  }, [generationStageTemplate, debugStepsMap, isPending, stageDelayNotices]);

  const visibleGenerationStages = useMemo(() => {
    if (generationStages.length === 0) return [];
    const activeIndex = generationStages.findIndex((stage) => stage.status === 'active');
    const furthestIndex = generationStages.reduce((furthest, stage, index) => {
      if (stage.status !== 'pending') return Math.max(furthest, index);
      return furthest;
    }, -1);
    const visibleUpTo = Math.max(activeIndex === -1 ? furthestIndex + 1 : activeIndex, furthestIndex);
    return generationStages.filter((_, index) => index <= visibleUpTo);
  }, [generationStages]);

  const hideAfterCompletion = !!generatedDrawing && !isPending;
  const showStageTracker = !hideAfterCompletion && hasStartedGeneration && visibleGenerationStages.length > 0;

  // Helper function to generate prompt from template
  const generatePromptFromTemplate = (template: typeof cadTemplates[0]): string => {
    const params = template.parameters as any;
    switch (template.id) {
      case 1:
        return `Generate a standard structural I-beam with length ${params.length?.value}${params.length?.unit}, height ${params.height?.value}${params.height?.unit}, flange width ${params.flangeWidth?.value}${params.flangeWidth?.unit}, flange thickness ${params.flangeThickness?.value}${params.flangeThickness?.unit}, web thickness ${params.webThickness?.value}${params.webThickness?.unit}, and root radius ${params.rootRadius?.value}${params.rootRadius?.unit}`;
      case 2:
        return `Generate a surgical drill guide with a ${params.handleLength?.value}${params.handleLength?.unit} handle, compatible with ${params.bitSize1?.value}${params.bitSize1?.unit} and ${params.bitSize2?.value}${params.bitSize2?.unit} bits, featuring twin bit mounts and rotating grips`;
      case 3:
        return `Generate a large structural Gallows frame constructed from angle iron, with dimensions ${params.height?.value}x${params.width?.value}x${params.depth?.value} ${params.height?.unit}, including ${params.bracketCount?.value} brackets`;
      case 4:
        return `Generate a vented automotive brake rotor with a diameter of ${params.diameter?.value}${params.diameter?.unit}, featuring ${params.holeCount?.value} ${params.holeType?.value} holes on a ${params.pcd?.value}${params.pcd?.unit} PCD`;
      default:
        return `Generate a ${template.name} with the default parameters`;
    }
  };

  const handleHistorySelect = useCallback((historyItem: any) => {
    let modelData = historyItem.model_data;
    if (modelData && !modelData.startsWith('data:')) {
      try {
        const sample = modelData.substring(0, Math.min(100, modelData.length));
        atob(sample);
        modelData = `data:application/octet-stream;base64,${modelData}`;
      } catch (e) {
        console.warn('Model data might not be base64, attempting to handle...');
        try {
          modelData = `data:application/octet-stream;base64,${btoa(modelData)}`;
        } catch (encodeError) {
          console.error('Failed to encode model data:', encodeError);
          modelData = null;
        }
      }
    }
    
    if (!modelData) {
      console.error('No model data available in history item');
      alert('Error: No model data available for this drawing.');
      return;
    }
    
    const drawing = {
      id: sanitizeNumericId(historyItem.id),
      name: 'Generated CAD Model (from history)',
      description: `AI-generated model from: "${historyItem.prompt}"`,
      preview: '/images/sample-cad-preview.svg',
      dxf: modelData,
      parameters: {
        format: historyItem.format || 'step',
        units: historyItem.units || 'mm',
        category: historyItem.category || 'custom',
        generated_at: historyItem.generated_at || new Date().toISOString(),
        prompt: historyItem.prompt
      }
    };
    
    setGeneratedDrawing(drawing);
    setTextInput(historyItem.prompt);
    
    setTimeout(() => {
      const drawingElement = document.querySelector('[data-generated-drawing]');
      if (drawingElement) {
        drawingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  const handleTextGeneration = useCallback(async () => {
    if (!textInput.trim()) return;
    
    startTransition(() => {
      setShouldScrollToResult(false);
      setGeneratedDrawing(null);
      setCadFileForPreview(null);
      setErrorMessage('');
    });
    
    setGenerationProgress('Initializing CAD generation...');
    clearDebugSteps();
    
    addDebugStep('init', 'Initialize Generation', 'in_progress', `Prompt: "${textInput}"`);
    setGenerationProgress('Submitting drawing request...');
    addDebugStep('init', 'Initialize Generation', 'completed');
    addDebugStep('api_request', 'Generating Drawing', 'in_progress', 'Processing your description into a CAD model');
    addDebugStep('process_response', 'Retrieving Drawing', 'in_progress', 'Retrieving generated model data');
    addDebugStep('finalize', 'Finalize & Preview', 'in_progress', 'Preparing the file for preview');
    
    generateCAD({
      description: textInput,
      category: 'custom',
      format: selectedFormat,
      units: selectedUnits
    });
  }, [textInput, selectedFormat, selectedUnits, generateCAD, addDebugStep, clearDebugSteps]);

  const handleTemplateSelect = useCallback((templateId: number) => {
    setSelectedTemplate(templateId);
    const template = cadTemplates.find((t) => t.id === templateId);
    if (template) {
      const prompt = generatePromptFromTemplate(template);
      setTextInput(prompt);
    }
  }, []);

  const handleTemplateGeneration = useCallback(async () => {
    if (selectedTemplate === null) return;

    startTransition(() => {
      setShouldScrollToResult(false);
      setGeneratedDrawing(null);
      setCadFileForPreview(null);
      setErrorMessage('');
    });

    setGenerationProgress('Preparing template for generation...');
    clearDebugSteps();

    const template = cadTemplates.find(t => t.id === selectedTemplate);
    if (!template) {
      setErrorMessage('Template not found');
      return;
    }

    addDebugStep('init_template', 'Initialize Template', 'in_progress', `Template: ${template.name}`);
    const prompt = generatePromptFromTemplate(template);
    addDebugStep('init_template', 'Initialize Template', 'completed', `Generated prompt: "${prompt}"`);
    setGenerationProgress('Submitting drawing request...');
    addDebugStep('api_request', 'Generating Drawing', 'in_progress', 'Processing template parameters into a CAD model');
    addDebugStep('process_response', 'Retrieving Drawing', 'in_progress', 'Retrieving generated model data');
    addDebugStep('finalize', 'Finalize & Preview', 'in_progress', 'Preparing the file for preview');

    generateCAD({
      description: prompt,
      category: normalizeCategory(template.category),
      format: selectedFormat,
      units: selectedUnits
    });
  }, [selectedTemplate, selectedFormat, selectedUnits, generateCAD, addDebugStep, clearDebugSteps]);

  const handleEditDrawing = useCallback(() => {
    if (!generatedDrawing) return;
    const params: Record<string, string> = {};
    if (generatedDrawing.parameters) {
      Object.keys(generatedDrawing.parameters).forEach(key => {
        params[key] = String(generatedDrawing.parameters![key]);
      });
    } else {
      params.length = '200';
      params.width = '100';
      params.thickness = '10';
      params.holes = '4';
    }
    setEditParameters(params);
    setIsEditorOpen(true);
  }, [generatedDrawing]);

  const handleSaveEdit = useCallback(() => {
    if (generatedDrawing) {
      setGeneratedDrawing({
        ...generatedDrawing,
        parameters: editParameters,
        description: `Modified: ${generatedDrawing.name}`
      });
    }
    setIsEditorOpen(false);
  }, [generatedDrawing, editParameters]);

  const handleDownload = useCallback(async (format: 'step' | 'stl' | 'obj' | 'dxf' | 'pdf' | 'gltf' | 'glb') => {
    if (!generatedDrawing) return;
    
    try {
      const filename = `${generatedDrawing.name.replace(/\s+/g, '_')}.${format}`;
      let base64Data = '';
      
      if (generatedDrawing.dxf.startsWith('data:')) {
        const parts = generatedDrawing.dxf.split(',');
        if (parts.length > 1) {
          base64Data = parts[1];
        } else {
          base64Data = generatedDrawing.dxf.replace(/^data:.*;base64,/, '');
        }
      } else {
        base64Data = generatedDrawing.dxf;
      }
      
      if (!base64Data) {
        alert('Failed to prepare file for download.');
        return;
      }
      
      const result = await convertBase64ToFile({ base64Data, format, filename });
      if (!result.file) {
        alert('Failed to prepare file for download.');
        return;
      }
      
      const downloadUrl = URL.createObjectURL(result.file);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }, 100);
      
      addToast({ type: 'success', title: `${format.toUpperCase()} download started` });
    } catch (error: any) {
      console.error('Download error:', error);
      addToast({ type: 'error', title: 'Download failed' });
    }
  }, [generatedDrawing, addToast]);

  const handleAnalyze = useCallback(() => {
    if (!generatedDrawing) return;
    
    try {
      const format = generatedDrawing.parameters?.format || 'step';
      const fileData = {
        name: `${generatedDrawing.name.replace(/\s+/g, '_')}.${format}`,
        data: generatedDrawing.dxf,
        type: format,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('cadFileToAnalyze', JSON.stringify(fileData));
      window.location.href = '/cad-analyzer?autoAnalyze=true';
    } catch (error) {
      console.error('Error preparing file for analysis:', error);
      alert('Failed to prepare file for analysis. Please try downloading and uploading manually.');
    }
  }, [generatedDrawing]);

  return (
    <div className="space-y-8">
      {/* CAD History */}
      <div className="glass-container-with-liquid rounded-3xl border border-white/40">
        <Suspense fallback={<div className="p-8 text-center"><LoadingSpinner /></div>}>
          <CADHistory onSelectHistory={handleHistorySelect} className="rounded-3xl overflow-hidden bg-white/60" />
        </Suspense>
      </div>

      {/* Tab Navigation */}
      <div className="glass-container"></div>
      <div className="glass-container-with-liquid mb-10 rounded-3xl overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('text')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'text'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Text Input Generation
            </button>
            <button
              onClick={() => setActiveTab('template')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'template'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Template Selection
            </button>
          </nav>
        </div>

        <div className={`${activeTab === 'text' ? 'p-8 rounded-b-lg' : 'p-6'}`}>
          {activeTab === 'text' && (
            <TextInputPanel
              textInput={textInput}
              onTextInputChange={setTextInput}
              onGenerate={handleTextGeneration}
              isPending={isPending}
              selectedFormat={selectedFormat}
              selectedUnits={selectedUnits}
              onFormatChange={setFormat}
              onUnitsChange={setUnits}
              recentPrompts={recentPrompts}
              onClearRecentPrompts={clearRecentPrompts}
              prefilledPromptHighlight={prefilledPromptHighlight}
            />
          )}

          {activeTab === 'text' && (
            <GenerationProgress
              isPending={isPending}
              generationProgress={generationProgress}
              errorMessage={errorMessage}
            />
          )}

          {activeTab === 'template' && (
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onTemplateSelect={handleTemplateSelect}
              onGenerate={handleTemplateGeneration}
              isPending={isPending}
            />
          )}
        </div>
      </div>

      {showStageTracker && (
        <StagedProgress
          title="Generation Process"
          subtitle="Track each stage of the drawing workflow."
          stages={visibleGenerationStages}
          className="mt-4"
        />
      )}

      {/* Generated Drawing Display */}
      {generatedDrawing && (
        <GeneratedDrawingDisplay
          generatedDrawing={generatedDrawing}
          cadFileForPreview={cadFileForPreview}
          onEditDrawing={handleEditDrawing}
          onDownload={handleDownload}
          onAnalyze={handleAnalyze}
        />
      )}

      {/* Drawing Editor Modal */}
      <DrawingEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        editParameters={editParameters}
        onParameterChange={(key, value) => setEditParameters(prev => ({ ...prev, [key]: value }))}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default CADGenerator;
