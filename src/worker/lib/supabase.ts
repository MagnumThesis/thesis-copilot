import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase_types'; // optional

export type SupabaseEnv = {
  SUPABASE_URL: string;
  SUPABASE_ANON: string;
};

export function getSupabase(env?: SupabaseEnv) {
  if (env?.SUPABASE_URL && env?.SUPABASE_ANON) {
    return createClient(env.SUPABASE_URL, env.SUPABASE_ANON);
  }

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON;

  if (!url || !key) {
    throw new Error("Missing Supabase credentials in env or import.meta.env");
  }

  return createClient<Database>(url, key);
}
