import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch a specific text-to-CAD part by ID from Zoo Dev API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Check if API token is configured
    if (!process.env.ZOO_API_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Zoo Dev API token not configured. Please set ZOO_API_TOKEN in your environment variables.'
      }, { status: 500 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Part ID is required'
      }, { status: 400 });
    }


    // Use the list endpoint and filter by ID
    // This is more reliable as the individual part endpoint may not exist
    // We'll fetch a larger list and find the matching item
    // Use no_models=false to include model data when viewing a specific part
    const response = await fetch(`https://api.zoo.dev/user/text-to-cad?limit=100&no_models=false&sort_by=created_at_descending`, {
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

    const listData = await response.json();
    
    // Find the item with matching ID (could be id or conversation_id)
    let foundItem = null;
    if (listData.items && Array.isArray(listData.items)) {
      foundItem = listData.items.find((item: any) => 
        item.id === id || 
        item.conversation_id === id ||
        String(item.id) === String(id) ||
        String(item.conversation_id) === String(id)
      );
    }
    
    if (!foundItem) {
      return NextResponse.json({
        success: false,
        error: `Part not found. The specified ID (${id}) does not exist in your generated parts.`
      }, { status: 404 });
    }
    
      hasModelData: !!foundItem.model_data,
      hasOutputs: !!foundItem.outputs,
      outputKeys: foundItem.outputs ? Object.keys(foundItem.outputs) : null,
      format: foundItem.format || foundItem.output_format
    });

    // Extract model data from various possible locations
    // IMPORTANT: Zoo Dev API returns outputs in format: { "source.step": {...}, "preview.gltf": {...} }
    // We need to look for the SPECIFIC format requested, not just grab the first output!
    let modelData = null;
    const requestedFormat = foundItem.format || foundItem.output_format || 'step';
    const outputKey = `source.${requestedFormat}`;
    
    
    if (foundItem.model_data) {
      // Direct model_data field (legacy format)
      modelData = foundItem.model_data;
    } else if (foundItem.outputs) {
      // Check for the specific format output first (e.g., "source.step")
      if (foundItem.outputs[outputKey]) {
        const output = foundItem.outputs[outputKey];
        // Extract content from output object (could be { content: "..." } or just a string)
        modelData = typeof output === 'object' && output !== null ? (output.content || output) : output;
      } else {
        // Log available outputs for debugging
        const availableKeys = Object.keys(foundItem.outputs);
        console.warn(`Requested format key ${outputKey} not found. Available output keys:`, availableKeys);
        
        // Fallback: try to find any "source.*" output (prefer source over preview)
        const sourceOutputs = availableKeys.filter(key => key.startsWith('source.'));
        if (sourceOutputs.length > 0) {
          const fallbackKey = sourceOutputs[0];
          const output = foundItem.outputs[fallbackKey];
          modelData = typeof output === 'object' && output !== null ? (output.content || output) : output;
          console.warn(`Using fallback source output: ${fallbackKey} (requested: ${outputKey})`);
        } else {
          // Last resort: use first available output (might be preview.gltf, etc.)
          const outputValues = Object.values(foundItem.outputs);
          if (outputValues.length > 0) {
            const output = outputValues[0];
            modelData = typeof output === 'object' && output !== null ? (output.content || output) : output;
            console.warn(`Using first available output as last resort (requested: ${outputKey}):`, Object.keys(foundItem.outputs)[0]);
          }
        }
      }
    } else if (foundItem.data?.model_data) {
      modelData = foundItem.data.model_data;
    } else if (foundItem.data?.outputs) {
      // Same logic for nested outputs
      if (foundItem.data.outputs[outputKey]) {
        const output = foundItem.data.outputs[outputKey];
        modelData = typeof output === 'object' && output !== null ? (output.content || output) : output;
      } else {
        const outputValues = Object.values(foundItem.data.outputs);
        if (outputValues.length > 0) {
          const output = outputValues[0];
          modelData = typeof output === 'object' && output !== null ? (output.content || output) : output;
          console.warn(`Using first output from data.outputs (requested: ${outputKey})`);
        }
      }
    }

    if (!modelData) {
      console.warn('Model data not found in item. Available keys:', Object.keys(foundItem));
      if (foundItem.outputs) {
        console.warn('Available output keys:', Object.keys(foundItem.outputs));
      }
    } else {
    }

    return NextResponse.json({
      success: true,
      data: {
        ...foundItem,
        model_data: modelData || null
      }
    });

  } catch (error: any) {
    console.error('Error fetching Zoo Dev part:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to fetch Zoo Dev part: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}
