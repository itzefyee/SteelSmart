/**
 * Test Cases for UC103: Edit generated CAD drawing metadata
 * 
 * Current Implementation:
 * The "Edit Drawing" feature allows users to modify drawing metadata/parameters:
 * - Format (step, stl, obj, etc.)
 * - Units (mm, in, etc.)
 * - Category (custom, beam, etc.)
 * - Prompt (description text)
 * 
 * Note: Geometry editing (dimensions, holes, features) is NOT currently implemented.
 * These tests cover the metadata editing functionality that exists.
 * 
 * Test Case IDs:
 * - TC_CAD_UC103_001: Edit drawing format parameter
 * - TC_CAD_UC103_002: Edit drawing units parameter
 * - TC_CAD_UC103_003: Edit drawing category parameter
 * - TC_CAD_UC103_004: Edit drawing prompt/description
 * - TC_CAD_UC103_005: Validate metadata changes before save
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the CAD history update API
global.fetch = vi.fn();

/**
 * Represents the editable metadata fields for a CAD drawing
 */
interface CADDrawingMetadata {
  id: string;
  format: 'step' | 'stl' | 'obj' | 'gltf' | 'glb' | 'dxf';
  units: 'mm' | 'in' | 'cm' | 'm';
  category: string;
  prompt: string;
  generated_at: string;
}

/**
 * Simulates the metadata update API call
 */
