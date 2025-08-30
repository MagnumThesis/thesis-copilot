/**
 * Reference Validation Module
 * Validates reference data fields and formats
 */

import { Reference, ReferenceType } from '../../types/citation-types/reference-types';
import { Author } from '../../types/citation-types/author-types';
import { ValidationResult, ValidationError } from '../../types/shared/validation';

// DOI format validation regex - supports various DOI formats
const DOI_REGEX = /^(doi:)?(https?:\/\/(dx\.)?doi\.org\/)?10\.\d{4,}\/[^\s]+$/i;

// URL format validation regex - supports various URL formats
const URL_REGEX = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

// ISBN format validation regex (ISBN-10 and ISBN-13)
const ISBN_REGEX = /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;

// Year validation regex (1000-2099)
const YEAR_REGEX = /^(1[0-9]{3}|20[0-9]{2})$/;

/**
 * Reference Validator
 * Handles validation of reference data fields and formats
 */
export class ReferenceValidator {
  /**
   * Validate DOI format
   * @param doi - DOI string to validate
   * @returns True if DOI is valid
   */
  static validateDOI(doi: string): boolean {
    if (!doi || typeof doi !== 'string') return false;
    return DOI_REGEX.test(doi.trim());
  }

  /**
   * Validate URL format
   * @param url - URL string to validate
   * @returns True if URL is valid
   */
  static validateURL(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    return URL_REGEX.test(url.trim());
  }

  /**
   * Validate ISBN format
   * @param isbn - ISBN string to validate
   * @returns True if ISBN is valid
   */
  static validateISBN(isbn: string): boolean {
    if (!isbn || typeof isbn !== 'string') return false;
    return ISBN_REGEX.test(isbn.trim());
  }

  /**
   * Validate publication year
   * @param year - Year string to validate
   * @returns True if year is valid
   */
  static validateYear(year: string): boolean {
    if (!year || typeof year !== 'string') return false;
    return YEAR_REGEX.test(year.trim());
  }

