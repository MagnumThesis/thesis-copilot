# Supabase CORS Configuration for Local Development

## Issue
When the backend tries to communicate with Supabase, it needs CORS headers to be properly configured.

## Solution: Configure Supabase JWT Secret

Your backend is using the `SUPABASE_SERVICE_KEY` which should NOT need CORS because it's server-to-server communication. However, if you're still getting CORS errors, it means:

### Option 1: Verify Your Supabase Service Key is Valid
1. Go to https://app.supabase.com
2. Select your project: **niysvscyvibdlhqbwwva**
3. Click **Settings** → **API**
4. Copy your **Service Role Key** (the long one starting with `eyJ...`)
5. Make sure it's in your `.env` file as `SUPABASE_SERVICE_KEY`

### Option 2: Check Supabase Project Settings
1. Go to **Settings** → **API**
2. Look for **JWT Configuration** or **CORS** settings
3. Ensure localhost is allowed (usually it is by default)

### Option 3: Add Allowed Origins in Supabase
If CORS is still blocked:
1. Go to **Settings** → **API**
2. Look for "CORS Allowed Origins" or similar
3. Add these origins:
   ```
   http://localhost:5173
   http://localhost:8787
   http://127.0.0.1:5173
   http://127.0.0.1:8787
   ```

## Verify Configuration
Once configured, your `.env` should have:
```
SUPABASE_URL=https://niysvscyvibdlhqbwwva.supabase.co
SUPABASE_SERVICE_KEY=eyJ... (your actual service key)
```

## Test
Try registering again. If it still fails with CORS, the error message in the browser console will give you more details about which origin is being blocked.
