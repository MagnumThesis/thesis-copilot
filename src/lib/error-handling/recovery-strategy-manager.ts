/**
 * Recovery Strategy Manager
 * Manages error recovery strategies for different error types
 */

import { AIError, AIErrorType } from "../ai-error-handler";
import { ErrorRecoveryStrategy } from "../ai-error-handler";
import { AIMode } from "../ai-types";

export class RecoveryStrategyManager {
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
}