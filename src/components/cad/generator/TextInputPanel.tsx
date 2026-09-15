'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { LoaderCircle, Mic, Square } from 'lucide-react';
import { mlPromptTemplates } from '@/data/sample-data';
import { useSpeechInput } from '@/hooks/useSpeechInput';
import TemplateCardButton from './TemplateCardButton';

interface TextInputPanelProps {
  textInput: string;
  onTextInputChange: (value: string) => void;
  onGenerate: () => void;
  isPending: boolean;
  selectedFormat: string;
  selectedUnits: string;
  onFormatChange: (format: 'step' | 'stl' | 'obj' | 'gltf') => void;
  onUnitsChange: (units: 'mm' | 'cm' | 'm' | 'in' | 'ft') => void;
  recentPrompts: string[];
  onClearRecentPrompts: () => void;
  prefilledPromptHighlight: boolean;
}

const TextInputPanel: React.FC<TextInputPanelProps> = React.memo(({
  textInput,
  onTextInputChange,
  onGenerate,
  isPending,
  selectedFormat,
  selectedUnits,
  onFormatChange,
  onUnitsChange,
  recentPrompts,
  onClearRecentPrompts,
  prefilledPromptHighlight,
}) => {
  const promptInputContainerRef = useRef<HTMLDivElement | null>(null);
  const textInputRef = useRef(textInput);
  const { isListening, isTranscribing, transcript, start, stop, error: speechError } = useSpeechInput();

  useEffect(() => {
    textInputRef.current = textInput;
  }, [textInput]);

  useEffect(() => {
    if (!transcript) return;

    const existingPrompt = textInputRef.current.trim();
    const nextPrompt = `${existingPrompt}${existingPrompt ? ' ' : ''}${transcript}`.slice(0, 1000);
    onTextInputChange(nextPrompt);
  }, [onTextInputChange, transcript]);

  const brakeRotorQuickBadges = useMemo(() => (
    <div className="flex items-center gap-2 text-[10px] text-amber-700">
      <span className="inline-flex items-center whitespace-nowrap px-1.5 py-0.25 rounded-full border border-gray-300 hover:border-amber-400 bg-gray-50 hover:bg-amber-50">
        $$
      </span>
      <span className="inline-flex items-center px-1.5 py-0.25 rounded-full border border-gray-300 hover:border-amber-400 bg-gray-50 hover:bg-amber-50 uppercase tracking-wide">
        Complex
      </span>
    </div>
  ), []);

  useEffect(() => {
    if (!prefilledPromptHighlight) return;

    const scrollTimeout = window.setTimeout(() => {
      if (promptInputContainerRef.current) {
        const rect = promptInputContainerRef.current.getBoundingClientRect();
        const targetTop = Math.max(rect.bottom + window.scrollY - window.innerHeight + 80, 0);
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    }, 250);

    const focusTimeout = window.setTimeout(() => {
      const textInputElement = document.getElementById('textInput') as HTMLTextAreaElement | null;
      if (textInputElement) {
        textInputElement.focus({ preventScroll: true });
      }
    }, 350);

    return () => {
      window.clearTimeout(scrollTimeout);
      window.clearTimeout(focusTimeout);
    };
  }, [prefilledPromptHighlight]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* AI Assistant Introduction */}
        <div className="flex items-start space-x-4">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-white">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="rounded-2xl rounded-tl-md p-4 bg-white border border-gray-200 shadow-sm">
              <p className="text-gray-800 leading-relaxed">
                Hi! I'm SteelBot, your CAD assistant. Describe what you need, and I'll create precise drawings with proper dimensions and specs.
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2 ml-4">SteelBot</p>
          </div>
        </div>

        {/* ML Prompt Templates */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-600 ml-12">Try these professional templates:</p>
          <div className="ml-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {mlPromptTemplates.map((template) => {
              const isBrakeRotor = template.title === 'Brake Rotor';
              return (
                <TemplateCardButton
                  key={template.id}
                  title={template.title}
                  description={template.description}
                  badge={template.category}
                  onClick={() => onTextInputChange(template.prompt)}
                  accentColor={isBrakeRotor ? 'yellow' : 'blue'}
                  extraBadges={isBrakeRotor ? brakeRotorQuickBadges : undefined}
                />
              );
            })}
          </div>
        </div>

        {/* Recent Prompts */}
        {recentPrompts.length > 0 && (
          <div className="space-y-3">
            <div className="ml-12 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">Your recent prompts:</p>
              <button
                onClick={onClearRecentPrompts}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="ml-12 flex flex-wrap gap-2">
              {recentPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onTextInputChange(prompt)}
                  className="inline-flex items-center px-3 py-1.5 glass-card text-sm text-gray-700 hover:bg-blue-50 transition-colors group"
                >
                  <svg className="w-3 h-3 mr-1.5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="line-clamp-1 max-w-xs">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CAD Preferences */}
        <div className="ml-12 space-y-3">
          <p className="text-sm font-medium text-gray-600">Output preferences:</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="cad-output-format" className="text-xs text-gray-600">Format:</label>
              <select
                id="cad-output-format"
                value={selectedFormat}
                onChange={(e) => onFormatChange(e.target.value as 'step' | 'stl' | 'obj' | 'gltf')}
                className="px-3 py-1.5 text-sm glass-card border-none outline-none cursor-pointer"
              >
                <option value="step">STEP</option>
                <option value="stl">STL</option>
                <option value="obj">OBJ</option>
                <option value="gltf">glTF</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="cad-output-units" className="text-xs text-gray-600">Units:</label>
              <select
                id="cad-output-units"
                value={selectedUnits}
                onChange={(e) => onUnitsChange(e.target.value as 'mm' | 'cm' | 'm' | 'in' | 'ft')}
                className="px-3 py-1.5 text-sm glass-card border-none outline-none cursor-pointer"
              >
                <option value="mm">Millimeters</option>
                <option value="cm">Centimeters</option>
                <option value="m">Meters</option>
                <option value="in">Inches</option>
                <option value="ft">Feet</option>
              </select>
            </div>
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
            <div className="flex-1 relative" ref={promptInputContainerRef}>
              <div
                className={`glass-card rounded-2xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all ${
                  prefilledPromptHighlight ? 'ring-2 ring-blue-400 ring-opacity-50 border-blue-200' : ''
                }`}
              >
                <label htmlFor="textInput" className="sr-only">CAD component description</label>
                <textarea
                  id="textInput"
                  value={textInput}
                  onChange={(e) => onTextInputChange(e.target.value)}
                  placeholder="Describe the component you want to generate..."
                  maxLength={1000}
                  className="w-full min-h-[80px] max-h-[200px] px-4 py-3 bg-transparent border-none outline-none resize-none text-gray-900 placeholder-gray-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && textInput.trim() && !isPending) {
                      e.preventDefault();
                      onGenerate();
                    }
                  }}
                />
                <div className="flex items-center justify-between px-4 pb-3">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={isListening ? stop : () => void start()}
                      disabled={isPending || isTranscribing}
                      aria-label={isListening ? 'Stop recording CAD prompt' : 'Record CAD prompt with microphone'}
                      aria-pressed={isListening}
                      title={isListening ? 'Stop recording' : 'Record CAD prompt'}
                      className={`rounded p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        isListening ? 'bg-destructive/10 text-destructive' : 'text-gray-500 hover:bg-muted hover:text-primary'
                      }`}
                    >
                      {isTranscribing ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : isListening ? (
                        <Square className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Mic className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                    <span className="font-data text-xs text-gray-500">{textInput.length}/1000</span>
                  </div>
                  <button
                    onClick={onGenerate}
                    disabled={!textInput.trim() || isPending}
                    aria-label="Generate CAD model"
                    className={`p-2 rounded-lg transition-all ${
                      textInput.trim() && !isPending
                        ? 'bg-primary text-white hover:bg-primary/90' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isPending ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="sr-only" role="status" aria-live="polite">
                  {isListening
                    ? 'Recording CAD prompt. Select the microphone button again when finished.'
                    : isTranscribing
                      ? 'Transcribing CAD prompt.'
                      : ''}
                </p>
                {speechError && (
                  <p className="px-4 pb-3 text-xs text-destructive" role="alert">{speechError}</p>
                )}
              </div>
            </div>
          </div>
        </div>

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
  );
});

TextInputPanel.displayName = 'TextInputPanel';

export default TextInputPanel;
