-- ============================================
-- Thesis Copilot - Database Verification & Fix Script
-- Run this in Supabase SQL Editor
-- ============================================

-- Add missing columns to existing tables if they don't exist
DO $$ 
BEGIN
    -- search_sessions table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='search_sessions' AND table_schema='public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='search_sessions' AND column_name='user_id') 
        THEN
            ALTER TABLE public.search_sessions ADD COLUMN user_id UUID;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='search_sessions' AND column_name='conversation_id') 
        THEN
            ALTER TABLE public.search_sessions ADD COLUMN conversation_id UUID;
        END IF;
    END IF;

    -- user_feedback_learning table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_feedback_learning' AND table_schema='public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='user_feedback_learning' AND column_name='user_id') 
        THEN
            ALTER TABLE public.user_feedback_learning ADD COLUMN user_id UUID;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='user_feedback_learning' AND column_name='conversation_id') 
        THEN
            ALTER TABLE public.user_feedback_learning ADD COLUMN conversation_id UUID;
        END IF;
    END IF;

    -- search_analytics table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='search_analytics' AND table_schema='public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='search_analytics' AND column_name='user_id') 
        THEN
            ALTER TABLE public.search_analytics ADD COLUMN user_id UUID;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='search_analytics' AND column_name='conversation_id') 
        THEN
            ALTER TABLE public.search_analytics ADD COLUMN conversation_id UUID;
        END IF;
    END IF;
END $$;

-- Add indexes for better performance (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='search_sessions' AND table_schema='public') THEN
        CREATE INDEX IF NOT EXISTS idx_search_sessions_user_id ON public.search_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_search_sessions_conversation_id ON public.search_sessions(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_search_sessions_created_at ON public.search_sessions(created_at);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='search_results' AND table_schema='public') THEN
        CREATE INDEX IF NOT EXISTS idx_search_results_session_id ON public.search_results(search_session_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='search_feedback' AND table_schema='public') THEN
        CREATE INDEX IF NOT EXISTS idx_search_feedback_session_id ON public.search_feedback(search_session_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_feedback_learning' AND table_schema='public') THEN
        CREATE INDEX IF NOT EXISTS idx_user_feedback_learning_user_id ON public.user_feedback_learning(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_feedback_learning_conversation_id ON public.user_feedback_learning(conversation_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='search_analytics' AND table_schema='public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='search_analytics' AND column_name='user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON public.search_analytics(user_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='search_analytics' AND column_name='conversation_id') THEN
            CREATE INDEX IF NOT EXISTS idx_search_analytics_conversation_id ON public.search_analytics(conversation_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='search_analytics' AND column_name='event_type') THEN
            CREATE INDEX IF NOT EXISTS idx_search_analytics_event_type ON public.search_analytics(event_type);
        END IF;
    END IF;
END $$;

-- Enable Row Level Security and create policies for analytics tables
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='search_sessions' AND table_schema='public') THEN
        ALTER TABLE public.search_sessions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to search_sessions" ON public.search_sessions;
        CREATE POLICY "Allow all access to search_sessions" ON public.search_sessions
            FOR ALL USING (true) WITH CHECK (true);
        GRANT ALL ON public.search_sessions TO anon, authenticated, service_role;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='search_results' AND table_schema='public') THEN
        ALTER TABLE public.search_results ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to search_results" ON public.search_results;
        CREATE POLICY "Allow all access to search_results" ON public.search_results
            FOR ALL USING (true) WITH CHECK (true);
        GRANT ALL ON public.search_results TO anon, authenticated, service_role;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='search_feedback' AND table_schema='public') THEN
        ALTER TABLE public.search_feedback ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to search_feedback" ON public.search_feedback;
        CREATE POLICY "Allow all access to search_feedback" ON public.search_feedback
            FOR ALL USING (true) WITH CHECK (true);
        GRANT ALL ON public.search_feedback TO anon, authenticated, service_role;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_feedback_learning' AND table_schema='public') THEN
        ALTER TABLE public.user_feedback_learning ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to user_feedback_learning" ON public.user_feedback_learning;
        CREATE POLICY "Allow all access to user_feedback_learning" ON public.user_feedback_learning
            FOR ALL USING (true) WITH CHECK (true);
        GRANT ALL ON public.user_feedback_learning TO anon, authenticated, service_role;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='search_analytics' AND table_schema='public') THEN
        ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to search_analytics" ON public.search_analytics;
        CREATE POLICY "Allow all access to search_analytics" ON public.search_analytics
            FOR ALL USING (true) WITH CHECK (true);
        GRANT ALL ON public.search_analytics TO anon, authenticated, service_role;
    END IF;
