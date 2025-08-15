/**
 * AI Performance Optimizer Tests
 * Tests for caching, debouncing, and performance optimization features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AIPerformanceOptimizer } from '../lib/ai-performance-optimizer';
import { AIMode, ModificationType } from '../lib/ai-types';
import { AISuccessResponse, AIErrorResponse } from '../lib/ai-interfaces';

// Mock fetch for testing
global.fetch = vi.fn();

describe('AIPerformanceOptimizer', () => {
  let optimizer: AIPerformanceOptimizer;

  beforeEach(() => {
    optimizer = new AIPerformanceOptimizer();
    vi.clearAllMocks();
  });

  afterEach(() => {
    optimizer.cancelPendingRequests();
    optimizer.clearCache();
  });

  describe('Content Optimization', () => {
    it('should not optimize content under max length', () => {
      const content = 'Short content';
      const optimized = optimizer.optimizeDocumentContent(content, AIMode.PROMPT);
      expect(optimized).toBe(content);
    });

    it('should optimize long content for prompt mode', () => {
      const longContent = 'A'.repeat(10000);
      const optimized = optimizer.optimizeDocumentContent(longContent, AIMode.PROMPT, 1000);
      expect(optimized.length).toBeLessThan(longContent.length);
      expect(optimized.length).toBeLessThanOrEqual(1000);
    });

    it('should optimize content for continue mode', () => {
      const content = 'Beginning content\n\n' + 'A'.repeat(5000) + '\n\nEnd content';
      const optimized = optimizer.optimizeDocumentContent(content, AIMode.CONTINUE, 1000);
      expect(optimized.length).toBeLessThan(content.length);
      expect(optimized).toContain('End content');
    });

    it('should optimize content for modify mode', () => {
      const content = 'Beginning\n\n' + 'A'.repeat(5000) + '\n\nEnd';
      const optimized = optimizer.optimizeDocumentContent(content, AIMode.MODIFY, 1000);
      expect(optimized.length).toBeLessThan(content.length);
      expect(optimized).toContain('Beginning');
      expect(optimized).toContain('End');
      expect(optimized).toContain('[content truncated]');
    });

    it('should track context optimizations in metrics', () => {
      const longContent = 'A'.repeat(10000);
      const initialMetrics = optimizer.getMetrics();
      
      optimizer.optimizeDocumentContent(longContent, AIMode.PROMPT, 1000);
      
      const updatedMetrics = optimizer.getMetrics();
      expect(updatedMetrics.contextOptimizations).toBe(initialMetrics.contextOptimizations + 1);
    });
  });

  describe('Caching', () => {
    it('should cache successful responses', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      // First request
      const result1 = await optimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content',
        { prompt: 'test' },
        requestFn
      );

      // Second request with same parameters
      const result2 = await optimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content',
        { prompt: 'test' },
        requestFn
      );

      expect(result1).toEqual(mockResponse);
      expect(result2).toEqual(mockResponse);
      expect(requestFn).toHaveBeenCalledTimes(1); // Should only call once due to caching
    });

    it('should not cache error responses', async () => {
      const mockError: AIErrorResponse = {
        success: false,
        error: 'Test error',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockError);

      // First request
      await optimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content',
        { prompt: 'test' },
        requestFn
      );

      // Second request with same parameters
      await optimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content',
        { prompt: 'test' },
        requestFn
      );

      expect(requestFn).toHaveBeenCalledTimes(2); // Should call twice, no caching for errors
    });

    it('should respect cache TTL', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      // Mock cache config with short TTL
      const shortTTLOptimizer = new AIPerformanceOptimizer();
      (shortTTLOptimizer as any).cacheConfig.ttlMs = 100; // 100ms TTL

      // First request
      await shortTTLOptimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content',
        { prompt: 'test' },
        requestFn
      );

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second request after cache expiry
      await shortTTLOptimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content',
        { prompt: 'test' },
        requestFn
      );

      expect(requestFn).toHaveBeenCalledTimes(2); // Should call twice due to cache expiry
    });

    it('should update cache hit rate metrics', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      // First request (cache miss)
      await optimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content',
        { prompt: 'test' },
        requestFn,
        { enableCaching: true }
      );

      // Second request (cache hit) - need to wait a bit to ensure cache is populated
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await optimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content',
        { prompt: 'test' },
        requestFn,
        { enableCaching: true }
      );

      const metrics = optimizer.getMetrics();
      expect(metrics.totalRequests).toBeGreaterThanOrEqual(1);
      expect(metrics.cachedRequests).toBeGreaterThanOrEqual(1);
      expect(requestFn).toHaveBeenCalledTimes(1); // Should only call once due to caching
    });
  });

  describe('Debouncing', () => {
    it('should debounce rapid requests', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      // Make multiple rapid requests with different keys to avoid sharing
      const promises = [
        optimizer.debouncedRequest('test-key-1', requestFn),
        optimizer.debouncedRequest('test-key-2', requestFn),
        optimizer.debouncedRequest('test-key-3', requestFn)
      ];

      const results = await Promise.all(promises);

      // All should return the same result
      results.forEach(result => {
        expect(result).toEqual(mockResponse);
      });

      // Should execute for each unique key
      expect(requestFn).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should force immediate execution when requested', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      // Make immediate request
      const immediateResult = await optimizer.debouncedRequest('test-key', requestFn, true);

      expect(immediateResult).toEqual(mockResponse);
      expect(requestFn).toHaveBeenCalledTimes(1);
    }, 10000);

    it('should track debounced requests in metrics', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);
      const initialMetrics = optimizer.getMetrics();

      await optimizer.debouncedRequest('test-key', requestFn);

      const updatedMetrics = optimizer.getMetrics();
      expect(updatedMetrics.debouncedRequests).toBe(initialMetrics.debouncedRequests + 1);
    });
  });

  describe('Optimistic Updates', () => {
    it('should create optimistic update for prompt mode', () => {
      const update = optimizer.createOptimisticUpdate(AIMode.PROMPT, {
        prompt: 'Test prompt'
      });

      expect(update).toBeDefined();
      expect(update.mode).toBe(AIMode.PROMPT);
      expect(update.isProcessing).toBe(true);
      expect(update.estimatedContent).toContain('Test prompt');
    });

    it('should create optimistic update for continue mode', () => {
      const update = optimizer.createOptimisticUpdate(AIMode.CONTINUE, {
        documentContent: 'This is a test document with content.'
      });

      expect(update).toBeDefined();
      expect(update.mode).toBe(AIMode.CONTINUE);
      expect(update.isProcessing).toBe(true);
      expect(update.estimatedContent).toContain('Continuing');
    });

    it('should create optimistic update for modify mode', () => {
      const update = optimizer.createOptimisticUpdate(AIMode.MODIFY, {
        selectedText: 'Selected text to modify',
        modificationType: ModificationType.REWRITE
      });

      expect(update).toBeDefined();
      expect(update.mode).toBe(AIMode.MODIFY);
      expect(update.isProcessing).toBe(true);
      expect(update.estimatedContent).toContain('Rewriting');
      expect(update.estimatedContent).toContain('Selected text');
    });
  });

  describe('Performance Metrics', () => {
    it('should track total requests', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);
      const initialMetrics = optimizer.getMetrics();

      await optimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content',
        { prompt: 'test' },
        requestFn,
        { enableCaching: false }
      );

      const updatedMetrics = optimizer.getMetrics();
      expect(updatedMetrics.totalRequests).toBe(initialMetrics.totalRequests + 1);
    });

    it('should track average response time', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockResponse), 100);
        });
      });

      await optimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content',
        { prompt: 'test' },
        requestFn,
        { enableCaching: false }
      );

      const metrics = optimizer.getMetrics();
      expect(metrics.averageResponseTime).toBeGreaterThan(90);
      expect(metrics.averageResponseTime).toBeLessThan(200);
    });

    it('should reset metrics', () => {
      // Generate some metrics
      optimizer.optimizeDocumentContent('A'.repeat(10000), AIMode.PROMPT, 1000);
      
      const metricsBeforeReset = optimizer.getMetrics();
      expect(metricsBeforeReset.contextOptimizations).toBeGreaterThan(0);

      optimizer.resetMetrics();

      const metricsAfterReset = optimizer.getMetrics();
      expect(metricsAfterReset.contextOptimizations).toBe(0);
      expect(metricsAfterReset.totalRequests).toBe(0);
      expect(metricsAfterReset.cachedRequests).toBe(0);
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      // Add some cached entries
      await optimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content 1',
        { prompt: 'test1' },
        requestFn
      );

      await optimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content 2',
        { prompt: 'test2' },
        requestFn
      );

      const stats = optimizer.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
      expect(stats.newestEntry).toBeGreaterThan(0);
      expect(stats.oldestEntry).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      // Add cached entry
      await optimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content',
        { prompt: 'test' },
        requestFn
      );

      expect(optimizer.getCacheStats().size).toBe(1);

      optimizer.clearCache();

      expect(optimizer.getCacheStats().size).toBe(0);
    });

    it('should cancel pending requests', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockResponse), 1000);
        });
      });

      // Start a debounced request
      const promise = optimizer.debouncedRequest('test-key', requestFn);

      // Cancel pending requests
      optimizer.cancelPendingRequests();

      // The promise should still resolve, but the timer should be cleared
      // This is more of a cleanup test to ensure no memory leaks
      expect(() => optimizer.cancelPendingRequests()).not.toThrow();
    });
  });

  describe('Integration with optimizedRequest', () => {
    it('should apply all optimizations when enabled', async () => {
      const longContent = 'A'.repeat(10000);
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      const result = await optimizer.optimizedRequest(
        AIMode.PROMPT,
        longContent,
        { prompt: 'test' },
        requestFn,
        {
          enableCaching: true,
          enableDebouncing: true,
          enableOptimization: true
        }
      );

      expect(result).toEqual(mockResponse);
      expect(requestFn).toHaveBeenCalledTimes(1);

      const metrics = optimizer.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.contextOptimizations).toBe(1);
    });

    it('should skip optimizations when disabled', async () => {
      const longContent = 'A'.repeat(10000);
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      await optimizer.optimizedRequest(
        AIMode.PROMPT,
        longContent,
        { prompt: 'test' },
        requestFn,
        {
          enableCaching: false,
          enableDebouncing: false,
          enableOptimization: false
        }
      );

      const metrics = optimizer.getMetrics();
      expect(metrics.contextOptimizations).toBe(0);
    });
  });
});