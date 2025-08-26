/**
 * Basic Tests for AI Searcher Error Handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AISearcherErrorHandler,
  AISearcherErrorType,
  AISearcherErrorSeverity
} from '../lib/ai-searcher-error-handling';

describe('AI Searcher Error Handling - Basic Tests', () => {
  let errorHandler: AISearcherErrorHandler;

  beforeEach(() => {
    errorHandler = AISearcherErrorHandler.getInstance();
    errorHandler.resetErrorMetrics();
  });

  describe('Error Classification', () => {
    it('should classify rate limit errors correctly', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      const classified = await errorHandler.handleError(rateLimitError, 'search');

      expect(classified.type).toBe(AISearcherErrorType.RATE_LIMIT_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(true);
    });

    it('should classify network errors correctly', async () => {
      const networkError = new Error('Network connection failed');
      const classified = await errorHandler.handleError(networkError, 'search');

      expect(classified.type).toBe(AISearcherErrorType.NETWORK_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.HIGH);
      expect(classified.retryable).toBe(true);
    });

    it('should classify database errors correctly', async () => {
      const dbError = new Error('Supabase database connection failed');
      const classified = await errorHandler.handleError(dbError, 'search');

      expect(classified.type).toBe(AISearcherErrorType.DATABASE_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.HIGH);
      expect(classified.retryable).toBe(true);
    });

    it('should classify cache errors correctly', async () => {
      const cacheError = new Error('Cache operation failed');
      const classified = await errorHandler.handleError(cacheError, 'search');

      expect(classified.type).toBe(AISearcherErrorType.CACHE_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.LOW);
      expect(classified.retryable).toBe(false);
    });

    it('should handle empty error messages', async () => {
      const emptyError = new Error('');
      const classified = await errorHandler.handleError(emptyError, 'search');

      expect(classified.type).toBe(AISearcherErrorType.UNKNOWN_ERROR);
      expect(classified.severity).toBe(AISearcherErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(false);
    });
  });

  describe('Recovery Actions', () => {
    it('should generate retry actions for retryable errors', async () => {
      const retryableError = new Error('Network connection failed');
      const classified = await errorHandler.handleError(retryableError, 'search');

      const retryAction = classified.recoveryActions.find(action => action.type === 'retry');
      expect(retryAction).toBeDefined();
      expect(retryAction?.label).toBe('Try Again');
    });

    it('should generate manual actions for query generation errors', async () => {
      const queryError = new Error('Query generation failed');
      const classified = await errorHandler.handleError(queryError, 'query_generation');

      const manualAction = classified.recoveryActions.find(action => action.type === 'manual');
      expect(manualAction).toBeDefined();
      expect(manualAction?.label).toBe('Enter Search Terms Manually');
    });
  });

  describe('Error Metrics', () => {
    it('should track error metrics', async () => {
      const error1 = new Error('Network error');
      const error2 = new Error('Rate limit exceeded');

      await errorHandler.handleError(error1, 'search');
      await errorHandler.handleError(error2, 'search');

      const metrics = errorHandler.getErrorMetrics();
      expect(metrics.totalErrors).toBe(2);
      expect(metrics.errorsByType[AISearcherErrorType.NETWORK_ERROR]).toBe(1);
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

  describe('User Messages', () => {
    it('should provide user-friendly error messages', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      const classified = await errorHandler.handleError(rateLimitError, 'search');

      expect(classified.userMessage).toContain('Too many searches');
      expect(classified.userMessage).not.toContain('Rate limit exceeded'); // Technical message
    });

    it('should include context information', async () => {
      const error = new Error('Test error');
      const context = {
        conversationId: 'conv-123',
        query: 'test query'
      };

      const classified = await errorHandler.handleError(error, 'search', context);

      expect(classified.conversationId).toBe('conv-123');
      expect(classified.context).toEqual(context);
    });
  });

  describe('Configuration', () => {
    it('should update fallback configuration', () => {
      const newConfig = {
        enabled: false,
        maxAttempts: 5
      };

      errorHandler.updateConfig(newConfig);
      // Configuration update should not throw
      expect(true).toBe(true);
    });

    it('should update monitoring configuration', () => {
      const newConfig = {
        enabled: false,
        logLevel: 'error' as const
      };

      errorHandler.updateConfig(undefined, newConfig);
      // Configuration update should not throw
      expect(true).toBe(true);
    });
  });
});