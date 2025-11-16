import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

// GET /api/auth/profile - Get user profile
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: profile }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/auth/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/profile - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { company, phone } = body;

    // Validate input
    if (company !== undefined && typeof company !== 'string') {
      return NextResponse.json(
        { error: 'Invalid company field' },
        { status: 400 }
      );
    }

    if (phone !== undefined && typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Invalid phone field' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (company !== undefined) {
      updateData.company = company;
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    // Update profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: profile, message: 'Profile updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/auth/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
