/**
 * Test Cases for UC102: Generate drawing from template
 * 
 * Test Case IDs:
 * - TC_CAD_UC102_001: Generate drawing from standard template
 * - TC_CAD_UC102_002: Reject out-of-range dimension in template
 * - TC_CAD_UC102_003: Generate from template with modified parameters
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CADAPI, CADGenerationRequest, CADGenerationResult } from '@/lib/api/cad-api';

// Mock fetch globally
global.fetch = vi.fn();

describe('UC102: Generate drawing from template', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TC_CAD_UC102_001: Generate drawing from standard template', () => {
    it('should generate drawing using template with default parameters', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'template-001',
        status: 'completed',
        model_data: 'base64-encoded-model-data',
        preview_image: 'base64-encoded-preview',
        parameters: {
          length: 1000, // default template value
          flangeWidth: 200, // default template value
          webThickness: 10, // default template value
          material: 'S355', // default template value
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponse,
        }),
      });

      // Template-based description that matches standard I-beam template
      const request: CADGenerationRequest = {
        description: 'Generate standard I-beam template with default parameters',
        category: 'beam',
        format: 'step',
        units: 'mm',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result).toBeDefined();
      expect(result.id).toBe('template-001');
      expect(result.status).toBe('completed');
      expect(result.parameters).toBeDefined();
      expect(result.parameters?.length).toBe(1000);
      expect(result.parameters?.flangeWidth).toBe(200);
      expect(result.parameters?.webThickness).toBe(10);
      expect(result.parameters?.material).toBe('S355');
    });

    it('should display template details when template is selected', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'template-002',
        status: 'completed',
        parameters: {
          templateName: 'Standard I-Beam',
          length: 1000,
          flangeWidth: 200,
          material: 'S355',
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
        description: 'Standard I-Beam template',
        category: 'beam',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result.parameters?.templateName).toBe('Standard I-Beam');
      expect(result.parameters?.length).toBe(1000);
      expect(result.parameters?.flangeWidth).toBe(200);
    });

    it('should match generated parameters to template defaults', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'template-003',
        status: 'completed',
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
        description: 'Standard I-Beam template',
      };

      const result = await CADAPI.generateCAD(request);

      // Verify parameters match expected template defaults
      expect(result.parameters?.length).toBe(1000);
      expect(result.parameters?.flangeWidth).toBe(200);
      expect(result.parameters?.webThickness).toBe(10);
    });
  });

  describe('TC_CAD_UC102_002: Reject out-of-range dimension in template', () => {
    it('should reject negative dimension values', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Invalid dimension: Length must be between 100mm and 12000mm',
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Standard I-Beam with length -500mm',
        category: 'beam',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow('Invalid dimension');
    });

    it('should reject excessively large dimension values', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Invalid dimension: Length exceeds maximum limit of 12000mm',
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Standard I-Beam with length 15000mm',
        category: 'beam',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow();
    });

    it('should highlight invalid field in error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Validation error: Length must be between 100mm and 12000mm. Current value: -500mm',
          invalidFields: ['length'],
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Standard I-Beam with length -500mm',
      };

      try {
        await CADAPI.generateCAD(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Validation error');
      }
    });

    it('should prevent generation when dimension is out of range', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Length must be between 100mm and 12000mm',
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Standard I-Beam with length -500mm',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow();
      // Verify no successful generation occurred
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('TC_CAD_UC102_003: Generate from template with modified parameters', () => {
    it('should generate drawing with modified template parameters', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'template-modified-001',
        status: 'completed',
        model_data: 'base64-encoded-model-data',
        parameters: {
          length: 1200, // modified from default 1000
          flangeWidth: 250, // modified from default 200
          webThickness: 10, // unchanged
          material: 'S355', // unchanged
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
        description: 'Standard I-Beam with length 1200mm and flange width 250mm',
        category: 'beam',
        format: 'step',
        units: 'mm',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.parameters?.length).toBe(1200);
      expect(result.parameters?.flangeWidth).toBe(250);
      expect(result.parameters?.webThickness).toBe(10);
    });

    it('should accept valid parameter modifications within range', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'template-modified-002',
        status: 'completed',
        parameters: {
          length: 5000,
          flangeWidth: 300,
          webThickness: 15,
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
        description: 'Standard I-Beam: length 5000mm, flange 300mm, web 15mm',
        category: 'beam',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result.parameters?.length).toBe(5000);
      expect(result.parameters?.flangeWidth).toBe(300);
      expect(result.parameters?.webThickness).toBe(15);
    });

    it('should preserve unchanged parameters when modifying others', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'template-modified-003',
        status: 'completed',
        parameters: {
          length: 1200, // modified
          flangeWidth: 200, // unchanged (default)
          webThickness: 10, // unchanged (default)
          material: 'S355', // unchanged (default)
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
        description: 'Standard I-Beam with length 1200mm',
        category: 'beam',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result.parameters?.length).toBe(1200);
      expect(result.parameters?.flangeWidth).toBe(200);
      expect(result.parameters?.webThickness).toBe(10);
      expect(result.parameters?.material).toBe('S355');
    });
  });

  describe('Additional edge cases for UC102', () => {
    it('should handle template not found error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Template not found: Invalid template ID',
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Non-existent template',
        category: 'beam',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow();
    });

    it('should handle missing mandatory template parameters', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Missing required parameter: length',
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Standard I-Beam',
        category: 'beam',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow();
    });

    it('should validate all template parameters before generation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Multiple validation errors: length, width',
          invalidFields: ['length', 'width'],
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Standard I-Beam with invalid parameters',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow();
    });
  });
});











