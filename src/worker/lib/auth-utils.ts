import jwt from 'jsonwebtoken';

/**
 * Authentication utilities for token handling
 */

export interface AuthUser {
  userId: string;
  email: string;
}

/**
 * Verify JWT token and extract userId securely
 */
export async function getUserIdFromToken(token: string, secret: string): Promise<string | null> {
  const user = await getAuthUserFromToken(token, secret);
  return user ? user.userId : null;
}

/**
 * Verify JWT token and extract user details securely
 */
export async function getAuthUserFromToken(token: string, secret: string): Promise<AuthUser | null> {
  if (!secret) {
    console.error('Missing JWT secret for verification');
    return null;
  }

  try {
    // Verify token using the provided secret
    // Supabase JWTs use HS256 algorithm by default
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

    // Supabase JWT tokens have 'sub' field containing the user ID
    // and 'email' field containing the user's email
    if (decoded.sub) {
      return {
        userId: decoded.sub,
        email: decoded.email || '',
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to verify token:', error);
    return null;
  }
}
