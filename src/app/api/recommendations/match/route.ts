import { NextRequest, NextResponse } from 'next/server';
import { productMatcher } from '@/lib/product-matcher';
import { getSupabaseServer } from '@/lib/supabase-server';
import type { APIResponse, RecommendationScore, Product } from '@/types';

type MatchItem = RecommendationScore & {
  product: Product;
  matchScore: number;
  rawScore: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { specs } = body;

    if (!specs) {
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Specifications are required'
      }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const scores = await productMatcher.matchFromSpecs(specs, supabase);

    if (!scores.length) {
      return NextResponse.json({
        success: true,
        matches: [],
        message: 'No direct catalog matches found'
      });
    }

    const productIds = scores.map(score => score.productId);
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (error) {
      console.error('Failed to fetch products for match results', error);
      return NextResponse.json<APIResponse<null>>({
        success: false,
        error: 'Unable to load catalog products'
      }, { status: 500 });
    }

    const productMap = new Map(products?.map(product => [product.id, product]));
    const matches: MatchItem[] = scores
      .map(score => {
        const product = productMap.get(score.productId);
        if (!product) return null;
        return {
          product: product as Product,
          productId: score.productId,
          matchedSpecs: score.matchedSpecs,
          reasoning: score.reasoning,
          rawScore: score.score,
          matchScore: Math.round(score.score * 100),
          score: score.score,
        };
      })
      .filter((match): match is MatchItem => Boolean(match));

    return NextResponse.json({
      success: true,
      matches
    });

  } catch (error) {
    console.error('Match recommendations error:', error);
    return NextResponse.json<APIResponse<null>>({
      success: false,
      error: 'Failed to compute direct matches'
    }, { status: 500 });
  }
}

