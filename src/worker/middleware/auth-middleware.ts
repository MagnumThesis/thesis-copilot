/**
 * Authentication Middleware - Validates JWT tokens and attaches user context
 */
import { Context, Next } from 'hono';
import { getAuthUserFromToken } from '../lib/auth-utils';

export interface AuthContext {
  userId: string;
  email: string;
  token: string;
}

/**
 * Common logic for token extraction and verification
 */
async function verifyAndSetAuthContext(c: Context): Promise<boolean> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');
  if (!token) return false;

  const secret = c.env?.SUPABASE_JWT_SECRET;
  if (!secret) {
    console.error('SUPABASE_JWT_SECRET is not configured');
    return false;
  }

  const user = await getAuthUserFromToken(token, secret);
  if (!user) return false;

  c.set('authContext', {
    userId: user.userId,
    email: user.email,
    token,
  });

  return true;
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
    const success = await verifyAndSetAuthContext(c);

    if (!success) {
      // If header is present but invalid, reject
      return c.json({ success: false, error: 'Invalid authentication token' }, 401);
    }

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
    const success = await verifyAndSetAuthContext(c);

    if (!success) {
      return c.json({ success: false, error: 'Invalid authentication token' }, 401);
    }

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
