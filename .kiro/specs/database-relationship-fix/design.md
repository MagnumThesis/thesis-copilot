# Design Document

## Overview

The database relationship error occurs because PostgREST interprets SQL aggregate functions like `min()` and `max()` as foreign key relationships when used in a `.select()` clause. The current query `.select('count(), min(created_at), max(created_at)')` is invalid PostgREST syntax and needs to be replaced with separate, properly formatted queries.

## Architecture

The fix involves modifying the `getDataSummary` method in the `PrivacyManager` class to use PostgREST-compatible query patterns:

1. **Count Queries**: Use the `count` parameter with `head: true` for efficient record counting
2. **Date Range Queries**: Use separate queries with proper ordering and limits to find earliest/latest records
3. **Error Handling**: Maintain robust error handling while using the new query patterns

## Components and Interfaces

### Modified PrivacyManager.getDataSummary Method

The method will be restructured to use these query patterns:

```typescript
// Instead of: .select('count(), min(created_at), max(created_at)')
// Use separate queries:

// 1. Count query
const { count, error: countError } = await supabase
  .from('search_sessions')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId);

// 2. Oldest record query  
const { data: oldestData, error: oldestError } = await supabase
  .from('search_sessions')
  .select('created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: true })
  .limit(1)
  .maybeSingle();

// 3. Newest record query
const { data: newestData, error: newestError } = await supabase
  .from('search_sessions')
  .select('created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

### Query Optimization Strategy

1. **Conditional Queries**: Only execute date range queries if records exist (count > 0)
2. **Conversation Filtering**: Apply conversation ID filters consistently across all queries
3. **Parallel Execution**: Use Promise.all for independent queries to improve performance

## Data Models

The existing `DataSummary` interface remains unchanged:

```typescript
interface DataSummary {
  searchSessions: number;
  searchResults: number;
  feedbackEntries: number;
  learningData: number;
  totalSize: string;
  oldestEntry?: Date;
  newestEntry?: Date;
}
```

## Error Handling

1. **Individual Query Errors**: Handle errors for each query separately to provide specific error messages
2. **Graceful Degradation**: If date range queries fail, return summary without date information rather than failing completely
3. **Logging**: Maintain detailed error logging for debugging while providing user-friendly error responses

## Testing Strategy

### Unit Tests
- Test count queries return correct numbers
- Test date range queries return proper oldest/newest dates
- Test conversation ID filtering works correctly
- Test error handling for each query type

### Integration Tests
- Test complete data summary retrieval with real database
- Test performance with large datasets
- Test concurrent access scenarios

### Error Scenario Tests
- Test behavior when no records exist
- Test behavior when only some record types exist
- Test database connection failures
- Test malformed conversation IDs

## Implementation Approach

1. **Replace Aggregate Query**: Remove the problematic `.select('count(), min(created_at), max(created_at)')` query
2. **Implement Separate Queries**: Add individual queries for count, oldest date, and newest date
3. **Add Conversation Filtering**: Ensure all queries properly handle optional conversation ID parameter
4. **Optimize Performance**: Use Promise.all for independent queries and conditional execution for date queries
5. **Maintain Backward Compatibility**: Ensure the method signature and return type remain unchanged