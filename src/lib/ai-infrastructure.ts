/**
 * AI Infrastructure Index
 * Central export point for all AI integration infrastructure
 */

// Export all types and enums
export * from './ai-types';

// Export all interfaces
export * from './ai-interfaces';

// Export error handling utilities
export * from './ai-error-handler';

// Re-export commonly used types for convenience
export {
  AIMode,
  ModificationType
} from './ai-types';

export type {
  TextSelection,
  DocumentContext,
  AIProcessingState
} from './ai-types';

export type {
  AIPromptRequest,
  AIContinueRequest,
  AIModifyRequest,
  AIResponse,
  AISuccessResponse,
  AIErrorResponse,
  AIServiceConfig,
  AIRequestOptions
} from './ai-interfaces';

export {
  AIError,
  AIErrorType,
  AIErrorHandler
} from './ai-error-handler';