import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase_types'; // optional

export type SupabaseEnv = {
  SUPABASE_URL?: string;
  SUPABASE_ANON?: string;
  SUPABASE_SERVICE_ROLE?: string;
};

export function getSupabase(env?: SupabaseEnv) {
  // Try to get environment variables from various sources
  const meta = (import.meta as any).env;
  
  // Get values with fallbacks
  const url = env?.SUPABASE_URL || 
              process.env.SUPABASE_URL || 
              meta.SUPABASE_URL || 
              meta.VITE_SUPABASE_URL;
              
  const serviceKey = env?.SUPABASE_SERVICE_ROLE || 
                     process.env.SUPABASE_SERVICE_ROLE || 
                     meta.SUPABASE_SERVICE_KEY;
                     
  const anonKey = env?.SUPABASE_ANON || 
                  process.env.SUPABASE_ANON || 
                  meta.VITE_SUPABASE_ANON || 
                  meta.SUPABASE_ANON;

  if (!url) {
    throw new Error('Missing Supabase URL in env');
  }

  // Use service role if available (server-side). This allows server handlers to bypass
  // RLS for administrative operations. Do NOT expose service role to the browser.
  if (serviceKey) {
    return createClient<Database>(url, serviceKey, { auth: { persistSession: false } });
  }

  if (!anonKey) {
    throw new Error('Missing Supabase anon key in env');
  }

  return createClient<Database>(url, anonKey, { auth: { persistSession: false } });
}
