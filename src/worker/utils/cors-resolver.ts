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
  // 🛡️ Sentinel: Never return '*' for credentials-enabled CORS endpoints
  if (!origin || allowedOrigins.includes(origin)) {
    return origin || allowedOrigins[0];
  }

  // Default fallback - returning a string is safer than returning true
  return allowedOrigins[0];
};
