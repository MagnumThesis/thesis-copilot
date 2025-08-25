/**
 * AI Performance Optimizer
 * Implements performance optimizations for AI operations including debouncing, caching, and context optimization
 */

import { AIResponse, AISuccessResponse, AIErrorResponse } from './ai-interfaces';
import { AIMode, ModificationType } from './ai-types';

// Cache entry interface
interface CacheEntry {
  response: AIResponse;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

// Cache configuration
interface CacheConfig {
  maxSize: number;
  ttlMs: number; // Time to live in milliseconds
  maxAccessCount: number; // Maximum access count before eviction
}

// Debounce configuration
interface DebounceConfig {
  delayMs: number;
  maxWaitMs: number; // Maximum time to wait before forcing execution
}

// Performance metrics interface
export interface PerformanceMetrics {
  cacheHitRate: number;
  averageResponseTime: number;
  totalRequests: number;
  cachedRequests: number;
  debouncedRequests: number;
  contextOptimizations: number;
}

// Request fingerprint for caching
interface RequestFingerprint {
  mode: AIMode;
  contentHash: string;
  parametersHash: string;
}

// Optimistic update interface
export interface OptimisticUpdate {
  id: string;
  mode: AIMode;
  timestamp: number;
  estimatedContent?: string;
  isProcessing: boolean;
}

/**
 * AI Performance Optimizer class
 * Handles caching, debouncing, and performance optimizations for AI requests
 */
/**
 * @class AIPerformanceOptimizer
 * @description Handles caching, debouncing, and performance optimizations for AI requests.
 */
export class AIPerformanceOptimizer {
  private cache = new Map<string, CacheEntry>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private pendingRequests = new Map<string, Promise<AIResponse>>();
  private metrics: PerformanceMetrics = {
    cacheHitRate: 0,
    averageResponseTime: 0,
    totalRequests: 0,
    cachedRequests: 0,
    debouncedRequests: 0,
    contextOptimizations: 0
  };

  private readonly cacheConfig: CacheConfig = {
    maxSize: 100,
    ttlMs: 30 * 60 * 1000, // 30 minutes
    maxAccessCount: 10
  };

  private readonly debounceConfig: DebounceConfig = {
    delayMs: 300,
    maxWaitMs: 2000
  };

