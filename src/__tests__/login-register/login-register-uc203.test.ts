/**
 * UC203: Log Out
 * Tests the functionality of user logout and session cleanup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '@/services/auth.service';

vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    auth: {
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
  };
  return { supabase: mockSupabase };
});

describe('UC203: Log Out', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_LR_UC203_001: logout user successfully', async () => {
    const mockSupabase = await import('@/lib/supabase');
    const mockAuth = mockSupabase.supabase.auth as any;
    mockAuth.signOut.mockResolvedValue({
      error: null
    });

    const result = await authService.signOut();

    expect(result.success).toBe(true);
    expect(mockAuth.signOut).toHaveBeenCalled();
  });
});