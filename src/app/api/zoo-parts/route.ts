import { NextRequest, NextResponse } from 'next/server';

// Types based on Zoo Dev API documentation
interface ZooTextToCadPart {
  id: string;
  conversation_id: string;
  created_at: string;
  prompt: string;
  status: string;
  model_data?: string;
  error?: string;
}

interface ZooPartsResponse {
  success: boolean;
  data?: {
    items: ZooTextToCadPart[];
    next_page?: string;
  };
  error?: string;
}

// GET - Fetch text-to-CAD parts from Zoo Dev API
export async function GET(request: NextRequest): Promise<NextResponse<ZooPartsResponse>> {
  try {
    // Check if API token is configured
    if (!process.env.ZOO_API_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Zoo Dev API token not configured. Please set ZOO_API_TOKEN in your environment variables.'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';
    const pageToken = searchParams.get('page_token') || '';
    const conversationId = searchParams.get('conversation_id') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at_descending';
    // Set to 'false' to include model data for viewing drawings
    const noModels = searchParams.get('no_models') || 'false';
    const noParts = searchParams.get('no_parts') || 'false';


    // Build query parameters
    const queryParams = new URLSearchParams({
      limit,
      sort_by: sortBy,
      no_models: noModels,
      no_parts: noParts
    });

    if (pageToken) queryParams.set('page_token', pageToken);
    if (conversationId) queryParams.set('conversation_id', conversationId);

    // Call Zoo Dev API to list text-to-CAD parts
    const response = await fetch(`https://api.zoo.dev/user/text-to-cad?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.ZOO_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zoo Dev API error:', response.status, errorText);
      
      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'Authentication failed. Please check your Zoo Dev API token.'
        }, { status: 401 });
      }
      
      if (response.status === 429) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        }, { status: 429 });
      }

      return NextResponse.json({
        success: false,
        error: `Zoo Dev API error: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        items: data.items || [],
        next_page: data.next_page
      }
    });

  } catch (error: any) {
    console.error('Error fetching Zoo Dev parts:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to fetch Zoo Dev parts: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

// Health check endpoint
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    service: 'Zoo Dev Parts API',
    timestamp: new Date().toISOString(),
    zoo_api_configured: !!process.env.ZOO_API_TOKEN,
    endpoint: 'https://api.zoo.dev/user/text-to-cad'
  });
}
