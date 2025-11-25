// Product matching and recommendation logic backed by Supabase data
import { RecommendationScore, DrawingAnalysis } from '@/types';
import { alternativeSuggester, type AlternativeSuggestionResponse } from './alternative-product-suggester';
import { getSupabaseServer } from './supabase-server';
import type { Tables } from './database.types';

type SupabaseClient = Awaited<ReturnType<typeof getSupabaseServer>>;
type ProductRow = Tables<'products'>;
type ProductSpecsRow = Tables<'product_specs'>;
type ComponentTaxonomyRow = Tables<'component_taxonomy'>;
type MaterialSynonymRow = Tables<'material_synonyms'>;

interface ProductWithStructuredSpecs extends ProductRow {
  structuredSpecs?: ProductSpecsRow;
}

interface NormalizedSpecs {
  raw: DrawingAnalysis['extractedSpecs'];
  componentTokens: string[];
  componentTypeId?: string;
  categoryHint?: string;
  materialFamily?: string;
  materialToken?: string;
  dimensionValues: number[];
  loadValues: number[];
}

export class ProductMatcher {
  private taxonomyCache: { data: ComponentTaxonomyRow[]; expires: number } | null = null;
  private materialCache: { data: MaterialSynonymRow[]; expires: number } | null = null;

  /**
   * Find products that match extracted specifications from CAD analysis
   */
  async findMatchingProducts(
    analysis: DrawingAnalysis,
    client?: SupabaseClient
  ): Promise<RecommendationScore[]> {
    return this.findMatchesFromSpecs(analysis.extractedSpecs, client);
  }

  /**
   * Find matches directly from normalized spec inputs (used by Product Recommender page)
   */
  async matchFromSpecs(
    specs: Partial<{
      material: string;
      dimensions: string;
      loadCapacity: string;
      category: string;
      componentType: string;
    }>,
    client?: SupabaseClient
  ): Promise<RecommendationScore[]> {
    const componentType =
      specs.componentType ||
      (specs.category && specs.category !== 'all' ? specs.category : undefined);

    const extractedSpecs: DrawingAnalysis['extractedSpecs'] = {
      material: specs.material,
      dimensions: specs.dimensions,
      loadRequirements: specs.loadCapacity,
      componentType,
    };
    return this.findMatchesFromSpecs(extractedSpecs, client);
  }

  /**
   * Get alternative suggestions when no catalog products match
   * This uses AI and external sources to suggest alternatives
   */
  async getAlternativeSuggestions(
    analysis: DrawingAnalysis
  ): Promise<AlternativeSuggestionResponse | null> {
    const { extractedSpecs } = analysis;

    if (!extractedSpecs.componentType && !extractedSpecs.dimensions && !extractedSpecs.material) {
      return null;
    }

    try {
      return await alternativeSuggester.suggestAlternatives(
        extractedSpecs,
        analysis.reasoning || 'No matching products found in catalog'
      );
    } catch (error) {
      console.error('Error getting alternative suggestions:', error);
      return null;
    }
  }

  /**
   * Get compatible products for a given product
   */
  async getCompatibleProducts(
    productId: string,
    client?: SupabaseClient
  ): Promise<RecommendationScore[]> {
    const supabase = client ?? await getSupabaseServer();
    const { data: product, error } = await supabase
      .from('products')
      .select('id, category, compatible_with')
      .eq('id', productId)
      .maybeSingle();

    if (error) {
      console.error('Failed to load product for compatibility lookup', error);
      return [];
    }

    if (!product) {
      return [];
    }

    const compatibleProducts: RecommendationScore[] = [];

    if (product.compatible_with?.length) {
      const { data: matches } = await supabase
        .from('products')
        .select('id')
        .in('id', product.compatible_with);

      matches?.forEach(match => {
        compatibleProducts.push({
          productId: match.id,
          score: 0.95,
          reasoning: 'Direct compatibility specified by manufacturer',
          matchedSpecs: ['compatibility']
        });
      });
    }

    if (compatibleProducts.length < 4) {
      const { data: categoryMatches } = await supabase
        .from('products')
        .select('id')
        .eq('category', product.category)
        .neq('id', productId)
        .limit(5);

      categoryMatches?.forEach(match => {
        if (!compatibleProducts.some(c => c.productId === match.id)) {
          compatibleProducts.push({
            productId: match.id,
            score: 0.7,
            reasoning: `Similar ${product.category} component`,
            matchedSpecs: ['category']
          });
        }
      });
    }

    return compatibleProducts.slice(0, 4);
  }

