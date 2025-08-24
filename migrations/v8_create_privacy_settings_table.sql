-- Migration v8: Create privacy settings table for AI Reference Searcher
-- This migration adds privacy controls and data management features

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create privacy settings table for user consent and data retention preferences
CREATE TABLE privacy_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  conversation_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  data_retention_days INTEGER NOT NULL DEFAULT 365 CHECK (data_retention_days > 0),
  auto_delete_enabled BOOLEAN NOT NULL DEFAULT false,
  analytics_enabled BOOLEAN NOT NULL DEFAULT true,
  learning_enabled BOOLEAN NOT NULL DEFAULT true,
  export_format TEXT NOT NULL DEFAULT 'json' CHECK (export_format IN ('json', 'csv')),
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint for user_id and conversation_id combination
-- This allows one setting per user globally, or per user per conversation
CREATE UNIQUE INDEX idx_privacy_settings_user_conversation 
ON privacy_settings (user_id, COALESCE(conversation_id::text, 'global'));

-- Create indexes for performance
CREATE INDEX idx_privacy_settings_user_id ON privacy_settings(user_id);
CREATE INDEX idx_privacy_settings_conversation_id ON privacy_settings(conversation_id);
CREATE INDEX idx_privacy_settings_auto_delete ON privacy_settings(auto_delete_enabled);
CREATE INDEX idx_privacy_settings_consent ON privacy_settings(consent_given);
CREATE INDEX idx_privacy_settings_last_updated ON privacy_settings(last_updated);

-- Create function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_privacy_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last_updated
CREATE TRIGGER update_privacy_settings_last_updated 
    BEFORE UPDATE ON privacy_settings 
    FOR EACH ROW EXECUTE FUNCTION update_privacy_settings_updated_at();

-- Add constraints
ALTER TABLE privacy_settings ADD CONSTRAINT check_retention_days_positive 
    CHECK (data_retention_days > 0 AND data_retention_days <= 3650); -- Max 10 years

ALTER TABLE privacy_settings ADD CONSTRAINT check_consent_date_logic 
    CHECK ((consent_given = true AND consent_date IS NOT NULL) OR 
           (consent_given = false AND consent_date IS NULL));

