import { createHash } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';
import {
  ExternalCatalogRepository,
  type ExternalCatalogNormalizationData,
} from '@/repositories/external-catalog.repository';

export type ExternalCatalogProvider = 'exa' | 'firecrawl';

export interface ExternalCatalogQuery {
  productName?: string;
  componentType?: string;
  category?: string;
  material?: string;
  dimensions?: string;
  loadCapacity?: string;
}

export interface ExternalCatalogSource {
  url: string;
  title?: string;
  excerpt?: string;
}

export interface AlternativeProvenance {
  /** Retrieved records have an auditable supplier URL; inferred records do not. */
  status: 'retrieved' | 'inferred';
  providers?: ExternalCatalogProvider[];
  sources?: ExternalCatalogSource[];
  retrievedAt?: string;
  cacheStatus?: 'fresh' | 'cached';
  /** Sources that informed an LLM inference, distinct from a retrieved listing. */
  groundedBy?: ExternalCatalogSource[];
}

export interface GroundedCatalogAlternative {
  name: string;
  description: string;
  category: string;
  material?: string;
  specifications: {
    dimensions?: string;
    loadCapacity?: string;
    standards?: string[];
    partNumber?: string;
  };
  confidence: number;
  reasoning: string;
  supplierInfo?: {
    suggestedSuppliers: string[];
    estimatedPrice?: string;
    leadTime?: string;
  };
  provenance: AlternativeProvenance;
}

export interface ExternalCatalogSearchResult {
  alternatives: GroundedCatalogAlternative[];
  providers: ExternalCatalogProvider[];
  cacheStatus: 'fresh' | 'cached' | 'unavailable';
  normalizedQuery: {
    componentType?: string;
    category?: string;
    materialFamily?: string;
  };
}

interface NormalizedQuery extends ExternalCatalogQuery {
  componentType?: string;
  category?: string;
  materialFamily?: string;
}

interface ExaResult {
  title?: unknown;
  url?: unknown;
  text?: unknown;
  highlights?: unknown;
  score?: unknown;
}

interface DiscoveryCandidate {
  title: string;
  url: string;
  excerpt: string;
  score?: number;
  providers: ExternalCatalogProvider[];
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PROVIDER_TIMEOUT_MS = 8_000;
const MAX_DISCOVERY_RESULTS = 5;
const MAX_FIRECRAWL_PAGES = 3;

const CATEGORY_FALLBACKS: Array<{ category: string; terms: string[] }> = [
  { category: 'fasteners', terms: ['bolt', 'nut', 'washer', 'screw', 'fastener', 'rivet'] },
  { category: 'robotic', terms: ['servo', 'motor', 'actuator', 'sensor', 'encoder', 'robot'] },
  { category: 'structural', terms: ['beam', 'plate', 'angle', 'channel', 'column', 'bracket', 'frame'] },
];

/**
 * Retrieves supplier catalogue candidates behind a durable Supabase TTL cache.
 * Exa is used for request-time discovery; Firecrawl enriches a bounded subset
 * of those URLs before the result is cached. Neither provider is contacted
 * unless both its key and the cache persistence layer are available.
 */
export class ExternalCatalogService {
  private readonly repository?: ExternalCatalogRepository;
  private readonly fetcher: typeof fetch;

  constructor(options: {
    repository?: ExternalCatalogRepository;
    fetcher?: typeof fetch;
  } = {}) {
    this.repository = options.repository;
    this.fetcher = options.fetcher ?? fetch;
  }

