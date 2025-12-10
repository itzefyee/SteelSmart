/**
 * Test Cases for UC104: Download CAD drawing
 * 
 * Test Case IDs:
 * - TC_CAD_UC104_001: Download valid drawing as STEP
 * - TC_CAD_UC104_002: Download with unsaved edits
 * 
 * Note: These tests focus on the service layer and file generation.
 * Actual file download behavior would be tested in component/integration tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CADAPI, CADGenerationRequest, CADGenerationResult } from '@/lib/api/cad-api';

// Mock fetch globally
global.fetch = vi.fn();

describe('UC104: Download CAD drawing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TC_CAD_UC104_001: Download valid drawing as STEP', () => {
    it('should generate STEP format file for valid drawing', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'drawing-download-001',
        status: 'completed',
        model_data: 'base64-encoded-step-file-data',
        parameters: {
          format: 'step',
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
        description: 'Create a 1000mm long steel I-beam',
        format: 'step',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.model_data).toBeDefined();
      expect(result.parameters?.format).toBe('step');
    });

    it('should include model data in response for download', async () => {
      const mockStepData = 'base64-encoded-step-file-content';
      const mockResponse: CADGenerationResult = {
        id: 'drawing-download-002',
        status: 'completed',
        model_data: mockStepData,
        parameters: {
          format: 'step',
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
        description: 'Create a steel beam',
        format: 'step',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result.model_data).toBe(mockStepData);
      expect(result.model_data).toBeTruthy();
    });

    it('should support multiple download formats', async () => {
      const formats: Array<'step' | 'stl' | 'obj' | 'gltf' | 'glb'> = ['step', 'stl', 'obj'];

      for (const format of formats) {
        const mockResponse: CADGenerationResult = {
          id: `drawing-${format}`,
          status: 'completed',
          model_data: `base64-${format}-data`,
          parameters: {
            format,
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
          description: 'Create a steel beam',
          format,
        };

        const result = await CADAPI.generateCAD(request);

        expect(result.parameters?.format).toBe(format);
        expect(result.model_data).toBeDefined();
      }
    });

    it('should generate file with correct geometry matching original drawing', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'drawing-download-003',
        status: 'completed',
        model_data: 'base64-step-file',
        parameters: {
          format: 'step',
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
        description: 'Create a 1000mm long steel I-beam with 200mm flange width and 10mm web thickness',
        format: 'step',
      };

      const result = await CADAPI.generateCAD(request);

      // Verify parameters match original drawing
      expect(result.parameters?.length).toBe(1000);
      expect(result.parameters?.flangeWidth).toBe(200);
      expect(result.parameters?.webThickness).toBe(10);
      expect(result.model_data).toBeDefined();
    });
  });

  describe('TC_CAD_UC104_002: Download with unsaved edits', () => {
    it('should handle download request for drawing with unsaved changes', async () => {
      // First: Generate initial drawing
      const initialResponse: CADGenerationResult = {
        id: 'drawing-unsaved-001',
        status: 'completed',
        model_data: 'base64-initial-step',
        parameters: {
          length: 1000,
        },
      };

      // Second: Regenerate with edits (simulating unsaved changes)
      const editedResponse: CADGenerationResult = {
        id: 'drawing-unsaved-001',
        status: 'completed',
        model_data: 'base64-edited-step',
        parameters: {
          length: 1200, // edited but not saved
        },
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: initialResponse,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: editedResponse,
          }),
        });

      // Generate initial
      const initialRequest: CADGenerationRequest = {
        description: 'Create a 1000mm beam',
        format: 'step',
      };

      await CADAPI.generateCAD(initialRequest);

      // Request download with edits (regenerate with new description)
      const downloadRequest: CADGenerationRequest = {
        description: 'Create a 1200mm beam', // edited dimension
        format: 'step',
      };

      const result = await CADAPI.generateCAD(downloadRequest);

      // Note: In actual implementation, the system should either:
      // 1. Prompt to save first, or
      // 2. Export the latest version (edited)
      // This test verifies the service can handle the regeneration request
      expect(result.parameters?.length).toBe(1200);
      expect(result.model_data).toBeDefined();
    });

    it('should export latest version when downloading with unsaved edits', async () => {
      const latestResponse: CADGenerationResult = {
        id: 'drawing-latest',
        status: 'completed',
        model_data: 'base64-latest-step',
        parameters: {
          length: 1200, // latest edited value
          saved: false, // indicates unsaved
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: latestResponse,
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Export latest version (1200mm)',
        format: 'step',
      };

      const result = await CADAPI.generateCAD(request);

      // Verify latest version is exported
      expect(result.parameters?.length).toBe(1200);
      expect(result.model_data).toBeDefined();
    });

    it('should handle download request when drawing has been modified', async () => {
      const modifiedResponse: CADGenerationResult = {
        id: 'drawing-modified',
        status: 'completed',
        model_data: 'base64-modified-step',
        parameters: {
          length: 1500,
          modified: true,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: modifiedResponse,
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Export modified drawing',
        format: 'step',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result.parameters?.modified).toBe(true);
      expect(result.model_data).toBeDefined();
    });
  });

  describe('Additional edge cases for UC104', () => {
    it('should handle download request for non-existent drawing', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Drawing not available: Drawing ID not found',
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Download non-existent drawing',
        format: 'step',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow();
    });

    it('should handle large file generation for complex drawings', async () => {
      const largeFileData = 'base64-'.repeat(10000); // Simulate large file
      const mockResponse: CADGenerationResult = {
        id: 'drawing-large',
        status: 'completed',
        model_data: largeFileData,
        parameters: {
          format: 'step',
          fileSize: 'large',
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
        description: 'Create complex drawing with many features',
        format: 'step',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result.model_data).toBeDefined();
      expect(result.model_data?.length).toBeGreaterThan(1000);
    });

    it('should handle download format validation', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'drawing-format-test',
        status: 'completed',
        model_data: 'base64-data',
        parameters: {
          format: 'step',
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
        description: 'Create a beam',
        format: 'step',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result.parameters?.format).toBe('step');
    });

    it('should handle download error gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
        json: async () => ({
          error: 'Failed to generate download file',
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Create a beam',
        format: 'step',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow('Failed to generate CAD');
    });
  });
});












