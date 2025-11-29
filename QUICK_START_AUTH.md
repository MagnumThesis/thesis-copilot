# Quick Start Guide - Authentication

Get your Thesis Copilot authentication system running in 10 minutes!

## Prerequisites

- Node.js 16+
- Supabase account (free tier available)
- Git

## Step 1: Create Supabase Project (2 minutes)

1. Go to https://supabase.com and sign up
2. Create a new project
3. Once ready, go to **Settings → API**
4. Copy and save:
   - **Project URL** → Save as `SUPABASE_URL`
   - **Anon Key** → Save as `SUPABASE_ANON_KEY`
5. Scroll to **Service Role Key** and copy it → Save as `SUPABASE_SERVICE_KEY`

## Step 2: Set Up Database (2 minutes)

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Open `migrations/create_user_profiles.sql` from your project
4. Copy the entire content
5. Paste into Supabase SQL Editor
6. Click **Run**
7. Wait for "Success!" message

## Step 3: Configure Environment (1 minute)

1. In your project, copy `example.env` to `.env`:
   ```bash
   cp example.env .env
   ```

2. Open `.env` and fill in:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   FRONTEND_URL=http://localhost:5173
   VITE_API_URL=http://localhost:8787/api
   ```

## Step 4: Install & Run (3 minutes)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. You should see:
   ```
   Frontend: http://localhost:5173
   Backend: http://localhost:8787
   ```

## Step 5: Test (2 minutes)

1. Open http://localhost:5173 in your browser
2. Click **"Sign Up"**
3. Fill in the form:
   - Full Name: Your name
   - Email: test@example.com
   - Password: TestPassword123
   - Check "I agree to Terms"
4. Click **"Create Account"**
5. You'll see "Account Created!" message
6. Redirected to login page
7. Log in with your email and password
8. Redirected to the main app! ✅

## Common Issues

### "Cannot connect to Supabase"
- Double-check your `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Verify you're copy/pasting the entire keys (no spaces)

### "Email validation failed"
- Check `.env` - sometimes there are typos
- Restart dev server after changing `.env`: `Ctrl+C` then `npm run dev`

### "Database table doesn't exist"
- Go back to Step 2 and verify SQL migration ran successfully
- Check Supabase SQL Editor → You should see `user_profiles` table

### "CORS error"
- Make sure you're using `http://localhost:5173` (not 3000)
- Backend should be running at `http://localhost:8787`

## Next Steps

1. **Read full documentation**: `docs/authentication-setup.md`
2. **Explore API**: `docs/authentication-api.md`
3. **Deploy to production**: Follow deployment guide in setup docs
4. **Implement additional features**: OAuth, 2FA, etc.

## Useful Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Workers
npm run deploy

# Run tests
npm test

# Check for errors
npm run check
```

## File Locations

- **Frontend Auth Hook**: `src/hooks/useAuth.ts`
- **Backend Auth Service**: `src/worker/services/user-service.ts`
- **Auth Endpoints**: `src/worker/routes/auth-routes.ts`
- **Database Migration**: `migrations/create_user_profiles.sql`
- **Full Setup Guide**: `docs/authentication-setup.md`
- **API Reference**: `docs/authentication-api.md`

## What's Included

✅ User Registration with email/password
✅ User Login with session tokens
✅ Protected routes (auto-redirect)
✅ Token refresh mechanism
✅ Password reset flow
✅ User profile management
✅ Error handling and validation
✅ TypeScript support
✅ Complete documentation

## Need Help?

1. Check `docs/authentication-setup.md` - Full troubleshooting section
2. Review browser console for error messages
3. Check server logs in terminal
4. See `docs/authentication-api.md` for endpoint details

---

**You're all set!** Your authentication system is ready to use. 🎉
