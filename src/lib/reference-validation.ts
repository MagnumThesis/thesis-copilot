/**
 * Reference Validation Logic
 * Validation functions for reference fields and citation style requirements
 */

import {
  Reference,
  ReferenceFormData,
  ReferenceType,
  CitationStyle,
  ValidationError,
  ValidationResult,
  Author
} from './ai-types';

// DOI format validation regex
const DOI_REGEX = /^10\.\d{4,}\/[^\s]+$/;

// URL format validation regex
const URL_REGEX = /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/;

// ISBN format validation regex (ISBN-10 and ISBN-13)
const ISBN_REGEX = /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;

// Year validation regex (1000-2099)
const YEAR_REGEX = /^(1[0-9]{3}|20[0-9]{2})$/;

/**
 * Validates a DOI format
 */
export function validateDOI(doi: string): boolean {
  if (!doi || typeof doi !== 'string') return false;
  return DOI_REGEX.test(doi.trim());
}

/**
 * Validates a URL format
 */
export function validateURL(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return URL_REGEX.test(url.trim());
}

/**
 * Validates an ISBN format
 */
export function validateISBN(isbn: string): boolean {
  if (!isbn || typeof isbn !== 'string') return false;
  return ISBN_REGEX.test(isbn.trim());
}

/**
 * Validates a publication year
 */
export function validateYear(year: string): boolean {
  if (!year || typeof year !== 'string') return false;
  return YEAR_REGEX.test(year.trim());
}

/**
 * Validates author information
 */
export function validateAuthor(author: Author): ValidationError[] {
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
 * Validates basic reference fields
 */
export function validateReferenceFields(data: ReferenceFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'Title is required',
      severity: 'error'
    });
  } else if (data.title.length > 500) {
    errors.push({
      field: 'title',
      message: 'Title must be less than 500 characters',
      severity: 'error'
    });
  }

  // Authors validation
  if (!data.authors || data.authors.length === 0) {
    errors.push({
      field: 'authors',
      message: 'At least one author is required',
      severity: 'error'
    });
  } else {
    data.authors.forEach((author, index) => {
      const authorErrors = validateAuthor(author);
      authorErrors.forEach(error => {
        errors.push({
          field: `authors[${index}].${error.field}`,
          message: error.message,
          severity: error.severity
        });
      });
    });
  }

  // Publication date validation
  if (data.publicationDate && !validateYear(data.publicationDate)) {
    errors.push({
      field: 'publicationDate',
      message: 'Publication date must be a valid year (1000-2099)',
      severity: 'error'
    });
  }

  // URL validation
  if (data.url && !validateURL(data.url)) {
    errors.push({
      field: 'url',
      message: 'URL must be a valid HTTP or HTTPS URL',
      severity: 'error'
    });
  }

  // DOI validation
  if (data.doi && !validateDOI(data.doi)) {
    errors.push({
      field: 'doi',
      message: 'DOI must be in valid format (e.g., 10.1000/example)',
      severity: 'error'
    });
  }

  // ISBN validation
  if (data.isbn && !validateISBN(data.isbn)) {
    errors.push({
      field: 'isbn',
      message: 'ISBN must be in valid ISBN-10 or ISBN-13 format',
      severity: 'error'
    });
  }

  // Access date validation
  if (data.accessDate && !validateYear(data.accessDate)) {
    errors.push({
      field: 'accessDate',
      message: 'Access date must be a valid year (1000-2099)',
      severity: 'warning'
    });
  }

  // Field length validations
  const fieldLimits = {
    journal: 200,
    volume: 50,
    issue: 50,
    pages: 100,
    publisher: 200,
    edition: 50,
    chapter: 200,
    editor: 200,
    notes: 1000
  };

  Object.entries(fieldLimits).forEach(([field, limit]) => {
    const value = data[field as keyof ReferenceFormData] as string;
    if (value && value.length > limit) {
      errors.push({
        field,
        message: `${field} must be less than ${limit} characters`,
        severity: 'error'
      });
    }
  });

  return errors;
}/**
 
* Citation style specific validation rules
 */

