/**
 * Authentication Handlers - HTTP handlers for auth endpoints
 */
import { Context } from 'hono';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  verifyToken,
  refreshSession,
  logoutUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  type RegisterPayload,
  type LoginPayload,
} from '../services/user-service';

/**
 * Register handler
 */
export async function registerHandler(c: Context) {
  try {
    const body = await c.req.json();

    const { email, password, fullName } = body as RegisterPayload;

    // Validation
    if (!email || !password || !fullName) {
      return c.json(
        { success: false, error: 'Missing required fields' },
        400
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json(
        { success: false, error: 'Invalid email format' },
        400
      );
    }

    // Password validation (minimum 8 characters)
    if (password.length < 8) {
      return c.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        400
      );
    }

    const result = await registerUser({ email, password, fullName });

    return c.json(result, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Registration failed' },
      400
    );
  }
}

/**
 * Login handler
 */
export async function loginHandler(c: Context) {
  try {
    const body = await c.req.json();

    const { email, password } = body as LoginPayload;

    // Validation
    if (!email || !password) {
      return c.json(
        { success: false, error: 'Email and password are required' },
        400
      );
    }

    const result = await loginUser({ email, password });

    return c.json(result, 200);
  } catch (error) {
    console.error('Login error:', error);
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Login failed' },
      401
    );
  }
}

/**
 * Get user profile handler
 */
export async function getUserProfileHandler(c: Context) {
  try {
    const userId = c.req.param('userId');

    if (!userId) {
      return c.json(
        { success: false, error: 'User ID is required' },
        400
      );
    }

    const result = await getUserProfile(userId);

    return c.json(result, 200);
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch profile' },
      404
    );
  }
}

/**
 * Update user profile handler
 */
export async function updateUserProfileHandler(c: Context) {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();

    if (!userId) {
      return c.json(
        { success: false, error: 'User ID is required' },
        400
      );
    }

    const result = await updateUserProfile(userId, body);

    return c.json(result, 200);
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' },
      400
    );
  }
}

/**
 * Verify token handler
 */
export async function verifyTokenHandler(c: Context) {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      return c.json(
        { success: false, error: 'Authorization header is required' },
        400
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const result = await verifyToken(token);

    return c.json(result, 200);
  } catch (error) {
    console.error('Verify token error:', error);
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Token verification failed' },
      401
    );
  }
}

/**
 * Refresh session handler
 */
export async function refreshSessionHandler(c: Context) {
  try {
    const body = await c.req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return c.json(
        { success: false, error: 'Refresh token is required' },
        400
      );
    }

    const result = await refreshSession(refreshToken);

    return c.json(result, 200);
  } catch (error) {
    console.error('Refresh session error:', error);
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Session refresh failed' },
      401
    );
  }
}

/**
 * Logout handler
 */
export async function logoutHandler(c: Context) {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      return c.json(
        { success: false, error: 'Authorization header is required' },
        400
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const result = await logoutUser(token);

    return c.json(result, 200);
  } catch (error) {
    console.error('Logout error:', error);
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Logout failed' },
      400
    );
  }
}

/**
 * Change password handler
 */
export async function changePasswordHandler(c: Context) {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    const { newPassword } = body;

    if (!userId || !newPassword) {
      return c.json(
        { success: false, error: 'User ID and new password are required' },
        400
      );
    }

    // Validate password
    if (newPassword.length < 8) {
      return c.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        400
      );
    }

    const result = await changePassword(userId, newPassword);

    return c.json(result, 200);
  } catch (error) {
    console.error('Change password error:', error);
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to change password' },
      400
    );
  }
}

/**
 * Request password reset handler
 */
export async function requestPasswordResetHandler(c: Context) {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json(
        { success: false, error: 'Email is required' },
        400
      );
    }

    const result = await requestPasswordReset(email);

    return c.json(result, 200);
  } catch (error) {
    console.error('Request password reset error:', error);
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to request password reset' },
      400
    );
  }
}

/**
 * Reset password handler
 */
export async function resetPasswordHandler(c: Context) {
  try {
    const authHeader = c.req.header('Authorization');
    const body = await c.req.json();
    const { newPassword } = body;

    if (!authHeader || !newPassword) {
      return c.json(
        { success: false, error: 'Authorization header and new password are required' },
        400
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const result = await resetPassword(token, newPassword);

    return c.json(result, 200);
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to reset password' },
      400
    );
  }
}
