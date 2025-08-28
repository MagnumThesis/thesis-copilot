# Requirements Document

## Introduction

The Thesis Copilot application currently has a mixed backend configuration with Supabase as the primary database but with legacy migration files and potentially inconsistent database connections across different handlers. This feature aims to consolidate the backend to use Supabase exclusively, ensuring all database operations go through Supabase and removing any legacy database configuration or migration files that are no longer needed.

## Requirements

### Requirement 1

**User Story:** As a developer, I want the backend to use only Supabase as the database, so that I have a consistent and simplified database architecture.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL connect only to Supabase database
2. WHEN any API endpoint is called THEN the system SHALL use Supabase client for all database operations
3. WHEN reviewing the codebase THEN there SHALL be no references to other database systems like PostgreSQL direct connections or D1

### Requirement 2

**User Story:** As a developer, I want all database schema to be managed through Supabase, so that I can use Supabase's migration and schema management tools.

#### Acceptance Criteria

1. WHEN reviewing the project structure THEN there SHALL be no local migration files in the migrations directory
2. WHEN the database schema needs to be updated THEN the system SHALL use Supabase's migration system
3. WHEN setting up a new environment THEN the database schema SHALL be managed entirely through Supabase

### Requirement 3

**User Story:** As a developer, I want consistent database connection handling across all API handlers, so that the code is maintainable and follows the same patterns.

#### Acceptance Criteria

1. WHEN reviewing any API handler THEN the handler SHALL use the getSupabase() function for database access
2. WHEN a new handler is created THEN it SHALL follow the same Supabase connection pattern
3. WHEN environment variables are configured THEN only Supabase-related database variables SHALL be required

### Requirement 4

**User Story:** As a developer, I want the environment configuration to be clean and only include necessary Supabase variables, so that the setup is straightforward.

#### Acceptance Criteria

1. WHEN reviewing environment variables THEN only SUPABASE_URL and SUPABASE_ANON SHALL be required for database operations
2. WHEN setting up the application THEN no PostgreSQL or other database connection strings SHALL be needed
3. WHEN the application runs THEN it SHALL not attempt to connect to any database other than Supabase

### Requirement 5

**User Story:** As a developer, I want all existing database tables and data to be properly migrated to Supabase, so that no data is lost during the consolidation.

#### Acceptance Criteria

1. WHEN the consolidation is complete THEN all existing tables SHALL exist in Supabase with the same schema
2. WHEN the consolidation is complete THEN all existing data SHALL be preserved in Supabase
3. WHEN reviewing the Supabase schema THEN it SHALL include all tables: chats, messages, ideas, proofreading_concerns, proofreading_sessions, references, citation_instances, and builder_content