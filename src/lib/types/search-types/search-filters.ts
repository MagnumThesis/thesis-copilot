/**
 * Search Filters and Options
 * Contains types related to search filtering, sorting, and query options
 */

/**
 * @interface SearchFilters
 * @description Interface for search filters.
 */
export interface SearchFilters {
  /** @property {{start: number, end: number}} [dateRange] - The date range filter. */
  dateRange?: {
    start: number;
    end: number;
  };
  /** @property {string[]} [authors] - The authors to filter by. */
  authors?: string[];
  /** @property {string[]} [journals] - The journals to filter by. */
  journals?: string[];
  /** @property {number} [minCitations] - The minimum number of citations. */
  minCitations?: number;
  /** @property {number} [maxResults] - The maximum number of results. */
  maxResults?: number;
  /** @property {'relevance' | 'date' | 'citations' | 'quality'} [sortBy] - The field to sort by. */
  sortBy?: 'relevance' | 'date' | 'citations' | 'quality';
}

/**
 * @interface ReferenceFilters
 * @description Interface for reference list filters.
 */
export interface ReferenceFilters {
  /** @property {import('../citation-types/reference-types').ReferenceType} [type] - The type of the reference. */
  type?: import('../citation-types/reference-types').ReferenceType;
  /** @property {import('../citation-types/citation-styles').CitationStyle} [citationStyle] - The citation style. */
  citationStyle?: import('../citation-types/citation-styles').CitationStyle;
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

/**
 * @interface ReferenceSort
 * @description Interface for reference list sorting.
 */
export interface ReferenceSort {
  /** @property {keyof import('../citation-types/reference-types').Reference} field - The field to sort by. */
  field: keyof import('../citation-types/reference-types').Reference;
  /** @property {'asc' | 'desc'} direction - The sort direction. */
  direction: 'asc' | 'desc';
}

/**
 * @interface ReferenceSearchOptions
 * @description Interface for reference search options.
 */
export interface ReferenceSearchOptions {
  /** @property {string} [query] - The search query. */
  query?: string;
  /** @property {import('../citation-types/reference-types').ReferenceType | 'all'} [type] - The type of reference to search for. */
  type?: import('../citation-types/reference-types').ReferenceType | 'all';
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

/**
 * @interface ExportConfig
 * @description Interface for export configuration.
 */
export interface ExportConfig {
  /** @property {'bibtex' | 'ris' | 'json' | 'csv'} format - The export format. */
  format: 'bibtex' | 'ris' | 'json' | 'csv';
  /** @property {import('../citation-types/citation-styles').CitationStyle} citationStyle - The citation style. */
  citationStyle: import('../citation-types/citation-styles').CitationStyle;
  /** @property {boolean} includeNotes - Whether to include notes. */
  includeNotes: boolean;
  /** @property {boolean} includeTags - Whether to include tags. */
  includeTags: boolean;
}
