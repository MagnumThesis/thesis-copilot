import { Context } from 'hono';
import { SupabaseEnv } from './supabase';
import { Env } from '../types/env';

export function onError(c: Context<{ Bindings: Env & SupabaseEnv; }>, err: any) {
    return c.json(
        { error: 'An error occurred while processing your request.', details: err.message || String(err) },
        500
    );
}