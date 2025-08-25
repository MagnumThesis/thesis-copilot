/**
 * AI Types and Enums
 * Core types for AI functionality in the thesis copilot
 */

// Citation styles enum
/**
 * @enum {string}
 * @description Enum for citation styles.
 */
export enum CitationStyle {
  APA = 'apa',
  MLA = 'mla',
  CHICAGO = 'chicago',
  HARVARD = 'harvard',
  IEEE = 'ieee',
  VANCOUVER = 'vancouver'
}

// Reference types enum
/**
 * @enum {string}
 * @description Enum for reference types.
 */
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

// AI processing status
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

// AI error types
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

// Reference interface matching database schema
/**
 * @interface Reference
 * @description Interface for a reference, matching the database schema.
 */
export interface Reference {
  /** @property {string} id - The unique ID of the reference. */
  id: string;
  /** @property {string} conversation_id - The ID of the conversation the reference belongs to. */
  conversation_id: string;
  /** @property {ReferenceType} type - The type of the reference. */
  type: ReferenceType;
  /** @property {string} title - The title of the reference. */
  title: string;
  /** @property {(string | Author)[]} authors - The authors of the reference. */
  authors: (string | Author)[];
  /** @property {string} [publication_date] - The publication date of the reference. */
  publication_date?: string;
  /** @property {string} [url] - The URL of the reference. */
  url?: string;
  /** @property {string} [doi] - The DOI of the reference. */
  doi?: string;
  /** @property {string} [journal] - The journal of the reference. */
  journal?: string;
  /** @property {string} [volume] - The volume of the reference. */
  volume?: string;
  /** @property {string} [issue] - The issue of the reference. */
  issue?: string;
  /** @property {string} [pages] - The pages of the reference. */
  pages?: string;
  /** @property {string} [publisher] - The publisher of the reference. */
  publisher?: string;
  /** @property {string} [isbn] - The ISBN of the reference. */
  isbn?: string;
  /** @property {string} [edition] - The edition of the reference. */
  edition?: string;
  /** @property {string} [chapter] - The chapter of the reference. */
  chapter?: string;
  /** @property {string} [editor] - The editor of the reference. */
  editor?: string;
  /** @property {string} [access_date] - The access date of the reference. */
  access_date?: string;
  /** @property {string} [notes] - Notes for the reference. */
  notes?: string;
  /** @property {string[]} tags - Tags for the reference. */
  tags: string[];
  /** @property {number} metadata_confidence - The confidence score for the metadata. */
  metadata_confidence: number;
  /** @property {string} [ai_search_source] - The source of the AI search. */
  ai_search_source?: string;
  /** @property {number} ai_confidence - The confidence score from the AI. */
  ai_confidence: number;
  /** @property {number} ai_relevance_score - The relevance score from the AI. */
  ai_relevance_score: number;
  /** @property {string} [ai_search_query] - The AI search query. */
  ai_search_query?: string;
  /** @property {string} [ai_search_timestamp] - The timestamp of the AI search. */
  ai_search_timestamp?: string;
  /** @property {string} created_at - The creation timestamp of the reference. */
  created_at: string;
  /** @property {string} updated_at - The last update timestamp of the reference. */
  updated_at: string;
  // Legacy properties for backward compatibility
  conversationId?: string;
  publicationDate?: Date;
  accessDate?: Date;
  createdAt?: Date;
  referenceId?: string;
}

// Citation instance interface
/**
 * @interface CitationInstance
 * @description Interface for a citation instance.
 */
export interface CitationInstance {
  /** @property {string} id - The unique ID of the citation instance. */
  id: string;
  /** @property {string} reference_id - The ID of the reference being cited. */
  reference_id: string;
  /** @property {string} conversation_id - The ID of the conversation the citation belongs to. */
  conversation_id: string;
  /** @property {CitationStyle} citation_style - The citation style. */
  citation_style: CitationStyle;
  /** @property {string} citation_text - The text of the citation. */
  citation_text: string;
  /** @property {number} [document_position] - The position of the citation in the document. */
  document_position?: number;
  /** @property {string} [context] - The context of the citation. */
  context?: string;
  /** @property {string} created_at - The creation timestamp of the citation. */
  created_at: string;
  // Legacy properties for backward compatibility
  referenceId?: string;
}

// Chat/Conversation interface
/**
 * @interface Chat
 * @description Interface for a chat/conversation.
 */
export interface Chat {
  /** @property {string} id - The unique ID of the chat. */
  id: string;
  /** @property {string} title - The title of the chat. */
  title: string;
  /** @property {string} created_at - The creation timestamp of the chat. */
  created_at: string;
  /** @property {string} updated_at - The last update timestamp of the chat. */
  updated_at: string;
}

