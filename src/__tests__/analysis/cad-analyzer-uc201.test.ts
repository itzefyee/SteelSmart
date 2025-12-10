/**
 * UC201: Validate drawing manufacturability
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

describe('UC201: Validate drawing manufacturability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_ANA_UC201_001: should analyze a valid drawing file successfully', async () => {
    const file = makeMockFile('steel-beam-drawing.pdf', 'application/pdf');

    const analysis = await CADAnalysisService.analyzeDrawing(file);

    expect(analysis).toBeDefined();
    expect(analysis.analysisId).toMatch(/^analysis_/);
    expect(analysis.extractedSpecs).toBeDefined();
    expect(typeof analysis.confidence).toBe('number');
    expect(analysis.reasoning).toBeTruthy();
  });

  it('TC_ANA_UC201_002: should reject invalid file type with clear error message', async () => {
    const invalidFile = new File(['dummy'], 'notes.txt', {
      type: 'text/plain',
    });

    await expect(CADAnalysisService.analyzeDrawing(invalidFile)).rejects.toThrow(
      'Invalid file type. Please upload PDF, PNG, JPG, STEP, STL, OBJ, or DXF files.',
    );
  });

  it('TC_ANA_UC201_003: should reject files exceeding maximum size limit', async () => {
    const bigContent = 'x'.repeat(10 * 1024 * 1024 + 1); // > 10MB
    const largeFile = new File([bigContent], 'large-model.step', {
      type: 'application/step',
    });

    await expect(CADAnalysisService.analyzeDrawing(largeFile)).rejects.toThrow(
      'File size exceeds 10MB limit.',
    );
  });
});


