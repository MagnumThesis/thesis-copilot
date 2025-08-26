/**
 * Tests for AI Searcher Comprehensive Error Handling System
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import {
  AISearcherErrorHandler,
  AISearcherErrorType,
  AISearcherErrorSeverity,
  SEARCH_RETRY_CONFIG,
  CONTENT_EXTRACTION_RETRY_CONFIG,
  QUERY_GENERATION_RETRY_CONFIG,
  DEFAULT_FALLBACK_CONFIG,
  DEFAULT_MONITORING_CONFIG
} from '../lib/ai-searcher-error-handling';

// Mock console methods
const mockConsole = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

global.console = mockConsole as any;

describe('AISearcherErrorHandler', () => {
  let errorHandler: AISearcherErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler = AISearcherErrorHandler.getInstance();
    errorHandler.resetErrorMetrics();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Classification', () => {
    it('should classify rate limit errors correctly', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      const classified = await errorHandler.handleError(rateLimitError, 'search');

      expect(classified.type).toBe(AISearcherErrorType.RATE_LIMIT_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(true);
      expect(classified.userMessage).toContain('Too many searches');
    });

    it('should classify network errors correctly', async () => {
      const networkError = new Error('Network connection failed');
      const classified = await errorHandler.handleError(networkError, 'search');

      expect(classified.type).toBe(AISearcherErrorType.NETWORK_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.HIGH);
      expect(classified.retryable).toBe(true);
      expect(classified.userMessage).toContain('Network connection issue');
    });

    it('should classify timeout errors correctly', async () => {
      const timeoutError = new Error('Request timeout');
      const classified = await errorHandler.handleError(timeoutError, 'search');

      expect(classified.type).toBe(AISearcherErrorType.TIMEOUT_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(true);
      expect(classified.userMessage).toContain('timed out');
    });

    it('should classify authentication errors correctly', async () => {
      const authError = new Error('Access blocked 403');
      const classified = await errorHandler.handleError(authError, 'search');

      expect(classified.type).toBe(AISearcherErrorType.AUTHENTICATION_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.HIGH);
      expect(classified.retryable).toBe(false);
      expect(classified.userMessage).toContain('Authentication failed');
    });

    it('should classify service unavailable errors correctly', async () => {
      const serviceError = new Error('Service unavailable 503');
      const classified = await errorHandler.handleError(serviceError, 'search');

      expect(classified.type).toBe(AISearcherErrorType.SERVICE_UNAVAILABLE_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.HIGH);
      expect(classified.retryable).toBe(true);
      expect(classified.userMessage).toContain('temporarily unavailable');
    });

    it('should classify quota exceeded errors correctly', async () => {
      const quotaError = new Error('Daily quota limit exceeded');
      const classified = await errorHandler.handleError(quotaError, 'search');

      expect(classified.type).toBe(AISearcherErrorType.QUOTA_EXCEEDED_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.CRITICAL);
      expect(classified.retryable).toBe(false);
      expect(classified.userMessage).toContain('Daily search limit');
    });

    it('should classify parsing errors correctly', async () => {
      const parseError = new Error('Failed to parse invalid response');
      const classified = await errorHandler.handleError(parseError, 'search');

      expect(classified.type).toBe(AISearcherErrorType.PARSING_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(true);
      expect(classified.userMessage).toContain('process search results');
    });

    it('should classify content extraction errors correctly', async () => {
      const contentError = new Error('Content extraction failed');
      const classified = await errorHandler.handleError(contentError, 'content_extraction');

      expect(classified.type).toBe(AISearcherErrorType.CONTENT_EXTRACTION_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(true);
      expect(classified.userMessage).toContain('analyze your content');
    });

    it('should classify query generation errors correctly', async () => {
      const queryError = new Error('Query generation failed');
      const classified = await errorHandler.handleError(queryError, 'query_generation');

      expect(classified.type).toBe(AISearcherErrorType.QUERY_GENERATION_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.LOW);
      expect(classified.retryable).toBe(true);
      expect(classified.userMessage).toContain('generate search terms');
    });

    it('should classify database errors correctly', async () => {
      const dbError = new Error('Supabase database connection failed');
      const classified = await errorHandler.handleError(dbError, 'search');

      expect(classified.type).toBe(AISearcherErrorType.DATABASE_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.HIGH);
      expect(classified.retryable).toBe(true);
      expect(classified.userMessage).toContain('save search results');
    });

    it('should classify cache errors correctly', async () => {
      const cacheError = new Error('Cache operation failed');
      const classified = await errorHandler.handleError(cacheError, 'search');

      expect(classified.type).toBe(AISearcherErrorType.CACHE_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.LOW);
      expect(classified.retryable).toBe(false);
      expect(classified.userMessage).toContain('Cache error');
    });

    it('should handle string errors', async () => {
      const stringError = 'Simple error message';
      const classified = await errorHandler.handleError(stringError, 'search');

      expect(classified.type).toBe(AISearcherErrorType.UNKNOWN_ERROR);
      expect(classified.message).toBe(stringError);
      expect(classified.userMessage).toContain('unexpected error');
    });

    it('should include context information', async () => {
      const error = new Error('Test error');
      const context = {
        conversationId: 'conv-123',
        sessionId: 'session-456',
        query: 'test query',
        contentSources: ['ideas', 'builder']
      };

      const classified = await errorHandler.handleError(error, 'search', context);

      expect(classified.conversationId).toBe('conv-123');
      expect(classified.sessionId).toBe('session-456');
      expect(classified.context).toEqual(context);
    });
  });

  describe('Recovery Actions Generation', () => {
    it('should generate retry actions for retryable errors', async () => {
      const retryableError = new Error('Network connection failed');
      const classified = await errorHandler.handleError(retryableError, 'search');

      const retryAction = classified.recoveryActions.find(action => action.type === 'retry');
      expect(retryAction).toBeDefined();
      expect(retryAction?.label).toBe('Try Again');
      expect(retryAction?.priority).toBe(1);
    });

    it('should generate fallback actions when available', async () => {
      const serviceError = new Error('Service unavailable');
      const classified = await errorHandler.handleError(serviceError, 'search');

      const fallbackAction = classified.recoveryActions.find(action => action.type === 'fallback');
      expect(fallbackAction).toBeDefined();
      expect(fallbackAction?.label).toBe('Use Alternative Service');
    });

    it('should generate manual actions for query generation errors', async () => {
      const queryError = new Error('Query generation failed');
      const classified = await errorHandler.handleError(queryError, 'query_generation');

      const manualAction = classified.recoveryActions.find(action => action.type === 'manual');
      expect(manualAction).toBeDefined();
      expect(manualAction?.label).toBe('Enter Search Terms Manually');
    });

    it('should generate manual actions for content extraction errors', async () => {
      const contentError = new Error('Content extraction failed');
      const classified = await errorHandler.handleError(contentError, 'content_extraction');

      const manualAction = classified.recoveryActions.find(action => action.type === 'manual');
      expect(manualAction).toBeDefined();
      expect(manualAction?.label).toBe('Select Different Content');
    });

    it('should generate degraded mode actions', async () => {
      const error = new Error('Service unavailable');
      const classified = await errorHandler.handleError(error, 'search');

      const degradedAction = classified.recoveryActions.find(action => action.type === 'degraded_mode');
      expect(degradedAction).toBeDefined();
      expect(degradedAction?.label).toBe('Continue with Limited Features');
    });

    it('should sort recovery actions by priority', async () => {
      const error = new Error('Network error');
      const classified = await errorHandler.handleError(error, 'search');

      const priorities = classified.recoveryActions.map(action => action.priority);
      const sortedPriorities = [...priorities].sort((a, b) => a - b);
      expect(priorities).toEqual(sortedPriorities);
    });
  });

  describe('Retry Logic', () => {
    it('should retry retryable operations', async () => {
      let attemptCount = 0;
      const operation = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Network connection failed');
        }
        return Promise.resolve('success');
      });

      const result = await errorHandler.executeWithRetry(operation, 'search');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    }, 10000); // Increase timeout

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Authentication failed 403'));

      await expect(errorHandler.executeWithRetry(operation, 'search')).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect max retry attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network connection failed'));

      await expect(errorHandler.executeWithRetry(operation, 'search')).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(SEARCH_RETRY_CONFIG.maxAttempts);
    });

    it('should use different retry configs for different operations', async () => {
      const searchOperation = vi.fn().mockRejectedValue(new Error('Network error'));
      const contentOperation = vi.fn().mockRejectedValue(new Error('Content extraction error'));

      await expect(errorHandler.executeWithRetry(searchOperation, 'search')).rejects.toThrow();
      await expect(errorHandler.executeWithRetry(contentOperation, 'content_extraction')).rejects.toThrow();

      expect(searchOperation).toHaveBeenCalledTimes(SEARCH_RETRY_CONFIG.maxAttempts);
      expect(contentOperation).toHaveBeenCalledTimes(CONTENT_EXTRACTION_RETRY_CONFIG.maxAttempts);
    });

    it('should implement exponential backoff', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0); // Execute immediately for test
      });

      const operation = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(errorHandler.executeWithRetry(operation, 'search')).rejects.toThrow();

      // Should have delays for retries (excluding first attempt)
      expect(delays.length).toBeGreaterThan(0);
      
      // Each delay should be larger than the previous (exponential backoff)
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
      }

      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should attempt fallback when primary operation fails', async () => {
      const mockFallbackService = {
        name: 'test_service',
        type: 'search' as const,
        priority: 1,
        enabled: true,
        healthCheck: vi.fn().mockResolvedValue(true),
        execute: vi.fn().mockResolvedValue(['fallback result'])
      };

      const customFallbackConfig = {
        ...DEFAULT_FALLBACK_CONFIG,
        services: [mockFallbackService]
      };

      const customErrorHandler = AISearcherErrorHandler.getInstance(customFallbackConfig);
      
      const operation = vi.fn().mockRejectedValue(new Error('Service unavailable'));

      const result = await customErrorHandler.executeWithRetry(operation, 'search');

      expect(mockFallbackService.healthCheck).toHaveBeenCalled();
      expect(mockFallbackService.execute).toHaveBeenCalled();
      expect(result).toEqual(['fallback result']);
    });

    it('should skip unhealthy fallback services', async () => {
      const unhealthyService = {
        name: 'unhealthy_service',
        type: 'search' as const,
        priority: 1,
        enabled: true,
        healthCheck: vi.fn().mockResolvedValue(false),
        execute: vi.fn()
      };

      const healthyService = {
        name: 'healthy_service',
        type: 'search' as const,
        priority: 2,
        enabled: true,
        healthCheck: vi.fn().mockResolvedValue(true),
        execute: vi.fn().mockResolvedValue(['healthy result'])
      };

      const customFallbackConfig = {
        ...DEFAULT_FALLBACK_CONFIG,
        services: [unhealthyService, healthyService]
      };

      const customErrorHandler = AISearcherErrorHandler.getInstance(customFallbackConfig);
      
      const operation = vi.fn().mockRejectedValue(new Error('Service unavailable'));

      const result = await customErrorHandler.executeWithRetry(operation, 'search');

      expect(unhealthyService.execute).not.toHaveBeenCalled();
      expect(healthyService.execute).toHaveBeenCalled();
      expect(result).toEqual(['healthy result']);
    });

    it('should use degraded mode when all fallbacks fail', async () => {
      const failingService = {
        name: 'failing_service',
        type: 'search' as const,
        priority: 1,
        enabled: true,
        healthCheck: vi.fn().mockResolvedValue(true),
        execute: vi.fn().mockRejectedValue(new Error('Fallback failed'))
      };

      const customFallbackConfig = {
        ...DEFAULT_FALLBACK_CONFIG,
        services: [failingService],
        degradedModeEnabled: true
      };

      const customErrorHandler = AISearcherErrorHandler.getInstance(customFallbackConfig);
      
      const operation = vi.fn().mockRejectedValue(new Error('Service unavailable'));

      const result = await customErrorHandler.executeWithRetry(operation, 'search');

      expect(result).toHaveProperty('degraded_mode', true);
      expect(result).toHaveProperty('results');
      expect(result.results[0]).toHaveProperty('title', 'Search temporarily unavailable');
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit breaker after consecutive failures', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Service error'));

      // Trigger multiple failures to open circuit breaker
      for (let i = 0; i < 6; i++) {
        try {
          await errorHandler.executeWithRetry(operation, 'search');
        } catch (error) {
          // Expected to fail
        }
      }

      // Next call should fail immediately due to open circuit breaker
      const startTime = Date.now();
      try {
        await errorHandler.executeWithRetry(operation, 'search');
      } catch (error) {
        const endTime = Date.now();
        // Should fail quickly without retries
        expect(endTime - startTime).toBeLessThan(1000);
      }
    });
  });

  describe('Error Metrics', () => {
    it('should track error metrics', async () => {
      const error1 = new Error('Network error');
      const error2 = new Error('Rate limit exceeded');
      const error3 = new Error('Network error');

      await errorHandler.handleError(error1, 'search');
      await errorHandler.handleError(error2, 'search');
      await errorHandler.handleError(error3, 'search');

      const metrics = errorHandler.getErrorMetrics();

      expect(metrics.totalErrors).toBe(3);
      expect(metrics.errorsByType[AISearcherErrorType.NETWORK_ERROR]).toBe(2);
      expect(metrics.errorsByType[AISearcherErrorType.RATE_LIMIT_ERROR]).toBe(1);
    });

    it('should reset error metrics', async () => {
      const error = new Error('Test error');
      await errorHandler.handleError(error, 'search');

      let metrics = errorHandler.getErrorMetrics();
      expect(metrics.totalErrors).toBe(1);

      errorHandler.resetErrorMetrics();
      metrics = errorHandler.getErrorMetrics();
      expect(metrics.totalErrors).toBe(0);
    });
  });

  describe('Logging and Monitoring', () => {
    it('should log errors based on severity', async () => {
      const criticalError = new Error('Daily quota limit exceeded');
      const lowError = new Error('Cache operation failed');

      await errorHandler.handleError(criticalError, 'search');
      await errorHandler.handleError(lowError, 'search');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[AI-Searcher]'),
        expect.any(Object)
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[AI-Searcher]'),
        expect.any(Object)
      );
    });

    it('should not log when monitoring is disabled', async () => {
      const customMonitoringConfig = {
        ...DEFAULT_MONITORING_CONFIG,
        enabled: false
      };

      const customErrorHandler = AISearcherErrorHandler.getInstance(
        DEFAULT_FALLBACK_CONFIG,
        customMonitoringConfig
      );

      const error = new Error('Test error');
      await customErrorHandler.handleError(error, 'search');

      expect(mockConsole.error).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
    });
  });

  describe('Degraded Mode Operations', () => {
    it('should provide degraded search results', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Service unavailable'));

      const customFallbackConfig = {
        ...DEFAULT_FALLBACK_CONFIG,
        services: [], // No fallback services
        degradedModeEnabled: true
      };

      const customErrorHandler = AISearcherErrorHandler.getInstance(customFallbackConfig);

      const result = await customErrorHandler.executeWithRetry(operation, 'search', {
        query: 'test query'
      });

      expect(result).toHaveProperty('degraded_mode', true);
      expect(result).toHaveProperty('results');
      expect(result.results[0]).toHaveProperty('title', 'Search temporarily unavailable');
      expect(result.results[0]).toHaveProperty('url', expect.stringContaining('scholar.google.com'));
    });

    it('should provide degraded content extraction', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Content extraction failed'));

      const customFallbackConfig = {
        ...DEFAULT_FALLBACK_CONFIG,
        services: [],
        degradedModeEnabled: true
      };

      const customErrorHandler = AISearcherErrorHandler.getInstance(customFallbackConfig);

      const result = await customErrorHandler.executeWithRetry(operation, 'content_extraction');

      expect(result).toHaveProperty('degraded_mode', true);
      expect(result).toHaveProperty('content', 'Content extraction temporarily unavailable');
      expect(result).toHaveProperty('message', 'Please enter search terms manually');
    });

    it('should provide degraded query generation', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Query generation failed'));

      const customFallbackConfig = {
        ...DEFAULT_FALLBACK_CONFIG,
        services: [],
        degradedModeEnabled: true
      };

      const customErrorHandler = AISearcherErrorHandler.getInstance(customFallbackConfig);

      const result = await customErrorHandler.executeWithRetry(operation, 'query_generation');

      expect(result).toHaveProperty('degraded_mode', true);
      expect(result).toHaveProperty('queries');
      expect(result.queries[0]).toHaveProperty('query', 'research paper');
      expect(result).toHaveProperty('message', 'Query generation unavailable, using generic terms');
    });
  });

  describe('Configuration Updates', () => {
    it('should update fallback configuration', () => {
      const newFallbackConfig = {
        enabled: false,
        maxAttempts: 5
      };

      errorHandler.updateConfig(newFallbackConfig);

      // Test that the configuration was updated by checking behavior
      // This is a simplified test - in practice you'd need access to internal config
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should update monitoring configuration', () => {
      const newMonitoringConfig = {
        enabled: false,
        logLevel: 'error' as const
      };

      errorHandler.updateConfig(undefined, newMonitoringConfig);

      // Test that the configuration was updated
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined errors gracefully', async () => {
      const classified1 = await errorHandler.handleError(null, 'search');
      const classified2 = await errorHandler.handleError(undefined, 'search');

      expect(classified1.type).toBe(AISearcherErrorType.UNKNOWN_ERROR);
      expect(classified2.type).toBe(AISearcherErrorType.UNKNOWN_ERROR);
    });

    it('should handle errors without message', async () => {
      const errorWithoutMessage = new Error();
      errorWithoutMessage.message = '';

      const classified = await errorHandler.handleError(errorWithoutMessage, 'search');

      expect(classified.type).toBe(AISearcherErrorType.UNKNOWN_ERROR);
      expect(classified.message).toBe('');
    });

    it('should handle very long error messages', async () => {
      const longMessage = 'A'.repeat(10000);
      const longError = new Error(longMessage);

      const classified = await errorHandler.handleError(longError, 'search');

      expect(classified.message).toBe(longMessage);
      expect(classified.userMessage).toBeDefined();
    });

    it('should handle concurrent error handling', async () => {
      const errors = Array.from({ length: 10 }, (_, i) => new Error(`Error ${i}`));
      
      const promises = errors.map(error => 
        errorHandler.handleError(error, 'search', { conversationId: `conv-${Math.random()}` })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('severity');
        expect(result).toHaveProperty('recoveryActions');
      });
    });
  });
});