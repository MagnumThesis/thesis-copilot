/**
 * Common Utility Types
 * Contains common types and interfaces used across different domains
 */

/**
 * @interface ContentLocation
 * @description Interface for content location information.
 */
export interface ContentLocation {
  /** @property {string} [section] - The section name. */
  section?: string;
  /** @property {number} [paragraph] - The paragraph number. */
  paragraph?: number;
  /** @property {number} [sentence] - The sentence number. */
  sentence?: number;
  /** @property {number} start - The start position. */
  start: number;
  /** @property {number} end - The end position. */
  end: number;
  /** @property {string} [context] - The surrounding context. */
  context?: string;
}

/**
 * @enum {string}
 * @description Enum for concern severities.
 */
export enum ConcernSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * @enum {string}
 * @description Enum for concern statuses.
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
 * @description Enum for concern categories.
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

/**
 * @interface DocumentSection
 * @description Interface for a document section.
 */
export interface DocumentSection {
  /** @property {'heading' | 'paragraph' | 'list' | 'code'} type - The type of the section. */
  type: 'heading' | 'paragraph' | 'list' | 'code';
  /** @property {number} [level] - The level of the section (for headings). */
  level?: number;
  /** @property {string} content - The content of the section. */
  content: string;
  /** @property {ContentLocation} position - The position of the section in the document. */
  position: ContentLocation;
}

/**
 * Utility functions for safe type conversions
 */

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

/**
 * Date conversion utilities
 */

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

/**
 * Proofreading and Document Analysis Types
 */

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
  /** @property {ContentLocation} position - The position of the concern in the document. */
  position: ContentLocation;
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
  /** @property {IdeaDefinition[]} ideaDefinitions - The idea definitions. */
  ideaDefinitions: IdeaDefinition[];
  /** @property {string} conversationTitle - The title of the conversation. */
  conversationTitle: string;
  /** @property {DocumentSection[]} documentStructure - The document structure. */
  documentStructure: DocumentSection[];
  /** @property {AcademicContext} [academicContext] - The academic context of the document. */
  academicContext?: AcademicContext;
  /** @property {string} content - The content of the document. */
  content: string;
  /** @property {Array<{role: string; content: string; files?: Array<{name: string; type: string; content?: string}>}>} [conversationMessages] - Recent conversation messages for context. */
  conversationMessages?: Array<{ role: string; content: string; files?: Array<{ name: string; type: string; content?: string }> }>;
}

/**
 * @interface AcademicContext
 * @description Interface for academic context.
 */
export interface AcademicContext {
  /** @property {ThesisStructure} thesisStructure - The thesis structure. */
  thesisStructure: ThesisStructure;
  /** @property {import('../citation-types/citation-styles').CitationFormat} citationFormat - The citation format. */
  citationFormat: import('../citation-types/citation-styles').CitationFormat;
  /** @property {object} academicTone - The academic tone details. */
  academicTone: {
    /** @property {'undergraduate' | 'graduate' | 'doctoral'} level - The academic level. */
    level: 'undergraduate' | 'graduate' | 'doctoral';
    /** @property {string} discipline - The academic discipline. */
    discipline: string;
    /** @property {number} formalityScore - The formality score. */
    formalityScore: number;
  };
  /** @property {string[]} keyTerms - The key terms. */
  keyTerms: string[];
  /** @property {string} [researchMethodology] - The research methodology. */
  researchMethodology?: string;
}

/**
 * @interface ThesisStructure
 * @description Interface for thesis structure.
 */
export interface ThesisStructure {
    /** @property {boolean} aiGenerated - Whether this concern was generated by an AI model */
    aiGenerated?: boolean;
  /** @property {ThesisSection[]} sections - The thesis sections. */
  sections: ThesisSection[];
  /** @property {string} [currentSection] - The current section. */
  currentSection?: string;
  /** @property {number} completeness - The completeness score. */
  completeness: number;
}

/**
 * @interface ThesisSection
 * @description Interface for a thesis section.
 */
export interface ThesisSection {
  /** @property {string} name - The name of the section. */
  name: string;
  /** @property {number} level - The level of the section. */
  level: number;
  /** @property {boolean} required - Whether the section is required. */
  required: boolean;
  /** @property {boolean} present - Whether the section is present. */
  present: boolean;
  /** @property {string} [content] - The content of the section. */
  content?: string;
}

/**
 * @interface DuplicateDetectionOptions
 * @description Interface for duplicate detection configuration.
 */
export interface DuplicateDetectionOptions {
  /** @property {number} titleSimilarityThreshold - Title similarity threshold (0.0 to 1.0). */
  titleSimilarityThreshold: number;
  /** @property {number} authorSimilarityThreshold - Author similarity threshold (0.0 to 1.0). */
  authorSimilarityThreshold: number;
  /** @property {boolean} enableFuzzyMatching - Whether to enable fuzzy matching. */
  enableFuzzyMatching: boolean;
  /** @property {boolean} strictDOIMatching - Whether to use strict DOI matching. */
  strictDOIMatching: boolean;
  /** @property {'keep_highest_quality' | 'keep_most_complete' | 'manual_review'} mergeStrategy - The strategy for merging duplicates. */
  mergeStrategy: 'keep_highest_quality' | 'keep_most_complete' | 'manual_review';
}
