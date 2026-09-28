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

  // 🛡️ Sentinel: Returning '*' with credentials: true is a security vulnerability.
  // We only return the specific requested origin if it's in the allowed list.
  // For requests with no origin (e.g. mobile/curl) we return the primary allowed origin
  // instead of a wildcard.
  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }

  // Default fallback for no origin or disallowed origin
  return allowedOrigins[0];
};