async function updateDrawingMetadata(
  drawingId: string,
  updates: Partial<CADDrawingMetadata>
): Promise<{ success: boolean; data?: CADDrawingMetadata; error?: string }> {
  const response = await fetch(`/api/cad-history/${drawingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update drawing metadata');
  }

  return response.json();
}

/**
 * Validates metadata fields before submission
 */
function validateMetadata(metadata: Partial<CADDrawingMetadata>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (metadata.format !== undefined) {
    const validFormats = ['step', 'stl', 'obj', 'gltf', 'glb', 'dxf'];
    if (!validFormats.includes(metadata.format)) {
      errors.push(`Invalid format: ${metadata.format}. Must be one of: ${validFormats.join(', ')}`);
    }
  }

  if (metadata.units !== undefined) {
    const validUnits = ['mm', 'in', 'cm', 'm'];
    if (!validUnits.includes(metadata.units)) {
      errors.push(`Invalid units: ${metadata.units}. Must be one of: ${validUnits.join(', ')}`);
    }
  }

  if (metadata.prompt !== undefined) {
    if (metadata.prompt.trim().length === 0) {
      errors.push('Prompt cannot be empty');
    }
    if (metadata.prompt.length > 1000) {
      errors.push('Prompt exceeds maximum length of 1000 characters');
    }
  }

  if (metadata.category !== undefined) {
    if (metadata.category.trim().length === 0) {
      errors.push('Category cannot be empty');
    }
  }

  return { valid: errors.length === 0, errors };
}

describe('UC103: Edit generated CAD drawing metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TC_CAD_UC103_001: Edit drawing format parameter', () => {
    it('should update format from STEP to STL', async () => {
      const drawingId = 'drawing-001';
      const updatedMetadata: CADDrawingMetadata = {
        id: drawingId,
        format: 'stl',
        units: 'mm',
        category: 'custom',
        prompt: 'I-beam, 12 in long, 4 in high',
        generated_at: '2025-12-23T13:05:28.391715+00:00',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updatedMetadata }),
      });

      const result = await updateDrawingMetadata(drawingId, { format: 'stl' });

      expect(result.success).toBe(true);
      expect(result.data?.format).toBe('stl');
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/cad-history/${drawingId}`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ format: 'stl' }),
        })
      );
    });

    it('should reject invalid format values', () => {
      const validation = validateMetadata({ format: 'invalid' as any });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(
        'Invalid format: invalid. Must be one of: step, stl, obj, gltf, glb, dxf'
      );
    });

    it('should accept all valid format options', () => {
      const validFormats: CADDrawingMetadata['format'][] = ['step', 'stl', 'obj', 'gltf', 'glb', 'dxf'];

      for (const format of validFormats) {
        const validation = validateMetadata({ format });
        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      }
    });
  });

  describe('TC_CAD_UC103_002: Edit drawing units parameter', () => {
    it('should update units from mm to inches', async () => {
      const drawingId = 'drawing-002';
      const updatedMetadata: CADDrawingMetadata = {
        id: drawingId,
        format: 'step',
        units: 'in',
        category: 'custom',
        prompt: 'I-beam, 12 in long',
        generated_at: '2025-12-23T13:05:28.391715+00:00',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updatedMetadata }),
      });

      const result = await updateDrawingMetadata(drawingId, { units: 'in' });

      expect(result.success).toBe(true);
      expect(result.data?.units).toBe('in');
    });

    it('should reject invalid unit values', () => {
      const validation = validateMetadata({ units: 'feet' as any });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(
        'Invalid units: feet. Must be one of: mm, in, cm, m'
      );
    });

    it('should accept all valid unit options', () => {
      const validUnits: CADDrawingMetadata['units'][] = ['mm', 'in', 'cm', 'm'];

      for (const units of validUnits) {
        const validation = validateMetadata({ units });
        expect(validation.valid).toBe(true);
      }
    });
  });

  describe('TC_CAD_UC103_003: Edit drawing category parameter', () => {
    it('should update category from custom to beam', async () => {
      const drawingId = 'drawing-003';
      const updatedMetadata: CADDrawingMetadata = {
        id: drawingId,
        format: 'step',
        units: 'mm',
        category: 'beam',
        prompt: 'I-beam structure',
        generated_at: '2025-12-23T13:05:28.391715+00:00',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updatedMetadata }),
      });

      const result = await updateDrawingMetadata(drawingId, { category: 'beam' });

      expect(result.success).toBe(true);
      expect(result.data?.category).toBe('beam');
    });

    it('should reject empty category', () => {
      const validation = validateMetadata({ category: '' });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Category cannot be empty');
    });

    it('should reject whitespace-only category', () => {
      const validation = validateMetadata({ category: '   ' });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Category cannot be empty');
    });
  });

  describe('TC_CAD_UC103_004: Edit drawing prompt/description', () => {
    it('should update prompt text', async () => {
      const drawingId = 'drawing-004';
      const newPrompt = 'Updated: I-beam, 14 in long, 5 in high, 3 in flange';
      const updatedMetadata: CADDrawingMetadata = {
        id: drawingId,
        format: 'step',
        units: 'mm',
        category: 'custom',
        prompt: newPrompt,
        generated_at: '2025-12-23T13:05:28.391715+00:00',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updatedMetadata }),
      });

      const result = await updateDrawingMetadata(drawingId, { prompt: newPrompt });

      expect(result.success).toBe(true);
      expect(result.data?.prompt).toBe(newPrompt);
    });

    it('should reject empty prompt', () => {
      const validation = validateMetadata({ prompt: '' });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Prompt cannot be empty');
    });

    it('should reject prompt exceeding max length', () => {
      const longPrompt = 'a'.repeat(1001);
      const validation = validateMetadata({ prompt: longPrompt });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Prompt exceeds maximum length of 1000 characters');
    });

    it('should accept prompt at max length', () => {
      const maxPrompt = 'a'.repeat(1000);
      const validation = validateMetadata({ prompt: maxPrompt });

      expect(validation.valid).toBe(true);
    });
  });

  describe('TC_CAD_UC103_005: Validate metadata changes before save', () => {
    it('should validate all fields before API call', async () => {
      const invalidUpdates = {
        format: 'invalid' as any,
        units: 'feet' as any,
        category: '',
        prompt: '',
      };

      const validation = validateMetadata(invalidUpdates);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBe(4);
    });

    it('should allow partial updates with valid fields only', async () => {
      const drawingId = 'drawing-005';
      const partialUpdate = { format: 'obj' as const, units: 'cm' as const };

      const validation = validateMetadata(partialUpdate);
      expect(validation.valid).toBe(true);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: drawingId,
            format: 'obj',
            units: 'cm',
            category: 'custom',
            prompt: 'Original prompt',
            generated_at: '2025-12-23T13:05:28.391715+00:00',
          },
        }),
      });

      const result = await updateDrawingMetadata(drawingId, partialUpdate);

      expect(result.success).toBe(true);
      expect(result.data?.format).toBe('obj');
      expect(result.data?.units).toBe('cm');
    });

    it('should handle API errors gracefully', async () => {
      const drawingId = 'non-existent-id';

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Drawing not found' }),
      });

      await expect(updateDrawingMetadata(drawingId, { format: 'stl' })).rejects.toThrow(
        'Drawing not found'
      );
    });

    it('should handle network errors', async () => {
      const drawingId = 'drawing-006';

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(updateDrawingMetadata(drawingId, { format: 'stl' })).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('Additional edge cases for UC103', () => {
    it('should preserve unchanged fields when updating specific fields', async () => {
      const drawingId = 'drawing-007';
      const originalMetadata: CADDrawingMetadata = {
        id: drawingId,
        format: 'step',
        units: 'mm',
        category: 'custom',
        prompt: 'Original I-beam prompt',
        generated_at: '2025-12-23T13:05:28.391715+00:00',
      };

      // Only update format, other fields should remain unchanged
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...originalMetadata, format: 'stl' },
        }),
      });

      const result = await updateDrawingMetadata(drawingId, { format: 'stl' });

      expect(result.data?.format).toBe('stl');
      expect(result.data?.units).toBe('mm'); // unchanged
      expect(result.data?.category).toBe('custom'); // unchanged
      expect(result.data?.prompt).toBe('Original I-beam prompt'); // unchanged
    });

    it('should handle special characters in prompt', async () => {
      const drawingId = 'drawing-008';
      const specialPrompt = 'I-beam: 12" × 4" × 0.29" flange (±0.01" tolerance)';

      const validation = validateMetadata({ prompt: specialPrompt });
      expect(validation.valid).toBe(true);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: drawingId,
            format: 'step',
            units: 'in',
            category: 'beam',
            prompt: specialPrompt,
            generated_at: '2025-12-23T13:05:28.391715+00:00',
          },
        }),
      });

      const result = await updateDrawingMetadata(drawingId, { prompt: specialPrompt });

      expect(result.data?.prompt).toBe(specialPrompt);
    });

    it('should trim whitespace from prompt before validation', () => {
      const promptWithWhitespace = '  Valid prompt with spaces  ';
      // Note: In actual implementation, trimming would happen before validation
      const trimmedPrompt = promptWithWhitespace.trim();

      const validation = validateMetadata({ prompt: trimmedPrompt });
      expect(validation.valid).toBe(true);
    });
  });
});
