/**
 * Proofreader Performance Optimizer
 * Specialized performance optimizations for proofreader operations
 */

import { 
  ProofreadingConcern, 
  ConcernStatus, 
  ConcernCategory,
  ConcernSeverity,
  ProofreaderAnalysisRequest,
  ProofreaderAnalysisResponse,
  AnalysisMetadata
} from './ai-types';

// Cache entry for analysis results
interface AnalysisCacheEntry {
  request: ProofreaderAnalysisRequest;
  response: ProofreaderAnalysisResponse;
  timestamp: number;
  contentHash: string;
  accessCount: number;
  lastAccessed: number;
}

// Cache configuration for proofreader
interface ProofreaderCacheConfig {
  maxSize: number;
  ttlMs: number; // Time to live in milliseconds
  maxAccessCount: number;
  enableContentHashing: boolean;
}

// Performance metrics for proofreader operations
export interface ProofreaderPerformanceMetrics {
  totalAnalyses: number;
  cachedAnalyses: number;
  cacheHitRate: number;
  averageAnalysisTime: number;
  statusUpdatesDebounced: number;
  promptOptimizations: number;
  virtualScrollOptimizations: number;
}

// Status update queue entry
interface StatusUpdateEntry {
  concernId: string;
  status: ConcernStatus;
  timestamp: number;
  retryCount: number;
}

/**
 * @class ProofreaderPerformanceOptimizer
 * @description Handles caching, debouncing, and performance optimizations specific to proofreader operations.
 */
export class ProofreaderPerformanceOptimizer {
  private analysisCache = new Map<string, AnalysisCacheEntry>();
  private statusUpdateQueue = new Map<string, StatusUpdateEntry>();
  private statusUpdateTimers = new Map<string, NodeJS.Timeout>();
  private pendingAnalyses = new Map<string, Promise<ProofreaderAnalysisResponse>>();
  
  private metrics: ProofreaderPerformanceMetrics = {
    totalAnalyses: 0,
    cachedAnalyses: 0,
    cacheHitRate: 0,
    averageAnalysisTime: 0,
    statusUpdatesDebounced: 0,
    promptOptimizations: 0,
    virtualScrollOptimizations: 0
  };

  private readonly cacheConfig: ProofreaderCacheConfig = {
    maxSize: 50, // Smaller cache for analysis results
    ttlMs: 60 * 60 * 1000, // 1 hour TTL for analysis results
    maxAccessCount: 5, // Analysis results accessed less frequently
    enableContentHashing: true
  };

  private readonly debounceConfig = {
    statusUpdateDelayMs: 500, // Debounce status updates
    maxWaitMs: 2000,
    batchSize: 10 // Batch status updates
  };

