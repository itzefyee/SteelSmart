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

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 20;
    const action = searchParams.get('action');

    const validActions = ['view', 'click', 'search', 'rfq', 'purchase', 'add_to_cart'];
    if (action && !validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid interaction action' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('user_product_interactions')
      .select('id, product_id, action, search_context, session_id, created_at')
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
  } catch (error) {
    console.error('Get interactions API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve interactions' },
      { status: 500 }
    );
  }
}