  private async findMatchesFromSpecs(
    extractedSpecs: DrawingAnalysis['extractedSpecs'],
    client?: SupabaseClient
  ): Promise<RecommendationScore[]> {
    const supabase = client ?? await getSupabaseServer();
    const normalized = await this.normalizeSpecs(extractedSpecs, supabase);
    const candidates = await this.fetchCandidateProducts(normalized, supabase);
    const scored = candidates
      .map(product => this.scoreProduct(product, normalized))
      .filter((score): score is RecommendationScore => Boolean(score))
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      return this.getFallbackProducts(normalized, supabase);
    }

    return scored;
  }

  private async normalizeSpecs(
    specs: DrawingAnalysis['extractedSpecs'],
    client: SupabaseClient
  ): Promise<NormalizedSpecs> {
    const componentTokens = this.tokenize(specs.componentType);
    const taxonomy = await this.getComponentTaxonomy(client);
    const materialSynonyms = await this.getMaterialSynonyms(client);

    let componentTypeId: string | undefined;
    let categoryHint = this.getCategoryFromComponentTokens(componentTokens);

    for (const component of taxonomy) {
      const keywords = [
        component.canonical_name,
        ...(component.keywords ?? [])
      ].map(token => token.toLowerCase());

      if (componentTokens.some(token => keywords.includes(token))) {
        componentTypeId = component.id;
        categoryHint = component.category ?? categoryHint;
        break;
      }
    }

    const materialToken = specs.material?.toLowerCase().split(/[\s,/]+/).filter(Boolean)[0];
    const normalizedMaterial = specs.material?.toLowerCase();
    let materialFamily = undefined as string | undefined;

    if (normalizedMaterial) {
      materialFamily = this.resolveMaterialFamily(normalizedMaterial, materialSynonyms);
    }

    return {
      raw: specs,
      componentTokens,
      componentTypeId,
      categoryHint,
      materialFamily,
      materialToken,
      dimensionValues: this.extractNumbers(specs.dimensions ?? ''),
      loadValues: this.extractNumbers(specs.loadRequirements ?? ''),
    };
  }

  private resolveMaterialFamily(
    normalizedMaterial: string,
    materials: MaterialSynonymRow[]
  ): string | undefined {
    for (const family of materials) {
      const synonyms = family.synonyms?.map(s => s.toLowerCase()) ?? [];
      if (synonyms.some(keyword => normalizedMaterial.includes(keyword))) {
        return family.family;
      }
    }

    if (normalizedMaterial.includes('steel')) return 'steel';
    if (normalizedMaterial.includes('aluminum') || normalizedMaterial.includes('aluminium')) return 'aluminum';
    if (normalizedMaterial.includes('stainless')) return 'stainless';
    if (normalizedMaterial.includes('carbon')) return 'carbon';

    return undefined;
  }

  private async fetchCandidateProducts(
    specs: NormalizedSpecs,
    client: SupabaseClient
  ): Promise<ProductWithStructuredSpecs[]> {
    let query = client
      .from('products')
      .select('*')
      .limit(100);

    if (specs.componentTypeId) {
      query = query.eq('component_type_id', specs.componentTypeId);
    } else if (specs.categoryHint) {
      query = query.eq('category', specs.categoryHint);
    }

    if (specs.materialFamily) {
      query = query.eq('material_family', specs.materialFamily);
    } else if (specs.materialToken) {
      query = query.ilike('material', `%${specs.materialToken}%`);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Failed to query products', error);
      return [];
    }

    if (!products || products.length === 0) {
      return [];
    }

    const specsMap = await this.getStructuredSpecsMap(products.map(p => p.id), client);

    return products.map(product => ({
      ...product,
      structuredSpecs: specsMap.get(product.id),
    }));
  }

  private async getStructuredSpecsMap(
    productIds: string[],
    client: SupabaseClient
  ): Promise<Map<string, ProductSpecsRow>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const { data, error } = await client
      .from('product_specs')
      .select('*')
      .in('product_id', productIds);

    if (error || !data) {
      return new Map();
    }

    return new Map(data.map(row => [row.product_id, row]));
  }

  private scoreProduct(
    product: ProductWithStructuredSpecs,
    specs: NormalizedSpecs
  ): RecommendationScore | null {
    let score = 0;
    const matchedSpecs: string[] = [];

    if (specs.componentTypeId && product.component_type_id === specs.componentTypeId) {
      score += 0.45;
      matchedSpecs.push('componentType');
    } else if (this.keywordMatch(product, specs.componentTokens)) {
      score += 0.35;
      matchedSpecs.push('componentType');
    }

    if (specs.materialFamily && product.material_family === specs.materialFamily) {
      score += 0.2;
      matchedSpecs.push('material');
    } else if (specs.materialToken && (product.material ?? '').toLowerCase().includes(specs.materialToken)) {
      score += 0.15;
      matchedSpecs.push('material');
    }

    const dimensionScore = this.calculateDimensionContribution(product, specs);
    if (dimensionScore > 0) {
      score += dimensionScore * 0.2;
      matchedSpecs.push('dimensions');
    }

    const loadScore = this.calculateLoadContribution(product, specs);
    if (loadScore > 0) {
      score += loadScore * 0.15;
      matchedSpecs.push('loadRequirements');
    }

    if (product.in_stock) {
      score += 0.05;
      matchedSpecs.push('availability');
    }

    if (score <= 0.05) {
      return null;
    }

    return {
      productId: product.id,
      score: Math.min(score, 0.99),
      reasoning: this.buildReasoning(product, specs, matchedSpecs),
      matchedSpecs: Array.from(new Set(matchedSpecs)),
    };
  }

  private buildReasoning(
    product: ProductRow,
    specs: NormalizedSpecs,
    matchedSpecs: string[]
  ): string {
    const reasons: string[] = [];

    if (matchedSpecs.includes('componentType') && specs.raw.componentType) {
      reasons.push(`Matches component type (${specs.raw.componentType})`);
    }

    if (matchedSpecs.includes('material') && specs.raw.material) {
      reasons.push(`Compatible material (${product.material})`);
    }

    if (matchedSpecs.includes('dimensions')) {
      reasons.push('Dimensions align within tolerance');
    }

    if (matchedSpecs.includes('loadRequirements')) {
      reasons.push('Meets load requirements');
    }

    if (matchedSpecs.includes('availability') && product.in_stock) {
      reasons.push('In stock');
    }

    if (reasons.length === 0) {
      return 'General compatibility based on catalog metadata';
    }

    return reasons.join(', ');
  }

  private keywordMatch(product: ProductRow, tokens: string[]): boolean {
    if (!tokens.length) return false;
    const haystack = `${product.name} ${product.description ?? ''}`.toLowerCase();
    return tokens.some(token => haystack.includes(token));
  }

  private calculateDimensionContribution(
    product: ProductWithStructuredSpecs,
    specs: NormalizedSpecs
  ): number {
    if (!specs.dimensionValues.length) {
      return 0;
    }

    const productValues = this.getProductDimensionValues(product);
    if (!productValues.length) {
      return 0;
    }

    const overlap = specs.dimensionValues.filter(dim =>
      productValues.some(value => this.withinTolerance(dim, value, 0.2))
    );

    if (!overlap.length) {
      return 0;
    }

    return overlap.length / Math.max(specs.dimensionValues.length, productValues.length);
  }

  private getProductDimensionValues(product: ProductWithStructuredSpecs): number[] {
    const structured = product.structuredSpecs;
    const values: number[] = [];

    if (structured) {
      const { width_mm, height_mm, depth_mm, diameter_mm, length_mm, thickness_mm } = structured;
      [width_mm, height_mm, depth_mm, diameter_mm, length_mm, thickness_mm]
        .filter((value): value is number => typeof value === 'number')
        .forEach(value => values.push(Number(value)));
    }

    if (!values.length && product.specifications) {
      const specsJson = product.specifications as Record<string, any>;
      if (typeof specsJson?.dimensions === 'string') {
        values.push(...this.extractNumbers(specsJson.dimensions));
      }
    }

    return values;
  }

  private calculateLoadContribution(
    product: ProductWithStructuredSpecs,
    specs: NormalizedSpecs
  ): number {
    if (!specs.loadValues.length) {
      return 0;
    }

    const productLoads = this.getProductLoadValues(product);

    if (!productLoads.length) {
      return 0;
    }

    const meetsRequirement = specs.loadValues.some(required =>
      productLoads.some(capacity => capacity >= required * 0.9)
    );

    return meetsRequirement ? 1 : 0;
  }

  private getProductLoadValues(product: ProductWithStructuredSpecs): number[] {
    const structured = product.structuredSpecs;
    const loads: number[] = [];

    if (structured) {
      const { load_max_kn, load_min_kn } = structured;
      [load_max_kn, load_min_kn]
        .filter((value): value is number => typeof value === 'number')
        .forEach(value => loads.push(Number(value)));
    }

    if (!loads.length && product.specifications) {
      const specsJson = product.specifications as Record<string, any>;
      if (typeof specsJson?.loadCapacity === 'string') {
        loads.push(...this.extractNumbers(specsJson.loadCapacity));
      }
    }

    return loads;
  }

  private withinTolerance(value: number, baseline: number, tolerance: number) {
    const delta = Math.abs(value - baseline);
    return delta / Math.max(value, baseline) <= tolerance;
  }

  private tokenize(input?: string): string[] {
    if (!input) return [];
    return input
      .toLowerCase()
      .split(/[\s,;/\-]+/)
      .map(token => token.trim())
      .filter(Boolean);
  }

  private getCategoryFromComponentTokens(tokens: string[]): string | undefined {
    if (tokens.some(token => ['servo', 'motor', 'actuator', 'sensor'].includes(token))) {
      return 'robotic';
    }
    if (tokens.some(token => ['beam', 'plate', 'frame', 'steel'].includes(token))) {
      return 'structural';
    }
    if (tokens.some(token => ['bolt', 'nut', 'screw', 'washer'].includes(token))) {
      return 'fasteners';
    }
    if (tokens.some(token => ['bracket', 'mount', 'adapter'].includes(token))) {
      return 'custom';
    }
    return undefined;
  }

  private extractNumbers(text: string): number[] {
    const matches = text.match(/\d+\.?\d*/g);
    return matches ? matches.map(Number) : [];
  }

  private async getFallbackProducts(
    specs: NormalizedSpecs,
    client: SupabaseClient
  ): Promise<RecommendationScore[]> {
    let query = client.from('products').select('id').limit(4);

    if (specs.categoryHint) {
      query = query.eq('category', specs.categoryHint);
    }

    let { data: fallbacks } = await query;

    if (!fallbacks?.length) {
      const fallbackResult = await client.from('products').select('id').limit(4);
      fallbacks = fallbackResult.data ?? [];
    }

    return (fallbacks ?? []).map((product, index) => ({
      productId: product.id,
      score: 0.35 - index * 0.05,
      reasoning: specs.categoryHint
        ? `Related ${specs.categoryHint} component`
        : 'Popular product in our catalog',
      matchedSpecs: specs.categoryHint ? ['category'] : [],
    }));
  }

  private async getComponentTaxonomy(client: SupabaseClient): Promise<ComponentTaxonomyRow[]> {
    if (this.taxonomyCache && this.taxonomyCache.expires > Date.now()) {
      return this.taxonomyCache.data;
    }

    const { data, error } = await client.from('component_taxonomy').select('*');

    if (error) {
      console.error('Failed to fetch component taxonomy', error);
      this.taxonomyCache = { data: [], expires: Date.now() + 60_000 };
      return [];
    }

    this.taxonomyCache = {
      data: data ?? [],
      expires: Date.now() + 5 * 60 * 1000,
    };

    return this.taxonomyCache.data;
  }

  private async getMaterialSynonyms(client: SupabaseClient): Promise<MaterialSynonymRow[]> {
    if (this.materialCache && this.materialCache.expires > Date.now()) {
      return this.materialCache.data;
    }

    const { data, error } = await client.from('material_synonyms').select('*');

    if (error) {
      console.error('Failed to fetch material synonyms', error);
      this.materialCache = { data: [], expires: Date.now() + 60_000 };
      return [];
    }

    this.materialCache = {
      data: data ?? [],
      expires: Date.now() + 5 * 60 * 1000,
    };

    return this.materialCache.data;
  }
}

export const productMatcher = new ProductMatcher();