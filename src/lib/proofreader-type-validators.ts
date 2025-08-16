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
 * Validate if a string is a valid ConcernCategory
 */
export function isValidConcernCategory(value: any): value is ConcernCategory {
  return typeof value === 'string' && Object.values(ConcernCategory).includes(value as ConcernCategory);
}

/**
 * Validate if a string is a valid ConcernSeverity
 */
export function isValidConcernSeverity(value: any): value is ConcernSeverity {
  return typeof value === 'string' && Object.values(ConcernSeverity).includes(value as ConcernSeverity);
}

/**
 * Validate if a string is a valid ConcernStatus
 */
export function isValidConcernStatus(value: any): value is ConcernStatus {
  return typeof value === 'string' && Object.values(ConcernStatus).includes(value as ConcernStatus);
}

/**
 * Validate if a string is a valid academic level
 */
export function isValidAcademicLevel(value: any): value is 'undergraduate' | 'graduate' | 'doctoral' {
  return typeof value === 'string' && ['undergraduate', 'graduate', 'doctoral'].includes(value);
}

/**
 * Validate if an object is a valid ContentLocation
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
 * Validate if an object is a valid ProofreadingConcern
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
 * Validate if an object is valid AnalysisOptions
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
 * Validate if an object is a valid ConcernStatusUpdate
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
 * Create a default ProofreadingConcern with required fields
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
    category,
    severity,
    title,
    description,
    status: ConcernStatus.TO_BE_DONE,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create default AnalysisOptions
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
 * Get all concern categories
 */
export function getAllConcernCategories(): ConcernCategory[] {
  return Object.values(ConcernCategory);
}

/**
 * Get all concern severities
 */
export function getAllConcernSeverities(): ConcernSeverity[] {
  return Object.values(ConcernSeverity);
}

/**
 * Get all concern statuses
 */
export function getAllConcernStatuses(): ConcernStatus[] {
  return Object.values(ConcernStatus);
}

/**
 * Get human-readable label for concern category
 */
export function getConcernCategoryLabel(category: ConcernCategory): string {
  const labels: Record<ConcernCategory, string> = {
    [ConcernCategory.CLARITY]: 'Clarity',
    [ConcernCategory.COHERENCE]: 'Coherence',
    [ConcernCategory.STRUCTURE]: 'Structure',
    [ConcernCategory.ACADEMIC_STYLE]: 'Academic Style',
    [ConcernCategory.CONSISTENCY]: 'Consistency',
    [ConcernCategory.COMPLETENESS]: 'Completeness',
    [ConcernCategory.CITATIONS]: 'Citations',
    [ConcernCategory.GRAMMAR]: 'Grammar',
    [ConcernCategory.TERMINOLOGY]: 'Terminology'
  };
  return labels[category];
}

/**
 * Get human-readable label for concern severity
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
 * Get human-readable label for concern status
 */
export function getConcernStatusLabel(status: ConcernStatus): string {
  const labels: Record<ConcernStatus, string> = {
    [ConcernStatus.TO_BE_DONE]: 'To Be Done',
    [ConcernStatus.ADDRESSED]: 'Addressed',
    [ConcernStatus.REJECTED]: 'Rejected'
  };
  return labels[status];
}