// AI search result interface
/**
 * @interface AISearchResult
 * @description Interface for an AI search result.
 */
export interface AISearchResult {
  /** @property {Partial<Reference>} reference - The reference found by the AI. */
  reference: Partial<Reference>;
  /** @property {number} confidence - The confidence score of the result. */
  confidence: number;
  /** @property {number} relevance_score - The relevance score of the result. */
  relevance_score: number;
  /** @property {string} source - The source of the result. */
  source: string;
  /** @property {string} search_query - The search query that produced the result. */
  search_query: string;
  /** @property {string} timestamp - The timestamp of the search. */
  timestamp: string;
}

// AI processing context
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
  /** @property {ModificationType} [modificationType] - The type of modification. */
  modificationType?: ModificationType;
  /** @property {CitationStyle} [citationStyle] - The citation style. */
  citationStyle?: CitationStyle;
}

// AI performance metrics
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

// Validation result interface
/**
 * @interface ValidationResult
 * @description Interface for a validation result.
 */
export interface ValidationResult {
  /** @property {boolean} isValid - Whether the validation was successful. */
  isValid: boolean;
  /** @property {(string | ValidationError)[]} errors - The validation errors. */
  errors: (string | ValidationError)[];
  /** @property {(string | ValidationError)[]} warnings - The validation warnings. */
  warnings: (string | ValidationError)[];
  /** @property {string[]} [missingFields] - The missing fields. */
  missingFields?: string[];
}

// Export configuration
/**
 * @interface ExportConfig
 * @description Interface for export configuration.
 */
export interface ExportConfig {
  /** @property {'bibtex' | 'ris' | 'json' | 'csv'} format - The export format. */
  format: 'bibtex' | 'ris' | 'json' | 'csv';
  /** @property {CitationStyle} citationStyle - The citation style. */
  citationStyle: CitationStyle;
  /** @property {boolean} includeNotes - Whether to include notes. */
  includeNotes: boolean;
  /** @property {boolean} includeTags - Whether to include tags. */
  includeTags: boolean;
}

// Filter options for reference lists
/**
 * @interface ReferenceFilters
 * @description Interface for reference list filters.
 */
export interface ReferenceFilters {
  /** @property {ReferenceType} [type] - The type of the reference. */
  type?: ReferenceType;
  /** @property {CitationStyle} [citationStyle] - The citation style. */
  citationStyle?: CitationStyle;
  /** @property {string} [searchQuery] - The search query. */
  searchQuery?: string;
  /** @property {{start: string, end: string}} [dateRange] - The date range. */
  dateRange?: {
    start: string;
    end: string;
  };
  /** @property {string[]} [tags] - The tags to filter by. */
  tags?: string[];
  /** @property {{min: number, max: number}} [confidenceRange] - The confidence range. */
  confidenceRange?: {
    min: number;
    max: number;
  };
}

// Sort options for reference lists
/**
 * @interface ReferenceSort
 * @description Interface for reference list sorting.
 */
export interface ReferenceSort {
  /** @property {keyof Reference} field - The field to sort by. */
  field: keyof Reference;
  /** @property {'asc' | 'desc'} direction - The sort direction. */
  direction: 'asc' | 'desc';
}

// Pagination options
/**
 * @interface PaginationOptions
 * @description Interface for pagination options.
 */
export interface PaginationOptions {
  /** @property {number} page - The current page. */
  page: number;
  /** @property {number} limit - The number of items per page. */
  limit: number;
  /** @property {number} total - The total number of items. */
  total: number;
}

// Missing types that are being imported by other components
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

// Text selection interface
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

// Content insertion options
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

// Proofreading concern types
/**
 * @enum {string}
 * @description Enum for proofreading concern statuses.
 */
export enum ConcernStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
  ADDRESSED = 'addressed',
  REJECTED = 'rejected',
  TO_BE_DONE = 'to_be_done'
}

/**
 * @enum {string}
 * @description Enum for proofreading concern severities.
 */
export enum ConcernSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * @enum {string}
 * @description Enum for proofreading concern categories.
 */
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

/**
 * @interface ProofreadingConcern
 * @description Interface for a proofreading concern.
 */
