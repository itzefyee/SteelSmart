import { NextRequest, NextResponse } from 'next/server';
import { RecommendationService } from '@/services/recommendation.service';
import type { APIResponse } from '@/types';

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

    const matches = await RecommendationService.getCatalogMatches(specs);
    if (!matches.length) {
      return NextResponse.json({
        success: true,
        matches: [],
        message: 'No direct catalog matches found'
      });
    }

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
