-- Rollback script for v3 migration
-- Description: Remove proofreading tables, indexes, triggers, and enums

-- Drop triggers first
DROP TRIGGER IF EXISTS update_proofreading_concerns_updated_at ON proofreading_concerns;

-- Drop indexes
DROP INDEX IF EXISTS idx_proofreading_concerns_conversation_id;
DROP INDEX IF EXISTS idx_proofreading_concerns_status;
DROP INDEX IF EXISTS idx_proofreading_concerns_category;
DROP INDEX IF EXISTS idx_proofreading_concerns_severity;
DROP INDEX IF EXISTS idx_proofreading_concerns_created_at;
DROP INDEX IF EXISTS idx_proofreading_sessions_conversation_id;
DROP INDEX IF EXISTS idx_proofreading_sessions_content_hash;
DROP INDEX IF EXISTS idx_proofreading_sessions_created_at;

-- Drop tables (order matters due to dependencies)
DROP TABLE IF EXISTS proofreading_sessions;
DROP TABLE IF EXISTS proofreading_concerns;

-- Drop enums
DROP TYPE IF EXISTS concern_status;
DROP TYPE IF EXISTS concern_severity;
DROP TYPE IF EXISTS concern_category;

-- Note: We don't drop the update_updated_at_column function as it might be used by other tables