export interface ProofreadingConcern {
  /** @property {string} id - The unique ID of the concern. */
  id: string;
  /** @property {string} text - The text of the concern. */
  text: string;
  /** @property {ConcernCategory} category - The category of the concern. */
  category: ConcernCategory;
  /** @property {ConcernSeverity} severity - The severity of the concern. */
  severity: ConcernSeverity;
  /** @property {ConcernStatus} status - The status of the concern. */
  status: ConcernStatus;
  /** @property {string[]} suggestions - The suggestions for the concern. */
  suggestions: string[];
  /** @property {string[]} relatedIdeas - The related ideas for the concern. */
  relatedIdeas: string[];
  /** @property {{start: number, end: number}} position - The position of the concern in the document. */
  position: {
    start: number;
    end: number;
  };
  /** @property {string} explanation - The explanation of the concern. */
  explanation: string;
  /** @property {string} created_at - The creation timestamp of the concern. */
  created_at: string;
  /** @property {string} updated_at - The last update timestamp of the concern. */
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
  conversationId?: string;
}

// AI search and reference types
/**
 * @interface ScholarSearchResult
 * @description Interface for a scholar search result.
 */
export interface ScholarSearchResult {
  /** @property {string} title - The title of the search result. */
  title: string;
  /** @property {string[]} authors - The authors of the search result. */
  authors: string[];
  /** @property {string} [journal] - The journal of the search result. */
  journal?: string;
  /** @property {number} [year] - The year of the search result. */
  year?: number;
  /** @property {number} [citations] - The number of citations for the search result. */
  citations?: number;
  /** @property {string} [publication_date] - The publication date of the search result. */
  publication_date?: string;
  /** @property {string} [doi] - The DOI of the search result. */
  doi?: string;
  /** @property {string} [url] - The URL of the search result. */
  url?: string;
  /** @property {string} [abstract] - The abstract of the search result. */
  abstract?: string;
  /** @property {string[]} [keywords] - The keywords of the search result. */
  keywords?: string[];
  /** @property {number} confidence - The confidence score of the search result. */
  confidence: number;
  /** @property {number} relevance_score - The relevance score of the search result. */
  relevance_score: number;
  /** @property {number} [citation_count] - The citation count of the search result. */
  citation_count?: number;
}

/**
 * @interface ReferenceMetadata
 * @description Interface for reference metadata.
 */
export interface ReferenceMetadata {
  /** @property {string} title - The title of the reference. */
  title: string;
  /** @property {(string | Author)[]} authors - The authors of the reference. */
  authors: (string | Author)[];
  /** @property {string} [journal] - The journal of the reference. */
  journal?: string;
  /** @property {string} [volume] - The volume of the reference. */
  volume?: string;
  /** @property {string} [issue] - The issue of the reference. */
  issue?: string;
  /** @property {string} [pages] - The pages of the reference. */
  pages?: string;
  /** @property {string} [publication_date] - The publication date of the reference. */
  publication_date?: string;
  /** @property {Date} [publicationDate] - The publication date of the reference. */
  publicationDate?: Date;
  /** @property {string} [doi] - The DOI of the reference. */
  doi?: string;
  /** @property {string} [isbn] - The ISBN of the reference. */
  isbn?: string;
  /** @property {string} [url] - The URL of the reference. */
  url?: string;
  /** @property {string} [abstract] - The abstract of the reference. */
  abstract?: string;
  /** @property {string[]} keywords - The keywords of the reference. */
  keywords: string[];
  /** @property {number} [citations] - The number of citations for the reference. */
  citations?: number;
  /** @property {number} confidence - The confidence score of the metadata. */
  confidence: number;
  /** @property {string} [publisher] - The publisher of the reference. */
  publisher?: string;
  /** @property {ReferenceType} [type] - The type of the reference. */
  type?: ReferenceType;
}

/**
 * @interface ReferenceSuggestion
 * @description Interface for a reference suggestion.
 */
export interface ReferenceSuggestion {
  /** @property {ReferenceMetadata} reference - The suggested reference. */
  reference: ReferenceMetadata;
  /** @property {string} reasoning - The reasoning for the suggestion. */
  reasoning: string;
  /** @property {number} relevance_score - The relevance score of the suggestion. */
  relevance_score: number;
  /** @property {number} [relevanceScore] - The relevance score of the suggestion. */
  relevanceScore?: number;
  /** @property {number} confidence - The confidence score of the suggestion. */
  confidence: number;
  /** @property {boolean} [isDuplicate] - Whether the suggestion is a duplicate. */
  isDuplicate?: boolean;
}

/**
 * @interface SuggestionRanking
 * @description Interface for suggestion ranking.
 */
export interface SuggestionRanking {
  /** @property {number} relevance - The relevance score. */
  relevance: number;
  /** @property {number} recency - The recency score. */
  recency: number;
  /** @property {number} citations - The citations score. */
  citations: number;
  /** @property {number} authorAuthority - The author authority score. */
  authorAuthority: number;
  /** @property {number} overall - The overall score. */
  overall: number;
}

