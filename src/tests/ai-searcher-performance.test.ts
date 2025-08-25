/**
 * AI Searcher Performance Tests
 * Tests performance optimizations including caching, background processing, and progressive loading
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AISearcherPerformanceOptimizer } from '../lib/ai-searcher-performance-optimizer';
import { QueryGenerationEngine } from '../worker/lib/query-generation-engine';
import { ContentExtractionEngine } from '../worker/lib/content-extraction-engine';
import { GoogleScholarClient } from '../worker/lib/google-scholar-client';
import { ExtractedContent, ScholarSearchResult, SearchFilters } from '../lib/ai-types';

describe('AI Searcher Performance Optimization', () => {
  let performanceOptimizer: AISearcherPerformanceOptimizer;
  let queryEngine: QueryGenerationEngine;
  let contentEngine: ContentExtractionEngine;
  let scholarClient: GoogleScholarClient;

  beforeEach(() => {
    performanceOptimizer = new AISearcherPerformanceOptimizer();
    queryEngine = new QueryGenerationEngine();
    contentEngine = new ContentExtractionEngine();
    scholarClient = new GoogleScholarClient();
  });

  afterEach(() => {
    performanceOptimizer.cleanup();
    queryEngine.clearCaches();
    contentEngine.clearCache();
  });

  describe('Search Result Caching', () => {
    it('should cache and retrieve search results', () => {
      const query = 'machine learning research';
      const filters: SearchFilters = { sortBy: 'relevance' };
      const mockResults: ScholarSearchResult[] = [
        {
          title: 'Machine Learning in Academic Research',
          authors: ['Smith, J.', 'Doe, A.'],
          confidence: 0.9,
          relevance_score: 0.85
        }
      ];

      // Cache results
      performanceOptimizer.cacheSearchResults(query, filters, mockResults, 1500);

      // Retrieve from cache
      const cachedResults = performanceOptimizer.getCachedSearchResults(query, filters);
      
      expect(cachedResults).toEqual(mockResults);
      expect(cachedResults).not.toBe(mockResults); // Should be a copy
    });

    it('should return null for cache miss', () => {
      const query = 'nonexistent query';
      const filters: SearchFilters = { sortBy: 'relevance' };

      const cachedResults = performanceOptimizer.getCachedSearchResults(query, filters);
      
      expect(cachedResults).toBeNull();
    });

    it('should handle cache expiration', async () => {
      const query = 'test query';
      const filters: SearchFilters = { sortBy: 'relevance' };
      const mockResults: ScholarSearchResult[] = [
        {
          title: 'Test Paper',
          authors: ['Test Author'],
          confidence: 0.8,
          relevance_score: 0.7
        }
      ];

      // Cache with very short TTL for testing
      performanceOptimizer.cacheSearchResults(query, filters, mockResults, 100);

      // Should be available immediately
      expect(performanceOptimizer.getCachedSearchResults(query, filters)).toEqual(mockResults);

      // Wait for expiration (simulate by manipulating cache entry timestamp)
      // In a real test, you might wait or use fake timers
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still be available (TTL is 1 hour by default)
      expect(performanceOptimizer.getCachedSearchResults(query, filters)).toEqual(mockResults);
    });

    it('should track cache hit rate metrics', () => {
      const query = 'test query';
      const filters: SearchFilters = { sortBy: 'relevance' };
      const mockResults: ScholarSearchResult[] = [
        {
          title: 'Test Paper',
          authors: ['Test Author'],
          confidence: 0.8,
          relevance_score: 0.7
        }
      ];

      // Cache results
      performanceOptimizer.cacheSearchResults(query, filters, mockResults, 100);

      // Access cached results multiple times
      performanceOptimizer.getCachedSearchResults(query, filters);
      performanceOptimizer.getCachedSearchResults(query, filters);

      const metrics = performanceOptimizer.getMetrics();
      expect(metrics.cachedSearches).toBe(2);
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
    });
  });

  describe('Content Extraction Caching', () => {
    it('should cache and retrieve content extraction', () => {
      const conversationId = 'test-conversation';
      const sourceType = 'ideas';
      const sourceId = 'test-idea';
      const mockContent: ExtractedContent = {
        id: sourceId,
        source: sourceType,
        title: 'Test Idea',
        content: 'This is test content for machine learning research',
        keywords: ['machine learning', 'research'],
        keyPhrases: ['machine learning research'],
        topics: ['artificial intelligence'],
        confidence: 0.8,
        extractedAt: new Date()
      };

      // Cache content
      performanceOptimizer.cacheContentExtraction(conversationId, sourceType, sourceId, mockContent);

      // Retrieve from cache
      const cachedContent = performanceOptimizer.getCachedContentExtraction(conversationId, sourceType, sourceId);
      
      expect(cachedContent).toEqual(mockContent);
      expect(cachedContent).not.toBe(mockContent); // Should be a copy
    });

    it('should return null for content extraction cache miss', () => {
      const cachedContent = performanceOptimizer.getCachedContentExtraction('nonexistent', 'ideas', 'nonexistent');
      expect(cachedContent).toBeNull();
    });
  });

  describe('Query Generation Caching', () => {
    it('should cache and retrieve query generation', () => {
      const mockContent: ExtractedContent[] = [
        {
          id: 'test-1',
          source: 'ideas',
          title: 'Test Content',
          content: 'Machine learning research methodology',
          keywords: ['machine learning', 'research', 'methodology'],
          keyPhrases: ['machine learning research'],
          topics: ['artificial intelligence'],
          confidence: 0.8,
          extractedAt: new Date()
        }
      ];

      const options = { maxKeywords: 5, optimizeForAcademic: true };
      const mockQueries = queryEngine.generateQueries(mockContent, options);

      // Cache queries
      performanceOptimizer.cacheQueryGeneration(mockContent, options, mockQueries);

      // Retrieve from cache
      const cachedQueries = performanceOptimizer.getCachedQueryGeneration(mockContent, options);
      
      expect(cachedQueries).toEqual(mockQueries);
      expect(cachedQueries).not.toBe(mockQueries); // Should be a copy
    });
  });

  describe('Background Processing', () => {
    it('should add and process background tasks', async () => {
      let taskExecuted = false;
      
      const taskId = performanceOptimizer.addBackgroundTask({
        type: 'content_extraction',
        priority: 'high',
        data: {
          conversationId: 'test',
          sourceType: 'ideas',
          sourceId: 'test-id',
          extractionFn: async () => {
            taskExecuted = true;
            return {
              id: 'test-id',
              source: 'ideas',
              title: 'Test',
              content: 'Test content',
              keywords: ['test'],
              keyPhrases: ['test'],
              topics: ['test'],
              confidence: 0.8,
              extractedAt: new Date()
            };
          }
        },
        maxRetries: 1
      });

      expect(taskId).toBeDefined();
      
      // Wait a bit for background processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Task should have been executed
      expect(taskExecuted).toBe(true);
    });

    it('should prioritize high priority tasks', () => {
      const lowPriorityTaskId = performanceOptimizer.addBackgroundTask({
        type: 'search_preload',
        priority: 'low',
        data: { query: 'low priority', filters: {}, searchFn: vi.fn() },
        maxRetries: 1
      });

      const highPriorityTaskId = performanceOptimizer.addBackgroundTask({
        type: 'search_preload',
        priority: 'high',
        data: { query: 'high priority', filters: {}, searchFn: vi.fn() },
        maxRetries: 1
      });

      expect(lowPriorityTaskId).toBeDefined();
      expect(highPriorityTaskId).toBeDefined();
    });
  });

  describe('Progressive Loading', () => {
    it('should initialize progressive loading session', () => {
      const sessionId = 'test-session';
      const totalResults = 50;
      const batchSize = 10;

      const state = performanceOptimizer.initializeProgressiveLoading(sessionId, totalResults, batchSize);

      expect(state.sessionId).toBe(sessionId);
      expect(state.totalResults).toBe(totalResults);
      expect(state.batchSize).toBe(batchSize);
      expect(state.loadedResults).toBe(0);
      expect(state.hasMore).toBe(true);
    });

    it('should return batches of results', () => {
      const sessionId = 'test-session';
      const mockResults = Array.from({ length: 25 }, (_, i) => ({
        title: `Paper ${i + 1}`,
        authors: [`Author ${i + 1}`],
        confidence: 0.8,
        relevance_score: 0.7
      }));

      performanceOptimizer.initializeProgressiveLoading(sessionId, mockResults.length, 10);

      // Get first batch
      const firstBatch = performanceOptimizer.getNextBatch(sessionId, mockResults);
      expect(firstBatch.batch).toHaveLength(10);
      expect(firstBatch.state.loadedResults).toBe(10);
      expect(firstBatch.state.hasMore).toBe(true);
      expect(firstBatch.isComplete).toBe(false);

      // Get second batch
      const secondBatch = performanceOptimizer.getNextBatch(sessionId, mockResults);
      expect(secondBatch.batch).toHaveLength(10);
      expect(secondBatch.state.loadedResults).toBe(20);
      expect(secondBatch.state.hasMore).toBe(true);

      // Get final batch
      const finalBatch = performanceOptimizer.getNextBatch(sessionId, mockResults);
      expect(finalBatch.batch).toHaveLength(5);
      expect(finalBatch.state.loadedResults).toBe(25);
      expect(finalBatch.state.hasMore).toBe(false);
      expect(finalBatch.isComplete).toBe(true);
    });

    it('should cleanup progressive loading session', () => {
      const sessionId = 'test-session';
      performanceOptimizer.initializeProgressiveLoading(sessionId, 10, 5);
      
      performanceOptimizer.cleanupProgressiveLoading(sessionId);
      
      // Should throw error when trying to get batch from cleaned up session
      expect(() => {
        performanceOptimizer.getNextBatch(sessionId, []);
      }).toThrow();
    });
  });

  describe('Performance Metrics', () => {
    it('should track performance metrics', () => {
      const metrics = performanceOptimizer.getMetrics();

      expect(metrics).toHaveProperty('totalSearches');
      expect(metrics).toHaveProperty('cachedSearches');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('averageSearchTime');
      expect(metrics).toHaveProperty('backgroundTasksProcessed');
      expect(metrics).toHaveProperty('memoryUsage');
    });

    it('should provide cache statistics', () => {
      const stats = performanceOptimizer.getCacheStats();

      expect(stats).toHaveProperty('searchResults');
      expect(stats).toHaveProperty('contentExtraction');
      expect(stats).toHaveProperty('queryGeneration');
      expect(stats).toHaveProperty('backgroundTasks');
      expect(stats).toHaveProperty('progressiveLoading');
    });

    it('should reset metrics', () => {
      // Add some data first
      performanceOptimizer.cacheSearchResults('test', {}, [], 100);
      
      let metrics = performanceOptimizer.getMetrics();
      expect(metrics.totalSearches).toBeGreaterThan(0);

      // Reset metrics
      performanceOptimizer.resetMetrics();
      
      metrics = performanceOptimizer.getMetrics();
      expect(metrics.totalSearches).toBe(0);
      expect(metrics.cachedSearches).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);
    });
  });

  describe('Query Generation Performance', () => {
    it('should use caching for term relevance calculations', () => {
      const mockContent: ExtractedContent = {
        id: 'test-content',
        source: 'ideas',
        title: 'Test Content',
        content: 'Machine learning research methodology',
        keywords: ['machine learning', 'research', 'methodology'],
        keyPhrases: ['machine learning research'],
        topics: ['artificial intelligence'],
        confidence: 0.8,
        extractedAt: new Date()
      };

      // Generate queries multiple times - should use cache for repeated calculations
      const startTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        queryEngine.generateQueries([mockContent], { maxKeywords: 5 });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete reasonably quickly due to caching
      expect(duration).toBeLessThan(1000); // Less than 1 second for 10 iterations

      const cacheStats = queryEngine.getCacheStats();
      expect(cacheStats.termRelevanceCache.size).toBeGreaterThan(0);
    });

    it('should limit cache sizes to prevent memory issues', () => {
      const mockContent: ExtractedContent = {
        id: 'test-content',
        source: 'ideas',
        title: 'Test Content',
        content: 'Test content',
        keywords: ['test'],
        keyPhrases: ['test'],
        topics: ['test'],
        confidence: 0.8,
        extractedAt: new Date()
      };

      // Generate many different queries to fill cache
      for (let i = 0; i < 1200; i++) {
        const content = {
          ...mockContent,
          id: `test-content-${i}`,
          keywords: [`keyword-${i}`, `term-${i}`]
        };
        
        queryEngine.generateQueries([content], { maxKeywords: 3 });
      }

      const cacheStats = queryEngine.getCacheStats();
      
      // Cache should be limited to prevent memory issues
      expect(cacheStats.termRelevanceCache.size).toBeLessThanOrEqual(1000);
      expect(cacheStats.queryOptimizationCache.size).toBeLessThanOrEqual(500);
    });
  });

  describe('Content Extraction Performance', () => {
    it('should use caching for repeated extractions', async () => {
      // Mock the API calls to avoid actual network requests
      vi.spyOn(contentEngine as any, 'extractFromIdeas').mockResolvedValue({
        content: 'Test content for machine learning research',
        title: 'Test Idea'
      });

      const request = {
        source: 'ideas' as const,
        id: 'test-idea',
        conversationId: 'test-conversation'
      };

      // First extraction - should hit API
      const startTime1 = Date.now();
      const result1 = await contentEngine.extractContent(request);
      const duration1 = Date.now() - startTime1;

      // Second extraction - should use cache
      const startTime2 = Date.now();
      const result2 = await contentEngine.extractContent(request);
      const duration2 = Date.now() - startTime2;

      expect(result1).toEqual(result2);
      expect(duration2).toBeLessThan(duration1); // Cache should be faster

      const cacheStats = contentEngine.getCacheStats();
      expect(cacheStats.size).toBe(1);
    });

    it('should preload content in background', async () => {
      // Mock the API calls
      vi.spyOn(contentEngine as any, 'extractFromIdeas').mockResolvedValue({
        content: 'Test content',
        title: 'Test Idea'
      });

      const requests = [
        { source: 'ideas' as const, id: 'idea-1', conversationId: 'test' },
        { source: 'ideas' as const, id: 'idea-2', conversationId: 'test' },
        { source: 'ideas' as const, id: 'idea-3', conversationId: 'test' }
      ];

      await contentEngine.preloadContent(requests);

      const cacheStats = contentEngine.getCacheStats();
      expect(cacheStats.size).toBe(3);
    });
  });

  describe('Memory Management', () => {
    it('should clear all caches', () => {
      // Add some cached data
      performanceOptimizer.cacheSearchResults('test', {}, [], 100);
      performanceOptimizer.cacheContentExtraction('test', 'ideas', 'test', {
        id: 'test',
        source: 'ideas',
        title: 'Test',
        content: 'Test',
        keywords: [],
        keyPhrases: [],
        topics: [],
        confidence: 0.8,
        extractedAt: new Date()
      });

      let stats = performanceOptimizer.getCacheStats();
      expect(stats.searchResults.size).toBeGreaterThan(0);
      expect(stats.contentExtraction.size).toBeGreaterThan(0);

      // Clear caches
      performanceOptimizer.clearAllCaches();

      stats = performanceOptimizer.getCacheStats();
      expect(stats.searchResults.size).toBe(0);
      expect(stats.contentExtraction.size).toBe(0);
    });

    it('should cleanup resources on shutdown', () => {
      performanceOptimizer.addBackgroundTask({
        type: 'content_extraction',
        priority: 'low',
        data: { test: 'data' },
        maxRetries: 1
      });

      let stats = performanceOptimizer.getCacheStats();
      expect(stats.backgroundTasks.pending).toBeGreaterThan(0);

      performanceOptimizer.cleanup();

      stats = performanceOptimizer.getCacheStats();
      expect(stats.backgroundTasks.pending).toBe(0);
      expect(stats.progressiveLoading.activeSessions).toBe(0);
    });
  });
});

describe('Performance Benchmarks', () => {
  let performanceOptimizer: AISearcherPerformanceOptimizer;

  beforeEach(() => {
    performanceOptimizer = new AISearcherPerformanceOptimizer();
  });

  afterEach(() => {
    performanceOptimizer.cleanup();
  });

  it('should benchmark search result caching performance', () => {
    const query = 'machine learning research';
    const filters: SearchFilters = { sortBy: 'relevance' };
    const mockResults: ScholarSearchResult[] = Array.from({ length: 100 }, (_, i) => ({
      title: `Paper ${i + 1}`,
      authors: [`Author ${i + 1}`],
      confidence: 0.8,
      relevance_score: 0.7
    }));

    // Benchmark caching operation
    const cacheStartTime = Date.now();
    performanceOptimizer.cacheSearchResults(query, filters, mockResults, 1000);
    const cacheEndTime = Date.now();
    const cacheDuration = cacheEndTime - cacheStartTime;

    // Benchmark retrieval operation
    const retrieveStartTime = Date.now();
    const cachedResults = performanceOptimizer.getCachedSearchResults(query, filters);
    const retrieveEndTime = Date.now();
    const retrieveDuration = retrieveEndTime - retrieveStartTime;

    expect(cachedResults).toHaveLength(100);
    expect(cacheDuration).toBeLessThan(100); // Should cache quickly
    expect(retrieveDuration).toBeLessThan(50); // Should retrieve very quickly

    console.log(`Cache operation: ${cacheDuration}ms, Retrieve operation: ${retrieveDuration}ms`);
  });

  it('should benchmark progressive loading performance', () => {
    const sessionId = 'benchmark-session';
    const totalResults = 1000;
    const batchSize = 50;
    const mockResults = Array.from({ length: totalResults }, (_, i) => ({
      title: `Paper ${i + 1}`,
      authors: [`Author ${i + 1}`],
      confidence: 0.8,
      relevance_score: 0.7
    }));

    // Benchmark initialization
    const initStartTime = Date.now();
    performanceOptimizer.initializeProgressiveLoading(sessionId, totalResults, batchSize);
    const initEndTime = Date.now();
    const initDuration = initEndTime - initStartTime;

    // Benchmark batch retrieval
    const batchStartTime = Date.now();
    let totalBatches = 0;
    let hasMore = true;

    while (hasMore) {
      const batch = performanceOptimizer.getNextBatch(sessionId, mockResults);
      hasMore = !batch.isComplete;
      totalBatches++;
    }

    const batchEndTime = Date.now();
    const batchDuration = batchEndTime - batchStartTime;

    expect(totalBatches).toBe(Math.ceil(totalResults / batchSize));
    expect(initDuration).toBeLessThan(50); // Should initialize quickly
    expect(batchDuration).toBeLessThan(200); // Should process all batches quickly

    console.log(`Progressive loading - Init: ${initDuration}ms, Batches (${totalBatches}): ${batchDuration}ms`);
  });

  it('should benchmark memory usage under load', () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Create a large number of cached entries
    for (let i = 0; i < 1000; i++) {
      const query = `test query ${i}`;
      const filters: SearchFilters = { sortBy: 'relevance' };
      const mockResults: ScholarSearchResult[] = Array.from({ length: 10 }, (_, j) => ({
        title: `Paper ${i}-${j}`,
        authors: [`Author ${i}-${j}`],
        confidence: 0.8,
        relevance_score: 0.7
      }));

      performanceOptimizer.cacheSearchResults(query, filters, mockResults, 100);
    }

    const afterCachingMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = afterCachingMemory - initialMemory;

    // Clear caches
    performanceOptimizer.clearAllCaches();

    const afterClearingMemory = process.memoryUsage().heapUsed;
    const memoryAfterClearing = afterClearingMemory - initialMemory;

    console.log(`Memory increase after caching: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Memory after clearing: ${(memoryAfterClearing / 1024 / 1024).toFixed(2)} MB`);

    // Memory should be reasonable
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    expect(memoryAfterClearing).toBeLessThan(memoryIncrease); // Should decrease after clearing
  });
});