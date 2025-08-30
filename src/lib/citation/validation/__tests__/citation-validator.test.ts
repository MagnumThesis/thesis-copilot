/**
 * Tests for Citation Validator Module
 */

import { describe, it, expect } from 'vitest';
import { CitationValidator } from '../citation-validator';
import { ReferenceType } from '../../../types/citation-types/reference-types';
import { CitationStyle } from '../../../types/citation-types/citation-styles';

describe('CitationValidator', () => {
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
    url: 'https://example.com/ml-algorithms',
    accessDate: new Date('2023-09-10'),
    type: ReferenceType.WEBSITE,
    abstract: '',
    journal: '',
    pages: '',
    publisher: '',
    tags: [],
    metadata_confidence: 0.95,
    ai_confidence: 0.9,
    ai_relevance_score: 0.85,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  describe('validateStyleRequirements', () => {
    describe('APA Style', () => {
      it('should validate complete journal article', () => {
        const result = CitationValidator.validateStyleRequirements(sampleJournalArticle, CitationStyle.APA);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should detect missing title', () => {
        const invalidRef = { ...sampleJournalArticle, title: '' };
        const result = CitationValidator.validateStyleRequirements(invalidRef, CitationStyle.APA);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(typeof result.errors[0] === 'object' ? result.errors[0].field : 'title').toBe('title');
        expect(typeof result.errors[0] === 'object' ? result.errors[0].message : result.errors[0]).toContain('Title is required');
      });

      it('should detect missing journal for journal article', () => {
        const invalidRef = { ...sampleJournalArticle, journal: '' };
        const result = CitationValidator.validateStyleRequirements(invalidRef, CitationStyle.APA);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].field).toBe('journal');
      });

      it('should detect missing URL for website', () => {
        const invalidRef = { ...sampleWebsite, url: '' };
        const result = CitationValidator.validateStyleRequirements(invalidRef, CitationStyle.APA);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].field).toBe('url');
      });

      it('should warn about missing authors', () => {
        const noAuthorRef = { ...sampleJournalArticle, authors: [] };
        const result = CitationValidator.validateStyleRequirements(noAuthorRef, CitationStyle.APA);
        expect(result.isValid).toBe(true); // Should still be valid
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].field).toBe('authors');
      });
    });

    describe('MLA Style', () => {
      it('should validate complete journal article', () => {
        const result = CitationValidator.validateStyleRequirements(sampleJournalArticle, CitationStyle.MLA);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should detect missing title', () => {
        const invalidRef = { ...sampleJournalArticle, title: '' };
        const result = CitationValidator.validateStyleRequirements(invalidRef, CitationStyle.MLA);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].field).toBe('title');
      });

      it('should detect missing journal for journal article', () => {
        const invalidRef = { ...sampleJournalArticle, journal: '' };
        const result = CitationValidator.validateStyleRequirements(invalidRef, CitationStyle.MLA);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].field).toBe('journal');
      });
    });

    describe('Chicago Style', () => {
      it('should validate complete journal article', () => {
        const result = CitationValidator.validateStyleRequirements(sampleJournalArticle, CitationStyle.CHICAGO);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should warn about missing publication date', () => {
        const noDateRef = { ...sampleJournalArticle, publicationDate: undefined };
        const result = CitationValidator.validateStyleRequirements(noDateRef, CitationStyle.CHICAGO);
        expect(result.isValid).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].field).toBe('publicationDate');
      });
    });

    describe('Harvard Style', () => {
      it('should validate complete journal article', () => {
        const result = CitationValidator.validateStyleRequirements(sampleJournalArticle, CitationStyle.HARVARD);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should warn about missing access date for website', () => {
        const noAccessDateRef = { ...sampleWebsite, accessDate: undefined };
        const result = CitationValidator.validateStyleRequirements(noAccessDateRef, CitationStyle.HARVARD);
        expect(result.isValid).toBe(true); // Should be valid even without access date
        expect(result.warnings.some((w: any) => w.field === 'accessDate')).toBe(true);
      });
    });

    describe('IEEE Style', () => {
      it('should validate complete journal article', () => {
        const result = CitationValidator.validateStyleRequirements(sampleJournalArticle, CitationStyle.IEEE);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should detect missing conference name for conference paper', () => {
        const conferencePaper = {
          ...sampleJournalArticle,
          type: ReferenceType.CONFERENCE_PAPER,
          journal: '' // Using journal field for conference name
        };
        const result = CitationValidator.validateStyleRequirements(conferencePaper, CitationStyle.IEEE);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].field).toBe('journal');
        expect(result.errors[0].message).toContain('Conference name is required');
      });
    });

    describe('Unsupported Style', () => {
      it('should return error for unsupported style', () => {
        const result = CitationValidator.validateStyleRequirements(sampleJournalArticle, 'UNSUPPORTED' as CitationStyle);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].field).toBe('style');
        expect(result.errors[0].message).toContain('not yet implemented');
      });
    });
  });

  describe('getStyleRequirements', () => {
    it('should return correct requirements for APA journal article', () => {
      const requirements = CitationValidator.getStyleRequirements(CitationStyle.APA, ReferenceType.JOURNAL_ARTICLE);
      expect(requirements).toContain('title');
      expect(requirements).toContain('authors');
      expect(requirements).toContain('journal');
      expect(requirements).toContain('publicationDate');
    });

    it('should return correct requirements for MLA book', () => {
      const requirements = CitationValidator.getStyleRequirements(CitationStyle.MLA, ReferenceType.BOOK);
      expect(requirements).toContain('title');
      expect(requirements).toContain('authors');
      expect(requirements).toContain('publisher');
      expect(requirements).toContain('publicationDate');
    });

    it('should return correct requirements for website', () => {
      const requirements = CitationValidator.getStyleRequirements(CitationStyle.APA, ReferenceType.WEBSITE);
      expect(requirements).toContain('title');
      expect(requirements).toContain('url');
      expect(requirements).toContain('accessDate');
    });

    it('should return default requirements for unknown type', () => {
      const requirements = CitationValidator.getStyleRequirements(CitationStyle.APA, 'UNKNOWN' as ReferenceType);
      expect(requirements).toEqual(['title']);
    });
  });

  describe('Database Schema Compatibility', () => {
    it('should handle legacy publication_date property', () => {
      const legacyRef = {
        ...sampleJournalArticle,
        publicationDate: undefined,
        publication_date: '2023-05-15'
      };
      const result = CitationValidator.validateStyleRequirements(legacyRef, CitationStyle.APA);
      expect(result.isValid).toBe(true);
    });

    it('should handle legacy access_date property', () => {
      const legacyRef = {
        ...sampleWebsite,
        accessDate: undefined,
        access_date: '2023-09-10'
      };
      const result = CitationValidator.validateStyleRequirements(legacyRef, CitationStyle.APA);
      expect(result.isValid).toBe(false); // Still missing URL
      expect(result.warnings.some(w => w.field === 'accessDate')).toBe(false); // Should not warn about access date
    });
  });
});
