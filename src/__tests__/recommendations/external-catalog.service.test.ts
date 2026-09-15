import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ExternalCatalogService,
  type GroundedCatalogAlternative,
} from '@/services/external-catalog.service';
import type { ExternalCatalogRepository } from '@/repositories/external-catalog.repository';

const normalizationData = {
  componentTaxonomy: [{ canonical_name: 'bolt', category: 'fasteners', keywords: ['hex bolt'] }],
  materialSynonyms: [{ family: 'carbon steel', synonyms: ['a36', 'mild steel'] }],
};

function makeRepository(overrides: Record<string, unknown> = {}) {
  return {
    getNormalizationData: vi.fn().mockResolvedValue(normalizationData),
    findFresh: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ExternalCatalogRepository;
}

describe('ExternalCatalogService', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('EXA_API_KEY', '');
    vi.stubEnv('FIRECRAWL_API_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns a durable cached supplier record without contacting providers', async () => {
    vi.stubEnv('EXA_API_KEY', 'exa-test-key');
    const cachedAlternative: GroundedCatalogAlternative = {
      name: 'Hex bolt catalogue listing',
      description: 'M8 carbon-steel bolt.',
      category: 'fasteners',
      material: 'ASTM A36',
      specifications: { dimensions: 'M8 x 30 mm' },
      confidence: 0.72,
      reasoning: 'Retrieved supplier record.',
      provenance: {
        status: 'retrieved',
        providers: ['exa'],
        sources: [{ url: 'https://supplier.example/hex-bolt', title: 'Hex bolt' }],
        retrievedAt: '2026-09-14T00:00:00.000Z',
        cacheStatus: 'fresh',
      },
    };
    const repository = makeRepository({
      findFresh: vi.fn().mockResolvedValue({
        items: [cachedAlternative],
        providers: ['exa'],
        fetched_at: '2026-09-14T00:00:00.000Z',
        expires_at: '2026-09-15T00:00:00.000Z',
      }),
    });
    const fetcher = vi.fn();
    const service = new ExternalCatalogService({ repository, fetcher: fetcher as typeof fetch });

    const result = await service.findAlternatives({ componentType: 'hex bolt', material: 'A36' });

    expect(result.cacheStatus).toBe('cached');
    expect(result.alternatives).toHaveLength(1);
    expect(result.alternatives[0].provenance.cacheStatus).toBe('cached');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('does not crawl or negative-cache when Exa is not configured', async () => {
    const repository = makeRepository();
    const fetcher = vi.fn();
    const service = new ExternalCatalogService({ repository, fetcher: fetcher as typeof fetch });

    const result = await service.findAlternatives({ componentType: 'bolt', material: 'A36' });

    expect(result.cacheStatus).toBe('unavailable');
    expect(result.alternatives).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
    expect((repository.save as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it('normalizes taxonomy/material data, discovers with Exa, and persists provenance', async () => {
    vi.stubEnv('EXA_API_KEY', 'exa-test-key');
    const repository = makeRepository();
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      results: [{
        title: 'M8 Hex Bolt',
        url: 'https://supplier.example/m8-hex-bolt',
        text: 'Carbon-steel M8 x 30 mm hex bolt specification.',
        score: 0.8,
      }],
    }), { status: 200 }));
    const service = new ExternalCatalogService({ repository, fetcher: fetcher as typeof fetch });

    const result = await service.findAlternatives({
      componentType: 'hex bolt',
      material: 'ASTM A36',
      dimensions: 'M8 x 30 mm',
    });

    expect(result.cacheStatus).toBe('fresh');
    expect(result.normalizedQuery).toEqual({
      componentType: 'bolt',
      category: 'fasteners',
      materialFamily: 'carbon steel',
    });
    expect(result.alternatives[0]).toMatchObject({
      name: 'M8 Hex Bolt',
      material: 'carbon steel',
      provenance: {
        status: 'retrieved',
        providers: ['exa'],
        sources: [{ url: 'https://supplier.example/m8-hex-bolt' }],
      },
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect((repository.save as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      expect.objectContaining({ providers: ['exa'] }),
    );
  });

  it('uses Firecrawl only after Exa has supplied a public supplier URL', async () => {
    vi.stubEnv('EXA_API_KEY', 'exa-test-key');
    vi.stubEnv('FIRECRAWL_API_KEY', 'firecrawl-test-key');
    const repository = makeRepository();
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        results: [{
          title: 'Initial listing',
          url: 'https://supplier.example/listing',
          text: 'Short discovery excerpt',
        }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: {
          markdown: '# M8 Hex Bolt\nCarbon steel specification and dimensions.',
          metadata: { title: 'M8 Hex Bolt' },
        },
      }), { status: 200 }));
    const service = new ExternalCatalogService({ repository, fetcher: fetcher as typeof fetch });

    const result = await service.findAlternatives({ componentType: 'bolt', material: 'A36' });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][0]).toBe('https://api.firecrawl.dev/v2/scrape');
    expect(result.alternatives[0].provenance.providers).toEqual(['exa', 'firecrawl']);
    expect(result.alternatives[0].name).toBe('M8 Hex Bolt');
  });
});
