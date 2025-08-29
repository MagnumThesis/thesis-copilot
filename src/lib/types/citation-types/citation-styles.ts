/**
 * Citation Styles and Formats
 * Contains enums and types related to citation styles and formatting
 */

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

/**
 * @interface CitationFormat
 * @description Interface for citation format details.
 */
export interface CitationFormat {
  /** @property {'APA' | 'MLA' | 'Chicago' | 'Harvard' | 'IEEE' | 'Vancouver' | 'Unknown'} style - The citation style. */
  style: 'APA' | 'MLA' | 'Chicago' | 'Harvard' | 'IEEE' | 'Vancouver' | 'Unknown';
  /** @property {boolean} detected - Whether the format was detected. */
  detected: boolean;
  /** @property {string[]} examples - Example citations in this format. */
  examples: string[];
}

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

/**
 * @interface CitationResponse
 * @description Interface for a citation response.
 */
export interface CitationResponse {
  /** @property {boolean} success - Whether the citation was generated successfully. */
  success: boolean;
  /** @property {string} [citation] - The generated citation text. */
  citation?: string;
  /** @property {CitationStyle} style - The citation style used. */
  style: CitationStyle;
  /** @property {'inline' | 'bibliography'} type - The type of citation. */
  type: 'inline' | 'bibliography';
  /** @property {string} [error] - The error message, if any. */
  error?: string;
}

/**
 * @interface CitationIssue
 * @description Interface for citation issues found during analysis.
 */
export interface CitationIssue {
  /** @property {'format' | 'missing' | 'incomplete' | 'style' | 'style_inconsistency'} type - The type of citation issue. */
  type: 'format' | 'missing' | 'incomplete' | 'style' | 'style_inconsistency';
  /** @property {import('../shared').ContentLocation} [location] - The location of the issue. */
  location?: import('../shared').ContentLocation;
  /** @property {string} description - The description of the issue. */
  description: string;
  /** @property {string} suggestion - The suggested fix for the issue. */
  suggestion: string;
  /** @property {import('../shared').ConcernSeverity} [severity] - The severity of the issue. */
  severity?: import('../shared').ConcernSeverity;
}
