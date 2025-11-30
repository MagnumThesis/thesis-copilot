import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState, useRef } from 'react';
import {
  MainSkeleton,
  LandingPageSkeleton,
  LoginPageSkeleton,
} from '@/components/ui/shadcn/skeletons';

/**
 * ProtectedRoute - Wraps routes that require authentication
 */
export function ProtectedRoute({
  children,
  skeleton,
}: {
  children: React.ReactNode;
  skeleton?: React.ReactNode;
}) {
  const { user, loadAuthState } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Load auth state from localStorage on mount
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadAuthState();
      // loadAuthState reads from localStorage synchronously, so we can stop loading immediately
      setIsLoading(false);
    }
  }, [loadAuthState]);

  // While loading, show nothing or a spinner
  if (isLoading) {
    return <>{skeleton ?? <MainSkeleton />}</>;
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
export function PublicRoute({
  children,
  skeleton,
}: {
  children: React.ReactNode;
  skeleton?: React.ReactNode;
}) {
  const { user, loadAuthState } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadAuthState();
      setIsLoading(false);
    }
  }, [loadAuthState]);

  // While loading, show nothing
  if (isLoading) {
    if (skeleton) return <>{skeleton}</>;
    // Show different skeletons depending on the public path so navigation feels immediate
    const path = location.pathname || '';
    if (path.startsWith('/login') || path.startsWith('/register')) {
      return <LoginPageSkeleton />;
    }
    return <LandingPageSkeleton />;
  }

  // If user is logged in, redirect to app
  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
