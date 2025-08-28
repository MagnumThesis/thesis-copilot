/**
 * AI Performance Optimizer
 * Implements performance optimizations for AI operations including debouncing, caching, and context optimization
 */

import { AIResponse } from './ai-interfaces';
import { AIMode, ModificationType } from './ai-types';
import { CacheManager } from './performance/cache-manager';
import { DebounceManager } from './performance/debounce-manager';
import { MetricsCollector, PerformanceMetrics } from './performance/metrics-collector';
import { simpleHash } from './utils/text-utils';

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
  private cacheManager: CacheManager;
  private debounceManager: DebounceManager;
  private metricsCollector: MetricsCollector;

  constructor() {
    this.cacheManager = new CacheManager();
    this.debounceManager = new DebounceManager();
    this.metricsCollector = new MetricsCollector();
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

    this.metricsCollector.recordContextOptimization();

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

    // Create cache key for caching
    const cacheKey = this.cacheManager.createCacheKey(mode, optimizedContent, parameters);

    // Check cache if enabled
    if (enableCaching) {
      const cachedResponse = this.cacheManager.getCachedResponse(cacheKey);
      if (cachedResponse) {
        this.metricsCollector.recordCacheHit();
        return cachedResponse as T;
      }
    }

    // Create optimized request function
    const optimizedRequestFn = () => {
      // Record cache miss if caching is enabled
      if (enableCaching) {
        this.metricsCollector.recordCacheMiss();
      }
      return requestFn();
    };

    let response: T;

    // Execute with or without debouncing
    if (enableDebouncing && !forceImmediate) {
      this.metricsCollector.recordDebouncedRequest();
      response = await this.debounceManager.debouncedRequest(cacheKey, optimizedRequestFn, forceImmediate);
    } else {
      response = await optimizedRequestFn();
      this.metricsCollector.incrementTotalRequests();
    }

    // Cache successful responses
    if (enableCaching && response.success) {
      this.cacheManager.cacheResponse(cacheKey, response);
    }

    return response;
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
    return this.metricsCollector.getMetrics();
  }

  /**
   * Reset performance metrics
   */
  /**
   * @method resetMetrics
   * @description Reset performance metrics.
   */
  public resetMetrics(): void {
    this.metricsCollector.resetMetrics();
  }

  /**
   * Clear all caches
   */
  /**
   * @method clearCache
   * @description Clear all caches.
   */
  public clearCache(): void {
    this.cacheManager.clearCache();
  }

  /**
   * Cancel all pending debounced requests
   */
  /**
   * @method cancelPendingRequests
   * @description Cancel all pending debounced requests.
   */
  public cancelPendingRequests(): void {
    this.debounceManager.cancelPendingRequests();
  }

  /**
   * Get cache statistics
   */
  /**
   * @method getCacheStats
   * @description Get cache statistics.
   * @returns {{size: number, maxSize: number, hitRate: number, oldestEntry: number, newestEntry: number}} The cache statistics.
   */
  public getCacheStats() {
    return this.cacheManager.getCacheStats();
  }
}

// Global instance for use across the application
export const aiPerformanceOptimizer = new AIPerformanceOptimizer();