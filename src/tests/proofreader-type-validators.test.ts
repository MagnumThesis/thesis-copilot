/**
 * Unit tests for proofreader type validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  isValidConcernCategory,
  isValidConcernSeverity,
  isValidConcernStatus,
  isValidAcademicLevel,
  isValidContentLocation,
  isValidProofreadingConcern,
  isValidAnalysisOptions,
  isValidConcernStatusUpdate,
  createDefaultProofreadingConcern,
  createDefaultAnalysisOptions,
  getAllConcernCategories,
  getAllConcernSeverities,
  getAllConcernStatuses,
  getConcernCategoryLabel,
  getConcernSeverityLabel,
  getConcernStatusLabel
} from '../lib/proofreader-type-validators';
import {
  ConcernCategory,
  ConcernSeverity,
  ConcernStatus
} from '../lib/ai-types';

describe('Type Validation Functions', () => {
  describe('isValidConcernCategory', () => {
    it('should return true for valid concern categories', () => {
      expect(isValidConcernCategory('clarity')).toBe(true);
      expect(isValidConcernCategory('structure')).toBe(true);
      expect(isValidConcernCategory('grammar')).toBe(true);
    });

    it('should return false for invalid concern categories', () => {
      expect(isValidConcernCategory('invalid')).toBe(false);
      expect(isValidConcernCategory('')).toBe(false);
      expect(isValidConcernCategory('CLARITY')).toBe(false); // case sensitive
    });
  });

  describe('isValidConcernSeverity', () => {
    it('should return true for valid concern severities', () => {
      expect(isValidConcernSeverity('low')).toBe(true);
      expect(isValidConcernSeverity('medium')).toBe(true);
      expect(isValidConcernSeverity('high')).toBe(true);
      expect(isValidConcernSeverity('critical')).toBe(true);
    });

    it('should return false for invalid concern severities', () => {
      expect(isValidConcernSeverity('invalid')).toBe(false);
      expect(isValidConcernSeverity('LOW')).toBe(false); // case sensitive
      expect(isValidConcernSeverity('')).toBe(false);
    });
  });

  describe('isValidConcernStatus', () => {
    it('should return true for valid concern statuses', () => {
      expect(isValidConcernStatus('to_be_done')).toBe(true);
      expect(isValidConcernStatus('addressed')).toBe(true);
      expect(isValidConcernStatus('rejected')).toBe(true);
    });

    it('should return false for invalid concern statuses', () => {
      expect(isValidConcernStatus('invalid')).toBe(false);
      expect(isValidConcernStatus('done')).toBe(false);
      expect(isValidConcernStatus('')).toBe(false);
    });
  });

  describe('isValidAcademicLevel', () => {
    it('should return true for valid academic levels', () => {
      expect(isValidAcademicLevel('undergraduate')).toBe(true);
      expect(isValidAcademicLevel('graduate')).toBe(true);
      expect(isValidAcademicLevel('doctoral')).toBe(true);
    });

    it('should return false for invalid academic levels', () => {
      expect(isValidAcademicLevel('invalid')).toBe(false);
      expect(isValidAcademicLevel('phd')).toBe(false);
      expect(isValidAcademicLevel('')).toBe(false);
    });
  });

  describe('isValidContentLocation', () => {
    it('should return true for valid content location objects', () => {
      expect(isValidContentLocation({})).toBe(true); // empty object is valid
      expect(isValidContentLocation({
        section: 'Introduction',
        paragraph: 1,
        startPosition: 100,
        endPosition: 200,
        context: 'Some context'
      })).toBe(true);
      expect(isValidContentLocation({
        section: 'Introduction'
      })).toBe(true); // partial object is valid
    });

    it('should return false for invalid content location objects', () => {
      expect(isValidContentLocation(null)).toBe(false);
      expect(isValidContentLocation('string')).toBe(false);
      expect(isValidContentLocation({
        section: 123 // should be string
      })).toBe(false);
      expect(isValidContentLocation({
        paragraph: 'not a number'
      })).toBe(false);
    });
  });

  describe('isValidProofreadingConcern', () => {
    it('should return true for valid proofreading concern objects', () => {
      const validConcern = {
        id: 'concern-123',
        conversationId: 'conv-456',
        category: ConcernCategory.CLARITY,
        severity: ConcernSeverity.MEDIUM,
        title: 'Test concern',
        description: 'Test description',
        status: ConcernStatus.TO_BE_DONE,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      expect(isValidProofreadingConcern(validConcern)).toBe(true);
    });

    it('should return false for invalid proofreading concern objects', () => {
      expect(isValidProofreadingConcern(null)).toBe(false);
      expect(isValidProofreadingConcern({})).toBe(false); // missing required fields
      expect(isValidProofreadingConcern({
        id: 123, // should be string
        conversationId: 'conv-456',
        category: ConcernCategory.CLARITY,
        severity: ConcernSeverity.MEDIUM,
        title: 'Test concern',
        description: 'Test description',
        status: ConcernStatus.TO_BE_DONE,
        createdAt: new Date(),
        updatedAt: new Date()
      })).toBe(false);
    });
  });

  describe('isValidAnalysisOptions', () => {
    it('should return true for valid analysis options', () => {
      expect(isValidAnalysisOptions({})).toBe(true); // empty object is valid
      expect(isValidAnalysisOptions({
        categories: [ConcernCategory.CLARITY, ConcernCategory.STRUCTURE],
        minSeverity: ConcernSeverity.MEDIUM,
        includeGrammar: true,
        academicLevel: 'graduate'
      })).toBe(true);
    });

    it('should return false for invalid analysis options', () => {
      expect(isValidAnalysisOptions(null)).toBe(false);
      expect(isValidAnalysisOptions({
        categories: ['invalid_category'] // invalid category
      })).toBe(false);
      expect(isValidAnalysisOptions({
        minSeverity: 'invalid_severity' // invalid severity
      })).toBe(false);
      expect(isValidAnalysisOptions({
        includeGrammar: 'not_boolean' // should be boolean
      })).toBe(false);
    });
  });

  describe('isValidConcernStatusUpdate', () => {
    it('should return true for valid concern status updates', () => {
      expect(isValidConcernStatusUpdate({
        concernId: 'concern-123',
        status: ConcernStatus.ADDRESSED
      })).toBe(true);
      expect(isValidConcernStatusUpdate({
        concernId: 'concern-123',
        status: ConcernStatus.ADDRESSED,
        updatedBy: 'user-456',
        notes: 'Fixed the issue'
      })).toBe(true);
    });

    it('should return false for invalid concern status updates', () => {
      expect(isValidConcernStatusUpdate(null)).toBe(false);
      expect(isValidConcernStatusUpdate({})).toBe(false); // missing required fields
      expect(isValidConcernStatusUpdate({
        concernId: 123, // should be string
        status: ConcernStatus.ADDRESSED
      })).toBe(false);
      expect(isValidConcernStatusUpdate({
        concernId: 'concern-123',
        status: 'invalid_status' // invalid status
      })).toBe(false);
    });
  });
});

describe('Helper Functions', () => {
  describe('createDefaultProofreadingConcern', () => {
    it('should create a valid proofreading concern with default values', () => {
      const concern = createDefaultProofreadingConcern(
        'concern-123',
        'conv-456',
        ConcernCategory.CLARITY,
        ConcernSeverity.MEDIUM,
        'Test concern',
        'Test description'
      );

      expect(concern.id).toBe('concern-123');
      expect(concern.conversationId).toBe('conv-456');
      expect(concern.category).toBe(ConcernCategory.CLARITY);
      expect(concern.severity).toBe(ConcernSeverity.MEDIUM);
      expect(concern.title).toBe('Test concern');
      expect(concern.description).toBe('Test description');
      expect(concern.status).toBe(ConcernStatus.TO_BE_DONE);
      expect(concern.createdAt).toBeInstanceOf(Date);
      expect(concern.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('createDefaultAnalysisOptions', () => {
    it('should create valid analysis options with default values', () => {
      const options = createDefaultAnalysisOptions();

      expect(options.categories).toEqual(Object.values(ConcernCategory));
      expect(options.minSeverity).toBe(ConcernSeverity.LOW);
      expect(options.includeGrammar).toBe(true);
      expect(options.academicLevel).toBe('graduate');
    });
  });

  describe('getAllConcernCategories', () => {
    it('should return all concern categories', () => {
      const categories = getAllConcernCategories();
      expect(categories).toHaveLength(9);
      expect(categories).toContain(ConcernCategory.CLARITY);
      expect(categories).toContain(ConcernCategory.STRUCTURE);
      expect(categories).toContain(ConcernCategory.GRAMMAR);
    });
  });

  describe('getAllConcernSeverities', () => {
    it('should return all concern severities', () => {
      const severities = getAllConcernSeverities();
      expect(severities).toHaveLength(4);
      expect(severities).toContain(ConcernSeverity.LOW);
      expect(severities).toContain(ConcernSeverity.MEDIUM);
      expect(severities).toContain(ConcernSeverity.HIGH);
      expect(severities).toContain(ConcernSeverity.CRITICAL);
    });
  });

  describe('getAllConcernStatuses', () => {
    it('should return all concern statuses', () => {
      const statuses = getAllConcernStatuses();
      expect(statuses).toHaveLength(3);
      expect(statuses).toContain(ConcernStatus.TO_BE_DONE);
      expect(statuses).toContain(ConcernStatus.ADDRESSED);
      expect(statuses).toContain(ConcernStatus.REJECTED);
    });
  });
});

describe('Label Functions', () => {
  describe('getConcernCategoryLabel', () => {
    it('should return human-readable labels for concern categories', () => {
      expect(getConcernCategoryLabel(ConcernCategory.CLARITY)).toBe('Clarity');
      expect(getConcernCategoryLabel(ConcernCategory.ACADEMIC_STYLE)).toBe('Academic Style');
      expect(getConcernCategoryLabel(ConcernCategory.TERMINOLOGY)).toBe('Terminology');
    });
  });

  describe('getConcernSeverityLabel', () => {
    it('should return human-readable labels for concern severities', () => {
      expect(getConcernSeverityLabel(ConcernSeverity.LOW)).toBe('Low');
      expect(getConcernSeverityLabel(ConcernSeverity.MEDIUM)).toBe('Medium');
      expect(getConcernSeverityLabel(ConcernSeverity.HIGH)).toBe('High');
      expect(getConcernSeverityLabel(ConcernSeverity.CRITICAL)).toBe('Critical');
    });
  });

  describe('getConcernStatusLabel', () => {
    it('should return human-readable labels for concern statuses', () => {
      expect(getConcernStatusLabel(ConcernStatus.TO_BE_DONE)).toBe('To Be Done');
      expect(getConcernStatusLabel(ConcernStatus.ADDRESSED)).toBe('Addressed');
      expect(getConcernStatusLabel(ConcernStatus.REJECTED)).toBe('Rejected');
    });
  });
});