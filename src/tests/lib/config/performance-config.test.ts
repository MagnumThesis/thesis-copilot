import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CACHE_CONFIG,
  DEFAULT_DEBOUNCE_CONFIG,
  CacheConfig,
  DebounceConfig
} from './performance-config';

describe('performance-config', () => {
  describe('DEFAULT_CACHE_CONFIG', () => {
    it('should have correct default cache configuration values', () => {
      const expectedCacheConfig: CacheConfig = {
        maxSize: 100,
        ttlMs: 30 * 60 * 1000, // 30 minutes
        maxAccessCount: 10
      };

      expect(DEFAULT_CACHE_CONFIG).toEqual(expectedCacheConfig);
    });
  });

  describe('DEFAULT_DEBOUNCE_CONFIG', () => {
    it('should have correct default debounce configuration values', () => {
      const expectedDebounceConfig: DebounceConfig = {
        delayMs: 300,
        maxWaitMs: 2000
      };

      expect(DEFAULT_DEBOUNCE_CONFIG).toEqual(expectedDebounceConfig);
    });
  });
});