// Bibliography types
/**
 * @interface BibliographyRequest
 * @description Interface for a bibliography request.
 */
export interface BibliographyRequest {
  /** @property {string} conversationId - The ID of the conversation. */
  conversationId: string;
  /** @property {CitationStyle} style - The citation style. */
  style: CitationStyle;
  /** @property {'text' | 'html' | 'markdown' | 'bibtex' | 'ris'} format - The format of the bibliography. */
  format: 'text' | 'html' | 'markdown' | 'bibtex' | 'ris';
  /** @property {'alphabetical' | 'chronological' | 'appearance'} [sortOrder] - The sort order of the bibliography. */
  sortOrder?: 'alphabetical' | 'chronological' | 'appearance';
  /** @property {boolean} [includeUrls] - Whether to include URLs in the bibliography. */
  includeUrls?: boolean;
}

/**
 * @interface BibliographyResponse
 * @description Interface for a bibliography response.
 */
export interface BibliographyResponse {
  /** @property {boolean} success - Whether the request was successful. */
  success: boolean;
  /** @property {string} [bibliography] - The bibliography. */
  bibliography?: string;
  /** @property {string} [format] - The format of the bibliography. */
  format?: string;
  /** @property {number} [citation_count] - The number of citations in the bibliography. */
  citation_count?: number;
  /** @property {number} [referenceCount] - The number of references in the bibliography. */
  referenceCount?: number;
  /** @property {CitationStyle} [style] - The citation style of the bibliography. */
  style?: CitationStyle;
  /** @property {string} [error] - The error message, if any. */
  error?: string;
}

// Search history types
/**
 * @interface SearchHistoryItem
 * @description Interface for a search history item.
 */
export interface SearchHistoryItem {
  /** @property {string} id - The unique ID of the search history item. */
  id: string;
  /** @property {string} query - The search query. */
  query: string;
  /** @property {string | Date} timestamp - The timestamp of the search. */
  timestamp: string | Date;
  /** @property {number} results_count - The number of results. */
  results_count: number;
  /** @property {{total: number, accepted: number, rejected: number}} [results] - The results statistics. */
  results?: {
    total: number;
    accepted: number;
    rejected: number;
  };
  /** @property {string[]} sources - The sources searched. */
  sources: string[];
  /** @property {Record<string, unknown>} [filters] - The filters used for the search. */
  filters?: Record<string, unknown>;
  /** @property {string} [user_id] - The ID of the user who performed the search. */
  user_id?: string;
  /** @property {string} [userId] - The ID of the user who performed the search. */
  userId?: string;
}

/**
 * @interface SearchAnalytics
 * @description Interface for search analytics.
 */
export interface SearchAnalytics {
  /** @property {number} total_searches - The total number of searches. */
  total_searches: number;
  /** @property {number} [totalSearches] - The total number of searches. */
  totalSearches?: number;
  /** @property {number} average_results - The average number of results per search. */
  average_results: number;
  /** @property {number} [averageResults] - The average number of results per search. */
  averageResults?: number;
  /** @property {string[]} popular_sources - The popular sources. */
  popular_sources: string[];
  /** @property {string[]} [popularTopics] - The popular topics. */
  popularTopics?: string[];
  /** @property {string[]} [topSources] - The top sources. */
  topSources?: string[];
  /** @property {Record<string, number>} search_frequency - The search frequency. */
  search_frequency: Record<string, number>;
  /** @property {number} [successRate] - The success rate of the searches. */
  successRate?: number;
  /** @property {{start: string, end: string}} period - The period for the analytics. */
  period: {
    start: string;
    end: string;
  };
}

// Content extraction types
/**
 * @interface ExtractedContent
 * @description Interface for extracted content.
 */
export interface ExtractedContent {
  /** @property {'ideas' | 'builder'} [source] - The source of the content. */
  source?: 'ideas' | 'builder';
  /** @property {string} [title] - The title of the content. */
  title?: string;
  /** @property {string[]} [authors] - The authors of the content. */
  authors?: string[];
  /** @property {string} [abstract] - The abstract of the content. */
  abstract?: string;
  /** @property {string[]} [keywords] - The keywords of the content. */
  keywords?: string[];
  /** @property {string[]} [keyPhrases] - The key phrases of the content. */
  keyPhrases?: string[];
  /** @property {string[]} [topics] - The topics of the content. */
  topics?: string[];
  /** @property {string} [content] - The content. */
  content?: string;
  /** @property {string} [publication_date] - The publication date of the content. */
  publication_date?: string;
  /** @property {string} [doi] - The DOI of the content. */
  doi?: string;
  /** @property {string} [journal] - The journal of the content. */
  journal?: string;
  /** @property {string} [volume] - The volume of the content. */
  volume?: string;
  /** @property {string} [issue] - The issue of the content. */
  issue?: string;
  /** @property {string} [pages] - The pages of the content. */
  pages?: string;
  /** @property {number} confidence - The confidence score of the extraction. */
  confidence: number;
  /** @property {string | number} [id] - The ID of the content. */
  id?: string | number;
}

