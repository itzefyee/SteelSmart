// Product matching and recommendation logic backed by Supabase data
import { RecommendationScore, DrawingAnalysis } from '@/types';
import { alternativeSuggester, type AlternativeSuggestionResponse } from './alternative-product-suggester';
import { getSupabaseServer } from './supabase-server';
import type { Tables } from './database.types';
import { ProductEmbeddingService } from '@/services/product-embedding.service';

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
  componentTypeId?: string; // Specific component taxonomy ID (e.g., "servo-motor-high-torque")
  categoryHint?: string; // Inferred broad category (structural, robotic, fasteners, custom)
  explicitCategory?: string; // User-selected category from dropdown (not inferred)
  materialFamily?: string;
  materialToken?: string;
  dimensionValues: number[];
  loadValues: number[];
  isSampleDrawing?: boolean; // Flag to identify if from sample drawing (for scoring bonus)
}

/**
 * IMPORTANT: Component Type vs Category
 * 
 * - Component Type: Specific product type from taxonomy (e.g., "High-Torque Servo Motor", "I-Beam", "Hex Bolt M8")
 *   - Stored in: component_type_id (references component_taxonomy table)
 *   - Used for: Precise matching within a category
 *   - Example: "servo-motor-high-torque" is a component type within "robotic" category
 * 
 * - Category: Broad product classification (structural, robotic, fasteners, custom)
 *   - Stored in: category (enum field on products table)
 *   - Used for: High-level filtering and user navigation
 *   - Example: All servo motors, actuators, sensors belong to "robotic" category
 * 
 * Hierarchy: Category > Component Type > Individual Product
 * Example: Robotic > Servo Motor > "Dynamixel AX-12A Servo Motor"
 */

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
    return this.findMatchesFromSpecs(analysis.extractedSpecs, client, undefined, analysis.isSampleDrawing);
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

    // Check if user explicitly selected a category
    const hasExplicitCategory = specs.category && specs.category !== 'all';
    const hasOtherSpecs = !!(specs.productName || specs.material || specs.dimensions || specs.loadCapacity);

    // If only category is selected (no other specs), do category-only search
    if (hasExplicitCategory && !hasOtherSpecs) {
      return this.searchByCategory(specs.category!, supabase);
    }

    // If product name is provided, do a direct name/keyword search first
    if (specs.productName && specs.productName.trim()) {
      const nameResults = await this.searchByProductName(
        specs.productName, 
        supabase,
        hasExplicitCategory ? specs.category : undefined
      );
      
      // If we have good name matches, return them
      if (nameResults.length > 0) {
        // If other specs are provided, combine name score with spec score
        if (specs.material || specs.dimensions || specs.loadCapacity || hasExplicitCategory) {
          const componentType =
            specs.componentType ||
            (hasExplicitCategory ? specs.category : undefined);

          const extractedSpecs: DrawingAnalysis['extractedSpecs'] = {
            material: specs.material,
            dimensions: specs.dimensions,
            loadRequirements: specs.loadCapacity,
            componentType,
            productName: specs.productName, // Pass product name for scoring bonus
          };
          
          // Re-score name results with additional specs, but preserve name match bonus
          const normalized = await this.normalizeSpecs(extractedSpecs, supabase, hasExplicitCategory ? specs.category : undefined);
          const candidates = await this.fetchProductsByIds(nameResults.map(r => r.productId), supabase);
          
          // Create a map of name scores for combining
          const nameScoreMap = new Map(nameResults.map(r => [r.productId, r.score]));
          
          const rescored = candidates
            .map(product => {
              const specScore = this.scoreProduct(product, normalized);
              if (!specScore) return null;
              
              // Get the original name match score
              const nameScore = nameScoreMap.get(product.id) || 0;
              
              // Combine scores: 60% name match + 40% spec match (name match is more important)
              const combinedScore = (nameScore * 0.6) + (specScore.score * 0.4);
              
              return {
                ...specScore,
                score: Math.min(combinedScore, 0.99),
                reasoning: nameScore > 0.7 
                  ? `Strong name match + ${specScore.reasoning}`
                  : specScore.reasoning,
                matchedSpecs: [...new Set([...specScore.matchedSpecs, 'productName'])],
              };
            })
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
      (hasExplicitCategory ? specs.category : undefined);

    const extractedSpecs: DrawingAnalysis['extractedSpecs'] = {
      material: specs.material,
      dimensions: specs.dimensions,
      loadRequirements: specs.loadCapacity,
      componentType,
    };
    return this.findMatchesFromSpecs(extractedSpecs, client, hasExplicitCategory ? specs.category : undefined);
  }

  /**
   * Search products by category only
   * Used when user selects category without other specs
   */
  private async searchByCategory(
    category: string,
    client: SupabaseClient
  ): Promise<RecommendationScore[]> {
    const { data: products, error } = await client
      .from('products')
      .select('*')
      .eq('category', category)
      .order('in_stock', { ascending: false }) // In-stock first
      .order('name', { ascending: true })
      .limit(50);

    if (error || !products || products.length === 0) {
      return [];
    }

    // Score based on availability and data completeness
    return products.map((product, index) => {
      let score = 0.75; // Base score for category match
      
      // Boost for in-stock
      if (product.in_stock) {
        score += 0.15;
      }
      
      // Small penalty for position (to differentiate)
      score -= index * 0.005;
      
      return {
        productId: product.id,
        score: Math.min(score, 0.95),
        reasoning: `${category.charAt(0).toUpperCase() + category.slice(1)} category product${product.in_stock ? ' (in stock)' : ''}`,
        matchedSpecs: ['category', ...(product.in_stock ? ['availability'] : [])],
      };
    });
  }

  /**
   * Search products by name or keywords
   * Uses full-text search on product name and description
   */
  private async searchByProductName(
    searchTerm: string,
    client: SupabaseClient,
    filterCategory?: string
  ): Promise<RecommendationScore[]> {
    // Split into tokens, separating words from numbers/dimensions
    const allTokens = searchTerm.toLowerCase().trim().split(/[\s,]+/);
    
    // Separate word tokens from numeric/dimension tokens
    const wordTokens = allTokens.filter(t => /^[a-z]+$/i.test(t) && t.length > 1);
    const numericTokens = allTokens.filter(t => /\d/.test(t));
    
    // Query the GIN-backed vector first. The ilike path below is retained only
    // as a mixed-version fallback while the search-vector migration rolls out.
    let query = client
      .from('products')
      .select('*')
      .limit(30);

    // Filter by category if provided
    if (filterCategory && filterCategory !== 'all') {
      query = query.eq('category', filterCategory);
    }

    const fullTextQuery = [...wordTokens, ...numericTokens].join(' ') || searchTerm.trim();
    const { data, error } = await query.textSearch('search_vector', fullTextQuery, {
      config: 'english',
      type: 'websearch',
    });

    let products: ProductRow[] = data || [];

    if (error) {
      console.warn('Full-text product search unavailable; falling back to legacy search:', error.message);
      let fallbackQuery = client
        .from('products')
        .select('*')
        .limit(30);

      if (filterCategory && filterCategory !== 'all') {
        fallbackQuery = fallbackQuery.eq('category', filterCategory);
      }

      const searchPattern = `%${searchTerm.toLowerCase()}%`;
      const fallback = await fallbackQuery.or(
        `name.ilike.${searchPattern},description.ilike.${searchPattern}`
      );
      products = fallback.data || [];
    }

    // Blend semantic neighbors into the full-text candidates. It is optional:
    // missing Gemini credentials, vectors, or RPCs leave lexical matching intact.
    const semanticScores = await this.findEmbeddingMatches(searchTerm, client);
    if (semanticScores.size > 0) {
      const existingIds = new Set(products.map(product => product.id));
      const semanticProducts = await this.fetchProductsByIds([...semanticScores.keys()], client);
      semanticProducts.forEach(product => {
        if (
          !existingIds.has(product.id) &&
          (!filterCategory || filterCategory === 'all' || product.category === filterCategory)
        ) {
          products.push(product);
        }
      });
    }

    if (products.length === 0) return [];

    // Get structured specs for scoring
    const specsMap = await this.getStructuredSpecsMap(products.map(p => p.id), client);

    // Score products based on name relevance
    const scored = products.map(product => {
      const productWithSpecs = {
        ...product,
        structuredSpecs: specsMap.get(product.id),
      };

      const productNameLower = product.name.toLowerCase();
      const productDescLower = (product.description || '').toLowerCase();
      const productNameTokens = productNameLower.split(/[\s\-]+/);
      const productDescTokens = productDescLower.split(/[\s\-]+/);
      
      // Count word matches (more important)
      const wordMatchesInName = wordTokens.filter(token => 
        productNameTokens.some(nameToken => 
          nameToken.includes(token) || token.includes(nameToken)
        )
      ).length;
      
      const wordMatchesInDesc = wordTokens.filter(token =>
        productDescTokens.some(descToken => 
          descToken.includes(token) || token.includes(descToken)
        )
      ).length;

      // Count numeric/dimension matches (secondary importance)
      const numericMatchesInName = numericTokens.filter(token =>
        productNameLower.includes(token)
      ).length;
      
      const numericMatchesInDesc = numericTokens.filter(token =>
        productDescLower.includes(token)
      ).length;

      // Calculate base relevance score
      let relevanceScore = 0;
      const matchedSpecs: string[] = ['productName'];
      
      // Exact name match gets highest score
      if (productNameLower === searchTerm.toLowerCase()) {
        relevanceScore = 0.98;
      }
      // Name contains exact search term
      else if (productNameLower.includes(searchTerm.toLowerCase())) {
        relevanceScore = 0.90;
      }
      // Word-based scoring
      else if (wordTokens.length > 0) {
        // Word matches are weighted heavily (70% of score)
        const wordScore = wordTokens.length > 0 
          ? (wordMatchesInName / wordTokens.length) * 0.8 + (wordMatchesInDesc / wordTokens.length) * 0.2
          : 0;
        
        // Numeric matches add bonus (up to 15%)
        const numericScore = numericTokens.length > 0
          ? ((numericMatchesInName + numericMatchesInDesc) / numericTokens.length) * 0.15
          : 0;
        
        // Base score from word matches
        relevanceScore = wordScore * 0.85 + numericScore;
        
        // Bonus for matching multiple key words
        if (wordMatchesInName >= 2) {
          relevanceScore += 0.10; // Bonus for 2+ word matches in name
        }
        if (wordMatchesInName >= 3) {
          relevanceScore += 0.05; // Additional bonus for 3+ matches
        }
      }
      // Fallback for numeric-only searches
      else if (numericTokens.length > 0) {
        const numericScore = (numericMatchesInName + numericMatchesInDesc) / (numericTokens.length * 2);
        relevanceScore = numericScore * 0.6;
      }

      // Boost for category match (if filtering by category)
      if (filterCategory && filterCategory !== 'all' && product.category === filterCategory) {
        relevanceScore += 0.05;
        matchedSpecs.push('category');
      }

      // Boost for in-stock items
      if (product.in_stock) {
        relevanceScore += 0.03;
        matchedSpecs.push('availability');
      }

      // Calculate data quality for confidence
      const dataQuality = this.calculateDataQuality(productWithSpecs);
      const confidenceMultiplier = 0.90 + (0.10 * dataQuality.completeness); // 90-100%

      // Apply confidence multiplier
      const semanticScore = semanticScores.get(product.id) || 0;
      if (semanticScore > 0) {
        relevanceScore = Math.max(relevanceScore, semanticScore * 0.8);
        matchedSpecs.push('semanticSimilarity');
      }
      const finalScore = relevanceScore * confidenceMultiplier;

      // Build reasoning
      const matchedWords = wordTokens.filter(t => productNameLower.includes(t));
      let reasoning = matchedWords.length > 0 
        ? `Matches: ${matchedWords.join(', ')}`
        : semanticScore > 0
          ? `Semantic match for "${searchTerm}"`
          : `Matches search term "${searchTerm}"`;
      if (filterCategory && filterCategory !== 'all') {
        reasoning += ` in ${filterCategory} category`;
      }
      if (product.in_stock) {
        reasoning += ' (in stock)';
      }

      return {
        productId: product.id,
        score: Math.min(finalScore, 0.99),
        confidence: dataQuality.completeness,
        dataQuality,
        reasoning,
        matchedSpecs,
      };
    })
    .filter(score => score.score > 0.20) // Lower threshold to catch partial matches
    .sort((a, b) => b.score - a.score);

    return scored;
  }

  private async findEmbeddingMatches(
    searchTerm: string,
    client: SupabaseClient
  ): Promise<Map<string, number>> {
    const embedding = await ProductEmbeddingService.createQueryEmbedding(searchTerm);
    if (!embedding) return new Map();

    const { data, error } = await client.rpc('match_product_embeddings', {
      query_embedding: embedding,
      match_count: 8,
      required_source: ProductEmbeddingService.source,
    });

    if (error) {
      console.warn('Semantic product matching unavailable; using full-text results:', error.message);
      return new Map();
    }

    return new Map(
      (data || [])
        .filter(match => Number.isFinite(match.similarity) && match.similarity >= 0.35)
        .map(match => [match.product_id, Math.min(Math.max(match.similarity, 0), 1)])
    );
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
    client?: SupabaseClient,
    explicitCategory?: string,
    isSampleDrawing?: boolean
  ): Promise<RecommendationScore[]> {
    const supabase = client ?? await getSupabaseServer();
    const normalized = await this.normalizeSpecs(extractedSpecs, supabase, explicitCategory, isSampleDrawing);
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
    client: SupabaseClient,
    explicitCategory?: string,
    isSampleDrawing?: boolean
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

    // Ensure material is a string before processing
    const materialString = typeof specs.material === 'string' ? specs.material : String(specs.material || '');
    const materialToken = materialString ? materialString.toLowerCase().split(/[\s,/]+/).filter(Boolean)[0] : undefined;
    const normalizedMaterial = materialString ? materialString.toLowerCase() : undefined;
    let materialFamily = undefined as string | undefined;

    if (normalizedMaterial) {
      materialFamily = this.resolveMaterialFamily(normalizedMaterial, materialSynonyms);
    }

    return {
      raw: specs,
      componentTokens,
      componentTypeId,
      categoryHint,
      explicitCategory,
      materialFamily,
      materialToken,
      // Use extractDimensionsFromText for better parsing of complex dimension strings
      // Falls back to extractNumbers if no structured dimensions found
      dimensionValues: this.extractDimensionsFromText(String(specs.dimensions || '')).length > 0
        ? this.extractDimensionsFromText(String(specs.dimensions || ''))
        : this.extractNumbers(String(specs.dimensions || '')),
      loadValues: this.extractNumbers(String(specs.loadRequirements || '')),
      isSampleDrawing,
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

    // Priority 1: Explicit category (user-selected)
    if (specs.explicitCategory && specs.explicitCategory !== 'all') {
      query = query.eq('category', specs.explicitCategory);
    }
    // Priority 2: Component type ID
    else if (specs.componentTypeId) {
      query = query.eq('component_type_id', specs.componentTypeId);
    }
    // Priority 3: Inferred category hint
    else if (specs.categoryHint) {
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
    const categoryScore = this.calculateCategoryScore(product, specs);
    const materialScore = this.calculateMaterialScore(product, specs);
    const dimensionScore = this.calculateDimensionContribution(product, specs);
    const loadScore = this.calculateLoadContribution(product, specs);

    const matchedSpecs: string[] = [];
    if (componentScore > 0) matchedSpecs.push('componentType');
    if (categoryScore > 0) matchedSpecs.push('category');
    if (materialScore > 0) matchedSpecs.push('material');
    if (dimensionScore > 0) matchedSpecs.push('dimensions');
    if (loadScore > 0) matchedSpecs.push('loadRequirements');

    // Determine which fields have data in the search specs
    const hasComponentData = specs.componentTokens.length > 0 || !!specs.componentTypeId;
    const hasExplicitCategory = !!specs.explicitCategory && specs.explicitCategory !== 'all';
    const hasMaterialData = !!specs.raw.material;
    const hasDimensionData = specs.dimensionValues.length > 0;
    const hasLoadData = specs.loadValues.length > 0;

    // Calculate adaptive weights (redistribute if data missing)
    let weights = {
      component: hasComponentData ? 0.35 : 0,
      category: hasExplicitCategory ? 0.30 : 0, // Significant weight when explicitly selected
      material: hasMaterialData ? 0.15 : 0,
      dimension: hasDimensionData ? 0.15 : 0,
      load: hasLoadData ? 0.05 : 0,
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
      categoryScore * weights.category +
      materialScore * weights.material +
      dimensionScore * weights.dimension +
      loadScore * weights.load;

    // Availability bonus (always applicable)
    if (product.in_stock) {
      finalScore += 0.05;
      matchedSpecs.push('availability');
    }

    // Sample drawing bonus - boost scores to 90% minimum for sample drawings
    if (specs.isSampleDrawing && finalScore > 0.05) {
      // Ensure sample drawing matches get at least 90% score
      finalScore = Math.max(finalScore, 0.90);
      matchedSpecs.push('sample-drawing-match');
    }

    // Exact product name match bonus (non-sample drawings only)
    if (!specs.isSampleDrawing && specs.raw.productName) {
      const productNameLower = product.name.toLowerCase();
      const searchNameLower = specs.raw.productName.toLowerCase();
      
      // Tokenize both names for word-by-word comparison
      const productWords = productNameLower.split(/[\s\-]+/).filter(w => w.length > 1);
      const searchWords = searchNameLower.split(/[\s\-]+/).filter(w => /^[a-z]+$/i.test(w) && w.length > 1);
      
      // Check for exact or very close name match
      if (productNameLower === searchNameLower) {
        // Exact match - massive bonus
        finalScore = Math.max(finalScore, 0.95);
        matchedSpecs.push('exact-name-match');
      } else if (productNameLower.includes(searchNameLower) || searchNameLower.includes(productNameLower)) {
        // One contains the other - large bonus
        finalScore = Math.max(finalScore, 0.85);
        matchedSpecs.push('name-contains-match');
      } else if (searchWords.length > 0) {
        // Word-by-word matching
        const matchedWords = searchWords.filter(word => 
          productWords.some(pw => pw.includes(word) || word.includes(pw))
        );
        const matchRatio = matchedWords.length / searchWords.length;
        
        if (matchRatio >= 0.8) {
          // 80%+ words match - strong bonus
          finalScore = Math.max(finalScore, 0.80);
          matchedSpecs.push('strong-name-match');
        } else if (matchRatio >= 0.5) {
          // 50%+ words match - moderate bonus
          finalScore += 0.25;
          matchedSpecs.push('partial-name-match');
        } else if (matchRatio > 0) {
          // Some words match - small bonus
          finalScore += 0.15;
          matchedSpecs.push('weak-name-match');
        }
      }
    }

    // Calculate data completeness for confidence scoring
    const dataQuality = this.calculateDataQuality(product);
    const confidenceMultiplier = 0.7 + (0.3 * dataQuality.completeness); // 70-100%

    // Apply confidence multiplier (but not to sample drawing bonus)
    if (!specs.isSampleDrawing) {
      finalScore = finalScore * confidenceMultiplier;
    } else {
      // For sample drawings, apply a lighter multiplier to preserve the 90% minimum
      finalScore = Math.max(0.90, finalScore * confidenceMultiplier);
    }

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
      return 1.0; // Perfect match (will be weighted)
    } else if (this.keywordMatch(product, specs.componentTokens)) {
      return 0.8; // Good keyword match (will be weighted)
    }
    return 0;
  }

  /**
   * Calculate category match score (when explicitly selected by user)
   */
  private calculateCategoryScore(product: ProductWithStructuredSpecs, specs: NormalizedSpecs): number {
    // Only score if user explicitly selected a category
    if (!specs.explicitCategory || specs.explicitCategory === 'all') {
      return 0;
    }

    // Exact category match
    if (product.category === specs.explicitCategory) {
      return 1.0; // Perfect match (will be weighted)
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

    if (matchedSpecs.includes('category') && specs.explicitCategory) {
      reasons.push(`${specs.explicitCategory.charAt(0).toUpperCase() + specs.explicitCategory.slice(1)} category match`);
    }

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
    // Ensure text is a string
    if (!text || typeof text !== 'string') {
      return [];
    }
    const matches = text.match(/\d+\.?\d*/g);
    return matches ? matches.map(Number) : [];
  }

  /**
   * Extract dimensions from text with unit awareness
   * Handles patterns like: "200x100x10mm", "diameter: 50mm", "length 300mm", "2.756" thickness", "5x114.3mm PCD"
   */
  private extractDimensionsFromText(text: string): number[] {
    const patterns = [
      // Pattern: 200x100x10mm or 200 x 100 x 10 mm
      /(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*(mm|cm|m|in|ft)?/gi,
      // Pattern: 200x100mm or 200 x 100 mm (also handles PCD like 5x114.3mm)
      /(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*(mm|cm|m|in|ft)?/gi,
      // Pattern: diameter: 50mm or diameter 50 mm or 50mm diameter
      /(?:diameter[:\s]+)?(\d+\.?\d*)\s*(mm|cm|m|in)?\s*diameter/gi,
      /diameter[:\s]+(\d+\.?\d*)\s*(mm|cm|m|in)?/gi,
      // Pattern: length: 300mm or length 300 mm
      /length[:\s]+(\d+\.?\d*)\s*(mm|cm|m|in)?/gi,
      // Pattern: width: 200mm
      /width[:\s]+(\d+\.?\d*)\s*(mm|cm|m|in)?/gi,
      // Pattern: height: 100mm
      /height[:\s]+(\d+\.?\d*)\s*(mm|cm|m|in)?/gi,
      // Pattern: thickness: 10mm or 2.756" thickness (inch notation)
      /thickness[:\s]+(\d+\.?\d*)\s*(mm|cm|m|in|")?/gi,
      /(\d+\.?\d*)\s*["']\s*thickness/gi,
      // Pattern: PCD like 5x114.3mm PCD
      /(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*(mm)?\s*PCD/gi,
    ];

    const values: number[] = [];
    const seenValues = new Set<number>();

    for (const pattern of patterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        // Extract only numeric values from the match
        const nums = match
          .slice(1)
          .filter(v => v && !isNaN(Number(v)) && !['mm', 'cm', 'm', 'in', 'ft', '"', "'"].includes(v.toLowerCase()))
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
