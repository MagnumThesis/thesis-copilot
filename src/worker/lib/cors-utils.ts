import { Context } from 'hono';

export const resolveCorsOrigin = (origin: string | undefined, c: Context) => {
  // Determine allowed origins based on environment using worker-safe variables
  const env = c?.env as Record<string, any>;
  const metaEnv = (import.meta as any).env || {};

  const frontendUrl = env?.FRONTEND_URL || metaEnv?.VITE_FRONTEND_URL || metaEnv?.FRONTEND_URL || 'http://localhost:5173';

  // Check if the incoming origin is our frontend URL or a local development URL
  if (origin === frontendUrl || origin?.startsWith('http://localhost:') || origin?.startsWith('https://localhost:')) {
    return origin;
  }

  // Fallback for requests without origin (like same-origin requests or Postman)
  if (!origin) return frontendUrl;

  // Default to strict environment frontend URL if origin not in allowed list
  return frontendUrl;
};
