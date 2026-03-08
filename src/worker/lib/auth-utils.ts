import jwt from 'jsonwebtoken';

/**
 * Authentication utilities for token handling
 */

/**
 * Verify JWT token and extract userId securely
 */
export async function getUserIdFromToken(token: string, secret: string): Promise<string | null> {
  if (!secret) {
    console.error('Missing JWT secret for verification');
    return null;
  }

  try {
    // Verify token using the provided secret
    // Supabase JWTs use HS256 algorithm by default
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

    // Supabase JWT tokens have 'sub' field containing the user ID
    return decoded.sub || null;
  } catch (error) {
    console.error('Failed to verify token:', error);
    return null;
  }
}