  /**
   * Create content hash for caching analysis results
   */
  private createContentHash(request: ProofreaderAnalysisRequest): string {
    const contentToHash = {
      documentContent: request.documentContent,
      ideaDefinitions: request.ideaDefinitions?.map(idea => ({
        title: idea.title,
        description: idea.description
      })) || [],
      analysisOptions: request.analysisOptions || {}
    };
    
    return this.simpleHash(JSON.stringify(contentToHash));
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
   * Generate cache key for analysis request
   */
  private getCacheKey(request: ProofreaderAnalysisRequest): string {
    const contentHash = this.createContentHash(request);
    return `analysis:${request.conversationId}:${contentHash}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheEntryValid(entry: AnalysisCacheEntry): boolean {
    const now = Date.now();
    const isNotExpired = (now - entry.timestamp) < this.cacheConfig.ttlMs;
    const hasAccessesLeft = entry.accessCount < this.cacheConfig.maxAccessCount;
    
    return isNotExpired && hasAccessesLeft && entry.response.success;
  }

  /**
   * Clean expired cache entries
   */
  private cleanAnalysisCache(): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.analysisCache.entries()) {
      if (!this.isCacheEntryValid(entry)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.analysisCache.delete(key));

    // If cache is still too large, remove least recently used entries
    if (this.analysisCache.size > this.cacheConfig.maxSize) {
      const entries = Array.from(this.analysisCache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
      
      const entriesToRemove = entries.slice(0, entries.length - this.cacheConfig.maxSize);
      entriesToRemove.forEach(([key]) => this.analysisCache.delete(key));
    }
  }

  /**
   * Get cached analysis result if available
   */
  public getCachedAnalysis(request: ProofreaderAnalysisRequest): ProofreaderAnalysisResponse | null {
    const cacheKey = this.getCacheKey(request);
    const entry = this.analysisCache.get(cacheKey);
    
    if (!entry || !this.isCacheEntryValid(entry)) {
      if (entry) {
        this.analysisCache.delete(cacheKey);
      }
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.metrics.cachedAnalyses++;
    this.updateCacheHitRate();

    // Add cache metadata to response
    const cachedResponse: ProofreaderAnalysisResponse = {
      ...entry.response,
      analysisMetadata: {
        totalConcerns: entry.response.analysisMetadata?.totalConcerns || 0,
        concernsByCategory: entry.response.analysisMetadata?.concernsByCategory || {
          [ConcernCategory.CLARITY]: 0,
          [ConcernCategory.COHERENCE]: 0,
          [ConcernCategory.STRUCTURE]: 0,
          [ConcernCategory.STYLE]: 0,
          [ConcernCategory.ACADEMIC_TONE]: 0,
          [ConcernCategory.CITATION]: 0,
          [ConcernCategory.TERMINOLOGY]: 0,
          [ConcernCategory.COMPLETENESS]: 0,
          [ConcernCategory.GRAMMAR]: 0,
          [ConcernCategory.CONSISTENCY]: 0
        },
        fallbackUsed: entry.response.analysisMetadata?.fallbackUsed || false,
        cacheUsed: true,
        cacheTimestamp: entry.timestamp
      }
    };

    return cachedResponse;
  }

  /**
   * Cache analysis result
   */
  public cacheAnalysisResult(
    request: ProofreaderAnalysisRequest, 
    response: ProofreaderAnalysisResponse
  ): void {
    // Only cache successful responses
    if (!response.success || !response.concerns) {
      return;
    }

    const cacheKey = this.getCacheKey(request);
    const contentHash = this.createContentHash(request);

    const entry: AnalysisCacheEntry = {
      request,
      response,
      timestamp: Date.now(),
      contentHash,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.analysisCache.set(cacheKey, entry);
    this.cleanAnalysisCache();
  }

  /**
   * Update cache hit rate metric
   */
  private updateCacheHitRate(): void {
    if (this.metrics.totalAnalyses > 0) {
      this.metrics.cacheHitRate = this.metrics.cachedAnalyses / this.metrics.totalAnalyses;
    }
  }

  /**
   * Optimize analysis request for better performance
   */
  public optimizeAnalysisRequest(request: ProofreaderAnalysisRequest): ProofreaderAnalysisRequest {
    this.metrics.promptOptimizations++;

    const optimizedRequest = { ...request };

    // Optimize document content length
    if (request.documentContent.length > 15000) {
      optimizedRequest.documentContent = this.optimizeDocumentContent(
        request.documentContent,
        15000
      );
    }

    // Optimize idea definitions
    if (request.ideaDefinitions && request.ideaDefinitions.length > 20) {
      optimizedRequest.ideaDefinitions = request.ideaDefinitions
        .slice(0, 20) // Limit to most relevant ideas
        .map(idea => ({
          ...idea,
          description: idea.description.length > 500 
            ? idea.description.substring(0, 500) + '...'
            : idea.description
        }));
    }

    // Set optimized analysis options
    optimizedRequest.analysisOptions = {
      ...request.analysisOptions,
      // Focus on most important categories for faster processing
      categories: request.analysisOptions?.categories || [
        ConcernCategory.CLARITY, ConcernCategory.COHERENCE, ConcernCategory.STRUCTURE, ConcernCategory.ACADEMIC_TONE
      ],
      minSeverity: request.analysisOptions?.minSeverity || ConcernSeverity.MEDIUM
    };

    return optimizedRequest;
  }

  /**
   * Optimize document content for analysis
   */
  private optimizeDocumentContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Keep structure (headings) and distribute remaining space
    const lines = content.split('\n');
    const headings = lines.filter(line => line.match(/^#{1,6}\s+/));
    const headingContent = headings.join('\n');
    
    const remainingLength = maxLength - headingContent.length - 100; // Leave room for truncation message
    
    if (remainingLength <= 0) {
      return headingContent + '\n\n[Content truncated for performance]';
    }

    // Keep beginning and end of content
    const keepLength = Math.floor(remainingLength / 2);
    const beginning = content.substring(0, keepLength);
    const end = content.substring(content.length - keepLength);
    
    return beginning + '\n\n[Content truncated for performance]\n\n' + end;
  }

  /**
   * Debounced status update with batching
   */
  public async debouncedStatusUpdate(
    concernId: string,
    status: ConcernStatus,
    updateFn: (concernId: string, status: ConcernStatus) => Promise<void>
  ): Promise<void> {
    // Add to queue
    this.statusUpdateQueue.set(concernId, {
      concernId,
      status,
      timestamp: Date.now(),
      retryCount: 0
    });

    // Clear existing timer for this concern
    const existingTimer = this.statusUpdateTimers.get(concernId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set up debounced execution
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(async () => {
        this.statusUpdateTimers.delete(concernId);
        this.metrics.statusUpdatesDebounced++;
        
        try {
          await this.processBatchedStatusUpdates(updateFn);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, this.debounceConfig.statusUpdateDelayMs);

      this.statusUpdateTimers.set(concernId, timer);
    });
  }

  /**
   * Process batched status updates
   */
  private async processBatchedStatusUpdates(
    updateFn: (concernId: string, status: ConcernStatus) => Promise<void>
  ): Promise<void> {
    const updates = Array.from(this.statusUpdateQueue.values())
      .slice(0, this.debounceConfig.batchSize);

    if (updates.length === 0) return;

    // Process updates in parallel with error handling
    const promises = updates.map(async (update) => {
      try {
        await updateFn(update.concernId, update.status);
        this.statusUpdateQueue.delete(update.concernId);
      } catch (error) {
        // Retry logic for failed updates
        update.retryCount++;
        if (update.retryCount < 3) {
          // Keep in queue for retry
          console.warn(`Status update retry ${update.retryCount} for concern ${update.concernId}`);
          // Schedule retry with exponential backoff
          setTimeout(async () => {
            try {
              await updateFn(update.concernId, update.status);
              this.statusUpdateQueue.delete(update.concernId);
            } catch (retryError) {
              // Continue retry logic
              if (update.retryCount >= 3) {
                this.statusUpdateQueue.delete(update.concernId);
                console.error(`Status update failed after 3 retries for concern ${update.concernId}:`, retryError);
              }
            }
          }, Math.pow(2, update.retryCount) * 100);
        } else {
          // Remove after max retries
          this.statusUpdateQueue.delete(update.concernId);
          console.error(`Status update failed after 3 retries for concern ${update.concernId}:`, error);
        }
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Optimized analysis with caching and performance features
   */
  public async optimizedAnalysis(
    request: ProofreaderAnalysisRequest,
    analysisFn: (request: ProofreaderAnalysisRequest) => Promise<ProofreaderAnalysisResponse>,
    options: {
      enableCaching?: boolean;
      enableOptimization?: boolean;
      forceRefresh?: boolean;
    } = {}
  ): Promise<ProofreaderAnalysisResponse> {
    const {
      enableCaching = true,
      enableOptimization = true,
      forceRefresh = false
    } = options;

    const startTime = Date.now();
    this.metrics.totalAnalyses++;

    try {
      // Check cache first (unless force refresh)
      if (enableCaching && !forceRefresh) {
        const cachedResult = this.getCachedAnalysis(request);
        if (cachedResult) {
          return cachedResult;
        }
      }

      // Optimize request if enabled
      const optimizedRequest = enableOptimization 
        ? this.optimizeAnalysisRequest(request)
        : request;

      // Check for pending analysis with same content
      const cacheKey = this.getCacheKey(optimizedRequest);
      const pendingAnalysis = this.pendingAnalyses.get(cacheKey);
      if (pendingAnalysis) {
        return await pendingAnalysis;
      }

      // Execute analysis
      const analysisPromise = analysisFn(optimizedRequest);
      this.pendingAnalyses.set(cacheKey, analysisPromise);

      try {
        const result = await analysisPromise;
        
        // Update metrics
        const analysisTime = Date.now() - startTime;
        this.updateAverageAnalysisTime(analysisTime);
        
        // Cache successful results
        if (enableCaching && result.success) {
          this.cacheAnalysisResult(request, result);
        }

        return result;
      } finally {
        this.pendingAnalyses.delete(cacheKey);
      }

    } catch (error) {
      console.error('Optimized analysis failed:', error);
      throw error;
    }
  }

  /**
   * Update average analysis time metric
   */
  private updateAverageAnalysisTime(analysisTime: number): void {
    if (this.metrics.totalAnalyses === 1) {
      // First analysis
      this.metrics.averageAnalysisTime = analysisTime;
    } else {
      // Update running average
      const totalTime = this.metrics.averageAnalysisTime * (this.metrics.totalAnalyses - 1);
      this.metrics.averageAnalysisTime = (totalTime + analysisTime) / this.metrics.totalAnalyses;
    }
  }

  /**
   * Virtual scrolling optimization for concern lists
   */
  public optimizeForVirtualScrolling(
    concerns: ProofreadingConcern[],
    viewportHeight: number,
    itemHeight: number = 120
  ): {
    visibleConcerns: ProofreadingConcern[];
    startIndex: number;
    endIndex: number;
    totalHeight: number;
    offsetY: number;
  } {
    this.metrics.virtualScrollOptimizations++;

    const totalItems = concerns.length;

    // For now, return all items (virtual scrolling will be implemented in component)
    // This method provides the calculation logic for virtual scrolling
    return {
      visibleConcerns: concerns,
      startIndex: 0,
      endIndex: totalItems - 1,
      totalHeight: totalItems * itemHeight,
      offsetY: 0
    };
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): ProofreaderPerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalAnalyses: 0,
      cachedAnalyses: 0,
      cacheHitRate: 0,
      averageAnalysisTime: 0,
      statusUpdatesDebounced: 0,
      promptOptimizations: 0,
      virtualScrollOptimizations: 0
    };
  }

  /**
   * Clear analysis cache
   */
  public clearCache(): void {
    this.analysisCache.clear();
  }

  /**
   * Cancel pending operations
   */
  public cancelPendingOperations(): void {
    // Cancel status update timers
    for (const timer of this.statusUpdateTimers.values()) {
      clearTimeout(timer);
    }
    this.statusUpdateTimers.clear();
    this.statusUpdateQueue.clear();
    
    // Clear pending analyses
    this.pendingAnalyses.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
    pendingUpdates: number;
  } {
    const entries = Array.from(this.analysisCache.values());
    const timestamps = entries.map(entry => entry.timestamp);
    
    return {
      size: this.analysisCache.size,
      maxSize: this.cacheConfig.maxSize,
      hitRate: this.metrics.cacheHitRate,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
      pendingUpdates: this.statusUpdateQueue.size
    };
  }

  /**
   * Preload analysis for content
   */
  public async preloadAnalysis(
    request: ProofreaderAnalysisRequest,
    analysisFn: (request: ProofreaderAnalysisRequest) => Promise<ProofreaderAnalysisResponse>
  ): Promise<void> {
    // Check if already cached
    const cached = this.getCachedAnalysis(request);
    if (cached) {
      return;
    }

    // Perform analysis in background
    try {
      await this.optimizedAnalysis(request, analysisFn, {
        enableCaching: true,
        enableOptimization: true
      });
    } catch (error) {
      // Ignore preload errors
      console.warn('Preload analysis failed:', error);
    }
  }
}

// Global instance for use across the application
export const proofreaderPerformanceOptimizer = new ProofreaderPerformanceOptimizer();