  /**
   * Create a fingerprint for request caching
   */
  private createRequestFingerprint(
    mode: AIMode,
    content: string,
    parameters: Record<string, any>
  ): RequestFingerprint {
    // Create content hash (simple hash for performance)
    const contentHash = this.simpleHash(content);
    
    // Create parameters hash
    const parametersString = JSON.stringify(parameters, Object.keys(parameters).sort());
    const parametersHash = this.simpleHash(parametersString);

    return {
      mode,
      contentHash,
      parametersHash
    };
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
   * Generate cache key from request fingerprint
   */
  private getCacheKey(fingerprint: RequestFingerprint): string {
    return `${fingerprint.mode}:${fingerprint.contentHash}:${fingerprint.parametersHash}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheEntryValid(entry: CacheEntry): boolean {
    const now = Date.now();
    const isNotExpired = (now - entry.timestamp) < this.cacheConfig.ttlMs;
    const hasAccessesLeft = entry.accessCount < this.cacheConfig.maxAccessCount;
    
    return isNotExpired && hasAccessesLeft;
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheEntryValid(entry)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // If cache is still too large, remove least recently used entries
    if (this.cache.size > this.cacheConfig.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
      
      const entriesToRemove = entries.slice(0, entries.length - this.cacheConfig.maxSize);
      entriesToRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Get cached response if available
   */
  private getCachedResponse(cacheKey: string): AIResponse | null {
    const entry = this.cache.get(cacheKey);
    
    if (!entry || !this.isCacheEntryValid(entry)) {
      if (entry) {
        this.cache.delete(cacheKey);
      }
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.metrics.cachedRequests++;
    this.updateCacheHitRate();

    return entry.response;
  }

  /**
   * Cache response
   */
  private cacheResponse(cacheKey: string, response: AIResponse): void {
    // Only cache successful responses
    if (!response.success) {
      return;
    }

    const entry: CacheEntry = {
      response,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.cache.set(cacheKey, entry);
    this.cleanCache();
  }

  /**
   * Update cache hit rate metric
   */
  private updateCacheHitRate(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.cacheHitRate = this.metrics.cachedRequests / this.metrics.totalRequests;
    }
  }

  /**
   * Optimize document content for AI processing
   */
  /**
   * @method optimizeDocumentContent
   * @description Optimize document content for AI processing.
   * @param {string} content - The content to optimize.
   * @param {AIMode} mode - The AI mode.
   * @param {number} [maxLength=8000] - The maximum length of the content.
   * @returns {string} The optimized content.
   */
  public optimizeDocumentContent(content: string, mode: AIMode, maxLength: number = 8000): string {
    if (content.length <= maxLength) {
      return content;
    }

    this.metrics.contextOptimizations++;

    // Different optimization strategies based on mode
    switch (mode) {
      case AIMode.PROMPT:
        // For prompt mode, keep the most recent content and structure
        return this.optimizeForPromptMode(content, maxLength);
      
      case AIMode.CONTINUE:
        // For continue mode, focus on content around cursor position
        return this.optimizeForContinueMode(content, maxLength);
      
      case AIMode.MODIFY:
        // For modify mode, keep context around selected text
        return this.optimizeForModifyMode(content, maxLength);
      
      default:
        // Default: keep beginning and end, truncate middle
        return this.optimizeDefault(content, maxLength);
    }
  }

  /**
   * Optimize content for prompt mode
   */
  private optimizeForPromptMode(content: string, maxLength: number): string {
    // Keep document structure (headings) and recent content
    const lines = content.split('\n');
    const headings = lines.filter(line => line.startsWith('#'));
    const recentContent = lines.slice(-Math.floor(maxLength / 50)); // Approximate line count
    
    const optimized = [...headings, '...', ...recentContent].join('\n');
    
    if (optimized.length <= maxLength) {
      return optimized;
    }
    
    // If still too long, truncate from the middle
    return this.optimizeDefault(optimized, maxLength);
  }

  /**
   * Optimize content for continue mode
   */
  private optimizeForContinueMode(content: string, maxLength: number): string {
    // Keep the last portion of content for context
    const keepLength = Math.floor(maxLength * 0.8);
    const startIndex = Math.max(0, content.length - keepLength);
    
    // Try to start at a paragraph boundary
    const paragraphStart = content.indexOf('\n\n', startIndex);
    const actualStart = paragraphStart !== -1 ? paragraphStart + 2 : startIndex;
    
    return content.substring(actualStart);
  }

  /**
   * Optimize content for modify mode
   */
  private optimizeForModifyMode(content: string, maxLength: number): string {
    // For modify mode, we typically have selected text context
    // Keep surrounding context around the selection
    const contextLength = Math.floor(maxLength / 2);
    
    if (content.length <= maxLength) {
      return content;
    }
    
    // Keep beginning and end context
    const beginningContext = content.substring(0, contextLength);
    const endContext = content.substring(content.length - contextLength);
    
    return beginningContext + '\n\n...[content truncated]...\n\n' + endContext;
  }

  /**
   * Default content optimization
   */
  private optimizeDefault(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    
    const keepLength = Math.floor((maxLength - 100) / 2); // Leave room for truncation message
    const beginning = content.substring(0, keepLength);
    const end = content.substring(content.length - keepLength);
    
    return beginning + '\n\n...[content truncated for performance]...\n\n' + end;
  }

  /**
   * Create optimistic update for immediate UI feedback
   */
  /**
   * @method createOptimisticUpdate
   * @description Create optimistic update for immediate UI feedback.
   * @param {AIMode} mode - The AI mode.
   * @param {Record<string, any>} parameters - The request parameters.
   * @returns {OptimisticUpdate} The optimistic update.
   */
  public createOptimisticUpdate(
    mode: AIMode,
    parameters: Record<string, any>
  ): OptimisticUpdate {
    const id = crypto.randomUUID();
    
    let estimatedContent = '';
    
    // Generate estimated content based on mode
    switch (mode) {
      case AIMode.PROMPT:
        estimatedContent = this.generatePromptEstimate(parameters.prompt);
        break;
      case AIMode.CONTINUE:
        estimatedContent = this.generateContinueEstimate(parameters.documentContent);
        break;
      case AIMode.MODIFY:
        estimatedContent = this.generateModifyEstimate(
          parameters.selectedText,
          parameters.modificationType
        );
        break;
    }

    return {
      id,
      mode,
      timestamp: Date.now(),
      estimatedContent,
      isProcessing: true
    };
  }

  /**
   * Generate estimated content for prompt mode
   */
  private generatePromptEstimate(prompt: string): string {
    // Simple estimation based on prompt length and type
    const words = prompt.split(' ').length;
    const estimatedLength = Math.max(words * 2, 50); // Rough estimate
    
    return `[Generating content for: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"]`;
  }

  /**
   * Generate estimated content for continue mode
   */
  private generateContinueEstimate(documentContent: string): string {
    // Analyze the last sentence to estimate continuation
    const sentences = documentContent.split(/[.!?]+/).filter(s => s.trim());
    const lastSentence = sentences[sentences.length - 1]?.trim() || '';
    
    if (lastSentence.length > 0) {
      return `[Continuing from: "${lastSentence.substring(0, 30)}..."]`;
    }
    
    return '[Generating continuation...]';
  }

  /**
   * Generate estimated content for modify mode
   */
  private generateModifyEstimate(selectedText: string, modificationType: ModificationType): string {
    const preview = selectedText.substring(0, 30) + (selectedText.length > 30 ? '...' : '');
    
    switch (modificationType) {
      case ModificationType.REWRITE:
        return `[Rewriting: "${preview}"]`;
      case ModificationType.EXPAND:
        return `[Expanding: "${preview}"]`;
      case ModificationType.SUMMARIZE:
        return `[Summarizing: "${preview}"]`;
      case ModificationType.IMPROVE_CLARITY:
        return `[Improving clarity: "${preview}"]`;
      case ModificationType.PROMPT:
        return `[Modifying: "${preview}"]`;
      default:
        return `[Processing: "${preview}"]`;
    }
  }

  /**
   * Debounced AI request execution
   */
  /**
   * @method debouncedRequest
   * @description Debounced AI request execution.
   * @template T
   * @param {string} requestKey - The key for the request.
   * @param {() => Promise<T>} requestFn - The function to execute.
   * @param {boolean} [forceImmediate=false] - Whether to force immediate execution.
   * @returns {Promise<T>} The response.
   */
  public async debouncedRequest<T extends AIResponse>(
    requestKey: string,
    requestFn: () => Promise<T>,
    forceImmediate: boolean = false
  ): Promise<T> {
    // If force immediate, execute right away
    if (forceImmediate) {
      return this.executeRequest(requestKey, requestFn);
    }

    // Check if there's already a pending request
    const pendingRequest = this.pendingRequests.get(requestKey);
    if (pendingRequest) {
      return pendingRequest as Promise<T>;
    }

    // Clear existing timer for this request
    const existingTimer = this.debounceTimers.get(requestKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set up debounced execution
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(requestKey);
        this.metrics.debouncedRequests++;
        
        try {
          const result = await this.executeRequest(requestKey, requestFn);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, this.debounceConfig.delayMs);

      this.debounceTimers.set(requestKey, timer);
    });
  }

  /**
   * Execute request with caching and metrics
   */
  private async executeRequest<T extends AIResponse>(
    requestKey: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cachedResponse = this.getCachedResponse(requestKey);
      if (cachedResponse) {
        return cachedResponse as T;
      }

      // Execute request
      const requestPromise = requestFn();
      this.pendingRequests.set(requestKey, requestPromise);

      const response = await requestPromise;
      
      // Update metrics for all requests
      this.metrics.totalRequests++;
      const responseTime = Date.now() - startTime;
      this.updateAverageResponseTime(responseTime);
      
      // Cache successful responses
      if (response.success) {
        this.cacheResponse(requestKey, response);
      }

      return response;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Update average response time metric
   */
  private updateAverageResponseTime(responseTime: number): void {
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1);
    this.metrics.averageResponseTime = (totalTime + responseTime) / this.metrics.totalRequests;
  }

  /**
   * Optimized AI request with all performance features
   */
  /**
   * @method optimizedRequest
   * @description Optimized AI request with all performance features.
   * @template T
   * @param {AIMode} mode - The AI mode.
   * @param {string} documentContent - The content of the document.
   * @param {Record<string, any>} parameters - The request parameters.
   * @param {() => Promise<T>} requestFn - The function to execute.
   * @param {object} [options] - The options for the request.
   * @param {boolean} [options.enableCaching=true] - Whether to enable caching.
   * @param {boolean} [options.enableDebouncing=true] - Whether to enable debouncing.
   * @param {boolean} [options.enableOptimization=true] - Whether to enable content optimization.
   * @param {boolean} [options.forceImmediate=false] - Whether to force immediate execution.
   * @returns {Promise<T>} The response.
   */
  public async optimizedRequest<T extends AIResponse>(
    mode: AIMode,
    documentContent: string,
    parameters: Record<string, any>,
    requestFn: () => Promise<T>,
    options: {
      enableCaching?: boolean;
      enableDebouncing?: boolean;
      enableOptimization?: boolean;
      forceImmediate?: boolean;
    } = {}
  ): Promise<T> {
    const {
      enableCaching = true,
      enableDebouncing = true,
      enableOptimization = true,
      forceImmediate = false
    } = options;

    // Optimize document content if enabled
    const optimizedContent = enableOptimization
      ? this.optimizeDocumentContent(documentContent, mode)
      : documentContent;

    // Create request fingerprint for caching
    const fingerprint = this.createRequestFingerprint(mode, optimizedContent, parameters);
    const cacheKey = this.getCacheKey(fingerprint);

    // Check cache if enabled
    if (enableCaching) {
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        return cachedResponse as T;
      }
    }

    // Create optimized request function
    const optimizedRequestFn = () => requestFn();

    // Execute with or without debouncing
    if (enableDebouncing && !forceImmediate) {
      return this.debouncedRequest(cacheKey, optimizedRequestFn, forceImmediate);
    } else {
      return this.executeRequest(cacheKey, optimizedRequestFn);
    }
  }

