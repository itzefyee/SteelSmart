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

    console.log(`Fetching Zoo Dev part with ID: ${id}`);

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
    console.log('Zoo Dev list fetched, searching for ID:', id);
    
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
      console.log('Item not found. Available IDs:', listData.items?.map((i: any) => ({ id: i.id, conversation_id: i.conversation_id })));
      return NextResponse.json({
        success: false,
        error: `Part not found. The specified ID (${id}) does not exist in your generated parts.`
      }, { status: 404 });
    }
    
    console.log('Found item:', foundItem.id, foundItem.conversation_id);

    // Extract model data from various possible locations
    let modelData = null;
    
    if (foundItem.model_data) {
      modelData = foundItem.model_data;
    } else if (foundItem.outputs) {
      // Model data might be in outputs object
      const outputValues = Object.values(foundItem.outputs);
      if (outputValues.length > 0) {
        modelData = outputValues[0];
      }
    } else if (foundItem.data?.model_data) {
      modelData = foundItem.data.model_data;
    } else if (foundItem.data?.outputs) {
      const outputValues = Object.values(foundItem.data.outputs);
      if (outputValues.length > 0) {
        modelData = outputValues[0];
      }
    }

    if (!modelData) {
      console.warn('Model data not found in item:', Object.keys(foundItem));
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
