import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Client-side Supabase client (for use in browser and client components)
// Using SSR package for better cookie handling
// IMPORTANT: create a single shared client instance so auth state and
// subscriptions stay consistent across the app. Creating a new client on
// every call can cause subtle auth / loading issues.
const browserSupabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
export const supabase = browserSupabaseClient;

// For client components (uses cookies automatically)
// Always return the singleton client above so that:
// - AuthProvider, Header, account page, RFQ, and product detail pages
//   all share the same auth/session state
// - We avoid multiple overlapping onAuthStateChange subscriptions
// - Requests reuse the same cached session instead of re-negotiating
export function getSupabaseClient() {
  return browserSupabaseClient;
}

let serverSupabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseServerClient() {
  if (!serverSupabaseClient) {
    serverSupabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serverSupabaseClient;
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
