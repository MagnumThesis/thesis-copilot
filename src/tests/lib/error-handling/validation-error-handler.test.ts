import { describe, it, expect } from 'vitest';
import { ValidationErrorHandler } from './validation-error-handler';
import { AIError, AIErrorType } from '../../ai-error-handler';

describe('ValidationErrorHandler', () => {
  describe('validateRequest', () => {
    it('should throw error for missing required fields', () => {
      const request = { conversationId: '123' };
      const requiredFields = ['conversationId', 'documentContent'];
      
      expect(() => ValidationErrorHandler.validateRequest(request, requiredFields))
        .toThrow('Missing required field: documentContent');
    });

    it('should throw error for invalid conversation ID format', () => {
      const request = { conversationId: 123, documentContent: 'test' };
      const requiredFields = ['conversationId', 'documentContent'];
      
      expect(() => ValidationErrorHandler.validateRequest(request, requiredFields))
        .toThrow('Invalid conversation ID format');
    });

    it('should throw error for invalid document content format', () => {
      const request = { conversationId: '123', documentContent: 123 };
      const requiredFields = ['conversationId', 'documentContent'];
      
      expect(() => ValidationErrorHandler.validateRequest(request, requiredFields))
        .toThrow('Invalid document content format');
    });

    it('should not throw error for valid request', () => {
      const request = { conversationId: '123', documentContent: 'test' };
      const requiredFields = ['conversationId', 'documentContent'];
      
      expect(() => ValidationErrorHandler.validateRequest(request, requiredFields))
        .not.toThrow();
    });
  });

  describe('validateParameters', () => {
    it('should throw error for invalid parameters format', () => {
      expect(() => ValidationErrorHandler.validateParameters(null as any))
        .toThrow('Invalid parameters format');
    });

    it('should throw error for empty prompt', () => {
      const params = { prompt: '' };
      
      expect(() => ValidationErrorHandler.validateParameters(params))
        .toThrow('Prompt cannot be empty');
    });

    it('should throw error for prompt that is too long', () => {
      const params = { prompt: 'a'.repeat(10001) };
      
      expect(() => ValidationErrorHandler.validateParameters(params))
        .toThrow('Prompt is too long. Please shorten your prompt.');
    });

    it('should throw error for invalid cursor position format', () => {
      const params = { cursorPosition: 'invalid' };
      
      expect(() => ValidationErrorHandler.validateParameters(params))
        .toThrow('Invalid cursor position format');
    });

    it('should throw error for negative cursor position', () => {
      const params = { cursorPosition: -1 };
      
      expect(() => ValidationErrorHandler.validateParameters(params))
        .toThrow('Cursor position cannot be negative');
    });

    it('should throw error for invalid selected text format', () => {
      const params = { selectedText: 123 };
      
      expect(() => ValidationErrorHandler.validateParameters(params))
        .toThrow('Invalid selected text format');
    });

    it('should throw error for selected text that is too long', () => {
      const params = { selectedText: 'a'.repeat(5001) };
      
      expect(() => ValidationErrorHandler.validateParameters(params))
        .toThrow('Selected text is too long. Please select a shorter portion of text.');
    });

    it('should not throw error for valid parameters', () => {
      const params = { 
        prompt: 'test prompt',
        cursorPosition: 10,
        selectedText: 'selected text'
      };
      
      expect(() => ValidationErrorHandler.validateParameters(params))
        .not.toThrow();
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly message for missing field error', () => {
      const error = new AIError(
        'Missing required field: documentContent',
        AIErrorType.VALIDATION_ERROR,
        'MISSING_FIELD'
      );
      
      const message = ValidationErrorHandler.getUserFriendlyMessage(error);
      expect(message).toBe('Please provide all required information: documentContent');
    });

    it('should return user-friendly message for empty prompt error', () => {
      const error = new AIError(
        'Prompt cannot be empty',
        AIErrorType.VALIDATION_ERROR,
        'EMPTY_PROMPT'
      );
      
      const message = ValidationErrorHandler.getUserFriendlyMessage(error);
      expect(message).toBe('Please enter a prompt before submitting.');
    });

    it('should return default message for unknown validation error', () => {
      const error = new AIError(
        'Unknown validation error',
        AIErrorType.VALIDATION_ERROR
      );
      
      const message = ValidationErrorHandler.getUserFriendlyMessage(error);
      expect(message).toBe('Please check your input and try again.');
    });
  });

  describe('normalizeValidationError', () => {
    it('should return AIError as-is if already a validation AIError', () => {
      const aiError = new AIError(
        'Test error',
        AIErrorType.VALIDATION_ERROR,
        'TEST_ERROR'
      );
      
      const result = ValidationErrorHandler.normalizeValidationError(aiError);
      expect(result).toBe(aiError);
    });

    it('should normalize Error into validation AIError', () => {
      const error = new Error('Test error');
      
      const result = ValidationErrorHandler.normalizeValidationError(error);
      
      expect(result).toBeInstanceOf(AIError);
      expect(result.type).toBe(AIErrorType.VALIDATION_ERROR);
      expect(result.message).toBe('Test error');
    });

    it('should normalize unknown error into validation AIError', () => {
      const error = 'Unknown error';
      
      const result = ValidationErrorHandler.normalizeValidationError(error);
      
      expect(result).toBeInstanceOf(AIError);
      expect(result.type).toBe(AIErrorType.VALIDATION_ERROR);
      expect(result.message).toBe('Validation failed. Please check your input.');
    });
  });
});