import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { Tables } from '@/lib/database.types';

export type DrawingAnalysisRow = Tables<'drawing_analyses'>;

export interface DrawingAnalysisCreateInput {
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  extracted_specs: any;
  recommended_products: any;
  confidence: number;
  reasoning: string;
  gemini_response: any;
}

/**
 * TechnicalDrawingRepository handles data access for technical drawings and their analyses
 * Manages both file storage and database records
 */
export class TechnicalDrawingRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Upload a technical drawing file to storage
   * 
   * @param userId - User ID for file path
   * @param file - File buffer to upload
   * @param fileName - Original file name
   * @param contentType - MIME type of the file
   * @returns File path in storage
   */
  async uploadDrawing(
    userId: string,
    file: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    const filePath = `${userId}/${Date.now()}_${fileName}`;

    const { error } = await this.supabase.storage
      .from('technical-drawings')
      .upload(filePath, file, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload drawing: ${error.message}`);
    }

    return filePath;
  }

  /**
   * Save drawing analysis to database
   * 
   * @param input - Analysis data to save
   * @returns Created analysis record
   */
  async createAnalysis(input: DrawingAnalysisCreateInput): Promise<DrawingAnalysisRow> {
    const { data, error } = await this.supabase
      .from('drawing_analyses')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save analysis: ${error.message}`);
    }

    return data as DrawingAnalysisRow;
  }

  /**
   * Get all analyses for a user
   * 
   * @param userId - User ID
   * @param limit - Maximum number of results
   * @param offset - Pagination offset
   * @returns List of analyses
   */
  async findByUserId(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<DrawingAnalysisRow[]> {
    const { data, error } = await this.supabase
      .from('drawing_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch analyses: ${error.message}`);
    }

    return data as DrawingAnalysisRow[];
  }

  /**
   * Get a single analysis by ID
   * 
   * @param id - Analysis ID
   * @returns Analysis record or null
   */
  async findById(id: string): Promise<DrawingAnalysisRow | null> {
    const { data, error } = await this.supabase
      .from('drawing_analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch analysis: ${error.message}`);
    }

    return data as DrawingAnalysisRow;
  }

  /**
   * Delete an analysis and its associated file
   * 
   * @param id - Analysis ID
   * @param filePath - File path in storage (if exists)
   */
  async deleteAnalysis(id: string, filePath?: string): Promise<void> {
    // Delete file from storage if path provided
    if (filePath) {
      const { error: storageError } = await this.supabase.storage
        .from('technical-drawings')
        .remove([filePath]);

      if (storageError) {
        console.error('Failed to delete file from storage:', storageError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete database record
    const { error } = await this.supabase
      .from('drawing_analyses')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete analysis: ${error.message}`);
    }
  }
}
