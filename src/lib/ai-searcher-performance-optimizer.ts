/**
 * AI Searcher Performance Optimizer
 * Implements performance optimizations for AI-powered academic search including
 * result caching, background processing, and progressive loading
 */

import { ScholarSearchResult, ExtractedContent, SearchFilters } from './ai-types';
import { SearchQuery, QueryGenerationOptions } from '../worker/lib/query-generation-engine';

// Cache entry for search results
interface SearchResultCacheEntry {
  query: string;
  filters: SearchFilters;
  results: ScholarSearchResult[];
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  contentHash: string;
  processingTimeMs: number;
}

// Cache entry for content extraction
interface ContentExtractionCacheEntry {
  conversationId: string;
  sourceType: 'ideas' | 'builder';
  sourceId: string;
  extractedContent: ExtractedContent;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  contentHash: string;
}

// Cache entry for query generation
interface QueryGenerationCacheEntry {
  contentHash: string;
  options: QueryGenerationOptions;
  queries: SearchQuery[];
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

// Background processing task
interface BackgroundTask {
  id: string;
  type: 'content_extraction' | 'query_generation' | 'search_preload';
  priority: 'low' | 'medium' | 'high';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Progressive loading state
interface ProgressiveLoadingState {
  sessionId: string;
  totalResults: number;
  loadedResults: number;
  batchSize: number;
  isLoading: boolean;
  hasMore: boolean;
  nextBatchIndex: number;
}

// Performance metrics
export interface SearchPerformanceMetrics {
  totalSearches: number;
  cachedSearches: number;
  cacheHitRate: number;
  averageSearchTime: number;
  averageContentExtractionTime: number;
  averageQueryGenerationTime: number;
  backgroundTasksProcessed: number;
  progressiveLoadingSessions: number;
  memoryUsage: number;
}

// Cache configuration
interface CacheConfig {
  searchResults: {
    maxSize: number;
    ttlMs: number;
    maxAccessCount: number;
  };
  contentExtraction: {
    maxSize: number;
    ttlMs: number;
    maxAccessCount: number;
  };
  queryGeneration: {
    maxSize: number;
    ttlMs: number;
    maxAccessCount: number;
  };
}

/**
 * AI Searcher Performance Optimizer
 * Handles caching, background processing, and progressive loading for search operations
 */
export class AISearcherPerformanceOptimizer {
  private searchResultsCache = new Map<string, SearchResultCacheEntry>();
  private contentExtractionCache = new Map<string, ContentExtractionCacheEntry>();
  private queryGenerationCache = new Map<string, QueryGenerationCacheEntry>();
  
  private backgroundTaskQueue: BackgroundTask[] = [];
  private isProcessingBackground = false;
  private backgroundWorkerInterval: NodeJS.Timeout | null = null;
  
  private progressiveLoadingStates = new Map<string, ProgressiveLoadingState>();
  
  private metrics: SearchPerformanceMetrics = {
    totalSearches: 0,
    cachedSearches: 0,
    cacheHitRate: 0,
    averageSearchTime: 0,
    averageContentExtractionTime: 0,
    averageQueryGenerationTime: 0,
    backgroundTasksProcessed: 0,
    progressiveLoadingSessions: 0,
    memoryUsage: 0
  };

  private readonly cacheConfig: CacheConfig = {
    searchResults: {
      maxSize: 200, // Cache up to 200 search result sets
      ttlMs: 60 * 60 * 1000, // 1 hour TTL for search results
      maxAccessCount: 10 // Results can be accessed up to 10 times
    },
    contentExtraction: {
      maxSize: 500, // Cache up to 500 content extractions
      ttlMs: 4 * 60 * 60 * 1000, // 4 hours TTL for content extraction
      maxAccessCount: 20 // Content can be accessed up to 20 times
    },
    queryGeneration: {
      maxSize: 300, // Cache up to 300 query generations
      ttlMs: 2 * 60 * 60 * 1000, // 2 hours TTL for query generation
      maxAccessCount: 15 // Queries can be accessed up to 15 times
    }
  };

  constructor() {
    // Start background processing worker
    this.startBackgroundWorker();
  }

  /**
   * Create content hash for caching
   */
  private createContentHash(content: any): string {
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    return this.simpleHash(contentString);
  }

