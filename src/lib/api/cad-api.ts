/**
 * CAD Analysis API Client
 * 
 * Client-side API wrapper for CAD drawing analysis operations.
 * Used by React Query hooks to fetch analysis results and history.
 * 
 * Architecture:
 * Component → useCADAnalysis hook → CADAPI → HTTP → Controller → Service → Repository
 * 
 * Cache Strategy:
 * - Analysis results: 24 hours (React Query) + 24 hours (Redis)
 * - Analysis history: 5 minutes (React Query)
 * - Analysis by ID: 10 minutes (React Query)
 */

import type { DrawingAnalysis } from '@/types';

export interface AnalyzeDrawingOptions {
  file: File;
  cadModelData?: any;
}

export interface AnalysisHistoryItem {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  extracted_specs: any;
  recommended_products: any[];
  confidence: number;
  reasoning: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyzeDrawingResponse {
  success: boolean;
  data?: DrawingAnalysis;
  error?: string;
  message?: string;
}

export interface AnalysisHistoryResponse {
  success: boolean;
  data?: AnalysisHistoryItem[];
  error?: string;
}

export interface AnalysisByIdResponse {
  success: boolean;
  data?: AnalysisHistoryItem;
  error?: string;
}

export interface CADHistoryItem {
  id: string;
  prompt: string;
  category: string;
  format: string;
  units: string;
  model_data_url?: string;
  file_path?: string;
  model_data?: string;
  generated_at: string;
  status: 'completed' | 'failed' | 'processing';
  error?: string;
  zoo_operation_id?: string;
}

export interface CADHistoryResponse {
  success: boolean;
  data?: CADHistoryItem[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface CADGenerationRequest {
  description: string;
  category?: string;
  format?: string;
  units?: string;
}

export interface CADGenerationResult {
  id: string;
  status: 'completed' | 'failed' | 'processing';
  model_data?: string;
  preview_image?: string;
  parameters?: Record<string, any>;
  error?: string;
}

/**
 * CAD Analysis API Client
 * 
 * Provides methods for analyzing CAD drawings, fetching analysis history,
 * and retrieving specific analysis results.
 */
export class CADAPI {
  /**
   * Analyze a CAD drawing file
   * 
   * Uploads a file and performs AI-powered analysis to extract specifications
   * and generate product recommendations. Results are cached for 24 hours
   * based on file content hash.
   * 
   * @param options - Analysis options with file and optional CAD model data
   * @returns Drawing analysis with extracted specs and recommendations
   * @throws Error if analysis fails
   * 
   * @example
   * ```typescript
   * const analysis = await CADAPI.analyzeDrawing({
   *   file: uploadedFile,
   *   cadModelData: parsedCADData
   * });
   * ```
   */
  static async analyzeDrawing(options: AnalyzeDrawingOptions): Promise<DrawingAnalysis> {
    const formData = new FormData();
    formData.append('file', options.file);
    
    if (options.cadModelData) {
      formData.append('cadModelData', JSON.stringify(options.cadModelData));
    }
    
    const response = await fetch('/api/analyze-drawing', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to analyze drawing: ${response.statusText}`);
    }
    
    const result: AnalyzeDrawingResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to analyze drawing');
    }
    
    if (!result.data) {
      throw new Error('No analysis data returned');
    }
    
    return result.data;
  }
  
  /**
   * Get analysis history for the current user
   * 
   * Fetches all previous CAD analyses performed by the authenticated user.
   * Results are cached for 5 minutes.
   * 
   * @returns Array of analysis history items
   * @throws Error if request fails
   * 
   * @example
   * ```typescript
   * const history = await CADAPI.getAnalysisHistory();
   * console.log(`Found ${history.length} previous analyses`);
   * ```
   */
  static async getAnalysisHistory(): Promise<AnalysisHistoryItem[]> {
    const response = await fetch('/api/cad-analysis/history');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch analysis history: ${response.statusText}`);
    }
    
    const result: AnalysisHistoryResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch analysis history');
    }
    
    return result.data || [];
  }
  
  /**
   * Get a specific analysis by ID
   * 
   * Fetches detailed information about a previous analysis.
   * Results are cached for 10 minutes.
   * 
   * @param id - Analysis ID
   * @returns Analysis history item with full details
   * @throws Error if request fails or analysis not found
   * 
   * @example
   * ```typescript
   * const analysis = await CADAPI.getAnalysisById('analysis_123');
   * console.log(`Analysis confidence: ${analysis.confidence}`);
   * ```
   */
  static async getAnalysisById(id: string): Promise<AnalysisHistoryItem> {
    const response = await fetch(`/api/cad-analysis/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch analysis: ${response.statusText}`);
    }
    
    const result: AnalysisByIdResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch analysis');
    }
    
    if (!result.data) {
      throw new Error('Analysis not found');
    }
    
    return result.data;
  }
  
  /**
   * Delete an analysis from history
   * 
   * Removes an analysis and its associated file from storage.
   * 
   * @param id - Analysis ID to delete
   * @throws Error if deletion fails
   * 
   * @example
   * ```typescript
   * await CADAPI.deleteAnalysis('analysis_123');
   * ```
   */
  static async deleteAnalysis(id: string): Promise<void> {
    const response = await fetch(`/api/cad-analysis/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete analysis: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete analysis');
    }
  }
  
  /**
   * Generate a CAD model from text description
   * 
   * @param request - CAD generation request with description and parameters
   * @returns CAD generation result with model data
   * @throws Error if generation fails or description is empty
   */
  static async generateCAD(request: CADGenerationRequest): Promise<CADGenerationResult> {
    // Validate description before making API call
    if (!request.description || request.description.trim().length === 0) {
      throw new Error('Description is required for CAD generation');
    }
    
    const response = await fetch('/api/generate-cad', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate CAD: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate CAD');
    }
    
    return result.data;
  }
  
  /**
   * Get CAD generation history
   * 
   * @param limit - Number of items to return
   * @param offset - Offset for pagination
   * @returns CAD history response with items and pagination
   */
  static async getHistory(limit: number = 20, offset: number = 0): Promise<any> {
    const response = await fetch(`/api/cad-history?limit=${limit}&offset=${offset}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CAD history: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch CAD history');
    }
    
    return result;
  }
}
