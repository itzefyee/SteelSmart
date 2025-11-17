'use client';

import React, { useState, useEffect } from 'react';
import { sampleDrawings, cadTemplates, sampleTextGenerations } from '@/data/sample-data';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CADHistory from '@/components/cad/CADHistory';
import CADGenerationDebug from '@/components/cad/CADGenerationDebug';
import CADPreview3D from '@/components/cad/CADPreview3D';

interface GeneratedDrawing {
  id: number;
  name: string;
  description: string;
  preview: string;
  dxf: string;
  parameters?: Record<string, any>;
}

const CADGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'template'>('text');
  const [textInput, setTextInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [generatedDrawing, setGeneratedDrawing] = useState<GeneratedDrawing | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editParameters, setEditParameters] = useState<Record<string, string>>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [debugSteps, setDebugSteps] = useState<any[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [cadFileForPreview, setCadFileForPreview] = useState<File | null>(null);

  // Debug step management
  const addDebugStep = (id: string, title: string, status: 'pending' | 'in_progress' | 'completed' | 'failed', details?: string, error?: string) => {
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
  };

  const clearDebugSteps = () => {
    setDebugSteps([]);
  };

  // Helper function to convert base64 to File
  const base64ToFile = (base64Data: string, format: string): File | null => {
    try {
      // Extract base64 data
      let base64 = base64Data;
      if (base64Data.startsWith('data:')) {
        const parts = base64Data.split(',');
        base64 = parts.length > 1 ? parts[1] : base64Data.replace(/^data:.*;base64,/, '');
      }

      // Decode base64 to binary
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Determine MIME type
      const mimeTypes: Record<string, string> = {
        'step': 'application/step',
        'stp': 'application/step',
        'stl': 'model/stl',
        'obj': 'model/obj',
        'dxf': 'application/dxf',
        'gltf': 'model/gltf+json',
        'glb': 'model/gltf-binary',
      };

      const mimeType = mimeTypes[format.toLowerCase()] || 'application/octet-stream';
      const filename = `model.${format.toLowerCase()}`;

      // Create File object
      const file = new File([bytes], filename, { type: mimeType });
      return file;
    } catch (error) {
      console.error('Error converting base64 to file:', error);
      return null;
    }
  };

  // Convert generated drawing to File for preview whenever it changes
  useEffect(() => {
    if (generatedDrawing?.dxf) {
      const format = (generatedDrawing.parameters?.format || 'step') as string;
      const file = base64ToFile(generatedDrawing.dxf, format);
      setCadFileForPreview(file);
    } else {
      setCadFileForPreview(null);
    }
  }, [generatedDrawing]);

  const handleHistorySelect = (historyItem: any) => {
    
    // Ensure model_data is a valid base64 string
    let modelData = historyItem.model_data;
    
    // If model_data doesn't start with data: URL, create one
    if (modelData && !modelData.startsWith('data:')) {
      // Check if it's already base64 (no need to encode again)
      // If it contains non-base64 characters, it might need encoding
      try {
        // Try to decode a sample to verify it's valid base64
        const sample = modelData.substring(0, Math.min(100, modelData.length));
        atob(sample);
        // If successful, it's valid base64, create data URL
        modelData = `data:application/octet-stream;base64,${modelData}`;
      } catch (e) {
        // If not valid base64, try to encode it
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
    
    // Convert history item to generated drawing format
    const drawing = {
      id: parseInt(historyItem.id.replace(/\D/g, '')) || Date.now(),
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
    
    // Also set the text input to the historical prompt
    setTextInput(historyItem.prompt);
    
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
    
    // Scroll to the generated drawing section
    setTimeout(() => {
      const drawingElement = document.querySelector('[data-generated-drawing]');
      if (drawingElement) {
        drawingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleTextGeneration = async () => {
    if (!textInput.trim()) return;
    
    setIsGenerating(true);
    setErrorMessage('');
    setGenerationProgress('Initializing CAD generation...');
    clearDebugSteps();
    
    try {
      // Debug Step 1: Initialize
      addDebugStep('init', 'Initialize Generation', 'in_progress', `Prompt: "${textInput}"`);
      
      setGenerationProgress('Sending request to Zoo Dev API...');
      addDebugStep('init', 'Initialize Generation', 'completed');
      
      // Debug Step 2: API Request
      addDebugStep('api_request', 'Send API Request', 'in_progress', 'Calling Zoo Dev text-to-CAD API');
      
      // Call the real Zoo Dev API
      const response = await fetch('/api/generate-cad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: textInput,
          category: 'custom', // Could be enhanced to detect category from text
          format: 'step',
          units: 'mm'
        }),
      });

      addDebugStep('api_request', 'Send API Request', 'completed', `Response status: ${response.status}`);
      
      // Debug Step 3: Process Response
      addDebugStep('process_response', 'Process API Response', 'in_progress', 'Parsing Zoo Dev API response');
      
      setGenerationProgress('Processing your request...');
      const result = await response.json();

      if (!result.success) {
        addDebugStep('process_response', 'Process API Response', 'failed', undefined, result.error);
        throw new Error(result.error || 'CAD generation failed');
      }

      addDebugStep('process_response', 'Process API Response', 'completed', `Model ID: ${result.data.id}`);
      
      // Debug Step 4: Finalize
      addDebugStep('finalize', 'Finalize CAD Model', 'in_progress', 'Converting to display format');
      
      setGenerationProgress('Finalizing your CAD model...');
      
      // Convert the API response to our component format
      const { data } = result;
      
      setGeneratedDrawing({
        id: parseInt(data.id.replace(/\D/g, '')) || Date.now(),
        name: `Generated CAD Model`,
        description: `AI-generated model from: "${textInput}"`,
        preview: '/images/sample-cad-preview.svg', // Placeholder - in production, generate preview from model
        dxf: `data:application/octet-stream;base64,${data.model_data}`,
        parameters: {
          format: data.parameters.format,
          units: data.parameters.units,
          category: data.parameters.category,
          generated_at: data.parameters.generated_at,
          prompt: textInput
        }
      });
      
      // Store conversation ID for Zoo Dev API integration
      setConversationId(data.id);
      
      addDebugStep('finalize', 'Finalize CAD Model', 'completed', 'CAD model ready for display');
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
    } catch (error: any) {
      console.error('CAD generation error:', error);
      
      // Update debug steps with error
      addDebugStep('finalize', 'Finalize CAD Model', 'failed', undefined, error.message);
      
      // Show error to user
      setErrorMessage(`CAD generation failed: ${error.message}`);
      
      // Fallback to sample data for demo purposes
      const matchingGeneration = sampleTextGenerations.find(gen => 
        textInput.toLowerCase().includes('beam') && gen.input.includes('beam') ||
        textInput.toLowerCase().includes('bracket') && gen.input.includes('bracket')
      ) || sampleTextGenerations[0];
      
      const drawing = sampleDrawings.find(d => d.id === matchingGeneration.result.drawingId) || sampleDrawings[0];
      
      setGeneratedDrawing({
        ...drawing,
        parameters: {
          ...matchingGeneration.result.parameters,
          note: 'Using sample data - API unavailable'
        }
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  // Helper function to generate prompt from template
  const generatePromptFromTemplate = (template: typeof cadTemplates[0]): string => {
    const params = template.parameters as any; // Type assertion to avoid undefined errors

    switch (template.id) {
      case 1: // I-Beam
        return `Generate an I-beam with the following specifications: height ${params.height?.value}${params.height?.unit}, flange width ${params.width?.value}${params.width?.unit}, web thickness ${params.webThickness?.value}${params.webThickness?.unit}, flange thickness ${params.flangeThickness?.value}${params.flangeThickness?.unit}, length ${params.length?.value}${params.length?.unit}, material ${params.material?.value}`;

      case 2: // Rectangular Plate
        return `Generate a rectangular steel plate with dimensions ${params.length?.value}${params.length?.unit} x ${params.width?.value}${params.width?.unit} x ${params.thickness?.value}${params.thickness?.unit}, with ${params.holeCount?.value} holes of ${params.holeDiameter?.value}${params.holeDiameter?.unit} diameter, material ${params.material?.value}`;

      case 3: // L-Bracket
        return `Generate an L-bracket with height ${params.height?.value}${params.height?.unit}, width ${params.width?.value}${params.width?.unit}, thickness ${params.thickness?.value}${params.thickness?.unit}, ${params.holeCount?.value} mounting holes of ${params.holeDiameter?.value}${params.holeDiameter?.unit} diameter, bend radius ${params.bendRadius?.value}${params.bendRadius?.unit}, material ${params.material?.value}`;

      case 4: // Servo Mount
        return `Generate a servo motor mounting bracket for ${params.servoType?.value} servo, with ${params.mountingHoles?.value} mounting holes, bracket thickness ${params.thickness?.value}${params.thickness?.unit}, mount height ${params.height?.value}${params.height?.unit}, cable management: ${params.cableManagement?.value}, material ${params.material?.value}`;

      default:
        return `Generate a ${template.name} with the default parameters`;
    }
  };

  const handleTemplateGeneration = async () => {
    if (selectedTemplate === null) return;

    setIsGenerating(true);
    setErrorMessage('');
    setGenerationProgress('Preparing template for generation...');
    clearDebugSteps();

    try {
      const template = cadTemplates.find(t => t.id === selectedTemplate);
      if (!template) {
        throw new Error('Template not found');
      }

      // Debug Step 1: Initialize Template
      addDebugStep('init_template', 'Initialize Template', 'in_progress', `Template: ${template.name}`);

      // Convert template parameters to a descriptive prompt for Zoo Dev API
      const prompt = generatePromptFromTemplate(template);

      addDebugStep('init_template', 'Initialize Template', 'completed', `Generated prompt: "${prompt}"`);

      setGenerationProgress('Sending request to Zoo Dev API...');

      // Debug Step 2: API Request
      addDebugStep('api_request', 'Send API Request', 'in_progress', 'Calling Zoo Dev text-to-CAD API with template parameters');

      // Call the real Zoo Dev API
      const response = await fetch('/api/generate-cad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: prompt,
          category: template.category,
          format: 'step',
          units: 'mm'
        }),
      });

      addDebugStep('api_request', 'Send API Request', 'completed', `Response status: ${response.status}`);

      // Debug Step 3: Process Response
      addDebugStep('process_response', 'Process API Response', 'in_progress', 'Parsing Zoo Dev API response');

      setGenerationProgress('Processing your request...');
      const result = await response.json();

      if (!result.success) {
        addDebugStep('process_response', 'Process API Response', 'failed', undefined, result.error);
        throw new Error(result.error || 'CAD generation failed');
      }

      addDebugStep('process_response', 'Process API Response', 'completed', `Model ID: ${result.data.id}`);

      // Debug Step 4: Finalize
      addDebugStep('finalize', 'Finalize CAD Model', 'in_progress', 'Converting to display format');

      setGenerationProgress('Finalizing your CAD model...');

      // Convert the API response to our component format
      const { data } = result;

      // Convert template parameters to display format
      const templateParams: Record<string, any> = {};
      if (template.parameters) {
        Object.entries(template.parameters).forEach(([key, param]) => {
          templateParams[key] = `${param.value}${param.unit || ''}`;
        });
      }

      setGeneratedDrawing({
        id: parseInt(data.id.replace(/\D/g, '')) || Date.now(),
        name: `Generated ${template.name}`,
        description: `AI-generated ${template.name} from template`,
        preview: template.preview,
        dxf: `data:application/octet-stream;base64,${data.model_data}`,
        parameters: {
          ...templateParams,
          format: data.parameters.format,
          units: data.parameters.units,
          category: data.parameters.category,
          generated_at: data.parameters.generated_at,
          prompt: prompt
        }
      });

      // Store conversation ID for Zoo Dev API integration
      setConversationId(data.id);

      addDebugStep('finalize', 'Finalize CAD Model', 'completed', 'CAD model ready for display');

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

    } catch (error: any) {
      console.error('Template CAD generation error:', error);

      // Update debug steps with error
      addDebugStep('finalize', 'Finalize CAD Model', 'failed', undefined, error.message);

      // Show error to user
      setErrorMessage(`Template generation failed: ${error.message}`);

      // Fallback to sample data for demo purposes
      const template = cadTemplates.find(t => t.id === selectedTemplate);
      const drawing = sampleDrawings.find(d => d.category === template?.category) || sampleDrawings[0];

      // Convert template parameters to generated drawing parameters
      const templateParams: Record<string, any> = {};
      if (template?.parameters) {
        Object.entries(template.parameters).forEach(([key, param]) => {
          templateParams[key] = `${param.value}${param.unit || ''}`;
        });
      }

      setGeneratedDrawing({
        ...drawing,
        parameters: {
          ...templateParams,
          note: 'Using sample data - API unavailable'
        }
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  const handleEditDrawing = () => {
    if (!generatedDrawing) return;
    
    // Initialize edit parameters with current values
    const params: Record<string, string> = {};
    if (generatedDrawing.parameters) {
      Object.keys(generatedDrawing.parameters).forEach(key => {
        params[key] = String(generatedDrawing.parameters![key]);
      });
    } else {
      // Default parameters for editing
      params.length = '200';
      params.width = '100';
      params.thickness = '10';
      params.holes = '4';
    }
    
    setEditParameters(params);
    setIsEditorOpen(true);
  };

  const handleSaveEdit = () => {
    if (generatedDrawing) {
      setGeneratedDrawing({
        ...generatedDrawing,
        parameters: editParameters,
        description: `Modified: ${generatedDrawing.name}`
      });
    }
    setIsEditorOpen(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleDownload = async (format: 'step' | 'stl' | 'obj' | 'dxf' | 'pdf' | 'gltf' | 'glb') => {
    if (!generatedDrawing) return;
    
    try {
      // Get the actual format from parameters or default to step
      const actualFormat = generatedDrawing.parameters?.format || 'step';
      const filename = `${generatedDrawing.name.replace(/\s+/g, '_')}.${format}`;
      
      // Extract base64 data from the dxf field (which contains the model data)
      let base64Data = '';
      
      if (generatedDrawing.dxf.startsWith('data:')) {
        // Extract base64 from data URL
        const parts = generatedDrawing.dxf.split(',');
        if (parts.length > 1) {
          base64Data = parts[1];
        } else {
          // If no comma, the whole thing might be base64
          base64Data = generatedDrawing.dxf.replace(/^data:.*;base64,/, '');
        }
      } else {
        // If it's already base64 without data URL prefix
        base64Data = generatedDrawing.dxf;
      }
      
      if (!base64Data) {
        alert('No model data available for download.');
        return;
      }
      
      // Decode base64 to binary
      let binaryString: string;
      try {
        binaryString = atob(base64Data);
      } catch (e) {
        console.error('Base64 decode error:', e);
        alert('Failed to decode model data. The file may be corrupted.');
        return;
      }
      
      // Convert to Uint8Array
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Determine MIME type based on format
      const mimeTypes: Record<string, string> = {
        'step': 'application/octet-stream',
        'stl': 'application/octet-stream',
        'obj': 'text/plain',
        'dxf': 'application/dxf',
        'pdf': 'application/pdf',
        'gltf': 'model/gltf+json',
        'glb': 'model/gltf-binary'
      };
      
      const mimeType = mimeTypes[format] || 'application/octet-stream';
      
      // Create blob with correct MIME type
      const blob = new Blob([bytes], { type: mimeType });
      const downloadUrl = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }, 100);
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
    } catch (error: any) {
      console.error('Download error:', error);
      alert(`Download failed: ${error.message || 'Unknown error'}. Please try again.`);
    }
  };

  return (
    <div className="space-y-8">
      {/* CAD History */}
      <CADHistory onSelectHistory={handleHistorySelect} />
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800 font-medium">Operation completed successfully!</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow border">
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
            <div className="max-w-4xl mx-auto">
              {/* Chat-like Interface */}
              <div className="space-y-6">
                {/* AI Assistant Introduction */}
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-2xl rounded-tl-md p-4 border border-gray-200">
                      <p className="text-gray-800 leading-relaxed">
                        Hi! I'm your AI CAD assistant. I can help you generate technical drawings from natural language descriptions. 
                        Just describe what you need, and I'll create precise CAD drawings with proper dimensions and specifications.
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 ml-4">Metalyze AI</p>
                  </div>
                </div>

                {/* Suggested Prompts */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-600 ml-12">Try asking me to:</p>
                  <div className="ml-12 space-y-2">
                    {[
                      "Generate a 200mm x 100mm steel I-beam with 10mm thickness",
                      "Create a servo motor mounting bracket for SG90",
                      "Design a rectangular steel plate with 6 bolt holes",
                      "Make an L-bracket for wall mounting"
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setTextInput(example)}
                        className="block w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>"{example}"</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Input */}
                <div className="relative">
                  <div className="flex items-end space-x-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 relative">
                      <div className="bg-white rounded-2xl border border-gray-300 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                        <textarea
                          id="textInput"
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          placeholder="Describe the component you want to generate..."
                          className="w-full min-h-[80px] max-h-[200px] px-4 py-3 bg-transparent border-none outline-none resize-none text-gray-900 placeholder-gray-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && textInput.trim() && !isGenerating) {
                              e.preventDefault();
                              handleTextGeneration();
                            }
                          }}
                        />
                        <div className="flex items-center justify-between px-4 pb-3">
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 00-2.828-2.828z" />
                              </svg>
                            </button>
                            <span className="text-xs text-gray-400">{textInput.length}/500</span>
                          </div>
                          <button
                            onClick={handleTextGeneration}
                            disabled={!textInput.trim() || isGenerating}
                            className={`p-2 rounded-lg transition-all ${
                              textInput.trim() && !isGenerating
                                ? 'bg-primary text-white hover:bg-primary/90' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {isGenerating ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {isGenerating && (
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 animate-spin rounded-full border border-white border-t-transparent"></div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-2xl rounded-tl-md p-4 border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-gray-600 text-sm">
                            {generationProgress || 'Generating your CAD drawing...'}
                          </span>
                        </div>
                        {generationProgress && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div className="bg-gradient-to-r from-purple-500 to-blue-600 h-1 rounded-full animate-pulse" style={{width: '60%'}}></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-4">Metalyze AI • Powered by Zoo Dev</p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {errorMessage && (
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="bg-red-50 rounded-2xl rounded-tl-md p-4 border border-red-200">
                        <p className="text-red-800 text-sm">{errorMessage}</p>
                        <p className="text-red-600 text-xs mt-2">Don't worry - we've loaded a sample drawing for you to explore the interface.</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-4">Metalyze AI</p>
                    </div>
                  </div>
                )}

                {/* Helper Text */}
                <div className="ml-12 text-xs text-gray-500">
                  <p className="flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Press Enter to send, Shift+Enter for new line</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'template' && (
            <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Choose a template
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cadTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`cursor-pointer border-2 rounded-lg p-6 transition-all ${
                      selectedTemplate === template.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex space-x-4">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img 
                          src={template.preview} 
                          alt={template.name}
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                        
                        <div className="space-y-1">
                          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Default Parameters:</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(template.parameters).slice(0, 4).map(([key, param]) => (
                              <div key={key} className="text-gray-600">
                                <span className="font-medium">{param.label}:</span> {param.value}{param.unit}
                              </div>
                            ))}
                          </div>
                          {Object.keys(template.parameters).length > 4 && (
                            <p className="text-xs text-gray-500">+{Object.keys(template.parameters).length - 4} more parameters</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
              <div className="flex justify-center">
                <Button 
                  onClick={handleTemplateGeneration}
                  disabled={selectedTemplate === null || isGenerating}
                  className="px-8"
                >
                  {isGenerating ? <LoadingSpinner size="sm" /> : 'Generate from Template'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generated Drawing Display */}
      {generatedDrawing && (
        <div className="bg-white rounded-lg shadow border p-6" data-generated-drawing>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Generated Drawing</h2>
              <p className="text-gray-600">{generatedDrawing.description}</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleEditDrawing}>
                Edit Drawing
              </Button>
              <div className="flex space-x-2">
                <div className="relative group">
                  <Button className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleDownload('step')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Download STEP (.step)
                      </button>
                      <button
                        onClick={() => handleDownload('stl')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Download STL (.stl)
                      </button>
                      <button
                        onClick={() => handleDownload('obj')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Download OBJ (.obj)
                      </button>
                      <button
                        onClick={() => handleDownload('dxf')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Download DXF (.dxf)
                      </button>
                      <button
                        onClick={() => handleDownload('pdf')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Download PDF (.pdf)
                      </button>
                      <button
                        onClick={() => handleDownload('gltf')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Download glTF (.gltf)
                      </button>
                      <button
                        onClick={() => handleDownload('glb')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Download GLB (.glb)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 3D Model Preview */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">3D Model Preview</h3>
              {cadFileForPreview ? (
                <CADPreview3D
                  file={cadFileForPreview}
                  showStats={true}
                />
              ) : (
                <div className="w-full h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  <div className="text-center p-4">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-600">Model preview unavailable</p>
                    <p className="text-xs text-gray-500 mt-2">Download the file to view in CAD software</p>
                  </div>
                </div>
              )}
            </div>

            {/* Parameters */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Drawing Parameters</h3>
              <div className="space-y-3 mb-6">
                {generatedDrawing.parameters ? (
                  Object.entries(generatedDrawing.parameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-medium text-gray-900">{String(value)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic">No parameters available</div>
                )}
              </div>

              {/* Compatibility Info */}
              {generatedDrawing.dxf && (generatedDrawing.dxf.includes('base64') || generatedDrawing.dxf.length > 50) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    <p className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Compatible with AutoCAD, SolidWorks, FreeCAD, Fusion 360
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Debug Information */}
      <CADGenerationDebug 
        steps={debugSteps}
        isVisible={showDebug}
        onToggle={() => setShowDebug(!showDebug)}
      />

      {/* Drawing Editor Modal */}
      <Modal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} title="Edit Drawing">
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">Modify the drawing parameters below:</p>
          {Object.entries(editParameters).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
              <Input
                type={key.includes('holes') || key.includes('count') ? 'number' : 'text'}
                value={value}
                onChange={(value) => setEditParameters(prev => ({
                  ...prev,
                  [key]: value
                }))}
                className="w-full"
              />
            </div>
          ))}
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CADGenerator;