// Required fields for each citation style and reference type
const STYLE_REQUIREMENTS: Record<CitationStyle, Record<ReferenceType, string[]>> = {
  [CitationStyle.APA]: {
    [ReferenceType.JOURNAL_ARTICLE]: ['title', 'authors', 'journal', 'publicationDate'],
    [ReferenceType.BOOK]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.BOOK_CHAPTER]: ['title', 'authors', 'editor', 'publisher', 'publicationDate'],
    [ReferenceType.CONFERENCE_PAPER]: ['title', 'authors', 'publicationDate'],
    [ReferenceType.THESIS]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.WEBSITE]: ['title', 'authors', 'url', 'accessDate'],
    [ReferenceType.REPORT]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.PATENT]: ['title', 'authors', 'publicationDate'],
    [ReferenceType.OTHER]: ['title', 'authors']
  },
  [CitationStyle.MLA]: {
    [ReferenceType.JOURNAL_ARTICLE]: ['title', 'authors', 'journal', 'publicationDate'],
    [ReferenceType.BOOK]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.BOOK_CHAPTER]: ['title', 'authors', 'editor', 'publisher', 'publicationDate'],
    [ReferenceType.CONFERENCE_PAPER]: ['title', 'authors', 'publicationDate'],
    [ReferenceType.THESIS]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.WEBSITE]: ['title', 'authors', 'url', 'accessDate'],
    [ReferenceType.REPORT]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.PATENT]: ['title', 'authors', 'publicationDate'],
    [ReferenceType.OTHER]: ['title', 'authors']
  },
  [CitationStyle.CHICAGO]: {
    [ReferenceType.JOURNAL_ARTICLE]: ['title', 'authors', 'journal', 'publicationDate'],
    [ReferenceType.BOOK]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.BOOK_CHAPTER]: ['title', 'authors', 'editor', 'publisher', 'publicationDate'],
    [ReferenceType.CONFERENCE_PAPER]: ['title', 'authors', 'publicationDate'],
    [ReferenceType.THESIS]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.WEBSITE]: ['title', 'authors', 'url', 'accessDate'],
    [ReferenceType.REPORT]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.PATENT]: ['title', 'authors', 'publicationDate'],
    [ReferenceType.OTHER]: ['title', 'authors']
  },
  [CitationStyle.HARVARD]: {
    [ReferenceType.JOURNAL_ARTICLE]: ['title', 'authors', 'journal', 'publicationDate'],
    [ReferenceType.BOOK]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.BOOK_CHAPTER]: ['title', 'authors', 'editor', 'publisher', 'publicationDate'],
    [ReferenceType.CONFERENCE_PAPER]: ['title', 'authors', 'publicationDate'],
    [ReferenceType.THESIS]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.WEBSITE]: ['title', 'authors', 'url', 'accessDate'],
    [ReferenceType.REPORT]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.PATENT]: ['title', 'authors', 'publicationDate'],
    [ReferenceType.OTHER]: ['title', 'authors']
  },
  [CitationStyle.IEEE]: {
    [ReferenceType.JOURNAL_ARTICLE]: ['title', 'authors', 'journal', 'publicationDate'],
    [ReferenceType.BOOK]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.BOOK_CHAPTER]: ['title', 'authors', 'editor', 'publisher', 'publicationDate'],
    [ReferenceType.CONFERENCE_PAPER]: ['title', 'authors', 'publicationDate'],
    [ReferenceType.THESIS]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.WEBSITE]: ['title', 'authors', 'url', 'accessDate'],
    [ReferenceType.REPORT]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.PATENT]: ['title', 'authors', 'publicationDate'],
    [ReferenceType.OTHER]: ['title', 'authors']
  },
  [CitationStyle.VANCOUVER]: {
    [ReferenceType.JOURNAL_ARTICLE]: ['title', 'authors', 'journal', 'publicationDate'],
    [ReferenceType.BOOK]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.BOOK_CHAPTER]: ['title', 'authors', 'editor', 'publisher', 'publicationDate'],
    [ReferenceType.CONFERENCE_PAPER]: ['title', 'authors', 'publicationDate'],
    [ReferenceType.THESIS]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.WEBSITE]: ['title', 'authors', 'url', 'accessDate'],
    [ReferenceType.REPORT]: ['title', 'authors', 'publisher', 'publicationDate'],
    [ReferenceType.PATENT]: ['title', 'authors', 'publicationDate'],
    [ReferenceType.OTHER]: ['title', 'authors']
  }
};

