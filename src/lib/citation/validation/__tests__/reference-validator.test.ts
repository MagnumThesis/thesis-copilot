/**
 * Tests for Reference Validator Module
 */

import { describe, it, expect } from 'vitest';
import { ReferenceValidator } from '../reference-validator';
import { ReferenceType } from '../../../types/citation-types/reference-types';

describe('ReferenceValidator', () => {
  const sampleReference = {
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
    url: 'https://example.com/paper',
    doi: '10.1234/example.doi',
    isbn: '978-3-16-148410-0',
    abstract: 'This paper explores machine learning applications.',
    tags: [],
    metadata_confidence: 0.95,
    ai_confidence: 0.9,
    ai_relevance_score: 0.85,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  describe('validateReferenceFields', () => {
    it('should validate a complete reference', () => {
      const result = ReferenceValidator.validateReferenceFields(sampleReference);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid DOI format', () => {
      const invalidRef = { ...sampleReference, doi: 'invalid-doi' };
      const result = ReferenceValidator.validateReferenceFields(invalidRef);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('doi');
      expect(result.errors[0].message).toContain('Invalid DOI format');
    });

    it('should validate correct DOI formats', () => {
      const doiFormats = [
        '10.1234/example.doi',
        '10.1038/nature12373',
        '10.1109/ICCV.2019.00123',
        'doi:10.1234/example',
        'https://doi.org/10.1234/example'
      ];

      doiFormats.forEach(doi => {
        const ref = { ...sampleReference, doi };
        const result = ReferenceValidator.validateReferenceFields(ref);
        expect(result.isValid).toBe(true);
      });
    });

    it('should detect invalid URL format', () => {
      const invalidRef = { ...sampleReference, url: 'not-a-url' };
      const result = ReferenceValidator.validateReferenceFields(invalidRef);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('url');
      expect(result.errors[0].message).toContain('Invalid URL format');
    });

    it('should validate correct URL formats', () => {
      const urlFormats = [
        'https://example.com',
        'http://example.com/path',
        'https://subdomain.example.com/path?query=value',
        'ftp://files.example.com/file.pdf'
      ];

      urlFormats.forEach(url => {
        const ref = { ...sampleReference, url };
        const result = ReferenceValidator.validateReferenceFields(ref);
        expect(result.isValid).toBe(true);
      });
    });

    it('should detect invalid ISBN format', () => {
      const invalidRef = { ...sampleReference, isbn: '123-invalid-isbn' };
      const result = ReferenceValidator.validateReferenceFields(invalidRef);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('isbn');
      expect(result.errors[0].message).toContain('Invalid ISBN format');
    });

    it('should validate correct ISBN formats', () => {
      const isbnFormats = [
        '978-3-16-148410-0',
        '9783161484100',
        '3-16-148410-X',
        '316148410X',
        'ISBN 978-3-16-148410-0',
        'ISBN-13: 978-3-16-148410-0'
      ];

      isbnFormats.forEach(isbn => {
        const ref = { ...sampleReference, isbn };
        const result = ReferenceValidator.validateReferenceFields(ref);
        expect(result.isValid).toBe(true);
      });
    });

    it('should detect invalid author format', () => {
      const invalidRef = {
        ...sampleReference,
        authors: [{ firstName: '', lastName: 'Smith' }]
      };
      const result = ReferenceValidator.validateReferenceFields(invalidRef);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('authors[0].firstName');
      expect(result.errors[0].message).toContain('Author 1 is missing first name');
    });

    it('should handle empty fields gracefully', () => {
      const refWithEmptyFields = {
        ...sampleReference,
        doi: '',
        isbn: '',
        url: ''
      };
      const result = ReferenceValidator.validateReferenceFields(refWithEmptyFields);
      expect(result.isValid).toBe(true);
    });

    it('should handle undefined optional fields', () => {
      const refWithUndefinedFields = {
        ...sampleReference,
        doi: undefined,
        isbn: undefined,
        volume: undefined,
        issue: undefined
      };
      const result = ReferenceValidator.validateReferenceFields(refWithUndefinedFields);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateReferenceCompleteness', () => {
    it('should rate a complete reference as highly complete', () => {
      const result = ReferenceValidator.validateReferenceCompleteness(sampleReference);
      expect(result.completenessScore).toBeGreaterThan(0.8);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should identify missing critical fields', () => {
      const incompleteRef = {
        ...sampleReference,
        title: '',
        authors: []
      };
      const result = ReferenceValidator.validateReferenceCompleteness(incompleteRef);
      expect(result.completenessScore).toBeLessThan(0.5);
      expect(result.missingFields).toContain('title');
      expect(result.missingFields).toContain('authors');
    });

    it('should suggest improvements for incomplete references', () => {
      const incompleteRef = {
        ...sampleReference,
        doi: '',
        volume: '',
        issue: ''
      };
      const result = ReferenceValidator.validateReferenceCompleteness(incompleteRef);
      expect(result.suggestions).toContain('Consider adding DOI for better citation accuracy');
      expect(result.suggestions).toContain('Volume and issue numbers improve citation quality');
    });

    it('should handle different reference types appropriately', () => {
      const bookRef = {
        ...sampleReference,
        type: ReferenceType.BOOK,
        publisher: 'Academic Press',
        journal: ''
      };
      const result = ReferenceValidator.validateReferenceCompleteness(bookRef);
      expect(result.missingFields).not.toContain('journal');
    });

    it('should provide different weights for different reference types', () => {
      const websiteRef = {
        ...sampleReference,
        type: ReferenceType.WEBSITE,
        journal: '',
        volume: '',
        accessDate: new Date('2023-09-10')
      };
      const result = ReferenceValidator.validateReferenceCompleteness(websiteRef);
      expect(result.missingFields).not.toContain('volume');
      expect(result.missingFields).not.toContain('journal');
    });
  });

  describe('detectDuplicateReferences', () => {
    const reference1 = {
      ...sampleReference,
      id: 'ref1',
      title: 'Machine Learning in Academic Research',
      doi: '' // Remove DOI to test other duplicate detection methods
    };

    const reference2 = {
      ...sampleReference,
      id: 'ref2',
      title: 'Deep Learning Applications'
    };

    const reference3 = {
      ...sampleReference,
      id: 'ref3',
      title: 'Machine Learning in Academic Research', // Same title as ref1
      authors: [{ firstName: 'John', lastName: 'Smith' }] // Same author
    };

    it('should detect exact title duplicates', () => {
      const references = [reference1, reference2, reference3];
      const duplicates = ReferenceValidator.detectDuplicateReferences(references);
      
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].references).toContain('ref1');
      expect(duplicates[0].references).toContain('ref3');
      expect(duplicates[0].reason).toContain('identical title');
    });

    it('should detect DOI duplicates', () => {
      const ref1WithDOI = {
        ...reference1,
        doi: '10.1234/shared.doi'
      };
      const refWithSameDOI = {
        ...reference2,
        doi: '10.1234/shared.doi'
      };
      const references = [ref1WithDOI, refWithSameDOI];
      const duplicates = ReferenceValidator.detectDuplicateReferences(references);
      
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].reason).toContain('same DOI');
    });

    it('should detect similar titles', () => {
      const similarTitleRef = {
        ...reference2,
        title: 'Machine Learning in Academic Research Applications',
        doi: '' // Remove DOI to test title similarity
      };
      const references = [reference1, similarTitleRef];
      const duplicates = ReferenceValidator.detectDuplicateReferences(references);
      
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].reason).toContain('similar title');
    });

    it('should handle empty references list', () => {
      const duplicates = ReferenceValidator.detectDuplicateReferences([]);
      expect(duplicates).toHaveLength(0);
    });

    it('should handle single reference', () => {
      const duplicates = ReferenceValidator.detectDuplicateReferences([reference1]);
      expect(duplicates).toHaveLength(0);
    });

    it('should not flag completely different references', () => {
      const differentRef = {
        ...sampleReference,
        id: 'ref_different',
        title: 'Quantum Computing Fundamentals',
        authors: [{ firstName: 'Alice', lastName: 'Johnson' }],
        doi: '10.9876/different.doi'
      };
      const references = [reference1, differentRef];
      const duplicates = ReferenceValidator.detectDuplicateReferences(references);
      
      expect(duplicates).toHaveLength(0);
    });
  });

  describe('Database Schema Compatibility', () => {
    it('should handle legacy publication_date property', () => {
      const legacyRef = {
        ...sampleReference,
        publicationDate: undefined,
        publication_date: '2023-05-15'
      };
      const result = ReferenceValidator.validateReferenceFields(legacyRef);
      expect(result.isValid).toBe(true);
    });

    it('should handle legacy access_date property', () => {
      const legacyRef = {
        ...sampleReference,
        accessDate: undefined,
        access_date: '2023-09-10'
      };
      const result = ReferenceValidator.validateReferenceFields(legacyRef);
      expect(result.isValid).toBe(true);
    });

    it('should use new properties over legacy ones when both exist', () => {
      const refWithBoth = {
        ...sampleReference,
        publicationDate: new Date('2023-01-01'),
        publication_date: new Date('2022-01-01')
      };
      const result = ReferenceValidator.validateReferenceCompleteness(refWithBoth);
      expect(result.completenessScore).toBeGreaterThan(0.8);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null reference gracefully', () => {
      const result = ReferenceValidator.validateReferenceFields(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Reference object is null or undefined');
    });

    it('should handle undefined reference gracefully', () => {
      const result = ReferenceValidator.validateReferenceFields(undefined as any);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Reference object is null or undefined');
    });

    it('should handle empty reference object', () => {
      const emptyRef = {} as any;
      const result = ReferenceValidator.validateReferenceFields(emptyRef);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle very long strings', () => {
      const longTitle = 'A'.repeat(10000);
      const refWithLongTitle = { ...sampleReference, title: longTitle };
      const result = ReferenceValidator.validateReferenceFields(refWithLongTitle);
      expect(result.isValid).toBe(true); // Should not fail validation
    });

    it('should handle special characters in fields', () => {
      const specialCharsRef = {
        ...sampleReference,
        title: 'Title with émojis 🔬 and spéciäl cháracters',
        authors: [{ firstName: 'José', lastName: 'García-López' }]
      };
      const result = ReferenceValidator.validateReferenceFields(specialCharsRef);
      expect(result.isValid).toBe(true);
    });
  });
});
