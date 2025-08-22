/**
 * Citation Style Engine Tests
 * Unit tests for citation formatting functionality
 */

import { describe, it, expect } from 'vitest';
import { 
  CitationStyleEngine, 
  AuthorFormatter, 
  DateFormatter, 
  PageFormatter 
} from '../worker/lib/citation-style-engine.js';
import { Reference, Author, CitationStyle, ReferenceType } from '../lib/ai-types.js';

describe('AuthorFormatter', () => {
  const sampleAuthor: Author = {
    firstName: 'John',
    lastName: 'Smith',
    middleName: 'David'
  };

  const authorWithSuffix: Author = {
    firstName: 'Mary',
    lastName: 'Johnson',
    suffix: 'Jr.'
  };

  describe('formatAPA', () => {
    it('should format single author for bibliography', () => {
      const result = AuthorFormatter.formatAPA(sampleAuthor, true, false);
      expect(result).toBe('Smith, J. D.');
    });

    it('should format author with suffix', () => {
      const result = AuthorFormatter.formatAPA(authorWithSuffix, true, false);
      expect(result).toBe('Johnson, M., Jr.');
    });

    it('should format author for inline citation', () => {
      const result = AuthorFormatter.formatAPA(sampleAuthor, true, true);
      expect(result).toBe('Smith');
    });

    it('should handle author without middle name', () => {
      const author: Author = { firstName: 'Jane', lastName: 'Doe' };
      const result = AuthorFormatter.formatAPA(author, true, false);
      expect(result).toBe('Doe, J.');
    });

    it('should handle author without first name', () => {
      const author: Author = { firstName: '', lastName: 'Organization' };
      const result = AuthorFormatter.formatAPA(author, true, false);
      expect(result).toBe('Organization');
    });
  });

  describe('formatMultipleAPA', () => {
    const authors: Author[] = [
      { firstName: 'John', lastName: 'Smith' },
      { firstName: 'Jane', lastName: 'Doe' },
      { firstName: 'Bob', lastName: 'Wilson' }
    ];

    it('should format single author', () => {
      const result = AuthorFormatter.formatMultipleAPA([authors[0]], false);
      expect(result).toBe('Smith, J.');
    });

    it('should format two authors for bibliography', () => {
      const result = AuthorFormatter.formatMultipleAPA(authors.slice(0, 2), false);
      expect(result).toBe('Smith, J., & Doe, J.');
    });

    it('should format three authors for bibliography', () => {
      const result = AuthorFormatter.formatMultipleAPA(authors, false);
      expect(result).toBe('Smith, J., Doe, J., & Wilson, B.');
    });

    it('should format single author for inline citation', () => {
      const result = AuthorFormatter.formatMultipleAPA([authors[0]], true);
      expect(result).toBe('Smith');
    });

    it('should format two authors for inline citation', () => {
      const result = AuthorFormatter.formatMultipleAPA(authors.slice(0, 2), true);
      expect(result).toBe('Smith & Doe');
    });

    it('should format three authors for inline citation', () => {
      const result = AuthorFormatter.formatMultipleAPA(authors, true);
      expect(result).toBe('Smith, Doe, & Wilson');
    });

    it('should use et al. for 6+ authors in inline citation', () => {
      const manyAuthors = [
        ...authors,
        { firstName: 'Alice', lastName: 'Brown' },
        { firstName: 'Charlie', lastName: 'Davis' },
        { firstName: 'Eve', lastName: 'Miller' }
      ];
      const result = AuthorFormatter.formatMultipleAPA(manyAuthors, true);
      expect(result).toBe('Smith et al.');
    });

    it('should handle empty authors array', () => {
      const result = AuthorFormatter.formatMultipleAPA([], false);
      expect(result).toBe('');
    });
  });
});

describe('DateFormatter', () => {
  describe('formatAPA', () => {
    it('should format valid date', () => {
      const date = new Date('2023-05-15');
      const result = DateFormatter.formatAPA(date);
      expect(result).toBe('2023');
    });

    it('should handle undefined date', () => {
      const result = DateFormatter.formatAPA(undefined);
      expect(result).toBe('n.d.');
    });
  });

  describe('formatAccessDateAPA', () => {
    it('should format access date', () => {
      const date = new Date('2023-05-15');
      const result = DateFormatter.formatAccessDateAPA(date);
      expect(result).toBe('Retrieved May 15, 2023');
    });

    it('should handle undefined access date', () => {
      const result = DateFormatter.formatAccessDateAPA(undefined);
      expect(result).toBe('');
    });
  });
});

