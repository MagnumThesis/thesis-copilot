-- Test script for v4 migration (Referencer Tables)
-- Run this after applying v4_create_referencer_tables.sql to verify correctness

-- Test 1: Verify enums were created
SELECT 'reference_type enum created' as test_name, 
       CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reference_type') 
            THEN 'PASS' ELSE 'FAIL' END as result;

SELECT 'citation_style enum created' as test_name,
       CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'citation_style') 
            THEN 'PASS' ELSE 'FAIL' END as result;

-- Test 2: Verify tables were created
SELECT 'references table created' as test_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'references') 
            THEN 'PASS' ELSE 'FAIL' END as result;

SELECT 'citation_instances table created' as test_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'citation_instances') 
            THEN 'PASS' ELSE 'FAIL' END as result;

-- Test 3: Verify foreign key constraints
SELECT 'references.conversation_id FK constraint' as test_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
           WHERE tc.table_name = 'references' 
           AND tc.constraint_type = 'FOREIGN KEY'
           AND kcu.column_name = 'conversation_id'
       ) THEN 'PASS' ELSE 'FAIL' END as result;

SELECT 'citation_instances.reference_id FK constraint' as test_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
           WHERE tc.table_name = 'citation_instances' 
           AND tc.constraint_type = 'FOREIGN KEY'
           AND kcu.column_name = 'reference_id'
       ) THEN 'PASS' ELSE 'FAIL' END as result;

-- Test 4: Verify indexes were created
SELECT 'idx_references_conversation_id index' as test_name,
       CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_references_conversation_id') 
            THEN 'PASS' ELSE 'FAIL' END as result;

SELECT 'idx_references_authors GIN index' as test_name,
       CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_references_authors') 
            THEN 'PASS' ELSE 'FAIL' END as result;

SELECT 'idx_citation_instances_reference_id index' as test_name,
       CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_citation_instances_reference_id') 
            THEN 'PASS' ELSE 'FAIL' END as result;

-- Test 5: Verify constraints
SELECT 'DOI format constraint' as test_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.check_constraints 
           WHERE constraint_name = 'check_doi_format'
       ) THEN 'PASS' ELSE 'FAIL' END as result;

SELECT 'URL format constraint' as test_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.check_constraints 
           WHERE constraint_name = 'check_url_format'
       ) THEN 'PASS' ELSE 'FAIL' END as result;

SELECT 'Confidence range constraint' as test_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.check_constraints 
           WHERE constraint_name = 'check_confidence_range'
       ) THEN 'PASS' ELSE 'FAIL' END as result;

-- Test 6: Verify trigger was created
SELECT 'update_references_updated_at trigger' as test_name,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.triggers 
           WHERE trigger_name = 'update_references_updated_at'
       ) THEN 'PASS' ELSE 'FAIL' END as result;

-- Test 7: Test basic CRUD operations (if chats table exists)
DO $$
DECLARE
    test_chat_id UUID;
    test_ref_id UUID;
    test_citation_id UUID;
BEGIN
    -- Only run if chats table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chats') THEN
        -- Insert test data
        INSERT INTO chats (id, title) VALUES (gen_random_uuid(), 'Test Chat') RETURNING id INTO test_chat_id;
        
        INSERT INTO references (
            conversation_id, type, title, authors, publication_date, doi, url
        ) VALUES (
            test_chat_id, 'journal_article', 'Test Article', 
            '[{"firstName": "John", "lastName": "Doe"}]'::jsonb,
            '2023-01-01', '10.1000/test.doi', 'https://example.com'
        ) RETURNING id INTO test_ref_id;
        
        INSERT INTO citation_instances (
            reference_id, conversation_id, citation_style, citation_text
        ) VALUES (
            test_ref_id, test_chat_id, 'apa', 'Doe, J. (2023). Test Article.'
        ) RETURNING id INTO test_citation_id;
        
        -- Verify data was inserted
        IF EXISTS (SELECT 1 FROM references WHERE id = test_ref_id) AND
           EXISTS (SELECT 1 FROM citation_instances WHERE id = test_citation_id) THEN
            RAISE NOTICE 'CRUD operations test: PASS';
        ELSE
            RAISE NOTICE 'CRUD operations test: FAIL';
        END IF;
        
        -- Clean up test data
        DELETE FROM citation_instances WHERE id = test_citation_id;
        DELETE FROM references WHERE id = test_ref_id;
        DELETE FROM chats WHERE id = test_chat_id;
    ELSE
        RAISE NOTICE 'CRUD operations test: SKIPPED (chats table not found)';
    END IF;
END $$;

-- Summary
SELECT 'V4 Migration Test Summary' as summary, 
       'Run all tests above to verify migration success' as instructions;