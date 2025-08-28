import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DebounceManager } from './debounce-manager';
import { AIResponse } from '../../ai-interfaces';

describe('DebounceManager', () => {
  let debounceManager: DebounceManager;
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

  beforeEach(() => {
    debounceManager = new DebounceManager();
    vi.useFakeTimers();
  });

  describe('debouncedRequest', () => {
    it('should execute request immediately when forceImmediate is true', async () => {
      const requestFn = vi.fn().mockResolvedValue(mockSuccessResponse);
      
      const result = await debounceManager.debouncedRequest('test-key', requestFn, true);
      
      expect(requestFn).toHaveBeenCalled();
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should debounce requests with the same key', async () => {
      const requestFn = vi.fn().mockResolvedValue(mockSuccessResponse);
      
      // Call the debounced function twice with the same key
      const promise1 = debounceManager.debouncedRequest('test-key', requestFn);
      const promise2 = debounceManager.debouncedRequest('test-key', requestFn);
      
      // Advance time to trigger the debounced execution
      vi.advanceTimersByTime(300);
      
      // Both promises should resolve to the same result
      const result1 = await promise1;
      const result2 = await promise2;
      
      // The request function should only be called once
      expect(requestFn).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockSuccessResponse);
      expect(result2).toEqual(mockSuccessResponse);
    });

    it('should execute requests with different keys independently', async () => {
      const requestFn1 = vi.fn().mockResolvedValue(mockSuccessResponse);
      const requestFn2 = vi.fn().mockResolvedValue({ ...mockSuccessResponse, content: 'different content' });
      
      // Call the debounced function with different keys
      const promise1 = debounceManager.debouncedRequest('key-1', requestFn1);
      const promise2 = debounceManager.debouncedRequest('key-2', requestFn2);
      
      // Advance time to trigger the debounced execution
      vi.advanceTimersByTime(300);
      
      // Both promises should resolve
      const result1 = await promise1;
      const result2 = await promise2;
      
      // Each request function should be called once
      expect(requestFn1).toHaveBeenCalledTimes(1);
      expect(requestFn2).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockSuccessResponse);
      expect(result2.content).toBe('different content');
    });
  });

  describe('cancelPendingRequests', () => {
    it('should cancel all pending debounced requests', async () => {
      const requestFn = vi.fn().mockResolvedValue(mockSuccessResponse);
      
      // Start a debounced request
      const promise = debounceManager.debouncedRequest('test-key', requestFn);
      
      // Cancel all pending requests
      debounceManager.cancelPendingRequests();
      
      // Advance time
      vi.advanceTimersByTime(300);
      
      // The promise should reject or never resolve
      await expect(promise).rejects.toThrow();
    });
  });

  describe('getDebounceStats', () => {
    it('should return correct debounce statistics', () => {
      const stats = debounceManager.getDebounceStats();
      
      expect(stats).toEqual({
        pendingRequestsCount: 0,
        debounceTimersCount: 0,
        debouncedRequestsCount: 0
      });
    });
  });

  describe('getDebounceConfig', () => {
    it('should return the debounce configuration', () => {
      const config = debounceManager.getDebounceConfig();
      
      expect(config).toEqual({
        delayMs: 300,
        maxWaitMs: 2000
      });
    });
  });
});