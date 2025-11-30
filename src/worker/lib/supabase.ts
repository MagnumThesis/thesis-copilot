import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase_types'; // optional

export type SupabaseEnv = {
  SUPABASE_URL?: string;
  SUPABASE_ANON?: string;
  SUPABASE_SERVICE_ROLE?: string;
};

export function getSupabase(env?: SupabaseEnv) {
  // Prefer service role key when running in a server environment (worker bindings)
  const url = env?.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const serviceKey = env?.SUPABASE_SERVICE_ROLE;
  const anonKey = env?.SUPABASE_ANON || import.meta.env.VITE_SUPABASE_ANON;

  if (!url) {
    throw new Error('Missing Supabase URL in env or import.meta.env');
  }

  // Use service role if available (server-side). This allows server handlers to bypass
  // RLS for administrative operations. Do NOT expose service role to the browser.
  if (serviceKey) {
    return createClient<Database>(url, serviceKey, { auth: { persistSession: false } });
  }

  if (!anonKey) {
    throw new Error('Missing Supabase anon key in env or import.meta.env');
  }

  return createClient<Database>(url, anonKey, { auth: { persistSession: false } });
}
