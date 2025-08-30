/**
 * Tests for APA Citation Style Module
 */

import { describe, it, expect } from 'vitest';
import { APAStyle } from '../apa-style';
import { ReferenceType } from '../../../types/citation-types/reference-types';

describe('APAStyle', () => {
  const sampleJournalArticle = {
    id: 'ref1',
    conversation_id: 'conv1',
    title: 'Machine Learning in Academic Research',
    authors: [
      { firstName: 'John', lastName: 'Smith' },
      { firstName: 'Jane', lastName: 'Doe' }
    ],
    journal: 'Journal of Computer Science',
    volume: '25',
    issue: '3',
    pages: '123-145',
    publicationDate: new Date('2023-05-15'),
    doi: '10.1000/182',
    type: ReferenceType.JOURNAL_ARTICLE,
    url: '',
    abstract: '',
    tags: [],
    metadata_confidence: 0.95,
    ai_confidence: 0.9,
    ai_relevance_score: 0.85,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  const sampleBook = {
    id: 'ref2',
    conversation_id: 'conv1',
    title: 'Advanced Computer Science',
    authors: [
      { firstName: 'Alice', lastName: 'Johnson' }
    ],
    publisher: 'Tech Press',
    edition: '2nd',
    publicationDate: new Date('2022-08-20'),
    type: ReferenceType.BOOK,
    url: '',
    abstract: '',
    journal: '',
    pages: '',
    tags: [],
    metadata_confidence: 0.95,
    ai_confidence: 0.9,
    ai_relevance_score: 0.85,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  const sampleWebsite = {
    id: 'ref3',
    conversation_id: 'conv1',
    title: 'Understanding Machine Learning Algorithms',
    authors: [
      { firstName: 'Bob', lastName: 'Wilson' }
    ],
    publisher: 'TechBlog',
    url: 'https://example.com/ml-algorithms',
    accessDate: new Date('2023-09-10'),
    publicationDate: new Date('2023-07-15'),
    type: ReferenceType.WEBSITE,
    abstract: '',
    journal: '',
    pages: '',
    tags: [],
    metadata_confidence: 0.95,
    ai_confidence: 0.9,
    ai_relevance_score: 0.85,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  describe('formatInlineCitation', () => {
    it('should format inline citation with author and year', () => {
      const result = APAStyle.formatInlineCitation(sampleJournalArticle);
      expect(result).toBe('(Smith & Doe, 2023)');
    });

    it('should format inline citation with title when no author', () => {
      const noAuthorRef = { ...sampleJournalArticle, authors: [] };
      const result = APAStyle.formatInlineCitation(noAuthorRef);
      expect(result).toBe('("Machine Learning in Academic Research," 2023)');
    });

    it('should truncate long titles in inline citation', () => {
      const longTitleRef = { 
        ...sampleJournalArticle, 
        authors: [],
        title: 'This is a very long title that should be truncated in inline citations because it exceeds the character limit'
      };
      const result = APAStyle.formatInlineCitation(longTitleRef);
      expect(result).toBe('("This is a very long title that should be trunca...," 2023)');
    });
  });

  describe('formatBibliographyEntry', () => {
    it('should format journal article bibliography entry', () => {
      const result = APAStyle.formatBibliographyEntry(sampleJournalArticle);
      expect(result).toBe('Smith, J., & Doe, J. (2023). Machine Learning in Academic Research. *Journal of Computer Science*, *25*(3), pp. 123-145. https://doi.org/10.1000/182');
    });

    it('should format book bibliography entry', () => {
      const result = APAStyle.formatBibliographyEntry(sampleBook);
      expect(result).toBe('Johnson, A. (2022). *Advanced Computer Science* (2nd ed.). Tech Press.');
    });

    it('should format website bibliography entry', () => {
      const result = APAStyle.formatBibliographyEntry(sampleWebsite);
      expect(result).toBe('Wilson, B. (2023). Understanding Machine Learning Algorithms. *TechBlog*. https://example.com/ml-algorithms. Retrieved September 10, 2023');
    });

    it('should handle reference without authors', () => {
      const noAuthorRef = { ...sampleJournalArticle, authors: [] };
      const result = APAStyle.formatBibliographyEntry(noAuthorRef);
      expect(result).toBe('Machine Learning in Academic Research (2023). *Journal of Computer Science*, *25*(3), pp. 123-145. https://doi.org/10.1000/182');
    });

    it('should handle reference without DOI but with URL', () => {
      const noDOIRef = { 
        ...sampleJournalArticle, 
        doi: undefined,
        url: 'https://example.com/article'
      };
      const result = APAStyle.formatBibliographyEntry(noDOIRef);
      expect(result).toBe('Smith, J., & Doe, J. (2023). Machine Learning in Academic Research. *Journal of Computer Science*, *25*(3), pp. 123-145. https://example.com/article');
    });
  });
});