// Author interface
/**
 * @interface Author
 * @description Interface for an author.
 */
export interface Author {
  /** @property {string} firstName - The first name of the author. */
  firstName: string;
  /** @property {string} lastName - The last name of the author. */
  lastName: string;
  /** @property {string} [middleName] - The middle name of the author. */
  middleName?: string;
  /** @property {string} [suffix] - The suffix of the author's name. */
  suffix?: string;
  /** @property {string} [affiliation] - The affiliation of the author. */
  affiliation?: string;
}

// Reference search options
/**
 * @interface ReferenceSearchOptions
 * @description Interface for reference search options.
 */
export interface ReferenceSearchOptions {
  /** @property {string} [query] - The search query. */
  query?: string;
  /** @property {ReferenceType | 'all'} [type] - The type of reference to search for. */
  type?: ReferenceType | 'all';
  /** @property {string} [author] - The author to search for. */
  author?: string;
  /** @property {number} [year] - The year to search for. */
  year?: number;
  /** @property {string[]} [tags] - The tags to search for. */
  tags?: string[];
  /** @property {'title' | 'author' | 'date' | 'created'} [sortBy] - The field to sort by. */
  sortBy?: 'title' | 'author' | 'date' | 'created';
  /** @property {'asc' | 'desc'} [sortOrder] - The sort order. */
  sortOrder?: 'asc' | 'desc';
  /** @property {number} [limit] - The maximum number of results to return. */
  limit?: number;
  /** @property {number} [offset] - The offset to start from. */
  offset?: number;
}

// Metadata extraction request
/**
 * @interface MetadataExtractionRequest
 * @description Interface for a metadata extraction request.
 */
export interface MetadataExtractionRequest {
  /** @property {string} source - The source to extract metadata from. */
  source: string;
  /** @property {'url' | 'doi'} type - The type of the source. */
  type: 'url' | 'doi';
  /** @property {string} conversationId - The ID of the conversation. */
  conversationId: string;
}

// Citation request
/**
 * @interface CitationRequest
 * @description Interface for a citation request.
 */
export interface CitationRequest {
  /** @property {string} referenceId - The ID of the reference to cite. */
  referenceId: string;
  /** @property {CitationStyle} style - The citation style. */
  style: CitationStyle;
  /** @property {'inline' | 'bibliography'} type - The type of citation. */
  type: 'inline' | 'bibliography';
  /** @property {string} [context] - The context of the citation. */
  context?: string;
}

// Missing type definitions needed by other components

// Idea definition interface
/**
 * @interface IdeaDefinition
 * @description Interface for an idea definition.
 */
export interface IdeaDefinition {
  /** @property {string | number} id - The unique ID of the idea. */
  id: string | number;
  /** @property {string} title - The title of the idea. */
  title: string;
  /** @property {string} content - The content of the idea. */
  content: string;
  /** @property {string} description - The description of the idea. */
  description: string;
  /** @property {'concept' | 'hypothesis' | 'method' | 'result' | 'conclusion'} type - The type of the idea. */
  type: 'concept' | 'hypothesis' | 'method' | 'result' | 'conclusion';
  /** @property {string[]} tags - The tags for the idea. */
  tags: string[];
  /** @property {number} confidence - The confidence score of the idea. */
  confidence: number;
  /** @property {string} created_at - The creation timestamp of the idea. */
  created_at: string;
  /** @property {string} updated_at - The last update timestamp of the idea. */
  updated_at: string;
  /** @property {string} [conversationid] - The ID of the conversation the idea belongs to. */
  conversationid?: string;
}

// Document context interface
/**
 * @interface DocumentContext
 * @description Interface for the document context.
 */
