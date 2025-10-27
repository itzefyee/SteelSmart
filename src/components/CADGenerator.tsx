'use client';

import React, { useState } from 'react';
import { sampleDrawings, cadTemplates, sampleTextGenerations } from '@/data/sample-data';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editParameters, setEditParameters] = useState<Record<string, string>>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleTextGeneration = async () => {
    if (!textInput.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find matching sample generation or use first one as fallback
    const matchingGeneration = sampleTextGenerations.find(gen => 
      textInput.toLowerCase().includes('beam') && gen.input.includes('beam') ||
      textInput.toLowerCase().includes('bracket') && gen.input.includes('bracket')
    ) || sampleTextGenerations[0];
    
    const drawing = sampleDrawings.find(d => d.id === matchingGeneration.result.drawingId) || sampleDrawings[0];
    
    setGeneratedDrawing({
      ...drawing,
      parameters: matchingGeneration.result.parameters
    });
    
    setIsGenerating(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleTemplateGeneration = async () => {
    if (selectedTemplate === null) return;
    
    setIsGenerating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
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
      parameters: templateParams
    });
    setIsGenerating(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
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

  const handleDownload = (format: 'dxf' | 'pdf') => {
    if (!generatedDrawing) return;
    
    // Simulate download
    const link = document.createElement('a');
    link.href = format === 'dxf' ? generatedDrawing.dxf : generatedDrawing.dxf;
    link.download = `${generatedDrawing.name.replace(/\s+/g, '_')}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  return (
    <div className="space-y-8">
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
                    <p className="text-xs text-gray-500 mt-2 ml-4">SteelSmart AI</p>
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
                          <span className="text-gray-600 text-sm">Generating your CAD drawing...</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-4">SteelSmart AI</p>
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
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Generated Drawing</h2>
              <p className="text-gray-600">{generatedDrawing.description}</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleEditDrawing}>
                Edit Drawing
              </Button>
              <div className="relative">
                <Button 
                  onClick={() => handleDownload('dxf')}
                  className="mr-2"
                >
                  Download DXF
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleDownload('pdf')}
                >
                  Download PDF
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Drawing Preview */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Drawing Preview</h3>
              <div className="w-full h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                <img 
                  src={generatedDrawing.preview} 
                  alt={generatedDrawing.name}
                  className="w-full h-full object-contain p-2"
                />
              </div>
            </div>

            {/* Parameters */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Drawing Parameters</h3>
              <div className="space-y-3">
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
            </div>
          </div>
        </div>
      )}

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
                onChange={(e) => setEditParameters(prev => ({
                  ...prev,
                  [key]: e.target.value
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