  /**
   * Get current performance metrics
   */
  /**
   * @method getMetrics
   * @description Get current performance metrics.
   * @returns {PerformanceMetrics} The performance metrics.
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  /**
   * @method resetMetrics
   * @description Reset performance metrics.
   */
  public resetMetrics(): void {
    this.metrics = {
      cacheHitRate: 0,
      averageResponseTime: 0,
      totalRequests: 0,
      cachedRequests: 0,
      debouncedRequests: 0,
      contextOptimizations: 0
    };
  }

  /**
   * Clear all caches
   */
  /**
   * @method clearCache
   * @description Clear all caches.
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Cancel all pending debounced requests
   */
  /**
   * @method cancelPendingRequests
   * @description Cancel all pending debounced requests.
   */
  public cancelPendingRequests(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.pendingRequests.clear();
  }

  /**
   * Get cache statistics
   */
  /**
   * @method getCacheStats
   * @description Get cache statistics.
   * @returns {{size: number, maxSize: number, hitRate: number, oldestEntry: number, newestEntry: number}} The cache statistics.
   */
  public getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(entry => entry.timestamp);
    
    return {
      size: this.cache.size,
      maxSize: this.cacheConfig.maxSize,
      hitRate: this.metrics.cacheHitRate,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }
}

// Global instance for use across the application
export const aiPerformanceOptimizer = new AIPerformanceOptimizer();