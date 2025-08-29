/**
 * Validation Types and Interfaces
 * Contains types related to validation results and error handling
 */

import { ConcernSeverity } from './common';
import type { CitationFormat } from '../citation-types/citation-styles';

/**
 * @interface ValidationError
 * @description Interface for a validation error.
 */
export interface ValidationError {
  /** @property {string} field - The field that failed validation. */
  field: string;
  /** @property {string} message - The validation error message. */
  message: string;
  /** @property {string} [code] - The error code. */
  code?: string;
  /** @property {string} [severity] - The severity of the error. */
  severity?: string;
}

/**
 * @interface ValidationResult
 * @description Interface for a validation result.
 */
export interface ValidationResult {
  /** @property {boolean} isValid - Whether the validation was successful. */
  isValid: boolean;
  /** @property {(string | ValidationError)[]} errors - The validation errors. */
  errors: (string | ValidationError)[];
  /** @property {(string | ValidationError)[]} warnings - The validation warnings. */
  warnings: (string | ValidationError)[];
  /** @property {string[]} [missingFields] - The missing fields. */
  missingFields?: string[];
}

/**
 * @interface AcademicValidationResult
 * @description Interface for academic validation results.
 */
export interface AcademicValidationResult {
  /** @property {boolean} isAcademic - Whether the content is academic. */
  isAcademic: boolean;
  /** @property {number} toneScore - The academic tone score. */
  toneScore: number;
  /** @property {string[]} styleIssues - Issues with academic style. */
  styleIssues: string[];
  /** @property {string[]} suggestions - Suggestions for improvement. */
  suggestions: string[];
  /** @property {CitationFormat} citationFormat - The citation format detected. */
  citationFormat: CitationFormat;
}

// CitationFormat moved to citation-types/citation-styles.ts to avoid duplication
