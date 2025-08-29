/**
 * AI Types and Enums
 * Core types for AI functionality in the thesis copilot
 * 
 * @deprecated This file has been refactored into modular types.
 * Please import from specific modules instead:
 * - @/lib/types/ai-types for AI-related types
 * - @/lib/types/citation-types for citation-related types  
 * - @/lib/types/search-types for search-related types
 * - @/lib/types/shared for common utility types
 */

// Backward compatibility re-exports
// Re-export all types from the new modular structure
export * from './types/ai-types';
export * from './types/citation-types';
export * from './types/search-types';
export * from './types/shared';

// Legacy content analysis types not yet modularized
export interface ContentAnalysis {
  clarity: number;
  coherence: number;
  academicTone: number;
  readability: number;
  issues: string[];
  structure?: StructureAnalysis;
  style?: StyleAnalysis;
  consistency?: ConsistencyAnalysis;
  completeness?: CompletenessAnalysis;
}

export interface StructureAnalysis {
  headingStructure: HeadingAnalysis[];
  paragraphFlow: FlowAnalysis[];
  sectionBalance: number;
  logicalProgression: number;
  issues: string[];
  hasIntroduction?: boolean;
  hasConclusion?: boolean;
  headingHierarchy?: {
    properHierarchy: boolean;
  };
  sectionFlow?: {
    coherenceScore: number;
  };
}

export interface StyleAnalysis {
  academicTone: number;
  consistency: number;
  formality: number;
  styleIssues: StyleIssue[];
  suggestions: string[];
  clarityScore?: number;
  formalityLevel?: number;
}

export interface ConsistencyAnalysis {
  terminologyConsistency: TerminologyIssue[];
  citationConsistency: CitationIssue[];
  formattingConsistency: FormattingIssue[];
  overallScore: number;
}

export interface CompletenessAnalysis {
  missingElements: string[];
  completenessScore: number;
  suggestions: string[];
  missingSections?: string[];
  insufficientDetail?: string[];
}

export interface StyleIssue {
  type: 'tone' | 'formality' | 'voice' | 'tense' | 'clarity';
  location?: import('./types/shared/common').ContentLocation;
  description: string;
  suggestion: string;
  severity?: import('./types/shared/common').ConcernSeverity;
}

export interface TerminologyIssue {
  term: string;
  inconsistentUsage: (import('./types/shared/common').ContentLocation | string)[];
  suggestedStandardization: string;
  severity: import('./types/shared/common').ConcernSeverity;
  locations?: any[];
}

export interface CitationIssue {
  type: 'format' | 'missing' | 'incomplete' | 'style' | 'style_inconsistency';
  location?: import('./types/shared/common').ContentLocation;
  description: string;
  suggestion: string;
  severity?: import('./types/shared/common').ConcernSeverity;
}

export interface FormattingIssue {
  type: 'spacing' | 'punctuation' | 'capitalization' | 'numbering';
  location?: import('./types/shared/common').ContentLocation;
  description: string;
  suggestion: string;
  severity?: import('./types/shared/common').ConcernSeverity;
}

export interface FlowAnalysis {
  paragraphIndex: number;
  flowScore: number;
  transitionQuality: number;
  coherenceIssues: string[];
  logicalProgression?: boolean;
  coherenceScore?: number;
}

export interface HeadingAnalysis {
  level: number;
  text: string;
  location: import('./types/shared/common').ContentLocation;
  structureIssues: string[];
  suggestions: string[];
  properHierarchy?: boolean;
  consistentFormatting?: boolean;
}

// Proofreader analysis types
export interface ProofreaderAnalysisRequest {
  conversationId: string;
  documentContent: string;
  concerns?: import('./types/shared/common').ProofreadingConcern[];
  ideaDefinitions?: import('./types/shared/common').IdeaDefinition[];
  includeSuggestions?: boolean;
  analysisDepth?: 'basic' | 'comprehensive' | 'detailed';
  focusAreas?: import('./types/shared/common').ConcernCategory[];
  analysisOptions?: {
    timeout?: number;
    maxRetries?: number;
    model?: string;
    categories?: import('./types/shared/common').ConcernCategory[];
    minSeverity?: import('./types/shared/common').ConcernSeverity;
    includeGrammar?: boolean;
    academicLevel?: string;
  };
}

