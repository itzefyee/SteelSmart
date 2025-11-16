import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Client-side Supabase client (for use in browser and client components)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// For client components (uses cookies automatically)
export function getSupabaseClient() {
  return createClientComponentClient<Database>();
}

// Server-side admin client (bypasses RLS, use with caution)
export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Re-export Database type for convenience
export type { Database } from './database.types';

// Type helpers for common queries (using generated types from database.types.ts)
export type Category = Database['public']['Tables']['categories']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type CADHistory = Database['public']['Tables']['cad_history']['Row'];
export type DrawingAnalysis = Database['public']['Tables']['drawing_analyses']['Row'];
export type RFQSubmission = Database['public']['Tables']['rfq_submissions']['Row'];
export type FileConversion = Database['public']['Tables']['file_conversions']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProductFavorite = Database['public']['Tables']['product_favorites']['Row'];
