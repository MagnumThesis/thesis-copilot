/**
 * AI Processing and Performance
 * Contains types related to AI processing status, performance metrics, and context
 */

/**
 * @enum {string}
 * @description Enum for AI processing status.
 */
export enum AIProcessingStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * @interface AIProcessingContext
 * @description Interface for the context of an AI processing operation.
 */
export interface AIProcessingContext {
  /** @property {string} conversationId - The ID of the conversation. */
  conversationId: string;
  /** @property {string} documentContent - The content of the document. */
  documentContent: string;
  /** @property {number} cursorPosition - The position of the cursor in the document. */
  cursorPosition: number;
  /** @property {string} [selectedText] - The selected text. */
  selectedText?: string;
  /** @property {import('./ai-modes').ModificationType} [modificationType] - The type of modification. */
  modificationType?: import('./ai-modes').ModificationType;
  /** @property {import('../citation-types').CitationStyle} [citationStyle] - The citation style. */
  citationStyle?: import('../citation-types').CitationStyle;
}

/**
 * @interface AIProcessingState
 * @description Interface for the AI processing state.
 */
export interface AIProcessingState {
  /** @property {boolean} isProcessing - Whether the AI is currently processing. */
  isProcessing: boolean;
  /** @property {string} [currentOperation] - The current operation being performed. */
  currentOperation?: string;
  /** @property {number} [progress] - The progress of the operation. */
  progress?: number;
  /** @property {string} [error] - The error message, if any. */
  error?: string;
  /** @property {Date} [startTime] - The start time of the operation. */
  startTime?: Date;
  /** @property {Date} [estimatedCompletionTime] - The estimated completion time of the operation. */
  estimatedCompletionTime?: Date;
  /** @property {import('./ai-modes').AIMode} [currentMode] - The current AI mode. */
  currentMode?: import('./ai-modes').AIMode;
  /** @property {string} [statusMessage] - The status message. */
  statusMessage?: string;
}

/**
 * @interface AIPerformanceMetrics
 * @description Interface for AI performance metrics.
 */
export interface AIPerformanceMetrics {
  /** @property {number} tokensUsed - The number of tokens used. */
  tokensUsed: number;
  /** @property {number} processingTime - The processing time in milliseconds. */
  processingTime: number;
  /** @property {string} model - The AI model used. */
  model: string;
  /** @property {boolean} success - Whether the operation was successful. */
  success: boolean;
  /** @property {string} [error] - The error message, if any. */
  error?: string;
}

/**
 * @interface TextSelection
 * @description Interface for a text selection.
 */
export interface TextSelection {
  /** @property {number} start - The start position of the selection. */
  start: number;
  /** @property {number} end - The end position of the selection. */
  end: number;
  /** @property {string} text - The selected text. */
  text: string;
}

/**
 * @interface ContentInsertionOptions
 * @description Interface for content insertion options.
 */
export interface ContentInsertionOptions {
  /** @property {'start' | 'end' | 'cursor' | 'replace'} [position] - The position to insert the content. */
  position?: 'start' | 'end' | 'cursor' | 'replace';
  /** @property {string} [content] - The content to insert. */
  content?: string;
  /** @property {number} [insertAt] - The position to insert the content at. */
  insertAt?: number;
  /** @property {boolean} [preserveFormatting] - Whether to preserve formatting. */
  preserveFormatting?: boolean;
  /** @property {{start: number, end: number}} [replaceRange] - The range to replace. */
  replaceRange?: {
    start: number;
    end: number;
  };
}
