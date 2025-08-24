
# Logic Classes

## v1.0.0

This document provides a detailed breakdown of the core business logic classes in the Thesis Copilot application. These classes are primarily located in the `src/worker/lib` and `src/lib` directories.

### AIContextManager

**Location:** `src/worker/lib/ai-context-manager.ts`

**Description:** This class is responsible for building and managing the context that is sent to the AI for processing. It gathers information from the document content, idea definitions, and conversation history to create a comprehensive context for the AI.

**Primary Methods:**

*   `buildContext(documentContent: string, conversationId: string, cursorPosition?: number, selectedText?: string): Promise<DocumentContext>`: Builds a comprehensive context for AI processing, including document content, idea definitions, conversation context, and academic context.
*   `formatContextForAI(context: DocumentContext): string`: Formats the document context into a string that can be used in an AI prompt.
*   `getAcademicWritingGuidelines(context: DocumentContext): string`: Gets academic writing guidelines based on the document context.
*   `getConversationContext(conversationId: string): Promise<{ title: string; messages: Array<{ role: string; content: string }> }>`: Gets the context of a conversation, including the title and recent messages.
*   `getIdeaDefinitions(conversationId: string): Promise<IdeaDefinition[]>`: Retrieves the idea definitions for a given conversation.

### AIPerformanceOptimizer

**Location:** `src/lib/ai-performance-optimizer.ts`

**Description:** This class implements performance optimizations for AI operations, including debouncing, caching, and context optimization.

**Primary Methods:**

*   `cancelPendingRequests()`: Cancels all pending debounced requests.
*   `clearCache()`: Clears the cache.
*   `createOptimisticUpdate(mode: AIMode, parameters: Record<string, any>): OptimisticUpdate`: Creates an optimistic update for immediate UI feedback.
*   `debouncedRequest<T extends AIResponse>(requestKey: string, requestFn: () => Promise<T>, forceImmediate: boolean = false): Promise<T>`: Executes a debounced AI request.
*   `getCacheStats(): { size: number; maxSize: number; hitRate: number; oldestEntry: number; newestEntry: number; }`: Gets statistics about the cache.
*   `getMetrics(): PerformanceMetrics`: Gets the current performance metrics.
*   `optimizedRequest<T extends AIResponse>(mode: AIMode, documentContent: string, parameters: Record<string, any>, requestFn: () => Promise<T>, options: { enableCaching?: boolean; enableDebouncing?: boolean; enableOptimization?: boolean; forceImmediate?: boolean; } = {}): Promise<T>`: Executes an optimized AI request with all performance features.
*   `resetMetrics()`: Resets the performance metrics.

### AISearcherPerformanceOptimizer

**Location:** `src/lib/ai-searcher-performance-optimizer.ts`

**Description:** This class implements performance optimizations for AI-powered academic search, including result caching, background processing, and progressive loading.

**Primary Methods:**

*   `addBackgroundTask(task: Omit<BackgroundTask, 'id' | 'timestamp' | 'retryCount' | 'status'>): string`: Adds a background task to the queue.
*   `cacheContentExtraction(conversationId: string, sourceType: 'ideas' | 'builder', sourceId: string, extractedContent: ExtractedContent): void`: Caches the extracted content.
*   `cacheQueryGeneration(content: ExtractedContent[], options: QueryGenerationOptions, queries: SearchQuery[]): void`: Caches the generated queries.
*   `cacheSearchResults(query: string, filters: SearchFilters, results: ScholarSearchResult[], processingTimeMs: number): void`: Caches the search results.
*   `cleanupProgressiveLoading(sessionId: string): void`: Cleans up a progressive loading session.
*   `clearAllCaches()`: Clears all caches.
*   `getCacheStats(): { searchResults: { size: number; maxSize: number; hitRate: number }; contentExtraction: { size: number; maxSize: number }; queryGeneration: { size: number; maxSize: number }; backgroundTasks: { pending: number; processing: number }; progressiveLoading: { activeSessions: number }; }`: Gets statistics about the caches.
*   `getCachedContentExtraction(conversationId: string, sourceType: 'ideas' | 'builder', sourceId: string): ExtractedContent | null`: Gets cached content extraction.
*   `getCachedQueryGeneration(content: ExtractedContent[], options: QueryGenerationOptions): SearchQuery[] | null`: Gets cached query generation.
*   `getCachedSearchResults(query: string, filters: SearchFilters): ScholarSearchResult[] | null`: Gets cached search results.
*   `getMetrics(): SearchPerformanceMetrics`: Gets the current performance metrics.
*   `getNextBatch<T>(sessionId: string, allResults: T[]): { batch: T[]; state: ProgressiveLoadingState; isComplete: boolean; }`: Gets the next batch for progressive loading.
*   `initializeProgressiveLoading(sessionId: string, totalResults: number, batchSize: number = 10): ProgressiveLoadingState`: Initializes a progressive loading session.
*   `resetMetrics()`: Resets the performance metrics.

### ConcernAnalysisEngine

**Location:** `src/worker/lib/concern-analysis-engine.ts`

**Description:** This class is an AI-powered content analysis engine for identifying proofreading concerns. It analyzes the content for issues related to clarity, coherence, structure, academic style, consistency, and completeness.

**Primary Methods:**

*   `analyzeContent(content: string, conversationId: string): Promise<ProofreadingConcern[]>`: Analyzes the content and generates proofreading concerns.

### ConcernStatusManager

**Location:** `src/worker/lib/concern-status-manager.ts`

**Description:** This class manages the status of proofreading concerns, including updating, persisting, and retrieving them from the database.

**Primary Methods:**

*   `archiveOldConcerns(conversationId: string, daysOld: number = 30): Promise<number>`: Archives old concerns.
*   `bulkUpdateConcernStatus(updates: ConcernStatusUpdate[]): Promise<void>`: Bulk updates the status of multiple concerns.
*   `deleteConcern(concernId: string): Promise<void>`: Deletes a concern.
*   `getConcernById(concernId: string): Promise<ProofreadingConcern | null>`: Gets a concern by its ID.
*   `getConcernsByStatus(conversationId: string, status?: ConcernStatus): Promise<ProofreadingConcern[]>`: Gets concerns filtered by their status.
*   `getConcernStatistics(conversationId: string): Promise<ConcernStatistics>`: Gets statistics about the concerns in a conversation.
*   `saveConcerns(concerns: ProofreadingConcern[]): Promise<void>`: Saves new concerns to the database.
*   `updateConcernStatus(concernId: string, status: ConcernStatus, notes?: string): Promise<void>`: Updates the status of a concern.

### QueryGenerationEngine

**Location:** `src/worker/lib/query-generation-engine.ts`

**Description:** This class generates optimized search queries from extracted content for academic search.

**Primary Methods:**

*   `generateQueries(content: ExtractedContent[], options: QueryGenerationOptions = {}): SearchQuery[]`: Generates search queries from extracted content.
*   `optimizeQuery(query: string, keywords: string[], topics: string[]): QueryOptimization`: Optimizes a query for academic search effectiveness.
*   `combineQueries(queries: SearchQuery[]): SearchQuery`: Combines multiple search queries into a single query.
*   `validateQuery(query: string): ValidationResult`: Validates the quality of a query and provides suggestions for improvement.
*   `refineQuery(query: string, originalContent: ExtractedContent[]): QueryRefinement`: Performs a comprehensive query refinement analysis.
