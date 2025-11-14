import { useState, useCallback } from 'react';

export interface CADGenerationOptions {
  onSuccess?: (result: CADGenerationResult) => void;
  onError?: (error: string) => void;
  onProgress?: (status: string) => void;
}

export interface CADGenerationResult {
  taskId: string;
  outputUrl?: string;
  format?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface CADGenerationState {
  isGenerating: boolean;
  progress: string;
  error: string | null;
  result: CADGenerationResult | null;
}

export const useCADGeneration = (options: CADGenerationOptions = {}) => {
  const { onSuccess, onError, onProgress } = options;

  const [state, setState] = useState<CADGenerationState>({
    isGenerating: false,
    progress: '',
    error: null,
    result: null,
  });

  const generateCAD = useCallback(
    async (prompt: string, outputFormat: string = 'step') => {
      setState({
        isGenerating: true,
        progress: 'Initiating CAD generation...',
        error: null,
        result: null,
      });

      onProgress?.('Initiating CAD generation...');

      try {
        const response = await fetch('/api/generate-cad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, outputFormat }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate CAD');
        }

        const result: CADGenerationResult = await response.json();

        setState({
          isGenerating: false,
          progress: 'Generation complete!',
          error: null,
          result,
        });

        onSuccess?.(result);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate CAD';
        setState({
          isGenerating: false,
          progress: '',
          error: errorMessage,
          result: null,
        });
        onError?.(errorMessage);
        throw error;
      }
    },
    [onSuccess, onError, onProgress]
  );

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      progress: '',
      error: null,
      result: null,
    });
  }, []);

  return {
    ...state,
    generateCAD,
    reset,
  };
};
