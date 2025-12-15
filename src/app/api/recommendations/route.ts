import { NextRequest, NextResponse } from 'next/server';
import { APIResponse, RecommendationScore } from '@/types';
import { RecommendationService } from '@/services/recommendation.service';

export async function POST(request: NextRequest) {
  try {
    // Controller responsibility: Parse request
    const { productId } = await request.json();

    // Service layer handles validation, caching, and business logic
    const recommendations = await RecommendationService.getRecommendations(productId);

    // Controller responsibility: Return response
    return NextResponse.json<APIResponse<RecommendationScore[]>>({
      success: true,
      data: recommendations,
      message: 'Recommendations generated successfully',
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'Internal server error during recommendation generation',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Controller responsibility: Parse request
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '4');

    if (!productId) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'Product ID is required',
        },
        { status: 400 }
      );
    }

    // Service layer handles validation, caching, and business logic
    const products = await RecommendationService.getRecommendationsWithProducts(productId, limit);

    // Controller responsibility: Return response
    return NextResponse.json<APIResponse<any>>({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}