# Database Migrations

This directory contains database migration scripts for the Thesis Copilot application.

## Migration Files

### Existing Migrations
- `v1_create_ideas_table.sql` - Creates the initial ideas table
- `v2_alter_ideas_table.sql` - Adds foreign key constraint to ideas table

### New Migrations (Proofreader Tool)
- `v3_create_proofreading_tables.sql` - Creates proofreading concerns and sessions tables
- `v3_rollback_proofreading_tables.sql` - Rollback script for v3 migration

### Complete Schema
- `new_db.sql` - Complete database schema for fresh installations

### Testing
- `test_migration.sql` - Test script to verify migration correctness

## Migration Order

Migrations should be applied in version order:
1. v1_create_ideas_table.sql
2. v2_alter_ideas_table.sql  
3. v3_create_proofreading_tables.sql

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
- `ideas.conversationid` → `chats.id` (SET NULL on DELETE)

## Testing the Migration

Run `test_migration.sql` after applying v3 migration to verify:
- Enum creation
- Table creation  
- Foreign key constraints
- Index creation
- Trigger functionality
- Cascading delete behavior

## Rollback

If needed, use `v3_rollback_proofreading_tables.sql` to remove proofreading tables and related objects.

## Notes

- All timestamps use `TIMESTAMP WITH TIME ZONE`
- UUIDs are generated using `gen_random_uuid()` or `uuid_generate_v4()`
- JSONB is used for flexible location and metadata storage
- Text arrays are used for suggestions and related ideas
- Proper cascading ensures data integrity when conversations are deleted