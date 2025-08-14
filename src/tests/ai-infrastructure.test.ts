/**
 * Unit tests for AI Infrastructure
 */

import { describe, it, expect } from 'vitest';
import {
  AIMode,
  ModificationType,
  AIError,
  AIErrorType,
  AIErrorHandler
} from '../lib/ai-infrastructure';

describe('AI Infrastructure', () => {
  describe('AI Mode Enumeration', () => {
    it('should have correct AI mode values', () => {
      expect(AIMode.NONE).toBe('none');
      expect(AIMode.PROMPT).toBe('prompt');
      expect(AIMode.CONTINUE).toBe('continue');
      expect(AIMode.MODIFY).toBe('modify');
    });
  });

  describe('Modification Type Enumeration', () => {
    it('should have correct modification type values', () => {
      expect(ModificationType.REWRITE).toBe('rewrite');
      expect(ModificationType.EXPAND).toBe('expand');
      expect(ModificationType.SUMMARIZE).toBe('summarize');
      expect(ModificationType.IMPROVE_CLARITY).toBe('improve_clarity');
    });
  });

  describe('AI Error Handling', () => {
    it('should create AIError with correct properties', () => {
      const error = new AIError(
        'Test error',
        AIErrorType.NETWORK_ERROR,
        'TEST_CODE',
        true
      );

      expect(error.message).toBe('Test error');
      expect(error.type).toBe(AIErrorType.NETWORK_ERROR);
      expect(error.code).toBe('TEST_CODE');
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('AIError');
    });

    it('should handle unknown errors correctly', () => {
      const unknownError = new Error('Unknown error');
      const response = AIErrorHandler.handleError(unknownError, 'test context');

      expect(response.success).toBe(false);
      expect(response.error).toContain('An unexpected error occurred');
      expect(response.retryable).toBe(false);
      expect(response.timestamp).toBeTypeOf('number');
    });

    it('should validate requests correctly', () => {
      const validRequest = {
        conversationId: 'test-id',
        documentContent: 'test content'
      };

      expect(() => {
        AIErrorHandler.validateRequest(validRequest, ['conversationId', 'documentContent']);
      }).not.toThrow();

      const invalidRequest = {
        conversationId: 'test-id'
        // missing documentContent
      };

      expect(() => {
        AIErrorHandler.validateRequest(invalidRequest, ['conversationId', 'documentContent']);
      }).toThrow(AIError);
    });

    it('should get appropriate retry strategy for different error types', () => {
      const networkError = new AIError('Network error', AIErrorType.NETWORK_ERROR);
      const strategy = AIErrorHandler.getRetryStrategy(networkError);

      expect(strategy.retryAttempts).toBe(3);
      expect(strategy.logLevel).toBe('warn');
      expect(strategy.userNotification).toContain('Connection issue');
    });

    it('should provide user-friendly error messages', () => {
      const networkError = new AIError('Network error', AIErrorType.NETWORK_ERROR);
      const message = AIErrorHandler.getUserFriendlyMessage(networkError);

      expect(message).toContain('Unable to connect to AI service');
    });

    it('should identify successful responses correctly', () => {
      const successResponse = {
        success: true as const,
        content: 'Generated content',
        timestamp: Date.now()
      };

      const errorResponse = {
        success: false as const,
        error: 'Error message',
        timestamp: Date.now()
      };

      expect(AIErrorHandler.isSuccessResponse(successResponse)).toBe(true);
      expect(AIErrorHandler.isSuccessResponse(errorResponse)).toBe(false);
    });
  });
});