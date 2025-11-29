# Backend Authentication Setup Guide

This guide will help you set up the authentication backend for the Thesis Copilot application.

## Overview

The authentication system includes:
- **User Registration** - Create new user accounts
- **Login** - Authenticate users with email and password
- **Token Management** - Handle JWT tokens and session refresh
- **Password Reset** - Request and reset passwords
- **User Profiles** - Manage user information

## Prerequisites

- Node.js 16+ and npm
- Supabase account (https://supabase.com)
- Cloudflare Workers account (for deployment)

## Step 1: Set Up Supabase

### 1.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in/sign up
2. Click "New project"
3. Enter project name (e.g., "thesis-copilot")
4. Set a database password
5. Select your region
6. Click "Create new project"

### 1.2 Get Your Supabase Credentials

Once your project is created:

1. Go to Settings → API
2. Copy the following and save them:
   - **Project URL** - Save as `SUPABASE_URL`
   - **Anon key** - Save as `SUPABASE_ANON_KEY`
3. Go to Settings → Database
4. Copy the connection string and extract the password for the service role
5. Create a service role key:
   - Go to Settings → API
   - Scroll to "Service Role Key"
   - Copy the key - Save as `SUPABASE_SERVICE_KEY`

### 1.3 Set Up Database Tables

1. In your Supabase project, go to SQL Editor
2. Click "New query"
3. Copy and paste the contents of `migrations/create_user_profiles.sql`
4. Click "Run"
5. Verify all tables and policies were created successfully

## Step 2: Configure Environment Variables

### 2.1 Create `.env` File

Copy `example.env` to `.env` and fill in the values:

```bash
cp example.env .env
```

### 2.2 Add Supabase Credentials

Update `.env` with your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Frontend Configuration
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:8787/api
```

### 2.3 Optional: Add AI Provider Keys

If using OpenAI or Google Generative AI:

```env
OPENAI_API_KEY=your-openai-key
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key
```

## Step 3: Run Development Server

### 3.1 Install Dependencies

```bash
npm install
```

### 3.2 Start Development Server

```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8787

### 3.3 Test the API

You can test the auth endpoints using curl or Postman:

```bash
# Register a new user
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123",
    "fullName": "John Doe"
  }'

# Login
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

## Step 4: Test Frontend

### 4.1 Navigate to the App

1. Open http://localhost:5173 in your browser
2. You should see the public landing page
3. Click "Sign Up" to access the registration page
4. Fill in the form and submit
5. After successful registration, you'll be redirected to login
6. Log in with your credentials
7. You should be redirected to the main app

## API Endpoints

### Public Endpoints (No Authentication Required)

```
POST   /api/auth/register          - Register a new user
POST   /api/auth/login             - Login user
POST   /api/auth/refresh           - Refresh session token
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password with token
```

### Protected Endpoints (Authentication Required)

```
POST   /api/auth/verify            - Verify JWT token
GET    /api/auth/profile/:userId   - Get user profile
PUT    /api/auth/profile/:userId   - Update user profile
POST   /api/auth/change-password/:userId - Change password
POST   /api/auth/logout            - Logout user
```

## Common Issues & Solutions

### Issue: "Cannot connect to Supabase"

**Solution**: 
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Check that your Supabase project is running
- Ensure you're using the service key (not the anon key) for backend operations

### Issue: "User registration fails"

**Solution**:
- Verify the database tables were created (run the SQL migration again)
- Check that RLS policies are enabled correctly
- Check browser console for detailed error messages

### Issue: "CORS errors when making API calls"

**Solution**:
- Verify CORS middleware is properly configured in `src/worker/index.ts`
- Ensure `http://localhost:5173` is in the allowed origins list
- Check that requests include proper `Content-Type` headers

### Issue: "Token verification fails"

**Solution**:
- Verify the JWT token format is correct
- Check that the token hasn't expired
- Ensure you're using the correct authorization header format: `Bearer <token>`

## Deployment to Production

### 1. Set Up Environment on Cloudflare Workers

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Authenticate with Cloudflare:
```bash
wrangler login
```

3. Update `wrangler.json` with your account details

4. Set production environment variables:
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put FRONTEND_URL
```

### 2. Deploy Backend

```bash
npm run build
npm run deploy
```

### 3. Update Frontend Configuration

Update `.env.production` with your production API URL:

```env
VITE_API_URL=https://your-worker-url.workers.dev/api
FRONTEND_URL=https://your-frontend-domain.com
```

### 4. Deploy Frontend

```bash
npm run build
# Deploy to your hosting provider (Vercel, Netlify, etc.)
```

## Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use environment variables** for all sensitive data
3. **Enable HTTPS** in production
4. **Implement rate limiting** on auth endpoints
5. **Use strong password requirements** (minimum 8 characters)
6. **Regularly rotate secrets** and API keys
7. **Monitor authentication logs** for suspicious activity
8. **Use RLS policies** to protect database data

## Additional Resources

- [Supabase Authentication Docs](https://supabase.com/docs/guides/auth)
- [Hono Framework Docs](https://hono.dev/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [React Router Docs](https://reactrouter.com/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase logs in the dashboard
3. Check browser console for error messages
4. Review server logs in the terminal
