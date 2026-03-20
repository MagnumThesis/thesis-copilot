import { Context } from 'hono';

export function getCorsOrigin(origin: string, c: Context): string {
    // Return allowed origins only
    const allowedOrigins = [
      'http://localhost:5173',
      'https://localhost:5173',
      'http://localhost:3000',
      'https://localhost:3000'
    ];
    // Allow production frontend URL if defined in env
    const prodUrl = c.env?.FRONTEND_URL || (import.meta as any).env?.VITE_FRONTEND_URL;
    if (prodUrl && origin === prodUrl) return origin;

    // Allow localhost for development
    if (allowedOrigins.includes(origin)) return origin;

    // Strict fallback for unauthorized origins to avoid issues with credentials: true
    return prodUrl || allowedOrigins[0];
}
