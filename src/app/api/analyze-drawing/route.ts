import { NextRequest, NextResponse } from 'next/server';
import { APIResponse, DrawingAnalysis } from '@/types';
import { CADAnalysisService } from '@/services/cad-analysis.service';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('========================================');
  console.log('📥 API Route: /api/analyze-drawing called');
  console.log('========================================');
  
  try {
    // Controller responsibility: Parse request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const cadDataJson = formData.get('cadModelData') as string;
    
    console.log(`File received: ${file?.name || 'NO FILE'}`);
    console.log(`File size: ${file?.size || 0} bytes`);
    console.log(`CAD data provided: ${!!cadDataJson}`);

    if (!file) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      );
    }

    // Parse CAD model data if provided
    let cadModelData = null;
    if (cadDataJson) {
      try {
        cadModelData = JSON.parse(cadDataJson);
      } catch (e) {
        console.warn('Failed to parse CAD model data:', e);
      }
    }

    // Get user ID if authenticated
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Service layer handles validation, analysis, caching, and storage
    const analysis = await CADAnalysisService.analyzeDrawing(file, cadModelData, user?.id);

    // Controller responsibility: Return response
    return NextResponse.json<APIResponse<DrawingAnalysis>>({
      success: true,
      data: analysis,
      message: 'Drawing analysis completed successfully',
    });
  } catch (error) {
    console.error('CAD analysis API error:', error);
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error during analysis',
      },
      { status: 500 }
    );
  }
}