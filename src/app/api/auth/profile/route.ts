import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { UserRepository } from '@/repositories/user.repository';
import { UserService } from '@/services/user.service';
import { handleApiError } from '@/lib/api/error-handler';

// GET /api/auth/profile - Get user profile
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const repository = new UserRepository(supabase);
    const service = new UserService(repository);

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

    // Fetch user profile via service
    const profile = await service.getProfile(user.id);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: profile }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/auth/profile - Update user profile
export async function PUT(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const repository = new UserRepository(supabase);
    const service = new UserService(repository);

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

    // Update profile through service (service handles auth internally)
    const profile = await service.updateProfile({
      company,
      phone,
    });

    return NextResponse.json(
      { data: profile, message: 'Profile updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
