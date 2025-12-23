/**
 * UC201: User Registration
 * Tests the functionality of user registration with email and password
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '@/services/auth.service';
import { ValidationError } from '@/lib/errors/app-errors';

vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    auth: {
      signUp: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return { supabase: mockSupabase };
});

describe('UC201: User Registration', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_LR_UC201_001: register user successfully', async () => {
    const mockSupabase = await import('@/lib/supabase');
    const mockAuth = mockSupabase.supabase.auth as any;
    mockAuth.signUp.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          email_confirmed_at: null
        },
        session: null
      },
      error: null
    });

    const result = await authService.signUp({
      email: 'test@example.com',
      password: 'SecurePass123!',
      company: 'Test Company'
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'SecurePass123!',
      options: {
        data: {
          company: 'Test Company'
        }
      }
    });
  });

  it('TC_LR_UC201_002: reject registration with invalid input', async () => {
    // Invalid email format
    await expect(authService.signUp({
      email: 'invalid-email',
      password: 'SecurePass123!',
      company: 'Test Company'
    })).rejects.toThrow(ValidationError);

    // Weak password - too short
    await expect(authService.signUp({
      email: 'test@example.com',
      password: '123',
      company: 'Test Company'
    })).rejects.toThrow(ValidationError);
  });
});