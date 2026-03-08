-- migrations/create_analytics_events_table.sql
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optional: Create an index on event_type for faster querying
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
-- Optional: Create an index on user_id for user-specific queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
-- Optional: Create an index on conversation_id for conversation-specific queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_conversation_id ON public.analytics_events(conversation_id);
-- Optional: Create an index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own events
CREATE POLICY "Users can insert their own analytics events"
    ON public.analytics_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow authenticated users to view their own events
CREATE POLICY "Users can view their own analytics events"
    ON public.analytics_events
    FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);
