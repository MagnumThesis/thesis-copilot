/**
 * AI Modes and Operations
 * Contains types and enums related to AI operation modes and modification types
 */

/**
 * @enum {string}
 * @description Enum for AI modes.
 */
export enum AIMode {
  PROMPT = 'prompt',
  CONTINUE = 'continue',
  MODIFY = 'modify',
  NONE = 'none'
}

/**
 * @enum {string}
 * @description Enum for AI modification types.
 */
export enum ModificationType {
  PROMPT = 'prompt',
  EXPAND = 'expand',
  SHORTEN = 'shorten',
  REPHRASE = 'rephrase',
  CORRECT = 'correct',
  TONE = 'tone',
  FORMAT = 'format',
  REWRITE = 'rewrite',
  SUMMARIZE = 'summarize',
  IMPROVE_CLARITY = 'improve_clarity'
}

/**
 * @interface AIPromptRequest
 * @description Interface for an AI prompt request.
 */
export interface AIPromptRequest {
  /** @property {string} prompt - The prompt text. */
  prompt: string;
  /** @property {string} documentContent - The content of the document. */
  documentContent: string;
  /** @property {number} cursorPosition - The position of the cursor in the document. */
  cursorPosition: number;
  /** @property {string} conversationId - The ID of the conversation. */
  conversationId: string;
  /** @property {number} timestamp - The timestamp of the request. */
  timestamp: number;
}

/**
 * @interface AIContinueRequest
 * @description Interface for an AI continue request.
 */
export interface AIContinueRequest {
  /** @property {string} documentContent - The content of the document. */
  documentContent: string;
  /** @property {number} cursorPosition - The position of the cursor in the document. */
  cursorPosition: number;
  /** @property {string} [selectedText] - The selected text. */
  selectedText?: string;
  /** @property {string} conversationId - The ID of the conversation. */
  conversationId: string;
  /** @property {number} timestamp - The timestamp of the request. */
  timestamp: number;
}

/**
 * @interface AIModifyRequest
 * @description Interface for an AI modify request.
 */
export interface AIModifyRequest {
  /** @property {string} selectedText - The selected text to modify. */
  selectedText: string;
  /** @property {ModificationType} modificationType - The type of modification to perform. */
  modificationType: ModificationType;
  /** @property {string} documentContent - The content of the document. */
  documentContent: string;
  /** @property {string} conversationId - The ID of the conversation. */
  conversationId: string;
  /** @property {number} timestamp - The timestamp of the request. */
  timestamp: number;
  /** @property {string} [customPrompt] - A custom prompt for the modification. */
  customPrompt?: string;
}
