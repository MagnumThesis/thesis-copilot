/**
 * Proofreader Performance Integration Tests
 * Comprehensive integration tests for all performance optimizations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  ProofreaderPerformanceOptimizer 
} from '../lib/proofreader-performance-optimizer';
import { 
  proofreaderPerformanceMonitor,
  ProofreaderPerformanceMonitor 
} from '../lib/proofreader-performance-monitor';
import { 
  ProofreadingConcern, 
  ConcernStatus, 
  ConcernCategory, 
  ConcernSeverity,
  ProofreaderAnalysisRequest,
  ProofreaderAnalysisResponse
} from '../lib/ai-types';

describe('Proofreader Performance Integration', () => {
  let optimizer: ProofreaderPerformanceOptimizer;
  let monitor: ProofreaderPerformanceMonitor;
  let mockAnalysisFn: vi.MockedFunction<(request: ProofreaderAnalysisRequest) => Promise<ProofreaderAnalysisResponse>>;

  beforeEach(() => {
    optimizer = new ProofreaderPerformanceOptimizer();
    monitor = new ProofreaderPerformanceMonitor();
    monitor.setEnabled(true);
    mockAnalysisFn = vi.fn();
  });

  afterEach(() => {
    optimizer.clearCache();
    optimizer.cancelPendingOperations();
    monitor.clear();
    vi.clearAllMocks();
  });

  describe('End-to-End Performance Optimization', () => {
    it('should optimize complete analysis workflow', async () => {
      const largeContent = 'A'.repeat(15000); // Large content
      const manyIdeas = Array.from({ length: 25 }, (_, i) => ({
        id: `idea-${i}`,
        title: `Idea ${i}`,
        description: 'B'.repeat(600), // Long descriptions
        conversationId: 'test-conv-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv-1',
        documentContent: largeContent,
        ideaDefinitions: manyIdeas,
        analysisOptions: {}
      };

      const mockResponse: ProofreaderAnalysisResponse = {
        success: true,
        concerns: Array.from({ length: 10 }, (_, i) => ({
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
          totalConcerns: 10,
          concernsByCategory: { [ConcernCategory.CLARITY]: 10 } as any,
          concernsBySeverity: { [ConcernSeverity.MEDIUM]: 10 } as any,
          analysisTime: 2000,
          contentLength: largeContent.length,
          ideaDefinitionsUsed: manyIdeas.length
        }
      };

      mockAnalysisFn.mockResolvedValue(mockResponse);

      // Measure complete workflow
      const { result, duration } = await monitor.measureAsync(
        'complete_workflow',
        async () => {
          return await optimizer.optimizedAnalysis(request, mockAnalysisFn, {
            enableCaching: true,
            enableOptimization: true
          });
        }
      );

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify optimizations were applied
      const metrics = optimizer.getMetrics();
      expect(metrics.promptOptimizations).toBe(1);
      expect(metrics.totalAnalyses).toBe(1);

      // Verify content was optimized
      const optimizedRequest = optimizer.optimizeAnalysisRequest(request);
      expect(optimizedRequest.documentContent.length).toBeLessThanOrEqual(15000); // Should be optimized to max 15KB
      expect(optimizedRequest.ideaDefinitions?.length).toBeLessThanOrEqual(20);
    });

    it('should demonstrate cache performance benefits', async () => {
      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv-1',
        documentContent: 'Test content for caching',
        ideaDefinitions: [],
        analysisOptions: {}
      };

      const mockResponse: ProofreaderAnalysisResponse = {
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

      mockAnalysisFn.mockResolvedValue(mockResponse);

      // First call - should be slow (cache miss)
      const { duration: firstCallDuration } = await monitor.measureAsync(
        'first_analysis_call',
        () => optimizer.optimizedAnalysis(request, mockAnalysisFn)
      );

      // Second call - should be fast (cache hit)
      const { duration: secondCallDuration } = await monitor.measureAsync(
        'second_analysis_call',
        () => optimizer.optimizedAnalysis(request, mockAnalysisFn)
      );

      expect(mockAnalysisFn).toHaveBeenCalledTimes(1); // Only called once due to caching
      expect(secondCallDuration).toBeLessThan(firstCallDuration); // Cache should be faster
      expect(secondCallDuration).toBeLessThan(50); // Cache lookup should be very fast

      const metrics = optimizer.getMetrics();
      expect(metrics.cacheHitRate).toBe(0.5); // 1 hit out of 2 calls
    });

    it('should handle concurrent operations efficiently', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        conversationId: `test-conv-${i}`,
        documentContent: `Test content ${i}`,
        ideaDefinitions: [],
        analysisOptions: {}
      }));

      mockAnalysisFn.mockImplementation(async () => {
        // Simulate variable processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return {
          success: true,
          concerns: [],
          analysisMetadata: {
            totalConcerns: 0,
            concernsByCategory: {} as any,
            concernsBySeverity: {} as any,
            analysisTime: 500,
            contentLength: 100,
            ideaDefinitionsUsed: 0
          }
        };
      });

      // Execute concurrent requests
      const { result: results, duration } = await monitor.measureAsync(
        'concurrent_operations',
        async () => {
          const promises = requests.map(request =>
            optimizer.optimizedAnalysis(request, mockAnalysisFn)
          );
          return await Promise.all(promises);
        }
      );

      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(2000); // Should handle concurrency efficiently
      expect(duration / requests.length).toBeLessThan(200); // Average per request should be reasonable
    });

    it('should optimize status updates with debouncing', async () => {
      const mockUpdateFn = vi.fn().mockResolvedValue(undefined);
      const concernIds = Array.from({ length: 20 }, (_, i) => `concern-${i}`);

      // Rapid status updates
      const { duration } = await monitor.measureAsync(
        'debounced_status_updates',
        async () => {
          const promises = concernIds.map(id =>
            optimizer.debouncedStatusUpdate(id, ConcernStatus.ADDRESSED, mockUpdateFn)
          );
          await Promise.all(promises);
        }
      );

      expect(mockUpdateFn).toHaveBeenCalledTimes(20);
      expect(duration).toBeLessThan(1000); // Debouncing should make this efficient

      const metrics = optimizer.getMetrics();
      expect(metrics.statusUpdatesDebounced).toBeGreaterThan(0);
    });

    it('should provide performance insights', () => {
      // Generate some performance data
      monitor.measureSync('test_operation_1', () => {
        // Simulate work
        const start = Date.now();
        while (Date.now() - start < 10) { /* busy wait */ }
      });

      monitor.measureSync('test_operation_2', () => {
        // Simulate work
        const start = Date.now();
        while (Date.now() - start < 20) { /* busy wait */ }
      });

      const summary = monitor.getPerformanceSummary();
      expect(summary.totalOperations).toBe(2);
      expect(summary.averageResponseTime).toBeGreaterThan(0);
      expect(summary.benchmarks).toHaveLength(2);

      const benchmark1 = monitor.getBenchmark('test_operation_1');
      const benchmark2 = monitor.getBenchmark('test_operation_2');

      expect(benchmark1).toBeTruthy();
      expect(benchmark2).toBeTruthy();
      expect(benchmark1!.average).toBeLessThan(benchmark2!.average);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions in analysis', async () => {
      const baselineRequest: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv-1',
        documentContent: 'A'.repeat(1000),
        ideaDefinitions: [],
        analysisOptions: {}
      };

      const mockResponse: ProofreaderAnalysisResponse = {
        success: true,
        concerns: [],
        analysisMetadata: {
          totalConcerns: 0,
          concernsByCategory: {} as any,
          concernsBySeverity: {} as any,
          analysisTime: 500,
          contentLength: 1000,
          ideaDefinitionsUsed: 0
        }
      };

      // Baseline performance
      mockAnalysisFn.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50)); // Fast
        return mockResponse;
      });

      const baselineTimes: number[] = [];
      for (let i = 0; i < 5; i++) {
        const { duration } = await monitor.measureAsync(
          'baseline_analysis',
          () => optimizer.optimizedAnalysis(baselineRequest, mockAnalysisFn, { forceRefresh: true })
        );
        baselineTimes.push(duration);
      }

      const baselineAverage = baselineTimes.reduce((a, b) => a + b, 0) / baselineTimes.length;

      // Simulate performance regression
      mockAnalysisFn.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 200)); // Slow
        return mockResponse;
      });

      const regressionTimes: number[] = [];
      for (let i = 0; i < 5; i++) {
        const { duration } = await monitor.measureAsync(
          'regression_analysis',
          () => optimizer.optimizedAnalysis(baselineRequest, mockAnalysisFn, { forceRefresh: true })
        );
        regressionTimes.push(duration);
      }

      const regressionAverage = regressionTimes.reduce((a, b) => a + b, 0) / regressionTimes.length;

      // Should detect significant performance regression
      const performanceRatio = regressionAverage / baselineAverage;
      expect(performanceRatio).toBeGreaterThan(2); // At least 2x slower

      console.log('Performance Regression Test:', {
        baseline: baselineAverage.toFixed(2) + 'ms',
        regression: regressionAverage.toFixed(2) + 'ms',
        ratio: performanceRatio.toFixed(2) + 'x slower'
      });
    });

    it('should maintain performance under load', async () => {
      const loadTestRequests = Array.from({ length: 50 }, (_, i) => ({
        conversationId: `load-test-${i}`,
        documentContent: `Load test content ${i}`.repeat(100),
        ideaDefinitions: [],
        analysisOptions: {}
      }));

      mockAnalysisFn.mockResolvedValue({
        success: true,
        concerns: [],
        analysisMetadata: {
          totalConcerns: 0,
          concernsByCategory: {} as any,
          concernsBySeverity: {} as any,
          analysisTime: 100,
          contentLength: 1000,
          ideaDefinitionsUsed: 0
        }
      });

      const { duration } = await monitor.measureAsync(
        'load_test',
        async () => {
          const promises = loadTestRequests.map(request =>
            optimizer.optimizedAnalysis(request, mockAnalysisFn)
          );
          return await Promise.all(promises);
        }
      );

      const averagePerRequest = duration / loadTestRequests.length;

      console.log('Load Test Results:', {
        totalRequests: loadTestRequests.length,
        totalTime: duration.toFixed(2) + 'ms',
        averagePerRequest: averagePerRequest.toFixed(2) + 'ms'
      });

      // Performance should remain reasonable under load
      expect(averagePerRequest).toBeLessThan(100); // Less than 100ms per request on average
      expect(duration).toBeLessThan(10000); // Total should be less than 10 seconds
    });
  });

  describe('Memory Performance', () => {
    it('should manage memory efficiently with large datasets', async () => {
      const largeConcernList: ProofreadingConcern[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `concern-${i}`,
        conversationId: 'test-conv-1',
        category: ConcernCategory.CLARITY,
        severity: ConcernSeverity.MEDIUM,
        title: `Concern ${i}`,
        description: `Description ${i}`.repeat(50), // Large descriptions
        status: ConcernStatus.TO_BE_DONE,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Test virtual scrolling performance
      const { duration: virtualScrollDuration } = monitor.measureSync(
        'virtual_scroll_large_list',
        () => {
          return optimizer.optimizeForVirtualScrolling(largeConcernList, 600, 120);
        }
      );

      expect(virtualScrollDuration).toBeLessThan(100); // Should be fast even for large lists

      // Test cache memory management
      const cachePromises = [];
      for (let i = 0; i < 100; i++) {
        cachePromises.push(
          optimizer.optimizedAnalysis({
            conversationId: `memory-test-${i}`,
            documentContent: `Content ${i}`.repeat(100),
            ideaDefinitions: [],
            analysisOptions: {}
          }, mockAnalysisFn)
        );
      }

      mockAnalysisFn.mockImplementation(async () => ({
        success: true,
        concerns: largeConcernList.slice(0, 10), // Return subset
        analysisMetadata: {
          totalConcerns: 10,
          concernsByCategory: {} as any,
          concernsBySeverity: {} as any,
          analysisTime: 1000,
          contentLength: 1000,
          ideaDefinitionsUsed: 0
        }
      }));

      await Promise.all(cachePromises);

      const cacheStats = optimizer.getCacheStats();
      expect(cacheStats.size).toBeLessThanOrEqual(cacheStats.maxSize); // Should respect limits
    });
  });
});