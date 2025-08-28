import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ERROR_CONFIG,
  DEFAULT_ERROR_TYPE_CONFIGS,
  ErrorConfig,
  ErrorTypeConfig
} from './error-config';
import { AIErrorType } from '../../ai-types';

describe('error-config', () => {
  describe('DEFAULT_ERROR_CONFIG', () => {
    it('should have correct default error configuration values', () => {
      const expectedErrorConfig: ErrorConfig = {
        maxRetries: 3,
        timeoutMs: 30000,
        enableGracefulDegradation: true,
        enableErrorNotifications: true,
        retryDelayMs: 1000,
        exponentialBackoff: true
      };

      expect(DEFAULT_ERROR_CONFIG).toEqual(expectedErrorConfig);
    });
  });

  describe('DEFAULT_ERROR_TYPE_CONFIGS', () => {
    it('should have correct default error type configurations', () => {
      const expectedErrorTypeConfigs: Record<AIErrorType, ErrorTypeConfig> = {
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

      expect(DEFAULT_ERROR_TYPE_CONFIGS).toEqual(expectedErrorTypeConfigs);
    });
  });
});