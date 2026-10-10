import { Context } from 'hono';

export const corsOriginResolver = (origin: string, c: Context) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'https://localhost:5173',
    'http://localhost:4173',
    'https://localhost:4173',
  ];

  const envFrontendUrl = (c.env as any)?.FRONTEND_URL || (import.meta as any).env?.FRONTEND_URL || (import.meta as any).env?.VITE_FRONTEND_URL;
  if (envFrontendUrl) {
    allowedOrigins.push(envFrontendUrl);
  }

  // 🛡️ Sentinel: Returning '*' with credentials: true is a critical security risk.
  // Instead, allow requests with no origin by returning undefined (or a specific allowed origin)
  // so Hono omits the ACAO header or sets it securely.
  if (!origin) {
    return undefined as any;
  }

  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  // Default fallback - reject disallowed origins securely
  return undefined as any;
};
