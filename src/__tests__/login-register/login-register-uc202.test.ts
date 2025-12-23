/**
 * UC202: User Login
 * Tests the functionality of user authentication with email and password
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '@/services/auth.service';

vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    auth: {
      signInWithPassword: vi.fn(),
    },
  };
  return { supabase: mockSupabase };
});

describe('UC202: User Login', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_LR_UC202_001: login user successfully', async () => {
    const mockSupabase = await import('@/lib/supabase');
    const mockAuth = mockSupabase.supabase.auth as any;
    mockAuth.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          email_confirmed_at: '2024-01-01T00:00:00Z'
        },
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token'
        }
      },
      error: null
    });

    const result = await authService.signIn({
      email: 'test@example.com',
      password: 'SecurePass123!'
    });

    expect(result.user).toBeDefined();
    expect(result.session).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'SecurePass123!'
    });
  });

  it('TC_LR_UC202_002: handle invalid credentials error', async () => {
    const mockSupabase = await import('@/lib/supabase');
    const mockAuth = mockSupabase.supabase.auth as any;
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' }
    });

    await expect(authService.signIn({
      email: 'test@example.com',
      password: 'WrongPassword123!'
    })).rejects.toThrow('Invalid login credentials');
  });
});