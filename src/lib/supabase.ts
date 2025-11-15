import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (for use in browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For client components (uses cookies automatically)
export function getSupabaseClient() {
  return createClientComponentClient<Database>();
}

// For server components and API routes (requires cookies)
export async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
}

// Server-side admin client (bypasses RLS, use with caution)
export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Database types - Auto-generated with `npx supabase gen types typescript`
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          company: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          category: 'robotic' | 'structural' | 'fasteners' | 'custom';
          material: string | null;
          specifications: any; // JSONB
          price: number;
          images: string[];
          description: string | null;
          technical_details: string | null;
          compatible_with: string[];
          in_stock: boolean;
          lead_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          category: 'robotic' | 'structural' | 'fasteners' | 'custom';
          material?: string | null;
          specifications: any;
          price: number;
          images?: string[];
          description?: string | null;
          technical_details?: string | null;
          compatible_with?: string[];
          in_stock?: boolean;
          lead_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: 'robotic' | 'structural' | 'fasteners' | 'custom';
          material?: string | null;
          specifications?: any;
          price?: number;
          images?: string[];
          description?: string | null;
          technical_details?: string | null;
          compatible_with?: string[];
          in_stock?: boolean;
          lead_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      cad_history: {
        Row: {
          id: string;
          user_id: string | null;
          prompt: string;
          category: string | null;
          format: string;
          units: string | null;
          model_data_url: string | null;
          file_path: string | null;
          file_size: number | null;
          generated_at: string;
          status: 'completed' | 'failed' | 'processing';
          error: string | null;
          zoo_operation_id: string | null;
          metadata: any; // JSONB
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          prompt: string;
          category?: string | null;
          format: string;
          units?: string | null;
          model_data_url?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          generated_at?: string;
          status?: 'completed' | 'failed' | 'processing';
          error?: string | null;
          zoo_operation_id?: string | null;
          metadata?: any;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          prompt?: string;
          category?: string | null;
          format?: string;
          units?: string | null;
          model_data_url?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          generated_at?: string;
          status?: 'completed' | 'failed' | 'processing';
          error?: string | null;
          zoo_operation_id?: string | null;
          metadata?: any;
        };
      };
      drawing_analyses: {
        Row: {
          id: string;
          user_id: string | null;
          file_name: string;
          file_path: string;
          file_type: string | null;
          file_size: number | null;
          extracted_specs: any; // JSONB
          recommended_products: any; // JSONB
          confidence: number | null;
          reasoning: string | null;
          analyzed_at: string;
          gemini_response: any; // JSONB
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          file_name: string;
          file_path: string;
          file_type?: string | null;
          file_size?: number | null;
          extracted_specs?: any;
          recommended_products?: any;
          confidence?: number | null;
          reasoning?: string | null;
          analyzed_at?: string;
          gemini_response?: any;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          file_name?: string;
          file_path?: string;
          file_type?: string | null;
          file_size?: number | null;
          extracted_specs?: any;
          recommended_products?: any;
          confidence?: number | null;
          reasoning?: string | null;
          analyzed_at?: string;
          gemini_response?: any;
        };
      };
      rfq_submissions: {
        Row: {
          id: string;
          user_id: string | null;
          contact_name: string;
          contact_email: string;
          contact_company: string | null;
          contact_phone: string | null;
          project_description: string;
          quantity: number;
          material: string | null;
          specifications: string;
          deadline: string | null;
          budget: string | null;
          attached_files: string[];
          status: 'pending' | 'reviewed' | 'quoted' | 'completed' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
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
          attached_files?: string[];
          status?: 'pending' | 'reviewed' | 'quoted' | 'completed' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          contact_name?: string;
          contact_email?: string;
          contact_company?: string | null;
          contact_phone?: string | null;
          project_description?: string;
          quantity?: number;
          material?: string | null;
          specifications?: string;
          deadline?: string | null;
          budget?: string | null;
          attached_files?: string[];
          status?: 'pending' | 'reviewed' | 'quoted' | 'completed' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
      };
      file_conversions: {
        Row: {
          id: string;
          user_id: string | null;
          original_file_path: string;
          original_format: string;
          converted_file_path: string;
          converted_format: string;
          file_size: number | null;
          conversion_status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          original_file_path: string;
          original_format: string;
          converted_file_path: string;
          converted_format: string;
          file_size?: number | null;
          conversion_status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          original_file_path?: string;
          original_format?: string;
          converted_file_path?: string;
          converted_format?: string;
          file_size?: number | null;
          conversion_status?: string | null;
          created_at?: string;
        };
      };
      product_favorites: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};

// Type helpers for common queries
export type Product = Database['public']['Tables']['products']['Row'];
export type CADHistory = Database['public']['Tables']['cad_history']['Row'];
export type DrawingAnalysis = Database['public']['Tables']['drawing_analyses']['Row'];
export type RFQSubmission = Database['public']['Tables']['rfq_submissions']['Row'];
export type FileConversion = Database['public']['Tables']['file_conversions']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
