import { getSupabaseAdmin } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

type ProductRow = Tables<'products'>;

/**
 * Creates the 768-dimension vectors expected by product_embeddings.
 * Missing credentials or an embedding failure deliberately leave matching on
 * the full-text/rule path; catalog writes and recommendations still succeed.
 */
export class ProductEmbeddingService {
  private static readonly model = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
  private static readonly dimensions = 768;
  private static readonly cache = new Map<string, { value: number[]; expires: number }>();

  static get source(): string {
    return `gemini:${this.model}`;
  }

  static async createQueryEmbedding(text: string): Promise<number[] | null> {
    const normalized = text.trim();
    if (!normalized || !process.env.GEMINI_API_KEY) {
      return null;
    }

    const cached = this.cache.get(normalized);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:embedContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY,
          },
          cache: 'no-store',
          body: JSON.stringify({
            model: `models/${this.model}`,
            content: { parts: [{ text: normalized }] },
            output_dimensionality: this.dimensions,
          }),
        }
      );
      const payload = await response.json().catch(() => null) as { embedding?: { values?: unknown }; error?: { message?: unknown } } | null;

      if (!response.ok) {
        const providerMessage = typeof payload?.error?.message === 'string' ? payload.error.message : response.statusText;
        throw new Error(`Gemini embedding request failed (${response.status}): ${providerMessage}`);
      }

      const values = payload?.embedding?.values;

      if (!Array.isArray(values) || values.length !== this.dimensions || values.some(value => typeof value !== 'number' || !Number.isFinite(value))) {
        console.warn('Ignoring embedding with an unexpected dimension or value');
        return null;
      }

      this.cache.set(normalized, { value: values, expires: Date.now() + 10 * 60 * 1000 });
      return values;
    } catch (error) {
      console.warn('Unable to generate product embedding; using non-vector matching:', error);
      return null;
    }
  }

  static async upsertProductEmbedding(product: ProductRow): Promise<void> {
    const text = [
      product.name,
      product.description,
      product.material,
      product.category,
      product.technical_details,
    ].filter((value): value is string => Boolean(value?.trim())).join('\n');
    const embedding = await this.createQueryEmbedding(text);

    if (!embedding) {
      return;
    }

    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase
        .from('product_embeddings')
        .upsert({
          product_id: product.id,
          embedding,
          source: this.source,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.warn(`Unable to store embedding for product ${product.id}:`, error.message);
      }
    } catch (error) {
      console.warn(`Unable to store embedding for product ${product.id}:`, error);
    }
  }
}
