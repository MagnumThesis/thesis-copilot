import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIModeManager } from '../hooks/use-ai-mode-manager';
import { AIError, AIErrorType, AIErrorHandler } from '../lib/ai-infrastructure';
import { AIMode, ModificationType } from '../lib/ai-types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('AI Error Handling', () => {
  const mockConversationId = 'test-conversation-id';
  const mockDocumentContent = 'Test document content';

  beforeEach(() => {
    vi.clearAllMocks();
    navigator.onLine = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AIErrorHandler', () => {
    it('should normalize network errors correctly', () => {
      const networkError = new Error('fetch failed');
      const aiError = AIErrorHandler['normalizeError'](networkError);

      expect(aiError).toBeInstanceOf(AIError);
      expect(aiError.type).toBe(AIErrorType.NETWORK_ERROR);
      expect(aiError.retryable).toBe(true);
    });

    it('should normalize timeout errors correctly', () => {
      const timeoutError = new Error('Request timeout');
      const aiError = AIErrorHandler['normalizeError'](timeoutError);

      expect(aiError).toBeInstanceOf(AIError);
      expect(aiError.type).toBe(AIErrorType.TIMEOUT_ERROR);
      expect(aiError.retryable).toBe(true);
    });

    it('should normalize rate limit errors correctly', () => {
      const rateLimitError = new Error('rate limit exceeded');
      const aiError = AIErrorHandler['normalizeError'](rateLimitError);

      expect(aiError).toBeInstanceOf(AIError);
      expect(aiError.type).toBe(AIErrorType.RATE_LIMIT_ERROR);
      expect(aiError.retryable).toBe(true);
    });

    it('should normalize authentication errors correctly', () => {
      const authError = new Error('401 unauthorized');
      const aiError = AIErrorHandler['normalizeError'](authError);

      expect(aiError).toBeInstanceOf(AIError);
      expect(aiError.type).toBe(AIErrorType.AUTHENTICATION_ERROR);
      expect(aiError.retryable).toBe(false);
    });

    it('should provide appropriate retry strategies', () => {
      const networkError = new AIError('Network failed', AIErrorType.NETWORK_ERROR, 'NET_001', true);
      const strategy = AIErrorHandler.getRetryStrategy(networkError);

      expect(strategy.retryAttempts).toBe(3);
      expect(strategy.gracefulDegradation).toBe(true);
      expect(strategy.autoRetry).toBe(true);
    });

    it('should provide user-friendly error messages', () => {
      const networkError = new AIError('Network failed', AIErrorType.NETWORK_ERROR, 'NET_001', true);
      const message = AIErrorHandler.getUserFriendlyMessage(networkError);

      expect(message).toContain('internet connection');
    });

    it('should check network connectivity', async () => {
      // Mock successful health check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const status = await AIErrorHandler.checkNetworkConnectivity();
      expect(status.isOnline).toBe(true);
    });

    it('should handle network connectivity check failure', async () => {
      // Mock failed health check
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const status = await AIErrorHandler.checkNetworkConnectivity();
      expect(status.isOnline).toBe(false);
    });
  });

  describe('useAIModeManager Error Handling', () => {
    it('should handle prompt processing errors', async () => {
      const { result } = renderHook(() =>
        useAIModeManager(mockConversationId, mockDocumentContent)
      );

      // Mock API error response
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      await act(async () => {
        try {
          await result.current.processPrompt('test prompt', 0);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(result.current.errorState.error).toBeInstanceOf(AIError);
    });

    it('should handle continue processing errors', async () => {
      const { result } = renderHook(() =>
        useAIModeManager(mockConversationId, mockDocumentContent)
      );

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('fetch failed'));

      await act(async () => {
        try {
          await result.current.processContinue(0);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(result.current.errorState.error?.type).toBe(AIErrorType.NETWORK_ERROR);
    });

    it('should handle modify processing errors', async () => {
      const { result } = renderHook(() =>
        useAIModeManager(mockConversationId, mockDocumentContent)
      );

      // Mock timeout error
      mockFetch.mockRejectedValueOnce(new Error('timeout'));

      await act(async () => {
        try {
          await result.current.processModify('test text', ModificationType.REWRITE);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(result.current.errorState.error?.type).toBe(AIErrorType.TIMEOUT_ERROR);
    });

    it('should clear errors when requested', async () => {
      const { result } = renderHook(() =>
        useAIModeManager(mockConversationId, mockDocumentContent)
      );

      // Simulate an error
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      await act(async () => {
        try {
          await result.current.processPrompt('test prompt', 0);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.errorState.hasError).toBe(true);

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.errorState.hasError).toBe(false);
      expect(result.current.errorState.error).toBe(null);
    });

    it('should handle graceful degradation', async () => {
      const { result } = renderHook(() =>
        useAIModeManager(mockConversationId, mockDocumentContent)
      );

      // Set mode to MODIFY
      act(() => {
        result.current.setMode(AIMode.MODIFY);
      });

      // Simulate an error that should trigger graceful degradation
      mockFetch.mockRejectedValueOnce(new Error('Service unavailable'));

      await act(async () => {
        try {
          await result.current.processModify('test text', ModificationType.REWRITE);
        } catch (error) {
          // Expected to throw
        }
      });

      // Should have gracefully degraded to NONE mode
      expect(result.current.currentMode).toBe(AIMode.NONE);
    });

    it('should support retry functionality', async () => {
      const { result } = renderHook(() =>
        useAIModeManager(mockConversationId, mockDocumentContent)
      );

      // Mock initial failure then success
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            content: 'Generated content',
            timestamp: Date.now(),
          }),
        });

      // First attempt should fail
      await act(async () => {
        try {
          await result.current.processPrompt('test prompt', 0);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(result.current.errorState.canRetry).toBe(true);

      // Retry should succeed
      await act(async () => {
        await result.current.retryLastOperation();
      });

      expect(result.current.errorState.hasError).toBe(false);
    });

    it('should validate requests before processing', async () => {
      const { result } = renderHook(() =>
        useAIModeManager('', mockDocumentContent) // Empty conversation ID
      );

      await act(async () => {
        try {
          await result.current.processPrompt('test prompt', 0);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(result.current.errorState.error?.type).toBe(AIErrorType.VALIDATION_ERROR);
    });
  });

  describe('Network Error Handling', () => {
    it('should handle offline scenarios', async () => {
      // Simulate offline
      navigator.onLine = false;

      const { result } = renderHook(() =>
        useAIModeManager(mockConversationId, mockDocumentContent)
      );

      await act(async () => {
        try {
          await result.current.processPrompt('test prompt', 0);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.errorState.hasError).toBe(true);
    });

    it('should implement exponential backoff for retries', async () => {
      const { result } = renderHook(() =>
        useAIModeManager(mockConversationId, mockDocumentContent, {
          maxRetries: 3,
        })
      );

      // Mock multiple failures
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const startTime = Date.now();

      await act(async () => {
        try {
          await result.current.processPrompt('test prompt', 0);
        } catch (error) {
          // Expected to throw after all retries
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have taken some time due to retry delays
      expect(duration).toBeGreaterThan(1000); // At least 1 second for retries
      expect(result.current.errorState.hasError).toBe(true);
    });
  });

  describe('Backend Error Handling', () => {
    it('should handle HTTP error responses', async () => {
      const { result } = renderHook(() =>
        useAIModeManager(mockConversationId, mockDocumentContent)
      );

      // Mock HTTP 500 error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error'),
      });

      await act(async () => {
        try {
          await result.current.processPrompt('test prompt', 0);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(result.current.errorState.error?.type).toBe(AIErrorType.SERVICE_UNAVAILABLE);
    });

    it('should handle malformed responses', async () => {
      const { result } = renderHook(() =>
        useAIModeManager(mockConversationId, mockDocumentContent)
      );

      // Mock malformed response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null), // Invalid response
      });

      await act(async () => {
        try {
          await result.current.processPrompt('test prompt', 0);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(result.current.errorState.error?.type).toBe(AIErrorType.API_ERROR);
    });

    it('should handle request timeouts', async () => {
      const { result } = renderHook(() =>
        useAIModeManager(mockConversationId, mockDocumentContent, {
          timeout: 100, // Very short timeout
        })
      );

      // Mock slow response
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({
                  success: true,
                  content: 'Generated content',
                  timestamp: Date.now(),
                }),
              });
            }, 200); // Longer than timeout
          })
      );

      await act(async () => {
        try {
          await result.current.processPrompt('test prompt', 0);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(result.current.errorState.error?.type).toBe(AIErrorType.TIMEOUT_ERROR);
    });
  });

  describe('Validation Error Handling', () => {
    it('should validate empty prompts', async () => {
      const { result } = renderHook(() =>
        useAIModeManager(mockConversationId, mockDocumentContent)
      );

      await act(async () => {
        try {
          await result.current.processPrompt('', 0); // Empty prompt
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(result.current.errorState.error?.type).toBe(AIErrorType.VALIDATION_ERROR);
    });

    it('should validate text selection for modify mode', async () => {
      const { result } = renderHook(() =>
        useAIModeManager(mockConversationId, mockDocumentContent)
      );

      await act(async () => {
        try {
          await result.current.processModify('', ModificationType.REWRITE); // Empty selection
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.errorState.hasError).toBe(true);
      expect(result.current.errorState.error?.type).toBe(AIErrorType.VALIDATION_ERROR);
    });
  });
});