/**
 * UC202: Verify drawing specifications
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CADAnalysisService } from '@/services/cad-analysis.service';

vi.mock('@/lib/cache/redis-cache', () => ({
  getCached: vi.fn(async (_key: string, fetcher: () => Promise<any>) => fetcher()),
}));

vi.mock('@/lib/supabase-server', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
  return { getSupabaseServer: vi.fn(async () => mockSupabase) };
});

vi.mock('@/lib/gemini-client', () => ({
  geminiClient: {
    isConfigured: vi.fn(async () => false),
    analyzeDrawing: vi.fn(),
  },
}));

vi.mock('@/lib/product-matcher', () => ({
  productMatcher: {
    findMatchingProducts: vi.fn(async () => []),
    getAlternativeSuggestions: vi.fn(async () => null),
  },
}));

function makeMockFile(name: string, type: string, content = 'dummy'): File {
  const buffer = Buffer.from(content);
  return {
    name,
    type,
    size: buffer.length,
    arrayBuffer: async () => buffer,
    slice: () => new Blob(),
    stream: () => new ReadableStream(),
    text: async () => content,
    lastModified: Date.now(),
  } as unknown as File;
}

describe('UC202: Verify drawing specifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_ANA_UC202_001: should derive dimensions and material from CAD model data', async () => {
    const file = makeMockFile('model-with-bbox.step', 'application/step');

    const cadModelData = {
      boundingBox: {
        length: 10,
        width: 5,
        height: 2,
      },
      thicknessAnalysis: {
        estimatedThickness: 0.25,
      },
      faceCount: 42,
    };

    const analysis = await CADAnalysisService.analyzeDrawing(file, cadModelData);

    expect(analysis.extractedSpecs.dimensions).toBeDefined();
    expect(analysis.extractedSpecs.material).toContain('Steel');
    expect(analysis.extractedSpecs.componentType).toBeDefined();
    expect(analysis.extractedSpecs.tolerance).toBeDefined();
  });

  it('TC_ANA_UC202_002: should fall back to filename-based specs when no CAD model data is provided', async () => {
    const file = makeMockFile('steel-beam-drawing.pdf', 'application/pdf');

    const analysis = await CADAnalysisService.analyzeDrawing(file);

    expect(analysis.extractedSpecs.dimensions).toBe('200mm x 100mm x 6m length');
    expect(analysis.extractedSpecs.material).toBe('Grade S355 Steel');
    expect(analysis.extractedSpecs.componentType).toBe('structural beam');
  });
});


