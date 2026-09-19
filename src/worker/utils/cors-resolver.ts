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
  if (!origin) {
    return '*'; // Or consider returning null if you want to strictly block non-browser requests
  }

  // Only return the origin if it explicitly matches our allowed list.
  // Returning null properly drops the Access-Control-Allow-Origin header for disallowed origins.
  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  // Default fallback - return null to deny CORS when credentials: true
  return null;
};
