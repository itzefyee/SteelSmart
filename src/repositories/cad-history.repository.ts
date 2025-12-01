import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { Tables } from '@/lib/database.types';

export type CADHistoryRow = Tables<'cad_history'>;

export interface CADHistoryCreateInput {
  user_id: string;
  prompt: string;
  category?: string | null;
  format: string;
  units?: string | null;
  model_data_url?: string | null;
  file_path?: string | null;
  file_size?: number | null;
  status: 'completed' | 'failed' | 'processing';
  error?: string | null;
  zoo_operation_id?: string | null;
}

export class CADHistoryRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async create(input: CADHistoryCreateInput): Promise<CADHistoryRow> {
    const { data, error } = await this.supabase
      .from('cad_history')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as CADHistoryRow;
  }

  async findById(id: string): Promise<CADHistoryRow | null> {
    const { data, error } = await this.supabase
      .from('cad_history')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as CADHistoryRow;
  }

  async findByUserId(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ items: CADHistoryRow[]; total: number }> {
    const countQuery = this.supabase
      .from('cad_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    const { data, error } = await this.supabase
      .from('cad_history')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return {
      items: (data || []) as CADHistoryRow[],
      total: count || 0,
    };
  }

  async deleteById(id: string, userId: string): Promise<CADHistoryRow | null> {
    const { data, error } = await this.supabase
      .from('cad_history')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as CADHistoryRow;
  }

  async deleteAllForUser(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('cad_history')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }
}


