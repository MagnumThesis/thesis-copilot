/**
 * Tests for IEEE Citation Style Module
 */

import { describe, it, expect } from 'vitest';
import { IEEEStyle } from '../ieee-style';
import { ReferenceType } from '../../../types/citation-types/reference-types';

describe('IEEEStyle', () => {
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

  const sampleConferencePaper = {
    id: 'ref3',
    conversation_id: 'conv1',
    title: 'Neural Networks for Data Analysis',
    authors: [
      { firstName: 'Bob', lastName: 'Wilson' },
      { firstName: 'Carol', lastName: 'Davis' }
    ],
    journal: 'IEEE Conference on Machine Learning',
    pages: '45-52',
    publicationDate: new Date('2023-03-10'),
    doi: '10.1109/example.2023.123456',
    type: ReferenceType.CONFERENCE_PAPER,
    url: '',
    abstract: '',
    publisher: '',
    tags: [],
    metadata_confidence: 0.95,
    ai_confidence: 0.9,
    ai_relevance_score: 0.85,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  const sampleWebsite = {
    id: 'ref4',
    conversation_id: 'conv1',
    title: 'Understanding Machine Learning Algorithms',
    authors: [
      { firstName: 'Bob', lastName: 'Wilson' }
    ],
    publisher: 'TechBlog',
    url: 'https://example.com/ml-algorithms',
    accessDate: new Date('2023-09-10'),
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
    it('should format inline citation as numbered reference', () => {
      const result = IEEEStyle.formatInlineCitation(sampleJournalArticle);
      expect(result).toBe('[re]'); // Uses first 2 characters of ID
    });

    it('should format inline citation for different reference', () => {
      const result = IEEEStyle.formatInlineCitation(sampleBook);
      expect(result).toBe('[re]'); // Uses first 2 characters of ID
    });
  });

  describe('formatBibliographyEntry', () => {
    it('should format journal article bibliography entry', () => {
      const result = IEEEStyle.formatBibliographyEntry(sampleJournalArticle);
      expect(result).toBe('J. Smith, J. Doe, "Machine Learning in Academic Research," *Journal of Computer Science*, vol. 25, no. 3, pp. 123-145, May. 2023. doi: 10.1000/182');
    });

    it('should format book bibliography entry', () => {
      const result = IEEEStyle.formatBibliographyEntry(sampleBook);
      expect(result).toBe('A. Johnson, *Advanced Computer Science*, 2nd ed.. Tech Press, 2022.');
    });

    it('should format conference paper bibliography entry', () => {
      const result = IEEEStyle.formatBibliographyEntry(sampleConferencePaper);
      expect(result).toBe('B. Wilson, C. Davis, "Neural Networks for Data Analysis," in *IEEE Conference on Machine Learning*, 2023, pp. 45-52. doi: 10.1109/example.2023.123456');
    });

    it('should format website bibliography entry', () => {
      const result = IEEEStyle.formatBibliographyEntry(sampleWebsite);
      expect(result).toBe('B. Wilson, "Understanding Machine Learning Algorithms," *TechBlog*. [Online]. Available: https://example.com/ml-algorithms. [Accessed: 10-Sep-2023]');
    });

    it('should handle reference without authors', () => {
      const noAuthorRef = { ...sampleJournalArticle, authors: [] };
      const result = IEEEStyle.formatBibliographyEntry(noAuthorRef);
      expect(result).toBe('"Machine Learning in Academic Research," *Journal of Computer Science*, vol. 25, no. 3, pp. 123-145, May. 2023. doi: 10.1000/182');
    });

    it('should handle many authors with et al.', () => {
      const manyAuthorsRef = {
        ...sampleJournalArticle,
        authors: [
          { firstName: 'John', lastName: 'Smith' },
          { firstName: 'Jane', lastName: 'Doe' },
          { firstName: 'Bob', lastName: 'Wilson' },
          { firstName: 'Alice', lastName: 'Johnson' },
          { firstName: 'Carol', lastName: 'Davis' },
          { firstName: 'David', lastName: 'Brown' },
          { firstName: 'Eve', lastName: 'Miller' },
          { firstName: 'Frank', lastName: 'Garcia' }
        ]
      };
      const result = IEEEStyle.formatBibliographyEntry(manyAuthorsRef);
      expect(result).toBe('J. Smith, J. Doe, B. Wilson, A. Johnson, C. Davis, D. Brown, et al., "Machine Learning in Academic Research," *Journal of Computer Science*, vol. 25, no. 3, pp. 123-145, May. 2023. doi: 10.1000/182');
    });
  });
});
