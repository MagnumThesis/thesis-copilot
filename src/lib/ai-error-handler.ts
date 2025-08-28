/**
 * AI Error Handling Utilities
 * Comprehensive error handling for AI operations with network retry logic and graceful degradation
 */

import { AIErrorResponse, AIResponse } from './ai-interfaces';
import { AIMode } from './ai-types';
import { NetworkErrorHandler } from './error-handling/network-error-handler';
import { ValidationErrorHandler } from './error-handling/validation-error-handler';
import { RecoveryStrategyManager } from './error-handling/recovery-strategy-manager';

// AI Error types enumeration
export enum AIErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  CONTEXT_ERROR = 'CONTEXT_ERROR',
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  CONTENT_FILTER_ERROR = 'CONTENT_FILTER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// AI Error class for structured error handling
/**
 * @class AIError
 * @extends Error
 * @description Custom error class for structured error handling in AI operations.
 */
export class AIError extends Error {
  public readonly type: AIErrorType;
  public readonly code?: string;
  public readonly retryable: boolean;
  public readonly originalError?: Error;

  /**
   * @constructor
   * @param {string} message - The error message.
   * @param {AIErrorType} type - The type of the AI error.
   * @param {string} [code] - An optional error code.
   * @param {boolean} [retryable=false] - Whether the error is retryable.
   * @param {Error} [originalError] - The original error, if any.
   */
  constructor(
    message: string,
    type: AIErrorType,
    code?: string,
    retryable: boolean = false,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AIError';
    this.type = type;
    this.code = code;
    this.retryable = retryable;
    this.originalError = originalError;
  }
}

// Error recovery strategy interface
export interface ErrorRecoveryStrategy {
  retryAttempts: number;
  fallbackMode?: AIMode;
  userNotification: string;
  logLevel: 'info' | 'warn' | 'error';
  gracefulDegradation?: boolean;
  showRetryButton?: boolean;
  autoRetry?: boolean;
}

// Error context interface for better error tracking
export interface ErrorContext {
  operation: string;
  mode: AIMode;
  timestamp: number;
  userAgent?: string;
  retryCount?: number;
}

// AI Error Handler class
/**
 * @class AIErrorHandler
 * @description Handles AI operation errors with appropriate recovery strategies.
 */
export class AIErrorHandler {
  /**
   * Handle AI operation errors with appropriate recovery strategies
   */
  /**
   * @static
   * @method handleError
   * @description Handle AI operation errors with appropriate recovery strategies.
   * @param {unknown} error - The error to handle.
   * @param {string} context - The context in which the error occurred.
   * @param {ErrorContext} [errorContext] - Optional error context for better tracking.
   * @returns {AIErrorResponse} The error response.
   */
  static handleError(error: unknown, context: string, errorContext?: ErrorContext): AIErrorResponse {
    const aiError = this.normalizeError(error);
    const errorResponse: AIErrorResponse = {
      success: false,
      error: aiError.message,
      errorCode: aiError.code,
      retryable: aiError.retryable,
      timestamp: Date.now()
    };

    // Log error based on severity with context
    this.logError(aiError, context, errorContext);

    return errorResponse;
  }

  /**
   * Handle network-specific errors with intelligent retry
   */
    /**
   * @static
   * @method handleNetworkError
   * @description Handle network-specific errors with intelligent retry.
   * @param {() => Promise<any>} operation - The operation to retry.
   * @param {ErrorContext} context - The error context.
   * @param {number} [maxRetries=3] - The maximum number of retries.
   * @returns {Promise<any>} The result of the operation.
   */
  static async handleNetworkError(
    operation: () => Promise<any>,
    context: ErrorContext,
    maxRetries: number = 3
  ): Promise<any> {
    return NetworkErrorHandler.handleNetworkError(operation, context, maxRetries);
  }

