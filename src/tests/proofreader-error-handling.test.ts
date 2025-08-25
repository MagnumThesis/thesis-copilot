/**
 * Tests for Proofreader Error Handling and Recovery Mechanisms
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { 
  ProofreaderErrorHandler, 
  ErrorType, 
  ErrorSeverity,
  DEFAULT_RETRY_CONFIG,
  AI_SERVICE_RETRY_CONFIG 
} from '../lib/proofreader-error-handling';

// Mock fetch and other browser APIs
global.fetch = vi.fn();
global.navigator = {
  onLine: true,
  connection: undefined
} as any;

global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
} as any;

global.window = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
} as any;

describe('ProofreaderErrorHandler', () => {
  let errorHandler: ProofreaderErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler = ProofreaderErrorHandler.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Classification', () => {
    it('should classify network errors correctly', () => {
      const networkError = new Error('Network request failed');
      const classified = errorHandler.classifyError(networkError, 'test_operation');

      expect(classified.type).toBe(ErrorType.NETWORK_ERROR);
      expect(classified.severity).toBe(ErrorSeverity.HIGH);
      expect(classified.retryable).toBe(true);
      expect(classified.userMessage).toContain('Network connection failed');
    });

    it('should classify timeout errors correctly', () => {
      const timeoutError = new Error('Request timeout');
      const classified = errorHandler.classifyError(timeoutError, 'test_operation');

      expect(classified.type).toBe(ErrorType.TIMEOUT_ERROR);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(true);
    });

    it('should classify authentication errors correctly', () => {
      const authError = new Error('Invalid API key');
      const classified = errorHandler.classifyError(authError, 'test_operation');

      expect(classified.type).toBe(ErrorType.AUTHENTICATION_ERROR);
      expect(classified.severity).toBe(ErrorSeverity.CRITICAL);
      expect(classified.retryable).toBe(false);
    });

    it('should classify rate limit errors correctly', () => {
      const rateLimitError = new Error('Rate limit exceeded');
      const classified = errorHandler.classifyError(rateLimitError, 'test_operation');

      expect(classified.type).toBe(ErrorType.RATE_LIMIT_ERROR);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(true);
    });

    it('should classify AI service errors correctly', () => {
      const aiError = new Error('AI model generation failed');
      const classified = errorHandler.classifyError(aiError, 'test_operation');

      expect(classified.type).toBe(ErrorType.AI_SERVICE_ERROR);
      expect(classified.severity).toBe(ErrorSeverity.HIGH);
      expect(classified.retryable).toBe(true);
    });

    it('should classify content validation errors correctly', () => {
      const contentError = new Error('Content is required');
      const classified = errorHandler.classifyError(contentError, 'test_operation');

      expect(classified.type).toBe(ErrorType.CONTENT_ERROR);
      expect(classified.severity).toBe(ErrorSeverity.LOW);
      expect(classified.retryable).toBe(false);
    });

    it('should classify database errors correctly', () => {
      const dbError = new Error('Supabase database connection failed');
      const classified = errorHandler.classifyError(dbError, 'test_operation');

      expect(classified.type).toBe(ErrorType.DATABASE_ERROR);
      expect(classified.severity).toBe(ErrorSeverity.HIGH);
      expect(classified.retryable).toBe(true);
    });

    it('should handle unknown errors gracefully', () => {
      const unknownError = new Error('Something unexpected happened');
      const classified = errorHandler.classifyError(unknownError, 'test_operation');

      expect(classified.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.retryable).toBe(false);
    });

    it('should handle string errors', () => {
      const stringError = 'Simple error message';
      const classified = errorHandler.classifyError(stringError, 'test_operation');

      expect(classified.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(classified.message).toBe(stringError);
      expect(classified.userMessage).toBe(stringError);
    });

    it('should handle non-error objects', () => {
      const nonError = { someProperty: 'value' };
      const classified = errorHandler.classifyError(nonError, 'test_operation');

      expect(classified.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(classified.message).toBe('An unexpected error occurred');
    });
  });

  describe('Retry Logic', () => {
    it('should execute operation successfully on first attempt', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');
      
      const result = await errorHandler.executeWithRetry(
        mockOperation,
        'test_operation',
        DEFAULT_RETRY_CONFIG
      );

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockResolvedValue('success');

      const result = await errorHandler.executeWithRetry(
        mockOperation,
        'test_operation',
        DEFAULT_RETRY_CONFIG
      );

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Invalid API key'));

      await expect(
        errorHandler.executeWithRetry(
          mockOperation,
          'test_operation',
          DEFAULT_RETRY_CONFIG
        )
      ).rejects.toThrow();

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should respect max retry attempts', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Network request failed'));

      await expect(
        errorHandler.executeWithRetry(
          mockOperation,
          'test_operation',
          { ...DEFAULT_RETRY_CONFIG, maxAttempts: 2 }
        )
      ).rejects.toThrow();

      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await errorHandler.executeWithRetry(
        mockOperation,
        'test_operation',
        { ...DEFAULT_RETRY_CONFIG, baseDelay: 100 }
      );
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Graceful Degradation', () => {
    it('should perform basic analysis when AI analysis fails', async () => {
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
        'This is a test document with some content for analysis.',
        'test-conversation-id'
      );

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true);
      expect(result.concerns).toBeDefined();
      expect(Array.isArray(result.concerns)).toBe(true);
    });

    it('should return error when both AI and fallback fail', async () => {
      const mockError = {
        type: ErrorType.AI_SERVICE_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'AI service unavailable',
        userMessage: 'AI service is temporarily unavailable',
        timestamp: new Date(),
        operation: 'analysis',
        retryable: true
      };

      // Mock the basic analysis to fail as well
      const originalPerformBasicAnalysis = (errorHandler as any).performBasicAnalysis;
      (errorHandler as any).performBasicAnalysis = vi.fn().mockRejectedValue(new Error('Basic analysis failed'));

      const result = await errorHandler.handleAnalysisFailure(
        mockError,
        'test content',
        'test-conversation-id'
      );

      expect(result.success).toBe(false);
      expect(result.fallbackUsed).toBe(true);
      expect(result.error).toContain('Both AI and fallback analysis failed');

      // Restore original method
      (errorHandler as any).performBasicAnalysis = originalPerformBasicAnalysis;
    });
  });

  describe('Offline Status Management', () => {
    it('should track offline status correctly', () => {
      const offlineStatus = errorHandler.getOfflineStatus();
      
      expect(offlineStatus).toHaveProperty('isOnline');
      expect(offlineStatus).toHaveProperty('queuedOperations');
      expect(offlineStatus).toHaveProperty('syncInProgress');
      expect(Array.isArray(offlineStatus.queuedOperations)).toBe(true);
    });

    it('should queue operations when offline', () => {
      errorHandler.queueOperation({
        type: 'status_update',
        data: { concernId: 'test-id', status: 'addressed' }
      });

      const offlineStatus = errorHandler.getOfflineStatus();
      expect(offlineStatus.queuedOperations.length).toBe(1);
      expect(offlineStatus.queuedOperations[0].type).toBe('status_update');
    });
  });

  describe('Error History Management', () => {
    it('should maintain error history', () => {
      // Get fresh instance to avoid interference from other tests
      const freshHandler = ProofreaderErrorHandler.getInstance();
      const initialHistoryLength = freshHandler.getErrorHistory().length;
      
      const error1 = new Error('First error');
      const error2 = new Error('Second error');

      freshHandler.classifyError(error1, 'operation1');
      freshHandler.classifyError(error2, 'operation2');

      const history = freshHandler.getErrorHistory();
      expect(history.length).toBe(initialHistoryLength + 2);
      expect(history[0].message).toBe('Second error'); // Most recent first
      expect(history[1].message).toBe('First error');
    });

    it('should limit error history size', () => {
      // Add more errors than the max history size
      for (let i = 0; i < 60; i++) {
        errorHandler.classifyError(new Error(`Error ${i}`), 'operation');
      }

      const history = errorHandler.getErrorHistory();
      expect(history.length).toBeLessThanOrEqual(50); // Max history size
    });

    it('should filter recent errors correctly', () => {
      // Create a fresh handler instance for this test
      const testHandler = ProofreaderErrorHandler.getInstance();
      
      // Clear existing history for clean test
      const existingHistory = testHandler.getErrorHistory();
      
      const recentError = new Error('Recent error test');
      const recentClassified = testHandler.classifyError(recentError, 'recent_operation_test');
      
      // Get recent errors - should include our new error
      const recentErrors = testHandler.getRecentErrors(10); // Last 10 minutes
      const ourRecentError = recentErrors.find(e => e.message === 'Recent error test');
      
      expect(ourRecentError).toBeDefined();
      expect(ourRecentError?.message).toBe('Recent error test');
    });
  });

  describe('Error Detection Utilities', () => {
    it('should detect network errors correctly', () => {
      const networkError = new Error('Failed to fetch');
      expect(errorHandler.isNetworkError(networkError)).toBe(true);

      const nonNetworkError = new Error('Validation failed');
      expect(errorHandler.isNetworkError(nonNetworkError)).toBe(false);
    });

    it('should detect AI service errors correctly', () => {
      const aiError = new Error('AI model failed');
      expect(errorHandler.isAIServiceError(aiError)).toBe(true);

      const nonAiError = new Error('Database error');
      expect(errorHandler.isAIServiceError(nonAiError)).toBe(false);
    });

    it('should determine if error is retryable', () => {
      const retryableError = {
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'Network failed',
        userMessage: 'Network failed',
        timestamp: new Date(),
        operation: 'test',
        retryable: true
      };

      const nonRetryableError = {
        type: ErrorType.AUTHENTICATION_ERROR,
        severity: ErrorSeverity.CRITICAL,
        message: 'Auth failed',
        userMessage: 'Auth failed',
        timestamp: new Date(),
        operation: 'test',
        retryable: false
      };

      expect(errorHandler.isRetryableError(retryableError, 0)).toBe(true);
      expect(errorHandler.isRetryableError(nonRetryableError, 0)).toBe(false);
      expect(errorHandler.isRetryableError(retryableError, 5)).toBe(false); // Too many retries
    });

    it('should calculate appropriate retry delays', () => {
      const networkError = {
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'Network failed',
        userMessage: 'Network failed',
        timestamp: new Date(),
        operation: 'test',
        retryable: true
      };

      const rateLimitError = {
        type: ErrorType.RATE_LIMIT_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: 'Rate limit exceeded',
        userMessage: 'Rate limit exceeded',
        timestamp: new Date(),
        operation: 'test',
        retryable: true
      };

      const networkDelay = errorHandler.getRetryDelay(networkError, 0);
      const rateLimitDelay = errorHandler.getRetryDelay(rateLimitError, 0);

      expect(networkDelay).toBeGreaterThan(0);
      expect(rateLimitDelay).toBeGreaterThan(networkDelay); // Rate limit should have longer delay
    });
  });

  describe('User-Friendly Messages', () => {
    it('should create user-friendly messages with suggestions', () => {
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

    it('should handle errors without suggestions', () => {
      const unknownError = {
        type: ErrorType.UNKNOWN_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: 'Unknown error',
        userMessage: 'An unexpected error occurred',
        timestamp: new Date(),
        operation: 'test',
        retryable: false
      };

      const message = errorHandler.createUserFriendlyMessage(unknownError);
      
      expect(message).toBe('An unexpected error occurred');
      expect(message).not.toContain('Suggestions:');
    });
  });

  describe('Error Statistics', () => {
    it('should generate error statistics correctly', () => {
      // Add some test errors
      errorHandler.classifyError(new Error('Network error'), 'operation1');
      errorHandler.classifyError(new Error('AI service error'), 'operation2');
      errorHandler.classifyError(new Error('Network error'), 'operation1');

      const stats = errorHandler.getErrorStatistics(60);
      
      expect(stats.totalErrors).toBeGreaterThan(0);
      expect(stats.errorsByType).toHaveProperty(ErrorType.NETWORK_ERROR);
      expect(stats.errorsByType).toHaveProperty(ErrorType.AI_SERVICE_ERROR);
      expect(stats.errorsByOperation).toHaveProperty('operation1');
      expect(stats.errorsByOperation).toHaveProperty('operation2');
      expect(stats.recentErrorRate).toBeGreaterThanOrEqual(0);
    });
  });
});