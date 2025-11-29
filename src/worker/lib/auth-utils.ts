/**
 * Authentication utilities for token handling
 */

/**
 * Decode JWT token and extract userId
 * Note: This does basic decoding without verification (verification happens server-side in Supabase)
 */
export async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));

    // Supabase JWT tokens have 'sub' field containing the user ID
    return decoded.sub || null;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}
