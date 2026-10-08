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

  // Allow requests with no origin (like mobile apps or curl requests)
  // or if the origin is in our allowed list
  if (!origin) {
    // 🛡️ Sentinel: Returning undefined instead of '*' when origin is missing
    // to prevent combining a wildcard origin with credentials, which is a critical security vulnerability.
    return undefined;
  }

  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  // Default fallback - returning undefined is safer than returning the first allowed origin
  // for an unrecognized origin, as it blocks the request.
  return undefined;
};
