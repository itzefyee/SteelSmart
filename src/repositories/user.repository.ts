import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { Tables } from '@/lib/database.types';

export type ProfileRow = Tables<'profiles'>;

export interface ProfileUpdateInput {
  company?: string | null;
  phone?: string | null;
}

export class UserRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getProfile(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as ProfileRow;
  }

  async updateProfile(userId: string, update: ProfileUpdateInput): Promise<ProfileRow> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update({
        ...update,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as ProfileRow;
  }
}


