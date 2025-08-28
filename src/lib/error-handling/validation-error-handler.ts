/**
 * Validation Error Handler
 * Handles validation errors for AI requests with user-friendly error messages
 */

import { AIError, AIErrorType } from "../ai-error-handler";

export class ValidationErrorHandler {
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
   * Validate request parameters
   */
  static validateParameters(params: Record<string, any>): void {
    // Validate that params is an object
    if (!params || typeof params !== 'object') {
      throw new AIError(
        'Invalid parameters format',
        AIErrorType.VALIDATION_ERROR,
        'INVALID_PARAMETERS',
        false
      );
    }

    // Validate prompt length if present
    if (params.prompt && typeof params.prompt === 'string') {
      if (params.prompt.trim().length === 0) {
        throw new AIError(
          'Prompt cannot be empty',
          AIErrorType.VALIDATION_ERROR,
          'EMPTY_PROMPT',
          false
        );
      }
      
      if (params.prompt.length > 10000) {
        throw new AIError(
          'Prompt is too long. Please shorten your prompt.',
          AIErrorType.VALIDATION_ERROR,
          'PROMPT_TOO_LONG',
          false
        );
      }
    }

    // Validate cursor position if present
    if (params.cursorPosition !== undefined) {
      if (typeof params.cursorPosition !== 'number') {
        throw new AIError(
          'Invalid cursor position format',
          AIErrorType.VALIDATION_ERROR,
          'INVALID_CURSOR_POSITION',
          false
        );
      }
      
      if (params.cursorPosition < 0) {
        throw new AIError(
          'Cursor position cannot be negative',
          AIErrorType.VALIDATION_ERROR,
          'NEGATIVE_CURSOR_POSITION',
          false
        );
      }
    }

    // Validate selected text if present
    if (params.selectedText !== undefined && params.selectedText !== null) {
      if (typeof params.selectedText !== 'string') {
        throw new AIError(
          'Invalid selected text format',
          AIErrorType.VALIDATION_ERROR,
          'INVALID_SELECTED_TEXT',
          false
        );
      }
      
      if (params.selectedText.length > 5000) {
        throw new AIError(
          'Selected text is too long. Please select a shorter portion of text.',
          AIErrorType.VALIDATION_ERROR,
          'SELECTED_TEXT_TOO_LONG',
          false
        );
      }
    }
  }

  /**
   * Get user-friendly validation error message
   */
  static getUserFriendlyMessage(error: AIError): string {
    switch (error.code) {
      case 'MISSING_FIELD':
        return `Please provide all required information: ${error.message.replace('Missing required field: ', '')}`;
      case 'INVALID_CONVERSATION_ID':
        return 'The conversation ID format is invalid. Please try refreshing the page.';
      case 'INVALID_DOCUMENT_CONTENT':
        return 'The document content format is invalid. Please try again.';
      case 'EMPTY_PROMPT':
        return 'Please enter a prompt before submitting.';
      case 'PROMPT_TOO_LONG':
        return 'Your prompt is too long. Please shorten it and try again.';
      case 'INVALID_CURSOR_POSITION':
        return 'The cursor position is invalid. Please try again.';
      case 'NEGATIVE_CURSOR_POSITION':
        return 'The cursor position cannot be negative. Please try again.';
      case 'INVALID_SELECTED_TEXT':
        return 'The selected text format is invalid. Please try again.';
      case 'SELECTED_TEXT_TOO_LONG':
        return 'The selected text is too long. Please select a shorter portion of text.';
      default:
        return 'Please check your input and try again.';
    }
  }

  /**
   * Normalize validation errors into AIError
   */
  static normalizeValidationError(error: unknown): AIError {
    if (error instanceof AIError && error.type === AIErrorType.VALIDATION_ERROR) {
      return error;
    }

    if (error instanceof Error) {
      return new AIError(
        error.message,
        AIErrorType.VALIDATION_ERROR,
        'VALIDATION_FAILED',
        false,
        error
      );
    }

    return new AIError(
      'Validation failed. Please check your input.',
      AIErrorType.VALIDATION_ERROR,
      'VALIDATION_FAILED',
      false,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}