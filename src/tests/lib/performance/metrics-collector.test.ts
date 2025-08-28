import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector, PerformanceMetrics } from './metrics-collector';

describe('MetricsCollector', () => {
  let metricsCollector: MetricsCollector;

  beforeEach(() => {
    metricsCollector = new MetricsCollector();
  });

  describe('getMetrics', () => {
    it('should return initial metrics', () => {
      const metrics = metricsCollector.getMetrics();
      
      expect(metrics).toEqual({
        cacheHitRate: 0,
        averageResponseTime: 0,
        totalRequests: 0,
        cachedRequests: 0,
        debouncedRequests: 0,
        contextOptimizations: 0
      });
    });
  });

  describe('incrementTotalRequests', () => {
    it('should increment total requests count', () => {
      metricsCollector.incrementTotalRequests();
      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.totalRequests).toBe(1);
    });
  });

  describe('incrementCachedRequests', () => {
    it('should increment cached requests count and update cache hit rate', () => {
      // First increment total requests to avoid division by zero
      metricsCollector.incrementTotalRequests();
      
      metricsCollector.incrementCachedRequests();
      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.cachedRequests).toBe(1);
      expect(metrics.cacheHitRate).toBe(1);
    });
  });

  describe('incrementDebouncedRequests', () => {
    it('should increment debounced requests count', () => {
      metricsCollector.incrementDebouncedRequests();
      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.debouncedRequests).toBe(1);
    });
  });

  describe('incrementContextOptimizations', () => {
    it('should increment context optimizations count', () => {
      metricsCollector.incrementContextOptimizations();
      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.contextOptimizations).toBe(1);
    });
  });

  describe('updateCacheHitRate', () => {
    it('should correctly calculate cache hit rate', () => {
      // Set up some requests
      (metricsCollector as any).metrics.totalRequests = 10;
      (metricsCollector as any).metrics.cachedRequests = 7;
      
      (metricsCollector as any).updateCacheHitRate();
      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.cacheHitRate).toBe(0.7);
    });

    it('should handle zero total requests', () => {
      (metricsCollector as any).updateCacheHitRate();
      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.cacheHitRate).toBe(0);
    });
  });

  describe('updateAverageResponseTime', () => {
    it('should correctly calculate average response time', () => {
      // Set up initial metrics
      (metricsCollector as any).metrics.totalRequests = 3;
      (metricsCollector as any).metrics.averageResponseTime = 100;
      
      (metricsCollector as any).updateAverageResponseTime(200);
      const metrics = metricsCollector.getMetrics();
      
      // Expected: (100 * 2 + 200) / 3 = 400 / 3 = 133.333...
      expect(metrics.averageResponseTime).toBeCloseTo(133.333, 3);
    });
  });

  describe('resetMetrics', () => {
    it('should reset all metrics to initial values', () => {
      // Set up some metrics
      (metricsCollector as any).metrics.totalRequests = 10;
      (metricsCollector as any).metrics.cachedRequests = 5;
      (metricsCollector as any).metrics.debouncedRequests = 3;
      (metricsCollector as any).metrics.contextOptimizations = 2;
      (metricsCollector as any).metrics.cacheHitRate = 0.5;
      (metricsCollector as any).metrics.averageResponseTime = 150;
      
      metricsCollector.resetMetrics();
      const metrics = metricsCollector.getMetrics();
      
      expect(metrics).toEqual({
        cacheHitRate: 0,
        averageResponseTime: 0,
        totalRequests: 0,
        cachedRequests: 0,
        debouncedRequests: 0,
        contextOptimizations: 0
      });
    });
  });

  describe('recordCacheHit', () => {
    it('should record a cache hit', () => {
      metricsCollector.recordCacheHit();
      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.cachedRequests).toBe(1);
      expect(metrics.cacheHitRate).toBe(1);
    });
  });

  describe('recordCacheMiss', () => {
    it('should record a cache miss', () => {
      metricsCollector.recordCacheMiss();
      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.cachedRequests).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);
    });
  });

  describe('recordDebouncedRequest', () => {
    it('should record a debounced request', () => {
      metricsCollector.recordDebouncedRequest();
      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.debouncedRequests).toBe(1);
    });
  });

  describe('recordContextOptimization', () => {
    it('should record a context optimization', () => {
      metricsCollector.recordContextOptimization();
      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.contextOptimizations).toBe(1);
    });
  });
});