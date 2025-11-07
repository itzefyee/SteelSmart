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

    // Use the original description without enhancement
    console.log('Starting CAD generation with Zoo Dev API...');
    console.log('Original prompt:', description);

    try {
      // Use Zoo Dev API for text-to-CAD generation
      console.log('Calling Zoo Dev API with prompt:', description);
      
      const result = await ml.create_text_to_cad({
          body: {
              prompt: description,
          },
          output_format: format
      });

      console.log('Zoo Dev API raw response:', {
        type: typeof result,
        keys: result ? Object.keys(result) : null,
        hasError: result && 'error_code' in result,
        hasStatus: result && 'status' in result,
        hasId: result && 'id' in result
      });

      // Check for API errors
      if ('error_code' in result) {
        console.error('Zoo Dev API error:', result);
        return NextResponse.json({
          success: false,
          error: `CAD generation failed: ${(result as any).message || 'Unknown error'}`
        }, { status: 500 });
      }

      // Check if this is an async operation that needs polling
      if (result && 'status' in result && result.status !== 'completed') {
        console.log('CAD generation is async, status:', result.status);
        // For now, return the operation ID and let the client handle polling
        // Or we could implement server-side polling here
        return NextResponse.json({
          success: false,
          error: `CAD generation is in progress (status: ${result.status}). The operation may need to be polled for completion. Operation ID: ${result.id || 'unknown'}`
        }, { status: 202 }); // 202 Accepted for async operations
      }

      console.log('CAD generation completed, result structure:', {
        hasId: !!result.id,
        hasOutputs: !!result.outputs,
        outputsType: typeof result.outputs,
        outputsKeys: result.outputs ? Object.keys(result.outputs) : null,
        resultKeys: Object.keys(result),
        resultString: JSON.stringify(result).substring(0, 500)
      });

      // Extract the generated model data from various possible locations
      // Use type assertion to access properties that may exist but aren't in the type definition
      const resultAny = result as any;
      let modelData = null;
      
      // Try different possible locations for model data
      if (result.outputs && typeof result.outputs === 'object') {
        const outputValues = Object.values(result.outputs);
        if (outputValues.length > 0) {
          modelData = outputValues[0];
          console.log('Found model data in outputs, size:', typeof modelData === 'string' ? modelData.length : 'unknown');
        }
      } else if (resultAny.model_data) {
        modelData = resultAny.model_data;
        console.log('Found model data in model_data field, size:', modelData.length);
      } else if (resultAny.data?.outputs) {
        const outputValues = Object.values(resultAny.data.outputs);
        if (outputValues.length > 0) {
          modelData = outputValues[0];
          console.log('Found model data in data.outputs, size:', typeof modelData === 'string' ? modelData.length : 'unknown');
        }
      } else if (resultAny.data?.model_data) {
        modelData = resultAny.data.model_data;
        console.log('Found model data in data.model_data field, size:', modelData.length);
      } else if (resultAny.file || resultAny.file_data) {
        modelData = resultAny.file || resultAny.file_data;
        console.log('Found model data in file/file_data field');
      }
      
      if (!modelData) {
        console.error('No model data found in result. Full result:', JSON.stringify(result, null, 2));
        return NextResponse.json({
          success: false,
          error: `No model data received from Zoo Dev API. Response structure: ${JSON.stringify(Object.keys(result))}. Please check the console for details.`
        }, { status: 500 });
      }
      
      // Ensure modelData is a string (base64)
      if (typeof modelData !== 'string') {
        console.warn('Model data is not a string, attempting to convert:', typeof modelData);
        modelData = String(modelData);
      }

      console.log('CAD generation completed successfully');

      const generationId = result.id || `cad_${Date.now()}`;
      
      // Add to history
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cad-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: description,
            category,
            format,
            units,
            model_data: modelData as string,
            status: 'completed'
          })
        });
      } catch (historyError) {
        console.error('Failed to add to history:', historyError);
        // Don't fail the main request if history fails
      }

      // For now, we'll return the base64 model data
      // In a production app, you might want to store this in cloud storage
      return NextResponse.json({
        success: true,
        data: {
          id: generationId,
          status: 'completed',
          model_data: modelData as string,
          parameters: {
            format,
            units,
            category,
            generated_at: new Date().toISOString(),
            prompt: description
          }
        }
      });

    } catch (apiError: any) {
      console.error('Zoo Dev API call failed:', apiError);
      
      const errorMessage = apiError.message || 'Unknown error';
      
      // Add failed generation to history
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cad-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: description,
            category,
            format,
            units,
            status: 'failed',
            error: errorMessage
          })
        });
      } catch (historyError) {
        console.error('Failed to add failed generation to history:', historyError);
      }
      
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
        error: `CAD generation service error: ${errorMessage}`
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
