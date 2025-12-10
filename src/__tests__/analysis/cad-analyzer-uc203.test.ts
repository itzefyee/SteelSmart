/**
 * UC203: Generate analysis report
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

describe('UC203: Generate analysis report', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_ANA_UC203_001: should produce analysis report structure with reasoning and confidence', async () => {
    const file = makeMockFile('servo-motor-drawing.pdf', 'application/pdf');

    const analysis = await CADAnalysisService.analyzeDrawing(file);

    expect(analysis.analysisId).toMatch(/^analysis_/);
    expect(analysis.reasoning).toBeTruthy();
    expect(analysis.confidence).toBeGreaterThan(0);
    expect(analysis.extractedSpecs).toHaveProperty('dimensions');
    expect(Array.isArray(analysis.recommendedProducts)).toBe(true);
    expect(typeof analysis.totalRecommendations).toBe('number');
  });
});


