import { NextRequest, NextResponse } from 'next/server';
import { APIResponse, RecommendationScore } from '@/types';
import { productMatcher } from '@/lib/product-matcher';

export async function POST(request: NextRequest) {
  try {
    const { productId, specifications } = await request.json();
    
    if (!productId) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Product ID is required'
      }, { status: 400 });
    }

    // Use the product matcher for intelligent recommendations
    const recommendations = productMatcher.getCompatibleProducts(productId);

    return NextResponse.json<APIResponse<RecommendationScore[]>>({
      success: true,
      data: recommendations,
      message: 'Recommendations generated successfully'
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error during recommendation generation'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Product ID is required'
      }, { status: 400 });
    }

    // Use the product matcher to get compatible products
    const recommendations = productMatcher.getCompatibleProducts(productId);

    return NextResponse.json<APIResponse<RecommendationScore[]>>({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}