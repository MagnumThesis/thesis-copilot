/**
 * AI Error Handling Utilities
 * Comprehensive error handling for AI operations
 */

import { AIErrorResponse, AIResponse } from './ai-interfaces';
import { AIMode } from './ai-types';

// AI Error types enumeration
export enum AIErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  CONTEXT_ERROR = 'CONTEXT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// AI Error class for structured error handling
export class AIError extends Error {
  public readonly type: AIErrorType;
  public readonly code?: string;
  public readonly retryable: boolean;
  public readonly originalError?: Error;

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
}

// AI Error Handler class
export class AIErrorHandler {
  private static readonly DEFAULT_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

  /**
   * Handle AI operation errors with appropriate recovery strategies
   */
  static handleError(error: unknown, context: string): AIErrorResponse {
    const aiError = this.normalizeError(error);
    const errorResponse: AIErrorResponse = {
      success: false,
      error: aiError.message,
      errorCode: aiError.code,
      retryable: aiError.retryable,
      timestamp: Date.now()
    };

    // Log error based on severity
    this.logError(aiError, context);

    return errorResponse;
  }

  /**
   * Normalize various error types into AIError
   */
  private static normalizeError(error: unknown): AIError {
    if (error instanceof AIError) {
      return error;
    }

    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return new AIError(
          'Network connection failed. Please check your internet connection.',
          AIErrorType.NETWORK_ERROR,
          'NETWORK_FAILED',
          true,
          error
        );
      }

      // Timeout errors
      if (error.message.includes('timeout')) {
        return new AIError(
          'Request timed out. Please try again.',
          AIErrorType.TIMEOUT_ERROR,
          'REQUEST_TIMEOUT',
          true,
          error
        );
      }

      // Rate limit errors
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return new AIError(
          'Too many requests. Please wait a moment before trying again.',
          AIErrorType.RATE_LIMIT_ERROR,
          'RATE_LIMIT_EXCEEDED',
          true,
          error
        );
      }

      // API errors
      if (error.message.includes('API') || error.message.includes('400') || error.message.includes('500')) {
        return new AIError(
          'AI service error. Please try again later.',
          AIErrorType.API_ERROR,
          'API_ERROR',
          true,
          error
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

  /**
   * Log errors with appropriate level
   */
  private static logError(error: AIError, context: string): void {
    const logMessage = `AI Error in ${context}: ${error.message}`;
    
    switch (error.type) {
      case AIErrorType.NETWORK_ERROR:
      case AIErrorType.TIMEOUT_ERROR:
      case AIErrorType.RATE_LIMIT_ERROR:
        console.warn(logMessage, { error, context });
        break;
      case AIErrorType.API_ERROR:
      case AIErrorType.UNKNOWN_ERROR:
        console.error(logMessage, { error, context });
        break;
      case AIErrorType.VALIDATION_ERROR:
      case AIErrorType.CONTEXT_ERROR:
        console.info(logMessage, { error, context });
        break;
      default:
        console.error(logMessage, { error, context });
    }
  }

  /**
   * Get retry strategy for different error types
   */
  static getRetryStrategy(error: AIError): ErrorRecoveryStrategy {
    switch (error.type) {
      case AIErrorType.NETWORK_ERROR:
      case AIErrorType.TIMEOUT_ERROR:
        return {
          retryAttempts: 3,
          userNotification: 'Connection issue detected. Retrying...',
          logLevel: 'warn'
        };

      case AIErrorType.RATE_LIMIT_ERROR:
        return {
          retryAttempts: 2,
          userNotification: 'Service is busy. Please wait a moment...',
          logLevel: 'warn'
        };

      case AIErrorType.API_ERROR:
        return {
          retryAttempts: 1,
          userNotification: 'AI service temporarily unavailable. Retrying...',
          logLevel: 'error'
        };

      case AIErrorType.VALIDATION_ERROR:
      case AIErrorType.CONTEXT_ERROR:
        return {
          retryAttempts: 0,
          fallbackMode: AIMode.NONE,
          userNotification: 'Please check your input and try again.',
          logLevel: 'info'
        };

      default:
        return {
          retryAttempts: 0,
          fallbackMode: AIMode.NONE,
          userNotification: 'An error occurred. Please try again later.',
          logLevel: 'error'
        };
    }
  }

  /**
   * Execute operation with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = this.DEFAULT_RETRY_ATTEMPTS
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
        const delay = this.RETRY_DELAYS[attempt] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
        await new Promise(resolve => setTimeout(resolve, delay));

        console.info(`Retrying AI operation (attempt ${attempt + 1}/${maxRetries}) in ${context}`);
      }
    }

    throw this.normalizeError(lastError);
  }

  /**
   * Validate AI request before processing
   */
  static validateRequest(request: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!request[field]) {
        throw new AIError(
          `Missing required field: ${field}`,
          AIErrorType.VALIDATION_ERROR,
          'MISSING_FIELD',
          false
        );
      }
    }

    // Validate conversation ID format
    if (request.conversationId && typeof request.conversationId !== 'string') {
      throw new AIError(
        'Invalid conversation ID format',
        AIErrorType.VALIDATION_ERROR,
        'INVALID_CONVERSATION_ID',
        false
      );
    }

    // Validate document content
    if (request.documentContent && typeof request.documentContent !== 'string') {
      throw new AIError(
        'Invalid document content format',
        AIErrorType.VALIDATION_ERROR,
        'INVALID_DOCUMENT_CONTENT',
        false
      );
    }
  }

  /**
   * Check if response is successful
   */
  static isSuccessResponse(response: AIResponse): response is import('./ai-interfaces').AISuccessResponse {
    return response.success === true;
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: AIError): string {
    switch (error.type) {
      case AIErrorType.NETWORK_ERROR:
        return 'Unable to connect to AI service. Please check your internet connection and try again.';
      case AIErrorType.TIMEOUT_ERROR:
        return 'The request took too long to complete. Please try again.';
      case AIErrorType.RATE_LIMIT_ERROR:
        return 'Too many requests at once. Please wait a moment before trying again.';
      case AIErrorType.API_ERROR:
        return 'AI service is temporarily unavailable. Please try again in a few minutes.';
      case AIErrorType.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case AIErrorType.CONTEXT_ERROR:
        return 'Unable to process the document context. Please try with different content.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }
}