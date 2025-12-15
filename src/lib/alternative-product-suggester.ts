// Alternative Product Suggestion Service
// Suggests alternatives when no viable products are found in catalog
// Uses AI, industry standards, and external references

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DrawingAnalysis, RecommendationScore } from '@/types';

export interface AlternativeProduct {
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
  source: 'industry_standard' | 'ai_generated' | 'external_catalog' | 'custom_suggestion';
  confidence: number;
  reasoning: string;
  supplierInfo?: {
    suggestedSuppliers: string[];
    estimatedPrice?: string;
    leadTime?: string;
  };
  standards?: {
    code: string;
    name: string;
    section?: string;
  }[];
}

export interface AlternativeSuggestionResponse {
  alternatives: AlternativeProduct[];
  reasoning: string;
  suggestedAction: 'custom_fabrication' | 'standard_part' | 'modified_existing' | 'external_supplier';
  estimatedCost?: string;
  leadTime?: string;
}

/**
 * Alternative Product Suggester
 * 
 * When no products match in the catalog, this service:
 * 1. Uses AI (Gemini) to generate intelligent alternatives
 * 2. References industry standards (AISC, ASTM, ISO, etc.)
 * 3. Suggests standard part numbers from common catalogs
 * 4. Provides custom fabrication recommendations
 * 5. Suggests external suppliers and marketplaces
 */
