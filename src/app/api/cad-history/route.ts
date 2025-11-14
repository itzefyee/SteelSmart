import { NextRequest, NextResponse } from 'next/server';

// Types for the history API
interface CADHistoryItem {
  id: string;
  prompt: string;
  category: string;
  format: string;
  units: string;
  model_data: string; // base64 encoded
  generated_at: string;
  status: 'completed' | 'failed';
  error?: string;
}

interface HistoryResponse {
  success: boolean;
  data?: CADHistoryItem[];
  error?: string;
}

interface AddHistoryRequest {
  prompt: string;
  category: string;
  format: string;
  units: string;
  model_data?: string;
  status: 'completed' | 'failed';
  error?: string;
}

// In-memory storage for demo purposes
// In production, you'd use a database like PostgreSQL, MongoDB, etc.
let cadHistory: CADHistoryItem[] = [];

// GET - Retrieve CAD generation history
export async function GET(request: NextRequest): Promise<NextResponse<HistoryResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Sort by generated_at descending (newest first)
    const sortedHistory = [...cadHistory].sort((a, b) => 
      new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
    );

    // Apply pagination
    const paginatedHistory = sortedHistory.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedHistory
    });

  } catch (error: any) {
    console.error('Error retrieving CAD history:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to retrieve history: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

// POST - Add new CAD generation to history
export async function POST(request: NextRequest): Promise<NextResponse<{ success: boolean; id?: string; error?: string }>> {
  try {
    const body: AddHistoryRequest = await request.json();
    const { prompt, category, format, units, model_data, status, error } = body;

    if (!prompt || !category || !format || !units || !status) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: prompt, category, format, units, and status are required'
      }, { status: 400 });
    }

    const historyItem: CADHistoryItem = {
      id: `cad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      prompt,
      category,
      format,
      units,
      model_data: model_data || '',
      generated_at: new Date().toISOString(),
      status,
      error
    };

    // Add to history
    cadHistory.push(historyItem);

    // Keep only the last 100 items to prevent memory issues
    if (cadHistory.length > 100) {
      cadHistory = cadHistory.slice(-100);
    }


    return NextResponse.json({
      success: true,
      id: historyItem.id
    });

  } catch (error: any) {
    console.error('Error adding to CAD history:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to add to history: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

// DELETE - Clear history or delete specific item
export async function DELETE(request: NextRequest): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Delete specific item
      const initialLength = cadHistory.length;
      cadHistory = cadHistory.filter(item => item.id !== id);
      
      if (cadHistory.length === initialLength) {
        return NextResponse.json({
          success: false,
          error: 'Item not found'
        }, { status: 404 });
      }

    } else {
      // Clear all history
      cadHistory = [];
    }

    return NextResponse.json({
      success: true
    });

  } catch (error: any) {
    console.error('Error deleting CAD history:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to delete history: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}
