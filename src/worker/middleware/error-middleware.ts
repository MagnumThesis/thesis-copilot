// src/worker/middleware/error-middleware.ts
// Error handling middleware for API routes
// Part of modular refactor (see code-modularization-refactor spec)

import type { Context } from '../types';

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  BAD_REQUEST = 'BAD_REQUEST'
}

export interface ErrorResponse {
  error: {
    type: ErrorType;
    message: string;
    details?: any;
    code?: string;
    timestamp: string;
    requestId?: string;
  };
  success: false;
}

export interface ErrorContext {
  endpoint: string;
  method: string;
  userAgent?: string;
  conversationId?: string;
  userId?: string;
  requestId?: string;
}

export class ErrorMiddleware {
  /**
   * Creates a standardized error response
   */
  static createErrorResponse(
    type: ErrorType,
    message: string,
    details?: any,
    code?: string,
    requestId?: string
  ): ErrorResponse {
    return {
      error: {
        type,
        message,
        details,
        code,
        timestamp: new Date().toISOString(),
        requestId
      },
      success: false
    };
  }

  /**
   * Handles validation errors
   */
  static handleValidationError(
    errors: string[],
    context?: ErrorContext
  ): ErrorResponse {
    const message = `Validation failed: ${errors.join(', ')}`;
    
    return this.createErrorResponse(
      ErrorType.VALIDATION_ERROR,
      message,
      { validationErrors: errors },
      'VALIDATION_FAILED',
      context?.requestId
    );
  }

  /**
   * Handles service errors (when services throw errors)
   */
  static handleServiceError(
    error: Error,
    context?: ErrorContext
  ): ErrorResponse {
    // Check if it's a known service error pattern
    if (error.message.includes('Not implemented')) {
      return this.createErrorResponse(
        ErrorType.SERVICE_UNAVAILABLE,
        'Service functionality not yet implemented',
        { originalError: error.message },
        'SERVICE_NOT_IMPLEMENTED',
        context?.requestId
      );
    }

    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return this.createErrorResponse(
        ErrorType.TIMEOUT,
        'Request timed out',
        { originalError: error.message },
        'REQUEST_TIMEOUT',
        context?.requestId
      );
    }

    if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
      return this.createErrorResponse(
        ErrorType.RATE_LIMITED,
        'Rate limit exceeded',
        { originalError: error.message },
        'RATE_LIMIT_EXCEEDED',
        context?.requestId
      );
    }

    if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
      return this.createErrorResponse(
        ErrorType.UNAUTHORIZED,
        'Unauthorized access',
        { originalError: error.message },
        'UNAUTHORIZED_ACCESS',
        context?.requestId
      );
    }

    if (error.message.includes('not found') || error.message.includes('Not found')) {
      return this.createErrorResponse(
        ErrorType.NOT_FOUND,
        'Resource not found',
        { originalError: error.message },
        'RESOURCE_NOT_FOUND',
        context?.requestId
      );
    }

    // Default to internal error
    return this.createErrorResponse(
      ErrorType.INTERNAL_ERROR,
      'An internal error occurred',
      { 
        originalError: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      },
      'INTERNAL_SERVER_ERROR',
      context?.requestId
    );
  }

  /**
   * Handles network/external service errors
   */
  static handleNetworkError(
    error: Error,
    serviceName: string,
    context?: ErrorContext
  ): ErrorResponse {
    return this.createErrorResponse(
      ErrorType.SERVICE_UNAVAILABLE,
      `External service ${serviceName} is unavailable`,
      { 
        service: serviceName,
        originalError: error.message 
      },
      'EXTERNAL_SERVICE_ERROR',
      context?.requestId
    );
  }

  /**
   * Determines HTTP status code from error type
   */
  static getHttpStatusCode(errorType: ErrorType): number {
    switch (errorType) {
      case ErrorType.VALIDATION_ERROR:
      case ErrorType.BAD_REQUEST:
        return 400;
      case ErrorType.UNAUTHORIZED:
        return 401;
      case ErrorType.NOT_FOUND:
        return 404;
      case ErrorType.RATE_LIMITED:
        return 429;
      case ErrorType.INTERNAL_ERROR:
        return 500;
      case ErrorType.SERVICE_UNAVAILABLE:
        return 503;
      case ErrorType.TIMEOUT:
        return 504;
      default:
        return 500;
    }
  }

  /**
   * Extracts error context from request
   */
  static extractErrorContext(ctx: Context): ErrorContext {
    return {
      endpoint: ctx.request?.url || 'unknown',
      method: ctx.request?.method || 'unknown',
      userAgent: ctx.request?.headers?.['user-agent'],
      conversationId: ctx.request?.body?.conversationId,
      userId: ctx.request?.body?.userId,
      requestId: ctx.request?.headers?.['x-request-id'] || this.generateRequestId()
    };
  }

  /**
   * Generates a unique request ID
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Logs error with context (for monitoring)
   */
  static logError(
    error: Error | ErrorResponse,
    context?: ErrorContext,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      severity,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      context,
      environment: process.env.NODE_ENV || 'unknown'
    };

    // In production, this would integrate with your logging service
    if (severity === 'critical' || severity === 'high') {
      console.error('ERROR:', JSON.stringify(logEntry, null, 2));
    } else {
      console.warn('ERROR:', JSON.stringify(logEntry, null, 2));
    }
  }

  /**
   * Generic error handler middleware
   */
  static async handleError(
    error: Error,
    ctx: Context,
    next?: () => Promise<void>
  ): Promise<ErrorResponse> {
    const context = this.extractErrorContext(ctx);
    
    // Log the error
    this.logError(error, context, this.getErrorSeverity(error));

    // Create appropriate error response
    const errorResponse = this.handleServiceError(error, context);

    // Set appropriate HTTP status if ctx has response capabilities
    if ('status' in ctx && typeof ctx.status === 'function') {
      ctx.status(this.getHttpStatusCode(errorResponse.error.type));
    }

    return errorResponse;
  }

  /**
   * Determines error severity based on error type/message
   */
  private static getErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error.message.includes('database') || error.message.includes('Database')) {
      return 'critical';
    }
    
    if (error.message.includes('timeout') || error.message.includes('network')) {
      return 'high';
    }
    
    if (error.message.includes('validation') || error.message.includes('Validation')) {
      return 'low';
    }
    
    if (error.message.includes('Not implemented')) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Middleware for handling async route errors
   */
  static asyncErrorHandler<T>(
    handler: (ctx: Context) => Promise<T>
  ): (ctx: Context) => Promise<T | ErrorResponse> {
    return async (ctx: Context): Promise<T | ErrorResponse> => {
      try {
        return await handler(ctx);
      } catch (error) {
        return this.handleError(error as Error, ctx);
      }
    };
  }
}
