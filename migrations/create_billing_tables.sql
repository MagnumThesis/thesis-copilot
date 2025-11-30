-- Migration: create billing tables and add stripe columns
-- Run in Supabase SQL Editor or via migration tooling

/* Add Stripe-related columns to user_profiles */
ALTER TABLE IF EXISTS public.user_profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

/* Create a simple table to track customers */
CREATE TABLE IF NOT EXISTS public.billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id TEXT UNIQUE,
  email TEXT,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* Create a table to track subscriptions */
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_status TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* Indexes for faster lookups */
CREATE INDEX IF NOT EXISTS idx_billing_customers_stripe_customer_id ON public.billing_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_stripe_subscription_id ON public.billing_subscriptions(stripe_subscription_id);