export interface DocumentContext {
  /** @property {string} conversationId - The ID of the conversation. */
  conversationId: string;
  /** @property {string} documentContent - The content of the document. */
  documentContent: string;
  /** @property {number} cursorPosition - The position of the cursor in the document. */
  cursorPosition: number;
  /** @property {string} [selectedText] - The selected text. */
  selectedText?: string;
  /** @property {number} wordCount - The word count of the document. */
  wordCount: number;
  /** @property {number} paragraphCount - The paragraph count of the document. */
  paragraphCount: number;
  /** @property {string} [section] - The current section of the document. */
  section?: string;
  /** @property {{discipline?: string, level?: 'undergraduate' | 'graduate' | 'phd', field?: string, style?: string}} [academicContext] - The academic context of the document. */
  academicContext?: {
    discipline?: string;
    level?: 'undergraduate' | 'graduate' | 'phd';
    field?: string;
    style?: string;
  };
}

// AI processing state (different from status)
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
  /** @property {AIMode} [currentMode] - The current AI mode. */
  currentMode?: AIMode;
  /** @property {string} [statusMessage] - The status message. */
  statusMessage?: string;
}

// Proofreader analysis types
/**
 * @interface ProofreaderAnalysisRequest
 * @description Interface for a proofreader analysis request.
 */
export interface ProofreaderAnalysisRequest {
  /** @property {string} conversationId - The ID of the conversation. */
  conversationId: string;
  /** @property {string} documentContent - The content of the document. */
  documentContent: string;
  /** @property {ProofreadingConcern[]} [concerns] - The existing proofreading concerns. */
  concerns?: ProofreadingConcern[];
  /** @property {IdeaDefinition[]} [ideaDefinitions] - The existing idea definitions. */
  ideaDefinitions?: IdeaDefinition[];
  /** @property {boolean} [includeSuggestions] - Whether to include suggestions in the analysis. */
  includeSuggestions?: boolean;
  /** @property {'basic' | 'comprehensive' | 'detailed'} [analysisDepth] - The depth of the analysis. */
  analysisDepth?: 'basic' | 'comprehensive' | 'detailed';
  /** @property {ConcernCategory[]} [focusAreas] - The focus areas for the analysis. */
  focusAreas?: ConcernCategory[];
  /** @property {{timeout?: number, maxRetries?: number, model?: string, categories?: ConcernCategory[], minSeverity?: ConcernSeverity, includeGrammar?: boolean, academicLevel?: string}} [analysisOptions] - The options for the analysis. */
  analysisOptions?: {
    timeout?: number;
    maxRetries?: number;
    model?: string;
    categories?: ConcernCategory[];
    minSeverity?: ConcernSeverity;
    includeGrammar?: boolean;
    academicLevel?: string;
  };
}

/**
 * @interface ProofreaderAnalysisResponse
 * @description Interface for a proofreader analysis response.
 */
export interface ProofreaderAnalysisResponse {
  /** @property {boolean} success - Whether the analysis was successful. */
  success: boolean;
  /** @property {ProofreadingConcern[]} concerns - The proofreading concerns found. */
  concerns: ProofreadingConcern[];
  /** @property {{totalConcerns: number, concernsByCategory: Record<ConcernCategory, number>, concernsBySeverity: Record<ConcernSeverity, number>, overallQualityScore: number, readabilityScore?: number, academicToneScore?: number}} analysis - The analysis results. */
  analysis: {
    totalConcerns: number;
    concernsByCategory: Record<ConcernCategory, number>;
    concernsBySeverity: Record<ConcernSeverity, number>;
    overallQualityScore: number;
    readabilityScore?: number;
    academicToneScore?: number;
  };
  /** @property {AnalysisMetadata} metadata - The metadata for the analysis. */
  metadata: AnalysisMetadata;
  /** @property {{totalConcerns?: number, concernsByCategory?: Record<ConcernCategory, number>, concernsBySeverity?: Record<ConcernSeverity, number>, analysisTime?: number, contentLength?: number, ideaDefinitionsUsed?: number, fallbackUsed?: boolean, cacheUsed?: boolean, cacheTimestamp?: number, offlineMode?: boolean}} [analysisMetadata] - The metadata for the analysis. */
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
    offlineMode?: boolean;
  };
  /** @property {string} [error] - The error message, if any. */
  error?: string;
}

// Analysis metadata
/**
 * @interface AnalysisMetadata
 * @description Interface for analysis metadata.
 */