describe('PageFormatter', () => {
  describe('formatAPA', () => {
    it('should format single page', () => {
      const result = PageFormatter.formatAPA('123');
      expect(result).toBe('p. 123');
    });

    it('should format page range with dash', () => {
      const result = PageFormatter.formatAPA('123-145');
      expect(result).toBe('pp. 123-145');
    });

    it('should format page range with en dash', () => {
      const result = PageFormatter.formatAPA('123–145');
      expect(result).toBe('pp. 123–145');
    });

    it('should handle undefined pages', () => {
      const result = PageFormatter.formatAPA(undefined);
      expect(result).toBe('');
    });

    it('should handle empty pages', () => {
      const result = PageFormatter.formatAPA('');
      expect(result).toBe('');
    });
  });
});

describe('CitationStyleEngine', () => {
  const sampleReference: Reference = {
    id: '1',
    conversationId: 'conv1',
    type: ReferenceType.JOURNAL_ARTICLE,
    title: 'The Impact of Climate Change on Biodiversity',
    authors: [
      { firstName: 'John', lastName: 'Smith' },
      { firstName: 'Jane', lastName: 'Doe' }
    ],
    publicationDate: new Date('2023-01-01'),
    journal: 'Nature Climate Change',
    volume: '13',
    issue: '2',
    pages: '123-135',
    doi: '10.1038/s41558-023-01234-5',
    tags: [],
    metadataConfidence: 1.0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe('formatInlineCitationAPA', () => {
    it('should format basic inline citation', () => {
      const result = CitationStyleEngine.formatInlineCitationAPA(sampleReference);
      expect(result).toBe('(Smith & Doe, 2023)');
    });

    it('should handle reference without authors', () => {
      const refWithoutAuthors = { ...sampleReference, authors: [] };
      const result = CitationStyleEngine.formatInlineCitationAPA(refWithoutAuthors);
      expect(result).toBe('("The Impact of Climate Change on Biodiversity," 2023)');
    });

    it('should truncate long titles', () => {
      const longTitle = 'This is a very long title that should be truncated because it exceeds the reasonable length limit for inline citations';
      const refWithLongTitle = { ...sampleReference, title: longTitle, authors: [] };
      const result = CitationStyleEngine.formatInlineCitationAPA(refWithLongTitle);
      expect(result).toContain('...');
      expect(result.length).toBeLessThan(longTitle.length + 20);
    });

    it('should handle single author', () => {
      const singleAuthorRef = { 
        ...sampleReference, 
        authors: [{ firstName: 'John', lastName: 'Smith' }] 
      };
      const result = CitationStyleEngine.formatInlineCitationAPA(singleAuthorRef);
      expect(result).toBe('(Smith, 2023)');
    });
  });

  describe('formatBibliographyEntryAPA', () => {
    it('should format journal article', () => {
      const result = CitationStyleEngine.formatBibliographyEntryAPA(sampleReference);
      const expected = 'Smith, J., & Doe, J. (2023). The Impact of Climate Change on Biodiversity. *Nature Climate Change*, *13*(2), pp. 123-135. https://doi.org/10.1038/s41558-023-01234-5';
      expect(result).toBe(expected);
    });

    it('should format book reference', () => {
      const bookRef: Reference = {
        ...sampleReference,
        type: ReferenceType.BOOK,
        title: 'Climate Change and Society',
        journal: undefined,
        volume: undefined,
        issue: undefined,
        pages: undefined,
        publisher: 'Academic Press',
        edition: '2nd'
      };
      const result = CitationStyleEngine.formatBibliographyEntryAPA(bookRef);
      const expected = 'Smith, J., & Doe, J. (2023). *Climate Change and Society* (2nd ed.). Academic Press. https://doi.org/10.1038/s41558-023-01234-5';
      expect(result).toBe(expected);
    });

    it('should format website reference', () => {
      const websiteRef: Reference = {
        ...sampleReference,
        type: ReferenceType.WEBSITE,
        title: 'Climate Change Facts',
        journal: undefined,
        volume: undefined,
        issue: undefined,
        pages: undefined,
        publisher: 'EPA',
        doi: undefined,
        url: 'https://www.epa.gov/climate-change',
        accessDate: new Date('2023-06-15')
      };
      const result = CitationStyleEngine.formatBibliographyEntryAPA(websiteRef);
      const expected = 'Smith, J., & Doe, J. (2023). Climate Change Facts. *EPA*. https://www.epa.gov/climate-change. Retrieved June 15, 2023';
      expect(result).toBe(expected);
    });

    it('should handle reference without authors', () => {
      const noAuthorRef = { ...sampleReference, authors: [] };
      const result = CitationStyleEngine.formatBibliographyEntryAPA(noAuthorRef);
      expect(result.startsWith('The Impact of Climate Change on Biodiversity (2023).')).toBe(true);
    });

    it('should format thesis reference', () => {
      const thesisRef: Reference = {
        ...sampleReference,
        type: ReferenceType.THESIS,
        title: 'Climate Change Impacts on Marine Ecosystems',
        journal: undefined,
        volume: undefined,
        issue: undefined,
        pages: undefined,
        publisher: 'University of California',
        notes: 'Doctoral dissertation'
      };
      const result = CitationStyleEngine.formatBibliographyEntryAPA(thesisRef);
      const expected = 'Smith, J., & Doe, J. (2023). *Climate Change Impacts on Marine Ecosystems* [Doctoral dissertation]. University of California. https://doi.org/10.1038/s41558-023-01234-5';
      expect(result).toBe(expected);
    });

    it('should format conference paper', () => {
      const conferenceRef: Reference = {
        ...sampleReference,
        type: ReferenceType.CONFERENCE_PAPER,
        title: 'Climate Modeling Advances',
        journal: 'International Climate Conference 2023',
        volume: undefined,
        issue: undefined,
        pages: undefined,
        publisher: 'San Francisco, CA'
      };
      const result = CitationStyleEngine.formatBibliographyEntryAPA(conferenceRef);
      const expected = 'Smith, J., & Doe, J. (2023). Climate Modeling Advances. Paper presented at International Climate Conference 2023, San Francisco, CA. https://doi.org/10.1038/s41558-023-01234-5';
      expect(result).toBe(expected);
    });
  });

  describe('formatInlineCitation', () => {
    it('should format APA inline citation', () => {
      const result = CitationStyleEngine.formatInlineCitation(sampleReference, CitationStyle.APA);
      expect(result).toBe('(Smith & Doe, 2023)');
    });

    it('should format MLA inline citation', () => {
      const result = CitationStyleEngine.formatInlineCitation(sampleReference, CitationStyle.MLA);
      expect(result).toBe('(Smith and Doe 123-135)');
    });

    it('should format Chicago inline citation', () => {
      const result = CitationStyleEngine.formatInlineCitation(sampleReference, CitationStyle.CHICAGO);
      expect(result).toBe('(Smith and Doe 2023, 123-135)');
    });

    it('should format Harvard inline citation', () => {
      const result = CitationStyleEngine.formatInlineCitation(sampleReference, CitationStyle.HARVARD);
      expect(result).toBe('(Smith & Doe 2023)');
    });

    it('should throw error for unsupported style', () => {
      expect(() => {
        CitationStyleEngine.formatInlineCitation(sampleReference, CitationStyle.IEEE);
      }).toThrow('Citation style ieee not yet implemented');
    });
  });

  describe('formatBibliographyEntry', () => {
    it('should format APA bibliography entry', () => {
      const result = CitationStyleEngine.formatBibliographyEntry(sampleReference, CitationStyle.APA);
      expect(result).toContain('Smith, J., & Doe, J. (2023)');
    });

    it('should format MLA bibliography entry', () => {
      const result = CitationStyleEngine.formatBibliographyEntry(sampleReference, CitationStyle.MLA);
      expect(result).toContain('Smith, John, and Jane Doe.');
      expect(result).toContain('"The Impact of Climate Change on Biodiversity."');
    });

    it('should format Chicago bibliography entry', () => {
      const result = CitationStyleEngine.formatBibliographyEntry(sampleReference, CitationStyle.CHICAGO);
      expect(result).toContain('Smith, John, and Jane Doe.');
      expect(result).toContain('"The Impact of Climate Change on Biodiversity."');
    });

    it('should format Harvard bibliography entry', () => {
      const result = CitationStyleEngine.formatBibliographyEntry(sampleReference, CitationStyle.HARVARD);
      expect(result).toContain('Smith, J., & Doe, J. 2023');
      expect(result).toContain("'The Impact of Climate Change on Biodiversity'");
    });

    it('should throw error for unsupported style', () => {
      expect(() => {
        CitationStyleEngine.formatBibliographyEntry(sampleReference, CitationStyle.IEEE);
      }).toThrow('Citation style ieee not yet implemented');
    });
  });

  describe('validateStyleRequirements', () => {
    it('should validate complete APA reference', () => {
      const result = CitationStyleEngine.validateStyleRequirements(sampleReference, CitationStyle.APA);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should identify missing title', () => {
      const incompleteRef = { ...sampleReference, title: '' };
      const result = CitationStyleEngine.validateStyleRequirements(incompleteRef, CitationStyle.APA);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('title');
    });

    it('should warn about missing authors', () => {
      const noAuthorRef = { ...sampleReference, authors: [] };
      const result = CitationStyleEngine.validateStyleRequirements(noAuthorRef, CitationStyle.APA);
      expect(result.isValid).toBe(true); // Still valid, just warnings
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].field).toBe('authors');
    });

    it('should validate journal article requirements', () => {
      const noJournalRef = { ...sampleReference, journal: undefined };
      const result = CitationStyleEngine.validateStyleRequirements(noJournalRef, CitationStyle.APA);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'journal')).toBe(true);
    });

    it('should validate website requirements', () => {
      const websiteRef: Reference = {
        ...sampleReference,
        type: ReferenceType.WEBSITE,
        url: undefined
      };
      const result = CitationStyleEngine.validateStyleRequirements(websiteRef, CitationStyle.APA);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'url')).toBe(true);
    });

    it('should validate MLA requirements', () => {
      const result = CitationStyleEngine.validateStyleRequirements(sampleReference, CitationStyle.MLA);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate Chicago requirements', () => {
      const result = CitationStyleEngine.validateStyleRequirements(sampleReference, CitationStyle.CHICAGO);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate Harvard requirements', () => {
      const result = CitationStyleEngine.validateStyleRequirements(sampleReference, CitationStyle.HARVARD);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle unsupported citation style', () => {
      const result = CitationStyleEngine.validateStyleRequirements(sampleReference, CitationStyle.IEEE);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('not yet implemented');
    });
  });

  describe('generateBibliography', () => {
    const multipleReferences: Reference[] = [
      {
        id: '1',
        conversationId: 'conv1',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Climate Change Research',
        authors: [{ firstName: 'John', lastName: 'Smith' }],
        publicationDate: new Date('2023-01-01'),
        journal: 'Climate Journal',
        volume: '10',
        issue: '1',
        pages: '1-10',
        doi: '10.1000/test1',
        tags: [],
        metadataConfidence: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        conversationId: 'conv1',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Environmental Studies',
        authors: [{ firstName: 'Jane', lastName: 'Doe' }],
        publicationDate: new Date('2022-01-01'),
        journal: 'Environment Journal',
        volume: '5',
        issue: '2',
        pages: '20-30',
        doi: '10.1000/test2',
        tags: [],
        metadataConfidence: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        conversationId: 'conv1',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Biodiversity Analysis',
        authors: [{ firstName: 'Alice', lastName: 'Brown' }],
        publicationDate: new Date('2024-01-01'),
        journal: 'Biology Journal',
        volume: '15',
        issue: '3',
        pages: '100-120',
        doi: '10.1000/test3',
        tags: [],
        metadataConfidence: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should generate bibliography with alphabetical sorting', () => {
      const result = CitationStyleEngine.generateBibliography(multipleReferences, CitationStyle.APA, 'alphabetical');
      const lines = result.split('\n\n');
      
      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain('Brown, A.'); // Alice Brown should be first alphabetically
      expect(lines[1]).toContain('Doe, J.');   // Jane Doe should be second
      expect(lines[2]).toContain('Smith, J.'); // John Smith should be last
    });

    it('should generate bibliography with chronological sorting', () => {
      const result = CitationStyleEngine.generateBibliography(multipleReferences, CitationStyle.APA, 'chronological');
      const lines = result.split('\n\n');
      
      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain('Brown, A.'); // 2024 should be first (newest)
      expect(lines[1]).toContain('Smith, J.'); // 2023 should be second
      expect(lines[2]).toContain('Doe, J.');   // 2022 should be last (oldest)
    });

    it('should generate bibliography with appearance order', () => {
      const result = CitationStyleEngine.generateBibliography(multipleReferences, CitationStyle.APA, 'appearance');
      const lines = result.split('\n\n');
      
      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain('Smith, J.'); // Original order maintained
      expect(lines[1]).toContain('Doe, J.');
      expect(lines[2]).toContain('Brown, A.');
    });

    it('should handle empty references array', () => {
      const result = CitationStyleEngine.generateBibliography([], CitationStyle.APA);
      expect(result).toBe('');
    });

    it('should remove duplicate references', () => {
      const duplicateReferences = [
        multipleReferences[0],
        { ...multipleReferences[0], id: '4' }, // Duplicate with different ID
        multipleReferences[1]
      ];
      
      const result = CitationStyleEngine.generateBibliography(duplicateReferences, CitationStyle.APA);
      const lines = result.split('\n\n');
      
      expect(lines).toHaveLength(2); // Should have only 2 unique references
    });

    it('should work with different citation styles', () => {
      const result = CitationStyleEngine.generateBibliography([multipleReferences[0]], CitationStyle.MLA);
      expect(result).toContain('Smith, John.');
      expect(result).toContain('"Climate Change Research."');
    });
  });

  describe('detectDuplicateReferences', () => {
    it('should detect duplicate references by DOI', () => {
      const references = [
        { ...sampleReference, id: '1', doi: '10.1038/s41558-023-01234-5' },
        { ...sampleReference, id: '2', doi: '10.1038/s41558-023-01234-5', title: 'Different Title' }
      ];
      
      const duplicates = CitationStyleEngine.detectDuplicateReferences(references);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0]).toHaveLength(2);
    });

    it('should detect duplicate references by title and author', () => {
      const references = [
        { ...sampleReference, id: '1', doi: undefined, title: 'Same Title', authors: [{ firstName: 'John', lastName: 'Smith' }] },
        { ...sampleReference, id: '2', doi: undefined, title: 'Same Title', authors: [{ firstName: 'John', lastName: 'Smith' }] }
      ];
      
      const duplicates = CitationStyleEngine.detectDuplicateReferences(references);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0]).toHaveLength(2);
    });

    it('should detect duplicate references by URL', () => {
      const references = [
        { ...sampleReference, id: '1', doi: undefined, url: 'https://example.com/article' },
        { ...sampleReference, id: '2', doi: undefined, url: 'http://example.com/article/' }
      ];
      
      const duplicates = CitationStyleEngine.detectDuplicateReferences(references);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0]).toHaveLength(2);
    });

    it('should not detect false positives', () => {
      const references = [
        {
          id: '1',
          conversationId: 'conv1',
          type: ReferenceType.JOURNAL_ARTICLE,
          title: 'Climate Change Research',
          authors: [{ firstName: 'John', lastName: 'Smith' }],
          publicationDate: new Date('2023-01-01'),
          doi: '10.1000/different1',
          tags: [],
          metadataConfidence: 1.0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          conversationId: 'conv1',
          type: ReferenceType.JOURNAL_ARTICLE,
          title: 'Environmental Research',
          authors: [{ firstName: 'Jane', lastName: 'Doe' }],
          publicationDate: new Date('2022-01-01'),
          doi: '10.1000/different2',
          tags: [],
          metadataConfidence: 1.0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const duplicates = CitationStyleEngine.detectDuplicateReferences(references);
      expect(duplicates).toHaveLength(0);
    });

    it('should handle references without authors', () => {
      const references = [
        { ...sampleReference, id: '1', authors: [], title: 'Same Title' },
        { ...sampleReference, id: '2', authors: [], title: 'Same Title' }
      ];
      
      const duplicates = CitationStyleEngine.detectDuplicateReferences(references);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0]).toHaveLength(2);
    });
  });
});