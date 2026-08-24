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

  // If the origin is in our allowed list, return it
  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }

  // If there is no origin (like mobile apps or curl requests), allow it
  // but do not use '*' when credentials might be used.
  // In Hono, returning null denies the CORS request, returning a string allows it for that origin.
  if (!origin) {
    return allowedOrigins[0]; // Safer fallback for no-origin requests than '*'
  }

  // Deny other origins by returning null
  return null;
};
