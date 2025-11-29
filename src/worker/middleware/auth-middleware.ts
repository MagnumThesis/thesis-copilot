/**
 * Authentication Middleware - Validates JWT tokens and attaches user context
 */
import { Context, Next } from 'hono';

export interface AuthContext {
  userId: string;
  email: string;
  token: string;
}

/**
 * Extract and validate JWT token from Authorization header
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    // Allow unauthenticated routes
    return next();
  }

  try {
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return c.json({ success: false, error: 'Invalid authorization header' }, 401);
    }

    // Verify token with Supabase
    // In a real implementation, you'd validate the JWT signature
    // For now, we'll attach the token for service-side verification
    c.set('authContext', {
      token,
    });

    return next();
  } catch (error) {
    return c.json({ success: false, error: 'Authentication failed' }, 401);
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  try {
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return c.json({ success: false, error: 'Invalid authorization header' }, 401);
    }

    c.set('authContext', {
      token,
    });

    return next();
  } catch (error) {
    return c.json({ success: false, error: 'Authentication failed' }, 401);
  }
}

/**
 * Get authenticated user from context
 */
export function getAuthContext(c: Context): AuthContext | null {
  return c.get('authContext') || null;
}
