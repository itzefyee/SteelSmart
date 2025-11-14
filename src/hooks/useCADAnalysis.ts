import { useState, useCallback } from 'react';

export interface CADAnalysisOptions {
  onSuccess?: (analysis: CADAnalysisResult) => void;
  onError?: (error: string) => void;
}

export interface CADAnalysisResult {
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  materials?: string[];
  specifications?: string;
  loadRequirements?: string;
  tolerances?: string;
  quantity?: number;
  rawAnalysis?: string;
}

export interface CADAnalysisState {
  isAnalyzing: boolean;
  error: string | null;
  analysis: CADAnalysisResult | null;
}

export const useCADAnalysis = (options: CADAnalysisOptions = {}) => {
  const { onSuccess, onError } = options;

  const [state, setState] = useState<CADAnalysisState>({
    isAnalyzing: false,
    error: null,
    analysis: null,
  });

  const analyzeDrawing = useCallback(
    async (file: File) => {
      setState({
        isAnalyzing: true,
        error: null,
        analysis: null,
      });

      try {
        const formData = new FormData();
        formData.append('drawing', file);

        const response = await fetch('/api/analyze-drawing', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to analyze drawing');
        }

        const data = await response.json();
        const analysis: CADAnalysisResult = data.analysis;

        setState({
          isAnalyzing: false,
          error: null,
          analysis,
        });

        onSuccess?.(analysis);
        return analysis;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to analyze drawing';
        setState({
          isAnalyzing: false,
          error: errorMessage,
          analysis: null,
        });
        onError?.(errorMessage);
        throw error;
      }
    },
    [onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({
      isAnalyzing: false,
      error: null,
      analysis: null,
    });
  }, []);

  return {
    ...state,
    analyzeDrawing,
    reset,
  };
};
