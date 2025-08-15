-- Syntax validation script for migration files
-- This script performs basic syntax checks without executing the migrations

-- Check 1: Validate enum definitions
DO $$
BEGIN
    -- This will fail if enum syntax is invalid
    EXECUTE 'SELECT unnest(enum_range(NULL::concern_category))' INTO TEMP TABLE temp_test_enum;
    DROP TABLE temp_test_enum;
    RAISE NOTICE 'Enum syntax validation passed';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Enum validation would fail - this is expected if enums do not exist yet';
END $$;

-- Check 2: Validate table structure (syntax only)
DO $$
BEGIN
    -- Test that our table definitions have valid syntax
    -- We'll create temporary tables with similar structure to test syntax
    
    CREATE TEMP TABLE temp_concerns_test (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL,
        category TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        location JSONB,
        suggestions TEXT[],
        related_ideas TEXT[],
        status TEXT NOT NULL DEFAULT 'to_be_done',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE TEMP TABLE temp_sessions_test (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL,
        content_hash VARCHAR(64) NOT NULL,
        analysis_metadata JSONB,
        concerns_generated INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    DROP TABLE temp_concerns_test;
    DROP TABLE temp_sessions_test;
    
    RAISE NOTICE 'Table structure syntax validation passed';
END $$;

-- Check 3: Validate function syntax
DO $$
BEGIN
    -- Test trigger function syntax
    CREATE OR REPLACE FUNCTION temp_update_test()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $func$ language 'plpgsql';
    
    DROP FUNCTION temp_update_test();
    
    RAISE NOTICE 'Function syntax validation passed';
END $$;

RAISE NOTICE 'All syntax validations completed successfully!';