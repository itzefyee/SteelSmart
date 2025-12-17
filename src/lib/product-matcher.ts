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
      productName: string;
      material: string;
      dimensions: string;
      loadCapacity: string;
      category: string;
      componentType: string;
    }>,
    client?: SupabaseClient
  ): Promise<RecommendationScore[]> {
    const supabase = client ?? await getSupabaseServer();

    // If product name is provided, do a direct name/keyword search first
    if (specs.productName && specs.productName.trim()) {
      const nameResults = await this.searchByProductName(specs.productName, supabase);
      
      // If we have good name matches, return them
      if (nameResults.length > 0) {
        // If other specs are provided, filter name results by those specs
        if (specs.material || specs.dimensions || specs.loadCapacity || (specs.category && specs.category !== 'all')) {
          const componentType =
            specs.componentType ||
            (specs.category && specs.category !== 'all' ? specs.category : undefined);

          const extractedSpecs: DrawingAnalysis['extractedSpecs'] = {
            material: specs.material,
            dimensions: specs.dimensions,
            loadRequirements: specs.loadCapacity,
            componentType,
          };
          
          // Re-score name results with additional specs
          const normalized = await this.normalizeSpecs(extractedSpecs, supabase);
          const candidates = await this.fetchProductsByIds(nameResults.map(r => r.productId), supabase);
          
          const rescored = candidates
            .map(product => this.scoreProduct(product, normalized))
            .filter((score): score is RecommendationScore => Boolean(score))
            .sort((a, b) => b.score - a.score);
          
          return rescored.length > 0 ? rescored : nameResults;
        }
        
        return nameResults;
      }
    }

    // Fall back to spec-based matching
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
   * Search products by name or keywords
   * Uses full-text search on product name and description
   */
  private async searchByProductName(
    searchTerm: string,
    client: SupabaseClient
  ): Promise<RecommendationScore[]> {
    const searchTokens = searchTerm.toLowerCase().trim().split(/\s+/);
    
    // Build search query using ilike for fuzzy matching
    let query = client
      .from('products')
      .select('*')
      .limit(20);

    // Search in name and description
    const searchPattern = `%${searchTerm.toLowerCase()}%`;
    query = query.or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`);

    const { data: products, error } = await query;

    if (error || !products || products.length === 0) {
      return [];
    }

    // Get structured specs for scoring
    const specsMap = await this.getStructuredSpecsMap(products.map(p => p.id), client);

    // Score products based on name relevance
    const scored = products.map(product => {
      const productWithSpecs = {
        ...product,
        structuredSpecs: specsMap.get(product.id),
      };

      const nameTokens = product.name.toLowerCase().split(/\s+/);
      const descTokens = (product.description || '').toLowerCase().split(/\s+/);
      
      // Calculate token overlap
      const nameMatches = searchTokens.filter(token => 
        nameTokens.some(nameToken => nameToken.includes(token) || token.includes(nameToken))
      ).length;
      
      const descMatches = searchTokens.filter(token =>
        descTokens.some(descToken => descToken.includes(token) || token.includes(descToken))
      ).length;

      // Calculate relevance score
      let relevanceScore = 0;
      
      // Exact name match gets highest score
      if (product.name.toLowerCase() === searchTerm.toLowerCase()) {
        relevanceScore = 0.95;
      }
      // Name contains exact search term
      else if (product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        relevanceScore = 0.85;
      }
      // Token-based scoring
      else {
        const nameScore = nameMatches / searchTokens.length;
        const descScore = descMatches / searchTokens.length;
        relevanceScore = (nameScore * 0.7) + (descScore * 0.3);
      }

      // Boost for in-stock items
      if (product.in_stock) {
        relevanceScore += 0.05;
      }

      return {
        productId: product.id,
        score: Math.min(relevanceScore, 0.99),
        reasoning: `Matches search term "${searchTerm}"`,
        matchedSpecs: ['productName', product.in_stock ? 'availability' : ''].filter(Boolean),
      };
    })
    .filter(score => score.score > 0.3) // Filter out weak matches
    .sort((a, b) => b.score - a.score);

    return scored;
  }

  /**
   * Fetch products by IDs
   */
  private async fetchProductsByIds(
    productIds: string[],
    client: SupabaseClient
  ): Promise<ProductWithStructuredSpecs[]> {
    if (productIds.length === 0) {
      return [];
    }

    const { data: products, error } = await client
      .from('products')
      .select('*')
      .in('id', productIds);

    if (error || !products) {
      return [];
    }

    const specsMap = await this.getStructuredSpecsMap(productIds, client);

    return products.map(product => ({
      ...product,
      structuredSpecs: specsMap.get(product.id),
    }));
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
    // Calculate individual component scores
    const componentScore = this.calculateComponentScore(product, specs);
    const materialScore = this.calculateMaterialScore(product, specs);
    const dimensionScore = this.calculateDimensionContribution(product, specs);
    const loadScore = this.calculateLoadContribution(product, specs);

    const matchedSpecs: string[] = [];
    if (componentScore > 0) matchedSpecs.push('componentType');
    if (materialScore > 0) matchedSpecs.push('material');
    if (dimensionScore > 0) matchedSpecs.push('dimensions');
    if (loadScore > 0) matchedSpecs.push('loadRequirements');

    // Determine which fields have data in the search specs
    const hasComponentData = specs.componentTokens.length > 0 || !!specs.componentTypeId;
    const hasMaterialData = !!specs.raw.material;
    const hasDimensionData = specs.dimensionValues.length > 0;
    const hasLoadData = specs.loadValues.length > 0;

    // Calculate adaptive weights (redistribute if data missing)
    let weights = {
      component: hasComponentData ? 0.45 : 0,
      material: hasMaterialData ? 0.20 : 0,
      dimension: hasDimensionData ? 0.20 : 0,
      load: hasLoadData ? 0.15 : 0,
    };

    // Redistribute unused weights proportionally
    const totalAvailableWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    if (totalAvailableWeight > 0 && totalAvailableWeight < 1.0) {
      const redistributionFactor = 1.0 / totalAvailableWeight;
      Object.keys(weights).forEach(key => {
        weights[key as keyof typeof weights] *= redistributionFactor;
      });
    }

    // Calculate weighted score
    let finalScore =
      componentScore * weights.component +
      materialScore * weights.material +
      dimensionScore * weights.dimension +
      loadScore * weights.load;

    // Availability bonus (always applicable)
    if (product.in_stock) {
      finalScore += 0.05;
      matchedSpecs.push('availability');
    }

    // Calculate data completeness for confidence scoring
    const dataQuality = this.calculateDataQuality(product);
    const confidenceMultiplier = 0.7 + (0.3 * dataQuality.completeness); // 70-100%

    // Apply confidence multiplier
    finalScore = finalScore * confidenceMultiplier;

    if (finalScore <= 0.05) {
      return null;
    }

    return {
      productId: product.id,
      score: Math.min(finalScore, 0.99),
      confidence: dataQuality.completeness,
      dataQuality,
      reasoning: this.buildReasoning(product, specs, matchedSpecs),
      matchedSpecs: Array.from(new Set(matchedSpecs)),
    };
  }

  /**
   * Calculate component type match score
   */
  private calculateComponentScore(product: ProductWithStructuredSpecs, specs: NormalizedSpecs): number {
    if (specs.componentTypeId && product.component_type_id === specs.componentTypeId) {
      return 0.45;
    } else if (this.keywordMatch(product, specs.componentTokens)) {
      return 0.35;
    }
    return 0;
  }

  /**
   * Calculate material match score with fuzzy matching
   */
  private calculateMaterialScore(product: ProductRow, specs: NormalizedSpecs): number {
    const productMaterial = (product.material || '').toLowerCase();
    const requestedMaterial = (specs.raw.material || '').toLowerCase();

    // Exact family match
    if (specs.materialFamily && product.material_family === specs.materialFamily) {
      return 0.20;
    }

    // Partial family match (e.g., "steel" in "stainless steel")
    if (specs.materialFamily && productMaterial.includes(specs.materialFamily)) {
      return 0.18;
    }

    // Token overlap (e.g., "carbon steel" vs "steel carbon alloy")
    if (requestedMaterial && productMaterial) {
      const requestedTokens = requestedMaterial.split(/[\s,/-]+/).filter(Boolean);
      const productTokens = productMaterial.split(/[\s,/-]+/).filter(Boolean);
      const overlap = requestedTokens.filter(t => productTokens.includes(t)).length;
      
      if (overlap > 0) {
        const overlapRatio = overlap / Math.max(requestedTokens.length, productTokens.length);
        return 0.15 * overlapRatio;
      }
    }

    // Simple token match (legacy behavior)
    if (specs.materialToken && productMaterial.includes(specs.materialToken)) {
      return 0.12;
    }

    // Material category match (both are metals, both are plastics, etc.)
    if (this.sameMaterialCategory(requestedMaterial, productMaterial)) {
      return 0.08;
    }

    return 0;
  }

  /**
   * Check if materials are in the same category
   */
  private sameMaterialCategory(material1: string, material2: string): boolean {
    const metals = ['steel', 'aluminum', 'aluminium', 'iron', 'copper', 'brass', 'bronze', 'titanium', 'stainless'];
    const plastics = ['plastic', 'polymer', 'nylon', 'abs', 'pvc', 'polycarbonate', 'acrylic'];
    
    const isMetal1 = metals.some(m => material1.includes(m));
    const isMetal2 = metals.some(m => material2.includes(m));
    
    const isPlastic1 = plastics.some(p => material1.includes(p));
    const isPlastic2 = plastics.some(p => material2.includes(p));
    
    return (isMetal1 && isMetal2) || (isPlastic1 && isPlastic2);
  }

  /**
   * Calculate data quality metrics for a product
   */
  private calculateDataQuality(product: ProductWithStructuredSpecs): {
    hasDimensions: boolean;
    hasLoadCapacity: boolean;
    hasMaterialFamily: boolean;
    hasComponentType: boolean;
    completeness: number;
  } {
    let completeness = 0;
    let totalFields = 0;

    // Check structured specs
    const hasDimensions = !!(product.structuredSpecs && (
      product.structuredSpecs.width_mm ||
      product.structuredSpecs.height_mm ||
      product.structuredSpecs.depth_mm ||
      product.structuredSpecs.diameter_mm ||
      product.structuredSpecs.length_mm
    ));

    const hasLoadCapacity = !!(product.structuredSpecs && (
      product.structuredSpecs.load_max_kn ||
      product.structuredSpecs.load_min_kn
    ));

    const hasMaterialFamily = !!product.material_family;
    const hasComponentType = !!product.component_type_id;

    // Calculate completeness score
    totalFields = 7; // dimensions, load, material_family, component_type, specifications, material, description

    if (hasDimensions) completeness++;
    if (hasLoadCapacity) completeness++;
    if (hasMaterialFamily) completeness++;
    if (hasComponentType) completeness++;
    if (product.specifications) completeness++;
    if (product.material) completeness++;
    if (product.description) completeness++;

    return {
      hasDimensions,
      hasLoadCapacity,
      hasMaterialFamily,
      hasComponentType,
      completeness: totalFields > 0 ? completeness / totalFields : 0.5,
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
    const values: number[] = [];

    // Priority 1: Structured specs (most reliable)
    const structured = product.structuredSpecs;
    if (structured) {
      const { width_mm, height_mm, depth_mm, diameter_mm, length_mm, thickness_mm } = structured;
      [width_mm, height_mm, depth_mm, diameter_mm, length_mm, thickness_mm]
        .filter((value): value is number => typeof value === 'number')
        .forEach(value => values.push(Number(value)));
    }

    // Priority 2: JSONB specifications field
    if (values.length === 0 && product.specifications) {
      const specsJson = product.specifications as Record<string, any>;
      if (typeof specsJson?.dimensions === 'string') {
        values.push(...this.extractNumbers(specsJson.dimensions));
      }
    }

    // Priority 3: Parse from product name (e.g., "Steel Beam 200x100x10mm")
    if (values.length === 0 && product.name) {
      const nameNumbers = this.extractDimensionsFromText(product.name);
      if (nameNumbers.length > 0) {
        values.push(...nameNumbers);
      }
    }

    // Priority 4: Parse from description
    if (values.length === 0 && product.description) {
      const descNumbers = this.extractDimensionsFromText(product.description);
      if (descNumbers.length > 0) {
        values.push(...descNumbers);
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

  /**
   * Extract dimensions from text with unit awareness
   * Handles patterns like: "200x100x10mm", "diameter: 50mm", "length 300mm"
   */
  private extractDimensionsFromText(text: string): number[] {
    const patterns = [
      // Pattern: 200x100x10mm or 200 x 100 x 10 mm
      /(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*(mm|cm|m|in|ft)?/gi,
      // Pattern: 200x100mm or 200 x 100 mm
      /(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*(mm|cm|m|in|ft)?/gi,
      // Pattern: diameter: 50mm or diameter 50 mm
      /diameter[:\s]+(\d+\.?\d*)\s*(mm|cm|m|in)?/gi,
      // Pattern: length: 300mm or length 300 mm
      /length[:\s]+(\d+\.?\d*)\s*(mm|cm|m|in)?/gi,
      // Pattern: width: 200mm
      /width[:\s]+(\d+\.?\d*)\s*(mm|cm|m|in)?/gi,
      // Pattern: height: 100mm
      /height[:\s]+(\d+\.?\d*)\s*(mm|cm|m|in)?/gi,
      // Pattern: thickness: 10mm
      /thickness[:\s]+(\d+\.?\d*)\s*(mm|cm|m|in)?/gi,
    ];

    const values: number[] = [];
    const seenValues = new Set<number>();

    for (const pattern of patterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        // Extract only numeric values from the match
        const nums = match
          .slice(1)
          .filter(v => v && !isNaN(Number(v)) && !['mm', 'cm', 'm', 'in', 'ft'].includes(v.toLowerCase()))
          .map(Number);
        
        // Add unique values only
        nums.forEach(num => {
          if (!seenValues.has(num)) {
            seenValues.add(num);
            values.push(num);
          }
        });
      }
    }

    return values;
  }

  private async getFallbackProducts(
    specs: NormalizedSpecs,
    client: SupabaseClient
  ): Promise<RecommendationScore[]> {
    const fallbacks: RecommendationScore[] = [];

    // Strategy 1: Try collaborative filtering (similar searches)
    try {
      const { InteractionTrackingService } = await import('@/services/interaction-tracking.service');
      const similarSearchRecs = await InteractionTrackingService.getSimilarSearchRecommendations(
        {
          material: specs.raw.material,
          category: specs.categoryHint,
        },
        4
      );

      similarSearchRecs.forEach((rec, index) => {
        fallbacks.push({
          productId: rec.productId,
          score: 0.65 - index * 0.05, // Higher than generic fallback
          reasoning: 'Popular in similar searches',
          matchedSpecs: ['user_behavior'],
        });
      });

      if (fallbacks.length >= 4) {
        return fallbacks.slice(0, 4);
      }
    } catch (error) {
      console.error('Collaborative filtering fallback failed:', error);
    }

    // Strategy 2: Category-based fallback
    if (specs.categoryHint) {
      let query = client
        .from('products')
        .select('id')
        .eq('category', specs.categoryHint)
        .eq('in_stock', true) // Prioritize in-stock items
        .limit(4 - fallbacks.length);

      const { data: categoryFallbacks } = await query;

      categoryFallbacks?.forEach((product, index) => {
        if (!fallbacks.some(f => f.productId === product.id)) {
          fallbacks.push({
            productId: product.id,
            score: 0.45 - index * 0.05,
            reasoning: `Related ${specs.categoryHint} component (in stock)`,
            matchedSpecs: ['category', 'availability'],
          });
        }
      });

      if (fallbacks.length >= 4) {
        return fallbacks.slice(0, 4);
      }
    }

    // Strategy 3: Material-based fallback
    if (specs.materialFamily) {
      let query = client
        .from('products')
        .select('id')
        .eq('material_family', specs.materialFamily)
        .limit(4 - fallbacks.length);

      const { data: materialFallbacks } = await query;

      materialFallbacks?.forEach((product, index) => {
        if (!fallbacks.some(f => f.productId === product.id)) {
          fallbacks.push({
            productId: product.id,
            score: 0.40 - index * 0.05,
            reasoning: `Similar material (${specs.materialFamily})`,
            matchedSpecs: ['material'],
          });
        }
      });

      if (fallbacks.length >= 4) {
        return fallbacks.slice(0, 4);
      }
    }

    // Strategy 4: Popular products (last resort)
    if (fallbacks.length < 4) {
      const { data: popularProducts } = await client
        .from('products')
        .select('id')
        .eq('in_stock', true)
        .limit(4 - fallbacks.length);

      popularProducts?.forEach((product, index) => {
        if (!fallbacks.some(f => f.productId === product.id)) {
          fallbacks.push({
            productId: product.id,
            score: 0.30 - index * 0.05,
            reasoning: 'Popular product in our catalog',
            matchedSpecs: ['availability'],
          });
        }
      });
    }

    return fallbacks.slice(0, 4);
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