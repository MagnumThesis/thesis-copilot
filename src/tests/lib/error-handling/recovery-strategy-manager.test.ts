import { describe, it, expect } from 'vitest';
import { RecoveryStrategyManager } from './recovery-strategy-manager';
import { AIError, AIErrorType } from '../../ai-error-handler';
import { AIMode } from '../../ai-types';

describe('RecoveryStrategyManager', () => {
  describe('getRetryStrategy', () => {
    it('should return appropriate strategy for network errors', () => {
      const error = new AIError('Network error', AIErrorType.NETWORK_ERROR);
      const strategy = RecoveryStrategyManager.getRetryStrategy(error);
      
      expect(strategy.retryAttempts).toBe(3);
      expect(strategy.gracefulDegradation).toBe(true);
      expect(strategy.autoRetry).toBe(true);
    });

    it('should return appropriate strategy for timeout errors', () => {
      const error = new AIError('Timeout error', AIErrorType.TIMEOUT_ERROR);
      const strategy = RecoveryStrategyManager.getRetryStrategy(error);
      
      expect(strategy.retryAttempts).toBe(2);
      expect(strategy.gracefulDegradation).toBe(true);
      expect(strategy.autoRetry).toBe(true);
    });

    it('should return appropriate strategy for validation errors', () => {
      const error = new AIError('Validation error', AIErrorType.VALIDATION_ERROR);
      const strategy = RecoveryStrategyManager.getRetryStrategy(error);
      
      expect(strategy.retryAttempts).toBe(0);
      expect(strategy.gracefulDegradation).toBe(false);
      expect(strategy.autoRetry).toBe(false);
    });

    it('should return default strategy for unknown errors', () => {
      const error = new AIError('Unknown error', AIErrorType.UNKNOWN_ERROR);
      const strategy = RecoveryStrategyManager.getRetryStrategy(error);
      
      expect(strategy.retryAttempts).toBe(0);
      expect(strategy.gracefulDegradation).toBe(true);
      expect(strategy.autoRetry).toBe(false);
    });
  });

  describe('shouldGracefullyDegrade', () => {
    it('should return true for errors that should gracefully degrade', () => {
      const error = new AIError('Network error', AIErrorType.NETWORK_ERROR);
      const shouldDegrade = RecoveryStrategyManager.shouldGracefullyDegrade(error);
      
      expect(shouldDegrade).toBe(true);
    });

    it('should return false for errors that should not gracefully degrade', () => {
      const error = new AIError('Validation error', AIErrorType.VALIDATION_ERROR);
      const shouldDegrade = RecoveryStrategyManager.shouldGracefullyDegrade(error);
      
      expect(shouldDegrade).toBe(false);
    });
  });

  describe('getFallbackMode', () => {
    it('should return fallback mode from strategy if specified', () => {
      // Create a mock error that would have a fallback mode in its strategy
      const error = new AIError('Auth error', AIErrorType.AUTHENTICATION_ERROR);
      const fallbackMode = RecoveryStrategyManager.getFallbackMode(error, AIMode.PROMPT);
      
      expect(fallbackMode).toBe(AIMode.NONE);
    });

    it('should return appropriate fallback mode for modify mode', () => {
      const error = new AIError('Generic error', AIErrorType.UNKNOWN_ERROR);
      const fallbackMode = RecoveryStrategyManager.getFallbackMode(error, AIMode.MODIFY);
      
      expect(fallbackMode).toBe(AIMode.NONE);
    });

    it('should return appropriate fallback mode for continue mode with context error', () => {
      const error = new AIError('Context error', AIErrorType.CONTEXT_ERROR);
      const fallbackMode = RecoveryStrategyManager.getFallbackMode(error, AIMode.CONTINUE);
      
      expect(fallbackMode).toBe(AIMode.PROMPT);
    });

    it('should return appropriate fallback mode for continue mode with non-context error', () => {
      const error = new AIError('Generic error', AIErrorType.UNKNOWN_ERROR);
      const fallbackMode = RecoveryStrategyManager.getFallbackMode(error, AIMode.CONTINUE);
      
      expect(fallbackMode).toBe(AIMode.NONE);
    });

    it('should return appropriate fallback mode for prompt mode', () => {
      const error = new AIError('Generic error', AIErrorType.UNKNOWN_ERROR);
      const fallbackMode = RecoveryStrategyManager.getFallbackMode(error, AIMode.PROMPT);
      
      expect(fallbackMode).toBe(AIMode.NONE);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly message for network errors', () => {
      const error = new AIError('Network error', AIErrorType.NETWORK_ERROR);
      const message = RecoveryStrategyManager.getUserFriendlyMessage(error);
      
      expect(message).toBe('Unable to connect to AI service. Please check your internet connection and try again.');
    });

    it('should return user-friendly message for validation errors', () => {
      const error = new AIError('Validation error', AIErrorType.VALIDATION_ERROR);
      const message = RecoveryStrategyManager.getUserFriendlyMessage(error);
      
      expect(message).toBe('Please check your input and try again. Make sure all required fields are filled.');
    });

    it('should return default message for unknown errors', () => {
      const error = new AIError('Unknown error', AIErrorType.UNKNOWN_ERROR);
      const message = RecoveryStrategyManager.getUserFriendlyMessage(error);
      
      expect(message).toBe('An unexpected error occurred. Please try again later or contact support if the issue persists.');
    });
  });
});