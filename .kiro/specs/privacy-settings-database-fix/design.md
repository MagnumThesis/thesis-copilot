# Design Document

## Overview

This design addresses the privacy settings database constraint issue by implementing a proper unique constraint on the `privacy_settings` table and updating the application code to handle upsert operations correctly. The solution ensures data integrity while maintaining backward compatibility and providing robust error handling.

## Architecture

The fix involves three main components:

1. **Database Schema Update**: Add a unique constraint on `(user_id, conversation_id)` columns
2. **Data Migration**: Handle existing duplicate records before applying the constraint
3. **Application Code Update**: Improve error handling and constraint validation

## Components and Interfaces

### Database Schema Changes

**Unique Constraint Addition**
- Add unique constraint named `privacy_settings_user_conversation_unique` on `(user_id, conversation_id)`
- Handle NULL values in `conversation_id` properly (PostgreSQL treats NULL values as distinct)
- Use partial unique index to handle NULL conversation_id cases correctly

**Migration Strategy**
```sql
-- Step 1: Identify and resolve duplicate records
-- Step 2: Create unique constraint with proper NULL handling
-- Step 3: Verify constraint is working correctly
```

### Privacy Manager Updates

**Enhanced Upsert Logic**
- Validate constraint exists before attempting upsert operations
- Implement fallback behavior for constraint validation failures
- Add proper error handling and logging for database operations

**Constraint Validation**
- Check if the required unique constraint exists in the database
- Provide clear error messages when constraints are missing
- Implement graceful degradation when constraints are not available

### Error Handling Improvements

**Database Error Processing**
- Catch and interpret PostgreSQL constraint violation errors
- Provide user-friendly error messages for common constraint issues
- Log detailed error information for debugging purposes

**Fallback Mechanisms**
- Implement manual duplicate checking when constraints are missing
- Provide alternative update strategies for edge cases
- Ensure system remains functional even with schema issues

## Data Models

### Privacy Settings Table Schema

```typescript
interface PrivacySettingsTable {
  id: string; // Primary key (UUID)
  user_id: string; // Required, part of unique constraint
  conversation_id: string | null; // Optional, part of unique constraint
  data_retention_days: number;
  auto_delete_enabled: boolean;
  analytics_enabled: boolean;
  learning_enabled: boolean;
  export_format: string;
  consent_given: boolean;
  consent_date: string | null;
  last_updated: string;
  created_at: string;
}
```

### Unique Constraint Definition

```sql
-- Unique constraint handling NULL conversation_id properly
ALTER TABLE privacy_settings 
ADD CONSTRAINT privacy_settings_user_conversation_unique 
UNIQUE (user_id, conversation_id);

-- Alternative: Partial unique index for better NULL handling
CREATE UNIQUE INDEX privacy_settings_user_global_unique 
ON privacy_settings (user_id) 
WHERE conversation_id IS NULL;

CREATE UNIQUE INDEX privacy_settings_user_conversation_unique 
ON privacy_settings (user_id, conversation_id) 
WHERE conversation_id IS NOT NULL;
```

## Error Handling

### Database Constraint Errors

**Error Code 42P10 (ON CONFLICT specification)**
- Detect when unique constraint is missing
- Provide clear error message explaining the issue
- Implement fallback behavior or manual constraint checking

**Duplicate Key Violations**
- Handle cases where duplicate records exist during constraint creation
- Implement data deduplication logic
- Preserve most recent settings when resolving duplicates

### Application Error Handling

**Privacy Manager Error Handling**
```typescript
async updatePrivacySettings(settings: PrivacySettings): Promise<void> {
  try {
    // Validate constraint exists
    await this.validateUniqueConstraint();
    
    // Perform upsert with proper conflict resolution
    await this.performUpsert(settings);
  } catch (error) {
    if (this.isConstraintMissingError(error)) {
      // Fallback to manual duplicate checking
      await this.updateWithManualDeduplication(settings);
    } else {
      // Re-throw other errors with context
      throw new PrivacySettingsError('Failed to update privacy settings', error);
    }
  }
}
```

## Testing Strategy

### Database Migration Testing

**Pre-Migration Validation**
- Create test data with duplicate records
- Verify migration handles duplicates correctly
- Test constraint creation with various data scenarios

**Post-Migration Validation**
- Verify unique constraint is properly created
- Test upsert operations work correctly
- Validate NULL conversation_id handling

### Application Code Testing

**Unit Tests**
- Test privacy manager upsert operations
- Test error handling for missing constraints
- Test fallback behavior for constraint violations

**Integration Tests**
- Test end-to-end privacy settings updates
- Test API endpoints with various data scenarios
- Test error responses and user experience

**Edge Case Testing**
- Test with NULL conversation_id values
- Test with existing duplicate records
- Test constraint validation failure scenarios

### Performance Testing

**Constraint Impact Assessment**
- Measure query performance before and after constraint addition
- Test upsert operation performance with large datasets
- Validate index usage and query optimization

## Implementation Approach

### Phase 1: Database Schema Fix
1. Create migration script to handle duplicate records
2. Add unique constraint with proper NULL handling
3. Verify constraint is working correctly

### Phase 2: Application Code Updates
1. Update PrivacyManager to validate constraints
2. Implement improved error handling
3. Add fallback mechanisms for edge cases

### Phase 3: Testing and Validation
1. Run comprehensive test suite
2. Validate fix resolves the original error
3. Test edge cases and error scenarios

## Migration Strategy

### Data Deduplication Logic
```sql
-- Identify duplicates and keep most recent
WITH ranked_settings AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, COALESCE(conversation_id, 'global')
      ORDER BY last_updated DESC, created_at DESC
    ) as rn
  FROM privacy_settings
)
DELETE FROM privacy_settings 
WHERE id IN (
  SELECT id FROM ranked_settings WHERE rn > 1
);
```

### Constraint Creation
```sql
-- Add unique constraint after deduplication
ALTER TABLE privacy_settings 
ADD CONSTRAINT privacy_settings_user_conversation_unique 
UNIQUE (user_id, conversation_id);
```

This design ensures that the privacy settings functionality will work correctly while maintaining data integrity and providing a robust user experience.