# Design Document

## Overview

The Thesis Copilot application currently has a mixed backend configuration where most handlers use Supabase correctly, but there are legacy migration files, some handlers still reference D1 database types, and the Supabase types are not properly generated. This design outlines the consolidation approach to ensure all database operations use Supabase exclusively and remove any legacy database configurations.

## Architecture

### Current State Analysis

**Supabase Integration Status:**
- ✅ Core handlers (chats, ideas, proofreader-ai, referencer-api, builder-content) already use Supabase
- ✅ Supabase client configuration exists in `src/worker/lib/supabase.ts`
- ✅ Environment variables are properly configured for Supabase
- ❌ Some handlers still reference D1Database types (privacy-management, ai-searcher-learning, ai-searcher-feedback)
- ❌ Supabase types file is empty/not generated
- ❌ Legacy migration files exist in `/migrations` directory
- ❌ Some handlers may not be using the consistent Supabase pattern

**Database Schema Requirements:**
Based on the migration files, the following tables need to exist in Supabase:
- `chats` (id, name, created_at)
- `messages` (id, chat_id, content, role, created_at)
- `ideas` (id, title, description, conversationid, created_at, updated_at)
- `proofreading_concerns` (with enums: concern_category, concern_severity, concern_status)
- `proofreading_sessions`
- `references` (with enums: reference_type, citation_style)
- `citation_instances`
- `builder_content` (conversation_id, content, updated_at)

### Target Architecture

**Single Database System:**
- All database operations will go through Supabase
- No D1, PostgreSQL direct connections, or other database systems
- Consistent error handling and connection patterns across all handlers

**Supabase-First Approach:**
- Use Supabase's migration system for schema management
- Generate proper TypeScript types from Supabase schema
- Leverage Supabase's built-in features (RLS, real-time, etc.)

## Components and Interfaces

### 1. Database Connection Layer

**Current Implementation:**
```typescript
// src/worker/lib/supabase.ts
export function getSupabase(env?: SupabaseEnv) {
  // Returns configured Supabase client
}
```

**Enhancements Needed:**
- Ensure all handlers use this consistent pattern
- Remove any D1Database type references
- Add proper error handling for connection failures

### 2. Handler Pattern Standardization

**Standard Pattern:**
```typescript
export async function handlerFunction(
  c: Context<{ Bindings: Env & SupabaseEnv }>
) {
  const supabase = getSupabase(c.env);
  // Database operations using supabase client
}
```

**Handlers to Update:**
- `privacy-management.ts` - Remove D1Database references
- `ai-searcher-learning.ts` - Remove D1Database references  
- `ai-searcher-feedback.ts` - Remove D1Database references
- Any other handlers not following the pattern

### 3. Type System

**Current State:**
- `src/worker/types/supabase_types.ts` is mostly empty
- `src/worker/types/d1.ts` exists but should be removed

**Target State:**
- Generate complete Supabase types using `supabase gen types typescript`
- Remove D1 type definitions
- Update all handler imports to use Supabase types

### 4. Environment Configuration

**Current Configuration (Good):**
```env
SUPABASE_URL=https://niysvscyvibdlhqbwwva.supabase.co
VITE_SUPABASE_URL=https://niysvscyvibdlhqbwwva.supabase.co
SUPABASE_ANON=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_ANON=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**No Changes Needed** - Environment is already properly configured for Supabase-only operation.

## Data Models

### Schema Migration Strategy

**From Local Migrations to Supabase:**
1. The existing migration files contain the complete schema definition
2. These need to be applied to the Supabase database
3. Once confirmed in Supabase, local migration files can be removed

**Key Tables and Relationships:**
```sql
-- Core tables
chats (id, name, created_at)
messages (id, chat_id, content, role, created_at)
ideas (id, title, description, conversationid, created_at, updated_at)

-- Proofreader tables
proofreading_concerns (id, conversation_id, category, severity, title, description, ...)
proofreading_sessions (id, conversation_id, content_hash, analysis_metadata, ...)

-- Referencer tables  
references (id, conversation_id, type, title, authors, ...)
citation_instances (id, reference_id, conversation_id, citation_style, ...)

-- Builder table
builder_content (conversation_id, content, updated_at)
```

**Enums to Create:**
- `concern_category`, `concern_severity`, `concern_status`
- `reference_type`, `citation_style`

## Error Handling

### Consistent Error Patterns

**Current Good Examples:**
- `proofreader-ai.ts` has comprehensive error handling
- `referencer-api.ts` has standardized error responses

**Pattern to Apply:**
```typescript
try {
  const supabase = getSupabase(c.env);
  const { data, error } = await supabase.from('table').select();
  
  if (error) {
    console.error('Database error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
  
  return c.json({ success: true, data });
} catch (error) {
  console.error('Handler error:', error);
  return c.json({ success: false, error: 'Internal server error' }, 500);
}
```

## Testing Strategy

### Database Schema Validation

**Pre-Migration Testing:**
1. Verify all existing handlers work with current Supabase setup
2. Test that schema matches migration file definitions
3. Validate that all required tables and enums exist

**Post-Migration Testing:**
1. Run integration tests for all API endpoints
2. Verify data integrity after migration
3. Test error handling for database connection failures

### Handler Consistency Testing

**Test Coverage:**
1. All handlers use `getSupabase(c.env)` pattern
2. No handlers reference D1Database or other database types
3. All handlers follow consistent error handling patterns
4. Type safety with generated Supabase types

## Implementation Phases

### Phase 1: Schema Verification and Type Generation
1. Verify Supabase database has all required tables and enums
2. Generate proper TypeScript types from Supabase schema
3. Update imports in all handlers to use new types

### Phase 2: Handler Cleanup
1. Remove D1Database references from handlers
2. Ensure all handlers use consistent Supabase patterns
3. Update error handling to be consistent across handlers

### Phase 3: Legacy Cleanup
1. Remove local migration files
2. Remove D1 type definitions
3. Clean up any unused database-related dependencies

### Phase 4: Validation and Testing
1. Run comprehensive tests on all endpoints
2. Verify no database connections other than Supabase
3. Validate that all data operations work correctly

## Security Considerations

### Supabase Security Features

**Row Level Security (RLS):**
- Consider implementing RLS policies for multi-tenant data isolation
- Currently not implemented but could be added for enhanced security

**API Key Management:**
- Use service role key for server-side operations
- Anon key is properly configured for client-side operations

**Connection Security:**
- All connections use HTTPS
- API keys are properly stored in environment variables

## Performance Considerations

### Connection Pooling
- Supabase handles connection pooling automatically
- No need for custom connection management

### Query Optimization
- Use Supabase's query builder for type-safe operations
- Leverage indexes defined in migration files
- Consider using Supabase's real-time features where appropriate

## Monitoring and Observability

### Logging Strategy
- Maintain current comprehensive logging in handlers
- Add Supabase-specific error logging
- Monitor connection health and query performance

### Error Tracking
- Standardize error responses across all handlers
- Include processing time and request IDs for debugging
- Log database errors with sufficient context for troubleshooting