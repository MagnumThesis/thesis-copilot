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

  // If origin is in our allowed list, return it
  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }

  // Do not return a wildcard '*' because we use credentials: true,
  // which creates a security vulnerability when paired together.
  // Default fallback - returning a safe string is required
  return allowedOrigins[0];
};
