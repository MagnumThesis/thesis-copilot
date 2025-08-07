import { Context } from 'hono';
import { Env } from '../types/env';
import { SupabaseEnv } from './supabase';

export function getGoogleGenerativeAIKey(c: Context<{ Bindings: Env & SupabaseEnv }>): string | undefined {
    const keylocal = import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY;
    const keywrangler = c.env.GOOGLE_GENERATIVE_AI_API_KEY;

    return keywrangler || keylocal;
}