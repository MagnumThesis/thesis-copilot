-- ============================================
-- Fix privacy_settings table unique constraint
-- Run this in Supabase SQL Editor
-- ============================================

-- Add unique constraint on user_id and conversation_id
-- This allows upsert operations to work properly
DO $$ 
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'privacy_settings_user_conversation_key'
    ) THEN
        -- Add the unique constraint
        ALTER TABLE public.privacy_settings 
        ADD CONSTRAINT privacy_settings_user_conversation_key 
        UNIQUE (user_id, conversation_id);
        
        RAISE NOTICE 'Added unique constraint on user_id and conversation_id';
    ELSE
        RAISE NOTICE 'Constraint already exists';
    END IF;
END $$;

-- Verify the constraint was added
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.privacy_settings'::regclass
ORDER BY conname;
