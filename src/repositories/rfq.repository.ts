import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { Tables } from '@/lib/database.types';

export type RFQSubmissionRow = Tables<'rfq_submissions'>;

export interface RFQCreateInput {
  user_id: string;
  contact_name: string;
  contact_email: string;
  contact_company?: string | null;
  contact_phone?: string | null;
  project_description: string;
  quantity: number;
  material?: string | null;
  specifications: string;
  deadline?: string | null;
  budget?: string | null;
  attached_files?: string[] | null;
  status: string;
}

export class RFQRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async create(input: RFQCreateInput): Promise<RFQSubmissionRow> {
    const { data, error } = await this.supabase
      .from('rfq_submissions')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as RFQSubmissionRow;
  }

  async findByUserId(userId: string): Promise<RFQSubmissionRow[]> {
    const { data, error } = await this.supabase
      .from('rfq_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as RFQSubmissionRow[];
  }
}


