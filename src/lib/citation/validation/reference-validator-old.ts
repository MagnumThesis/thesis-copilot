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
   * Validate reference fields
   * @param reference - Reference object to validate
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
    const missingFields: string[] = [];

    // Required fields validation
    if (!reference.title || reference.title.trim() === '') {
      errors.push({
        field: 'title',
        message: 'Title is required',
        severity: 'error'
      });
      missingFields.push('title');
    }

    if (!reference.authors || reference.authors.length === 0) {
      warnings.push({
        field: 'authors',
        message: 'At least one author is recommended',
        severity: 'warning'
      });
      missingFields.push('authors');
    } else {
      // Validate author fields
      reference.authors.forEach((author, index) => {
        const authorErrors = this.validateAuthor(author);
        authorErrors.forEach(error => {
          errors.push({
            ...error,
            field: `authors[${index}].${error.field}`,
            message: `Author ${index + 1}: ${error.message}`
          });
        });
      });
    }

    // Type-specific validation
    switch (reference.type) {
      case ReferenceType.JOURNAL_ARTICLE:
        if (!reference.journal) {
          errors.push({
            field: 'journal',
            message: 'Journal name is required for journal articles',
            severity: 'error'
          });
          missingFields.push('journal');
        }
        break;

      case ReferenceType.BOOK:
        if (!reference.publisher) {
          warnings.push({
            field: 'publisher',
            message: 'Publisher is recommended for books',
            severity: 'warning'
          });
          missingFields.push('publisher');
        }
        break;

      case ReferenceType.WEBSITE:
        if (!reference.url) {
          errors.push({
            field: 'url',
            message: 'URL is required for websites',
            severity: 'error'
          });
          missingFields.push('url');
        }
        break;
    }

    // URL validation
    if (reference.url && !this.validateURL(reference.url)) {
      errors.push({
        field: 'url',
        message: 'Invalid URL format',
        severity: 'error'
      });
    }

    // DOI validation
    if (reference.doi && !this.validateDOI(reference.doi)) {
      errors.push({
        field: 'doi',
        message: 'Invalid DOI format',
        severity: 'error'
      });
    }

    // ISBN validation
    if (reference.isbn && !this.validateISBN(reference.isbn)) {
      errors.push({
        field: 'isbn',
        message: 'Invalid ISBN format',
        severity: 'error'
      });
    }

    // Date validation
    const pubDate = reference.publicationDate || (reference as any).publication_date;
    if (pubDate) {
      const date = new Date(pubDate);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'publicationDate',
          message: 'Invalid publication date format',
          severity: 'error'
        });
      } else if (date > new Date()) {
        warnings.push({
          field: 'publicationDate',
          message: 'Publication date is in the future',
          severity: 'warning'
        });
      }
    }

    // Access date validation
    const accessDate = reference.accessDate || (reference as any).access_date;
    if (accessDate) {
      const date = new Date(accessDate);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'accessDate',
          message: 'Invalid access date format',
          severity: 'error'
        });
      } else if (date > new Date()) {
        warnings.push({
          field: 'accessDate',
          message: 'Access date is in the future',
          severity: 'warning'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields
    };
  }

  /**
   * Validate reference completeness for a specific type
   * @param reference - Reference object to validate
   * @returns Validation result
   */
  static validateReferenceCompleteness(reference: Reference): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const missingFields: string[] = [];

    // Get required fields for reference type
    const requiredFields = this.getRequiredFieldsForType(reference.type);
    const recommendedFields = this.getRecommendedFieldsForType(reference.type);

    // Check required fields
    for (const field of requiredFields) {
      const value = this.getFieldValue(reference, field);
      if (!value || (typeof value === 'string' && value.trim() === '') || 
          (Array.isArray(value) && value.length === 0)) {
        errors.push({
          field,
          message: `${this.getFieldDisplayName(field)} is required for ${reference.type}`,
          severity: 'error'
        });
        missingFields.push(field);
      }
    }

    // Check recommended fields
    for (const field of recommendedFields) {
      const value = this.getFieldValue(reference, field);
      if (!value || (typeof value === 'string' && value.trim() === '') || 
          (Array.isArray(value) && value.length === 0)) {
        warnings.push({
          field,
          message: `${this.getFieldDisplayName(field)} is recommended for ${reference.type}`,
          severity: 'warning'
        });
        missingFields.push(field);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields
    };
  }

  /**
   * Get required fields for a reference type
   * @param type - Reference type
   * @returns Array of required field names
   */
  private static getRequiredFieldsForType(type: ReferenceType): string[] {
    const requiredFields: Record<ReferenceType, string[]> = {
      [ReferenceType.JOURNAL_ARTICLE]: ['title', 'authors', 'journal'],
      [ReferenceType.BOOK]: ['title', 'authors'],
      [ReferenceType.BOOK_CHAPTER]: ['title', 'authors', 'editor'],
      [ReferenceType.CONFERENCE_PAPER]: ['title', 'authors'],
      [ReferenceType.THESIS]: ['title', 'authors'],
      [ReferenceType.WEBSITE]: ['title', 'url'],
      [ReferenceType.REPORT]: ['title', 'authors'],
      [ReferenceType.PATENT]: ['title', 'authors'],
      [ReferenceType.OTHER]: ['title']
    };

    return requiredFields[type] || ['title'];
  }

  /**
   * Get recommended fields for a reference type
   * @param type - Reference type
   * @returns Array of recommended field names
   */
  private static getRecommendedFieldsForType(type: ReferenceType): string[] {
    const recommendedFields: Record<ReferenceType, string[]> = {
      [ReferenceType.JOURNAL_ARTICLE]: ['publicationDate', 'volume', 'issue', 'pages'],
      [ReferenceType.BOOK]: ['publisher', 'publicationDate'],
      [ReferenceType.BOOK_CHAPTER]: ['journal', 'publisher', 'publicationDate', 'pages'],
      [ReferenceType.CONFERENCE_PAPER]: ['journal', 'publicationDate'],
      [ReferenceType.THESIS]: ['publisher', 'publicationDate'],
      [ReferenceType.WEBSITE]: ['authors', 'accessDate'],
      [ReferenceType.REPORT]: ['publisher', 'publicationDate'],
      [ReferenceType.PATENT]: ['publicationDate'],
      [ReferenceType.OTHER]: ['authors', 'publicationDate']
    };

    return recommendedFields[type] || [];
  }

  /**
   * Get field value from reference (handles both legacy and new property names)
   * @param reference - Reference object
   * @param field - Field name
   * @returns Field value
   */
  private static getFieldValue(reference: Reference, field: string): any {
    // Handle legacy database schema compatibility
    switch (field) {
      case 'publicationDate':
        return reference.publicationDate || (reference as any).publication_date;
      case 'accessDate':
        return reference.accessDate || (reference as any).access_date;
      default:
        return (reference as any)[field];
    }
  }

  /**
   * Get display name for a field
   * @param field - Field name
   * @returns Display name
   */
  private static getFieldDisplayName(field: string): string {
    const displayNames: Record<string, string> = {
      title: 'Title',
      authors: 'Authors',
      journal: 'Journal',
      publisher: 'Publisher',
      publicationDate: 'Publication Date',
      accessDate: 'Access Date',
      url: 'URL',
      doi: 'DOI',
      isbn: 'ISBN',
      volume: 'Volume',
      issue: 'Issue',
      pages: 'Pages',
      editor: 'Editor',
      edition: 'Edition',
      chapter: 'Chapter'
    };

    return displayNames[field] || field;
  }

  /**
   * Check for duplicate references
   * @param references - Array of references to check
   * @returns Array of duplicate reference groups
   */
  static detectDuplicateReferences(references: Reference[]): Reference[][] {
    const duplicateGroups: Reference[][] = [];
    const processed = new Set<string>();

    for (let i = 0; i < references.length; i++) {
      const ref = references[i];
      const refId = ref.id;

      if (processed.has(refId)) {
        continue;
      }

      const duplicates: Reference[] = [ref];
      processed.add(refId);

      // Find duplicates based on DOI or title+author similarity
      for (let j = i + 1; j < references.length; j++) {
        const otherRef = references[j];
        
        if (processed.has(otherRef.id)) {
          continue;
        }

        if (this.areReferencesDuplicate(ref, otherRef)) {
          duplicates.push(otherRef);
          processed.add(otherRef.id);
        }
      }

      if (duplicates.length > 1) {
        duplicateGroups.push(duplicates);
      }
    }

    return duplicateGroups;
  }

  /**
   * Check if two references are duplicates
   * @param ref1 - First reference
   * @param ref2 - Second reference
   * @returns True if references are likely duplicates
   */
  private static areReferencesDuplicate(ref1: Reference, ref2: Reference): boolean {
    // If both have DOIs, compare DOIs
    if (ref1.doi && ref2.doi) {
      return ref1.doi.toLowerCase() === ref2.doi.toLowerCase();
    }

    // If both have URLs, compare URLs
    if (ref1.url && ref2.url) {
      const url1 = ref1.url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      const url2 = ref2.url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (url1 === url2) {
        return true;
      }
    }

    // Compare title similarity (allowing for minor differences)
    const title1 = ref1.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    const title2 = ref2.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    
    if (title1 === title2) {
      // If titles are identical, check if authors are similar
      if (ref1.authors.length > 0 && ref2.authors.length > 0) {
        const author1 = ref1.authors[0];
        const author2 = ref2.authors[0];
        
        return author1.lastName.toLowerCase() === author2.lastName.toLowerCase() &&
               author1.firstName.toLowerCase() === author2.firstName.toLowerCase();
      }
      
      // If one has no authors, still consider it a duplicate if titles match exactly
      return true;
    }

    // For very different titles, don't consider them duplicates even if authors match
    return false;
  }

  /**
   * Normalize authors array to ensure consistency
   * @param authors - Array of authors (can be strings or Author objects)
   * @returns Array of normalized Author objects
   */
  static normalizeAuthors(authors: (Author | string)[]): Author[] {
    if (!authors || !Array.isArray(authors)) {
      return [];
    }

    return authors.map(author => {
      if (typeof author === 'string') {
        // Parse string format "Last, First" or "First Last"
        const parts = author.trim().split(/,\s*|\s+/);
        if (parts.length >= 2) {
          if (author.includes(',')) {
            // "Last, First" format
            return {
              firstName: parts[1].trim(),
              lastName: parts[0].trim()
            };
          } else {
            // "First Last" format
            return {
              firstName: parts.slice(0, -1).join(' ').trim(),
              lastName: parts[parts.length - 1].trim()
            };
          }
        } else {
          // Single name - assume it's the last name
          return {
            firstName: '',
            lastName: parts[0].trim()
          };
        }
      } else if (typeof author === 'object' && author !== null) {
        // Ensure required properties exist
        return {
          firstName: author.firstName || '',
          lastName: author.lastName || '',
          middleName: author.middleName,
          suffix: author.suffix
        };
      } else {
        return {
          firstName: '',
          lastName: 'Unknown'
        };
      }
    });
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
