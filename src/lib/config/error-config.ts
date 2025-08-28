/**
 * Error Configuration
 * Configuration interfaces and default values for error handling
 */

import { AIErrorType } from "../ai-types";

/**
 * Error handling configuration
 */
export interface ErrorConfig {
  maxRetries: number;
  timeoutMs: number;
  enableGracefulDegradation: boolean;
  enableErrorNotifications: boolean;
  retryDelayMs: number;
  exponentialBackoff: boolean;
}

/**
 * Default error handling configuration
 */
export const DEFAULT_ERROR_CONFIG: ErrorConfig = {
  maxRetries: 3,
  timeoutMs: 30000,
  enableGracefulDegradation: true,
  enableErrorNotifications: true,
  retryDelayMs: 1000,
  exponentialBackoff: true
};

/**
 * Error type specific configuration
 */
export interface ErrorTypeConfig {
  retryAttempts: number;
  retryDelayMs: number;
  shouldRetry: boolean;
  shouldNotify: boolean;
  shouldDegrade: boolean;
}

/**
 * Default error type configurations
 */
export const DEFAULT_ERROR_TYPE_CONFIGS: Record<AIErrorType, ErrorTypeConfig> = {
  [AIErrorType.NETWORK_ERROR]: {
    retryAttempts: 3,
    retryDelayMs: 1000,
    shouldRetry: true,
    shouldNotify: true,
    shouldDegrade: true
  },
  [AIErrorType.API_ERROR]: {
    retryAttempts: 2,
    retryDelayMs: 2000,
    shouldRetry: true,
    shouldNotify: true,
    shouldDegrade: true
  },
  [AIErrorType.VALIDATION_ERROR]: {
    retryAttempts: 0,
    retryDelayMs: 0,
    shouldRetry: false,
    shouldNotify: true,
    shouldDegrade: false
  },
  [AIErrorType.TIMEOUT_ERROR]: {
    retryAttempts: 2,
    retryDelayMs: 3000,
    shouldRetry: true,
    shouldNotify: true,
    shouldDegrade: true
  },
  [AIErrorType.QUOTA_ERROR]: {
    retryAttempts: 1,
    retryDelayMs: 5000,
    shouldRetry: true,
    shouldNotify: true,
    shouldDegrade: true
  }
};