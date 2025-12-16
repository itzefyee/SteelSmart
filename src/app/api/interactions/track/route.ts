import { NextRequest, NextResponse } from 'next/server';
import { InteractionTrackingService } from '@/services/interaction-tracking.service';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, action, searchContext, sessionId } = body;

    // Validate required fields
    if (!productId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: productId, action' },
        { status: 400 }
      );
    }

    // Validate action type
    const validActions = ['view', 'click', 'search', 'rfq', 'purchase', 'add_to_cart'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user ID from session
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    // Track the interaction
    await InteractionTrackingService.trackInteractionServer(
      user?.id || null,
      {
        productId,
        action,
        searchContext,
        sessionId,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Interaction tracked successfully',
    });
  } catch (error) {
    console.error('Track interaction API error:', error);
    
    // Don't fail the request - tracking is non-critical
    return NextResponse.json({
      success: false,
      error: 'Failed to track interaction',
    }, { status: 500 });
  }
}

// GET endpoint to retrieve user's interaction history (optional)
// TODO: Re-enable after regenerating Supabase types with user_product_interactions table
export async function GET(request: NextRequest) {
  try {
    // Temporarily disabled - table exists but not in TypeScript types
    return NextResponse.json({
      success: false,
      error: 'Interaction history endpoint temporarily disabled',
    }, { status: 501 });

    /* 
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const action = searchParams.get('action');

    let query = supabase
      .from('user_product_interactions')
      .select('*, products(id, name, category, price)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (action) {
      query = query.eq('action', action);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
    */
  } catch (error) {
    console.error('Get interactions API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve interactions' },
      { status: 500 }
    );
  }
}
