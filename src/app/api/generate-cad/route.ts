import { NextRequest, NextResponse } from 'next/server';
import { ml } from '@kittycad/lib';

// Types for the API
interface CADGenerationRequest {
  description: string;
  category?: 'bracket' | 'plate' | 'beam' | 'fastener' | 'custom';
  format?: 'step' | 'stl' | 'obj';
  units?: 'mm' | 'cm' | 'm' | 'in' | 'ft';
}

interface CADGenerationResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    model_data?: string; // base64 encoded model file
    preview_image?: string;
    parameters?: Record<string, any>;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CADGenerationResponse>> {
  try {
    // Check if API token is configured
    if (!process.env.ZOO_API_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Zoo Dev API token not configured. Please set ZOO_API_TOKEN in your environment variables.'
      }, { status: 500 });
    }

    const body: CADGenerationRequest = await request.json();
    const { description, category = 'custom', format = 'step', units = 'mm' } = body;

    if (!description || description.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Description is required'
      }, { status: 400 });
    }

    // Enhance the prompt with context for steel/metal components
    const enhancedPrompt = `Generate a ${category} component for steel/metal manufacturing: ${description}. 
    Make it suitable for CNC machining or fabrication with proper tolerances and standard dimensions.
    Include mounting holes and standard fastener patterns where appropriate.`;

    console.log('Starting CAD generation with Zoo Dev API...');
    console.log('Enhanced prompt:', enhancedPrompt);

    try {
      // Use Zoo Dev API for text-to-CAD generation
      console.log('Calling Zoo Dev API with prompt:', enhancedPrompt);
      
      const result = await ml.create_text_to_cad({
          body: {
              prompt: enhancedPrompt,
          },
          output_format: format
      });

      // Check for API errors
      if ('error_code' in result) {
        console.error('Zoo Dev API error:', result);
        return NextResponse.json({
          success: false,
          error: `CAD generation failed: ${(result as any).message || 'Unknown error'}`
        }, { status: 500 });
      }

      console.log('CAD generation completed, result:', result);

      // Extract the generated model data
      const modelData = result.outputs ? Object.values(result.outputs)[0] : null;
      
      if (!modelData) {
        return NextResponse.json({
          success: false,
          error: 'No model data received from Zoo Dev API'
        }, { status: 500 });
      }

      console.log('CAD generation completed successfully');

      // For now, we'll return the base64 model data
      // In a production app, you might want to store this in cloud storage
      return NextResponse.json({
        success: true,
        data: {
          id: result.id || `cad_${Date.now()}`,
          status: 'completed',
          model_data: modelData as string,
          parameters: {
            format,
            units,
            category,
            generated_at: new Date().toISOString(),
            prompt: enhancedPrompt
          }
        }
      });

    } catch (apiError: any) {
      console.error('Zoo Dev API call failed:', apiError);
      
      // Handle specific API errors
      if (apiError.message?.includes('rate limit')) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded. Please try again in a few minutes.'
        }, { status: 429 });
      }
      
      if (apiError.message?.includes('authentication')) {
        return NextResponse.json({
          success: false,
          error: 'Authentication failed. Please check your API token.'
        }, { status: 401 });
      }

      return NextResponse.json({
        success: false,
        error: `CAD generation service error: ${apiError.message || 'Unknown error'}`
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('CAD generation error:', error);
    return NextResponse.json({
      success: false,
      error: `Server error: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    service: 'CAD Generation API',
    timestamp: new Date().toISOString(),
    zoo_api_configured: !!process.env.ZOO_API_TOKEN
  });
}
