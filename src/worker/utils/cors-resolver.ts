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

  // Deny the request by explicitly returning null for disallowed or missing origins.
  // Returning null omits the Access-Control-Allow-Origin header.
  return null;
};
