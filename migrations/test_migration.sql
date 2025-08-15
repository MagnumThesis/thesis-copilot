-- Test script to verify migration syntax and relationships
-- This script can be used to test the migration against a test database

-- Test 1: Verify enum creation
DO $$
BEGIN
    -- Test that enums are created correctly
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'concern_category') THEN
        RAISE EXCEPTION 'concern_category enum not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'concern_severity') THEN
        RAISE EXCEPTION 'concern_severity enum not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'concern_status') THEN
        RAISE EXCEPTION 'concern_status enum not created';
    END IF;
    
    RAISE NOTICE 'All enums created successfully';
END $$;

-- Test 2: Verify table creation
DO $$
BEGIN
    -- Test that tables are created correctly
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proofreading_concerns') THEN
        RAISE EXCEPTION 'proofreading_concerns table not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proofreading_sessions') THEN
        RAISE EXCEPTION 'proofreading_sessions table not created';
    END IF;
    
    RAISE NOTICE 'All tables created successfully';
END $$;

-- Test 3: Verify foreign key constraints
DO $$
BEGIN
    -- Test foreign key constraints exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%proofreading_concerns%conversation_id%'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint on proofreading_concerns.conversation_id not found';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%proofreading_sessions%conversation_id%'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint on proofreading_sessions.conversation_id not found';
    END IF;
    
    RAISE NOTICE 'All foreign key constraints verified';
END $$;

-- Test 4: Verify indexes
DO $$
BEGIN
    -- Test that indexes are created
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_proofreading_concerns_conversation_id') THEN
        RAISE EXCEPTION 'Index idx_proofreading_concerns_conversation_id not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_proofreading_concerns_status') THEN
        RAISE EXCEPTION 'Index idx_proofreading_concerns_status not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_proofreading_sessions_conversation_id') THEN
        RAISE EXCEPTION 'Index idx_proofreading_sessions_conversation_id not created';
    END IF;
    
    RAISE NOTICE 'All indexes verified';
END $$;

-- Test 5: Verify triggers
DO $$
BEGIN
    -- Test that triggers are created
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_proofreading_concerns_updated_at'
    ) THEN
        RAISE EXCEPTION 'Trigger update_proofreading_concerns_updated_at not created';
    END IF;
    
    RAISE NOTICE 'All triggers verified';
END $$;

-- Test 6: Test cascading behavior with sample data
DO $$
DECLARE
    test_chat_id UUID;
    test_concern_id UUID;
BEGIN
    -- Insert test chat
    INSERT INTO chats (name) VALUES ('Test Chat') RETURNING id INTO test_chat_id;
    
    -- Insert test concern
    INSERT INTO proofreading_concerns (
        conversation_id, 
        category, 
        severity, 
        title, 
        description
    ) VALUES (
        test_chat_id,
        'clarity',
        'medium',
        'Test Concern',
        'This is a test concern'
    ) RETURNING id INTO test_concern_id;
    
    -- Verify concern was created
    IF NOT EXISTS (SELECT 1 FROM proofreading_concerns WHERE id = test_concern_id) THEN
        RAISE EXCEPTION 'Test concern not created';
    END IF;
    
    -- Test cascading delete
    DELETE FROM chats WHERE id = test_chat_id;
    
    -- Verify concern was deleted due to cascade
    IF EXISTS (SELECT 1 FROM proofreading_concerns WHERE id = test_concern_id) THEN
        RAISE EXCEPTION 'Cascading delete not working - concern still exists';
    END IF;
    
    RAISE NOTICE 'Cascading behavior verified';
END $$;

-- Test 7: Test trigger functionality
DO $$
DECLARE
    test_chat_id UUID;
    test_concern_id UUID;
    initial_updated_at TIMESTAMP WITH TIME ZONE;
    new_updated_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Insert test chat
    INSERT INTO chats (name) VALUES ('Test Chat for Trigger') RETURNING id INTO test_chat_id;
    
    -- Insert test concern
    INSERT INTO proofreading_concerns (
        conversation_id, 
        category, 
        severity, 
        title, 
        description
    ) VALUES (
        test_chat_id,
        'grammar',
        'low',
        'Test Trigger Concern',
        'Testing trigger functionality'
    ) RETURNING id INTO test_concern_id;
    
    -- Get initial updated_at
    SELECT updated_at INTO initial_updated_at 
    FROM proofreading_concerns 
    WHERE id = test_concern_id;
    
    -- Wait a moment and update
    PERFORM pg_sleep(1);
    
    UPDATE proofreading_concerns 
    SET status = 'addressed' 
    WHERE id = test_concern_id;
    
    -- Get new updated_at
    SELECT updated_at INTO new_updated_at 
    FROM proofreading_concerns 
    WHERE id = test_concern_id;
    
    -- Verify trigger updated the timestamp
    IF new_updated_at <= initial_updated_at THEN
        RAISE EXCEPTION 'Trigger not working - updated_at not changed';
    END IF;
    
    -- Cleanup
    DELETE FROM chats WHERE id = test_chat_id;
    
    RAISE NOTICE 'Trigger functionality verified';
END $$;

RAISE NOTICE 'All migration tests completed successfully!';