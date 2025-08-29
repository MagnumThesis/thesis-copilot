/**
 * Unit tests for AuthorFormatter
 */

import { describe, it, expect } from 'vitest';
import { AuthorFormatter } from '../author-formatter';
import type { Author } from '../../../types/citation-types/author-types';

describe('AuthorFormatter', () => {
  const sampleAuthor: Author = {
    firstName: 'John',
    lastName: 'Smith',
    middleName: 'David',
    suffix: 'Jr.'
  };

  const simpleAuthor: Author = {
    firstName: 'Jane',
    lastName: 'Doe'
  };

  const multipleAuthors: Author[] = [
    { firstName: 'John', lastName: 'Smith' },
    { firstName: 'Jane', lastName: 'Doe' },
    { firstName: 'Bob', lastName: 'Johnson' }
  ];

  describe('formatMLA', () => {
    it('should format first author for bibliography', () => {
      const result = AuthorFormatter.formatMLA(sampleAuthor, true, false);
      expect(result).toBe('Smith, John David, Jr.');
    });

    it('should format subsequent author for bibliography', () => {
      const result = AuthorFormatter.formatMLA(sampleAuthor, false, false);
      expect(result).toBe('John David Smith, Jr.');
    });

    it('should format author for inline citation', () => {
      const result = AuthorFormatter.formatMLA(sampleAuthor, true, true);
      expect(result).toBe('Smith');
    });

    it('should handle author without middle name or suffix', () => {
      const result = AuthorFormatter.formatMLA(simpleAuthor, true, false);
      expect(result).toBe('Doe, Jane');
    });
  });

  describe('formatAPA', () => {
    it('should format author for bibliography', () => {
      const result = AuthorFormatter.formatAPA(sampleAuthor, false);
      expect(result).toBe('Smith, J. D., Jr.');
    });

    it('should format author for inline citation', () => {
      const result = AuthorFormatter.formatAPA(sampleAuthor, true);
      expect(result).toBe('Smith');
    });

    it('should handle author without middle name', () => {
      const result = AuthorFormatter.formatAPA(simpleAuthor, false);
      expect(result).toBe('Doe, J.');
    });
  });

  describe('formatChicago', () => {
    it('should format first author for bibliography', () => {
      const result = AuthorFormatter.formatChicago(sampleAuthor, true, false);
      expect(result).toBe('Smith, John David, Jr.');
    });

    it('should format subsequent author for bibliography', () => {
      const result = AuthorFormatter.formatChicago(sampleAuthor, false, false);
      expect(result).toBe('John David Smith, Jr.');
    });

    it('should format author for inline citation', () => {
      const result = AuthorFormatter.formatChicago(sampleAuthor, true, true);
      expect(result).toBe('Smith');
    });
  });

  describe('formatHarvard', () => {
    it('should format author for bibliography (same as APA)', () => {
      const result = AuthorFormatter.formatHarvard(sampleAuthor, false);
      expect(result).toBe('Smith, J. D., Jr.');
    });

    it('should format author for inline citation', () => {
      const result = AuthorFormatter.formatHarvard(sampleAuthor, true);
      expect(result).toBe('Smith');
    });
  });

  describe('formatMultipleMLA', () => {
    it('should format single author for bibliography', () => {
      const result = AuthorFormatter.formatMultipleMLA([sampleAuthor], false);
      expect(result).toBe('Smith, John David, Jr.');
    });

    it('should format two authors for bibliography', () => {
      const twoAuthors = multipleAuthors.slice(0, 2);
      const result = AuthorFormatter.formatMultipleMLA(twoAuthors, false);
      expect(result).toBe('Smith, John, and Jane Doe');
    });

    it('should format three or more authors for bibliography', () => {
      const result = AuthorFormatter.formatMultipleMLA(multipleAuthors, false);
      expect(result).toBe('Smith, John, Jane Doe, and Bob Johnson');
    });

    it('should format single author for inline citation', () => {
      const result = AuthorFormatter.formatMultipleMLA([sampleAuthor], true);
      expect(result).toBe('Smith');
    });

    it('should format two authors for inline citation', () => {
      const twoAuthors = multipleAuthors.slice(0, 2);
      const result = AuthorFormatter.formatMultipleMLA(twoAuthors, true);
      expect(result).toBe('Smith and Doe');
    });

    it('should format three or more authors for inline citation with et al.', () => {
      const result = AuthorFormatter.formatMultipleMLA(multipleAuthors, true);
      expect(result).toBe('Smith et al.');
    });

    it('should handle empty author array', () => {
      const result = AuthorFormatter.formatMultipleMLA([], false);
      expect(result).toBe('');
    });
  });

  describe('formatMultipleAPA', () => {
    it('should format single author for bibliography', () => {
      const result = AuthorFormatter.formatMultipleAPA([sampleAuthor], false);
      expect(result).toBe('Smith, J. D., Jr.');
    });

    it('should format two authors for bibliography', () => {
      const twoAuthors = multipleAuthors.slice(0, 2);
      const result = AuthorFormatter.formatMultipleAPA(twoAuthors, false);
      expect(result).toBe('Smith, J., & Doe, J.');
    });

    it('should format multiple authors for bibliography (up to 20)', () => {
      const result = AuthorFormatter.formatMultipleAPA(multipleAuthors, false);
      expect(result).toBe('Smith, J., Doe, J., & Johnson, B.');
    });

    it('should format single author for inline citation', () => {
      const result = AuthorFormatter.formatMultipleAPA([sampleAuthor], true);
      expect(result).toBe('Smith');
    });

    it('should format two authors for inline citation', () => {
      const twoAuthors = multipleAuthors.slice(0, 2);
      const result = AuthorFormatter.formatMultipleAPA(twoAuthors, true);
      expect(result).toBe('Smith & Doe');
    });

    it('should format up to 5 authors for inline citation', () => {
      const result = AuthorFormatter.formatMultipleAPA(multipleAuthors, true);
      expect(result).toBe('Smith, Doe, & Johnson');
    });

    it('should format 6+ authors for inline citation with et al.', () => {
      const manyAuthors = [
        ...multipleAuthors,
        { firstName: 'Alice', lastName: 'Brown' },
        { firstName: 'Charlie', lastName: 'Wilson' },
        { firstName: 'David', lastName: 'Taylor' }
      ];
      const result = AuthorFormatter.formatMultipleAPA(manyAuthors, true);
      expect(result).toBe('Smith et al.');
    });

    it('should handle 21+ authors for bibliography with ellipsis', () => {
      const manyAuthors = Array.from({ length: 22 }, (_, i) => ({
        firstName: `Author${i + 1}`,
        lastName: `Last${i + 1}`
      }));
      const result = AuthorFormatter.formatMultipleAPA(manyAuthors, false);
      expect(result).toContain('...');
      expect(result).toContain('Last22, A.');
    });

    it('should handle empty author array', () => {
      const result = AuthorFormatter.formatMultipleAPA([], false);
      expect(result).toBe('');
    });
  });

  describe('formatMultipleChicago', () => {
    it('should format single author for bibliography', () => {
      const result = AuthorFormatter.formatMultipleChicago([sampleAuthor], false);
      expect(result).toBe('Smith, John David, Jr.');
    });

    it('should format two authors for bibliography', () => {
      const twoAuthors = multipleAuthors.slice(0, 2);
      const result = AuthorFormatter.formatMultipleChicago(twoAuthors, false);
      expect(result).toBe('Smith, John, and Jane Doe');
    });

    it('should format three or more authors for inline citation with et al.', () => {
      const result = AuthorFormatter.formatMultipleChicago(multipleAuthors, true);
      expect(result).toBe('Smith et al.');
    });
  });

  describe('formatMultipleHarvard', () => {
    it('should use APA formatting', () => {
      const result = AuthorFormatter.formatMultipleHarvard(multipleAuthors, false);
      const apaResult = AuthorFormatter.formatMultipleAPA(multipleAuthors, false);
      expect(result).toBe(apaResult);
    });
  });
});
