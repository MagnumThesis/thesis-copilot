/**
 * AI Error Handling Utilities
 * Comprehensive error handling for AI operations with network retry logic and graceful degradation
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
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  CONTENT_FILTER_ERROR = 'CONTENT_FILTER_ERROR',
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
  gracefulDegradation?: boolean;
  showRetryButton?: boolean;
  autoRetry?: boolean;
}

// Network status interface for connection monitoring
export interface NetworkStatus {
  isOnline: boolean;
  connectionType?: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

// Error context interface for better error tracking
export interface ErrorContext {
  operation: string;
  mode: AIMode;
  timestamp: number;
  userAgent?: string;
  networkStatus?: NetworkStatus;
  retryCount?: number;
}

// AI Error Handler class
export class AIErrorHandler {
  private static readonly DEFAULT_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff
  private static readonly MAX_RETRY_DELAY = 10000; // Maximum delay between retries
  private static readonly NETWORK_CHECK_TIMEOUT = 5000; // Network connectivity check timeout

  /**
   * Handle AI operation errors with appropriate recovery strategies
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
   * Check network connectivity
   */
  static async checkNetworkConnectivity(): Promise<NetworkStatus> {
    const status: NetworkStatus = {
      isOnline: navigator.onLine
    };

    // Get connection information if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      status.connectionType = connection?.type;
      status.effectiveType = connection?.effectiveType;
      status.downlink = connection?.downlink;
      status.rtt = connection?.rtt;
    }

    // Perform actual connectivity test
    if (status.isOnline) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.NETWORK_CHECK_TIMEOUT);
        
        const response = await fetch('/api/health', {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        status.isOnline = response.ok;
      } catch (error) {
        status.isOnline = false;
      }
    }

    return status;
  }

  /**
   * Handle network-specific errors with intelligent retry
   */
  static async handleNetworkError(
    operation: () => Promise<any>,
    context: ErrorContext,
    maxRetries: number = this.DEFAULT_RETRY_ATTEMPTS
  ): Promise<any> {
    let lastError: unknown;
    let networkStatus = await this.checkNetworkConnectivity();

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check network status before retry
        if (attempt > 0) {
          networkStatus = await this.checkNetworkConnectivity();
          if (!networkStatus.isOnline) {
            throw new AIError(
              'No internet connection available',
              AIErrorType.NETWORK_ERROR,
              'NO_CONNECTION',
              true
            );
          }
        }

        return await operation();
      } catch (error) {
        lastError = error;
        const aiError = this.normalizeError(error);

        // Don't retry if error is not retryable or max attempts reached
        if (!aiError.retryable || attempt === maxRetries) {
          throw aiError;
        }

        // Calculate delay with jitter for network errors
        const baseDelay = this.RETRY_DELAYS[attempt] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
        const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
        const delay = Math.min(baseDelay + jitter, this.MAX_RETRY_DELAY);

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));

        console.info(`Retrying network operation (attempt ${attempt + 1}/${maxRetries}) in ${context.operation}`, {
          delay,
          networkStatus,
          error: aiError.message
        });
      }
    }

    throw this.normalizeError(lastError);
  }

  /**
   * Normalize various error types into AIError
   */
  static normalizeError(error: unknown): AIError {
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

  /**
   * Log errors with appropriate level and context
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
  static getRetryStrategy(error: AIError): ErrorRecoveryStrategy {
    switch (error.type) {
      case AIErrorType.NETWORK_ERROR:
        return {
          retryAttempts: 3,
          userNotification: 'Connection issue detected. Retrying...',
          logLevel: 'warn',
          gracefulDegradation: true,
          showRetryButton: true,
          autoRetry: true
        };

      case AIErrorType.TIMEOUT_ERROR:
        return {
          retryAttempts: 2,
          userNotification: 'Request timed out. Retrying with shorter timeout...',
          logLevel: 'warn',
          gracefulDegradation: true,
          showRetryButton: true,
          autoRetry: true
        };

      case AIErrorType.RATE_LIMIT_ERROR:
        return {
          retryAttempts: 2,
          userNotification: 'Service is busy. Please wait a moment...',
          logLevel: 'warn',
          gracefulDegradation: false,
          showRetryButton: true,
          autoRetry: false
        };

      case AIErrorType.SERVICE_UNAVAILABLE:
        return {
          retryAttempts: 1,
          userNotification: 'AI service temporarily unavailable. Retrying...',
          logLevel: 'error',
          gracefulDegradation: true,
          showRetryButton: true,
          autoRetry: true
        };

      case AIErrorType.API_ERROR:
        return {
          retryAttempts: 1,
          userNotification: 'AI service error. Retrying...',
          logLevel: 'error',
          gracefulDegradation: true,
          showRetryButton: true,
          autoRetry: false
        };

      case AIErrorType.AUTHENTICATION_ERROR:
      case AIErrorType.QUOTA_EXCEEDED:
        return {
          retryAttempts: 0,
          fallbackMode: AIMode.NONE,
          userNotification: 'AI service is temporarily unavailable. Please try again later.',
          logLevel: 'error',
          gracefulDegradation: true,
          showRetryButton: false,
          autoRetry: false
        };

      case AIErrorType.VALIDATION_ERROR:
      case AIErrorType.CONTEXT_ERROR:
        return {
          retryAttempts: 0,
          fallbackMode: AIMode.NONE,
          userNotification: 'Please check your input and try again.',
          logLevel: 'info',
          gracefulDegradation: false,
          showRetryButton: false,
          autoRetry: false
        };

      case AIErrorType.CONTENT_FILTER_ERROR:
        return {
          retryAttempts: 0,
          fallbackMode: AIMode.NONE,
          userNotification: 'Content was blocked by safety filters. Please modify your request.',
          logLevel: 'info',
          gracefulDegradation: false,
          showRetryButton: false,
          autoRetry: false
        };

      case AIErrorType.OPERATION_CANCELLED:
        return {
          retryAttempts: 0,
          fallbackMode: AIMode.NONE,
          userNotification: 'Operation was cancelled.',
          logLevel: 'info',
          gracefulDegradation: false,
          showRetryButton: false,
          autoRetry: false
        };

      default:
        return {
          retryAttempts: 0,
          fallbackMode: AIMode.NONE,
          userNotification: 'An error occurred. Please try again later.',
          logLevel: 'error',
          gracefulDegradation: true,
          showRetryButton: true,
          autoRetry: false
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
   * Get user-friendly error message with actionable guidance
   */
  static getUserFriendlyMessage(error: AIError): string {
    switch (error.type) {
      case AIErrorType.NETWORK_ERROR:
        return 'Unable to connect to AI service. Please check your internet connection and try again.';
      case AIErrorType.TIMEOUT_ERROR:
        return 'The request took too long to complete. Please try again with a shorter prompt.';
      case AIErrorType.RATE_LIMIT_ERROR:
        return 'Too many requests at once. Please wait a moment before trying again.';
      case AIErrorType.SERVICE_UNAVAILABLE:
        return 'AI service is temporarily unavailable. Please try again in a few minutes.';
      case AIErrorType.API_ERROR:
        return 'AI service encountered an error. Please try again or contact support if the issue persists.';
      case AIErrorType.AUTHENTICATION_ERROR:
        return 'AI service authentication failed. Please try again later or contact support.';
      case AIErrorType.QUOTA_EXCEEDED:
        return 'AI service usage limit reached. Please try again later or upgrade your plan.';
      case AIErrorType.VALIDATION_ERROR:
        return 'Please check your input and try again. Make sure all required fields are filled.';
      case AIErrorType.CONTEXT_ERROR:
        return 'Unable to process the document context. Please try with different content or a shorter document.';
      case AIErrorType.CONTENT_FILTER_ERROR:
        return 'Your content was blocked by safety filters. Please modify your request and try again.';
      case AIErrorType.OPERATION_CANCELLED:
        return 'Operation was cancelled. You can try again if needed.';
      default:
        return 'An unexpected error occurred. Please try again later or contact support if the issue persists.';
    }
  }

  /**
   * Create error context for better error tracking
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
  static shouldGracefullyDegrade(error: AIError): boolean {
    const strategy = this.getRetryStrategy(error);
    return strategy.gracefulDegradation === true;
  }

  /**
   * Get fallback mode for graceful degradation
   */
  static getFallbackMode(error: AIError, currentMode: AIMode): AIMode {
    const strategy = this.getRetryStrategy(error);
    
    // If strategy specifies a fallback mode, use it
    if (strategy.fallbackMode) {
      return strategy.fallbackMode;
    }

    // Default fallback logic based on current mode
    switch (currentMode) {
      case AIMode.MODIFY:
        // For modify mode, fall back to manual editing
        return AIMode.NONE;
      case AIMode.CONTINUE:
        // For continue mode, fall back to prompt mode if possible
        return error.type === AIErrorType.CONTEXT_ERROR ? AIMode.PROMPT : AIMode.NONE;
      case AIMode.PROMPT:
        // For prompt mode, fall back to manual editing
        return AIMode.NONE;
      default:
        return AIMode.NONE;
    }
  }
}