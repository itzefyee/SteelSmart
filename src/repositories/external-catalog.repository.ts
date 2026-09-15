import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json, Tables } from '@/lib/database.types';

type CacheRow = Tables<'external_catalog_cache'>;
type ComponentTaxonomyRow = Tables<'component_taxonomy'>;
type MaterialSynonymRow = Tables<'material_synonyms'>;

export interface ExternalCatalogCacheWrite {
  cacheKey: string;
  query: Json;
  items: Json;
  providers: string[];
  fetchedAt: string;
  expiresAt: string;
}

export interface ExternalCatalogNormalizationData {
  componentTaxonomy: ComponentTaxonomyRow[];
  materialSynonyms: MaterialSynonymRow[];
}

/**
 * Owns durable external-catalog reads and writes. It intentionally has no
 * provider knowledge so supplier APIs cannot leak into routes or repositories.
 */
export class ExternalCatalogRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findFresh(cacheKey: string, now: string): Promise<CacheRow | null> {
    const { data, error } = await this.supabase
      .from('external_catalog_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', now)
      .maybeSingle();

    if (error) {
      throw new Error(`External catalog cache read failed: ${error.message}`);
    }

    return data;
  }

  async save(entry: ExternalCatalogCacheWrite): Promise<void> {
    const { error } = await this.supabase
      .from('external_catalog_cache')
      .upsert({
        cache_key: entry.cacheKey,
        query: entry.query,
        items: entry.items,
        providers: entry.providers,
        fetched_at: entry.fetchedAt,
        expires_at: entry.expiresAt,
        updated_at: entry.fetchedAt,
      }, { onConflict: 'cache_key' });

    if (error) {
      throw new Error(`External catalog cache write failed: ${error.message}`);
    }
  }

  async getNormalizationData(): Promise<ExternalCatalogNormalizationData> {
    const [taxonomyResult, materialResult] = await Promise.all([
      this.supabase
        .from('component_taxonomy')
        .select('canonical_name, category, keywords'),
      this.supabase
        .from('material_synonyms')
        .select('family, synonyms'),
    ]);

    if (taxonomyResult.error) {
      throw new Error(`Component taxonomy lookup failed: ${taxonomyResult.error.message}`);
    }
    if (materialResult.error) {
      throw new Error(`Material synonym lookup failed: ${materialResult.error.message}`);
    }

    return {
      componentTaxonomy: taxonomyResult.data as ComponentTaxonomyRow[],
      materialSynonyms: materialResult.data as MaterialSynonymRow[],
    };
  }
}
