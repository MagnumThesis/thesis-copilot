/**
 * Search Analytics and History
 * Contains types related to search analytics, history tracking, and statistics
 */

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

/**
 * @interface ReferenceStatistics
 * @description Interface for reference statistics.
 */
export interface ReferenceStatistics {
  /** @property {number} totalReferences - The total number of references. */
  totalReferences: number;
  /** @property {Record<import('../citation-types/reference-types').ReferenceType, number>} referencesByType - References by type. */
  referencesByType: Record<import('../citation-types/reference-types').ReferenceType, number>;
  /** @property {number} recentlyAdded - The number of recently added references. */
  recentlyAdded: number;
  /** @property {number} averageConfidence - The average confidence score. */
  averageConfidence: number;
  /** @property {string[]} topTags - The most popular tags. */
  topTags: string[];
  /** @property {number} [total] - The total number of references. */
  total?: number;
  /** @property {Record<import('../citation-types/reference-types').ReferenceType, number>} [byType] - References by type. */
  byType?: Record<import('../citation-types/reference-types').ReferenceType, number>;
  /** @property {Record<number, number>} [byYear] - References by year. */
  byYear?: Record<number, number>;
  /** @property {number} [withDoi] - References with DOI. */
  withDoi?: number;
  /** @property {number} [withUrl] - References with URL. */
  withUrl?: number;
}

/**
 * @interface ReferenceListResponse
 * @description Interface for a reference list response.
 */
export interface ReferenceListResponse {
  /** @property {boolean} success - Whether the request was successful. */
  success: boolean;
  /** @property {import('../citation-types/reference-types').Reference[]} [references] - The list of references. */
  references?: import('../citation-types/reference-types').Reference[];
  /** @property {number} [total] - The total number of references. */
  total?: number;
  /** @property {number} [page] - The current page number. */
  page?: number;
  /** @property {number} [limit] - The number of items per page. */
  limit?: number;
  /** @property {string} [error] - The error message, if any. */
  error?: string;
  /** @property {ReferenceStatistics} [statistics] - Reference statistics. */
  statistics?: ReferenceStatistics;
}

/**
 * @interface BibliographyRequest
 * @description Interface for a bibliography request.
 */
export interface BibliographyRequest {
  /** @property {string} conversationId - The ID of the conversation. */
  conversationId: string;
  /** @property {import('../citation-types/citation-styles').CitationStyle} style - The citation style. */
  style: import('../citation-types/citation-styles').CitationStyle;
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
  /** @property {import('../citation-types/citation-styles').CitationStyle} [style] - The citation style of the bibliography. */
  style?: import('../citation-types/citation-styles').CitationStyle;
  /** @property {string} [error] - The error message, if any. */
  error?: string;
}

/**
 * @interface SearchResultFeedback
 * @description Interface for user feedback on search results.
 */
export interface SearchResultFeedback {
  /** @property {string} resultId - The ID of the search result. */
  resultId: string;
  /** @property {'positive' | 'negative'} type - The type of feedback. */
  type: 'positive' | 'negative';
  /** @property {number} [relevanceScore] - The relevance score given by the user. */
  relevanceScore?: number;
  /** @property {string} [comment] - Optional comment from the user. */
  comment?: string;
  /** @property {string} [comments] - Optional comments from the user (alternative naming). */
  comments?: string;
  /** @property {Date} timestamp - When the feedback was given. */
  timestamp: Date;
  /** @property {string} [reason] - The reason for the feedback. */
  reason?: string;
  /** @property {boolean} [isRelevant] - Whether the result is relevant. */
  isRelevant?: boolean;
  /** @property {number} [qualityRating] - Quality rating for the result. */
  qualityRating?: number;
}

/**
 * @interface SearchSessionFeedback
 * @description Interface for feedback on an entire search session.
 */
export interface SearchSessionFeedback {
  /** @property {string} sessionId - The ID of the search session. */
  sessionId: string;
  /** @property {number} satisfactionScore - Overall satisfaction score (1-5). */
  satisfactionScore: number;
  /** @property {string} [feedback] - General feedback about the session. */
  feedback?: string;
  /** @property {Date} timestamp - When the feedback was given. */
  timestamp: Date;
  /** @property {boolean} foundWhatLookingFor - Whether the user found what they were looking for. */
  foundWhatLookingFor: boolean;
  /** @property {string[]} [suggestions] - Suggestions for improvement. */
  suggestions?: string[];
  /** @property {number} [overallSatisfaction] - Overall satisfaction rating. */
  overallSatisfaction?: number;
  /** @property {number} [relevanceRating] - Relevance rating of search results. */
  relevanceRating?: number;
  /** @property {number} [qualityRating] - Quality rating of search results. */
  qualityRating?: number;
  /** @property {number} [easeOfUseRating] - Ease of use rating. */
  easeOfUseRating?: number;
  /** @property {string} [feedbackComments] - Additional feedback comments. */
  feedbackComments?: string;
  /** @property {boolean} [wouldRecommend] - Whether the user would recommend the service. */
  wouldRecommend?: boolean;
  /** @property {string[]} [improvementSuggestions] - Suggestions for improvement. */
  improvementSuggestions?: string[];
}

/**
 * @interface SearchPerformanceMetrics
 * @description Interface for search performance metrics.
 */
export interface SearchPerformanceMetrics {
  /** @property {number} totalResults - The total number of results returned. */
  totalResults: number;
  /** @property {number} relevantResults - The number of relevant results. */
  relevantResults: number;
  /** @property {number} searchTime - The time taken to perform the search in milliseconds. */
  searchTime: number;
  /** @property {number} queryComplexity - The complexity of the search query. */
  queryComplexity: number;
  /** @property {string} searchProvider - The search provider used. */
  searchProvider: string;
  /** @property {number} [cacheHits] - The number of cache hits. */
  cacheHits?: number;
  /** @property {number} [cacheMisses] - The number of cache misses. */
  cacheMisses?: number;
}
