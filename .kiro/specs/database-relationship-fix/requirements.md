# Requirements Document

## Introduction

The AI Searcher privacy management system is experiencing database relationship errors when trying to retrieve data summaries. The error occurs because PostgREST/Supabase is misinterpreting SQL aggregate functions (`min`, `max`) as table relationships in the query `.select('count(), min(created_at), max(created_at)')`. This needs to be fixed to ensure the privacy controls work correctly.

## Requirements

### Requirement 1

**User Story:** As a user of the AI Searcher, I want the privacy data summary to load without errors, so that I can view my data usage statistics.

#### Acceptance Criteria

1. WHEN a user requests their privacy data summary THEN the system SHALL return accurate counts of search sessions, results, feedback, and learning data without database relationship errors
2. WHEN the system calculates date ranges THEN it SHALL properly retrieve the oldest and newest entry dates using valid PostgREST queries
3. WHEN the data summary API is called THEN it SHALL return a 200 status code with valid summary data instead of a 500 error

### Requirement 2

**User Story:** As a developer maintaining the system, I want the database queries to use proper PostgREST syntax, so that the system is reliable and maintainable.

#### Acceptance Criteria

1. WHEN aggregate functions are needed THEN the system SHALL use separate queries or PostgREST-compatible approaches instead of mixing aggregate functions in a single select
2. WHEN counting records THEN the system SHALL use the PostgREST `count` parameter with `head: true` for efficient counting
3. WHEN finding min/max dates THEN the system SHALL use proper ordering and limit queries to get the earliest and latest records

### Requirement 3

**User Story:** As a system administrator, I want the privacy management system to be performant, so that users don't experience delays when accessing their privacy controls.

#### Acceptance Criteria

1. WHEN retrieving data summaries THEN the system SHALL minimize the number of database queries while maintaining accuracy
2. WHEN processing large datasets THEN the system SHALL use efficient query patterns that don't cause timeouts
3. WHEN multiple users access privacy controls simultaneously THEN the system SHALL handle concurrent requests without performance degradation