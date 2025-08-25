/**
 * Integration Tests for Proofreader Error Handling
 * Focused on core error handling functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  ProofreaderErrorHandler, 
  ErrorType, 
  ErrorSeverity 
} from '../lib/proofreader-error-handling';

describe('Proofreader Error Handling Integration', () => {
  let errorHandler: ProofreaderErrorHandler;

  beforeEach(() => {
    errorHandler = ProofreaderErrorHandler.getInstance();
  });

  describe('Core Error Classification', () => {
    it('should classify different error types correctly', () => {
      const testCases = [
        {
          error: new Error('Failed to fetch'),
          expectedType: ErrorType.NETWORK_ERROR,
          expectedRetryable: true
        },
        {
          error: new Error('Request timeout'),
          expectedType: ErrorType.TIMEOUT_ERROR,
          expectedRetryable: true
        },
        {
          error: new Error('Invalid API key'),
          expectedType: ErrorType.AUTHENTICATION_ERROR,
          expectedRetryable: false
        },
        {
          error: new Error('Rate limit exceeded'),
          expectedType: ErrorType.RATE_LIMIT_ERROR,
          expectedRetryable: true
        },
        {
          error: new Error('AI model generation failed'),
          expectedType: ErrorType.AI_SERVICE_ERROR,
          expectedRetryable: true
        },
        {
          error: new Error('Content is required'),
          expectedType: ErrorType.CONTENT_ERROR,
          expectedRetryable: false
        }
      ];

      testCases.forEach(({ error, expectedType, expectedRetryable }) => {
        const classified = errorHandler.classifyError(error, 'test_operation');
        expect(classified.type).toBe(expectedType);
        expect(classified.retryable).toBe(expectedRetryable);
        expect(classified.userMessage).toBeDefined();
        expect(classified.timestamp).toBeInstanceOf(Date);
      });
    });
  });

  describe('Retry Logic', () => {
    it('should execute operation successfully without retry', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');
      
      const result = await errorHandler.executeWithRetry(
        mockOperation,
        'test_operation'
      );

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on network errors', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockResolvedValue('success');

      const result = await errorHandler.executeWithRetry(
        mockOperation,
        'test_operation',
        {
          maxAttempts: 2,
          baseDelay: 10, // Short delay for testing
          maxDelay: 100,
          backoffMultiplier: 2,
          retryableErrors: [ErrorType.NETWORK_ERROR]
        }
      );

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on authentication errors', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Invalid API key'));

      await expect(
        errorHandler.executeWithRetry(
          mockOperation,
          'test_operation',
          {
            maxAttempts: 3,
            baseDelay: 10,
            maxDelay: 100,
            backoffMultiplier: 2,
            retryableErrors: [ErrorType.NETWORK_ERROR]
          }
        )
      ).rejects.toThrow();

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Detection Utilities', () => {
    it('should detect network errors', () => {
      const networkErrors = [
        new Error('Failed to fetch'),
        new Error('Network request failed'),
        new Error('Connection timeout')
      ];

      networkErrors.forEach(error => {
        expect(errorHandler.isNetworkError(error)).toBe(true);
      });

      const nonNetworkError = new Error('Validation failed');
      expect(errorHandler.isNetworkError(nonNetworkError)).toBe(false);
    });

    it('should detect AI service errors', () => {
      const aiErrors = [
        new Error('AI model failed'),
        new Error('Generation quota exceeded'),
        new Error('Content filter blocked')
      ];

      aiErrors.forEach(error => {
        expect(errorHandler.isAIServiceError(error)).toBe(true);
      });

      const nonAiError = new Error('Database error');
      expect(errorHandler.isAIServiceError(nonAiError)).toBe(false);
    });
  });

  describe('User-Friendly Messages', () => {
    it('should create helpful error messages', () => {
      const networkError = {
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'Network request failed',
        userMessage: 'Network connection failed. Please check your internet connection and try again.',
        timestamp: new Date(),
        operation: 'test',
        retryable: true
      };

      const message = errorHandler.createUserFriendlyMessage(networkError);
      
      expect(message).toContain('Network connection failed');
      expect(message).toContain('Suggestions:');
      expect(message).toContain('Check your internet connection');
    });
  });

  describe('Graceful Degradation', () => {
    it('should provide fallback analysis when AI fails', async () => {
      const mockError = {
        type: ErrorType.AI_SERVICE_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'AI service unavailable',
        userMessage: 'AI service is temporarily unavailable',
        timestamp: new Date(),
        operation: 'analysis',
        retryable: true
      };

      const result = await errorHandler.handleAnalysisFailure(
        mockError,
        'This is a test document with sufficient content for basic analysis.',
        'test-conversation-id'
      );

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(result.concerns).toBeDefined();
      expect(Array.isArray(result.concerns)).toBe(true);
    });
  });

  describe('Error Statistics', () => {
    it('should track error statistics', () => {
      // Clear any existing errors by getting a fresh instance
      const stats = errorHandler.getErrorStatistics(60);
      
      expect(stats).toHaveProperty('totalErrors');
      expect(stats).toHaveProperty('errorsByType');
      expect(stats).toHaveProperty('errorsByOperation');
      expect(stats).toHaveProperty('recentErrorRate');
      expect(typeof stats.totalErrors).toBe('number');
      expect(typeof stats.recentErrorRate).toBe('number');
    });
  });
});