export interface AnalysisMetadata {
  /** @property {number} processingTime - The processing time in milliseconds. */
  processingTime: number;
  /** @property {string} modelUsed - The AI model used for the analysis. */
  modelUsed: string;
  /** @property {string} analysisTimestamp - The timestamp of the analysis. */
  analysisTimestamp: string;
  /** @property {string} version - The version of the analysis engine. */
  version: string;
  /** @property {number} confidence - The confidence score of the analysis. */
  confidence: number;
  /** @property {number} [totalConcerns] - The total number of concerns. */
  totalConcerns?: number;
  /** @property {Record<ConcernCategory, number>} [concernsByCategory] - The concerns by category. */
  concernsByCategory?: Record<ConcernCategory, number>;
  /** @property {Record<ConcernSeverity, number>} [concernsBySeverity] - The concerns by severity. */
  concernsBySeverity?: Record<ConcernSeverity, number>;
  /** @property {number} [analysisTime] - The analysis time in milliseconds. */
  analysisTime?: number;
  /** @property {number} [contentLength] - The length of the content analyzed. */
  contentLength?: number;
  /** @property {number} [ideaDefinitionsUsed] - The number of idea definitions used in the analysis. */
  ideaDefinitionsUsed?: number;
  /** @property {boolean} [fallbackUsed] - Whether a fallback was used for the analysis. */
  fallbackUsed?: boolean;
  /** @property {boolean} [cacheUsed] - Whether the cache was used for the analysis. */
  cacheUsed?: boolean;
  /** @property {number} [cacheTimestamp] - The timestamp of the cached analysis. */
  cacheTimestamp?: number;
}

// Utility functions for safe type conversions
/**
 * @function safeDate
 * @description Safely converts a value to a Date object.
 * @param {string | Date | undefined | null} dateValue - The value to convert.
 * @returns {Date | null} The converted Date object or null.
 */
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

/**
 * @function safeString
 * @description Safely converts a value to a string.
 * @param {unknown} value - The value to convert.
 * @returns {string} The converted string.
 */
export const safeString = (value: unknown): string => {
  return value?.toString() ?? '';
};

/**
 * @function safeNumber
 * @description Safely converts a value to a number.
 * @param {unknown} value - The value to convert.
 * @returns {number} The converted number.
 */
export const safeNumber = (value: unknown): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Author type conversion utilities
/**
 * @function normalizeAuthor
 * @description Normalizes an author from a string to an Author object.
 * @param {string | Author} author - The author to normalize.
 * @returns {Author} The normalized author.
 */
export const normalizeAuthor = (author: string | Author): Author => {
  if (typeof author === 'string') {
    const parts = author.trim().split(/\s+/);
    if (parts.length === 1) {
      return {
        firstName: '',
        lastName: parts[0]
      };
    } else if (parts.length === 2) {
      return {
        firstName: parts[0],
        lastName: parts[1]
      };
    } else {
      return {
        firstName: parts[0],
        lastName: parts[parts.length - 1],
        middleName: parts.slice(1, -1).join(' ')
      };
    }
  }
  return author;
};

/**
 * @function normalizeAuthors
 * @description Normalizes an array of authors.
 * @param {(string | Author)[]} authors - The authors to normalize.
 * @returns {Author[]} The normalized authors.
 */
export const normalizeAuthors = (authors: (string | Author)[]): Author[] => {
  return authors.map(normalizeAuthor);
};

/**
 * @function authorToString
 * @description Converts an author to a string.
 * @param {string | Author} author - The author to convert.
 * @returns {string} The string representation of the author.
 */
export const authorToString = (author: string | Author): string => {
  if (typeof author === 'string') {
    return author;
  }
  const parts = [author.firstName, author.middleName, author.lastName].filter(Boolean);
  return parts.join(' ');
};

/**
 * @function authorsToStrings
 * @description Converts an array of authors to an array of strings.
 * @param {(string | Author)[]} authors - The authors to convert.
 * @returns {string[]} The string representations of the authors.
 */
export const authorsToStrings = (authors: (string | Author)[]): string[] => {
  return authors.map(authorToString);
};

// Date conversion utilities
/**
 * @function dateToISOString
 * @description Converts a date to an ISO string.
 * @param {string | Date | undefined | null} date - The date to convert.
 * @returns {string} The ISO string representation of the date.
 */
export const dateToISOString = (date: string | Date | undefined | null): string => {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  return date.toISOString();
};

/**
 * @function stringToDate
 * @description Converts a string to a Date object.
 * @param {string | undefined | null} dateString - The string to convert.
 * @returns {Date} The converted Date object.
 */
export const stringToDate = (dateString: string | undefined | null): Date => {
  if (!dateString) return new Date();
  return new Date(dateString);
};

// Safe array filtering
/**
 * @function filterUndefined
 * @description Filters undefined values from an array.
 * @template T
 * @param {(T | undefined)[]} array - The array to filter.
 * @returns {T[]} The filtered array.
 */
