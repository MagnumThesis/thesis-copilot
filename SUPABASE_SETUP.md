# Supabase Setup Guide

## Overview
The authentication system requires a **Supabase Service Key** which is missing from your `.env` file. This guide explains how to get it.

## Step-by-Step Instructions

### 1. Go to Your Supabase Project
- Navigate to: https://app.supabase.com
- Select your project: **niysvscyvibdlhqbwwva**

### 2. Get Your Service Key (Service Role Key)
- Click on **Settings** (gear icon) in the left sidebar
- Click on **API** in the menu
- Look for the **API keys** section
- Copy the **Service Role Key** (it starts with `eyJ...` and is longer than the anon key)

> ⚠️ **IMPORTANT**: The Service Role Key is sensitive. Never commit it to version control or share it publicly. Only use it in your backend environment.

### 3. Update Your `.env` File
Replace the `SUPABASE_SERVICE_KEY` value with your actual service key:

```env
SUPABASE_URL=https://niysvscyvibdlhqbwwva.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY_HERE
```

### 4. Run the Database Migration
After setting up Supabase credentials:

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy the entire contents of `migrations/create_user_profiles.sql`
4. Paste it into the query editor
5. Click **Run** button

### 5. Test the Setup
Start your development server:
```bash
npm run dev
```

If successful, the server should start without the "supabaseUrl is required" error.

## Troubleshooting

### Error: "supabaseUrl is required"
- [ ] Check that `SUPABASE_URL` is set in `.env`
- [ ] Check that `SUPABASE_SERVICE_KEY` is set in `.env`
- [ ] Make sure you're using the **Service Role Key**, not the anonymous key
- [ ] Restart your dev server after updating `.env`

### Error: "user_profiles" table not found
- [ ] Run the SQL migration from `migrations/create_user_profiles.sql`
- [ ] Make sure the migration ran successfully with no errors

### Connection Issues
- [ ] Verify your Supabase project URL is correct
- [ ] Check that your service key hasn't expired
- [ ] Ensure your Supabase project is active (not paused)

## Environment Variables Reference

| Variable | Source | Purpose |
|----------|--------|---------|
| `SUPABASE_URL` | Supabase Settings > API | Backend & Frontend connection |
| `SUPABASE_ANON_KEY` | Supabase Settings > API | Frontend anonymous access |
| `SUPABASE_SERVICE_KEY` | Supabase Settings > API > Service Role | Backend admin operations |
| `FRONTEND_URL` | Your frontend URL | Password reset links |
| `VITE_API_URL` | Your backend URL | Frontend API calls |

## Security Notes

- **Never** share your Service Role Key
- **Never** commit `.env` to version control
- The `.env` file is in `.gitignore` - keep it that way
- Use different keys for development, staging, and production

## Next Steps

Once Supabase is configured:
1. Test registration at `http://localhost:5173/register`
2. Test login at `http://localhost:5173/login`
3. Access protected routes at `http://localhost:5173/app`

For more details, see `QUICK_START_AUTH.md` and `AUTHENTICATION_README.md`.
