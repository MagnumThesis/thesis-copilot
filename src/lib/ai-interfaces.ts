/**
 * AI Request and Response Interfaces
 * Base interfaces for AI service communication
 */

import { ModificationType } from './ai-types';

// Base AI request interface
export interface BaseAIRequest {
  conversationId: string;
  documentContent: string;
  timestamp?: number;
}

// AI Prompt request for prompt mode
export interface AIPromptRequest extends BaseAIRequest {
  prompt: string;
  cursorPosition: number;
}

// AI Continue request for continue mode
export interface AIContinueRequest extends BaseAIRequest {
  cursorPosition: number;
  selectedText?: string;
}

// AI Modify request for modify mode
export interface AIModifyRequest extends BaseAIRequest {
  selectedText: string;
  modificationType: ModificationType;
}

// Base AI response interface
export interface BaseAIResponse {
  success: boolean;
  timestamp: number;
  requestId?: string;
}

// Successful AI response with content
export interface AISuccessResponse extends BaseAIResponse {
  success: true;
  content: string;
  metadata?: {
    tokensUsed: number;
    processingTime: number;
    model?: string;
  };
}

// Failed AI response with error information
export interface AIErrorResponse extends BaseAIResponse {
  success: false;
  error: string;
  errorCode?: string;
  retryable?: boolean;
}

// Union type for all AI responses
export type AIResponse = AISuccessResponse | AIErrorResponse;

// AI service configuration interface
export interface AIServiceConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

// AI request options for fine-tuning behavior
export interface AIRequestOptions {
  maxRetries?: number;
  timeout?: number;
  priority?: 'low' | 'normal' | 'high';
  cacheKey?: string;
}