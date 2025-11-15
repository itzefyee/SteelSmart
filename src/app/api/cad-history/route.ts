import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

// Types for the history API
interface CADHistoryItem {
  id: string;
  prompt: string;
  category: string;
  format: string;
  units: string;
  model_data_url?: string; // URL to file in Supabase Storage
  file_path?: string;
  model_data?: string; // Legacy: base64 encoded (deprecated, use model_data_url)
  generated_at: string;
  status: 'completed' | 'failed' | 'processing';
  error?: string;
  zoo_operation_id?: string;
}

interface HistoryResponse {
  success: boolean;
  data?: CADHistoryItem[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

interface AddHistoryRequest {
  prompt: string;
  category: string;
  format: string;
  units: string;
  model_data?: string; // base64 encoded model data
  status: 'completed' | 'failed' | 'processing';
  error?: string;
  zoo_operation_id?: string;
}

// GET - Retrieve CAD generation history
export async function GET(request: NextRequest): Promise<NextResponse<HistoryResponse>> {
  try {
    const supabase = await getSupabaseServer();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Please sign in to view history'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get total count
    const { count, error: countError } = await supabase
      .from('cad_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting CAD history:', countError);
    }

    // Get paginated history
    const { data, error } = await supabase
      .from('cad_history')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error retrieving CAD history:', error);
      return NextResponse.json({
        success: false,
        error: `Failed to retrieve history: ${error.message}`
      }, { status: 500 });
    }

    // Transform data to include model_data_url and maintain backward compatibility
    const transformedData: CADHistoryItem[] = data.map(item => ({
      id: item.id,
      prompt: item.prompt,
      category: item.category || '',
      format: item.format,
      units: item.units || 'mm',
      model_data_url: item.model_data_url ?? undefined,
      file_path: item.file_path ?? undefined,
      generated_at: item.generated_at || new Date().toISOString(),
      status: (item.status as 'completed' | 'failed' | 'processing') || 'completed',
      error: item.error ?? undefined,
      zoo_operation_id: item.zoo_operation_id ?? undefined
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
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
    const supabase = await getSupabaseServer();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Please sign in to save history'
      }, { status: 401 });
    }

    const body: AddHistoryRequest = await request.json();
    const { prompt, category, format, units, model_data, status, error, zoo_operation_id } = body;

    if (!prompt || !category || !format || !units || !status) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: prompt, category, format, units, and status are required'
      }, { status: 400 });
    }

    // If model_data is provided, upload to Supabase Storage
    let filePath: string | null = null;
    let modelDataUrl: string | null = null;
    let fileSize: number | null = null;

    if (model_data) {
      try {
        // Decode base64 and upload to storage
        const modelBuffer = Buffer.from(model_data, 'base64');
        fileSize = modelBuffer.length;
        filePath = `${user.id}/${Date.now()}.${format}`;

        const { error: uploadError } = await supabase.storage
          .from('cad-models')
          .upload(filePath, modelBuffer, {
            contentType: `model/${format}`,
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading CAD model:', uploadError);
          // Continue without file storage if upload fails
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('cad-models')
            .getPublicUrl(filePath);

          modelDataUrl = publicUrl;
        }
      } catch (uploadError) {
        console.error('Error processing model upload:', uploadError);
        // Continue without file storage
      }
    }

    // Insert database record
    const { data: insertData, error: insertError } = await supabase
      .from('cad_history')
      .insert({
        user_id: user.id,
        prompt,
        category,
        format,
        units,
        model_data_url: modelDataUrl,
        file_path: filePath,
        file_size: fileSize,
        status,
        error,
        zoo_operation_id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding to CAD history:', insertError);
      return NextResponse.json({
        success: false,
        error: `Failed to add to history: ${insertError.message}`
      }, { status: 500 });
    }


    return NextResponse.json({
      success: true,
      id: insertData.id
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
    const supabase = await getSupabaseServer();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Please sign in'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get the item first to delete associated file
      const { data: item, error: fetchError } = await supabase
        .from('cad_history')
        .select('file_path')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        return NextResponse.json({
          success: false,
          error: 'Item not found'
        }, { status: 404 });
      }

      // Delete file from storage if exists
      if (item.file_path) {
        await supabase.storage
          .from('cad-models')
          .remove([item.file_path]);
      }

      // Delete database record
      const { error: deleteError } = await supabase
        .from('cad_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        return NextResponse.json({
          success: false,
          error: `Failed to delete: ${deleteError.message}`
        }, { status: 500 });
      }

      console.log(`Deleted CAD history item: ${id}`);
    } else {
      // Clear all history for this user
      // First get all file paths
      const { data: items } = await supabase
        .from('cad_history')
        .select('file_path')
        .eq('user_id', user.id);

      // Delete all files from storage
      if (items && items.length > 0) {
        const filePaths = items
          .map(item => item.file_path)
          .filter(Boolean) as string[];

        if (filePaths.length > 0) {
          await supabase.storage
            .from('cad-models')
            .remove(filePaths);
        }
      }

      // Delete all database records
      const { error: deleteError } = await supabase
        .from('cad_history')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        return NextResponse.json({
          success: false,
          error: `Failed to clear history: ${deleteError.message}`
        }, { status: 500 });
      }

      console.log('Cleared all CAD history for user:', user.id);
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
