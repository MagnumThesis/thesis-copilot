/**
 * Proofreader Performance Tests
 * Tests for performance optimizations in the proofreader tool
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  ProofreaderPerformanceOptimizer,
  ProofreaderPerformanceMetrics 
} from '../lib/proofreader-performance-optimizer';
import { 
  ProofreadingConcern, 
  ConcernStatus, 
  ConcernCategory, 
  ConcernSeverity,
  ProofreaderAnalysisRequest,
  ProofreaderAnalysisResponse
} from '../lib/ai-types';

describe('ProofreaderPerformanceOptimizer', () => {
  let optimizer: ProofreaderPerformanceOptimizer;
  let mockAnalysisFn: vi.MockedFunction<(request: ProofreaderAnalysisRequest) => Promise<ProofreaderAnalysisResponse>>;

  beforeEach(() => {
    optimizer = new ProofreaderPerformanceOptimizer();
    mockAnalysisFn = vi.fn();
  });

  afterEach(() => {
    optimizer.clearCache();
    optimizer.cancelPendingOperations();
    vi.clearAllMocks();
  });

  describe('Analysis Result Caching', () => {
    it('should cache successful analysis results', async () => {
      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv-1',
        documentContent: 'This is a test document for analysis.',
        ideaDefinitions: [],
        analysisOptions: {}
      };

      const mockResponse: ProofreaderAnalysisResponse = {
        success: true,
        concerns: [
          {
            id: 'concern-1',
            conversationId: 'test-conv-1',
            category: ConcernCategory.CLARITY,
            severity: ConcernSeverity.MEDIUM,
            title: 'Test concern',
            description: 'Test description',
            status: ConcernStatus.TO_BE_DONE,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        analysisMetadata: {
          totalConcerns: 1,
          concernsByCategory: { [ConcernCategory.CLARITY]: 1 } as any,
          concernsBySeverity: { [ConcernSeverity.MEDIUM]: 1 } as any,
          analysisTime: 1000,
          contentLength: request.documentContent.length,
          ideaDefinitionsUsed: 0
        }
      };

      mockAnalysisFn.mockResolvedValue(mockResponse);

      // First call should execute the function
      const result1 = await optimizer.optimizedAnalysis(request, mockAnalysisFn);
      expect(mockAnalysisFn).toHaveBeenCalledTimes(1);
      expect(result1.success).toBe(true);

      // Second call should use cache
      const result2 = await optimizer.optimizedAnalysis(request, mockAnalysisFn);
      expect(mockAnalysisFn).toHaveBeenCalledTimes(1); // Still only called once
      expect(result2.success).toBe(true);
      expect(result2.analysisMetadata?.cacheUsed).toBe(true);

      const metrics = optimizer.getMetrics();
      expect(metrics.totalAnalyses).toBe(2);
      expect(metrics.cachedAnalyses).toBe(1);
      expect(metrics.cacheHitRate).toBe(0.5);
    });

    it('should not cache failed analysis results', async () => {
      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv-1',
        documentContent: 'Test content',
        ideaDefinitions: [],
        analysisOptions: {}
      };

      const mockErrorResponse: ProofreaderAnalysisResponse = {
        success: false,
        error: 'Analysis failed'
      };

      mockAnalysisFn.mockResolvedValue(mockErrorResponse);

      // First call
      const result1 = await optimizer.optimizedAnalysis(request, mockAnalysisFn);
      expect(result1.success).toBe(false);

      // Second call should execute again (no caching of errors)
      const result2 = await optimizer.optimizedAnalysis(request, mockAnalysisFn);
      expect(mockAnalysisFn).toHaveBeenCalledTimes(2);
      expect(result2.success).toBe(false);

      const metrics = optimizer.getMetrics();
      expect(metrics.cachedAnalyses).toBe(0);
    });

    it('should respect cache TTL', async () => {
      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv-1',
        documentContent: 'Test content',
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
          contentLength: request.documentContent.length,
          ideaDefinitionsUsed: 0
        }
      };

      mockAnalysisFn.mockResolvedValue(mockResponse);

      // Mock short TTL for testing
      const shortTTLOptimizer = new ProofreaderPerformanceOptimizer();
      (shortTTLOptimizer as any).cacheConfig.ttlMs = 100; // 100ms TTL

      // First call
      await shortTTLOptimizer.optimizedAnalysis(request, mockAnalysisFn);
      expect(mockAnalysisFn).toHaveBeenCalledTimes(1);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second call after expiry should execute again
      await shortTTLOptimizer.optimizedAnalysis(request, mockAnalysisFn);
      expect(mockAnalysisFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Request Optimization', () => {
    it('should optimize long document content', () => {
      const longContent = 'A'.repeat(20000); // 20KB content
      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv-1',
        documentContent: longContent,
        ideaDefinitions: [],
        analysisOptions: {}
      };

      const optimizedRequest = optimizer.optimizeAnalysisRequest(request);
      
      expect(optimizedRequest.documentContent.length).toBeLessThan(request.documentContent.length);
      expect(optimizedRequest.documentContent.length).toBeLessThanOrEqual(15000);

      const metrics = optimizer.getMetrics();
      expect(metrics.promptOptimizations).toBe(1);
    });

    it('should limit idea definitions for performance', () => {
      const manyIdeas = Array.from({ length: 30 }, (_, i) => ({
        id: `idea-${i}`,
        title: `Idea ${i}`,
        description: 'A'.repeat(1000), // Long description
        conversationId: 'test-conv-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv-1',
        documentContent: 'Test content',
        ideaDefinitions: manyIdeas,
        analysisOptions: {}
      };

      const optimizedRequest = optimizer.optimizeAnalysisRequest(request);
      
      expect(optimizedRequest.ideaDefinitions?.length).toBeLessThanOrEqual(20);
      
      // Check that descriptions are truncated
      optimizedRequest.ideaDefinitions?.forEach(idea => {
        expect(idea.description.length).toBeLessThanOrEqual(503); // 500 + '...'
      });
    });

    it('should set optimized analysis options', () => {
      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv-1',
        documentContent: 'Test content',
        ideaDefinitions: [],
        analysisOptions: {}
      };

      const optimizedRequest = optimizer.optimizeAnalysisRequest(request);
      
      expect(optimizedRequest.analysisOptions?.categories).toBeDefined();
      expect(optimizedRequest.analysisOptions?.minSeverity).toBe('medium');
    });
  });

  describe('Status Update Debouncing', () => {
    it('should debounce rapid status updates', async () => {
      const mockUpdateFn = vi.fn().mockResolvedValue(undefined);
      let updateCount = 0;

      // Make multiple rapid updates
      const promises = [
        optimizer.debouncedStatusUpdate('concern-1', ConcernStatus.ADDRESSED, mockUpdateFn),
        optimizer.debouncedStatusUpdate('concern-2', ConcernStatus.REJECTED, mockUpdateFn),
        optimizer.debouncedStatusUpdate('concern-3', ConcernStatus.ADDRESSED, mockUpdateFn)
      ];

      await Promise.all(promises);

      // Should batch the updates
      expect(mockUpdateFn).toHaveBeenCalledTimes(3);

      const metrics = optimizer.getMetrics();
      expect(metrics.statusUpdatesDebounced).toBeGreaterThan(0);
    });

    it('should handle status update failures with retry', async () => {
      const mockUpdateFn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      await optimizer.debouncedStatusUpdate('concern-1', ConcernStatus.ADDRESSED, mockUpdateFn);

      // Wait for potential retries
      await new Promise(resolve => setTimeout(resolve, 300));

      // Should retry failed updates (at least 2 calls: initial + 1 retry)
      expect(mockUpdateFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Metrics', () => {
    it('should track analysis performance metrics', async () => {
      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv-1',
        documentContent: 'Test content',
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
          analysisTime: 1500,
          contentLength: request.documentContent.length,
          ideaDefinitionsUsed: 0
        }
      };

      mockAnalysisFn.mockImplementation(async () => {
        // Add small delay to ensure measurable time
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockResponse;
      });

      await optimizer.optimizedAnalysis(request, mockAnalysisFn);

      const metrics = optimizer.getMetrics();
      expect(metrics.totalAnalyses).toBe(1);
      expect(metrics.averageAnalysisTime).toBeGreaterThan(0);
    });

    it('should reset metrics correctly', () => {
      // Generate some metrics
      optimizer.optimizeAnalysisRequest({
        conversationId: 'test',
        documentContent: 'test',
        ideaDefinitions: [],
        analysisOptions: {}
      });

      let metrics = optimizer.getMetrics();
      expect(metrics.promptOptimizations).toBe(1);

      // Reset metrics
      optimizer.resetMetrics();

      metrics = optimizer.getMetrics();
      expect(metrics.promptOptimizations).toBe(0);
      expect(metrics.totalAnalyses).toBe(0);
      expect(metrics.cachedAnalyses).toBe(0);
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', async () => {
      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv-1',
        documentContent: 'Test content',
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

      await optimizer.optimizedAnalysis(request, mockAnalysisFn);

      const stats = optimizer.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBeGreaterThan(0);
      expect(stats.newestEntry).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv-1',
        documentContent: 'Test content',
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

      await optimizer.optimizedAnalysis(request, mockAnalysisFn);
      expect(optimizer.getCacheStats().size).toBe(1);

      optimizer.clearCache();
      expect(optimizer.getCacheStats().size).toBe(0);
    });
  });

  describe('Virtual Scrolling Optimization', () => {
    it('should optimize for virtual scrolling', () => {
      const concerns: ProofreadingConcern[] = Array.from({ length: 100 }, (_, i) => ({
        id: `concern-${i}`,
        conversationId: 'test-conv-1',
        category: ConcernCategory.CLARITY,
        severity: ConcernSeverity.MEDIUM,
        title: `Concern ${i}`,
        description: `Description ${i}`,
        status: ConcernStatus.TO_BE_DONE,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const result = optimizer.optimizeForVirtualScrolling(concerns, 600, 120);

      expect(result.visibleConcerns).toBeDefined();
      expect(result.totalHeight).toBe(100 * 120);
      expect(result.startIndex).toBe(0);
      expect(result.endIndex).toBe(99);

      const metrics = optimizer.getMetrics();
      expect(metrics.virtualScrollOptimizations).toBe(1);
    });
  });

  describe('Preloading', () => {
    it('should preload analysis in background', async () => {
      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv-1',
        documentContent: 'Test content',
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

      // Preload analysis
      await optimizer.preloadAnalysis(request, mockAnalysisFn);
      expect(mockAnalysisFn).toHaveBeenCalledTimes(1);

      // Subsequent call should use cache
      const result = await optimizer.optimizedAnalysis(request, mockAnalysisFn);
      expect(mockAnalysisFn).toHaveBeenCalledTimes(1); // Still only called once
      expect(result.analysisMetadata?.cacheUsed).toBe(true);
    });

    it('should handle preload failures gracefully', async () => {
      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv-1',
        documentContent: 'Test content',
        ideaDefinitions: [],
        analysisOptions: {}
      };

      mockAnalysisFn.mockRejectedValue(new Error('Preload failed'));

      // Preload should not throw
      await expect(optimizer.preloadAnalysis(request, mockAnalysisFn)).resolves.toBeUndefined();
    });
  });
});