import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState, useRef } from 'react';

/**
 * ProtectedRoute - Wraps routes that require authentication
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loadAuthState } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Load auth state from localStorage on mount
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadAuthState();
      // Give React time to process the state update
      setTimeout(() => setIsLoading(false), 50);
    }
  }, [loadAuthState]);

  // While loading, show nothing or a spinner
  if (isLoading) {
    return null;
  }

  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * PublicRoute - Redirects authenticated users away from public pages
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loadAuthState } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadAuthState();
      setTimeout(() => setIsLoading(false), 50);
    }
  }, [loadAuthState]);

  // While loading, show nothing
  if (isLoading) {
    return null;
  }

  // If user is logged in, redirect to app
  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
