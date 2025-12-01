import { NextRequest, NextResponse } from 'next/server';
import { CADGenerationService, type CADGenerationRequest } from '@/services/cad-generation.service';
import { getSupabaseServer } from '@/lib/supabase-server';

/**
 * CAD Generation API Route
 * 
 * This endpoint handles text-to-CAD generation using the Zoo Dev API.
 * 
 * ASYNC OPERATION HANDLING:
 * The Zoo Dev text-to-CAD API returns operations that may not complete immediately.
 * This implementation uses server-side polling to wait for completion.
 * 
 * ALTERNATIVE: WEBHOOKS
 * For production environments, consider using webhooks instead of polling:
 * 1. Register a webhook endpoint with Zoo Dev API
 * 2. Zoo Dev will POST to your webhook when the operation completes
 * 3. Store operation status in database
 * 4. Client can query your database for status updates
 * 
 * Benefits of webhooks:
 * - No server resources wasted on polling
 * - Faster response to completion
 * - Better scalability
 * - Reduced API call count
 * 
 * To implement webhooks:
 * 1. Create /api/webhooks/zoo-dev/route.ts endpoint
 * 2. Register webhook URL with Zoo Dev: ml.create_webhook({ url: 'https://yourdomain.com/api/webhooks/zoo-dev' })
 * 3. Store operation_id -> user mapping in database when creating operations
 * 4. Update operation status when webhook is called
 * 5. Notify client via WebSocket or SSE
 */

interface CADGenerationResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    model_data?: string;
    preview_image?: string;
    parameters?: Record<string, any>;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CADGenerationResponse>> {
  try {
    // Controller responsibility: Parse request
    const body: CADGenerationRequest = await request.json();

    // Get user ID if authenticated
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Service layer handles validation, API calls, polling, and storage
    const result = await CADGenerationService.generateCAD(body, user?.id);

    // Controller responsibility: Return response
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('CAD generation API error:', error);

    // Handle specific error types
    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 429 }
      );
    }

    if (error.message?.includes('authentication')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 401 }
      );
    }

    if (error.message?.includes('required') || error.message?.includes('too long')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Server error during CAD generation',
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    service: 'CAD Generation API',
    timestamp: new Date().toISOString(),
    zoo_api_configured: !!process.env.ZOO_API_TOKEN,
  });
}
