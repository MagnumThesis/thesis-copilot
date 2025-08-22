/**
 * AI Types and Enums
 * Core types for AI functionality in the thesis copilot
 */

// Citation styles enum
export enum CitationStyle {
  APA = 'apa',
  MLA = 'mla',
  CHICAGO = 'chicago',
  HARVARD = 'harvard',
  IEEE = 'ieee',
  VANCOUVER = 'vancouver'
}

// Reference types enum
export enum ReferenceType {
  JOURNAL_ARTICLE = 'journal_article',
  BOOK = 'book',
  BOOK_CHAPTER = 'book_chapter',
  CONFERENCE_PAPER = 'conference_paper',
  THESIS = 'thesis',
  WEBSITE = 'website',
  REPORT = 'report',
  PATENT = 'patent',
  OTHER = 'other'
}

// AI modification types
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

// AI processing status
export enum AIProcessingStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// AI error types
export enum AIErrorType {
  NETWORK_ERROR = 'network_error',
  API_ERROR = 'api_error',
  VALIDATION_ERROR = 'validation_error',
  TIMEOUT_ERROR = 'timeout_error',
  QUOTA_ERROR = 'quota_error'
}

// Reference interface matching database schema
export interface Reference {
  id: string;
  conversation_id: string;
  type: ReferenceType;
  title: string;
  authors: string[];
  publication_date?: string;
  url?: string;
  doi?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  isbn?: string;
  edition?: string;
  chapter?: string;
  editor?: string;
  access_date?: string;
  notes?: string;
  tags: string[];
  metadata_confidence: number;
  ai_search_source?: string;
  ai_confidence: number;
  ai_relevance_score: number;
  ai_search_query?: string;
  ai_search_timestamp?: string;
  created_at: string;
  updated_at: string;
}

// Citation instance interface
export interface CitationInstance {
  id: string;
  reference_id: string;
  conversation_id: string;
  citation_style: CitationStyle;
  citation_text: string;
  document_position?: number;
  context?: string;
  created_at: string;
}

// Chat/Conversation interface
export interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// AI search result interface
export interface AISearchResult {
  reference: Partial<Reference>;
  confidence: number;
  relevance_score: number;
  source: string;
  search_query: string;
  timestamp: string;
}

// AI processing context
export interface AIProcessingContext {
  conversationId: string;
  documentContent: string;
  cursorPosition: number;
  selectedText?: string;
  modificationType?: ModificationType;
  citationStyle?: CitationStyle;
}

// AI performance metrics
export interface AIPerformanceMetrics {
  tokensUsed: number;
  processingTime: number;
  model: string;
  success: boolean;
  error?: string;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Export configuration
export interface ExportConfig {
  format: 'bibtex' | 'ris' | 'json' | 'csv';
  citationStyle: CitationStyle;
  includeNotes: boolean;
  includeTags: boolean;
}

// Filter options for reference lists
export interface ReferenceFilters {
  type?: ReferenceType;
  citationStyle?: CitationStyle;
  searchQuery?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  confidenceRange?: {
    min: number;
    max: number;
  };
}

// Sort options for reference lists
export interface ReferenceSort {
  field: keyof Reference;
  direction: 'asc' | 'desc';
}

// Pagination options
export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

// Missing types that are being imported by other components
export enum AIMode {
  PROMPT = 'prompt',
  CONTINUE = 'continue',
  MODIFY = 'modify',
  NONE = 'none'
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

// Proofreading concern types
export enum ConcernStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
  ADDRESSED = 'addressed',
  REJECTED = 'rejected',
  TO_BE_DONE = 'to_be_done'
}

export enum ConcernSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ConcernCategory {
  GRAMMAR = 'grammar',
  STYLE = 'style',
  CLARITY = 'clarity',
  CONSISTENCY = 'consistency',
  ACADEMIC_TONE = 'academic_tone',
  CITATION = 'citation',
  STRUCTURE = 'structure',
  COHERENCE = 'coherence',
  COMPLETENESS = 'completeness',
  TERMINOLOGY = 'terminology'
}

export interface ProofreadingConcern {
  id: string;
  text: string;
  category: ConcernCategory;
  severity: ConcernSeverity;
  status: ConcernStatus;
  suggestions: string[];
  relatedIdeas: string[];
  position: {
    start: number;
    end: number;
  };
  explanation: string;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
  title?: string;
  description?: string;
  location?: {
    section?: string;
    paragraph?: number;
    context?: string;
  };
}

// AI search and reference types
export interface ScholarSearchResult {
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  citations?: number;
  publication_date?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  keywords?: string[];
  confidence: number;
  relevance_score: number;
  citation_count?: number;
}

export interface ReferenceMetadata {
  title: string;
  authors: string[];
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publication_date?: string;
  publicationDate?: Date;
  doi?: string;
  isbn?: string;
  url?: string;
  abstract?: string;
  keywords: string[];
  citations?: number;
  confidence: number;
}

export interface ReferenceSuggestion {
  reference: ReferenceMetadata;
  reasoning: string;
  relevance_score: number;
  relevanceScore?: number;
  confidence: number;
  isDuplicate?: boolean;
}

export interface SuggestionRanking {
  relevance: number;
  recency: number;
  citations: number;
  authorAuthority: number;
  overall: number;
}

// Bibliography types
export interface BibliographyRequest {
  conversationId: string;
  style: CitationStyle;
  format: 'text' | 'html' | 'markdown' | 'bibtex' | 'ris';
  sortOrder?: 'alphabetical' | 'chronological' | 'appearance';
  includeUrls?: boolean;
}

export interface BibliographyResponse {
  success: boolean;
  bibliography: string;
  format: string;
  citation_count: number;
  error?: string;
}

// Search history types
export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string | Date;
  results_count: number;
  results?: {
    total: number;
    accepted: number;
    rejected: number;
  };
  sources: string[];
  filters?: Record<string, unknown>;
  user_id?: string;
  userId?: string;
}

