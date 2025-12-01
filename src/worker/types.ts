// src/worker/types.ts
// Enhanced Context type for route handlers with query and params support

import type { Env } from './types/env';
import type { SupabaseEnv } from './lib/supabase';

export interface Context {
  request: {
    body: any;
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    params?: Record<string, string>;
    // ...other request properties as needed
  };
  env?: Env & SupabaseEnv;
  status?: (code: number) => void;
  // ...other context properties as needed
}