  /**
   * Validate author information
   * @param author - Author object to validate
   * @returns Array of validation errors
   */
  static validateAuthor(author: Author): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!author.firstName || author.firstName.trim().length === 0) {
      errors.push({
        field: 'firstName',
        message: 'Author first name is required',
        severity: 'error'
      });
    }

    if (!author.lastName || author.lastName.trim().length === 0) {
      errors.push({
        field: 'lastName',
        message: 'Author last name is required',
        severity: 'error'
      });
    }

    if (author.firstName && author.firstName.length > 100) {
      errors.push({
        field: 'firstName',
        message: 'Author first name must be less than 100 characters',
        severity: 'error'
      });
    }

    if (author.lastName && author.lastName.length > 100) {
      errors.push({
        field: 'lastName',
        message: 'Author last name must be less than 100 characters',
        severity: 'error'
      });
    }

    return errors;
  }

  /**
   * Validate all fields of a reference
   * @param reference - Reference to validate
   * @returns Validation result
   */
  static validateReferenceFields(reference: Reference | any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Handle null/undefined reference
    if (!reference) {
      return {
        isValid: false,
        errors: [{
          field: 'reference',
          message: 'Reference object is null or undefined',
          severity: 'error'
        }],
        warnings: []
      };
    }

    // Required fields validation
    if (!reference.title || reference.title.trim() === '') {
      errors.push({
        field: 'title',
        message: 'Title is required',
        severity: 'error'
      });
    }

    // DOI validation (if provided)
    if (reference.doi && reference.doi.trim() !== '') {
      if (!this.validateDOI(reference.doi)) {
        errors.push({
          field: 'doi',
          message: 'Invalid DOI format',
          severity: 'error'
        });
      }
    }

    // URL validation (if provided)
    if (reference.url && reference.url.trim() !== '') {
      if (!this.validateURL(reference.url)) {
        errors.push({
          field: 'url',
          message: 'Invalid URL format',
          severity: 'error'
        });
      }
    }

    // ISBN validation (if provided)
    if (reference.isbn && reference.isbn.trim() !== '') {
      if (!this.validateISBN(reference.isbn)) {
        errors.push({
          field: 'isbn',
          message: 'Invalid ISBN format',
          severity: 'error'
        });
      }
    }

    // Authors validation
    if (reference.authors && Array.isArray(reference.authors)) {
      reference.authors.forEach((author: any, index: any) => {
        if (typeof author === 'object' && author !== null) {
          const authorErrors = this.validateAuthor(author);
          authorErrors.forEach(error => {
            errors.push({
              field: `authors[${index}].${error.field}`,
              message: `Author ${index + 1} is missing ${error.field === 'firstName' ? 'first name' : 'last name'}`,
              severity: error.severity
            });
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate reference completeness and provide suggestions
   * @param reference - Reference to validate
   * @returns Completeness validation result
   */
  static validateReferenceCompleteness(reference: Reference | any): {
    completenessScore: number;
    missingFields: string[];
    suggestions: string[];
  } {
    if (!reference) {
      return {
        completenessScore: 0,
        missingFields: ['reference'],
        suggestions: ['Provide a valid reference object']
      };
    }

    const missingFields: string[] = [];
    const suggestions: string[] = [];

    // Critical fields (weight: 2)
    const criticalFields = ['title', 'authors'];
    criticalFields.forEach(field => {
      if (!reference[field] || (Array.isArray(reference[field]) && reference[field].length === 0)) {
        missingFields.push(field);
      }
    });

    // Important fields (weight: 1.5)
    const importantFields = ['publicationDate', 'publication_date'];
    const hasDate = reference.publicationDate || reference.publication_date;
    if (!hasDate) {
      missingFields.push('publicationDate');
    }

    // Type-specific fields
    if (reference.type === ReferenceType.JOURNAL_ARTICLE) {
      if (!reference.journal) missingFields.push('journal');
      if (!reference.volume) suggestions.push('Volume and issue numbers improve citation quality');
      if (!reference.issue) suggestions.push('Volume and issue numbers improve citation quality');
    } else if (reference.type === ReferenceType.BOOK) {
      if (!reference.publisher) missingFields.push('publisher');
    }

    // Beneficial fields
    if (!reference.doi) suggestions.push('Consider adding DOI for better citation accuracy');
    if (!reference.url && reference.type === ReferenceType.WEBSITE) {
      missingFields.push('url');
    }

    // Calculate completeness score
    const totalFields = 10; // Approximate total number of possible fields
    const criticalWeight = 2;
    const importantWeight = 1.5;
    const normalWeight = 1;

    let score = 1.0;
    let totalWeight = 0;
    let missingWeight = 0;

    // Critical fields
    criticalFields.forEach(field => {
      totalWeight += criticalWeight;
      if (missingFields.includes(field)) {
        missingWeight += criticalWeight;
      }
    });

    // Important fields
    totalWeight += importantWeight;
    if (missingFields.includes('publicationDate')) {
      missingWeight += importantWeight;
    }

    // Type-specific fields
    if (reference.type === ReferenceType.JOURNAL_ARTICLE) {
      totalWeight += normalWeight;
      if (missingFields.includes('journal')) {
        missingWeight += normalWeight;
      }
    }

    score = Math.max(0, (totalWeight - missingWeight) / totalWeight);

    return {
      completenessScore: score,
      missingFields,
      suggestions
    };
  }

  /**
   * Detect duplicate references in a collection
   * @param references - Array of references to check
   * @returns Array of duplicate groups
   */
  static detectDuplicateReferences(references: Reference[]): Array<{
    references: string[];
    reason: string;
  }> {
    if (!references || references.length < 2) {
      return [];
    }

    const duplicates: Array<{ references: string[]; reason: string }> = [];

    // Check for exact title matches
    const titleMap = new Map<string, string[]>();
    references.forEach(ref => {
      if (ref.title) {
        const normalizedTitle = ref.title.toLowerCase().trim();
        if (!titleMap.has(normalizedTitle)) {
          titleMap.set(normalizedTitle, []);
        }
        titleMap.get(normalizedTitle)!.push(ref.id);
      }
    });

    titleMap.forEach((refIds, title) => {
      if (refIds.length > 1) {
        duplicates.push({
          references: refIds,
          reason: 'identical title'
        });
      }
    });

    // Check for DOI matches
    const doiMap = new Map<string, string[]>();
    references.forEach(ref => {
      if (ref.doi && ref.doi.trim() !== '') {
        const normalizedDoi = ref.doi.toLowerCase().trim();
        if (!doiMap.has(normalizedDoi)) {
          doiMap.set(normalizedDoi, []);
        }
        doiMap.get(normalizedDoi)!.push(ref.id);
      }
    });

    doiMap.forEach((refIds, doi) => {
      if (refIds.length > 1) {
        duplicates.push({
          references: refIds,
          reason: 'same DOI'
        });
      }
    });

    // Check for similar titles (basic similarity)
    for (let i = 0; i < references.length; i++) {
      for (let j = i + 1; j < references.length; j++) {
        const ref1 = references[i];
        const ref2 = references[j];
        
        if (ref1.title && ref2.title && ref1.id !== ref2.id) {
          const title1 = ref1.title.toLowerCase().trim();
          const title2 = ref2.title.toLowerCase().trim();
          
          // Simple similarity check - if one title contains most words of the other
          const words1 = title1.split(/\s+/);
          const words2 = title2.split(/\s+/);
          
          const intersection = words1.filter(word => 
            word.length > 3 && words2.includes(word)
          );
          
          const similarityThreshold = Math.min(words1.length, words2.length) * 0.7;
          
          if (intersection.length >= similarityThreshold && intersection.length >= 3) {
            duplicates.push({
              references: [ref1.id, ref2.id],
              reason: 'similar title'
            });
          }
        }
      }
    }

    return duplicates;
  }
}
