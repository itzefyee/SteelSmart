import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseServer();

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the item belongs to the user
    const { data: item, error: fetchError } = await supabase
      .from('cad_history')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json(
        { error: 'CAD history item not found' },
        { status: 404 }
      );
    }

    // Delete associated file from storage if it exists
    if (item.file_path) {
      try {
        const { error: storageError } = await supabase.storage
          .from('cad-models')
          .remove([item.file_path]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      } catch (storageErr) {
        console.error('Storage deletion error:', storageErr);
        // Continue with database deletion
      }
    }

    // Delete the database record
    const { error: deleteError } = await supabase
      .from('cad_history')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.error('Error deleting CAD history:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete CAD history item' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'CAD history item deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/cad/history/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
