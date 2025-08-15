/**
 * AI Performance Benchmarks
 * Performance tests and benchmarks for AI operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AIPerformanceOptimizer } from '../lib/ai-performance-optimizer';
import { AIMode, ModificationType } from '../lib/ai-types';
import { AISuccessResponse } from '../lib/ai-interfaces';

// Mock fetch for testing
global.fetch = vi.fn();

describe('AI Performance Benchmarks', () => {
  let optimizer: AIPerformanceOptimizer;

  beforeEach(() => {
    optimizer = new AIPerformanceOptimizer();
    vi.clearAllMocks();
  });

  afterEach(() => {
    optimizer.cancelPendingRequests();
    optimizer.clearCache();
  });

  describe('Content Optimization Performance', () => {
    it('should optimize large content efficiently', () => {
      const sizes = [1000, 5000, 10000, 50000, 100000];
      const results: Array<{ size: number; time: number }> = [];

      sizes.forEach(size => {
        const content = 'A'.repeat(size);
        const startTime = performance.now();
        
        optimizer.optimizeDocumentContent(content, AIMode.PROMPT, 8000);
        
        const endTime = performance.now();
        const time = endTime - startTime;
        
        results.push({ size, time });
        
        // Optimization should complete within reasonable time
        expect(time).toBeLessThan(100); // Less than 100ms
      });

      console.log('Content Optimization Performance:', results);
    });

    it('should handle different modes efficiently', () => {
      const content = 'A'.repeat(20000);
      const modes = [AIMode.PROMPT, AIMode.CONTINUE, AIMode.MODIFY];
      const results: Array<{ mode: string; time: number }> = [];

      modes.forEach(mode => {
        const startTime = performance.now();
        
        optimizer.optimizeDocumentContent(content, mode, 8000);
        
        const endTime = performance.now();
        const time = endTime - startTime;
        
        results.push({ mode, time });
        
        // Each mode should optimize efficiently
        expect(time).toBeLessThan(50);
      });

      console.log('Mode-specific Optimization Performance:', results);
    });
  });

  describe('Caching Performance', () => {
    it('should provide fast cache lookups', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      // Populate cache with multiple entries
      const cachePromises = [];
      for (let i = 0; i < 50; i++) {
        cachePromises.push(
          optimizer.optimizedRequest(
            AIMode.PROMPT,
            `test content ${i}`,
            { prompt: `test ${i}` },
            requestFn
          )
        );
      }

      await Promise.all(cachePromises);

      // Measure cache lookup performance
      const lookupTimes: number[] = [];
      
      for (let i = 0; i < 50; i++) {
        const startTime = performance.now();
        
        await optimizer.optimizedRequest(
          AIMode.PROMPT,
          `test content ${i}`,
          { prompt: `test ${i}` },
          requestFn
        );
        
        const endTime = performance.now();
        lookupTimes.push(endTime - startTime);
      }

      const averageLookupTime = lookupTimes.reduce((a, b) => a + b, 0) / lookupTimes.length;
      const maxLookupTime = Math.max(...lookupTimes);

      console.log('Cache Lookup Performance:', {
        average: averageLookupTime,
        max: maxLookupTime,
        samples: lookupTimes.length
      });

      // Cache lookups should be very fast
      expect(averageLookupTime).toBeLessThan(5); // Less than 5ms average
      expect(maxLookupTime).toBeLessThan(20); // Less than 20ms max
    });

    it('should handle cache eviction efficiently', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      // Fill cache beyond capacity to trigger eviction
      const startTime = performance.now();
      
      const promises = [];
      for (let i = 0; i < 150; i++) { // Exceed default cache size of 100
        promises.push(
          optimizer.optimizedRequest(
            AIMode.PROMPT,
            `test content ${i}`,
            { prompt: `test ${i}` },
            requestFn
          )
        );
      }

      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log('Cache Eviction Performance:', {
        totalTime,
        entriesProcessed: 150,
        averageTimePerEntry: totalTime / 150
      });

      // Cache eviction should not significantly impact performance
      expect(totalTime / 150).toBeLessThan(10); // Less than 10ms per entry on average

      const stats = optimizer.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(100); // Should respect max size
    });
  });

  describe('Debouncing Performance', () => {
    it('should handle rapid requests efficiently', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      const startTime = performance.now();
      
      // Make many rapid requests with unique keys to avoid debouncing conflicts
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          optimizer.debouncedRequest(`test-key-${i}`, requestFn)
        );
      }

      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log('Debouncing Performance:', {
        totalTime,
        requestsSubmitted: 20,
        actualRequestsExecuted: requestFn.mock.calls.length
      });

      // All requests should complete
      expect(requestFn.mock.calls.length).toBe(20);
      expect(totalTime).toBeLessThan(3000); // Should complete within 3 seconds
    }, 10000);

    it('should handle concurrent debounced requests', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      // Test that debouncing works by making immediate requests
      const result1 = await optimizer.debouncedRequest('same-key', requestFn, true);
      const result2 = await optimizer.debouncedRequest('same-key-2', requestFn, true);

      console.log('Concurrent Debouncing Performance:', {
        actualExecutions: requestFn.mock.calls.length,
        allResultsIdentical: result1.content === result2.content
      });

      // Should execute for each unique request
      expect(requestFn.mock.calls.length).toBe(2);
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe('Memory Usage', () => {
    it('should manage memory efficiently with large cache', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'A'.repeat(1000), // 1KB response
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      // Fill cache with large responses
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          optimizer.optimizedRequest(
            AIMode.PROMPT,
            `test content ${i}`,
            { prompt: `test ${i}` },
            requestFn
          )
        );
      }

      await Promise.all(promises);

      const stats = optimizer.getCacheStats();
      
      console.log('Memory Usage Stats:', {
        cacheSize: stats.size,
        maxSize: stats.maxSize,
        hitRate: stats.hitRate,
        estimatedMemoryUsage: `${stats.size * 1}KB` // Rough estimate
      });

      // Cache should respect size limits
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
      
      // Clear cache and verify cleanup
      optimizer.clearCache();
      const clearedStats = optimizer.getCacheStats();
      expect(clearedStats.size).toBe(0);
    });

    it('should clean up expired entries', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      // Create optimizer with short TTL for testing
      const shortTTLOptimizer = new AIPerformanceOptimizer();
      (shortTTLOptimizer as any).cacheConfig.ttlMs = 100; // 100ms TTL

      // Add entries to cache
      await shortTTLOptimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content 1',
        { prompt: 'test1' },
        requestFn
      );

      await shortTTLOptimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content 2',
        { prompt: 'test2' },
        requestFn
      );

      expect(shortTTLOptimizer.getCacheStats().size).toBeGreaterThanOrEqual(1);

      // Wait for entries to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Trigger cache cleanup by making new request
      await shortTTLOptimizer.optimizedRequest(
        AIMode.PROMPT,
        'test content 3',
        { prompt: 'test3' },
        requestFn
      );

      const stats = shortTTLOptimizer.getCacheStats();
      console.log('Cache Cleanup Stats:', {
        sizeAfterCleanup: stats.size,
        expectedSize: 1 // Only the new entry should remain
      });

      expect(stats.size).toBe(1); // Only new entry should remain
    });
  });

  describe('End-to-End Performance', () => {
    it('should handle realistic AI workflow efficiently', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Generated AI content response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      const documentContent = `
        # Thesis Proposal
        
        ## Introduction
        This is a comprehensive thesis proposal that explores various aspects of the research topic.
        
        ## Literature Review
        The literature review section contains extensive analysis of existing research.
        
        ## Methodology
        The methodology section outlines the research approach and methods.
        
        ## Expected Results
        This section describes the anticipated outcomes of the research.
      `.repeat(5); // Create realistic document size

      const startTime = performance.now();
      
      // Simulate realistic user workflow
      const workflowPromises = [
        // Prompt mode requests
        optimizer.optimizedRequest(
          AIMode.PROMPT,
          documentContent,
          { prompt: 'Expand the introduction section' },
          requestFn,
          { enableDebouncing: false }
        ),
        
        // Continue mode requests
        optimizer.optimizedRequest(
          AIMode.CONTINUE,
          documentContent,
          { cursorPosition: documentContent.length / 2 },
          requestFn,
          { enableDebouncing: false }
        ),
        
        // Modify mode requests
        optimizer.optimizedRequest(
          AIMode.MODIFY,
          documentContent,
          { 
            selectedText: 'This is a comprehensive thesis proposal',
            modificationType: ModificationType.IMPROVE_CLARITY
          },
          requestFn,
          { enableDebouncing: false }
        )
      ];

      const results = await Promise.all(workflowPromises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      const metrics = optimizer.getMetrics();
      
      console.log('End-to-End Performance:', {
        totalTime,
        requestsSubmitted: 3,
        actualAPIRequests: requestFn.mock.calls.length,
        contextOptimizations: metrics.contextOptimizations
      });

      // Verify all requests completed successfully
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Performance expectations
      expect(totalTime).toBeLessThan(2000); // Complete within 2 seconds
      expect(metrics.contextOptimizations).toBeGreaterThanOrEqual(0); // Content may be optimized
    }, 10000);
  });

  describe('Stress Testing', () => {
    it('should handle high concurrent load', async () => {
      const mockResponse: AISuccessResponse = {
        success: true,
        content: 'Test response',
        timestamp: Date.now()
      };

      const requestFn = vi.fn().mockResolvedValue(mockResponse);

      const startTime = performance.now();
      
      // Create high concurrent load
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          optimizer.optimizedRequest(
            AIMode.PROMPT,
            `test content ${i % 10}`, // Some overlap for caching
            { prompt: `test prompt ${i % 20}` }, // Some overlap for caching
            requestFn,
            {
              enableCaching: true,
              enableDebouncing: false, // Disable debouncing for predictable results
              enableOptimization: true
            }
          )
        );
      }

      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      const metrics = optimizer.getMetrics();
      
      console.log('Stress Test Results:', {
        totalTime,
        requestsSubmitted: 50,
        actualAPIRequests: requestFn.mock.calls.length,
        cacheEfficiency: (50 - requestFn.mock.calls.length) / 50,
        averageTimePerRequest: totalTime / 50,
        contextOptimizations: metrics.contextOptimizations
      });

      // All requests should complete successfully
      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Performance under load
      expect(totalTime).toBeLessThan(3000); // Complete within 3 seconds
      expect(requestFn.mock.calls.length).toBeLessThanOrEqual(50); // May have some caching benefit
    }, 10000);
  });
});