  async findAlternatives(query: ExternalCatalogQuery): Promise<ExternalCatalogSearchResult> {
    const repository = this.getRepository();
    if (!repository) {
      return this.unavailableResult(query);
    }

    let normalization: ExternalCatalogNormalizationData;
    try {
      normalization = await repository.getNormalizationData();
    } catch (error) {
      console.warn('External catalog taxonomy normalization is unavailable:', error);
      normalization = { componentTaxonomy: [], materialSynonyms: [] };
    }

    const normalized = this.normalizeQuery(query, normalization);
    const cacheKey = this.createCacheKey(normalized);
    const now = new Date();

    try {
      const cached = await repository.findFresh(cacheKey, now.toISOString());
      if (cached) {
        const alternatives = this.readCachedAlternatives(cached.items, cached.fetched_at, cached.expires_at);
        return {
          alternatives,
          providers: this.readProviders(cached.providers),
          cacheStatus: 'cached',
          normalizedQuery: this.publicNormalization(normalized),
        };
      }
    } catch (error) {
      // Fail closed: without durable caching, do not turn every route request
      // into a supplier crawl when a database outage occurs.
      console.warn('External catalog cache is unavailable; skipping provider discovery:', error);
      return this.unavailableResult(normalized);
    }

    // Exa is the discovery provider. Do not cache an empty response merely
    // because external grounding is disabled; a later key configuration should
    // take effect immediately rather than waiting for a negative-cache TTL.
    if (!process.env.EXA_API_KEY) {
      return this.unavailableResult(normalized);
    }

    const discovered = await this.discover(normalized);
    const alternatives = this.toAlternatives(discovered, normalized, now.toISOString());
    const providers = this.readProviders(
      [...new Set(discovered.flatMap(candidate => candidate.providers))]
    );
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS).toISOString();

    try {
      await repository.save({
        cacheKey,
        query: this.toCacheQuery(normalized),
        items: alternatives as unknown as Json,
        providers,
        fetchedAt: now.toISOString(),
        expiresAt,
      });
    } catch (error) {
      // A provider response without a durable cache would cause repeat crawls,
      // so do not return it as a successful retrieval.
      console.warn('External catalog cache write failed; discarding provider response:', error);
      return this.unavailableResult(normalized);
    }

    return {
      alternatives,
      providers,
      cacheStatus: 'fresh',
      normalizedQuery: this.publicNormalization(normalized),
    };
  }

  private getRepository(): ExternalCatalogRepository | null {
    if (this.repository) return this.repository;

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return null;
    }

