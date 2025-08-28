import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetworkErrorHandler, NetworkStatus } from './network-error-handler';
import { AIError, AIErrorType } from '../../ai-error-handler';

describe('NetworkErrorHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkNetworkConnectivity', () => {
    it('should return online status when navigator is online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      
      // Mock fetch to simulate successful health check
      global.fetch = vi.fn().mockResolvedValue({ ok: true });
      
      const result = await NetworkErrorHandler.checkNetworkConnectivity();
      
      expect(result.isOnline).toBe(true);
    });

    it('should return offline status when navigator is offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      
      const result = await NetworkErrorHandler.checkNetworkConnectivity();
      
      expect(result.isOnline).toBe(false);
    });
  });

  describe('handleNetworkError', () => {
    it('should execute operation successfully on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const context = { operation: 'test', mode: 'prompt' as any, timestamp: Date.now() };
      
      const result = await NetworkErrorHandler.handleNetworkError(operation, context);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry operation on network error', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');
      const context = { operation: 'test', mode: 'prompt' as any, timestamp: Date.now() };
      
      const result = await NetworkErrorHandler.handleNetworkError(operation, context, 2);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries exceeded', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'));
      const context = { operation: 'test', mode: 'prompt' as any, timestamp: Date.now() };
      
      await expect(NetworkErrorHandler.handleNetworkError(operation, context, 2))
        .rejects
        .toThrow('Network connection failed. Please check your internet connection.');
    });
  });

  describe('normalizeNetworkError', () => {
    it('should return AIError as-is if already an AIError', () => {
      const aiError = new AIError('Test error', AIErrorType.NETWORK_ERROR, 'TEST_ERROR', true);
      
      const result = NetworkErrorHandler.normalizeNetworkError(aiError);
      
      expect(result).toBe(aiError);
    });

    it('should normalize network-related errors', () => {
      const error = new Error('Network connection failed');
      
      const result = NetworkErrorHandler.normalizeNetworkError(error);
      
      expect(result).toBeInstanceOf(AIError);
      expect(result.type).toBe(AIErrorType.NETWORK_ERROR);
      expect(result.retryable).toBe(true);
    });

    it('should normalize timeout errors', () => {
      const error = new Error('Request timeout');
      
      const result = NetworkErrorHandler.normalizeNetworkError(error);
      
      expect(result).toBeInstanceOf(AIError);
      expect(result.type).toBe(AIErrorType.TIMEOUT_ERROR);
      expect(result.retryable).toBe(true);
    });

    it('should normalize unknown errors', () => {
      const error = new Error('Unknown error');
      
      const result = NetworkErrorHandler.normalizeNetworkError(error);
      
      expect(result).toBeInstanceOf(AIError);
      expect(result.type).toBe(AIErrorType.NETWORK_ERROR);
      expect(result.retryable).toBe(true);
    });
  });
});