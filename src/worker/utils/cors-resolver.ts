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

  // 🛡️ Sentinel: Returning '*' with credentials: true is a critical vulnerability.
  // We return a specific allowed origin (or undefined if no origin) to prevent CSRF and data theft.
  // Allow requests with no origin (like mobile apps or curl requests)
  // or if the origin is in our allowed list
  if (!origin) {
    return undefined as any;
  }

  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  // Default fallback - returning a string is safer than returning true
  return allowedOrigins[0];
};