    try {
      return new ExternalCatalogRepository(getSupabaseAdmin());
    } catch (error) {
      console.warn('External catalog cache is not configured:', error);
      return null;
    }
  }

  private normalizeQuery(
    query: ExternalCatalogQuery,
    data: ExternalCatalogNormalizationData,
  ): NormalizedQuery {
    const rawComponent = this.clean(query.componentType || query.productName);
    const componentTokens = this.tokens(rawComponent);
    const taxonomyMatch = data.componentTaxonomy.find(component => {
      const terms = [component.canonical_name, ...(component.keywords ?? [])]
        .flatMap(term => this.tokens(term));
      return terms.some(term => componentTokens.includes(term));
    });

    const material = this.clean(query.material);
    const normalizedMaterial = material.toLowerCase();
    const materialFamily = data.materialSynonyms.find(row =>
      [row.family, ...(row.synonyms ?? [])]
        .some(term => normalizedMaterial.includes(term.toLowerCase()))
    )?.family || this.getMaterialFallback(normalizedMaterial);

    return {
      productName: this.clean(query.productName),
      componentType: taxonomyMatch?.canonical_name || rawComponent || undefined,
      category: taxonomyMatch?.category || this.clean(query.category) || this.getCategoryFallback(componentTokens),
      // Use the taxonomy family for matching and returned supplier records.
      // The original grade remains in the search prompt, while consumers get a
      // consistent material value to compare against catalogue products.
      material: materialFamily || material || undefined,
      materialFamily,
      dimensions: this.clean(query.dimensions) || undefined,
      loadCapacity: this.clean(query.loadCapacity) || undefined,
    };
  }

  private async discover(query: NormalizedQuery): Promise<DiscoveryCandidate[]> {
    if (!process.env.EXA_API_KEY) {
      return [];
    }

    const candidates = await this.searchExa(this.buildSearchQuery(query));
    if (candidates.length === 0 || !process.env.FIRECRAWL_API_KEY) {
      return candidates;
    }

    return this.enrichWithFirecrawl(candidates);
  }

  private async searchExa(query: string): Promise<DiscoveryCandidate[]> {
    try {
      const response = await this.fetchWithTimeout('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXA_API_KEY!,
        },
        body: JSON.stringify({
          query,
          type: 'auto',
          numResults: MAX_DISCOVERY_RESULTS,
          contents: { text: { maxCharacters: 1_500 } },
        }),
      });

      if (!response.ok) {
        console.warn(`Exa discovery returned ${response.status}`);
        return [];
      }

      const payload = await response.json() as { results?: unknown };
      if (!Array.isArray(payload.results)) return [];

      return payload.results.flatMap((result): DiscoveryCandidate[] => {
        const candidate = result as ExaResult;
        const url = typeof candidate.url === 'string' ? candidate.url : '';
        if (!this.isPublicHttpUrl(url)) return [];

        const title = this.clean(typeof candidate.title === 'string' ? candidate.title : '') || this.hostFromUrl(url);
        const excerpt = this.clean(this.firstText(candidate.text, candidate.highlights));
        return [{
          title,
          url,
          excerpt: excerpt.slice(0, 1_500),
          score: typeof candidate.score === 'number' && Number.isFinite(candidate.score) ? candidate.score : undefined,
          providers: ['exa'],
        }];
      });
    } catch (error) {
      console.warn('Exa discovery failed; keeping static and AI alternatives available:', error);
      return [];
    }
  }

  private async enrichWithFirecrawl(candidates: DiscoveryCandidate[]): Promise<DiscoveryCandidate[]> {
    const enriched = await Promise.all(candidates.slice(0, MAX_FIRECRAWL_PAGES).map(async candidate => {
      try {
        const response = await this.fetchWithTimeout('https://api.firecrawl.dev/v2/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY!}`,
          },
          body: JSON.stringify({
            url: candidate.url,
            formats: ['markdown'],
            onlyMainContent: true,
          }),
        });

        if (!response.ok) return candidate;
        const payload = await response.json() as { data?: { markdown?: unknown; metadata?: { title?: unknown } } };
        const markdown = typeof payload.data?.markdown === 'string' ? payload.data.markdown : '';
        const title = typeof payload.data?.metadata?.title === 'string'
          ? this.clean(payload.data.metadata.title)
          : candidate.title;

        if (!markdown.trim()) return candidate;
        const enrichedCandidate: DiscoveryCandidate = {
          ...candidate,
          title: title || candidate.title,
          excerpt: this.clean(markdown).slice(0, 1_500),
          providers: ['exa', 'firecrawl'],
        };
        return enrichedCandidate;
      } catch (error) {
        console.warn(`Firecrawl extraction failed for ${this.hostFromUrl(candidate.url)}:`, error);
        return candidate;
      }
    }));

    return [...enriched, ...candidates.slice(MAX_FIRECRAWL_PAGES)];
  }

  private toAlternatives(
    candidates: DiscoveryCandidate[],
    query: NormalizedQuery,
    retrievedAt: string,
  ): GroundedCatalogAlternative[] {
    const seenUrls = new Set<string>();
    return candidates.flatMap(candidate => {
      if (seenUrls.has(candidate.url)) return [];
      seenUrls.add(candidate.url);

      const source: ExternalCatalogSource = {
        url: candidate.url,
        title: candidate.title,
        excerpt: candidate.excerpt || undefined,
      };
      const confidence = Math.min(0.82, Math.max(0.58, 0.64 + ((candidate.score ?? 0.5) * 0.18)));
      return [{
        name: candidate.title,
        description: candidate.excerpt || `Supplier catalogue result from ${this.hostFromUrl(candidate.url)}.`,
        category: query.category || 'custom',
        material: query.material || query.materialFamily,
        specifications: {
          dimensions: query.dimensions,
          loadCapacity: query.loadCapacity,
        },
        confidence,
        reasoning: `Retrieved from ${this.hostFromUrl(candidate.url)} for the normalized ${query.componentType || 'component'} requirements.`,
        supplierInfo: {
          suggestedSuppliers: [this.hostFromUrl(candidate.url)],
        },
        provenance: {
          status: 'retrieved',
          providers: candidate.providers,
          sources: [source],
          retrievedAt,
          cacheStatus: 'fresh',
        },
      }];
    });
  }

  private readCachedAlternatives(items: Json, fetchedAt: string, expiresAt: string): GroundedCatalogAlternative[] {
    if (!Array.isArray(items)) return [];

    return items.flatMap((item): GroundedCatalogAlternative[] => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
      const candidate = item as unknown as GroundedCatalogAlternative;
      if (!candidate.name || !candidate.description || !candidate.provenance || candidate.provenance.status !== 'retrieved') {
        return [];
      }
      return [{
        ...candidate,
        provenance: {
          ...candidate.provenance,
          cacheStatus: 'cached',
          retrievedAt: candidate.provenance.retrievedAt || fetchedAt,
          sources: candidate.provenance.sources?.filter(source => this.isPublicHttpUrl(source.url)).slice(0, 1),
        },
      }];
    });
  }

  private buildSearchQuery(query: NormalizedQuery): string {
    return [
      query.componentType || query.productName || 'steel component',
      query.material,
      query.materialFamily && query.materialFamily !== query.material ? query.materialFamily : undefined,
      query.dimensions,
      query.loadCapacity,
      'supplier catalogue product specifications',
    ].filter(Boolean).join(' ').slice(0, 500);
  }

  private createCacheKey(query: NormalizedQuery): string {
    const stableQuery = JSON.stringify({
      componentType: query.componentType?.toLowerCase() || '',
      category: query.category?.toLowerCase() || '',
      materialFamily: query.materialFamily?.toLowerCase() || '',
      material: query.material?.toLowerCase() || '',
      dimensions: query.dimensions?.toLowerCase() || '',
      loadCapacity: query.loadCapacity?.toLowerCase() || '',
    });
    return `v1:${createHash('sha256').update(stableQuery).digest('hex')}`;
  }

  private toCacheQuery(query: NormalizedQuery): Json {
    return {
      componentType: query.componentType || null,
      category: query.category || null,
      materialFamily: query.materialFamily || null,
      material: query.material || null,
      dimensions: query.dimensions || null,
      loadCapacity: query.loadCapacity || null,
    };
  }

  private unavailableResult(query: ExternalCatalogQuery): ExternalCatalogSearchResult {
    return {
      alternatives: [],
      providers: [],
      cacheStatus: 'unavailable',
      normalizedQuery: {
        componentType: query.componentType,
        category: query.category,
      },
    };
  }

  private publicNormalization(query: NormalizedQuery): ExternalCatalogSearchResult['normalizedQuery'] {
    return {
      componentType: query.componentType,
      category: query.category,
      materialFamily: query.materialFamily,
    };
  }

  private getCategoryFallback(tokens: string[]): string | undefined {
    return CATEGORY_FALLBACKS.find(fallback => fallback.terms.some(term => tokens.includes(term)))?.category;
  }

  private getMaterialFallback(material: string): string | undefined {
    if (material.includes('stainless')) return 'stainless';
    if (material.includes('aluminium') || material.includes('aluminum')) return 'aluminum';
    if (material.includes('carbon')) return 'carbon';
    if (material.includes('steel')) return 'steel';
    return undefined;
  }

  private readProviders(providers: readonly string[]): ExternalCatalogProvider[] {
    return providers.filter((provider): provider is ExternalCatalogProvider =>
      provider === 'exa' || provider === 'firecrawl'
    );
  }

  private firstText(text: unknown, highlights: unknown): string {
    if (typeof text === 'string') return text;
    if (Array.isArray(highlights)) {
      return highlights.filter((item): item is string => typeof item === 'string').join(' ');
    }
    return '';
  }

  private async fetchWithTimeout(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      return await this.fetcher(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  private isPublicHttpUrl(value: string): boolean {
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();
      return (url.protocol === 'https:' || url.protocol === 'http:') &&
        host !== 'localhost' &&
        host !== '::1' &&
        !host.startsWith('127.') &&
        !host.startsWith('10.') &&
        !host.startsWith('192.168.') &&
        !/^172\.(1[6-9]|2\d|3[01])\./.test(host);
    } catch {
      return false;
    }
  }

  private hostFromUrl(value: string): string {
    try {
      return new URL(value).hostname.replace(/^www\./, '');
    } catch {
      return 'supplier catalogue';
    }
  }

  private clean(value: string | undefined): string {
    return (value || '').replace(/\s+/g, ' ').trim().slice(0, 500);
  }

  private tokens(value: string): string[] {
    return value.toLowerCase().split(/[^a-z0-9]+/).filter(token => token.length > 1);
  }
}

export const externalCatalogService = new ExternalCatalogService();
