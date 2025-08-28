// src/worker/middleware/__tests__/error-middleware.test.ts
// Unit tests for error handling middleware

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorMiddleware, ErrorType } from '../error-middleware';
import type { Context } from '../../types';

describe('ErrorMiddleware', () => {
  const createMockContext = (
    body: any = {},
    url = '/test',
    method = 'POST',
    headers: Record<string, string> = {}
  ): Context => ({
    request: { body, url, method, headers },
    status: vi.fn()
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('createErrorResponse', () => {
    it('should create a properly formatted error response', () => {
      const response = ErrorMiddleware.createErrorResponse(
        ErrorType.VALIDATION_ERROR,
        'Validation failed',
        { field: 'email' },
        'INVALID_EMAIL',
        'req-123'
      );

      expect(response).toEqual({
        error: {
          type: ErrorType.VALIDATION_ERROR,
          message: 'Validation failed',
          details: { field: 'email' },
          code: 'INVALID_EMAIL',
          timestamp: expect.any(String),
          requestId: 'req-123'
        },
        success: false
      });

      // Verify timestamp is a valid ISO string
      expect(new Date(response.error.timestamp).toISOString()).toBe(response.error.timestamp);
    });

    it('should create error response with minimal parameters', () => {
      const response = ErrorMiddleware.createErrorResponse(
        ErrorType.INTERNAL_ERROR,
        'Something went wrong'
      );

      expect(response.error.type).toBe(ErrorType.INTERNAL_ERROR);
      expect(response.error.message).toBe('Something went wrong');
      expect(response.success).toBe(false);
      expect(response.error.timestamp).toBeDefined();
    });
  });

  describe('handleValidationError', () => {
    it('should create validation error response from error array', () => {
      const errors = ["Field 'email' is required", "Field 'name' must be a string"];
      const context = {
        endpoint: '/api/users',
        method: 'POST',
        requestId: 'req-456'
      };

      const response = ErrorMiddleware.handleValidationError(errors, context);

      expect(response.error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(response.error.message).toBe("Validation failed: Field 'email' is required, Field 'name' must be a string");
      expect(response.error.details).toEqual({ validationErrors: errors });
      expect(response.error.code).toBe('VALIDATION_FAILED');
      expect(response.error.requestId).toBe('req-456');
    });
  });

  describe('handleServiceError', () => {
    it('should handle "Not implemented" errors', () => {
      const error = new Error('Not implemented: SearchService.search');
      const context = {
        endpoint: '/api/search',
        method: 'POST',
        requestId: 'req-789'
      };

      const response = ErrorMiddleware.handleServiceError(error, context);

      expect(response.error.type).toBe(ErrorType.SERVICE_UNAVAILABLE);
      expect(response.error.message).toBe('Service functionality not yet implemented');
      expect(response.error.code).toBe('SERVICE_NOT_IMPLEMENTED');
    });

    it('should handle timeout errors', () => {
      const error = new Error('Request timeout after 30 seconds');
      const response = ErrorMiddleware.handleServiceError(error);

      expect(response.error.type).toBe(ErrorType.TIMEOUT);
      expect(response.error.message).toBe('Request timed out');
      expect(response.error.code).toBe('REQUEST_TIMEOUT');
    });

    it('should handle rate limit errors', () => {
      const error = new Error('Rate limit exceeded for user');
      const response = ErrorMiddleware.handleServiceError(error);

      expect(response.error.type).toBe(ErrorType.RATE_LIMITED);
      expect(response.error.message).toBe('Rate limit exceeded');
      expect(response.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should handle unauthorized errors', () => {
      const error = new Error('Unauthorized access to resource');
      const response = ErrorMiddleware.handleServiceError(error);

      expect(response.error.type).toBe(ErrorType.UNAUTHORIZED);
      expect(response.error.message).toBe('Unauthorized access');
      expect(response.error.code).toBe('UNAUTHORIZED_ACCESS');
    });

    it('should handle not found errors', () => {
      const error = new Error('Resource not found in database');
      const response = ErrorMiddleware.handleServiceError(error);

      expect(response.error.type).toBe(ErrorType.NOT_FOUND);
      expect(response.error.message).toBe('Resource not found');
      expect(response.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should handle generic errors as internal errors', () => {
      const error = new Error('Some unexpected error occurred');
      const response = ErrorMiddleware.handleServiceError(error);

      expect(response.error.type).toBe(ErrorType.INTERNAL_ERROR);
      expect(response.error.message).toBe('An internal error occurred');
      expect(response.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(response.error.details).toEqual({
        originalError: 'Some unexpected error occurred',
        stack: undefined // No stack in test environment
      });
    });
  });

  describe('handleNetworkError', () => {
    it('should handle external service errors', () => {
      const error = new Error('Connection refused');
      const serviceName = 'Google Scholar API';
      const context = {
        endpoint: '/api/search',
        method: 'GET',
        requestId: 'req-network'
      };

      const response = ErrorMiddleware.handleNetworkError(error, serviceName, context);

      expect(response.error.type).toBe(ErrorType.SERVICE_UNAVAILABLE);
      expect(response.error.message).toBe('External service Google Scholar API is unavailable');
      expect(response.error.details).toEqual({
        service: 'Google Scholar API',
        originalError: 'Connection refused'
      });
      expect(response.error.code).toBe('EXTERNAL_SERVICE_ERROR');
    });
  });

  describe('getHttpStatusCode', () => {
    it('should return correct HTTP status codes for error types', () => {
      expect(ErrorMiddleware.getHttpStatusCode(ErrorType.VALIDATION_ERROR)).toBe(400);
      expect(ErrorMiddleware.getHttpStatusCode(ErrorType.BAD_REQUEST)).toBe(400);
      expect(ErrorMiddleware.getHttpStatusCode(ErrorType.UNAUTHORIZED)).toBe(401);
      expect(ErrorMiddleware.getHttpStatusCode(ErrorType.NOT_FOUND)).toBe(404);
      expect(ErrorMiddleware.getHttpStatusCode(ErrorType.RATE_LIMITED)).toBe(429);
      expect(ErrorMiddleware.getHttpStatusCode(ErrorType.INTERNAL_ERROR)).toBe(500);
      expect(ErrorMiddleware.getHttpStatusCode(ErrorType.SERVICE_UNAVAILABLE)).toBe(503);
      expect(ErrorMiddleware.getHttpStatusCode(ErrorType.TIMEOUT)).toBe(504);
    });
  });

  describe('extractErrorContext', () => {
    it('should extract context from request', () => {
      const ctx = createMockContext(
        { conversationId: 'conv-123', userId: 'user-456' },
        '/api/search',
        'POST',
        { 'user-agent': 'test-client', 'x-request-id': 'req-existing' }
      );

      const context = ErrorMiddleware.extractErrorContext(ctx);

      expect(context).toEqual({
        endpoint: '/api/search',
        method: 'POST',
        userAgent: 'test-client',
        conversationId: 'conv-123',
        userId: 'user-456',
        requestId: 'req-existing'
      });
    });

    it('should generate request ID if not provided', () => {
      const ctx = createMockContext({}, '/api/test', 'GET', {});
      const context = ErrorMiddleware.extractErrorContext(ctx);

      expect(context.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
    });
  });

  describe('handleError', () => {
    it('should handle error and return formatted response', async () => {
      const error = new Error('Test service error');
      const ctx = createMockContext(
        { conversationId: 'conv-test' },
        '/api/test',
        'POST'
      );

      const response = await ErrorMiddleware.handleError(error, ctx);

      expect(response.success).toBe(false);
      expect(response.error.type).toBe(ErrorType.INTERNAL_ERROR);
      expect(response.error.message).toBe('An internal error occurred');
      
      // Verify status was called with correct code
      expect(ctx.status).toHaveBeenCalledWith(500);
    });

    it('should log error with appropriate severity', async () => {
      const error = new Error('Database connection failed');
      const ctx = createMockContext({});

      await ErrorMiddleware.handleError(error, ctx);

      // Verify console.error was called for critical error
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('asyncErrorHandler', () => {
    it('should wrap async handlers and catch errors', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Async error'));
      const wrappedHandler = ErrorMiddleware.asyncErrorHandler(handler);
      const ctx = createMockContext({});

      const result = await wrappedHandler(ctx);

      expect(handler).toHaveBeenCalledWith(ctx);
      expect(result).toMatchObject({
        success: false,
        error: {
          type: ErrorType.INTERNAL_ERROR,
          message: 'An internal error occurred'
        }
      });
    });

    it('should pass through successful responses', async () => {
      const successResponse = { data: 'success', success: true };
      const handler = vi.fn().mockResolvedValue(successResponse);
      const wrappedHandler = ErrorMiddleware.asyncErrorHandler(handler);
      const ctx = createMockContext({});

      const result = await wrappedHandler(ctx);

      expect(result).toBe(successResponse);
    });
  });

  describe('logError', () => {
    it('should log errors with different severities', () => {
      const error = new Error('Test error');
      const context = {
        endpoint: '/test',
        method: 'POST',
        requestId: 'req-log-test'
      };

      // Test critical error logging
      ErrorMiddleware.logError(error, context, 'critical');
      expect(console.error).toHaveBeenCalled();

      // Test medium error logging
      ErrorMiddleware.logError(error, context, 'medium');
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
