/**
 * Search Results and Suggestions
 * Contains types related to search results, metadata, and suggestions
 */

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
 * @interface AISearchResult
 * @description Interface for an AI search result.
 */
export interface AISearchResult {
  /** @property {Partial<import('../citation-types/reference-types').Reference>} reference - The reference found by the AI. */
  reference: Partial<import('../citation-types/reference-types').Reference>;
  /** @property {number} confidence - The confidence score of the result. */
  confidence: number;
  /** @property {number} [relevance_score] - The relevance score of the result. */
  relevance_score?: number;
  /** @property {string} source - The source of the result. */
  source: string;
  /** @property {string} search_query - The search query that produced the result. */
  search_query: string;
  /** @property {string} timestamp - The timestamp of the search. */
  timestamp: string;
}

/**
 * @interface ReferenceSuggestion
 * @description Interface for a reference suggestion.
 */
export interface ReferenceSuggestion {
  /** @property {import('../citation-types/reference-types').ReferenceMetadata} reference - The suggested reference. */
  reference: import('../citation-types/reference-types').ReferenceMetadata;
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

/**
 * @interface MetadataExtractionResponse
 * @description Interface for a metadata extraction response.
 */
export interface MetadataExtractionResponse {
  /** @property {boolean} success - Whether the extraction was successful. */
  success: boolean;
  /** @property {import('../citation-types/reference-types').ReferenceMetadata} [metadata] - The extracted metadata. */
  metadata?: import('../citation-types/reference-types').ReferenceMetadata;
  /** @property {number} [confidence] - The confidence score of the extraction. */
  confidence?: number;
  /** @property {string} source - The source that was processed. */
  source: string;
  /** @property {string} [error] - The error message, if any. */
  error?: string;
  /** @property {number} [extractionTime] - The time taken for extraction. */
  extractionTime?: number;
}

/**
 * @interface ContentExtractionRequest
 * @description Interface for a content extraction request.
 */
export interface ContentExtractionRequest {
  /** @property {'ideas' | 'builder'} source - The source of the content. */
  source: 'ideas' | 'builder';
  /** @property {string} conversationId - The ID of the conversation. */
  conversationId: string;
  /** @property {boolean} [includeMetadata] - Whether to include metadata. */
  includeMetadata?: boolean;
  /** @property {'basic' | 'detailed'} [extractionDepth] - The depth of extraction. */
  extractionDepth?: 'basic' | 'detailed';
  /** @property {string} [id] - The ID of the content to extract. */
  id?: string;
}
