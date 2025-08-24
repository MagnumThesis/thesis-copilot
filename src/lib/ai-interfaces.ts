/**
 * AI Request and Response Interfaces
 * Base interfaces for AI service communication
 */

import { ModificationType } from './ai-types';

// Base AI request interface
/**
 * @interface BaseAIRequest
 * @description Base interface for all AI requests.
 */
export interface BaseAIRequest {
  /** @property {string} conversationId - The ID of the conversation. */
  conversationId: string;
  /** @property {string} documentContent - The content of the document. */
  documentContent: string;
  /** @property {number} [timestamp] - The timestamp of the request. */
  timestamp?: number;
}

// AI Prompt request for prompt mode
/**
 * @interface AIPromptRequest
 * @extends BaseAIRequest
 * @description Interface for AI requests in prompt mode.
 */
export interface AIPromptRequest extends BaseAIRequest {
  /** @property {string} prompt - The prompt for the AI. */
  prompt: string;
  /** @property {number} cursorPosition - The position of the cursor in the document. */
  cursorPosition: number;
}

// AI Continue request for continue mode
/**
 * @interface AIContinueRequest
 * @extends BaseAIRequest
 * @description Interface for AI requests in continue mode.
 */
export interface AIContinueRequest extends BaseAIRequest {
  /** @property {number} cursorPosition - The position of the cursor in the document. */
  cursorPosition: number;
  /** @property {string} [selectedText] - The selected text to continue from. */
  selectedText?: string;
}

// AI Modify request for modify mode
/**
 * @interface AIModifyRequest
 * @extends BaseAIRequest
 * @description Interface for AI requests in modify mode.
 */
export interface AIModifyRequest extends BaseAIRequest {
  /** @property {string} selectedText - The selected text to modify. */
  selectedText: string;
  /** @property {ModificationType} modificationType - The type of modification to perform. */
  modificationType: ModificationType;
  /** @property {string} [customPrompt] - A custom prompt for the modification. */
  customPrompt?: string; // For ModificationType.PROMPT
}

// Base AI response interface
/**
 * @interface BaseAIResponse
 * @description Base interface for all AI responses.
 */
export interface BaseAIResponse {
  /** @property {boolean} success - Whether the request was successful. */
  success: boolean;
  /** @property {number} timestamp - The timestamp of the response. */
  timestamp: number;
  /** @property {string} [requestId] - The ID of the request. */
  requestId?: string;
}

// Successful AI response with content
/**
 * @interface AISuccessResponse
 * @extends BaseAIResponse
 * @description Interface for successful AI responses.
 */
export interface AISuccessResponse extends BaseAIResponse {
  /** @property {true} success - Indicates a successful request. */
  success: true;
  /** @property {string} content - The content of the response. */
  content: string;
  /** @property {object} [metadata] - Optional metadata about the response. */
  metadata?: {
    tokensUsed: number;
    processingTime: number;
    model?: string;
    contextSufficiency?: boolean;
    styleAnalysis?: string;
    academicValidation?: any;
  };
}

// Failed AI response with error information
/**
 * @interface AIErrorResponse
 * @extends BaseAIResponse
 * @description Interface for failed AI responses.
 */
export interface AIErrorResponse extends BaseAIResponse {
  /** @property {false} success - Indicates a failed request. */
  success: false;
  /** @property {string} error - The error message. */
  error: string;
  /** @property {string} [errorCode] - An optional error code. */
  errorCode?: string;
  /** @property {boolean} [retryable] - Whether the request is retryable. */
  retryable?: boolean;
  /** @property {object} [metadata] - Optional metadata about the response. */
  metadata?: {
    tokensUsed: number;
    processingTime: number;
  };
}

// Union type for all AI responses
export type AIResponse = AISuccessResponse | AIErrorResponse;

// AI service configuration interface
/**
 * @interface AIServiceConfig
 * @description Interface for AI service configuration.
 */
export interface AIServiceConfig {
  /** @property {string} apiKey - The API key for the AI service. */
  apiKey: string;
  /** @property {string} [model] - The name of the AI model to use. */
  model?: string;
  /** @property {number} [maxTokens] - The maximum number of tokens to generate. */
  maxTokens?: number;
  /** @property {number} [temperature] - The temperature for the AI model. */
  temperature?: number;
  /** @property {number} [timeout] - The timeout for the AI request. */
  timeout?: number;
}

// AI request options for fine-tuning behavior
/**
 * @interface AIRequestOptions
 * @description Interface for AI request options.
 */
export interface AIRequestOptions {
  /** @property {number} [maxRetries] - The maximum number of retries for the request. */
  maxRetries?: number;
  /** @property {number} [timeout] - The timeout for the request. */
  timeout?: number;
  /** @property {'low' | 'normal' | 'high'} [priority] - The priority of the request. */
  priority?: 'low' | 'normal' | 'high';
  /** @property {string} [cacheKey] - The cache key for the request. */
  cacheKey?: string;
}