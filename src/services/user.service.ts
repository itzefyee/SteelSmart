import { UserRepository, type ProfileUpdateInput } from '@/repositories/user.repository';
import type { ProfileRow } from '@/repositories/user.repository';
import { getSupabaseServer } from '@/lib/supabase-server';
import { ValidationError, NotFoundError } from '@/lib/errors/app-errors';

export class UserService {
  constructor(private readonly repository?: UserRepository) {}

  async getProfile(userId: string): Promise<ProfileRow | null> {
    const repository = this.repository || new UserRepository(await getSupabaseServer());
    return repository.getProfile(userId);
  }

  async updateProfile(update: ProfileUpdateInput): Promise<ProfileRow> {
    // Get current user
    const supabase = await getSupabaseServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error(userError?.message || 'Unauthorized');
    }

    // Validate input
    this.validateUpdateInput(update);

    // Sanitize input
    const sanitizedUpdate = this.sanitizeUpdateInput(update);

    const repository = this.repository || new UserRepository(supabase);
    
    try {
      const result = await repository.updateProfile(user.id, sanitizedUpdate);
      return result;
    } catch (error: any) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Profile');
      }
      throw new Error('Failed to update profile');
    }
  }

  private validateUpdateInput(update: ProfileUpdateInput): void {
    if (update.company !== undefined && update.company !== null) {
      if (typeof update.company === 'string' && update.company.trim() === '') {
        throw new ValidationError('Company name cannot be empty');
      }
    }

    if (update.phone !== undefined && update.phone !== null) {
      if (typeof update.phone === 'string') {
        this.validatePhoneNumber(update.phone);
      }
    }
  }

  private validatePhoneNumber(phone: string): void {
    const trimmedPhone = phone.trim();
    
    // Basic phone number validation
    // Allow formats like: +1234567890, +44 20 7946 0958, (555) 123-4567
    const phoneRegex = /^[\+]?[\d\s\(\)\-]{7,20}$/;
    
    if (!phoneRegex.test(trimmedPhone)) {
      throw new ValidationError('Invalid phone number format');
    }

    // Check for too many consecutive same digits or invalid patterns
    if (trimmedPhone.length < 7 || trimmedPhone.length > 20) {
      throw new ValidationError('Invalid phone number format');
    }

    // Reject obviously invalid patterns
    if (/^\++/.test(trimmedPhone) || /abc|def|ghi/i.test(trimmedPhone)) {
      throw new ValidationError('Invalid phone number format');
    }
  }

  private sanitizeUpdateInput(update: ProfileUpdateInput): ProfileUpdateInput {
    const sanitized: ProfileUpdateInput = {};

    if (update.company !== undefined) {
      sanitized.company = typeof update.company === 'string' ? update.company.trim() : update.company;
    }

    if (update.phone !== undefined) {
      sanitized.phone = typeof update.phone === 'string' ? update.phone.trim() : update.phone;
    }

    return sanitized;
  }
}


