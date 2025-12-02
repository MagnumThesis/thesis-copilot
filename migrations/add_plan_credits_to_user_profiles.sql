-- Migration: Add plan and credits columns to user_profiles
-- Run in Supabase SQL Editor

/* Add plan and credits columns to user_profiles */
ALTER TABLE IF EXISTS public.user_profiles
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Free',
  ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE;

/* Create index for faster lookups by plan */
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON public.user_profiles(plan);

/* Update any existing users to have Free plan and 0 credits if not set */
UPDATE public.user_profiles
SET plan = 'Free', credits = 0
WHERE plan IS NULL;

/* Add comment for documentation */
COMMENT ON COLUMN public.user_profiles.plan IS 'Subscription plan: Free, Pro, etc.';
COMMENT ON COLUMN public.user_profiles.credits IS 'Remaining usage credits';
COMMENT ON COLUMN public.user_profiles.next_billing_date IS 'Next billing date for subscription';
