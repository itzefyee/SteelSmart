/**
 * Test Cases for UC103: Edit generated CAD drawing
 * 
 * Test Case IDs:
 * - TC_CAD_UC103_001: Edit beam length in generated drawing
 * - TC_CAD_UC103_002: Prevent invalid hole placement
 * 
 * Note: These tests focus on the service layer validation and API interactions.
 * UI-level editing tests would be in component tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CADAPI, CADGenerationRequest, CADGenerationResult } from '@/lib/api/cad-api';

// Mock fetch globally
global.fetch = vi.fn();

describe('UC103: Edit generated CAD drawing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TC_CAD_UC103_001: Edit beam length in generated drawing', () => {
    it('should regenerate drawing with updated length dimension', async () => {
      // Initial drawing
      const initialResponse: CADGenerationResult = {
        id: 'drawing-001',
        status: 'completed',
        model_data: 'base64-initial-model',
        parameters: {
          length: 1000,
          flangeWidth: 200,
          webThickness: 10,
        },
      };

      // Updated drawing after edit
      const updatedResponse: CADGenerationResult = {
        id: 'drawing-001',
        status: 'completed',
        model_data: 'base64-updated-model',
        parameters: {
          length: 1200, // updated
          flangeWidth: 200, // unchanged
          webThickness: 10, // unchanged
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
            data: updatedResponse,
          }),
        });

      // Generate initial drawing
      const initialRequest: CADGenerationRequest = {
        description: 'Create a 1000mm long steel I-beam',
      };

      const initialResult = await CADAPI.generateCAD(initialRequest);
      expect(initialResult.parameters?.length).toBe(1000);

      // Edit: regenerate with new length
      const editRequest: CADGenerationRequest = {
        description: 'Create a 1200mm long steel I-beam with 200mm flange width and 10mm web thickness',
      };

      const updatedResult = await CADAPI.generateCAD(editRequest);
      expect(updatedResult.parameters?.length).toBe(1200);
      expect(updatedResult.parameters?.flangeWidth).toBe(200);
      expect(updatedResult.parameters?.webThickness).toBe(10);
    });

    it('should accept dimension changes and update geometry', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'drawing-edit-001',
        status: 'completed',
        model_data: 'base64-updated-model',
        parameters: {
          length: 1200,
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
        description: 'Update beam length to 1200mm',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result.parameters?.length).toBe(1200);
      expect(result.status).toBe('completed');
      expect(result.model_data).toBeDefined();
    });

    it('should maintain other dimensions when editing one dimension', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'drawing-edit-002',
        status: 'completed',
        parameters: {
          length: 1200, // changed
          flangeWidth: 200, // unchanged
          webThickness: 10, // unchanged
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
        description: 'Change length to 1200mm, keep other dimensions',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result.parameters?.length).toBe(1200);
      expect(result.parameters?.flangeWidth).toBe(200);
      expect(result.parameters?.webThickness).toBe(10);
    });

    it('should not introduce geometry errors after dimension update', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'drawing-edit-003',
        status: 'completed',
        model_data: 'base64-valid-model',
        parameters: {
          length: 1200,
          flangeWidth: 200,
          webThickness: 10,
        },
        error: undefined, // No errors
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponse,
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Update beam length to 1200mm',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result.status).toBe('completed');
      expect(result.error).toBeUndefined();
      expect(result.model_data).toBeDefined();
    });
  });

  describe('TC_CAD_UC103_002: Prevent invalid hole placement', () => {
    it('should reject hole placement that violates minimum edge distance', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Constraint violation: Hole too close to edge. Minimum edge distance: 20mm, Actual: 5mm',
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Add bolt hole 5mm from flange edge',
        category: 'beam',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow('CAD generation failed');
    });

    it('should block save when constraint violation is detected', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Cannot save: Constraint violation detected. Please correct hole placement before saving.',
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Add hole violating edge distance constraint',
      };

      try {
        await CADAPI.generateCAD(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('CAD generation failed');
      }
    });

    it('should provide clear error message about constraint violation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Hole position invalid: Minimum edge distance is 20mm. Current distance: 5mm. Please move hole further from edge.',
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Add hole too close to edge',
      };

      try {
        await CADAPI.generateCAD(request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain('CAD generation failed');
      }
    });

    it('should allow valid hole placement within constraints', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'drawing-hole-001',
        status: 'completed',
        model_data: 'base64-model-with-hole',
        parameters: {
          length: 1000,
          holes: [
            {
              position: { x: 100, y: 100 },
              diameter: 10,
              edgeDistance: 25, // Valid: > 20mm minimum
            },
          ],
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
        description: 'Add bolt hole 25mm from edge',
        category: 'beam',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result.status).toBe('completed');
      expect(result.parameters?.holes).toBeDefined();
      expect(result.parameters?.holes[0].edgeDistance).toBeGreaterThan(20);
    });
  });

  describe('Additional edge cases for UC103', () => {
    it('should handle multiple simultaneous dimension edits', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'drawing-multi-edit',
        status: 'completed',
        parameters: {
          length: 1500,
          flangeWidth: 250,
          webThickness: 12,
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
        description: 'Update: length 1500mm, flange 250mm, web 12mm',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result.parameters?.length).toBe(1500);
      expect(result.parameters?.flangeWidth).toBe(250);
      expect(result.parameters?.webThickness).toBe(12);
    });

    it('should handle feature addition (holes, notches, etc.)', async () => {
      const mockResponse: CADGenerationResult = {
        id: 'drawing-feature-add',
        status: 'completed',
        parameters: {
          length: 1000,
          features: ['hole', 'notch'],
          holeCount: 4,
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
        description: 'Add 4 bolt holes and 1 notch',
      };

      const result = await CADAPI.generateCAD(request);

      expect(result.parameters?.features).toContain('hole');
      expect(result.parameters?.holeCount).toBe(4);
    });

    it('should validate all constraints before accepting edits', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Multiple constraint violations: hole edge distance, minimum spacing',
        }),
      });

      const request: CADGenerationRequest = {
        description: 'Add holes with multiple constraint violations',
      };

      await expect(CADAPI.generateCAD(request)).rejects.toThrow();
    });
  });
});


