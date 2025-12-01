import { UserRepository, type ProfileUpdateInput } from '@/repositories/user.repository';
import type { ProfileRow } from '@/repositories/user.repository';

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async getProfile(userId: string): Promise<ProfileRow | null> {
    return this.repository.getProfile(userId);
  }

  async updateProfile(userId: string, update: ProfileUpdateInput): Promise<ProfileRow> {
    return this.repository.updateProfile(userId, update);
  }
}