END $$;

-- Setup RLS policies for other essential tables
-- Chats table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='chats' AND table_schema='public') THEN
        ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to chats" ON public.chats;
        CREATE POLICY "Allow all access to chats" ON public.chats
            FOR ALL USING (true) WITH CHECK (true);
        GRANT ALL ON public.chats TO anon, authenticated, service_role;
    END IF;
END $$;

-- Messages table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='messages' AND table_schema='public') THEN
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to messages" ON public.messages;
        CREATE POLICY "Allow all access to messages" ON public.messages
            FOR ALL USING (true) WITH CHECK (true);
        GRANT ALL ON public.messages TO anon, authenticated, service_role;
    END IF;
END $$;

-- Ideas table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='ideas' AND table_schema='public') THEN
        ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to ideas" ON public.ideas;
        CREATE POLICY "Allow all access to ideas" ON public.ideas
            FOR ALL USING (true) WITH CHECK (true);
        GRANT ALL ON public.ideas TO anon, authenticated, service_role;
    END IF;
END $$;

-- Privacy settings table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='privacy_settings' AND table_schema='public') THEN
        ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to privacy_settings" ON public.privacy_settings;
        CREATE POLICY "Allow all access to privacy_settings" ON public.privacy_settings
            FOR ALL USING (true) WITH CHECK (true);
        GRANT ALL ON public.privacy_settings TO anon, authenticated, service_role;
    END IF;
END $$;

-- Builder content table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='builder_content' AND table_schema='public') THEN
        ALTER TABLE public.builder_content ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to builder_content" ON public.builder_content;
        CREATE POLICY "Allow all access to builder_content" ON public.builder_content
            FOR ALL USING (true) WITH CHECK (true);
        GRANT ALL ON public.builder_content TO anon, authenticated, service_role;
    END IF;
END $$;

-- Proofreading sessions table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='proofreading_sessions' AND table_schema='public') THEN
        ALTER TABLE public.proofreading_sessions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to proofreading_sessions" ON public.proofreading_sessions;
        CREATE POLICY "Allow all access to proofreading_sessions" ON public.proofreading_sessions
            FOR ALL USING (true) WITH CHECK (true);
        GRANT ALL ON public.proofreading_sessions TO anon, authenticated, service_role;
    END IF;
END $$;

-- Proofreading concerns table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='proofreading_concerns' AND table_schema='public') THEN
        ALTER TABLE public.proofreading_concerns ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to proofreading_concerns" ON public.proofreading_concerns;
        CREATE POLICY "Allow all access to proofreading_concerns" ON public.proofreading_concerns
            FOR ALL USING (true) WITH CHECK (true);
        GRANT ALL ON public.proofreading_concerns TO anon, authenticated, service_role;
    END IF;
END $$;

-- References table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='references' AND table_schema='public') THEN
        ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access to references" ON public.references;
        CREATE POLICY "Allow all access to references" ON public.references
            FOR ALL USING (true) WITH CHECK (true);
        GRANT ALL ON public.references TO anon, authenticated, service_role;
    END IF;
END $$;

-- ============================================
-- Verification Queries
-- Run these separately to check if everything is set up correctly
-- ============================================

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check policies exist
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