export class AlternativeProductSuggester {
  private geminiClient: GoogleGenerativeAI | null = null;
  private geminiModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_BACKUP_API_KEY;
    if (apiKey) {
      this.geminiClient = new GoogleGenerativeAI(apiKey);
      this.geminiModel = this.geminiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }
  }

  /**
   * Generate alternative product suggestions when no catalog matches found
   */
  async suggestAlternatives(
    extractedSpecs: DrawingAnalysis['extractedSpecs'],
    analysisReasoning: string
  ): Promise<AlternativeSuggestionResponse> {
    // Strategy 1: Use AI to generate intelligent alternatives
    const aiAlternatives = await this.generateAIAlternatives(extractedSpecs, analysisReasoning);

    // Strategy 2: Reference industry standards
    const standardAlternatives = this.getStandardPartSuggestions(extractedSpecs);

    // Strategy 3: Suggest custom fabrication options
    const fabricationAlternatives = this.getFabricationSuggestions(extractedSpecs);

    // Strategy 4: External supplier suggestions
    const supplierAlternatives = this.getExternalSupplierSuggestions(extractedSpecs);

    // Combine and rank all alternatives
    const allAlternatives = [
      ...aiAlternatives,
      ...standardAlternatives,
      ...fabricationAlternatives,
      ...supplierAlternatives
    ];

    // Determine best action
    const suggestedAction = this.determineBestAction(extractedSpecs, allAlternatives);

    return {
      alternatives: allAlternatives.slice(0, 5), // Top 5 alternatives
      reasoning: this.generateOverallReasoning(extractedSpecs, allAlternatives, suggestedAction),
      suggestedAction,
      estimatedCost: this.estimateCost(extractedSpecs, suggestedAction),
      leadTime: this.estimateLeadTime(extractedSpecs, suggestedAction)
    };
  }

  /**
   * Use Gemini AI to generate intelligent alternative suggestions
   */
  private async generateAIAlternatives(
    specs: DrawingAnalysis['extractedSpecs'],
    context: string
  ): Promise<AlternativeProduct[]> {
    if (!this.geminiModel) {
      // Fallback if AI not available
      return this.getFallbackAIAlternatives(specs);
    }

    const prompt = this.buildAIPrompt(specs, context);

    try {
      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedText);

      return parsed.alternatives || [];
    } catch (error) {
      console.error('Error generating AI alternatives:', error);
      return this.getFallbackAIAlternatives(specs);
    }
  }

  /**
   * Build AI prompt for alternative generation
   */
  private buildAIPrompt(
    specs: DrawingAnalysis['extractedSpecs'],
    context: string
  ): string {
    return `You are an expert mechanical engineer and procurement specialist for metal and steel components.

A user has uploaded a technical drawing with these extracted specifications:
${JSON.stringify(specs, null, 2)}

Context: ${context}

No matching products were found in our catalog. Generate intelligent alternative product suggestions.

Consider:
1. **Standard Part Equivalents**: Suggest standard part numbers from common catalogs (McMaster-Carr, Grainger, Misumi, etc.)
2. **Material Alternatives**: Suggest equivalent materials that meet the same requirements
3. **Modified Standard Parts**: Suggest standard parts that could be modified to fit
4. **Custom Fabrication**: When appropriate, suggest custom fabrication with specifications
5. **Industry Standards**: Reference relevant standards (AISC, ASTM, ISO, DIN, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "alternatives": [
    {
      "name": "Product name",
      "description": "Detailed description",
      "category": "robotic|structural|fasteners|custom",
      "material": "Material specification",
      "specifications": {
        "dimensions": "Dimension string",
        "loadCapacity": "Load capacity if applicable",
        "standards": ["Standard codes"],
        "partNumber": "Standard part number if available"
      },
      "source": "ai_generated",
      "confidence": 0.85,
      "reasoning": "Why this is a good alternative",
      "supplierInfo": {
        "suggestedSuppliers": ["Supplier names"],
        "estimatedPrice": "Price range",
        "leadTime": "Estimated lead time"
      },
      "standards": [
        {
          "code": "AISC 360",
          "name": "Specification for Structural Steel Buildings",
          "section": "Section J3.3"
        }
      ]
    }
  ]
}

Generate 3-5 high-quality alternatives with specific part numbers, standards, and supplier suggestions when possible.`;
  }

  /**
   * Get standard part suggestions based on industry standards
   */
  private getStandardPartSuggestions(
    specs: DrawingAnalysis['extractedSpecs']
  ): AlternativeProduct[] {
    const alternatives: AlternativeProduct[] = [];

    // Structural steel standards (AISC)
    if (specs.componentType?.toLowerCase().includes('beam') || 
        specs.componentType?.toLowerCase().includes('structural')) {
      alternatives.push({
        name: 'Standard I-Beam (AISC)',
        description: 'Check AISC Steel Construction Manual for standard I-beam sizes matching your dimensions',
        category: 'structural',
        material: specs.material || 'A36 Steel',
        specifications: {
          dimensions: specs.dimensions || 'Standard sizes available',
          standards: ['AISC 360', 'ASTM A36']
        },
        source: 'industry_standard',
        confidence: 0.8,
        reasoning: 'AISC provides standard I-beam sizes that may match your requirements',
        standards: [
          { code: 'AISC 360', name: 'Specification for Structural Steel Buildings' },
          { code: 'ASTM A36', name: 'Standard Specification for Carbon Structural Steel' }
        ],
        supplierInfo: {
          suggestedSuppliers: ['Steel Service Centers', 'Metal Supermarkets', 'Ryerson'],
          estimatedPrice: 'Contact for quote',
          leadTime: '2-4 weeks'
        }
      });
    }

    // Fastener standards (ASME/ISO)
    if (specs.componentType?.toLowerCase().includes('bolt') ||
        specs.componentType?.toLowerCase().includes('fastener')) {
      alternatives.push({
        name: 'Standard Fastener (ASME/ISO)',
        description: 'Standard bolt/nut/washer combinations per ASME B18.2.1 or ISO 4014',
        category: 'fasteners',
        material: specs.material || 'Grade 8.8 Steel',
        specifications: {
          standards: ['ASME B18.2.1', 'ISO 4014', 'ISO 4032']
        },
        source: 'industry_standard',
        confidence: 0.85,
        reasoning: 'Standard fasteners are widely available and cost-effective',
        standards: [
          { code: 'ASME B18.2.1', name: 'Square and Hex Bolts and Screws' },
          { code: 'ISO 4014', name: 'Hexagon head bolts' }
        ],
        supplierInfo: {
          suggestedSuppliers: ['McMaster-Carr', 'Fastenal', 'Grainger'],
          estimatedPrice: '$0.50 - $5.00 per unit',
          leadTime: '1-3 days'
        }
      });
    }

    // Robotic components (ISO standards)
    if (specs.componentType?.toLowerCase().includes('servo') ||
        specs.componentType?.toLowerCase().includes('motor')) {
      alternatives.push({
        name: 'Standard Servo Mounting Hardware',
        description: 'ISO-compliant servo motor mounting brackets and adapters',
        category: 'robotic',
        material: specs.material || 'Aluminum 6061',
        specifications: {
          standards: ['ISO 9409-1', 'ISO 9409-2']
        },
        source: 'industry_standard',
        confidence: 0.75,
        reasoning: 'ISO 9409 defines standard mounting interfaces for industrial robots',
        standards: [
          { code: 'ISO 9409-1', name: 'Manipulating industrial robots - Mechanical interfaces' }
        ],
        supplierInfo: {
          suggestedSuppliers: ['Misumi', 'McMaster-Carr', 'RobotShop'],
          estimatedPrice: '$50 - $200',
          leadTime: '1-2 weeks'
        }
      });
    }

    return alternatives;
  }

  /**
   * Get custom fabrication suggestions
   */
  private getFabricationSuggestions(
    specs: DrawingAnalysis['extractedSpecs']
  ): AlternativeProduct[] {
    const alternatives: AlternativeProduct[] = [];

    // If dimensions are specific and no standard part matches, suggest custom fabrication
    if (specs.dimensions && specs.material) {
      alternatives.push({
        name: 'Custom Fabricated Component',
        description: `Custom fabrication based on your exact specifications: ${specs.dimensions}`,
        category: 'custom',
        material: specs.material,
        specifications: {
          dimensions: specs.dimensions,
          loadCapacity: specs.loadRequirements,
          standards: ['Custom to specification']
        },
        source: 'custom_suggestion',
        confidence: 0.9,
        reasoning: 'Your specifications require custom fabrication. This ensures exact fit and performance.',
        supplierInfo: {
          suggestedSuppliers: ['Local Machine Shops', 'Protolabs', 'Xometry', 'SendCutSend'],
          estimatedPrice: 'Quote required (typically $100 - $1000+)',
          leadTime: '2-6 weeks'
        }
      });
    }

    return alternatives;
  }

  /**
   * Get external supplier suggestions
   */
  private getExternalSupplierSuggestions(
    specs: DrawingAnalysis['extractedSpecs']
  ): AlternativeProduct[] {
    const alternatives: AlternativeProduct[] = [];

    const componentType = specs.componentType?.toLowerCase() || '';

    // Suggest relevant marketplaces and suppliers
    if (componentType.includes('bracket') || componentType.includes('mount')) {
      alternatives.push({
        name: 'Search External Marketplaces',
        description: 'Check online marketplaces for similar components',
        category: 'custom',
        specifications: {
          dimensions: specs.dimensions,
          loadCapacity: specs.loadRequirements
        },
        source: 'external_catalog',
        confidence: 0.7,
        reasoning: 'Online marketplaces often have a wider selection than individual catalogs',
        supplierInfo: {
          suggestedSuppliers: [
            'McMaster-Carr (mcmaster.com)',
            'Misumi (misumi-ec.com)',
            'Grainger (grainger.com)',
            'Amazon Industrial',
            'Alibaba Industrial'
          ],
          estimatedPrice: 'Varies by supplier',
          leadTime: '1-4 weeks'
        }
      });
    }

    return alternatives;
  }

  /**
   * Determine best action based on specifications and alternatives
   */
  private determineBestAction(
    specs: DrawingAnalysis['extractedSpecs'],
    alternatives: AlternativeProduct[]
  ): 'custom_fabrication' | 'standard_part' | 'modified_existing' | 'external_supplier' {
    // If standard part alternatives exist with high confidence
    const standardParts = alternatives.filter(a => 
      a.source === 'industry_standard' && a.confidence > 0.75
    );
    if (standardParts.length > 0) {
      return 'standard_part';
    }

    // If dimensions are very specific, custom fabrication is likely needed
    if (specs.dimensions && specs.tolerance) {
      return 'custom_fabrication';
    }

    // If external suppliers have good matches
    const externalMatches = alternatives.filter(a => 
      a.source === 'external_catalog' && a.confidence > 0.7
    );
    if (externalMatches.length > 0) {
      return 'external_supplier';
    }

    // Default to custom fabrication
    return 'custom_fabrication';
  }

  /**
   * Generate overall reasoning for the suggestions
   */
  private generateOverallReasoning(
    specs: DrawingAnalysis['extractedSpecs'],
    alternatives: AlternativeProduct[],
    action: string
  ): string {
    let reasoning = `Based on your specifications (${specs.componentType || 'component'}`;
    if (specs.dimensions) reasoning += `, ${specs.dimensions}`;
    if (specs.material) reasoning += `, ${specs.material}`;
    reasoning += `), we found ${alternatives.length} alternative options. `;

    switch (action) {
      case 'standard_part':
        reasoning += 'Standard parts are available that may meet your requirements. Check the suggested part numbers and standards.';
        break;
      case 'custom_fabrication':
        reasoning += 'Your specifications require custom fabrication. We recommend working with a qualified machine shop or fabrication service.';
        break;
      case 'external_supplier':
        reasoning += 'Similar components may be available from external suppliers. Check the suggested marketplaces and suppliers.';
        break;
      default:
        reasoning += 'Consider the alternatives below or contact us for custom solutions.';
    }

    return reasoning;
  }

  /**
   * Estimate cost based on specifications and action
   */
  private estimateCost(
    specs: DrawingAnalysis['extractedSpecs'],
    action: string
  ): string {
    switch (action) {
      case 'standard_part':
        return '$10 - $500 (depending on part)';
      case 'custom_fabrication':
        return '$100 - $5,000+ (quote required)';
      case 'external_supplier':
        return 'Varies by supplier';
      default:
        return 'Contact for quote';
    }
  }

  /**
   * Estimate lead time
   */
  private estimateLeadTime(
    specs: DrawingAnalysis['extractedSpecs'],
    action: string
  ): string {
    switch (action) {
      case 'standard_part':
        return '1-2 weeks';
      case 'custom_fabrication':
        return '2-8 weeks';
      case 'external_supplier':
        return '1-4 weeks';
      default:
        return '2-4 weeks';
    }
  }

  /**
   * Fallback AI alternatives when Gemini is not available
   */
  private getFallbackAIAlternatives(
    specs: DrawingAnalysis['extractedSpecs']
  ): AlternativeProduct[] {
    return [
      {
        name: 'Custom Component Required',
        description: `Based on your specifications (${specs.componentType || 'component'}), a custom component may be required.`,
        category: 'custom',
        material: specs.material,
        specifications: {
          dimensions: specs.dimensions,
          loadCapacity: specs.loadRequirements
        },
        source: 'ai_generated',
        confidence: 0.7,
        reasoning: 'No standard parts match your exact specifications. Consider custom fabrication.',
        supplierInfo: {
          suggestedSuppliers: ['Local Machine Shops', 'Protolabs', 'Xometry'],
          estimatedPrice: 'Quote required',
          leadTime: '2-6 weeks'
        }
      }
    ];
  }
}

export const alternativeSuggester = new AlternativeProductSuggester();

