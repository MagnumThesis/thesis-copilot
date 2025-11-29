/**
 * Auth Routes - Define all authentication endpoints
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  registerHandler,
  loginHandler,
  getUserProfileHandler,
  updateUserProfileHandler,
  verifyTokenHandler,
  refreshSessionHandler,
  logoutHandler,
  changePasswordHandler,
  requestPasswordResetHandler,
  resetPasswordHandler,
} from '../handlers/auth';

const authApi = new Hono();

// Apply CORS to all auth routes with explicit OPTIONS handling
authApi.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposeHeaders: ['Content-Length', 'X-JSON-Response-Size'],
  maxAge: 600
}));

// Register endpoint
authApi.post('/register', registerHandler);
authApi.options('/register', (c) => new Response(null, { status: 204 }));

// Login endpoint
authApi.post('/login', loginHandler);
authApi.options('/login', (c) => new Response(null, { status: 204 }));

// Refresh session endpoint
authApi.post('/refresh', refreshSessionHandler);
authApi.options('/refresh', (c) => new Response(null, { status: 204 }));

// Request password reset
authApi.post('/forgot-password', requestPasswordResetHandler);
authApi.options('/forgot-password', (c) => new Response(null, { status: 204 }));

// Reset password with token
authApi.post('/reset-password', resetPasswordHandler);
authApi.options('/reset-password', (c) => new Response(null, { status: 204 }));

/**
 * Protected routes (authentication required)
 */

// Verify token
authApi.post('/verify', verifyTokenHandler);
authApi.options('/verify', (c) => new Response(null, { status: 204 }));

// Get user profile
authApi.get('/profile/:userId', getUserProfileHandler);
authApi.options('/profile/:userId', (c) => new Response(null, { status: 204 }));

// Update user profile
authApi.put('/profile/:userId', updateUserProfileHandler);
authApi.options('/profile/:userId', (c) => new Response(null, { status: 204 }));

// Change password
authApi.post('/change-password/:userId', changePasswordHandler);
authApi.options('/change-password/:userId', (c) => new Response(null, { status: 204 }));

// Logout
authApi.post('/logout', logoutHandler);
authApi.options('/logout', (c) => new Response(null, { status: 204 }));

export default authApi;
