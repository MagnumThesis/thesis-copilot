import { describe, it, expect } from 'vitest';
import { validateTextSelection, validateRequiredFields } from './ai-validation-utils';

describe('ai-validation-utils', () => {
  describe('validateTextSelection', () => {
    it('should return false for null selection', () => {
      expect(validateTextSelection(null)).toBe(false);
    });

    it('should return false for empty text', () => {
      expect(validateTextSelection({ text: '', start: 0, end: 0 })).toBe(false);
    });

    it('should return false for whitespace-only text', () => {
      expect(validateTextSelection({ text: '   ', start: 0, end: 3 })).toBe(false);
    });

    it('should return false for text shorter than 3 characters', () => {
      expect(validateTextSelection({ text: 'ab', start: 0, end: 2 })).toBe(false);
    });

    it('should return false for text longer than 5000 characters', () => {
      const longText = 'a'.repeat(5001);
      expect(validateTextSelection({ text: longText, start: 0, end: 5001 })).toBe(false);
    });

    it('should return true for valid text selection', () => {
      expect(validateTextSelection({ text: 'valid text', start: 0, end: 10 })).toBe(true);
    });
  });

  describe('validateRequiredFields', () => {
    it('should not throw an error when all required fields are present', () => {
      const obj = { field1: 'value1', field2: 'value2', field3: 'value3' };
      expect(() => validateRequiredFields(obj, ['field1', 'field2'])).not.toThrow();
    });

    it('should throw an error when a required field is missing', () => {
      const obj = { field1: 'value1', field2: 'value2' };
      expect(() => validateRequiredFields(obj, ['field1', 'field3'])).toThrow('Missing required field: field3');
    });

    it('should throw an error when a required field is undefined', () => {
      const obj = { field1: 'value1', field2: undefined };
      expect(() => validateRequiredFields(obj, ['field1', 'field2'])).toThrow('Missing required field: field2');
    });

    it('should throw an error when a required field is null', () => {
      const obj = { field1: 'value1', field2: null };
      expect(() => validateRequiredFields(obj, ['field1', 'field2'])).toThrow('Missing required field: field2');
    });
  });
});