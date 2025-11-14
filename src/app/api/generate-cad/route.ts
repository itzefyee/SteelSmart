import { NextRequest, NextResponse } from 'next/server';
import { ml } from '@kittycad/lib';

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

// Types for the API
interface CADGenerationRequest {
  description: string;
  category?: 'bracket' | 'plate' | 'beam' | 'fastener' | 'custom';
  format?: 'step' | 'stl' | 'obj' | 'gltf' | 'glb';
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

/**
 * Poll a text-to-CAD operation until it completes or fails
 * @param operationId - The ID of the operation to poll
 * @param format - The output format (step, stl, obj)
 * @param maxAttempts - Maximum number of polling attempts (default: 60 = 2 minutes)
 * @param pollInterval - Interval between polls in milliseconds (default: 2000ms)
 */
async function pollTextToCadOperation(
  operationId: string, 
  format: string,
  maxAttempts: number = 60,
  pollInterval: number = 2000
): Promise<any> {
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Get the operation status using the Zoo Dev API
      // Note: Using type assertion as the method name may vary in type definitions
      const operation = await (ml as any).get_text_to_cad_part_for_user({
        id: operationId
      });


      // Check if operation completed successfully
      if (operation.status === 'completed') {
        
        // Extract model data from outputs
        const outputKey = `source.${format}`;
        
        if (operation.outputs && operation.outputs[outputKey]) {
          return {
            id: operation.id,
            status: 'completed',
            outputs: operation.outputs
          };
        } else {
          // Fallback: try to return any available output
          console.warn(`Expected output key ${outputKey} not found, returning all outputs`);
          return {
            id: operation.id,
            status: 'completed',
            outputs: operation.outputs
          };
        }
      }

      // Check if operation failed
      if (operation.status === 'failed') {
        const errorMessage = (operation as any).error || 'Generation failed';
        console.error(`Operation failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // Operation is still in progress (queued, in_progress, uploading, etc.)
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error: any) {
      // If it's a known failed status, throw immediately
      if (error.message && !error.message.includes('fetch') && !error.message.includes('network')) {
        throw error;
      }
      
      // For network errors, log and continue polling
      console.warn(`Poll attempt ${attempt} encountered error:`, error.message);
      
      // If we're out of attempts, throw
      if (attempt === maxAttempts) {
        throw new Error(`Polling failed after ${maxAttempts} attempts: ${error.message}`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  // If we've exhausted all attempts
  throw new Error(`Operation ${operationId} did not complete within ${maxAttempts * pollInterval / 1000} seconds`);
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

    try {
      // Use Zoo Dev API for text-to-CAD generation
      const result = await ml.create_text_to_cad({
          body: {
              prompt: description,
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

      // Check if this is an async operation that needs polling
      let finalResult = result;
      if (result && 'status' in result && result.status !== 'completed') {
        
        // Poll the operation until it completes
        finalResult = await pollTextToCadOperation(result.id || '', format);
      }

      // Extract the generated model data using the correct output key format
      let modelData = null;
      const outputKey = `source.${format}`;
      
      
      if (finalResult.outputs && typeof finalResult.outputs === 'object') {
        // Try the specific format key first (e.g., "source.step")
        if (finalResult.outputs[outputKey]) {
          const output = finalResult.outputs[outputKey];
          // Extract content from the output object (could be { content: "..." } or just a string)
          modelData = (typeof output === 'object' && output !== null && 'content' in output) 
            ? (output as any).content 
            : (typeof output === 'string' ? output : String(output));
        } else {
          // Fallback: try any available output
          const availableKeys = Object.keys(finalResult.outputs);
          
          for (const key of availableKeys) {
            const output = finalResult.outputs[key];
            if (output) {
              // Handle both object with content property and direct string
              if (typeof output === 'string') {
                modelData = output;
              } else if (typeof output === 'object' && output !== null && 'content' in output) {
                modelData = (output as any).content;
              } else {
                modelData = String(output);
              }
              break;
            }
          }
        }
      }
      
      // Additional fallback for older API responses
      if (!modelData) {
        const resultAny = finalResult as any;
        if (resultAny.model_data) {
          modelData = resultAny.model_data;
        } else if (resultAny.data?.model_data) {
          modelData = resultAny.data.model_data;
        }
      }
      
      if (!modelData) {
        console.error('No model data found in result. Full result:', JSON.stringify(finalResult, null, 2));
        return NextResponse.json({
          success: false,
          error: `No model data received from Zoo Dev API. Response structure: ${JSON.stringify(Object.keys(finalResult))}. Please check the console for details.`
        }, { status: 500 });
      }
      
      // Ensure modelData is a string (base64)
      if (typeof modelData !== 'string') {
        console.warn('Model data is not a string, attempting to convert:', typeof modelData);
        modelData = String(modelData);
      }


      const generationId = finalResult.id || `cad_${Date.now()}`;
      
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
