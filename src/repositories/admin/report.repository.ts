import { getSupabaseServer } from '@/lib/supabase-server';
import type { Report, ReportStatistics } from '@/types';
import type { TablesInsert, TablesUpdate } from '@/lib/database.types';

export interface ReportFilters {
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  report_type?: string;
  search?: string;
}

export type CreateReportInput = Omit<TablesInsert<'reports'>, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'file_url' | 'error_message'>;
export type UpdateReportInput = Omit<TablesUpdate<'reports'>, 'id' | 'created_at'>;

export class ReportRepository {
  async findAll(
    filters?: ReportFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reports: Report[]; total: number }> {
    const supabase = await getSupabaseServer();
    
    try {
      let query = supabase.from('reports').select('*', { count: 'exact' });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.report_type) {
        query = query.eq('report_type', filters.report_type);
      }
      
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) {
        console.warn('Reports table not found, returning empty results:', error.message);
        return { reports: [], total: 0 };
      }
      
      return {
        reports: (data || []) as Report[],
        total: count || 0,
      };
    } catch (error) {
      console.warn('Error fetching reports, returning empty results:', error);
      return { reports: [], total: 0 };
    }
  }

  async findById(id: string): Promise<Report | null> {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch report: ${error.message}`);
    }
    
    return data as Report;
  }

  async create(input: CreateReportInput): Promise<Report> {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('reports')
      .insert(input)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create report: ${error.message}`);
    return data as Report;
  }

  async update(id: string, input: UpdateReportInput): Promise<Report> {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('reports')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update report: ${error.message}`);
    return data as Report;
  }

  async delete(id: string): Promise<void> {
    const supabase = await getSupabaseServer();
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete report: ${error.message}`);
  }

  async getStatistics(): Promise<ReportStatistics> {
    const supabase = await getSupabaseServer();
    
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('status');
      
      if (error) {
        console.warn('Reports table not found, returning empty statistics:', error.message);
        // Return empty statistics if table doesn't exist
        return {
          total: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
        };
      }
      
      const stats: ReportStatistics = {
        total: data?.length || 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };
      
      data?.forEach((report) => {
        switch (report.status) {
          case 'PENDING':
            stats.pending++;
            break;
          case 'PROCESSING':
            stats.processing++;
            break;
          case 'COMPLETED':
            stats.completed++;
            break;
          case 'FAILED':
            stats.failed++;
            break;
        }
      });
      
      return stats;
    } catch (error) {
      console.warn('Error fetching report statistics, returning empty statistics:', error);
      // Return empty statistics on any error
      return {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };
    }
  }
}
