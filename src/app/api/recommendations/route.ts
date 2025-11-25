import { NextRequest, NextResponse } from 'next/server';
import { APIResponse, RecommendationScore } from '@/types';
import { productMatcher } from '@/lib/product-matcher';
import { getCached } from '@/lib/cache/redis-cache';

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();
    
    if (!productId) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Product ID is required'
      }, { status: 400 });
    }

    // Use the product matcher for intelligent recommendations
    const recommendations = await productMatcher.getCompatibleProducts(productId);

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

    // Generate cache key from product ID and any additional filters
    const cacheKey = `recommendations:${productId}`;
    
    // Check Redis cache before computing recommendations
    // TTL: 3600 seconds (1 hour) as per requirement 12.4
    const recommendations = await getCached<RecommendationScore[]>(
      cacheKey,
      async () => {
        console.log(`Computing recommendations for product: ${productId}`);
        // Use the product matcher to get compatible products
        return productMatcher.getCompatibleProducts(productId);
      },
      3600 // 1 hour TTL
    );

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