  /**
   * Simple hash function for creating cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate cache key for search results
   */
  private getSearchResultsCacheKey(query: string, filters: SearchFilters): string {
    const filtersHash = this.createContentHash(filters);
    const queryHash = this.createContentHash(query.toLowerCase().trim());
    return `search:${queryHash}:${filtersHash}`;
  }

  /**
   * Generate cache key for content extraction
   */
  private getContentExtractionCacheKey(
    conversationId: string, 
    sourceType: 'ideas' | 'builder', 
    sourceId: string
  ): string {
    return `content:${conversationId}:${sourceType}:${sourceId}`;
  }

  /**
   * Generate cache key for query generation
   */
  private getQueryGenerationCacheKey(
    contentHash: string, 
    options: QueryGenerationOptions
  ): string {
    const optionsHash = this.createContentHash(options);
    return `query:${contentHash}:${optionsHash}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheEntryValid<T extends { timestamp: number; accessCount: number }>(
    entry: T, 
    config: { ttlMs: number; maxAccessCount: number }
  ): boolean {
    const now = Date.now();
    const isNotExpired = (now - entry.timestamp) < config.ttlMs;
    const hasAccessesLeft = entry.accessCount < config.maxAccessCount;
    
    return isNotExpired && hasAccessesLeft;
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache<T extends { timestamp: number; accessCount: number }>(
    cache: Map<string, T>,
    config: { maxSize: number; ttlMs: number; maxAccessCount: number }
  ): void {
    const keysToDelete: string[] = [];

    // Remove expired entries
    for (const [key, entry] of cache.entries()) {
      if (!this.isCacheEntryValid(entry, config)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => cache.delete(key));

    // If cache is still too large, remove least recently used entries
    if (cache.size > config.maxSize) {
      const entries = Array.from(cache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
      
      const entriesToRemove = entries.slice(0, entries.length - config.maxSize);
      entriesToRemove.forEach(([key]) => cache.delete(key));
    }
  }

  /**
   * Get cached search results
   */
  public getCachedSearchResults(query: string, filters: SearchFilters): ScholarSearchResult[] | null {
    const cacheKey = this.getSearchResultsCacheKey(query, filters);
    const entry = this.searchResultsCache.get(cacheKey);
    
    if (!entry || !this.isCacheEntryValid(entry, this.cacheConfig.searchResults)) {
      if (entry) {
        this.searchResultsCache.delete(cacheKey);
      }
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.metrics.cachedSearches++;
    this.updateCacheHitRate();

    return [...entry.results]; // Return a copy to prevent mutation
  }

  /**
   * Cache search results
   */
  public cacheSearchResults(
    query: string, 
    filters: SearchFilters, 
    results: ScholarSearchResult[],
    processingTimeMs: number
  ): void {
    const cacheKey = this.getSearchResultsCacheKey(query, filters);
    const contentHash = this.createContentHash({ query, filters });

    const entry: SearchResultCacheEntry = {
      query,
      filters: { ...filters },
      results: [...results], // Store a copy to prevent mutation
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      contentHash,
      processingTimeMs
    };

    this.searchResultsCache.set(cacheKey, entry);
    this.cleanCache(this.searchResultsCache, this.cacheConfig.searchResults);
    
    // Update metrics for new search
    this.updateAverageSearchTime(processingTimeMs);
  }

  /**
   * Get cached content extraction
   */
  public getCachedContentExtraction(
    conversationId: string, 
    sourceType: 'ideas' | 'builder', 
    sourceId: string
  ): ExtractedContent | null {
    const cacheKey = this.getContentExtractionCacheKey(conversationId, sourceType, sourceId);
    const entry = this.contentExtractionCache.get(cacheKey);
    
    if (!entry || !this.isCacheEntryValid(entry, this.cacheConfig.contentExtraction)) {
      if (entry) {
        this.contentExtractionCache.delete(cacheKey);
      }
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return { ...entry.extractedContent }; // Return a copy to prevent mutation
  }

  /**
   * Cache content extraction
   */
  public cacheContentExtraction(
    conversationId: string, 
    sourceType: 'ideas' | 'builder', 
    sourceId: string,
    extractedContent: ExtractedContent
  ): void {
    const cacheKey = this.getContentExtractionCacheKey(conversationId, sourceType, sourceId);
    const contentHash = this.createContentHash(extractedContent.content);

    const entry: ContentExtractionCacheEntry = {
      conversationId,
      sourceType,
      sourceId,
      extractedContent: { ...extractedContent },
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      contentHash
    };

    this.contentExtractionCache.set(cacheKey, entry);
    this.cleanCache(this.contentExtractionCache, this.cacheConfig.contentExtraction);
  }

  /**
   * Get cached query generation
   */
  public getCachedQueryGeneration(
    content: ExtractedContent[], 
    options: QueryGenerationOptions
  ): SearchQuery[] | null {
    const contentHash = this.createContentHash(content);
    const cacheKey = this.getQueryGenerationCacheKey(contentHash, options);
    const entry = this.queryGenerationCache.get(cacheKey);
    
    if (!entry || !this.isCacheEntryValid(entry, this.cacheConfig.queryGeneration)) {
      if (entry) {
        this.queryGenerationCache.delete(cacheKey);
      }
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.queries.map(q => ({ ...q })); // Return a copy to prevent mutation
  }

  /**
   * Cache query generation
   */
  public cacheQueryGeneration(
    content: ExtractedContent[], 
    options: QueryGenerationOptions,
    queries: SearchQuery[]
  ): void {
    const contentHash = this.createContentHash(content);
    const cacheKey = this.getQueryGenerationCacheKey(contentHash, options);

    const entry: QueryGenerationCacheEntry = {
      contentHash,
      options: { ...options },
      queries: queries.map(q => ({ ...q })),
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.queryGenerationCache.set(cacheKey, entry);
    this.cleanCache(this.queryGenerationCache, this.cacheConfig.queryGeneration);
  }

  /**
   * Add background task to queue
   */
  public addBackgroundTask(task: Omit<BackgroundTask, 'id' | 'timestamp' | 'retryCount' | 'status'>): string {
    const taskId = crypto.randomUUID();
    const backgroundTask: BackgroundTask = {
      id: taskId,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
      ...task
    };

    // Insert task based on priority
    const insertIndex = this.backgroundTaskQueue.findIndex(t => 
      this.getPriorityValue(t.priority) < this.getPriorityValue(task.priority)
    );

    if (insertIndex === -1) {
      this.backgroundTaskQueue.push(backgroundTask);
    } else {
      this.backgroundTaskQueue.splice(insertIndex, 0, backgroundTask);
    }

    return taskId;
  }

  /**
   * Get priority value for sorting
   */
  private getPriorityValue(priority: 'low' | 'medium' | 'high'): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  /**
   * Start background worker
   */
  private startBackgroundWorker(): void {
    if (this.backgroundWorkerInterval) {
      return;
    }

    this.backgroundWorkerInterval = setInterval(async () => {
      await this.processBackgroundTasks();
    }, 1000); // Process tasks every second
  }

  /**
   * Stop background worker
   */
  public stopBackgroundWorker(): void {
    if (this.backgroundWorkerInterval) {
      clearInterval(this.backgroundWorkerInterval);
      this.backgroundWorkerInterval = null;
    }
  }

  /**
   * Process background tasks
   */
  private async processBackgroundTasks(): Promise<void> {
    if (this.isProcessingBackground || this.backgroundTaskQueue.length === 0) {
      return;
    }

    this.isProcessingBackground = true;

    try {
      // Process up to 3 tasks per cycle
      const tasksToProcess = this.backgroundTaskQueue.splice(0, 3);

      for (const task of tasksToProcess) {
        try {
          task.status = 'processing';
          await this.processBackgroundTask(task);
          task.status = 'completed';
          this.metrics.backgroundTasksProcessed++;
        } catch (error) {
          console.warn(`Background task ${task.id} failed:`, error);
          task.retryCount++;
          
          if (task.retryCount < task.maxRetries) {
            // Re-queue for retry with exponential backoff
            setTimeout(() => {
              task.status = 'pending';
              this.backgroundTaskQueue.push(task);
            }, Math.pow(2, task.retryCount) * 1000);
          } else {
            task.status = 'failed';
            console.error(`Background task ${task.id} failed after ${task.maxRetries} retries`);
          }
        }
      }
    } finally {
      this.isProcessingBackground = false;
    }
  }

  /**
   * Process individual background task
   */
  private async processBackgroundTask(task: BackgroundTask): Promise<void> {
    switch (task.type) {
      case 'content_extraction':
        await this.processContentExtractionTask(task);
        break;
      case 'query_generation':
        await this.processQueryGenerationTask(task);
        break;
      case 'search_preload':
        await this.processSearchPreloadTask(task);
        break;
      default:
        throw new Error(`Unknown background task type: ${(task as any).type}`);
    }
  }

  /**
   * Process content extraction background task
   */
  private async processContentExtractionTask(task: BackgroundTask): Promise<void> {
    const { conversationId, sourceType, sourceId, extractionFn } = task.data;
    
    // Check if already cached
    const cached = this.getCachedContentExtraction(conversationId, sourceType, sourceId);
    if (cached) {
      return; // Already cached
    }

    // Perform extraction
    const startTime = Date.now();
    const extractedContent = await extractionFn();
    const processingTime = Date.now() - startTime;

    // Cache the result
    this.cacheContentExtraction(conversationId, sourceType, sourceId, extractedContent);
    
    // Update metrics
    this.updateAverageContentExtractionTime(processingTime);
  }

  /**
   * Process query generation background task
   */
  private async processQueryGenerationTask(task: BackgroundTask): Promise<void> {
    const { content, options, generationFn } = task.data;
    
    // Check if already cached
    const cached = this.getCachedQueryGeneration(content, options);
    if (cached) {
      return; // Already cached
    }

    // Perform generation
    const startTime = Date.now();
    const queries = await generationFn();
    const processingTime = Date.now() - startTime;

    // Cache the result
    this.cacheQueryGeneration(content, options, queries);
    
    // Update metrics
    this.updateAverageQueryGenerationTime(processingTime);
  }

  /**
   * Process search preload background task
   */
  private async processSearchPreloadTask(task: BackgroundTask): Promise<void> {
    const { query, filters, searchFn } = task.data;
    
    // Check if already cached
    const cached = this.getCachedSearchResults(query, filters);
    if (cached) {
      return; // Already cached
    }

    // Perform search
    const startTime = Date.now();
    const results = await searchFn();
    const processingTime = Date.now() - startTime;

    // Cache the result
    this.cacheSearchResults(query, filters, results, processingTime);
    
    // Update metrics
    this.updateAverageSearchTime(processingTime);
  }

  /**
   * Initialize progressive loading session
   */
  public initializeProgressiveLoading(
    sessionId: string,
    totalResults: number,
    batchSize: number = 10
  ): ProgressiveLoadingState {
    const state: ProgressiveLoadingState = {
      sessionId,
      totalResults,
      loadedResults: 0,
      batchSize,
      isLoading: false,
      hasMore: totalResults > 0,
      nextBatchIndex: 0
    };

    this.progressiveLoadingStates.set(sessionId, state);
    this.metrics.progressiveLoadingSessions++;

    return state;
  }

  /**
   * Get next batch for progressive loading
   */
  public getNextBatch<T>(sessionId: string, allResults: T[]): {
    batch: T[];
    state: ProgressiveLoadingState;
    isComplete: boolean;
  } {
    const state = this.progressiveLoadingStates.get(sessionId);
    if (!state) {
      throw new Error(`Progressive loading session ${sessionId} not found`);
    }

    if (!state.hasMore || state.isLoading) {
      return {
        batch: [],
        state,
        isComplete: !state.hasMore
      };
    }

    state.isLoading = true;

    const startIndex = state.nextBatchIndex;
    const endIndex = Math.min(startIndex + state.batchSize, allResults.length);
    const batch = allResults.slice(startIndex, endIndex);

    state.loadedResults += batch.length;
    state.nextBatchIndex = endIndex;
    state.hasMore = endIndex < allResults.length;
    state.isLoading = false;

    return {
      batch,
      state,
      isComplete: !state.hasMore
    };
  }

  /**
   * Clean up progressive loading session
   */
  public cleanupProgressiveLoading(sessionId: string): void {
    this.progressiveLoadingStates.delete(sessionId);
  }

  /**
   * Update cache hit rate metric
   */
  private updateCacheHitRate(): void {
    // Include both cached and non-cached searches in total
    const totalSearchRequests = this.metrics.totalSearches + this.metrics.cachedSearches;
    if (totalSearchRequests > 0) {
      this.metrics.cacheHitRate = this.metrics.cachedSearches / totalSearchRequests;
    }
  }

  /**
   * Update average search time metric
   */
  private updateAverageSearchTime(searchTime: number): void {
    this.metrics.totalSearches++;
    
    if (this.metrics.totalSearches === 1) {
      this.metrics.averageSearchTime = searchTime;
    } else {
      const totalTime = this.metrics.averageSearchTime * (this.metrics.totalSearches - 1);
      this.metrics.averageSearchTime = (totalTime + searchTime) / this.metrics.totalSearches;
    }
  }

  /**
   * Update average content extraction time metric
   */
  private updateAverageContentExtractionTime(extractionTime: number): void {
    const currentAvg = this.metrics.averageContentExtractionTime;
    const count = this.contentExtractionCache.size;
    
    if (count === 1) {
      this.metrics.averageContentExtractionTime = extractionTime;
    } else {
      this.metrics.averageContentExtractionTime = 
        ((currentAvg * (count - 1)) + extractionTime) / count;
    }
  }

  /**
   * Update average query generation time metric
   */
  private updateAverageQueryGenerationTime(generationTime: number): void {
    const currentAvg = this.metrics.averageQueryGenerationTime;
    const count = this.queryGenerationCache.size;
    
    if (count === 1) {
      this.metrics.averageQueryGenerationTime = generationTime;
    } else {
      this.metrics.averageQueryGenerationTime = 
        ((currentAvg * (count - 1)) + generationTime) / count;
    }
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): SearchPerformanceMetrics {
    // Calculate memory usage estimate
    const searchCacheSize = this.searchResultsCache.size * 50; // Rough estimate in KB
    const contentCacheSize = this.contentExtractionCache.size * 20;
    const queryCacheSize = this.queryGenerationCache.size * 10;
    
    return {
      ...this.metrics,
      memoryUsage: searchCacheSize + contentCacheSize + queryCacheSize
    };
  }

  /**
   * Reset performance metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalSearches: 0,
      cachedSearches: 0,
      cacheHitRate: 0,
      averageSearchTime: 0,
      averageContentExtractionTime: 0,
      averageQueryGenerationTime: 0,
      backgroundTasksProcessed: 0,
      progressiveLoadingSessions: 0,
      memoryUsage: 0
    };
  }

  /**
   * Clear all caches
   */
  public clearAllCaches(): void {
    this.searchResultsCache.clear();
    this.contentExtractionCache.clear();
    this.queryGenerationCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    searchResults: { size: number; maxSize: number; hitRate: number };
    contentExtraction: { size: number; maxSize: number };
    queryGeneration: { size: number; maxSize: number };
    backgroundTasks: { pending: number; processing: number };
    progressiveLoading: { activeSessions: number };
  } {
    const processingTasks = this.backgroundTaskQueue.filter(t => t.status === 'processing').length;
    const pendingTasks = this.backgroundTaskQueue.filter(t => t.status === 'pending').length;

    return {
      searchResults: {
        size: this.searchResultsCache.size,
        maxSize: this.cacheConfig.searchResults.maxSize,
        hitRate: this.metrics.cacheHitRate
      },
      contentExtraction: {
        size: this.contentExtractionCache.size,
        maxSize: this.cacheConfig.contentExtraction.maxSize
      },
      queryGeneration: {
        size: this.queryGenerationCache.size,
        maxSize: this.cacheConfig.queryGeneration.maxSize
      },
      backgroundTasks: {
        pending: pendingTasks,
        processing: processingTasks
      },
      progressiveLoading: {
        activeSessions: this.progressiveLoadingStates.size
      }
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopBackgroundWorker();
    this.clearAllCaches();
    this.backgroundTaskQueue.length = 0;
    this.progressiveLoadingStates.clear();
  }
}

// Global instance for use across the application
export const aiSearcherPerformanceOptimizer = new AISearcherPerformanceOptimizer();