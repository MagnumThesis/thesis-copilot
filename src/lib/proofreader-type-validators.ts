/**
 * Type validation utilities for proofreader types
 * Provides runtime validation functions for proofreader data types
 */

import {
  ConcernCategory,
  ConcernSeverity,
  ConcernStatus,
  type ProofreadingConcern,
  type ContentLocation,
  type AnalysisOptions,
  type ProofreaderAnalysisRequest,
  type ConcernStatusUpdate
} from './ai-types';

/**
 * Validates if a string is a valid ConcernCategory
 */
export function isValidConcernCategory(value: string): value is ConcernCategory {
  return Object.values(ConcernCategory).includes(value as ConcernCategory);
}

/**
 * Validates if a string is a valid ConcernSeverity
 */
export function isValidConcernSeverity(value: string): value is ConcernSeverity {
  return Object.values(ConcernSeverity).includes(value as ConcernSeverity);
}

/**
 * Validates if a string is a valid ConcernStatus
 */
export function isValidConcernStatus(value: string): value is ConcernStatus {
  return Object.values(ConcernStatus).includes(value as ConcernStatus);
}

/**
 * Validates if a string is a valid academic level
 */
export function isValidAcademicLevel(value: string): value is 'undergraduate' | 'graduate' | 'doctoral' {
  return ['undergraduate', 'graduate', 'doctoral'].includes(value);
}

/**
 * Validates if an object has the required properties for ContentLocation
 */
export function isValidContentLocation(obj: any): obj is ContentLocation {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // All properties are optional, but if present, they should be the correct type
  if (obj.section !== undefined && typeof obj.section !== 'string') {
    return false;
  }
  if (obj.paragraph !== undefined && typeof obj.paragraph !== 'number') {
    return false;
  }
  if (obj.startPosition !== undefined && typeof obj.startPosition !== 'number') {
    return false;
  }
  if (obj.endPosition !== undefined && typeof obj.endPosition !== 'number') {
    return false;
  }
  if (obj.context !== undefined && typeof obj.context !== 'string') {
    return false;
  }

  return true;
}

/**
 * Validates if an object has the required properties for ProofreadingConcern
 */
export function isValidProofreadingConcern(obj: any): obj is ProofreadingConcern {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // Check required properties
  if (typeof obj.id !== 'string' ||
      typeof obj.conversationId !== 'string' ||
      !isValidConcernCategory(obj.category) ||
      !isValidConcernSeverity(obj.severity) ||
      typeof obj.title !== 'string' ||
      typeof obj.description !== 'string' ||
      !isValidConcernStatus(obj.status) ||
      !(obj.createdAt instanceof Date) ||
      !(obj.updatedAt instanceof Date)) {
    return false;
  }

  // Check optional properties
  if (obj.location !== undefined && !isValidContentLocation(obj.location)) {
    return false;
  }
  if (obj.suggestions !== undefined && !Array.isArray(obj.suggestions)) {
    return false;
  }
  if (obj.relatedIdeas !== undefined && !Array.isArray(obj.relatedIdeas)) {
    return false;
  }

  return true;
}

/**
 * Validates if an object has the required properties for AnalysisOptions
 */
export function isValidAnalysisOptions(obj: any): obj is AnalysisOptions {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // All properties are optional
  if (obj.categories !== undefined) {
    if (!Array.isArray(obj.categories) || 
        !obj.categories.every((cat: any) => isValidConcernCategory(cat))) {
      return false;
    }
  }
  if (obj.minSeverity !== undefined && !isValidConcernSeverity(obj.minSeverity)) {
    return false;
  }
  if (obj.includeGrammar !== undefined && typeof obj.includeGrammar !== 'boolean') {
    return false;
  }
  if (obj.academicLevel !== undefined && !isValidAcademicLevel(obj.academicLevel)) {
    return false;
  }

  return true;
}

/**
 * Validates if an object has the required properties for ConcernStatusUpdate
 */
export function isValidConcernStatusUpdate(obj: any): obj is ConcernStatusUpdate {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // Check required properties
  if (typeof obj.concernId !== 'string' || !isValidConcernStatus(obj.status)) {
    return false;
  }

  // Check optional properties
  if (obj.updatedBy !== undefined && typeof obj.updatedBy !== 'string') {
    return false;
  }
  if (obj.notes !== undefined && typeof obj.notes !== 'string') {
    return false;
  }

  return true;
}

/**
 * Creates a default ProofreadingConcern object with required fields
 */
export function createDefaultProofreadingConcern(
  id: string,
  conversationId: string,
  category: ConcernCategory,
  severity: ConcernSeverity,
  title: string,
  description: string
): ProofreadingConcern {
  const now = new Date();
  return {
    id,
    conversationId,
    category,
    severity,
    title,
    description,
    status: ConcernStatus.TO_BE_DONE,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Creates a default AnalysisOptions object
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
 * Gets all available concern categories as an array
 */
export function getAllConcernCategories(): ConcernCategory[] {
  return Object.values(ConcernCategory);
}

/**
 * Gets all available concern severities as an array
 */
export function getAllConcernSeverities(): ConcernSeverity[] {
  return Object.values(ConcernSeverity);
}

/**
 * Gets all available concern statuses as an array
 */
export function getAllConcernStatuses(): ConcernStatus[] {
  return Object.values(ConcernStatus);
}

/**
 * Gets human-readable label for concern category
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
 * Gets human-readable label for concern severity
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
 * Gets human-readable label for concern status
 */
export function getConcernStatusLabel(status: ConcernStatus): string {
  const labels: Record<ConcernStatus, string> = {
    [ConcernStatus.TO_BE_DONE]: 'To Be Done',
    [ConcernStatus.ADDRESSED]: 'Addressed',
    [ConcernStatus.REJECTED]: 'Rejected'
  };
  return labels[status];
}