/**
 * CAD Generation Request parameters
 */
export interface CADGenerationRequest {
  description: string;
  category?: 'bracket' | 'plate' | 'beam' | 'fastener' | 'custom';
  format?: 'step' | 'stl' | 'obj' | 'gltf' | 'glb';
  units?: 'mm' | 'cm' | 'm' | 'in' | 'ft';
}

/**
 * CAD Generation Result from API
 */
export interface CADGenerationResult {
  id: string;
  status: 'completed' | 'failed' | 'processing';
  model_data?: string; // base64 encoded model file
  preview_image?: string;
  parameters?: Record<string, any>;
  error?: string;
}

/**
 * CAD History Item
 */
export interface CADHistoryItem {
  id: string;
  prompt: string;
  category: string;
  format: string;
  units: string;
  model_data_url?: string;
  file_path?: string;
  generated_at: string;
  status: 'completed' | 'failed' | 'processing';
  error?: string;
  zoo_operation_id?: string;
}

/**
 * CAD History Response with pagination
 */
export interface CADHistoryResponse {
  data: CADHistoryItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * CADService handles all CAD generation and history-related API calls
 * This service layer separates business logic from React components
 * and provides a clean interface for React Query hooks
 */
export class CADService {
  private static readonly GENERATE_URL = '/api/generate-cad';
  private static readonly HISTORY_URL = '/api/cad-history';

  /**
   * Generates a CAD model from a text description
   * 
   * @param request - CAD generation parameters including description, format, units, and category
   * @returns Promise resolving to CADGenerationResult with model data
   * @throws Error if the API request fails or generation fails
   */
  static async generateCAD(
    request: CADGenerationRequest
  ): Promise<CADGenerationResult> {
    try {
      // Validate required fields
      if (!request.description || request.description.trim().length === 0) {
        throw new Error('Description is required for CAD generation');
      }

      // Make API request
      const response = await fetch(this.GENERATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to generate CAD: ${response.statusText}${
            errorData.error ? ` - ${errorData.error}` : ''
          }`
        );
      }

      const data = await response.json();

      // Check if the response indicates success
      if (!data.success) {
        throw new Error(data.error || 'CAD generation failed');
      }

      // Return the generation result
      return data.data;
    } catch (error) {
      // Re-throw with descriptive error message
      if (error instanceof Error) {
        throw new Error(`CADService.generateCAD failed: ${error.message}`);
      }
      throw new Error('CADService.generateCAD failed: Unknown error');
    }
  }

  /**
   * Fetches CAD generation history for the authenticated user
   * 
   * @param limit - Number of items to fetch (default: 10)
   * @param offset - Offset for pagination (default: 0)
   * @returns Promise resolving to CADHistoryResponse with history items and pagination
   * @throws Error if the API request fails
   */
  static async getHistory(
    limit: number = 10,
    offset: number = 0
  ): Promise<CADHistoryResponse> {
    try {
      // Build URL with query parameters
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const url = `${this.HISTORY_URL}?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch CAD history: ${response.statusText}${
            errorData.error ? ` - ${errorData.error}` : ''
          }`
        );
      }

      const data = await response.json();

      // Check if the response indicates success
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch CAD history');
      }

      // Return the history data with pagination
      return {
        data: data.data || [],
        pagination: data.pagination || {
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
      };
    } catch (error) {
      // Re-throw with descriptive error message
      if (error instanceof Error) {
        throw new Error(`CADService.getHistory failed: ${error.message}`);
      }
      throw new Error('CADService.getHistory failed: Unknown error');
    }
  }

  /**
   * Deletes a specific CAD history item
   * 
   * @param id - The ID of the history item to delete
   * @returns Promise resolving when deletion is complete
   * @throws Error if the API request fails
   */
  static async deleteHistoryItem(id: string): Promise<void> {
    try {
      const url = `${this.HISTORY_URL}?id=${encodeURIComponent(id)}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to delete CAD history item: ${response.statusText}${
            errorData.error ? ` - ${errorData.error}` : ''
          }`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete CAD history item');
      }
    } catch (error) {
      // Re-throw with descriptive error message
      if (error instanceof Error) {
        throw new Error(`CADService.deleteHistoryItem failed: ${error.message}`);
      }
      throw new Error('CADService.deleteHistoryItem failed: Unknown error');
    }
  }

  /**
   * Clears all CAD history for the authenticated user
   * 
   * @returns Promise resolving when all history is cleared
   * @throws Error if the API request fails
   */
  static async clearHistory(): Promise<void> {
    try {
      const response = await fetch(this.HISTORY_URL, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to clear CAD history: ${response.statusText}${
            errorData.error ? ` - ${errorData.error}` : ''
          }`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to clear CAD history');
      }
    } catch (error) {
      // Re-throw with descriptive error message
      if (error instanceof Error) {
        throw new Error(`CADService.clearHistory failed: ${error.message}`);
      }
      throw new Error('CADService.clearHistory failed: Unknown error');
    }
  }
}
