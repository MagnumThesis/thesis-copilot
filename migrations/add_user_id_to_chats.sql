-- Add user_id to chats and messages tables for multi-user support

-- Add user_id column to chats table if it doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='chats' AND table_schema='public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='chats' AND column_name='user_id') 
        THEN
            ALTER TABLE public.chats ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            CREATE INDEX idx_chats_user_id ON public.chats(user_id);
        END IF;
    END IF;
END $$;

-- Add user_id column to messages table if it doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='messages' AND table_schema='public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='messages' AND column_name='user_id') 
        THEN
            ALTER TABLE public.messages ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            CREATE INDEX idx_messages_user_id ON public.messages(user_id);
        END IF;
    END IF;
END $$;

-- Update RLS policies for chats - allow service role to insert on behalf of users
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='chats' AND table_schema='public') THEN
        DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
        DROP POLICY IF EXISTS "Users can create their own chats" ON public.chats;
        DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
        DROP POLICY IF EXISTS "Users can delete their own chats" ON public.chats;
        
        ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
        
        -- Allow service role (backend) to bypass RLS
        CREATE POLICY "Service role can manage all chats" ON public.chats
            FOR ALL USING (true) WITH CHECK (true);
        
        -- Allow users to view their own chats
        CREATE POLICY "Users can view their own chats" ON public.chats
            FOR SELECT USING (auth.uid() = user_id);
        
        -- Allow users to update their own chats
        CREATE POLICY "Users can update their own chats" ON public.chats
            FOR UPDATE USING (auth.uid() = user_id);
        
        -- Allow users to delete their own chats
        CREATE POLICY "Users can delete their own chats" ON public.chats
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Update RLS policies for messages - allow service role to insert on behalf of users
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='messages' AND table_schema='public') THEN
        DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
        DROP POLICY IF EXISTS "Users can create their own messages" ON public.messages;
        DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
        DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
        
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
        
        -- Allow service role (backend) to bypass RLS
        CREATE POLICY "Service role can manage all messages" ON public.messages
            FOR ALL USING (true) WITH CHECK (true);
        
        -- Allow users to view their own messages
        CREATE POLICY "Users can view their own messages" ON public.messages
            FOR SELECT USING (auth.uid() = user_id);
        
        -- Allow users to update their own messages
        CREATE POLICY "Users can update their own messages" ON public.messages
            FOR UPDATE USING (auth.uid() = user_id);
        
        -- Allow users to delete their own messages
        CREATE POLICY "Users can delete their own messages" ON public.messages
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

GRANT ALL ON public.chats TO anon, authenticated, service_role;
GRANT ALL ON public.messages TO anon, authenticated, service_role;
