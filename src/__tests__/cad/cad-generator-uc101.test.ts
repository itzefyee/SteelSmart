/**
 * Test Cases for UC101: Generate drawing from text input
 * 
 * Test Case IDs:
 * - TC_CAD_UC101_001: Generate drawing from valid text description
 * - TC_CAD_UC101_002: Validation on empty text input
 * - TC_CAD_UC101_003: Handle ambiguous text with clarification prompt
 * - TC_CAD_UC101_004: Validation error on unsupported shape
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CADAPI, CADGenerationRequest, CADGenerationResult } from '@/lib/api/cad-api';

// Mock fetch globally
global.fetch = vi.fn();

describe('UC101: Generate drawing from text input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TC_CAD_UC101_001: Generate drawing from valid text description', () => {
    it('should accept valid description and generate CAD drawing', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'test-id-001',
        status: 'completed',
        model_data: 'base64-encoded-model-data',
        preview_image: 'base64-encoded-preview',
        parameters: {
          length: 1000,
          flangeWidth: 200,
          webThickness: 10,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponse,
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Create a 1000mm long steel I-beam with 200mm flange width and 10mm web thickness.',
        category: 'beam',
        format: 'step',
        units: 'mm',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result).toBeDefined();
      expect(result.id).toBe('test-id-001');
      expect(result.status).toBe('completed');
      expect(result.parameters).toBeDefined();
      expect(result.parameters?.length).toBe(1000);
      expect(result.parameters?.flangeWidth).toBe(200);
      expect(result.parameters?.webThickness).toBe(10);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/generate-cad',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })
      );
    });

    it('should generate drawing with correct dimensions matching input', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'test-id-002',
        status: 'completed',
        model_data: 'base64-encoded-model-data',
        parameters: {
          length: 1000,
          flangeWidth: 200,
          webThickness: 10,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponse,
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Create a 1000mm long steel I-beam with 200mm flange width and 10mm web thickness.',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result.parameters?.length).toBe(1000);
      expect(result.parameters?.flangeWidth).toBe(200);
      expect(result.parameters?.webThickness).toBe(10);
    });
  });

  describe('TC_CAD_UC101_002: Validation on empty text input', () => {
    it('should throw error when description is empty', async () => {
      const request: CADGenerationRequest = {
        description: '',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow(
        'Description is required for CAD generation'
      );
    });

    it('should throw error when description is only whitespace', async () => {
      const request: CADGenerationRequest = {
        description: '   \n\t  ',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow(
        'Description is required for CAD generation'
      );
    });

    it('should reject empty description before making API call', async () => {
      const request: CADGenerationRequest = {
        description: '',
      };

      try {
        await CADAPI.generateCAD(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Description is required');
        expect(global.fetch).not.toHaveBeenCalled();
      }
    });
  });

  describe('TC_CAD_UC101_003: Handle ambiguous text with clarification prompt', () => {
    it('should handle ambiguous description and return appropriate response', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'test-id-003',
        status: 'failed',
        error: 'Ambiguous description: Please specify exact dimensions for length, width, and thickness',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Ambiguous description: Please specify exact dimensions for length, width, and thickness',
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Create a short beam with standard thickness',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow();
    });

    it('should detect missing dimensions in description', async () => {
      const mockResponse = {
        success: false,
        error: 'Missing required dimensions: length, width, thickness',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: CADGenerationRequest = {
        description: 'Create a beam',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow();
    });
  });

  describe('TC_CAD_UC101_004: Validation error on unsupported shape', () => {
    it('should reject unsupported geometry types', async () => {
      const mockResponse = {
        success: false,
        error: 'Unsupported geometry type: freeform curved surfaces are not supported',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: CADGenerationRequest = {
        description: 'Create a freeform curved steel plate with variable thickness',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow();
    });

    it('should handle API error response for unsupported shapes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Unsupported geometry type',
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Create a freeform curved steel plate with variable thickness',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow('Unsupported geometry type');
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const request: CADGenerationRequest = {
        description: 'Create a 1000mm steel beam',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow('Network error');
    });

    it('should handle HTTP error responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({
          error: 'Invalid request parameters',
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Create a freeform curved steel plate',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow('Failed to generate CAD');
    });
  });

  describe('Additional edge cases for UC101', () => {
    it('should handle very long descriptions', async () => {
      const longDescription = 'Create a '.repeat(1000) + 'steel beam';
      const mockResponse: CADGenerationResult = {
        id: 'test-id-long',
        status: 'completed',
        model_data: 'base64-data',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponse,
        }),
      });

      const request: CADGenerationRequest = {
        description: longDescription,
      };

      const result = await CADAPI.generateCAD(request);
      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
    });

    it('should handle special characters in description', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'test-id-special',
        status: 'completed',
        model_data: 'base64-data',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponse,
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Create a beam with dimensions: 1000mm × 200mm × 10mm (L×W×T)',
      };

      const result = await CADAPI.generateCAD(request);
      expect(result).toBeDefined();
    });

    it('should handle processing status and wait for completion', async () => {
      // First response: processing
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'test-id-processing',
            status: 'processing',
          },
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Create a 1000mm steel beam',
      };

      // Note: Actual polling would be handled by the API route
      // This test verifies the service can handle processing status
      const result = await CADAPI.generateCAD(request);
      expect(result.status).toBe('processing');
    });
  });
});


