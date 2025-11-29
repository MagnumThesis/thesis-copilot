import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8787/api';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing authentication
 */
export function useAuth() {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: false,
    error: null,
  });

  /**
   * Load auth state from localStorage
   */
  const loadAuthState = useCallback(() => {
    try {
      const stored = localStorage.getItem('authState');
      if (stored) {
        const state = JSON.parse(stored);
        setAuthState(state);
        return state;
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    }
    return null;
  }, []);

  /**
   * Save auth state to localStorage
   */
  const saveAuthState = useCallback((state: AuthState) => {
    try {
      localStorage.setItem('authState', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
        }));

        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    []
  );

  /**
   * Login user
   */
  const login = useCallback(
    async (email: string, password: string) => {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        const newState: AuthState = {
          user: data.user,
          session: data.session,
          isLoading: false,
          error: null,
        };

        setAuthState(newState);
        saveAuthState(newState);

        // Navigate to app
        navigate('/app');

        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [navigate, saveAuthState]
  );

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const token = authState.session?.accessToken;

      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      const newState: AuthState = {
        user: null,
        session: null,
        isLoading: false,
        error: null,
      };

      setAuthState(newState);
      localStorage.removeItem('authState');

      navigate('/');

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [authState.session?.accessToken, navigate]);

  /**
   * Verify token
   */
  const verifyToken = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token verification failed');
      }

      return data;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }, []);

  /**
   * Refresh session
   */
  const refreshSessionToken = useCallback(async () => {
    if (!authState.session?.refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: authState.session.refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Session refresh failed');
      }

      const newState: AuthState = {
        ...authState,
        session: data.session,
      };

      setAuthState(newState);
      saveAuthState(newState);

      return data;
    } catch (error) {
      console.error('Session refresh error:', error);
      return null;
    }
  }, [authState, saveAuthState]);

  /**
   * Request password reset
   */
  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset request failed');
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset request failed';
      setAuthState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Reset password
   */
  const resetUserPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setAuthState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  return {
    ...authState,
    register,
    login,
    logout,
    verifyToken,
    refreshSessionToken,
    requestPasswordReset,
    resetUserPassword,
    loadAuthState,
    saveAuthState,
  };
}
