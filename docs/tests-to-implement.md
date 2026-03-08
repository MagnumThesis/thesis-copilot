# Tests to Re-implement

This document lists all the tests that were removed from the codebase and need to be re-implemented.

## `src/tests/ai-services.test.ts`

- **describe: AIServices**
  - **describe: constructor**
    - it: should initialize all services
  - **describe: getContext**
    - it: should get context from conversation history
    - it: should return empty string for new conversation
  - **describe: runAIAssistedSearch**
    - it: should run AI-assisted search and return search results
    - it: should handle errors during search
  - **describe: generateInitialReferences**
    - it: should generate initial references from search results
    - it: should handle no search results
  - **describe: generateFollowUpQuestions**
    - it: should generate follow-up questions from search results
    - it: should handle no search results
  - **describe: generateBibliography**
    - it: should generate a bibliography for a conversation
    - it: should handle errors during bibliography generation

## `src/tests/ai-tasks.test.ts`

- **describe: AITasks**
  - **describe: buildSearchQueries**
    - it: should build search queries from a user prompt
    - it: should handle complex user prompts
    - it: should use chat history for context
    - it: should return empty array for irrelevant prompts
  - **describe: generateReferences**
    - it: should generate references from search results
    - it: should handle empty search results
    - it: should handle malformed search results
    - it: should handle missing optional fields
  - **describe: generateFollowUpQuestions**
    - it: should generate follow-up questions from search results
    - it: should handle empty search results
    - it: should return empty array if no meaningful questions can be generated
  - **describe: generateBibliography**
    - it: should generate a bibliography from references
    - it: should handle different citation styles
    - it: should handle empty reference list
    - it: should handle references with missing data

## `src/tests/citation-service.test.ts`

- **describe: CitationService**
  - **describe: constructor**
    - it: should initialize with a database operations instance
  - **describe: addCitation**
    - it: should add a new citation instance
    - it: should throw an error if reference does not exist
  - **describe: getCitationsForConversation**
    - it: should retrieve all citations for a conversation
    - it: should return an empty array for conversations with no citations
  - **describe: formatBibliography**
    - it: should format a bibliography in APA style
    - it: should format a bibliography in MLA style
    - it: should handle empty reference list
    - it: should handle different reference types

## `src/tests/conversation-history-manager.test.ts`

- **describe: ConversationHistoryManager**
  - **describe: constructor**
    - it: should initialize with a database operations instance
  - **describe: addMessage**
    - it: should add a user message to the history
    - it: should add an AI message to the history
    - it: should not add empty messages
  - **describe: getHistory**
    - it: should retrieve the history for a conversation
    - it: should return an empty array for a new conversation
    - it: should handle pagination
  - **describe: clearHistory**
    - it: should clear the history for a conversation

## `src/tests/database-migration.test.ts`

- **describe: Database Migration**
  - it: should connect to the test database
  - it: should apply all migrations successfully
  - it: should verify the schema after migration
  - it: should seed initial data correctly
  - it: should handle migration rollbacks

## `src/tests/document-preparer.test.ts`

- **describe: DocumentPreparer**
  - **describe: constructor**
    - it: should initialize with a database operations instance
  - **describe: prepareSystemPrompt**
    - it: should prepare a system prompt with context
    - it: should handle conversations with no history
    - it: should include relevant references in the prompt
  - **describe: prepareUserPrompt**
    - it: should prepare a user prompt with the latest message
  - **describe: constructFullPrompt**
    - it: should construct a full prompt with system and user messages

## `src/tests/enhanced-search-history-manager.test.ts`

- **describe: EnhancedSearchHistoryManager**
  - **describe: constructor**
    - it: should initialize with default settings
  - **describe: addSearch**
    - it: should add a new search to the history
    - it: should not add duplicate searches
  - **describe: getHistory**
    - it: should retrieve the search history
  - **describe: clearHistory**
    - it: should clear the search history

## `src/tests/google-scholar-client-comprehensive.test.ts`

- **describe: GoogleScholarClient**
  - **describe: Constructor**
    - it: should create client with default rate limit configuration
    - it: should create client with custom rate limit configuration
  - **describe: search**
    - it: should successfully search and return results
    - it: should return empty results for empty query
    - it: should handle search options correctly
    - it: should return fallback results for network errors
    - it: should return fallback results for HTTP error responses
    - it: should return fallback results for rate limiting (429 status)
    - it: should return fallback results for blocked access (403 status)
    - it: should retry on transient errors
  - **describe: parseResults**
    - it: should parse HTML results correctly
    - it: should handle malformed HTML gracefully
    - it: should handle empty HTML
    - it: should skip results with missing required fields
    - it: should extract DOI when present
  - **describe: validateResults**
    - it: should filter out invalid results
    - it: should normalize invalid confidence scores
  - **describe: Rate Limiting**
    - it: should track rate limit status
    - it: should enforce rate limits
  - **describe: Error Handling**
    - it: should return fallback results for timeout errors
    - it: should provide detailed error information
  - **describe: HTML Parsing Edge Cases**
    - it: should handle various title formats
    - it: should handle HTML entities in text
    - it: should extract citation counts in various formats
    - it: should handle missing optional fields gracefully
  - **describe: URL Building**
    - it: should build search URLs with proper encoding
    - it: should handle special search options
  - **describe: Performance and Memory**
    - it: should handle large result sets efficiently
    - it: should not leak memory with repeated searches
  - **describe: Integration Scenarios**
    - it: should handle complex search scenarios with multiple filters
    - it: should maintain state consistency across multiple searches

## `src/tests/reference-database-operations.test.ts`

- **describe: ReferenceDatabaseOperations**
  - **describe: createReference**
    - it: should create a reference and link authors
  - **describe: getReferenceById**
    - it: should retrieve a reference and map its authors
  - **describe: updateReference**
    - it: should update a reference and its authors
  - **describe: getReferencesForConversation**
    - it: should retrieve references and map their authors