  /**
   * Normalize various error types into AIError
   */
  /**
   * @static
   * @method normalizeError
   * @description Normalize various error types into AIError.
   * @param {unknown} error - The error to normalize.
   * @returns {AIError} The normalized AIError.
   */
  static normalizeError(error: unknown): AIError {
    // First try to normalize as network error
    try {
      return NetworkErrorHandler.normalizeNetworkError(error);
    } catch {
      // If that fails, try to normalize as validation error
      try {
        return ValidationErrorHandler.normalizeValidationError(error);
      } catch {
        // If that also fails, use the original normalization logic
        if (error instanceof AIError) {
          return error;
        }

        if (error instanceof Error) {
          const message = error.message.toLowerCase();

          // Network errors
          if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
            return new AIError(
              'Network connection failed. Please check your internet connection.',
              AIErrorType.NETWORK_ERROR,
              'NETWORK_FAILED',
              true,
              error
            );
          }

          // Timeout errors
          if (message.includes('timeout') || message.includes('aborted')) {
            return new AIError(
              'Request timed out. Please try again.',
              AIErrorType.TIMEOUT_ERROR,
              'REQUEST_TIMEOUT',
              true,
              error
            );
          }

          // Rate limit errors
          if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
            return new AIError(
              'Too many requests. Please wait a moment before trying again.',
              AIErrorType.RATE_LIMIT_ERROR,
              'RATE_LIMIT_EXCEEDED',
              true,
              error
            );
          }

          // Authentication errors
          if (message.includes('401') || message.includes('unauthorized') || message.includes('authentication')) {
            return new AIError(
              'Authentication failed. AI service is temporarily unavailable.',
              AIErrorType.AUTHENTICATION_ERROR,
              'AUTH_FAILED',
              false,
              error
            );
          }

          // Service unavailable errors
          if (message.includes('503') || message.includes('service unavailable') || message.includes('502') || message.includes('504')) {
            return new AIError(
              'AI service is temporarily unavailable. Please try again later.',
              AIErrorType.SERVICE_UNAVAILABLE,
              'SERVICE_DOWN',
              true,
              error
            );
          }

          // Quota exceeded errors
          if (message.includes('quota') || message.includes('limit exceeded') || message.includes('billing')) {
            return new AIError(
              'AI service quota exceeded. Please try again later.',
              AIErrorType.QUOTA_EXCEEDED,
              'QUOTA_EXCEEDED',
              false,
              error
            );
          }

          // Content filter errors
          if (message.includes('content filter') || message.includes('inappropriate') || message.includes('blocked')) {
            return new AIError(
              'Content was blocked by safety filters. Please modify your request.',
              AIErrorType.CONTENT_FILTER_ERROR,
              'CONTENT_BLOCKED',
              false,
              error
            );
          }

          // General API errors
          if (message.includes('api') || message.includes('400') || message.includes('500')) {
            return new AIError(
              'AI service error. Please try again later.',
              AIErrorType.API_ERROR,
              'API_ERROR',
              true,
              error
            );
          }
        }

        // Handle fetch response errors
        if (typeof error === 'object' && error !== null && 'status' in error) {
          const status = (error as any).status;
          switch (status) {
            case 400:
              return new AIError(
                'Invalid request. Please check your input.',
                AIErrorType.VALIDATION_ERROR,
                'BAD_REQUEST',
                false,
                error instanceof Error ? error : new Error(`HTTP ${status}`)
              );
            case 401:
              return new AIError(
                'Authentication failed. AI service is temporarily unavailable.',
                AIErrorType.AUTHENTICATION_ERROR,
                'UNAUTHORIZED',
                false,
                error instanceof Error ? error : new Error(`HTTP ${status}`)
              );
            case 429:
              return new AIError(
                'Too many requests. Please wait before trying again.',
                AIErrorType.RATE_LIMIT_ERROR,
                'RATE_LIMITED',
                true,
                error instanceof Error ? error : new Error(`HTTP ${status}`)
              );
            case 503:
              return new AIError(
                'AI service is temporarily unavailable.',
                AIErrorType.SERVICE_UNAVAILABLE,
                'SERVICE_UNAVAILABLE',
                true,
                error instanceof Error ? error : new Error(`HTTP ${status}`)
              );
            default:
              return new AIError(
                'AI service error occurred.',
                AIErrorType.API_ERROR,
                `HTTP_${status}`,
                status >= 500,
                error instanceof Error ? error : new Error(`HTTP ${status}`)
              );
          }
        }

        // Unknown errors
        return new AIError(
          'An unexpected error occurred. Please try again.',
          AIErrorType.UNKNOWN_ERROR,
          'UNKNOWN',
          false,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  /**
   * Log errors with appropriate level and context
   */
  /**
   * @private
   * @static
   * @method logError
   * @description Log errors with appropriate level and context.
   * @param {AIError} error - The error to log.
   * @param {string} context - The context in which the error occurred.
   * @param {ErrorContext} [errorContext] - Optional error context.
   */
  private static logError(error: AIError, context: string, errorContext?: ErrorContext): void {
    const logMessage = `AI Error in ${context}: ${error.message}`;
    const logData = { 
      error: {
        type: error.type,
        code: error.code,
        retryable: error.retryable,
        message: error.message
      }, 
      context,
      errorContext,
      timestamp: new Date().toISOString()
    };
    
    switch (error.type) {
      case AIErrorType.NETWORK_ERROR:
      case AIErrorType.TIMEOUT_ERROR:
      case AIErrorType.RATE_LIMIT_ERROR:
      case AIErrorType.SERVICE_UNAVAILABLE:
        console.warn(logMessage, logData);
        break;
      case AIErrorType.API_ERROR:
      case AIErrorType.UNKNOWN_ERROR:
      case AIErrorType.AUTHENTICATION_ERROR:
      case AIErrorType.QUOTA_EXCEEDED:
        console.error(logMessage, logData);
        break;
      case AIErrorType.VALIDATION_ERROR:
      case AIErrorType.CONTEXT_ERROR:
      case AIErrorType.CONTENT_FILTER_ERROR:
        console.info(logMessage, logData);
        break;
      case AIErrorType.OPERATION_CANCELLED:
        console.debug(logMessage, logData);
        break;
      default:
        console.error(logMessage, logData);
    }
  }

  /**
   * Get retry strategy for different error types
   */
  /**
   * @static
   * @method getRetryStrategy
   * @description Get retry strategy for different error types.
   * @param {AIError} error - The AIError.
   * @returns {ErrorRecoveryStrategy} The retry strategy.
   */
  static getRetryStrategy(error: AIError): ErrorRecoveryStrategy {
    return RecoveryStrategyManager.getRetryStrategy(error);
  }

  /**
   * Execute operation with retry logic
   */
    /**
   * @static
   * @method withRetry
   * @description Execute operation with retry logic.
   * @template T
   * @param {() => Promise<T>} operation - The operation to execute.
   * @param {string} context - The context of the operation.
   * @param {number} [maxRetries=3] - The maximum number of retries.
   * @returns {Promise<T>} The result of the operation.
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const aiError = this.normalizeError(error);

        // Don't retry if error is not retryable
        if (!aiError.retryable || attempt === maxRetries) {
          throw aiError;
        }

        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));

        console.info(`Retrying AI operation (attempt ${attempt + 1}/${maxRetries}) in ${context}`);
      }
    }

    throw this.normalizeError(lastError);
  }

  /**
   * Validate AI request before processing
   */
  /**
   * @static
   * @method validateRequest
   * @description Validate AI request before processing.
   * @param {any} request - The request to validate.
   * @param {string[]} requiredFields - The required fields.
   */
  static validateRequest(request: any, requiredFields: string[]): void {
    ValidationErrorHandler.validateRequest(request, requiredFields);
  }

  /**
   * Validate request parameters
   */
  /**
   * @static
   * @method validateParameters
   * @description Validate request parameters.
   * @param {Record<string, any>} params - The parameters to validate.
   */
  static validateParameters(params: Record<string, any>): void {
    ValidationErrorHandler.validateParameters(params);
  }

  /**
   * Check if response is successful
   */
  /**
   * @static
   * @method isSuccessResponse
   * @description Check if response is successful.
   * @param {AIResponse} response - The AI response.
   * @returns {boolean} Whether the response is successful.
   */
  static isSuccessResponse(response: AIResponse): response is import('./ai-interfaces').AISuccessResponse {
    return response.success === true;
  }

  /**
   * Get user-friendly error message with actionable guidance
   */
  /**
   * @static
   * @method getUserFriendlyMessage
   * @description Get user-friendly error message with actionable guidance.
   * @param {AIError} error - The AIError.
   * @returns {string} The user-friendly message.
   */
  static getUserFriendlyMessage(error: AIError): string {
    // First try to get user-friendly message from validation error handler
    if (error.type === AIErrorType.VALIDATION_ERROR) {
      return ValidationErrorHandler.getUserFriendlyMessage(error);
    }
    
    // Otherwise use recovery strategy manager
    return RecoveryStrategyManager.getUserFriendlyMessage(error);
  }

  /**
   * Create error context for better error tracking
   */
  /**
   * @static
   * @method createErrorContext
   * @description Create error context for better error tracking.
   * @param {string} operation - The operation being performed.
   * @param {AIMode} mode - The AI mode.
   * @param {number} [retryCount=0] - The retry count.
   * @returns {ErrorContext} The error context.
   */
  static createErrorContext(operation: string, mode: AIMode, retryCount: number = 0): ErrorContext {
    return {
      operation,
      mode,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      retryCount
    };
  }

  /**
   * Check if error should trigger graceful degradation
   */
  /**
   * @static
   * @method shouldGracefullyDegrade
   * @description Check if error should trigger graceful degradation.
   * @param {AIError} error - The AIError.
   * @returns {boolean} Whether to gracefully degrade.
   */
  static shouldGracefullyDegrade(error: AIError): boolean {
    return RecoveryStrategyManager.shouldGracefullyDegrade(error);
  }

  /**
   * Get fallback mode for graceful degradation
   */
  /**
   * @static
   * @method getFallbackMode
   * @description Get fallback mode for graceful degradation.
   * @param {AIError} error - The AIError.
   * @param {AIMode} currentMode - The current AI mode.
   * @returns {AIMode} The fallback AI mode.
   */
  static getFallbackMode(error: AIError, currentMode: AIMode): AIMode {
    return RecoveryStrategyManager.getFallbackMode(error, currentMode);
  }
}