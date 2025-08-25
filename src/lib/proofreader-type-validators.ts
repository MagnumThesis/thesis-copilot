/**
 * Type validation utilities for proofreader functionality
 * Provides validation functions and helper utilities for proofreader types
 */

import {
  ConcernCategory,
  ConcernSeverity,
  ConcernStatus,
  type ContentLocation,
  type ProofreadingConcern,
  type AnalysisOptions,
  type ConcernStatusUpdate
} from './ai-types';

/**
 * @function isValidConcernCategory
 * @description Validate if a string is a valid ConcernCategory.
 * @param {any} value - The value to validate.
 * @returns {boolean} Whether the value is a valid ConcernCategory.
 */
export function isValidConcernCategory(value: any): value is ConcernCategory {
  return typeof value === 'string' && Object.values(ConcernCategory).includes(value as ConcernCategory);
}

/**
 * @function isValidConcernSeverity
 * @description Validate if a string is a valid ConcernSeverity.
 * @param {any} value - The value to validate.
 * @returns {boolean} Whether the value is a valid ConcernSeverity.
 */
export function isValidConcernSeverity(value: any): value is ConcernSeverity {
  return typeof value === 'string' && Object.values(ConcernSeverity).includes(value as ConcernSeverity);
}

/**
 * @function isValidConcernStatus
 * @description Validate if a string is a valid ConcernStatus.
 * @param {any} value - The value to validate.
 * @returns {boolean} Whether the value is a valid ConcernStatus.
 */
export function isValidConcernStatus(value: any): value is ConcernStatus {
  return typeof value === 'string' && Object.values(ConcernStatus).includes(value as ConcernStatus);
}

/**
 * @function isValidAcademicLevel
 * @description Validate if a string is a valid academic level.
 * @param {any} value - The value to validate.
 * @returns {boolean} Whether the value is a valid academic level.
 */
export function isValidAcademicLevel(value: any): value is 'undergraduate' | 'graduate' | 'doctoral' {
  return typeof value === 'string' && ['undergraduate', 'graduate', 'doctoral'].includes(value);
}

/**
 * @function isValidContentLocation
 * @description Validate if an object is a valid ContentLocation.
 * @param {any} value - The value to validate.
 * @returns {boolean} Whether the value is a valid ContentLocation.
 */
export function isValidContentLocation(value: any): value is ContentLocation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  // All fields are optional, so empty object is valid
  if (Object.keys(value).length === 0) {
    return true;
  }

  // Check each field if present
  if (value.section !== undefined && typeof value.section !== 'string') {
    return false;
  }
  if (value.paragraph !== undefined && typeof value.paragraph !== 'number') {
    return false;
  }
  if (value.startPosition !== undefined && typeof value.startPosition !== 'number') {
    return false;
  }
  if (value.endPosition !== undefined && typeof value.endPosition !== 'number') {
    return false;
  }
  if (value.context !== undefined && typeof value.context !== 'string') {
    return false;
  }

  return true;
}

/**
 * @function isValidProofreadingConcern
 * @description Validate if an object is a valid ProofreadingConcern.
 * @param {any} value - The value to validate.
 * @returns {boolean} Whether the value is a valid ProofreadingConcern.
 */
export function isValidProofreadingConcern(value: any): value is ProofreadingConcern {
  if (!value || typeof value !== 'object') {
    return false;
  }

  // Check required fields
  if (typeof value.id !== 'string' ||
      typeof value.conversationId !== 'string' ||
      !isValidConcernCategory(value.category) ||
      !isValidConcernSeverity(value.severity) ||
      typeof value.title !== 'string' ||
      typeof value.description !== 'string' ||
      !isValidConcernStatus(value.status) ||
      !(value.createdAt instanceof Date) ||
      !(value.updatedAt instanceof Date)) {
    return false;
  }

  // Check optional fields
  if (value.location !== undefined && !isValidContentLocation(value.location)) {
    return false;
  }
  if (value.suggestions !== undefined && !Array.isArray(value.suggestions)) {
    return false;
  }
  if (value.relatedIdeas !== undefined && !Array.isArray(value.relatedIdeas)) {
    return false;
  }

  return true;
}

/**
 * @function isValidAnalysisOptions
 * @description Validate if an object is valid AnalysisOptions.
 * @param {any} value - The value to validate.
 * @returns {boolean} Whether the value is valid AnalysisOptions.
 */
export function isValidAnalysisOptions(value: any): value is AnalysisOptions {
  if (!value || typeof value !== 'object') {
    return false;
  }

  // Check optional fields
  if (value.categories !== undefined) {
    if (!Array.isArray(value.categories) || 
        !value.categories.every((cat: any) => isValidConcernCategory(cat))) {
      return false;
    }
  }
  if (value.minSeverity !== undefined && !isValidConcernSeverity(value.minSeverity)) {
    return false;
  }
  if (value.includeGrammar !== undefined && typeof value.includeGrammar !== 'boolean') {
    return false;
  }
  if (value.academicLevel !== undefined && !isValidAcademicLevel(value.academicLevel)) {
    return false;
  }

  return true;
}

