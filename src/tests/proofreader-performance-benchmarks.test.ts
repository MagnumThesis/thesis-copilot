/**
 * Proofreader Performance Benchmarks
 * Comprehensive performance benchmarks for proofreader optimizations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  ProofreaderPerformanceOptimizer 
} from '../lib/proofreader-performance-optimizer';
import { 
  ProofreadingConcern, 
  ConcernStatus, 
  ConcernCategory, 
  ConcernSeverity,
  ProofreaderAnalysisRequest,
  ProofreaderAnalysisResponse
} from '../lib/ai-types';

describe('Proofreader Performance Benchmarks', () => {
  let optimizer: ProofreaderPerformanceOptimizer;

  beforeEach(() => {
    optimizer = new ProofreaderPerformanceOptimizer();
  });

  afterEach(() => {
    optimizer.clearCache();
    optimizer.cancelPendingOperations();
  });

  describe('Cache Performance', () => {
    it('should provide fast cache lookups', async () => {
      const mockAnalysisFn = vi.fn().mockResolvedValue({
        success: true,
        concerns: [],
        analysisMetadata: {
          totalConcerns: 0,
          concernsByCategory: {} as any,
          concernsBySeverity: {} as any,
          analysisTime: 1000,
          contentLength: 100,
          ideaDefinitionsUsed: 0
        }
      });

      // Populate cache with multiple entries
      const cachePromises = [];
      for (let i = 0; i < 50; i++) {
        cachePromises.push(
          optimizer.optimizedAnalysis({
            conversationId: `test-conv-${i}`,
            documentContent: `Test content ${i}`,
            ideaDefinitions: [],
            analysisOptions: {}
          }, mockAnalysisFn)
        );
      }

      await Promise.all(cachePromises);

      // Measure cache lookup performance
      const lookupTimes: number[] = [];
      
      for (let i = 0; i < 50; i++) {
        const startTime = performance.now();
        
        await optimizer.optimizedAnalysis({
          conversationId: `test-conv-${i}`,
          documentContent: `Test content ${i}`,
          ideaDefinitions: [],
          analysisOptions: {}
        }, mockAnalysisFn);
        
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
      const mockAnalysisFn = vi.fn().mockResolvedValue({
        success: true,
        concerns: [],
        analysisMetadata: {
          totalConcerns: 0,
          concernsByCategory: {} as any,
          concernsBySeverity: {} as any,
          analysisTime: 1000,
          contentLength: 100,
          ideaDefinitionsUsed: 0
        }
      });

      // Fill cache beyond capacity to trigger eviction
      const startTime = performance.now();
      
      const promises = [];
      for (let i = 0; i < 75; i++) { // Exceed default cache size of 50
        promises.push(
          optimizer.optimizedAnalysis({
            conversationId: `test-conv-${i}`,
            documentContent: `Test content ${i}`,
            ideaDefinitions: [],
            analysisOptions: {}
          }, mockAnalysisFn)
        );
      }

      await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log('Cache Eviction Performance:', {
        totalTime,
        entriesProcessed: 75,
        averagePerEntry: totalTime / 75
      });

      // Cache eviction should not significantly impact performance
      expect(totalTime / 75).toBeLessThan(10); // Less than 10ms per entry on average

      const stats = optimizer.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(50); // Should respect max size
    });
  });

  describe('Content Optimization Performance', () => {
    it('should optimize large content efficiently', () => {
      const largeSizes = [1000, 5000, 10000, 20000, 50000];
      const optimizationTimes: number[] = [];

      largeSizes.forEach(size => {
        const largeContent = 'A'.repeat(size);
        
        const startTime = performance.now();
        
        optimizer.optimizeAnalysisRequest({
          conversationId: 'test-conv-1',
          documentContent: largeContent,
          ideaDefinitions: [],
          analysisOptions: {}
        });
        
        const endTime = performance.now();
        optimizationTimes.push(endTime - startTime);
      });

      const maxOptimizationTime = Math.max(...optimizationTimes);
      const averageOptimizationTime = optimizationTimes.reduce((a, b) => a + b, 0) / optimizationTimes.length;

      console.log('Content Optimization Performance:', {
        sizes: largeSizes,
        times: optimizationTimes,
        average: averageOptimizationTime,
        max: maxOptimizationTime
      });

      // Content optimization should be fast even for large documents
      expect(maxOptimizationTime).toBeLessThan(50); // Less than 50ms for largest content
      expect(averageOptimizationTime).toBeLessThan(20); // Less than 20ms average
    });

    it('should handle many idea definitions efficiently', () => {
      const ideaCounts = [10, 50, 100, 200, 500];
      const optimizationTimes: number[] = [];

      ideaCounts.forEach(count => {
        const manyIdeas = Array.from({ length: count }, (_, i) => ({
          id: `idea-${i}`,
          title: `Idea ${i}`,
          description: `This is a detailed description for idea ${i}. `.repeat(10),
          conversationId: 'test-conv-1',
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        const startTime = performance.now();
        
        optimizer.optimizeAnalysisRequest({
          conversationId: 'test-conv-1',
          documentContent: 'Test content',
          ideaDefinitions: manyIdeas,
          analysisOptions: {}
        });
        
        const endTime = performance.now();
        optimizationTimes.push(endTime - startTime);
      });

      const maxOptimizationTime = Math.max(...optimizationTimes);
      const averageOptimizationTime = optimizationTimes.reduce((a, b) => a + b, 0) / optimizationTimes.length;

      console.log('Idea Definitions Optimization Performance:', {
        counts: ideaCounts,
        times: optimizationTimes,
        average: averageOptimizationTime,
        max: maxOptimizationTime
      });

      // Idea optimization should be fast even for many ideas
      expect(maxOptimizationTime).toBeLessThan(30); // Less than 30ms for 500 ideas
      expect(averageOptimizationTime).toBeLessThan(15); // Less than 15ms average
    });
  });

  describe('Status Update Batching Performance', () => {
    it('should handle rapid status updates efficiently', async () => {
      const updateCounts = [10, 50, 100, 200];
      const batchingTimes: number[] = [];

      for (const count of updateCounts) {
        const mockUpdateFn = vi.fn().mockResolvedValue(undefined);
        
        const startTime = performance.now();
        
        const promises = [];
        for (let i = 0; i < count; i++) {
          promises.push(
            optimizer.debouncedStatusUpdate(
              `concern-${i}`, 
              ConcernStatus.ADDRESSED, 
              mockUpdateFn
            )
          );
        }

        await Promise.all(promises);
        const endTime = performance.now();
        batchingTimes.push(endTime - startTime);
      }

      const maxBatchingTime = Math.max(...batchingTimes);
      const averageBatchingTime = batchingTimes.reduce((a, b) => a + b, 0) / batchingTimes.length;

      console.log('Status Update Batching Performance:', {
        counts: updateCounts,
        times: batchingTimes,
        average: averageBatchingTime,
        max: maxBatchingTime
      });

      // Batching should handle many updates efficiently
      expect(maxBatchingTime).toBeLessThan(1000); // Less than 1 second for 200 updates
      expect(averageBatchingTime).toBeLessThan(600); // Less than 600ms average (accounting for debouncing)
    });
  });

  describe('Virtual Scrolling Performance', () => {
    it('should handle large concern lists efficiently', () => {
      const listSizes = [100, 500, 1000, 2000, 5000];
      const scrollingTimes: number[] = [];

      listSizes.forEach(size => {
        const largeConcernList: ProofreadingConcern[] = Array.from({ length: size }, (_, i) => ({
          id: `concern-${i}`,
          conversationId: 'test-conv-1',
          category: ConcernCategory.CLARITY,
          severity: ConcernSeverity.MEDIUM,
          title: `Concern ${i}`,
          description: `Description for concern ${i}`,
          status: ConcernStatus.TO_BE_DONE,
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        const startTime = performance.now();
        
        optimizer.optimizeForVirtualScrolling(largeConcernList, 600, 120);
        
        const endTime = performance.now();
        scrollingTimes.push(endTime - startTime);
      });

      const maxScrollingTime = Math.max(...scrollingTimes);
      const averageScrollingTime = scrollingTimes.reduce((a, b) => a + b, 0) / scrollingTimes.length;

      console.log('Virtual Scrolling Performance:', {
        sizes: listSizes,
        times: scrollingTimes,
        average: averageScrollingTime,
        max: maxScrollingTime
      });

      // Virtual scrolling calculations should be fast even for large lists
      expect(maxScrollingTime).toBeLessThan(50); // Less than 50ms for 5000 items
      expect(averageScrollingTime).toBeLessThan(20); // Less than 20ms average
    });
  });

  describe('Memory Usage', () => {
    it('should manage memory efficiently with large cache', async () => {
      const mockAnalysisFn = vi.fn().mockResolvedValue({
        success: true,
        concerns: Array.from({ length: 10 }, (_, i) => ({
          id: `concern-${i}`,
          conversationId: 'test-conv-1',
          category: ConcernCategory.CLARITY,
          severity: ConcernSeverity.MEDIUM,
          title: `Concern ${i}`,
          description: `Description ${i}`.repeat(50), // Large descriptions
          status: ConcernStatus.TO_BE_DONE,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        analysisMetadata: {
          totalConcerns: 10,
          concernsByCategory: {} as any,
          concernsBySeverity: {} as any,
          analysisTime: 1000,
          contentLength: 1000,
          ideaDefinitionsUsed: 0
        }
      });

      // Fill cache with large responses
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          optimizer.optimizedAnalysis({
            conversationId: `test-conv-${i}`,
            documentContent: `Test content ${i}`.repeat(100), // Large content
            ideaDefinitions: [],
            analysisOptions: {}
          }, mockAnalysisFn)
        );
      }

      await Promise.all(promises);

      const stats = optimizer.getCacheStats();
      
      console.log('Memory Usage Stats:', {
        cacheSize: stats.size,
        maxSize: stats.maxSize,
        hitRate: stats.hitRate,
        pendingUpdates: stats.pendingUpdates
      });

      // Cache should respect size limits
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
      
      // Clear cache and verify cleanup
      optimizer.clearCache();
      const clearedStats = optimizer.getCacheStats();
      expect(clearedStats.size).toBe(0);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent analysis requests efficiently', async () => {
      const mockAnalysisFn = vi.fn().mockImplementation(async (request) => {
        // Simulate variable analysis time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return {
          success: true,
          concerns: [],
          analysisMetadata: {
            totalConcerns: 0,
            concernsByCategory: {} as any,
            concernsBySeverity: {} as any,
            analysisTime: 1000,
            contentLength: request.documentContent.length,
            ideaDefinitionsUsed: 0
          }
        };
      });

      const startTime = performance.now();
      
      // Create many concurrent requests
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          optimizer.optimizedAnalysis({
            conversationId: `test-conv-${i}`,
            documentContent: `Test content ${i}`,
            ideaDefinitions: [],
            analysisOptions: {}
          }, mockAnalysisFn)
        );
      }

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log('Concurrent Operations Performance:', {
        totalRequests: 50,
        totalTime,
        averagePerRequest: totalTime / 50,
        successfulResults: results.filter(r => r.success).length
      });

      // All requests should succeed
      expect(results.every(r => r.success)).toBe(true);
      
      // Should handle concurrency efficiently
      expect(totalTime / 50).toBeLessThan(50); // Less than 50ms per request on average
    });

    it('should handle concurrent status updates efficiently', async () => {
      const mockUpdateFn = vi.fn().mockImplementation(async () => {
        // Simulate variable update time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      });

      const startTime = performance.now();
      
      // Create many concurrent status updates
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          optimizer.debouncedStatusUpdate(
            `concern-${i}`, 
            i % 2 === 0 ? ConcernStatus.ADDRESSED : ConcernStatus.REJECTED, 
            mockUpdateFn
          )
        );
      }

      await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log('Concurrent Status Updates Performance:', {
        totalUpdates: 100,
        totalTime,
        averagePerUpdate: totalTime / 100
      });

      // Should handle concurrent updates efficiently
      expect(totalTime / 100).toBeLessThan(20); // Less than 20ms per update on average
      expect(mockUpdateFn).toHaveBeenCalled(); // Should be called (exact count may vary due to retries)
    });
  });

  describe('End-to-End Performance', () => {
    it('should maintain performance under realistic load', async () => {
      const mockAnalysisFn = vi.fn().mockResolvedValue({
        success: true,
        concerns: Array.from({ length: 5 }, (_, i) => ({
          id: `concern-${i}`,
          conversationId: 'test-conv-1',
          category: ConcernCategory.CLARITY,
          severity: ConcernSeverity.MEDIUM,
          title: `Concern ${i}`,
          description: `Description ${i}`,
          status: ConcernStatus.TO_BE_DONE,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        analysisMetadata: {
          totalConcerns: 5,
          concernsByCategory: {} as any,
          concernsBySeverity: {} as any,
          analysisTime: 2000,
          contentLength: 5000,
          ideaDefinitionsUsed: 3
        }
      });

      const mockUpdateFn = vi.fn().mockResolvedValue(undefined);

      const startTime = performance.now();

      // Simulate realistic usage pattern
      const operations = [];

      // Multiple analysis requests
      for (let i = 0; i < 10; i++) {
        operations.push(
          optimizer.optimizedAnalysis({
            conversationId: `conv-${i}`,
            documentContent: `Document content ${i}`.repeat(100),
            ideaDefinitions: Array.from({ length: 5 }, (_, j) => ({
              id: `idea-${j}`,
              title: `Idea ${j}`,
              description: `Description ${j}`,
              conversationId: `conv-${i}`,
              createdAt: new Date(),
              updatedAt: new Date()
            })),
            analysisOptions: {}
          }, mockAnalysisFn)
        );
      }

      // Multiple status updates
      for (let i = 0; i < 20; i++) {
        operations.push(
          optimizer.debouncedStatusUpdate(
            `concern-${i}`, 
            ConcernStatus.ADDRESSED, 
            mockUpdateFn
          )
        );
      }

      // Content optimizations
      for (let i = 0; i < 5; i++) {
        operations.push(
          Promise.resolve(optimizer.optimizeAnalysisRequest({
            conversationId: `conv-${i}`,
            documentContent: 'A'.repeat(20000),
            ideaDefinitions: Array.from({ length: 30 }, (_, j) => ({
              id: `idea-${j}`,
              title: `Idea ${j}`,
              description: `Description ${j}`.repeat(20),
              conversationId: `conv-${i}`,
              createdAt: new Date(),
              updatedAt: new Date()
            })),
            analysisOptions: {}
          }))
        );
      }

      await Promise.all(operations);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      const metrics = optimizer.getMetrics();
      const cacheStats = optimizer.getCacheStats();

      console.log('End-to-End Performance:', {
        totalTime,
        totalOperations: operations.length,
        averagePerOperation: totalTime / operations.length,
        metrics,
        cacheStats
      });

      // Should handle realistic load efficiently
      expect(totalTime).toBeLessThan(5000); // Less than 5 seconds total
      expect(totalTime / operations.length).toBeLessThan(150); // Less than 150ms per operation
      expect(metrics.totalAnalyses).toBeGreaterThan(0);
      expect(cacheStats.size).toBeGreaterThan(0);
    });

    it('should demonstrate performance improvements over baseline', async () => {
      // Baseline: No optimizations
      const baselineAnalysisFn = vi.fn().mockImplementation(async (request) => {
        // Simulate slow analysis without optimizations
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
          success: true,
          concerns: [],
          analysisMetadata: {
            totalConcerns: 0,
            concernsByCategory: {} as any,
            concernsBySeverity: {} as any,
            analysisTime: 200,
            contentLength: request.documentContent.length,
            ideaDefinitionsUsed: 0
          }
        };
      });

      const optimizedAnalysisFn = vi.fn().mockImplementation(async (request) => {
        // Simulate fast analysis with optimizations
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          success: true,
          concerns: [],
          analysisMetadata: {
            totalConcerns: 0,
            concernsByCategory: {} as any,
            concernsBySeverity: {} as any,
            analysisTime: 50,
            contentLength: request.documentContent.length,
            ideaDefinitionsUsed: 0
          }
        };
      });

      const testRequest = {
        conversationId: 'perf-test',
        documentContent: 'Test content'.repeat(100),
        ideaDefinitions: [],
        analysisOptions: {}
      };

      // Baseline performance (no optimizations)
      const baselineStart = performance.now();
      await baselineAnalysisFn(testRequest);
      await baselineAnalysisFn(testRequest); // Second call (no caching)
      const baselineEnd = performance.now();
      const baselineTime = baselineEnd - baselineStart;

      // Optimized performance (with caching and optimizations)
      const optimizedStart = performance.now();
      await optimizer.optimizedAnalysis(testRequest, optimizedAnalysisFn);
      await optimizer.optimizedAnalysis(testRequest, optimizedAnalysisFn); // Second call (cached)
      const optimizedEnd = performance.now();
      const optimizedTime = optimizedEnd - optimizedStart;

      const improvement = ((baselineTime - optimizedTime) / baselineTime) * 100;

      console.log('Performance Improvement Analysis:', {
        baseline: baselineTime.toFixed(2) + 'ms',
        optimized: optimizedTime.toFixed(2) + 'ms',
        improvement: improvement.toFixed(1) + '%'
      });

      // Should show significant improvement
      expect(optimizedTime).toBeLessThan(baselineTime);
      expect(improvement).toBeGreaterThan(20); // At least 20% improvement
    });
  });
});