/**
 * Tests for MLA Citation Style
 */

import { MLAStyle } from '../mla-style';
import { Reference, ReferenceType } from '../../../types/citation-types/reference-types';
import { describe, expect, it } from 'vitest';

describe('MLAStyle', () => {
  const sampleJournalArticle: Reference = {
    id: 'test-1',
    conversation_id: 'conv-123',
    title: 'The Impact of AI on Academic Research',
    authors: [
      { firstName: 'Jane', lastName: 'Smith' },
      { firstName: 'John', lastName: 'Doe' }
    ],
    type: ReferenceType.JOURNAL_ARTICLE,
    journal: 'Journal of Academic Technology',
    volume: '15',
    issue: '3',
    pages: '123-145',
    publicationDate: new Date('2023-06-15'),
    url: 'https://example.com/article',
    accessDate: new Date('2024-01-15'),
    tags: [],
    metadata_confidence: 0.95,
    ai_confidence: 0.9,
    ai_relevance_score: 0.85,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  };

  const sampleBook: Reference = {
    id: 'test-2',
    conversation_id: 'conv-123',
    title: 'Understanding Modern Technology',
    authors: [
      { firstName: 'Alice', lastName: 'Johnson' }
    ],
    type: ReferenceType.BOOK,
    publisher: 'Academic Press',
    publicationDate: new Date('2022-03-10'),
    tags: [],
    metadata_confidence: 0.95,
    ai_confidence: 0.9,
    ai_relevance_score: 0.85,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  };

  const sampleWebsite: Reference = {
    id: 'test-3',
    conversation_id: 'conv-123',
    title: 'Digital Transformation in Education',
    authors: [
      { firstName: 'Bob', lastName: 'Wilson' }
    ],
    type: ReferenceType.WEBSITE,
    publisher: 'Education Today',
    publicationDate: new Date('2023-12-01'),
    url: 'https://educationtoday.com/digital-transformation',
    accessDate: new Date('2024-01-20'),
    tags: [],
    metadata_confidence: 0.95,
    ai_confidence: 0.9,
    ai_relevance_score: 0.85,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  };

  describe('formatInlineCitation', () => {
    it('should format inline citation with single author', () => {
      const result = MLAStyle.formatInlineCitation(sampleBook);
      expect(result).toBe('(Johnson)');
    });

    it('should format inline citation with pages', () => {
      const refWithPages = { ...sampleBook, pages: '45' };
      const result = MLAStyle.formatInlineCitation(refWithPages);
      expect(result).toBe('(Johnson 45)');
    });

    it('should format inline citation without author using title', () => {
      const refWithoutAuthor = { ...sampleBook, authors: [] };
      const result = MLAStyle.formatInlineCitation(refWithoutAuthor);
      expect(result).toBe('("Understanding Modern Techno...")');
    });

    it('should format inline citation with long title (truncated)', () => {
      const longTitle = 'This is a very long title that should be truncated for inline citations';
      const refWithLongTitle = { ...sampleBook, title: longTitle, authors: [] };
      const result = MLAStyle.formatInlineCitation(refWithLongTitle);
      expect(result).toBe('("This is a very long title t...")');
    });
  });

  describe('formatBibliographyEntry', () => {
    it('should format journal article bibliography entry', () => {
      const result = MLAStyle.formatBibliographyEntry(sampleJournalArticle);
      expect(result).toContain('Smith, Jane, and John Doe.');
      expect(result).toContain('"The Impact of AI on Academic Research."');
      expect(result).toContain('*Journal of Academic Technology*');
      expect(result).toContain('vol. 15, no. 3');
      expect(result).toContain('2023');
      expect(result).toContain('pp. 123-145');
      expect(result).toContain('Web.');
      expect(result).toContain('15 Jan. 2024');
    });

    it('should format book bibliography entry', () => {
      const result = MLAStyle.formatBibliographyEntry(sampleBook);
      expect(result).toContain('Johnson, Alice.');
      expect(result).toContain('*Understanding Modern Technology*.');
      expect(result).toContain('Academic Press');
      expect(result).toContain('2022');
    });

    it('should format website bibliography entry', () => {
      const result = MLAStyle.formatBibliographyEntry(sampleWebsite);
      expect(result).toContain('Wilson, Bob.');
      expect(result).toContain('"Digital Transformation in Education."');
      expect(result).toContain('*Education Today*');
      expect(result).toContain('2023');
      expect(result).toContain('Web.');
      expect(result).toContain('20 Jan. 2024');
    });

    it('should handle references without authors', () => {
      const refWithoutAuthor = { ...sampleBook, authors: [] };
      const result = MLAStyle.formatBibliographyEntry(refWithoutAuthor);
      expect(result).toContain('*Understanding Modern Technology*.');
      expect(result).toContain('Academic Press');
    });

    it('should handle references with database schema properties', () => {
      const refWithDbSchema = {
        ...sampleBook,
        publication_date: '2022-03-10',
        access_date: '2024-01-20',
        publicationDate: undefined,
        accessDate: undefined
      };
      const result = MLAStyle.formatBibliographyEntry(refWithDbSchema);
      expect(result).toContain('2022');
    });
  });

  describe('formatJournalArticle', () => {
    it('should format journal article without issue number', () => {
      const refWithoutIssue = { ...sampleJournalArticle, issue: undefined };
      const result = MLAStyle.formatBibliographyEntry(refWithoutIssue);
      expect(result).toContain('vol. 15');
      expect(result).not.toContain('no.');
    });

    it('should format journal article without volume', () => {
      const refWithoutVolume = { ...sampleJournalArticle, volume: undefined };
      const result = MLAStyle.formatBibliographyEntry(refWithoutVolume);
      expect(result).not.toContain('vol.');
    });
  });

  describe('formatBook', () => {
    it('should format book without publisher', () => {
      const refWithoutPublisher = { ...sampleBook, publisher: undefined };
      const result = MLAStyle.formatBibliographyEntry(refWithoutPublisher);
      expect(result).toContain('*Understanding Modern Technology*.');
      expect(result).toContain('2022');
    });
  });

  describe('formatWebsite', () => {
    it('should format website without access date', () => {
      const refWithoutAccessDate = { ...sampleWebsite, accessDate: undefined, access_date: undefined };
      const result = MLAStyle.formatBibliographyEntry(refWithoutAccessDate);
      expect(result).toContain('Web.');
      expect(result).not.toContain('Jan.');
    });
  });

  describe('error handling', () => {
    it('should handle empty reference gracefully', () => {
      const emptyRef: Partial<Reference> = {
        id: 'test-empty',
        title: '',
        authors: [],
        type: ReferenceType.BOOK,
        tags: [],
        metadata_confidence: 0,
        ai_confidence: 0,
        ai_relevance_score: 0,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };
      
      expect(() => MLAStyle.formatInlineCitation(emptyRef as Reference)).not.toThrow();
      expect(() => MLAStyle.formatBibliographyEntry(emptyRef as Reference)).not.toThrow();
    });

    it('should handle null/undefined values gracefully', () => {
      const refWithNulls = {
        ...sampleBook,
        publisher: undefined,
        publicationDate: undefined,
        url: undefined
      };
      
      expect(() => MLAStyle.formatBibliographyEntry(refWithNulls)).not.toThrow();
    });
  });
});