export interface SearchAnalytics {
  total_searches: number;
  totalSearches?: number;
  average_results: number;
  averageResults?: number;
  popular_sources: string[];
  popularTopics?: string[];
  topSources?: string[];
  search_frequency: Record<string, number>;
  successRate?: number;
  period: {
    start: string;
    end: string;
  };
}

// Content extraction types
export interface ExtractedContent {
  source?: 'ideas' | 'builder';
  title?: string;
  authors?: string[];
  abstract?: string;
  keywords?: string[];
  topics?: string[];
  content?: string;
  publication_date?: string;
  doi?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  confidence: number;
}

// Author interface
export interface Author {
  firstName: string;
  lastName: string;
  middleName?: string;
  affiliation?: string;
}

// Reference search options
export interface ReferenceSearchOptions {
  query?: string;
  type?: ReferenceType;
  author?: string;
  year?: number;
  tags?: string[];
  sortBy?: 'title' | 'author' | 'date' | 'created';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Metadata extraction request
export interface MetadataExtractionRequest {
  source: string;
  type: 'url' | 'doi';
  conversationId: string;
}

// Citation request
export interface CitationRequest {
  referenceId: string;
  style: CitationStyle;
  type: 'inline' | 'bibliography';
  context?: string;
}

// Missing type definitions needed by other components

// Idea definition interface
export interface IdeaDefinition {
  id: string;
  title: string;
  content: string;
  description: string;
  type: 'concept' | 'hypothesis' | 'method' | 'result' | 'conclusion';
  tags: string[];
  confidence: number;
  created_at: string;
  updated_at: string;
}

// Document context interface
export interface DocumentContext {
  conversationId: string;
  documentContent: string;
  cursorPosition: number;
  selectedText?: string;
  wordCount: number;
  paragraphCount: number;
  section?: string;
  academicContext?: {
    discipline?: string;
    level?: 'undergraduate' | 'graduate' | 'phd';
    field?: string;
    style?: string;
  };
}

// AI processing state (different from status)
export interface AIProcessingState {
  isProcessing: boolean;
  currentOperation?: string;
  progress?: number;
  error?: string;
  startTime?: Date;
  estimatedCompletionTime?: Date;
  currentMode?: AIMode;
}

// Proofreader analysis types
export interface ProofreaderAnalysisRequest {
  conversationId: string;
  documentContent: string;
  concerns?: ProofreadingConcern[];
  ideaDefinitions?: IdeaDefinition[];
  includeSuggestions?: boolean;
  analysisDepth?: 'basic' | 'comprehensive' | 'detailed';
  focusAreas?: ConcernCategory[];
  analysisOptions?: {
    timeout?: number;
    maxRetries?: number;
    model?: string;
    categories?: ConcernCategory[];
    minSeverity?: ConcernSeverity;
    includeGrammar?: boolean;
  };
}

export interface ProofreaderAnalysisResponse {
  success: boolean;
  concerns: ProofreadingConcern[];
  analysis: {
    totalConcerns: number;
    concernsByCategory: Record<ConcernCategory, number>;
    concernsBySeverity: Record<ConcernSeverity, number>;
    overallQualityScore: number;
    readabilityScore?: number;
    academicToneScore?: number;
  };
  metadata: AnalysisMetadata;
  analysisMetadata?: {
    totalConcerns?: number;
    concernsByCategory?: Record<ConcernCategory, number>;
    concernsBySeverity?: Record<ConcernSeverity, number>;
    analysisTime?: number;
    contentLength?: number;
    ideaDefinitionsUsed?: number;
    fallbackUsed?: boolean;
    cacheUsed?: boolean;
    cacheTimestamp?: number;
  };
  error?: string;
}

// Analysis metadata
export interface AnalysisMetadata {
  processingTime: number;
  modelUsed: string;
  analysisTimestamp: string;
  version: string;
  confidence: number;
  totalConcerns?: number;
  concernsByCategory?: Record<ConcernCategory, number>;
  concernsBySeverity?: Record<ConcernSeverity, number>;
  analysisTime?: number;
  contentLength?: number;
  ideaDefinitionsUsed?: number;
  fallbackUsed?: boolean;
  cacheUsed?: boolean;
  cacheTimestamp?: number;
}

// Utility functions for safe type conversions
export const safeDate = (dateValue: string | Date | undefined | null): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  try {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};

export const safeString = (value: unknown): string => {
  return value?.toString() ?? '';
};

export const safeNumber = (value: unknown): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// AI Request and Response Types
export interface AIPromptRequest {
  prompt: string;
  documentContent: string;
  cursorPosition: number;
  conversationId: string;
  timestamp: number;
}

export interface AIContinueRequest {
  documentContent: string;
  cursorPosition: number;
  selectedText?: string;
  conversationId: string;
  timestamp: number;
}

export interface AIModifyRequest {
  selectedText: string;
  modificationType: ModificationType;
  documentContent: string;
  conversationId: string;
  timestamp: number;
  customPrompt?: string;
}

export interface AISuccessResponse {
  success: true;
  content: string;
  timestamp: number;
  requestId: string;
  metadata: {
    tokensUsed: number;
    processingTime: number;
    model: string;
    academicValidation?: {
      score: number;
      issues: string[];
      suggestions: string[];
    };
    contextSufficiency?: boolean;
    styleAnalysis?: string;
  };
}

export interface AIErrorResponse {
  success: false;
  error: string;
  errorCode: string;
  retryable: boolean;
  timestamp: number;
  requestId?: string;
  metadata: {
    tokensUsed: number;
    processingTime: number;
  };
}
