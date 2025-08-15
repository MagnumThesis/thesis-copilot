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
  academicContext?: AcademicContext;
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
  customPrompt?: string;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    tokensUsed: number;
    processingTime: number;
    contextSufficiency?: boolean;
    styleAnalysis?: string;
    academicValidation?: AcademicValidationResult;
  };
}

// Academic context interfaces
export interface AcademicValidationResult {
  isAcademic: boolean;
  toneScore: number; // 0-1 scale
  styleIssues: string[];
  suggestions: string[];
  citationFormat: CitationFormat;
}

export interface CitationFormat {
  style: 'APA' | 'MLA' | 'Chicago' | 'Harvard' | 'IEEE' | 'Unknown';
  detected: boolean;
  examples: string[];
}

export interface ThesisStructure {
  sections: ThesisSection[];
  currentSection?: string;
  completeness: number; // 0-1 scale
}

export interface ThesisSection {
  name: string;
  level: number;
  required: boolean;
  present: boolean;
  content?: string;
  subsections?: ThesisSection[];
}

export interface AcademicContext {
  thesisStructure: ThesisStructure;
  citationFormat: CitationFormat;
  academicTone: {
    level: 'undergraduate' | 'graduate' | 'doctoral';
    discipline: string;
    formalityScore: number;
  };
  keyTerms: string[];
  researchMethodology?: string;
}