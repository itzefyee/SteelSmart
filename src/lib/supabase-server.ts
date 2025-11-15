import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// For server components and API routes (requires cookies)
// This creates a Supabase client that respects the user's session from cookies
export async function getSupabaseServer() {
  const cookieStore = await cookies();
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: async (key: string) => {
          const cookie = cookieStore.get(key);
          return cookie?.value ?? null;
        },
        setItem: async (key: string, value: string) => {
          try {
            cookieStore.set(key, value);
          } catch {
            // Ignore errors from Server Components
          }
        },
        removeItem: async (key: string) => {
          try {
            cookieStore.delete(key);
          } catch {
            // Ignore errors from Server Components
          }
        },
      },
    },
  });
}

// Re-export Database type for convenience
export type { Database } from './database.types';
