/**
 * Reference Types and Enums
 * Contains types related to academic references and their metadata
 */

import { ContentLocation, ConcernSeverity } from '../shared/common';

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
  /** @property {(string | import('./author-types').Author)[]} authors - The authors of the reference. */
  authors: (string | import('./author-types').Author)[];
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

/**
 * @interface ReferenceMetadata
 * @description Interface for reference metadata.
 */
export interface ReferenceMetadata {
  /** @property {string} title - The title of the reference. */
  title: string;
  /** @property {(string | import('./author-types').Author)[]} authors - The authors of the reference. */
  authors: (string | import('./author-types').Author)[];
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
  /** @property {import('./citation-styles').CitationStyle} citation_style - The citation style. */
  citation_style: import('./citation-styles').CitationStyle;
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

/**
 * @interface ReferenceFormData
 * @description Interface for reference form data.
 */
export interface ReferenceFormData {
  /** @property {ReferenceType} type - The type of the reference. */
  type: ReferenceType;
  /** @property {string} title - The title of the reference. */
  title: string;
  /** @property {(string | import('./author-types').Author)[]} authors - The authors of the reference. */
  authors: (string | import('./author-types').Author)[];
  /** @property {string} [publication_date] - The publication date of the reference. */
  publication_date?: string;
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
  /** @property {string} [doi] - The DOI of the reference. */
  doi?: string;
  /** @property {string} [url] - The URL of the reference. */
  url?: string;
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
  // Legacy properties for backward compatibility
  publicationDate?: string;
  accessDate?: string;
}
