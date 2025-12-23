/**
 * UC204: Edit User Profile
 * Tests the functionality of updating user profile information
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserService } from '@/services/user.service';
import { ValidationError } from '@/lib/errors/app-errors';

// Mock the entire supabase-server module
vi.mock('@/lib/supabase-server', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  };
  return { getSupabaseServer: vi.fn(async () => mockSupabase) };
});

const mockUser = {
  id: 'user-123',
  email: 'test@example.com'
};

const mockProfile = {
  id: 'user-123',
  company: 'Test Company',
  phone: '+1234567890',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('UC204: Edit User Profile', () => {
  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    userService = new UserService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('TC_LR_UC204_001: update user profile successfully', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase-server');
    const mockSupabase = await getSupabaseServer();
    
    // Mock authentication
    (mockSupabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
    
    // Mock the query chain
    const mockSingle = vi.fn().mockResolvedValue({
      data: { ...mockProfile, company: 'Updated Company' },
      error: null
    });
    
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
    
    (mockSupabase.from as any).mockImplementation(mockFrom);

    const updateData = {
      company: 'Updated Company'
    };

    const result = await userService.updateProfile(updateData);

    expect(result.company).toBe('Updated Company');
    expect(mockFrom).toHaveBeenCalledWith('profiles');
  });

  it('TC_LR_UC204_002: reject edit with invalid input', async () => {
    // Invalid phone number format
    await expect(userService.updateProfile({
      phone: 'invalid-phone'
    })).rejects.toThrow(ValidationError);

    // Empty company name
    await expect(userService.updateProfile({
      company: ''
    })).rejects.toThrow(ValidationError);
  });
});