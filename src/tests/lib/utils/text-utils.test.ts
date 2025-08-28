import { describe, it, expect } from 'vitest';
import { simpleHash, truncateString, capitalizeFirstLetter, toKebabCase } from './text-utils';

describe('text-utils', () => {
  describe('simpleHash', () => {
    it('should return "0" for empty string', () => {
      expect(simpleHash('')).toBe('0');
    });

    it('should return consistent hash for the same string', () => {
      const str = 'test string';
      expect(simpleHash(str)).toBe(simpleHash(str));
    });

    it('should return different hashes for different strings', () => {
      expect(simpleHash('test1')).not.toBe(simpleHash('test2'));
    });
  });

  describe('truncateString', () => {
    it('should not truncate string shorter than max length', () => {
      const str = 'short';
      expect(truncateString(str, 10)).toBe(str);
    });

    it('should truncate string longer than max length', () => {
      const str = 'this is a long string';
      expect(truncateString(str, 10)).toBe('this is...');
    });

    it('should use custom ellipsis', () => {
      const str = 'this is a long string';
      expect(truncateString(str, 10, '###')).toBe('this is###');
    });
  });

  describe('capitalizeFirstLetter', () => {
    it('should capitalize the first letter of a string', () => {
      expect(capitalizeFirstLetter('test')).toBe('Test');
    });

    it('should handle empty string', () => {
      expect(capitalizeFirstLetter('')).toBe('');
    });

    it('should not change already capitalized string', () => {
      expect(capitalizeFirstLetter('Test')).toBe('Test');
    });
  });

  describe('toKebabCase', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(toKebabCase('camelCase')).toBe('camel-case');
    });

    it('should convert spaces to hyphens', () => {
      expect(toKebabCase('space separated')).toBe('space-separated');
    });

    it('should convert underscores to hyphens', () => {
      expect(toKebabCase('underscore_separated')).toBe('underscore-separated');
    });

    it('should handle mixed cases', () => {
      expect(toKebabCase('camelCase with spaces_and_underscores')).toBe('camel-case-with-spaces-and-underscores');
    });

    it('should convert to lowercase', () => {
      expect(toKebabCase('UPPERCASE')).toBe('uppercase');
    });
  });
});