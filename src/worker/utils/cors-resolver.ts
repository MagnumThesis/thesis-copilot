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

  // 🛡️ Sentinel: Returning a wildcard (*) with credentials: true is insecure.
  // We fall back to the first allowed origin instead of '*' to maintain security.
  if (!origin || allowedOrigins.includes(origin)) {
    return origin || allowedOrigins[0];
  }

  // Default fallback - returning a string is safer than returning true
  return allowedOrigins[0];
};
