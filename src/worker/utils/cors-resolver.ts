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

  // Allow requests if the origin is in our allowed list
  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }

  // Explicitly return null for disallowed origins to omit the ACAO header
  // Avoid returning '*' or fallback origins when credentials are true
  return null;
};
