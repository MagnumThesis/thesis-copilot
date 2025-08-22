/**
 * Unit tests for reference validation functions
 */

import { describe, it, expect } from 'vitest';
import {
  validateDOI,
  validateURL,
  validateISBN,
  validateYear,
  validateAuthor,
  validateReferenceFields,
  validateReferenceForStyle,
  validateReference,
  validateExistingReference,
  getRequiredFields,
  hasRequiredFields
} from '../lib/reference-validation';
import {
  ReferenceFormData,
  ReferenceType,
  CitationStyle,
  Author,
  Reference
} from '../lib/ai-types';

describe('Reference Validation', () => {
  describe('validateDOI', () => {
    it('should validate correct DOI formats', () => {
      expect(validateDOI('10.1000/example')).toBe(true);
      expect(validateDOI('10.1234/journal.2023.123456')).toBe(true);
      expect(validateDOI('10.5555/12345678')).toBe(true);
    });

    it('should reject invalid DOI formats', () => {
      expect(validateDOI('invalid-doi')).toBe(false);
      expect(validateDOI('10.123')).toBe(false);
      expect(validateDOI('doi:10.1000/example')).toBe(false);
      expect(validateDOI('')).toBe(false);
      expect(validateDOI('10.1000/')).toBe(false);
    });

    it('should handle null and undefined values', () => {
      expect(validateDOI(null as any)).toBe(false);
      expect(validateDOI(undefined as any)).toBe(false);
    });
  });

  describe('validateURL', () => {
    it('should validate correct URL formats', () => {
      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('http://example.com')).toBe(true);
      expect(validateURL('https://www.example.com/path?query=value')).toBe(true);
      expect(validateURL('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URL formats', () => {
      expect(validateURL('ftp://example.com')).toBe(false);
      expect(validateURL('example.com')).toBe(false);
      expect(validateURL('not-a-url')).toBe(false);
      expect(validateURL('')).toBe(false);
    });

    it('should handle null and undefined values', () => {
      expect(validateURL(null as any)).toBe(false);
      expect(validateURL(undefined as any)).toBe(false);
    });
  });

  describe('validateISBN', () => {
    it('should validate correct ISBN formats', () => {
      expect(validateISBN('9780123456789')).toBe(true);
      expect(validateISBN('978-0-123-45678-9')).toBe(true);
      expect(validateISBN('0123456789')).toBe(true);
      expect(validateISBN('0-123-45678-9')).toBe(true);
    });

    it('should reject invalid ISBN formats', () => {
      expect(validateISBN('invalid-isbn')).toBe(false);
      expect(validateISBN('123')).toBe(false);
      expect(validateISBN('')).toBe(false);
    });

    it('should handle null and undefined values', () => {
      expect(validateISBN(null as any)).toBe(false);
      expect(validateISBN(undefined as any)).toBe(false);
    });
  });

  describe('validateYear', () => {
    it('should validate correct year formats', () => {
      expect(validateYear('2023')).toBe(true);
      expect(validateYear('1999')).toBe(true);
      expect(validateYear('2099')).toBe(true);
      expect(validateYear('1000')).toBe(true);
    });

    it('should reject invalid year formats', () => {
      expect(validateYear('999')).toBe(false);
      expect(validateYear('2100')).toBe(false);
      expect(validateYear('not-a-year')).toBe(false);
      expect(validateYear('')).toBe(false);
    });

    it('should handle null and undefined values', () => {
      expect(validateYear(null as any)).toBe(false);
      expect(validateYear(undefined as any)).toBe(false);
    });
  });

  describe('validateAuthor', () => {
    it('should validate correct author information', () => {
      const author: Author = {
        firstName: 'John',
        lastName: 'Doe'
      };
      const errors = validateAuthor(author);
      expect(errors).toHaveLength(0);
    });

    it('should require first and last names', () => {
      const author: Author = {
        firstName: '',
        lastName: ''
      };
      const errors = validateAuthor(author);
      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe('firstName');
      expect(errors[1].field).toBe('lastName');
    });

    it('should validate name length limits', () => {
      const longName = 'a'.repeat(101);
      const author: Author = {
        firstName: longName,
        lastName: longName
      };
      const errors = validateAuthor(author);
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toContain('less than 100 characters');
    });
  });

  describe('validateReferenceFields', () => {
    const validReferenceData: ReferenceFormData = {
      type: ReferenceType.JOURNAL_ARTICLE,
      title: 'Test Article',
      authors: [{ firstName: 'John', lastName: 'Doe' }],
      publicationDate: '2023',
      journal: 'Test Journal',
      url: 'https://example.com',
      doi: '10.1000/example',
      tags: []
    };

    it('should validate correct reference data', () => {
      const errors = validateReferenceFields(validReferenceData);
      expect(errors).toHaveLength(0);
    });

    it('should require title', () => {
      const data = { ...validReferenceData, title: '' };
      const errors = validateReferenceFields(data);
      expect(errors.some(e => e.field === 'title')).toBe(true);
    });

    it('should require at least one author', () => {
      const data = { ...validReferenceData, authors: [] };
      const errors = validateReferenceFields(data);
      expect(errors.some(e => e.field === 'authors')).toBe(true);
    });

    it('should validate DOI format', () => {
      const data = { ...validReferenceData, doi: 'invalid-doi' };
      const errors = validateReferenceFields(data);
      expect(errors.some(e => e.field === 'doi')).toBe(true);
    });

    it('should validate URL format', () => {
      const data = { ...validReferenceData, url: 'invalid-url' };
      const errors = validateReferenceFields(data);
      expect(errors.some(e => e.field === 'url')).toBe(true);
    });
  });

  describe('validateReferenceForStyle', () => {
    const baseData: ReferenceFormData = {
      type: ReferenceType.JOURNAL_ARTICLE,
      title: 'Test Article',
      authors: [{ firstName: 'John', lastName: 'Doe' }],
      tags: []
    };

    it('should validate APA journal article requirements', () => {
      const data = {
        ...baseData,
        journal: 'Test Journal',
        publicationDate: '2023'
      };
      const errors = validateReferenceForStyle(data, CitationStyle.APA);
      // Should only have warnings, no errors
      const actualErrors = errors.filter(e => e.severity === 'error');
      expect(actualErrors).toHaveLength(0);
    });

    it('should identify missing required fields for APA', () => {
      const errors = validateReferenceForStyle(baseData, CitationStyle.APA);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.field === 'journal')).toBe(true);
      expect(errors.some(e => e.field === 'publicationDate')).toBe(true);
    });

    it('should warn about missing DOI for APA journal articles', () => {
      const data = {
        ...baseData,
        journal: 'Test Journal',
        publicationDate: '2023'
      };
      const errors = validateReferenceForStyle(data, CitationStyle.APA);
      expect(errors.some(e => e.field === 'doi' && e.severity === 'warning')).toBe(true);
    });

    it('should require access date for MLA websites', () => {
      const data = {
        ...baseData,
        type: ReferenceType.WEBSITE,
        url: 'https://example.com'
      };
      const errors = validateReferenceForStyle(data, CitationStyle.MLA);
      expect(errors.some(e => e.field === 'accessDate')).toBe(true);
    });
  });

  describe('validateReference', () => {
    const validData: ReferenceFormData = {
      type: ReferenceType.JOURNAL_ARTICLE,
      title: 'Test Article',
      authors: [{ firstName: 'John', lastName: 'Doe' }],
      journal: 'Test Journal',
      publicationDate: '2023',
      tags: []
    };

    it('should return valid result for correct data', () => {
      const result = validateReference(validData, CitationStyle.APA);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result for incorrect data', () => {
      const data = { ...validData, title: '' };
      const result = validateReference(data, CitationStyle.APA);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should identify missing fields', () => {
      const data = { ...validData, journal: '' };
      const result = validateReference(data, CitationStyle.APA);
      expect(result.missingFields).toContain('journal');
    });
  });

  describe('getRequiredFields', () => {
    it('should return required fields for APA journal article', () => {
      const fields = getRequiredFields(ReferenceType.JOURNAL_ARTICLE, CitationStyle.APA);
      expect(fields).toContain('title');
      expect(fields).toContain('authors');
      expect(fields).toContain('journal');
      expect(fields).toContain('publicationDate');
    });

    it('should return required fields for MLA book', () => {
      const fields = getRequiredFields(ReferenceType.BOOK, CitationStyle.MLA);
      expect(fields).toContain('title');
      expect(fields).toContain('authors');
      expect(fields).toContain('publisher');
      expect(fields).toContain('publicationDate');
    });
  });

  describe('hasRequiredFields', () => {
    const validData: ReferenceFormData = {
      type: ReferenceType.JOURNAL_ARTICLE,
      title: 'Test Article',
      authors: [{ firstName: 'John', lastName: 'Doe' }],
      journal: 'Test Journal',
      publicationDate: '2023',
      tags: []
    };

    it('should return true for complete data', () => {
      const result = hasRequiredFields(validData, CitationStyle.APA);
      expect(result).toBe(true);
    });

    it('should return false for incomplete data', () => {
      const data = { ...validData, journal: '' };
      const result = hasRequiredFields(data, CitationStyle.APA);
      expect(result).toBe(false);
    });
  });

  describe('validateExistingReference', () => {
    const validReference: Reference = {
      id: '1',
      conversationId: 'conv1',
      type: ReferenceType.JOURNAL_ARTICLE,
      title: 'Test Article',
      authors: [{ firstName: 'John', lastName: 'Doe' }],
      publicationDate: new Date('2023-01-01'),
      journal: 'Test Journal',
      tags: [],
      metadataConfidence: 1.0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should validate existing reference', () => {
      const result = validateExistingReference(validReference, CitationStyle.APA);
      expect(result.isValid).toBe(true);
    });

    it('should handle missing publication date', () => {
      const reference = { ...validReference, publicationDate: undefined };
      const result = validateExistingReference(reference, CitationStyle.APA);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('publicationDate');
    });
  });
});