/**
 * Performance Tests for AI Operations
 * Comprehensive performance testing for all AI operations and optimizations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIPerformanceOptimizer } from '@/lib/ai-performance-optimizer';
import { AIMode, ModificationType } from '@/lib/ai-types';
import { AISuccessResponse } from '@/lib/ai-interfaces';

// Mock fetch for testing
global.fetch = vi.fn();

// Performance test utilities
const measurePerformance = async (operation: () => Promise<any>) => {
  const startTime = performance.now();
  const result = await operation();
  const endTime = performance.now();
  return {
    result,
    duration: endTime - startTime,
    timestamp: Date.now()
  };
};

const generateTestContent = (size: number) => {
  const baseText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ';
  return baseText.repeat(Math.ceil(size / baseText.length)).substring(0, size);
};

describe('AI Operations Performance Tests', () => {
  let optimizer: AIPerformanceOptimizer;

  beforeEach(() => {
    optimizer = new AIPerformanceOptimizer();
    vi.clearAllMocks();
    
    // Mock successful AI response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        content: 'AI generated content response',
        timestamp: Date.now()
      })
    });
  });

  afterEach(() => {
    optimizer.cancelPendingRequests();
    optimizer.clearCache();
  });

  describe('Content Processing Performance', () => {
    it('should process small content efficiently', async () => {
      const content = generateTestContent(1000); // 1KB
      
      const { duration } = await measurePerformance(async () => {
        return optimizer.optimizeDocumentContent(content, AIMode.PROMPT, 4000);
      });

      expect(duration).toBeLessThan(50); // Less than 50ms
      console.log(`Small content processing: ${duration.toFixed(2)}ms`);
    });

    it('should process medium content efficiently', async () => {
      const content = generateTestContent(10000); // 10KB
      
      const { duration } = await measurePerformance(async () => {
        return optimizer.optimizeDocumentContent(content, AIMode.PROMPT, 4000);
      });

      expect(duration).toBeLessThan(100); // Less than 100ms
      console.log(`Medium content processing: ${duration.toFixed(2)}ms`);
    });

    it('should process large content efficiently', async () => {
      const content = generateTestContent(100000); // 100KB
      
      const { duration } = await measurePerformance(async () => {
        return optimizer.optimizeDocumentContent(content, AIMode.PROMPT, 4000);
      });

      expect(duration).toBeLessThan(200); // Less than 200ms
      console.log(`Large content processing: ${duration.toFixed(2)}ms`);
    });

    it('should handle very large content with optimization', async () => {
      const content = generateTestContent(1000000); // 1MB
      
      const { duration, result } = await measurePerformance(async () => {
        return optimizer.optimizeDocumentContent(content, AIMode.PROMPT, 8000);
      });

      expect(duration).toBeLessThan(500); // Less than 500ms
      expect(result.length).toBeLessThan(content.length); // Should be optimized
      console.log(`Very large content processing: ${duration.toFixed(2)}ms, optimized from ${content.length} to ${result.length} chars`);
    });
  });

  describe('AI Request Performance', () => {
    it('should handle prompt requests efficiently', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'Prompt response'
      });

      const { duration } = await measurePerformance(async () => {
        return optimizer.optimizedRequest(
          AIMode.PROMPT,
          'Test document content',
          { prompt: 'Generate introduction' },
          mockRequestFn
        );
      });

      expect(duration).toBeLessThan(1000); // Less than 1 second
      expect(mockRequestFn).toHaveBeenCalledTimes(1);
      console.log(`Prompt request performance: ${duration.toFixed(2)}ms`);
    });

    it('should handle continue requests efficiently', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'Continue response'
      });

      const { duration } = await measurePerformance(async () => {
        return optimizer.optimizedRequest(
          AIMode.CONTINUE,
          'Existing document content for continuation...',
          { cursorPosition: 45 },
          mockRequestFn
        );
      });

      expect(duration).toBeLessThan(1000); // Less than 1 second
      expect(mockRequestFn).toHaveBeenCalledTimes(1);
      console.log(`Continue request performance: ${duration.toFixed(2)}ms`);
    });

    it('should handle modify requests efficiently', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'Modified text response'
      });

      const { duration } = await measurePerformance(async () => {
        return optimizer.optimizedRequest(
          AIMode.MODIFY,
          'Document with text to modify',
          { 
            selectedText: 'text to modify',
            modificationType: ModificationType.IMPROVE_CLARITY
          },
          mockRequestFn
        );
      });

      expect(duration).toBeLessThan(1000); // Less than 1 second
      expect(mockRequestFn).toHaveBeenCalledTimes(1);
      console.log(`Modify request performance: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Caching Performance', () => {
    it('should provide fast cache hits', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'Cached response'
      });

      // First request (cache miss)
      const { duration: firstDuration } = await measurePerformance(async () => {
        return optimizer.optimizedRequest(
          AIMode.PROMPT,
          'Test content',
          { prompt: 'Test prompt' },
          mockRequestFn
        );
      });

      // Second request (cache hit)
      const { duration: secondDuration } = await measurePerformance(async () => {
        return optimizer.optimizedRequest(
          AIMode.PROMPT,
          'Test content',
          { prompt: 'Test prompt' },
          mockRequestFn
        );
      });

      expect(firstDuration).toBeGreaterThan(secondDuration);
      expect(secondDuration).toBeLessThan(10); // Cache hit should be very fast
      expect(mockRequestFn).toHaveBeenCalledTimes(1); // Only called once due to caching

      console.log(`Cache miss: ${firstDuration.toFixed(2)}ms, Cache hit: ${secondDuration.toFixed(2)}ms`);
    });

    it('should handle cache operations at scale', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'Response'
      });

      // Fill cache with many entries
      const cacheOperations = [];
      for (let i = 0; i < 100; i++) {
        cacheOperations.push(
          optimizer.optimizedRequest(
            AIMode.PROMPT,
            `Content ${i}`,
            { prompt: `Prompt ${i}` },
            mockRequestFn
          )
        );
      }

      const { duration } = await measurePerformance(async () => {
        return Promise.all(cacheOperations);
      });

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      console.log(`100 cache operations: ${duration.toFixed(2)}ms`);

      // Verify cache stats
      const stats = optimizer.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.size).toBeLessThanOrEqual(100);
    });

    it('should handle cache eviction efficiently', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'Response'
      });

      // Fill cache beyond capacity
      const operations = [];
      for (let i = 0; i < 150; i++) {
        operations.push(
          optimizer.optimizedRequest(
            AIMode.PROMPT,
            `Content ${i}`,
            { prompt: `Prompt ${i}` },
            mockRequestFn
          )
        );
      }

      const { duration } = await measurePerformance(async () => {
        return Promise.all(operations);
      });

      expect(duration).toBeLessThan(10000); // Should handle eviction efficiently
      
      const stats = optimizer.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(100); // Should respect max size

      console.log(`Cache eviction test: ${duration.toFixed(2)}ms, final cache size: ${stats.size}`);
    });
  });

  describe('Debouncing Performance', () => {
    it('should debounce rapid requests efficiently', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'Debounced response'
      });

      // Make rapid requests with same key
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          optimizer.debouncedRequest('same-key', mockRequestFn)
        );
      }

      const { duration } = await measurePerformance(async () => {
        return Promise.all(requests);
      });

      expect(duration).toBeLessThan(2000); // Should complete quickly
      expect(mockRequestFn).toHaveBeenCalledTimes(1); // Only one actual request due to debouncing

      console.log(`Debouncing 10 requests: ${duration.toFixed(2)}ms, actual requests: ${mockRequestFn.mock.calls.length}`);
    });

    it('should handle concurrent debounced requests', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'Response'
      });

      // Make concurrent requests with different keys
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(
          optimizer.debouncedRequest(`key-${i}`, mockRequestFn)
        );
      }

      const { duration } = await measurePerformance(async () => {
        return Promise.all(requests);
      });

      expect(duration).toBeLessThan(3000); // Should handle concurrency well
      expect(mockRequestFn).toHaveBeenCalledTimes(20); // Each unique key should execute

      console.log(`20 concurrent debounced requests: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Memory Performance', () => {
    it('should manage memory efficiently with large operations', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'A'.repeat(10000) // 10KB response
      });

      // Perform many operations with large responses
      const operations = [];
      for (let i = 0; i < 50; i++) {
        operations.push(
          optimizer.optimizedRequest(
            AIMode.PROMPT,
            generateTestContent(5000),
            { prompt: `Large prompt ${i}` },
            mockRequestFn
          )
        );
      }

      const { duration } = await measurePerformance(async () => {
        return Promise.all(operations);
      });

      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      const stats = optimizer.getCacheStats();
      console.log(`Memory test: ${duration.toFixed(2)}ms, cache size: ${stats.size}, estimated memory: ${stats.size * 10}KB`);

      // Clean up and verify memory is released
      optimizer.clearCache();
      const clearedStats = optimizer.getCacheStats();
      expect(clearedStats.size).toBe(0);
    });

    it('should handle memory cleanup efficiently', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'Response'
      });

      // Fill cache
      for (let i = 0; i < 100; i++) {
        await optimizer.optimizedRequest(
          AIMode.PROMPT,
          `Content ${i}`,
          { prompt: `Prompt ${i}` },
          mockRequestFn
        );
      }

      // Measure cleanup performance
      const { duration } = await measurePerformance(async () => {
        optimizer.clearCache();
        return Promise.resolve();
      });

      expect(duration).toBeLessThan(100); // Cleanup should be fast
      expect(optimizer.getCacheStats().size).toBe(0);

      console.log(`Cache cleanup: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle mixed concurrent operations', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'Mixed response'
      });

      const operations = [
        // Prompt operations
        ...Array(10).fill(0).map((_, i) => 
          optimizer.optimizedRequest(
            AIMode.PROMPT,
            `Prompt content ${i}`,
            { prompt: `Generate ${i}` },
            mockRequestFn
          )
        ),
        // Continue operations
        ...Array(10).fill(0).map((_, i) => 
          optimizer.optimizedRequest(
            AIMode.CONTINUE,
            `Continue content ${i}`,
            { cursorPosition: i * 10 },
            mockRequestFn
          )
        ),
        // Modify operations
        ...Array(10).fill(0).map((_, i) => 
          optimizer.optimizedRequest(
            AIMode.MODIFY,
            `Modify content ${i}`,
            { 
              selectedText: `text ${i}`,
              modificationType: ModificationType.IMPROVE_CLARITY
            },
            mockRequestFn
          )
        )
      ];

      const { duration } = await measurePerformance(async () => {
        return Promise.all(operations);
      });

      expect(duration).toBeLessThan(15000); // Should handle 30 concurrent operations within 15 seconds
      console.log(`30 mixed concurrent operations: ${duration.toFixed(2)}ms`);
    });

    it('should maintain performance under high load', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'High load response'
      });

      // Create high load scenario
      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(
          optimizer.optimizedRequest(
            AIMode.PROMPT,
            generateTestContent(1000),
            { prompt: `High load prompt ${i}` },
            mockRequestFn,
            {
              enableCaching: true,
              enableDebouncing: false, // Disable for predictable results
              enableOptimization: true
            }
          )
        );
      }

      const { duration } = await measurePerformance(async () => {
        return Promise.all(operations);
      });

      expect(duration).toBeLessThan(20000); // Should handle 100 operations within 20 seconds
      
      const metrics = optimizer.getMetrics();
      console.log(`High load test: ${duration.toFixed(2)}ms, ${operations.length} operations, metrics:`, metrics);
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle typical user workflow efficiently', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'Workflow response'
      });

      const documentContent = generateTestContent(5000); // 5KB document

      // Simulate typical user workflow
      const workflow = async () => {
        // User starts with prompt
        await optimizer.optimizedRequest(
          AIMode.PROMPT,
          documentContent,
          { prompt: 'Write an introduction' },
          mockRequestFn
        );

        // User continues writing
        await optimizer.optimizedRequest(
          AIMode.CONTINUE,
          documentContent + 'Introduction content...',
          { cursorPosition: documentContent.length + 25 },
          mockRequestFn
        );

        // User modifies some text
        await optimizer.optimizedRequest(
          AIMode.MODIFY,
          documentContent,
          { 
            selectedText: 'some text to improve',
            modificationType: ModificationType.IMPROVE_CLARITY
          },
          mockRequestFn
        );

        // User adds more content with prompt
        await optimizer.optimizedRequest(
          AIMode.PROMPT,
          documentContent + 'More content...',
          { prompt: 'Add methodology section' },
          mockRequestFn
        );
      };

      const { duration } = await measurePerformance(workflow);

      expect(duration).toBeLessThan(5000); // Typical workflow should complete within 5 seconds
      expect(mockRequestFn).toHaveBeenCalledTimes(4);

      console.log(`Typical user workflow: ${duration.toFixed(2)}ms`);
    });

    it('should handle document editing session efficiently', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'Session response'
      });

      let documentContent = generateTestContent(2000);

      // Simulate editing session with multiple operations
      const editingSession = async () => {
        const operations = [];

        // Multiple prompt operations
        for (let i = 0; i < 5; i++) {
          operations.push(
            optimizer.optimizedRequest(
              AIMode.PROMPT,
              documentContent,
              { prompt: `Generate section ${i}` },
              mockRequestFn
            )
          );
          documentContent += ` Section ${i} content...`;
        }

        // Multiple continue operations
        for (let i = 0; i < 3; i++) {
          operations.push(
            optimizer.optimizedRequest(
              AIMode.CONTINUE,
              documentContent,
              { cursorPosition: documentContent.length },
              mockRequestFn
            )
          );
          documentContent += ` Continued content ${i}...`;
        }

        // Multiple modify operations
        for (let i = 0; i < 3; i++) {
          operations.push(
            optimizer.optimizedRequest(
              AIMode.MODIFY,
              documentContent,
              { 
                selectedText: `content ${i}`,
                modificationType: ModificationType.EXPAND
              },
              mockRequestFn
            )
          );
        }

        return Promise.all(operations);
      };

      const { duration } = await measurePerformance(editingSession);

      expect(duration).toBeLessThan(10000); // Editing session should complete within 10 seconds
      console.log(`Document editing session: ${duration.toFixed(2)}ms, final document size: ${documentContent.length} chars`);
    });

    it('should maintain performance with realistic document sizes', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'Realistic response'
      });

      // Test with realistic thesis document sizes
      const documentSizes = [
        { name: 'Short paper', size: 5000 },      // 5KB
        { name: 'Medium paper', size: 25000 },    // 25KB
        { name: 'Long paper', size: 100000 },     // 100KB
        { name: 'Thesis', size: 500000 }          // 500KB
      ];

      for (const { name, size } of documentSizes) {
        const content = generateTestContent(size);
        
        const { duration } = await measurePerformance(async () => {
          return optimizer.optimizedRequest(
            AIMode.PROMPT,
            content,
            { prompt: 'Analyze this document' },
            mockRequestFn
          );
        });

        expect(duration).toBeLessThan(2000); // Each operation should complete within 2 seconds
        console.log(`${name} (${size} chars): ${duration.toFixed(2)}ms`);
      }
    });
  });

  describe('Performance Regression Tests', () => {
    it('should maintain consistent performance across multiple runs', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'Consistent response'
      });

      const durations: number[] = [];
      const testContent = generateTestContent(10000);

      // Run same operation multiple times
      for (let i = 0; i < 10; i++) {
        const { duration } = await measurePerformance(async () => {
          return optimizer.optimizedRequest(
            AIMode.PROMPT,
            testContent,
            { prompt: `Consistency test ${i}` },
            mockRequestFn
          );
        });
        durations.push(duration);
      }

      const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      const variance = durations.reduce((acc, duration) => acc + Math.pow(duration - averageDuration, 2), 0) / durations.length;

      console.log(`Performance consistency: avg=${averageDuration.toFixed(2)}ms, min=${minDuration.toFixed(2)}ms, max=${maxDuration.toFixed(2)}ms, variance=${variance.toFixed(2)}`);

      // Performance should be consistent (low variance)
      expect(variance).toBeLessThan(10000); // Variance should be reasonable
      expect(maxDuration - minDuration).toBeLessThan(1000); // Range should be reasonable
    });

    it('should not degrade performance over time', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({
        success: true,
        content: 'Time test response'
      });

      const testContent = generateTestContent(5000);
      const measurements: Array<{ iteration: number; duration: number }> = [];

      // Run operations over time to check for performance degradation
      for (let i = 0; i < 50; i++) {
        const { duration } = await measurePerformance(async () => {
          return optimizer.optimizedRequest(
            AIMode.PROMPT,
            testContent,
            { prompt: `Time test ${i}` },
            mockRequestFn
          );
        });
        
        measurements.push({ iteration: i, duration });

        // Small delay to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Check that performance doesn't degrade significantly over time
      const firstHalf = measurements.slice(0, 25).map(m => m.duration);
      const secondHalf = measurements.slice(25).map(m => m.duration);

      const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      console.log(`Performance over time: first half avg=${firstHalfAvg.toFixed(2)}ms, second half avg=${secondHalfAvg.toFixed(2)}ms`);

      // Second half should not be significantly slower than first half
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5); // Allow up to 50% degradation
    });
  });
});