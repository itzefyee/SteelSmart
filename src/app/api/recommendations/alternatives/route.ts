import { NextRequest, NextResponse } from 'next/server';
import { RecommendationService } from '@/services/recommendation.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { specifications } = body;

    if (!specifications) {
      return NextResponse.json(
        { success: false, error: 'Specifications are required' },
        { status: 400 }
      );
    }

    // Clean up material field - remove "(from CAD data)" and similar annotations
    const cleanMaterial = (material: string | undefined): string => {
      if (!material) return '';
      return material
        .replace(/\s*\(from CAD [Dd]ata\)/gi, '')
        .replace(/\s*\(from CAD\)/gi, '')
        .trim();
    };

    // Clean up dimensions - handle [object Object] and other invalid formats
    const cleanDimensions = (dimensions: any): string => {
      if (!dimensions) return '';
      if (typeof dimensions === 'string') {
        // Remove [object Object] and similar
        if (dimensions.includes('[object') || dimensions === '[object Object]') {
          return '';
        }
        return dimensions.trim();
      }
      // If it's an object, try to extract meaningful data
      if (typeof dimensions === 'object') {
        return ''; // Can't use object dimensions
      }
      return String(dimensions);
    };

    const suggestions = await RecommendationService.getAlternativeSuggestionResponse({
      productName: specifications.productName || specifications.name || '',
      dimensions: cleanDimensions(specifications.dimensions),
      material: cleanMaterial(specifications.material),
      loadCapacity: specifications.loadCapacity || '',
      category: specifications.category || 'custom',
      componentType: specifications.componentType,
    });

    if (!suggestions || !suggestions.alternatives) {
      return NextResponse.json({
        success: true,
        alternatives: [],
        message: 'No alternative suggestions found'
      });
    }

    return NextResponse.json({
      success: true,
      alternatives: suggestions.alternatives,
      reasoning: suggestions.reasoning,
      suggestedAction: suggestions.suggestedAction,
      estimatedCost: suggestions.estimatedCost,
      leadTime: suggestions.leadTime
    });

  } catch (error: any) {
    console.error('Alternative suggestions API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get alternative suggestions',
        alternatives: []
      },
      { status: 500 }
    );
  }
}