-- Create function to automatically clean up old data based on retention policies
CREATE OR REPLACE FUNCTION cleanup_old_data_for_user(target_user_id TEXT, target_conversation_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    settings_record RECORD;
    cutoff_date TIMESTAMP WITH TIME ZONE;
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Get privacy settings for the user
    SELECT data_retention_days, auto_delete_enabled, consent_given
    INTO settings_record
    FROM privacy_settings 
    WHERE user_id = target_user_id 
      AND (conversation_id = target_conversation_id OR (conversation_id IS NULL AND target_conversation_id IS NULL))
    ORDER BY last_updated DESC
    LIMIT 1;
    
    -- Exit if no settings found or auto-delete is disabled
    IF NOT FOUND OR NOT settings_record.auto_delete_enabled OR NOT settings_record.consent_given THEN
        RETURN 0;
    END IF;
    
    -- Calculate cutoff date
    cutoff_date := NOW() - (settings_record.data_retention_days || ' days')::INTERVAL;
    
    -- Delete old learning data (if table exists)
    DELETE FROM user_feedback_learning 
    WHERE user_id = target_user_id AND created_at < cutoff_date;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete old adaptive filters (if table exists)
    DELETE FROM adaptive_filters 
    WHERE user_id = target_user_id AND created_at < cutoff_date;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete old search sessions (cascades to results and feedback)
    DELETE FROM search_sessions 
    WHERE user_id = target_user_id 
      AND created_at < cutoff_date
      AND (conversation_id = target_conversation_id OR target_conversation_id IS NULL);
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete old analytics data (if table exists)
    DELETE FROM search_analytics 
    WHERE user_id = target_user_id 
      AND created_at < cutoff_date
      AND (conversation_id = target_conversation_id OR target_conversation_id IS NULL);
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
EXCEPTION
    WHEN undefined_table THEN
        -- Handle case where some tables don't exist yet
        RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to run automatic cleanup for all users
CREATE OR REPLACE FUNCTION run_automatic_cleanup()
RETURNS TABLE(user_id TEXT, conversation_id UUID, deleted_count INTEGER) AS $$
DECLARE
    settings_record RECORD;
    cleanup_result INTEGER;
BEGIN
    -- Process each user with auto-delete enabled
    FOR settings_record IN 
        SELECT DISTINCT ps.user_id, ps.conversation_id
        FROM privacy_settings ps
        WHERE ps.auto_delete_enabled = true AND ps.consent_given = true
    LOOP
        -- Run cleanup for this user/conversation
        SELECT cleanup_old_data_for_user(settings_record.user_id, settings_record.conversation_id) 
        INTO cleanup_result;
        
        -- Return result if any data was deleted
        IF cleanup_result > 0 THEN
            user_id := settings_record.user_id;
            conversation_id := settings_record.conversation_id;
            deleted_count := cleanup_result;
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create function to anonymize user data (GDPR compliance)
CREATE OR REPLACE FUNCTION anonymize_user_data(target_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    anonymized_id TEXT;
    total_anonymized INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Generate anonymized user ID
    anonymized_id := 'anon_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || 
                     substr(md5(random()::text), 1, 8);
    
    -- Anonymize search sessions (if table exists)
    BEGIN
        UPDATE search_sessions SET user_id = anonymized_id WHERE user_id = target_user_id;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        total_anonymized := total_anonymized + temp_count;
    EXCEPTION
        WHEN undefined_table THEN NULL;
    END;
    
    -- Anonymize search feedback (if table exists)
    BEGIN
        UPDATE search_feedback SET user_id = anonymized_id WHERE user_id = target_user_id;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        total_anonymized := total_anonymized + temp_count;
    EXCEPTION
        WHEN undefined_table THEN NULL;
    END;
    
    -- Anonymize learning data (if table exists)
    BEGIN
        UPDATE user_feedback_learning SET user_id = anonymized_id WHERE user_id = target_user_id;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        total_anonymized := total_anonymized + temp_count;
    EXCEPTION
        WHEN undefined_table THEN NULL;
    END;
    
    -- Anonymize analytics (if table exists)
    BEGIN
        UPDATE search_analytics SET user_id = anonymized_id WHERE user_id = target_user_id;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        total_anonymized := total_anonymized + temp_count;
    EXCEPTION
        WHEN undefined_table THEN NULL;
    END;
    
    -- Anonymize preference patterns (if table exists)
    BEGIN
        UPDATE user_preference_patterns SET user_id = anonymized_id WHERE user_id = target_user_id;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        total_anonymized := total_anonymized + temp_count;
    EXCEPTION
        WHEN undefined_table THEN NULL;
    END;
    
    -- Anonymize adaptive filters (if table exists)
    BEGIN
        UPDATE adaptive_filters SET user_id = anonymized_id WHERE user_id = target_user_id;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        total_anonymized := total_anonymized + temp_count;
    EXCEPTION
        WHEN undefined_table THEN NULL;
    END;
    
    -- Anonymize learning metrics (if table exists)
    BEGIN
        UPDATE learning_metrics SET user_id = anonymized_id WHERE user_id = target_user_id;
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        total_anonymized := total_anonymized + temp_count;
    EXCEPTION
        WHEN undefined_table THEN NULL;
    END;
    
    -- Delete privacy settings (contains PII)
    DELETE FROM privacy_settings WHERE user_id = target_user_id;
    
    RETURN total_anonymized;
END;
$$ LANGUAGE plpgsql;

-- Insert default privacy settings for existing users (if any)
-- This is a one-time migration to ensure existing users have privacy settings
DO $$
BEGIN
    -- Only insert if search_sessions table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'search_sessions') THEN
        INSERT INTO privacy_settings (user_id, consent_given, analytics_enabled, learning_enabled)
        SELECT DISTINCT user_id, false, false, false
        FROM search_sessions
        WHERE user_id NOT IN (SELECT user_id FROM privacy_settings)
        ON CONFLICT (user_id, COALESCE(conversation_id::text, 'global')) DO NOTHING;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE privacy_settings IS 'Stores user privacy preferences and data retention settings for AI Reference Searcher';
COMMENT ON COLUMN privacy_settings.data_retention_days IS 'Number of days to retain user data before automatic deletion';
COMMENT ON COLUMN privacy_settings.auto_delete_enabled IS 'Whether to automatically delete old data based on retention policy';
COMMENT ON COLUMN privacy_settings.analytics_enabled IS 'Whether user consents to analytics data collection';
COMMENT ON COLUMN privacy_settings.learning_enabled IS 'Whether user consents to AI learning from their feedback';
COMMENT ON COLUMN privacy_settings.consent_given IS 'Whether user has given explicit consent for data processing';
COMMENT ON COLUMN privacy_settings.consent_date IS 'When user gave consent (required if consent_given is true)';

COMMENT ON FUNCTION cleanup_old_data_for_user(TEXT, UUID) IS 'Cleans up old data for a specific user based on their retention policy';
COMMENT ON FUNCTION run_automatic_cleanup() IS 'Runs automatic cleanup for all users with auto-delete enabled';
COMMENT ON FUNCTION anonymize_user_data(TEXT) IS 'Anonymizes all data for a user (GDPR right to be forgotten)';