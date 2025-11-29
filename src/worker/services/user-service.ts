/**
 * User Service - Handles user registration, login, and profile management
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy load Supabase client
let supabase: SupabaseClient | null = null;

function getSupabaseClient(env?: Record<string, string>) {
  if (!supabase) {
    // Try to get environment variables from various sources
    const meta = (import.meta as any).env;
    
    // Log all available env vars for debugging
    const allEnvKeys = Object.keys(meta).filter(k => k.includes('SUPABASE'));
    console.log('[Supabase Init] Available env keys:', allEnvKeys);
    console.log('[Supabase Init] meta.SUPABASE_SERVICE_KEY:', meta.SUPABASE_SERVICE_KEY ? 'present' : 'missing');
    console.log('[Supabase Init] process.env.SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'present' : 'missing');
    
    // Get values with fallbacks
    const url = env?.SUPABASE_URL || 
                process.env.SUPABASE_URL || 
                meta.SUPABASE_URL || 
                meta.VITE_SUPABASE_URL;
                
    const key = env?.SUPABASE_SERVICE_KEY || 
                process.env.SUPABASE_SERVICE_KEY || 
                meta.SUPABASE_SERVICE_KEY;
    
    console.log('[Supabase Init] URL found:', !!url, 'Key found:', !!key);
    
    if (!url || !key) {
      throw new Error(
        `Missing Supabase configuration. URL: ${url ? '✓' : '✗'}, Key: ${key ? '✓' : '✗'}. Check your .env file has SUPABASE_URL and SUPABASE_SERVICE_KEY.`
      );
    }
    
    console.log('[Supabase Init] Creating client with URL:', url.substring(0, 30) + '...');
    supabase = createClient(url, key);
  }
  return supabase;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Register a new user
 */
export async function registerUser(payload: RegisterPayload) {
  try {
    const client = getSupabaseClient();
    
    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await client.auth.signUp({
      email: payload.email,
      password: payload.password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Update the auto-created profile with the full name
    const { data: profileData, error: profileError } = await client
      .from('user_profiles')
      .update({
        full_name: payload.fullName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (profileError) {
      throw new Error(profileError.message);
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: payload.fullName,
      },
      message: 'Registration successful. Please check your email for confirmation.',
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Registration failed');
  }
}

/**
 * Login user and return session
 */
export async function loginUser(payload: LoginPayload) {
  try {
    const client = getSupabaseClient();
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.session) {
      throw new Error('Login failed: No session created');
    }

    // Fetch user profile
    const { data: profileData, error: profileError } = await client
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: profileData.full_name,
      },
      session: {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresIn: authData.session.expires_in,
        expiresAt: authData.session.expires_at,
      },
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Login failed');
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      user: {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch user profile');
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('user_profiles')
      .update({
        full_name: updates.fullName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      user: {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to update user profile');
  }
}

/**
 * Verify token and get user session
 */
export async function verifyToken(token: string) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.getUser(token);

    if (error || !data.user) {
      throw new Error('Invalid or expired token');
    }

    // Fetch user profile
    const { data: profileData, error: profileError } = await client
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: profileData.full_name,
      },
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Token verification failed');
  }
}

/**
 * Refresh user session
 */
export async function refreshSession(refreshToken: string) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new Error('Failed to refresh session');
    }

    return {
      success: true,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
        expiresAt: data.session.expires_at,
      },
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Session refresh failed');
  }
}

/**
 * Logout user
 */
export async function logoutUser(accessToken: string) {
  try {
    const client = getSupabaseClient();
    const { error } = await client.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: 'Logout successful',
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Logout failed');
  }
}

/**
 * Change user password
 */
export async function changePassword(userId: string, newPassword: string) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: 'Password changed successfully',
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to change password');
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string) {
  try {
    const client = getSupabaseClient();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: 'Password reset email sent',
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to request password reset');
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(accessToken: string, newPassword: string) {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      message: 'Password reset successfully',
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to reset password');
  }
}
