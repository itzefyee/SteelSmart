import { NextRequest, NextResponse } from 'next/server';
import { alternativeSuggester } from '@/lib/alternative-product-suggester';

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

    // Create a mock analysis object for the alternative suggester
    const mockAnalysis = {
      extractedSpecs: {
        dimensions: specifications.dimensions || '',
        material: specifications.material || '',
        loadRequirements: specifications.loadCapacity || '',
        componentType: specifications.category || 'custom',
        tolerance: specifications.tolerance || ''
      },
      recommendedProducts: [],
      totalRecommendations: 0,
      confidence: 0.8,
      reasoning: 'User-provided specifications',
      analysisId: `manual-${Date.now()}`
    };

    // Get alternative suggestions from AI
    const suggestions = await alternativeSuggester.suggestAlternatives(
      mockAnalysis.extractedSpecs,
      mockAnalysis.reasoning
    );

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
