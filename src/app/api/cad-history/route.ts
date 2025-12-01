import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { deleteCached, invalidateCachePattern } from '@/lib/cache/redis-cache';
import { generateCADHistoryCacheKey } from '@/lib/cache/cache-keys';
import { CADHistoryRepository } from '@/repositories/cad-history.repository';

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
    const repository = new CADHistoryRepository(supabase);

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

    const { items, total } = await repository.findByUserId(user.id, limit, offset);

    // Transform data to include model_data_url and maintain backward compatibility
    const transformedData: CADHistoryItem[] = items.map(item => ({
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
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
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
    const repository = new CADHistoryRepository(supabase);

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

    const insertData = await repository.create({
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
      zoo_operation_id,
    });


    // ===== CACHE INVALIDATION =====
    // When a new CAD generation is added to history, invalidate:
    // 1. User-specific CAD history caches (all pages)
    // 2. Global CAD history caches (if applicable)
    
    try {
      // Invalidate user-specific history caches (common pagination scenarios)
      const historyKeys = [
        generateCADHistoryCacheKey(user.id, 1, 10),
        generateCADHistoryCacheKey(user.id, 1, 20),
        generateCADHistoryCacheKey(user.id, 1, 50),
        // Also invalidate first few pages
        generateCADHistoryCacheKey(user.id, 2, 10),
        generateCADHistoryCacheKey(user.id, 3, 10),
      ];
      
      await invalidateCachePattern(historyKeys);
      
      console.log(`Cache invalidated for CAD history addition: user ${user.id}`);
    } catch (cacheError) {
      // Log but don't fail the request if cache invalidation fails
      console.error('Cache invalidation error:', cacheError);
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
    const repository = new CADHistoryRepository(supabase);

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
      const toDelete = await repository.findById(id);

      if (!toDelete || toDelete.user_id !== user.id) {
        return NextResponse.json({
          success: false,
          error: 'Item not found'
        }, { status: 404 });
      }

      // Delete file from storage if exists
      if (toDelete.file_path) {
        await supabase.storage
          .from('cad-models')
          .remove([toDelete.file_path]);
      }

      await repository.deleteById(id, user.id);

      // ===== CACHE INVALIDATION =====
      // When a CAD history item is deleted, invalidate user-specific history caches
      
      try {
        const historyKeys = [
          generateCADHistoryCacheKey(user.id, 1, 10),
          generateCADHistoryCacheKey(user.id, 1, 20),
          generateCADHistoryCacheKey(user.id, 1, 50),
          generateCADHistoryCacheKey(user.id, 2, 10),
          generateCADHistoryCacheKey(user.id, 3, 10),
        ];
        
        await invalidateCachePattern(historyKeys);
        
        console.log(`Cache invalidated for CAD history deletion: ${id}`);
      } catch (cacheError) {
        console.error('Cache invalidation error:', cacheError);
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

      await repository.deleteAllForUser(user.id);

      // ===== CACHE INVALIDATION =====
      // When all CAD history is cleared, invalidate all user-specific history caches
      
      try {
        const historyKeys = [
          generateCADHistoryCacheKey(user.id, 1, 10),
          generateCADHistoryCacheKey(user.id, 1, 20),
          generateCADHistoryCacheKey(user.id, 1, 50),
          generateCADHistoryCacheKey(user.id, 2, 10),
          generateCADHistoryCacheKey(user.id, 3, 10),
        ];
        
        await invalidateCachePattern(historyKeys);
        
        console.log(`Cache invalidated for CAD history clear: user ${user.id}`);
      } catch (cacheError) {
        console.error('Cache invalidation error:', cacheError);
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
