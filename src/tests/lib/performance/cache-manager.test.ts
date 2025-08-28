import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheManager } from './cache-manager';
import { AIResponse } from '../../ai-interfaces';
import { AIMode } from '../../ai-types';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  const mockSuccessResponse: AIResponse = {
    success: true,
    content: 'test content',
    timestamp: Date.now(),
    requestId: 'test-id',
    metadata: {
      tokensUsed: 100,
      processingTime: 50,
      model: 'test-model'
    }
  };

  const mockErrorResponse: AIResponse = {
    success: false,
    error: 'test error',
    errorCode: 'TEST_ERROR',
    retryable: false,
    timestamp: Date.now(),
    requestId: 'test-id',
    metadata: {
      tokensUsed: 0,
      processingTime: 0
    }
  };

  beforeEach(() => {
    cacheManager = new CacheManager();
    vi.useFakeTimers();
  });

  describe('createCacheKey', () => {
    it('should create a unique cache key for different requests', () => {
      const key1 = cacheManager.createCacheKey(AIMode.PROMPT, 'content1', { param: 'value1' });
      const key2 = cacheManager.createCacheKey(AIMode.PROMPT, 'content2', { param: 'value2' });
      
      expect(key1).not.toBe(key2);
    });

    it('should create the same cache key for identical requests', () => {
      const key1 = cacheManager.createCacheKey(AIMode.PROMPT, 'content', { param: 'value' });
      const key2 = cacheManager.createCacheKey(AIMode.PROMPT, 'content', { param: 'value' });
      
      expect(key1).toBe(key2);
    });
  });

  describe('cacheResponse', () => {
    it('should cache successful responses', () => {
      const cacheKey = 'test-key';
      cacheManager.cacheResponse(cacheKey, mockSuccessResponse);
      
      const cachedResponse = cacheManager.getCachedResponse(cacheKey);
      expect(cachedResponse).toEqual(mockSuccessResponse);
    });

    it('should not cache error responses', () => {
      const cacheKey = 'test-key';
      cacheManager.cacheResponse(cacheKey, mockErrorResponse);
      
      const cachedResponse = cacheManager.getCachedResponse(cacheKey);
      expect(cachedResponse).toBeNull();
    });
  });

  describe('getCachedResponse', () => {
    it('should return null for non-existent cache entries', () => {
      const cachedResponse = cacheManager.getCachedResponse('non-existent-key');
      expect(cachedResponse).toBeNull();
    });

    it('should return cached response for valid entries', () => {
      const cacheKey = 'test-key';
      cacheManager.cacheResponse(cacheKey, mockSuccessResponse);
      
      const cachedResponse = cacheManager.getCachedResponse(cacheKey);
      expect(cachedResponse).toEqual(mockSuccessResponse);
    });

    it('should return null for expired cache entries', () => {
      const cacheKey = 'test-key';
      cacheManager.cacheResponse(cacheKey, mockSuccessResponse);
      
      // Advance time beyond TTL
      vi.advanceTimersByTime(31 * 60 * 1000); // 31 minutes
      
      const cachedResponse = cacheManager.getCachedResponse(cacheKey);
      expect(cachedResponse).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear all cache entries', () => {
      cacheManager.cacheResponse('key1', mockSuccessResponse);
      cacheManager.cacheResponse('key2', mockSuccessResponse);
      
      expect(cacheManager.getCacheStats().size).toBe(2);
      
      cacheManager.clearCache();
      
      expect(cacheManager.getCacheStats().size).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return correct cache statistics', () => {
      cacheManager.cacheResponse('key1', mockSuccessResponse);
      cacheManager.cacheResponse('key2', mockSuccessResponse);
      
      const stats = cacheManager.getCacheStats();
      
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(100);
      expect(stats.oldestEntry).toBeGreaterThan(0);
      expect(stats.newestEntry).toBeGreaterThan(0);
    });
  });

  describe('getCacheConfig', () => {
    it('should return the cache configuration', () => {
      const config = cacheManager.getCacheConfig();
      
      expect(config).toEqual({
        maxSize: 100,
        ttlMs: 30 * 60 * 1000,
        maxAccessCount: 10
      });
    });
  });
});