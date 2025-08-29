/**
 * AI Error Handling
 * Contains types and enums related to AI error handling and responses
 */

/**
 * @enum {string}
 * @description Enum for AI error types.
 */
export enum AIErrorType {
  NETWORK_ERROR = 'network_error',
  API_ERROR = 'api_error',
  VALIDATION_ERROR = 'validation_error',
  TIMEOUT_ERROR = 'timeout_error',
  QUOTA_ERROR = 'quota_error'
}

/**
 * @interface AIErrorResponse
 * @description Interface for an AI error response.
 */
export interface AIErrorResponse {
  /** @property {false} success - Always false for error responses. */
  success: false;
  /** @property {string} error - The error message. */
  error: string;
  /** @property {string} errorCode - The error code. */
  errorCode: string;
  /** @property {boolean} retryable - Whether the error is retryable. */
  retryable: boolean;
  /** @property {number} timestamp - The timestamp of the error. */
  timestamp: number;
  /** @property {string} [requestId] - The ID of the request that caused the error. */
  requestId?: string;
  /** @property {object} metadata - Metadata about the error. */
  metadata: {
    /** @property {number} tokensUsed - The number of tokens used. */
    tokensUsed: number;
    /** @property {number} processingTime - The processing time in milliseconds. */
    processingTime: number;
  };
}

/**
 * @interface AISuccessResponse
 * @description Interface for a successful AI response.
 */
export interface AISuccessResponse {
  /** @property {true} success - Always true for success responses. */
  success: true;
  /** @property {string} content - The generated content. */
  content: string;
  /** @property {number} timestamp - The timestamp of the response. */
  timestamp: number;
  /** @property {string} requestId - The ID of the request. */
  requestId: string;
  /** @property {object} metadata - Metadata about the response. */
  metadata: {
    /** @property {number} tokensUsed - The number of tokens used. */
    tokensUsed: number;
    /** @property {number} processingTime - The processing time in milliseconds. */
    processingTime: number;
    /** @property {string} model - The AI model used. */
    model: string;
    /** @property {object} [academicValidation] - Academic validation results. */
    academicValidation?: {
      /** @property {number} score - The academic validation score. */
      score: number;
      /** @property {string[]} issues - Issues found in the content. */
      issues: string[];
      /** @property {string[]} suggestions - Suggestions for improvement. */
      suggestions: string[];
    };
    /** @property {boolean} [contextSufficiency] - Whether the context was sufficient. */
    contextSufficiency?: boolean;
    /** @property {string} [styleAnalysis] - Analysis of the style. */
    styleAnalysis?: string;
  };
}
