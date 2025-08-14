/**
 * AI Integration Types and Enumerations
 * Core type definitions for AI Builder Integration
 */

// AI Mode enumeration for different interaction modes
export enum AIMode {
  NONE = 'none',
  PROMPT = 'prompt',
  CONTINUE = 'continue',
  MODIFY = 'modify'
}

// Modification types for AI modify mode
export enum ModificationType {
  REWRITE = 'rewrite',
  EXPAND = 'expand',
  SUMMARIZE = 'summarize',
  IMPROVE_CLARITY = 'improve_clarity',
  PROMPT = 'prompt'
}

// Text selection interface for editor integration
export interface TextSelection {
  start: number;
  end: number;
  text: string;
}

// Content insertion options for AI-generated content
export interface ContentInsertionOptions {
  insertAt: number;
  replaceRange?: { start: number; end: number };
  preserveFormatting: boolean;
}

// Document section structure for context analysis
export interface DocumentSection {
  type: 'heading' | 'paragraph' | 'list' | 'code';
  level?: number;
  content: string;
  position: { start: number; end: number };
}

// Document context for AI processing
export interface DocumentContext {
  content: string;
  ideaDefinitions: IdeaDefinition[];
  conversationTitle: string;
  cursorPosition: number;
  selectedText?: string;
  documentStructure: DocumentSection[];
}

// Idea definition interface (from existing system)
export interface IdeaDefinition {
  id: number;
  title: string;
  description: string;
  conversationid?: string; // Added conversationid
}

// AI processing state for UI feedback
export interface AIProcessingState {
  isProcessing: boolean;
  currentMode: AIMode;
  progress?: number;
  statusMessage?: string;
}

// AI Request/Response interfaces for backend handlers
export interface AIPromptRequest {
  prompt: string;
  documentContent: string;
  cursorPosition: number;
  conversationId: string;
}

export interface AIContinueRequest {
  documentContent: string;
  cursorPosition: number;
  selectedText?: string;
  conversationId: string;
}

export interface AIModifyRequest {
  selectedText: string;
  modificationType: ModificationType;
  documentContent: string;
  conversationId: string;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    tokensUsed: number;
    processingTime: number;
  };
}