export const filterUndefined = <T>(array: (T | undefined)[]): T[] => {
  return array.filter((item): item is T => item !== undefined);
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

// Missing types for concern analysis engine
export interface ContentLocation {
  section?: string;
  paragraph?: number;
  sentence?: number;
  start: number;
  end: number;
  context?: string;
}

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
  location?: ContentLocation;
  description: string;
  suggestion: string;
  severity?: ConcernSeverity;
}

export interface TerminologyIssue {
  term: string;
  inconsistentUsage: (ContentLocation | string)[];
  suggestedStandardization: string;
  severity: ConcernSeverity;
  locations?: any[];
}

export interface CitationIssue {
  type: 'format' | 'missing' | 'incomplete' | 'style' | 'style_inconsistency';
  location?: ContentLocation;
  description: string;
  suggestion: string;
  severity?: ConcernSeverity;
}

export interface FormattingIssue {
  type: 'spacing' | 'punctuation' | 'capitalization' | 'numbering';
  location?: ContentLocation;
  description: string;
  suggestion: string;
  severity?: ConcernSeverity;
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
  location: ContentLocation;
  structureIssues: string[];
  suggestions: string[];
  properHierarchy?: boolean;
  consistentFormatting?: boolean;
}

// Missing types for reference management
export interface ReferenceFormData {
  type: ReferenceType;
  title: string;
  authors: (string | Author)[];
  publication_date?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  doi?: string;
  url?: string;
  isbn?: string;
  edition?: string;
  chapter?: string;
  editor?: string;
  access_date?: string;
  notes?: string;
  tags: string[];
  // Legacy properties for backward compatibility
  publicationDate?: string;
  accessDate?: string;
}

export interface ReferenceListResponse {
  success: boolean;
  references?: Reference[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
  statistics?: ReferenceStatistics;
}

export interface ReferenceStatistics {
  totalReferences: number;
  referencesByType: Record<ReferenceType, number>;
  recentlyAdded: number;
  averageConfidence: number;
  topTags: string[];
  total?: number;
  byType?: Record<ReferenceType, number>;
  byYear?: Record<number, number>;
  withDoi?: number;
  withUrl?: number;
}

export interface MetadataExtractionResponse {
  success: boolean;
  metadata?: ReferenceMetadata;
  confidence?: number;
  source: string;
  error?: string;
  extractionTime?: number;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  severity?: string;
}

export interface CitationResponse {
  success: boolean;
  citation?: string;
  style: CitationStyle;
  type: 'inline' | 'bibliography';
  error?: string;
}

export interface ContentExtractionRequest {
  source: 'ideas' | 'builder';
  conversationId: string;
  includeMetadata?: boolean;
  extractionDepth?: 'basic' | 'detailed';
  id?: string;
}

// Search filters interface
export interface SearchFilters {
  dateRange?: {
    start: number;
    end: number;
  };
  authors?: string[];
  journals?: string[];
  minCitations?: number;
  maxResults?: number;
  sortBy?: 'relevance' | 'date' | 'citations' | 'quality';
}

// Missing types for concern status management
export interface ConcernStatusUpdate {
  concernId: string;
  status: ConcernStatus;
  notes?: string;
  timestamp: string;
}

export interface ConcernStatistics {
  totalConcerns: number;
  concernsByStatus: Record<ConcernStatus, number>;
  concernsByCategory: Record<ConcernCategory, number>;
  concernsBySeverity: Record<ConcernSeverity, number>;
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
  status: ConcernStatus;
  count: number;
  percentage: number;
  total?: number;
  toBeDone?: number;
  addressed?: number;
  rejected?: number;
}

// Analysis options type
export interface AnalysisOptions {
  timeout?: number;
  maxRetries?: number;
  model?: string;
  categories?: ConcernCategory[];
  minSeverity?: ConcernSeverity;
  includeGrammar?: boolean;
  academicLevel?: string;
}

// Citation Format
export interface CitationFormat {
  style: 'APA' | 'MLA' | 'Chicago' | 'Harvard' | 'IEEE' | 'Vancouver' | 'Unknown';
  detected: boolean;
  examples: string[];
}

// Academic Context
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

// Thesis Structure
export interface ThesisStructure {
  sections: ThesisSection[];
  currentSection?: string;
  completeness: number;
}

// Thesis Section
export interface ThesisSection {
  name: string;
  level: number;
  required: boolean;
  present: boolean;
  content?: string;
}

// Academic Validation Result
export interface AcademicValidationResult {
  isAcademic: boolean;
  toneScore: number;
  styleIssues: string[];
  suggestions: string[];
  citationFormat: CitationFormat;
}