/**
 * @function isValidConcernStatusUpdate
 * @description Validate if an object is a valid ConcernStatusUpdate.
 * @param {any} value - The value to validate.
 * @returns {boolean} Whether the value is a valid ConcernStatusUpdate.
 */
export function isValidConcernStatusUpdate(value: any): value is ConcernStatusUpdate {
  if (!value || typeof value !== 'object') {
    return false;
  }

  // Check required fields
  if (typeof value.concernId !== 'string' || !isValidConcernStatus(value.status)) {
    return false;
  }

  // Check optional fields
  if (value.updatedBy !== undefined && typeof value.updatedBy !== 'string') {
    return false;
  }
  if (value.notes !== undefined && typeof value.notes !== 'string') {
    return false;
  }

  return true;
}

/**
 * @function createDefaultProofreadingConcern
 * @description Create a default ProofreadingConcern with required fields.
 * @param {string} id - The unique ID of the concern.
 * @param {string} conversationId - The ID of the conversation.
 * @param {ConcernCategory} category - The category of the concern.
 * @param {ConcernSeverity} severity - The severity of the concern.
 * @param {string} title - The title of the concern.
 * @param {string} description - The description of the concern.
 * @returns {ProofreadingConcern} The default ProofreadingConcern.
 */
export function createDefaultProofreadingConcern(
  id: string,
  conversationId: string,
  category: ConcernCategory,
  severity: ConcernSeverity,
  title: string,
  description: string
): ProofreadingConcern {
  return {
    id,
    conversationId,
    text: title,
    category,
    severity,
    title,
    description,
    suggestions: [],
    relatedIdeas: [],
    position: { start: 0, end: 0 },
    explanation: description,
    status: ConcernStatus.TO_BE_DONE,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * @function createDefaultAnalysisOptions
 * @description Create default AnalysisOptions.
 * @returns {AnalysisOptions} The default AnalysisOptions.
 */
export function createDefaultAnalysisOptions(): AnalysisOptions {
  return {
    categories: Object.values(ConcernCategory),
    minSeverity: ConcernSeverity.LOW,
    includeGrammar: true,
    academicLevel: 'graduate'
  };
}

/**
 * @function getAllConcernCategories
 * @description Get all concern categories.
 * @returns {ConcernCategory[]} An array of all concern categories.
 */
export function getAllConcernCategories(): ConcernCategory[] {
  return Object.values(ConcernCategory);
}

/**
 * @function getAllConcernSeverities
 * @description Get all concern severities.
 * @returns {ConcernSeverity[]} An array of all concern severities.
 */
export function getAllConcernSeverities(): ConcernSeverity[] {
  return Object.values(ConcernSeverity);
}

/**
 * @function getAllConcernStatuses
 * @description Get all concern statuses.
 * @returns {ConcernStatus[]} An array of all concern statuses.
 */
export function getAllConcernStatuses(): ConcernStatus[] {
  return Object.values(ConcernStatus);
}

/**
 * @function getConcernCategoryLabel
 * @description Get human-readable label for concern category.
 * @param {ConcernCategory} category - The concern category.
 * @returns {string} The human-readable label.
 */
export function getConcernCategoryLabel(category: ConcernCategory): string {
  const labels: Record<ConcernCategory, string> = {
    [ConcernCategory.CLARITY]: 'Clarity',
    [ConcernCategory.COHERENCE]: 'Coherence',
    [ConcernCategory.STRUCTURE]: 'Structure',
    [ConcernCategory.ACADEMIC_TONE]: 'Academic Tone',
    [ConcernCategory.CONSISTENCY]: 'Consistency',
    [ConcernCategory.COMPLETENESS]: 'Completeness',
    [ConcernCategory.CITATION]: 'Citations',
    [ConcernCategory.GRAMMAR]: 'Grammar',
    [ConcernCategory.STYLE]: 'Style',
    [ConcernCategory.TERMINOLOGY]: 'Terminology'
  };
  return labels[category];
}

/**
 * @function getConcernSeverityLabel
 * @description Get human-readable label for concern severity.
 * @param {ConcernSeverity} severity - The concern severity.
 * @returns {string} The human-readable label.
 */
export function getConcernSeverityLabel(severity: ConcernSeverity): string {
  const labels: Record<ConcernSeverity, string> = {
    [ConcernSeverity.LOW]: 'Low',
    [ConcernSeverity.MEDIUM]: 'Medium',
    [ConcernSeverity.HIGH]: 'High',
    [ConcernSeverity.CRITICAL]: 'Critical'
  };
  return labels[severity];
}

/**
 * @function getConcernStatusLabel
 * @description Get human-readable label for concern status.
 * @param {ConcernStatus} status - The concern status.
 * @returns {string} The human-readable label.
 */
export function getConcernStatusLabel(status: ConcernStatus): string {
  const labels: Record<ConcernStatus, string> = {
    [ConcernStatus.TO_BE_DONE]: 'To Be Done',
    [ConcernStatus.ADDRESSED]: 'Addressed',
    [ConcernStatus.REJECTED]: 'Rejected',
    [ConcernStatus.OPEN]: 'Open',
    [ConcernStatus.RESOLVED]: 'Resolved',
    [ConcernStatus.DISMISSED]: 'Dismissed'
  };
  return labels[status];
}