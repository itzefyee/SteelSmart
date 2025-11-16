// Product matching and recommendation logic
import { LegacyProduct, RecommendationScore, DrawingAnalysis } from '@/types';
import productsData from '@/data/products.json';
import { alternativeSuggester, type AlternativeSuggestionResponse } from './alternative-product-suggester';

export class ProductMatcher {
  private products: LegacyProduct[];

  constructor() {
    this.products = productsData.products as LegacyProduct[];
  }

  /**
   * Find products that match extracted specifications from CAD analysis
   */
  findMatchingProducts(analysis: DrawingAnalysis): RecommendationScore[] {
    const { extractedSpecs } = analysis;
    const recommendations: RecommendationScore[] = [];

    for (const product of this.products) {
      const score = this.calculateMatchScore(product, extractedSpecs);
      if (score > 0.1) { // Lowered threshold to include more products
        recommendations.push({
          productId: product.id,
          score,
          reasoning: this.generateReasoning(product, extractedSpecs, score),
          matchedSpecs: this.getMatchedSpecs(product, extractedSpecs)
        });
      }
    }

    // If no recommendations found, try to get alternative suggestions
    if (recommendations.length === 0) {
      // First try fallback products from catalog
      const fallbackProducts = this.getFallbackProducts(extractedSpecs);
      if (fallbackProducts.length > 0) {
        recommendations.push(...fallbackProducts);
      }
    }

    // Sort by score (highest first) and return all recommendations
    return recommendations
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get alternative suggestions when no catalog products match
   * This uses AI and external sources to suggest alternatives
   */
  async getAlternativeSuggestions(
    analysis: DrawingAnalysis
  ): Promise<AlternativeSuggestionResponse | null> {
    const { extractedSpecs } = analysis;
    
    // Only suggest alternatives if we have meaningful specifications
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
  getCompatibleProducts(productId: string): RecommendationScore[] {
    const product = this.products.find(p => p.id === productId);
    if (!product) return [];

    const compatibleProducts: RecommendationScore[] = [];

    // Direct compatibility
    for (const compatibleId of product.compatibleWith) {
      const compatibleProduct = this.products.find(p => p.id === compatibleId);
      if (compatibleProduct) {
        compatibleProducts.push({
          productId: compatibleId,
          score: 0.95,
          reasoning: 'Direct compatibility specified by manufacturer',
          matchedSpecs: ['compatibility']
        });
      }
    }

    // Category-based recommendations
    const categoryMatches = this.products.filter(p => 
      p.id !== productId && 
      p.category === product.category &&
      !product.compatibleWith.includes(p.id)
    );

    for (const match of categoryMatches.slice(0, 3)) {
      compatibleProducts.push({
        productId: match.id,
        score: 0.7,
        reasoning: `Similar ${product.category} component`,
        matchedSpecs: ['category']
      });
    }

    return compatibleProducts.slice(0, 4);
  }

  private calculateMatchScore(product: LegacyProduct, specs: DrawingAnalysis['extractedSpecs']): number {
    let score = 0;

    // Component type matching (highest weight)
    if (specs.componentType) {
      if (this.matchesComponentType(product, specs.componentType)) {
        score += 0.4;
      }
    }

    // Material matching  
    if (specs.material) {
      if (this.matchesMaterial(product, specs.material)) {
        score += 0.2;
      }
    }

    // Dimension compatibility
    if (specs.dimensions) {
      const dimScore = this.calculateDimensionScore(product, specs.dimensions);
      score += dimScore * 0.25;
    }

    // Load requirements
    if (specs.loadRequirements) {
      if (this.matchesLoadRequirements(product, specs.loadRequirements)) {
        score += 0.15;
      }
    }

    // Category bonus - if no specific component type match, give category bonus
    if (!specs.componentType || !this.matchesComponentType(product, specs.componentType)) {
      const categoryBonus = this.getCategoryBonus(product, specs);
      score += categoryBonus;
    }

    return score;
  }

  private matchesComponentType(product: LegacyProduct, componentType: string): boolean {
    const type = componentType.toLowerCase();
    const productName = product.name.toLowerCase();
    const productDescription = product.description.toLowerCase();

    // Direct matches
    if (type.includes('servo') && (productName.includes('servo') || productDescription.includes('servo'))) {
      return true;
    }
    if (type.includes('actuator') && (productName.includes('actuator') || productDescription.includes('actuator'))) {
      return true;
    }
    if (type.includes('motor') && (productName.includes('motor') || productDescription.includes('motor'))) {
      return true;
    }
    if (type.includes('beam') && (productName.includes('beam') || productDescription.includes('beam'))) {
      return true;
    }
    if (type.includes('bolt') && (productName.includes('bolt') || productDescription.includes('bolt'))) {
      return true;
    }

    // Category matching
    const categoryMatches: { [key: string]: string[] } = {
      'robotic': ['servo', 'motor', 'actuator', 'sensor', 'encoder'],
      'structural': ['beam', 'plate', 'angle', 'channel'],
      'fasteners': ['bolt', 'nut', 'screw', 'washer'],
      'custom': ['bracket', 'mount', 'adapter', 'custom']
    };

    const categoryKeywords = categoryMatches[product.category] || [];
    return categoryKeywords.some(keyword => type.includes(keyword));
  }

  private matchesMaterial(product: LegacyProduct, material: string): boolean {
    const specMaterial = material.toLowerCase();
    const productMaterial = product.material.toLowerCase();

    // Direct matches
    if (productMaterial.includes(specMaterial) || specMaterial.includes(productMaterial)) {
      return true;
    }

    // Material family matching
    const materialFamilies: { [key: string]: string[] } = {
      'steel': ['steel', 'carbon', 'alloy'],
      'aluminum': ['aluminum', 'aluminium', 'al'],
      'stainless': ['stainless', 'corrosion', 'resistant']
    };

    for (const [, keywords] of Object.entries(materialFamilies)) {
      const specInFamily = keywords.some(k => specMaterial.includes(k));
      const productInFamily = keywords.some(k => productMaterial.includes(k));
      if (specInFamily && productInFamily) {
        return true;
      }
    }

    return false;
  }

  private calculateDimensionScore(product: LegacyProduct, dimensions: string): number {
    // This is a simplified dimension matching
    // In a real implementation, you'd parse dimensions and compare them properly
    const specDims = this.extractNumbers(dimensions);
    const productDims = this.extractNumbers(product.specifications.dimensions);

    if (specDims.length === 0 || productDims.length === 0) {
      return 0.5; // neutral score if we can't parse dimensions
    }

    // Simple overlap check
    const overlap = specDims.filter(dim => 
      productDims.some(pDim => Math.abs(dim - pDim) / Math.max(dim, pDim) < 0.2)
    );

    return overlap.length / Math.max(specDims.length, productDims.length);
  }

  private matchesLoadRequirements(product: LegacyProduct, loadReqs: string): boolean {
    const specLoad = this.extractNumbers(loadReqs);
    const productLoad = this.extractNumbers(product.specifications.loadCapacity || '');

    if (specLoad.length === 0 || productLoad.length === 0) {
      return false;
    }

    // Check if product can handle the required load (with some margin)
    return productLoad.some(pLoad => 
      specLoad.some(sLoad => pLoad >= sLoad * 0.8)
    );
  }

  private extractNumbers(text: string): number[] {
    const matches = text.match(/\d+\.?\d*/g);
    return matches ? matches.map(Number) : [];
  }

  private generateReasoning(product: LegacyProduct, specs: DrawingAnalysis['extractedSpecs'], score: number): string {
    const reasons: string[] = [];

    if (specs.componentType && this.matchesComponentType(product, specs.componentType)) {
      reasons.push(`matches component type (${specs.componentType})`);
    }

    if (specs.material && this.matchesMaterial(product, specs.material)) {
      reasons.push(`compatible material (${specs.material})`);
    }

    if (specs.loadRequirements && this.matchesLoadRequirements(product, specs.loadRequirements)) {
      reasons.push('meets load requirements');
    }

    if (reasons.length === 0) {
      return `General compatibility based on specifications (${Math.round(score * 100)}% match)`;
    }

    return `High compatibility: ${reasons.join(', ')}`;
  }

  private getMatchedSpecs(product: LegacyProduct, specs: DrawingAnalysis['extractedSpecs']): string[] {
    const matched: string[] = [];

    if (specs.componentType && this.matchesComponentType(product, specs.componentType)) {
      matched.push('componentType');
    }
    if (specs.material && this.matchesMaterial(product, specs.material)) {
      matched.push('material');
    }
    if (specs.dimensions) {
      matched.push('dimensions');
    }
    if (specs.loadRequirements && this.matchesLoadRequirements(product, specs.loadRequirements)) {
      matched.push('loadRequirements');
    }

    return matched;
  }

  private getCategoryBonus(product: LegacyProduct, specs: DrawingAnalysis['extractedSpecs']): number {
    // Give a small bonus for products in relevant categories
    if (specs.componentType) {
      const type = specs.componentType.toLowerCase();
      
      if ((type.includes('servo') || type.includes('motor')) && product.category === 'robotic') {
        return 0.3;
      }
      if (type.includes('bracket') && product.category === 'custom') {
        return 0.3;
      }
      if ((type.includes('beam') || type.includes('structural')) && product.category === 'structural') {
        return 0.3;
      }
      if ((type.includes('bolt') || type.includes('fastener')) && product.category === 'fasteners') {
        return 0.3;
      }
    }
    
    return 0.1; // Small bonus for any product
  }

  private getFallbackProducts(specs: DrawingAnalysis['extractedSpecs']): RecommendationScore[] {
    const fallbacks: RecommendationScore[] = [];
    
    // Get some products from relevant categories
    if (specs.componentType) {
      const type = specs.componentType.toLowerCase();
      let targetCategory = '';
      
      if (type.includes('servo') || type.includes('motor')) {
        targetCategory = 'robotic';
      } else if (type.includes('bracket')) {
        targetCategory = 'custom';
      } else if (type.includes('beam') || type.includes('structural')) {
        targetCategory = 'structural';
      } else if (type.includes('bolt') || type.includes('fastener')) {
        targetCategory = 'fasteners';
      }
      
      if (targetCategory) {
        const categoryProducts = this.products.filter(p => p.category === targetCategory).slice(0, 3);
        categoryProducts.forEach(product => {
          fallbacks.push({
            productId: product.id,
            score: 0.5,
            reasoning: `Related ${targetCategory} component`,
            matchedSpecs: ['category']
          });
        });
      }
    }
    
    // If still no fallbacks, add some popular products
    if (fallbacks.length === 0) {
      const popularProducts = this.products.slice(0, 3);
      popularProducts.forEach(product => {
        fallbacks.push({
          productId: product.id,
          score: 0.3,
          reasoning: 'Popular product in our catalog',
          matchedSpecs: []
        });
      });
    }
    
    return fallbacks;
  }
}

export const productMatcher = new ProductMatcher();