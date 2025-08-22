-- Rollback migration for v4
-- Description: Remove referencer tables and related objects

-- Drop triggers
DROP TRIGGER IF EXISTS update_references_updated_at ON references;

-- Drop indexes
DROP INDEX IF EXISTS idx_references_conversation_id;
DROP INDEX IF EXISTS idx_references_type;
DROP INDEX IF EXISTS idx_references_title;
DROP INDEX IF EXISTS idx_references_authors;
DROP INDEX IF EXISTS idx_references_tags;
DROP INDEX IF EXISTS idx_references_doi;
DROP INDEX IF EXISTS idx_references_created_at;

DROP INDEX IF EXISTS idx_citation_instances_reference_id;
DROP INDEX IF EXISTS idx_citation_instances_conversation_id;
DROP INDEX IF EXISTS idx_citation_instances_style;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS citation_instances;
DROP TABLE IF EXISTS references;

-- Drop enums
DROP TYPE IF EXISTS citation_style;
DROP TYPE IF EXISTS reference_type;