/**
 * Validates reference against citation style requirements
 */
export function validateReferenceForStyle(
  data: ReferenceFormData,
  style: CitationStyle
): ValidationError[] {
  const errors: ValidationError[] = [];
  const requiredFields = STYLE_REQUIREMENTS[style][data.type] || [];

  requiredFields.forEach(field => {
    const value = data[field as keyof ReferenceFormData];
    
    if (field === 'authors') {
      if (!data.authors || data.authors.length === 0) {
        errors.push({
          field: 'authors',
          message: `Authors are required for ${style} style ${data.type} references`,
          severity: 'error'
        });
      }
    } else if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      errors.push({
        field,
        message: `${field} is required for ${style} style ${data.type} references`,
        severity: 'error'
      });
    }
  });

  // Style-specific validations
  if (style === CitationStyle.APA) {
    // APA requires DOI for journal articles when available
    if (data.type === ReferenceType.JOURNAL_ARTICLE && !data.doi && !data.url) {
      errors.push({
        field: 'doi',
        message: 'DOI or URL is recommended for APA journal articles',
        severity: 'warning'
      });
    }
  }

  if (style === CitationStyle.MLA) {
    // MLA requires access date for web sources
    if (data.type === ReferenceType.WEBSITE && !data.accessDate) {
      errors.push({
        field: 'accessDate',
        message: 'Access date is required for MLA web sources',
        severity: 'error'
      });
    }
  }

  return errors;
}

/**
 * Comprehensive reference validation
 */
export function validateReference(
  data: ReferenceFormData,
  style?: CitationStyle
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Basic field validation
  const basicErrors = validateReferenceFields(data);
  errors.push(...basicErrors);

  // Style-specific validation if style is provided
  if (style) {
    const styleErrors = validateReferenceForStyle(data, style);
    styleErrors.forEach(error => {
      if (error.severity === 'error') {
        errors.push(error);
      } else {
        warnings.push(error);
      }
    });
  }

  // Collect missing required fields
  const missingFields: string[] = [];
  if (style) {
    const requiredFields = STYLE_REQUIREMENTS[style][data.type] || [];
    requiredFields.forEach(field => {
      const value = data[field as keyof ReferenceFormData];
      if (field === 'authors') {
        if (!data.authors || data.authors.length === 0) {
          missingFields.push(field);
        }
      } else if (!value || (typeof value === 'string' && value.trim().length === 0)) {
        missingFields.push(field);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingFields
  };
}

/**
 * Validates a complete reference object (for existing references)
 */
export function validateExistingReference(
  reference: Reference,
  style?: CitationStyle
): ValidationResult {
  // Convert Reference to ReferenceFormData for validation
  const formData: ReferenceFormData = {
    type: reference.type,
    title: reference.title,
    authors: reference.authors,
    publicationDate: reference.publicationDate?.getFullYear().toString(),
    url: reference.url,
    doi: reference.doi,
    journal: reference.journal,
    volume: reference.volume,
    issue: reference.issue,
    pages: reference.pages,
    publisher: reference.publisher,
    isbn: reference.isbn,
    edition: reference.edition,
    chapter: reference.chapter,
    editor: reference.editor,
    accessDate: reference.accessDate?.getFullYear().toString(),
    notes: reference.notes,
    tags: reference.tags
  };

  return validateReference(formData, style);
}

/**
 * Gets required fields for a specific reference type and citation style
 */
export function getRequiredFields(type: ReferenceType, style: CitationStyle): string[] {
  return STYLE_REQUIREMENTS[style][type] || [];
}

/**
 * Checks if a reference has all required fields for a citation style
 */
export function hasRequiredFields(
  data: ReferenceFormData,
  style: CitationStyle
): boolean {
  const requiredFields = getRequiredFields(data.type, style);
  
  return requiredFields.every(field => {
    const value = data[field as keyof ReferenceFormData];
    if (field === 'authors') {
      return data.authors && data.authors.length > 0;
    }
    return value && (typeof value !== 'string' || value.trim().length > 0);
  });
}