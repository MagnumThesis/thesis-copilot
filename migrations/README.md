# Database Migrations

This directory contains database migration scripts for the Thesis Copilot application.

## Migration Files

### Existing Migrations
- `v1_create_ideas_table.sql` - Creates the initial ideas table
- `v2_alter_ideas_table.sql` - Adds foreign key constraint to ideas table

### New Migrations (Proofreader Tool)
- `v3_create_proofreading_tables.sql` - Creates proofreading concerns and sessions tables
- `v3_rollback_proofreading_tables.sql` - Rollback script for v3 migration

### New Migrations (Referencer Tool)
- `v4_create_referencer_tables.sql` - Creates references and citation_instances tables
- `v4_rollback_referencer_tables.sql` - Rollback script for v4 migration

### Complete Schema
- `new_db.sql` - Complete database schema for fresh installations

### Testing
- `test_migration.sql` - Test script to verify migration correctness

## Migration Order

Migrations should be applied in version order:
1. v1_create_ideas_table.sql
2. v2_alter_ideas_table.sql  
3. v3_create_proofreading_tables.sql
4. v4_create_referencer_tables.sql

## Fresh Installation

For new database setups, use `new_db.sql` which contains the complete schema.

## Proofreading Tables Schema

### Tables Created in v3

#### proofreading_concerns
- Stores individual proofreading concerns identified by AI analysis
- Links to conversations via `conversation_id` foreign key
- Includes categorization, severity, and status tracking
- Supports JSONB location data and text array suggestions

#### proofreading_sessions  
- Tracks proofreading analysis sessions
- Links to conversations and stores analysis metadata
- Includes content hash for caching and duplicate detection

### Enums Created in v3

- `concern_category` - Types of concerns (clarity, coherence, structure, etc.)
- `concern_severity` - Severity levels (low, medium, high, critical)
- `concern_status` - Status tracking (to_be_done, addressed, rejected)

### Indexes Created in v3

Performance indexes on:
- conversation_id (both tables)
- status, category, severity (concerns table)
- content_hash (sessions table)
- created_at timestamps (both tables)

### Triggers Created in v3

- `update_proofreading_concerns_updated_at` - Auto-updates updated_at timestamp

## Foreign Key Relationships

- `proofreading_concerns.conversation_id` → `chats.id` (CASCADE DELETE)
- `proofreading_sessions.conversation_id` → `chats.id` (CASCADE DELETE)
- `references.conversation_id` → `chats.id` (CASCADE DELETE)
- `citation_instances.reference_id` → `references.id` (CASCADE DELETE)
- `citation_instances.conversation_id` → `chats.id` (CASCADE DELETE)
- `ideas.conversationid` → `chats.id` (SET NULL on DELETE)

## Testing the Migration

Run `test_migration.sql` after applying v3 migration to verify:
- Enum creation
- Table creation  
- Foreign key constraints
- Index creation
- Trigger functionality
- Cascading delete behavior

## Referencer Tables Schema

### Tables Created in v4

#### references
- Stores bibliographic references for citation management
- Links to conversations via `conversation_id` foreign key
- Includes comprehensive reference metadata (authors, publication details, etc.)
- Supports JSONB authors array and text array tags
- Includes metadata confidence scoring for extracted references

#### citation_instances
- Tracks individual citations inserted into documents
- Links to references and conversations
- Stores formatted citation text and document position
- Supports different citation styles per instance

### Enums Created in v4

- `reference_type` - Types of references (journal_article, book, website, etc.)
- `citation_style` - Citation formatting styles (apa, mla, chicago, etc.)

### Indexes Created in v4

Performance indexes on:
- conversation_id (both tables)
- type, title, authors, tags (references table)
- doi (references table, partial index)
- reference_id, citation_style (citation_instances table)
- created_at timestamps (both tables)

### Triggers Created in v4

- `update_references_updated_at` - Auto-updates updated_at timestamp

### Constraints Created in v4

- DOI format validation (10.xxxx/... pattern)
- URL format validation (http/https protocol)
- Metadata confidence range validation (0.0-1.0)

## Rollback

If needed, use `v3_rollback_proofreading_tables.sql` to remove proofreading tables and related objects.
If needed, use `v4_rollback_referencer_tables.sql` to remove referencer tables and related objects.

## Notes

- All timestamps use `TIMESTAMP WITH TIME ZONE`
- UUIDs are generated using `gen_random_uuid()` or `uuid_generate_v4()`
- JSONB is used for flexible location and metadata storage
- Text arrays are used for suggestions and related ideas
- Proper cascading ensures data integrity when conversations are deleted