export interface ProofreaderAnalysisResponse {
  success: boolean;
  concerns: import('./types/shared/common').ProofreadingConcern[];
  analysis: {
    totalConcerns: number;
    concernsByCategory: Record<import('./types/shared/common').ConcernCategory, number>;
    concernsBySeverity: Record<import('./types/shared/common').ConcernSeverity, number>;
    overallQualityScore: number;
    readabilityScore?: number;
    academicToneScore?: number;
  };
  metadata: AnalysisMetadata;
  analysisMetadata?: {
    totalConcerns?: number;
    concernsByCategory?: Record<import('./types/shared/common').ConcernCategory, number>;
    concernsBySeverity?: Record<import('./types/shared/common').ConcernSeverity, number>;
    analysisTime?: number;
    contentLength?: number;
    ideaDefinitionsUsed?: number;
    fallbackUsed?: boolean;
    cacheUsed?: boolean;
    cacheTimestamp?: number;
    offlineMode?: boolean;
  };
  error?: string;
}

export interface AnalysisMetadata {
  processingTime: number;
  modelUsed: string;
  analysisTimestamp: string;
  version: string;
  confidence: number;
  totalConcerns?: number;
  concernsByCategory?: Record<import('./types/shared/common').ConcernCategory, number>;
  concernsBySeverity?: Record<import('./types/shared/common').ConcernSeverity, number>;
  analysisTime?: number;
  contentLength?: number;
  ideaDefinitionsUsed?: number;
  fallbackUsed?: boolean;
  cacheUsed?: boolean;
  cacheTimestamp?: number;
}

// Chat/Conversation interface
export interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// Analysis options type
export interface AnalysisOptions {
  timeout?: number;
  maxRetries?: number;
  model?: string;
  categories?: import('./types/shared/common').ConcernCategory[];
  minSeverity?: import('./types/shared/common').ConcernSeverity;
  includeGrammar?: boolean;
  academicLevel?: string;
}

// Concern status management types
export interface ConcernStatusUpdate {
  concernId: string;
  status: import('./types/shared/common').ConcernStatus;
  notes?: string;
  timestamp: string;
}

export interface ConcernStatistics {
  totalConcerns: number;
  concernsByStatus: Record<import('./types/shared/common').ConcernStatus, number>;
  concernsByCategory: Record<import('./types/shared/common').ConcernCategory, number>;
  concernsBySeverity: Record<import('./types/shared/common').ConcernSeverity, number>;
  resolutionRate: number;
  averageResolutionTime: number;
  total?: number;
  toBeDone?: number;
  addressed?: number;
  rejected?: number;
  byCategory?: Record<string, any>;
  bySeverity?: Record<string, any>;
}

export interface ConcernStatusBreakdown {
  status: import('./types/shared/common').ConcernStatus;
  count: number;
  percentage: number;
  total?: number;
  toBeDone?: number;
  addressed?: number;
  rejected?: number;
}

// Additional types that might be missing from the original file
// AI processing types
export interface AIProcessingContext {
  conversationId: string;
  documentContent: string;
  cursorPosition: number;
  selectedText?: string;
  modificationType?: import('./types/ai-types').ModificationType;
  citationStyle?: import('./types/citation-types').CitationStyle;
}

export interface AIPerformanceMetrics {
  tokensUsed: number;
  processingTime: number;
  model: string;
  success: boolean;
  error?: string;
}

export interface AIProcessingState {
  isProcessing: boolean;
  currentOperation?: string;
  progress?: number;
  error?: string;
  startTime?: Date;
  estimatedCompletionTime?: Date;
  currentMode?: import('./types/ai-types').AIMode;
  statusMessage?: string;
}

// Processing status enum
export enum AIProcessingStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// Text selection interface
export interface TextSelection {
  start: number;
  end: number;
  text: string;
}

// Content insertion options
export interface ContentInsertionOptions {
  position?: 'start' | 'end' | 'cursor' | 'replace';
  content?: string;
  insertAt?: number;
  preserveFormatting?: boolean;
  replaceRange?: {
    start: number;
    end: number;
  };
}
