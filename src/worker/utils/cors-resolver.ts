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

  // 🛡️ Sentinel: Prevent returning '*' with 'credentials: true' which allows cross-origin
  // requests with credentials from any site.
  // Allow requests if the origin is in our allowed list
  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  // If no origin is provided (like curl or mobile apps), we can return the first allowed origin
  // instead of '*' to prevent a wildcard with credentials: true.
  if (!origin) {
    return allowedOrigins[0];
  }

  // Default fallback - returning a string is safer than returning true
  return allowedOrigins[0];
};
