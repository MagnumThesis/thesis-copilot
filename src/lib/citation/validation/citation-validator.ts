/**
 * Citation Validation Module
 * Validates citations against style-specific requirements
 */

import { Reference, ReferenceType } from '../../types/citation-types/reference-types';
import { CitationStyle } from '../../types/citation-types/citation-styles';
import { ValidationResult, ValidationError } from '../../types/shared/validation';

/**
 * Citation Validator
 * Handles validation of citations against specific citation style requirements
 */
export class CitationValidator {
  /**
   * Validate citation style requirements for a reference
   * @param reference - Reference object
   * @param style - Citation style
   * @returns Validation result
   */
  static validateStyleRequirements(reference: Reference, style: CitationStyle): ValidationResult {
    switch (style) {
      case CitationStyle.APA:
        return this.validateAPARequirements(reference);
      case CitationStyle.MLA:
        return this.validateMLARequirements(reference);
      case CitationStyle.CHICAGO:
        return this.validateChicagoRequirements(reference);
      case CitationStyle.HARVARD:
        return this.validateHarvardRequirements(reference);
      case CitationStyle.IEEE:
        return this.validateIEEERequirements(reference);
      default:
        const errors: ValidationError[] = [{
          field: 'style',
          message: `Citation style ${style} validation not yet implemented`,
          severity: 'error'
        }];
        return {
          isValid: false,
          errors,
          warnings: [],
          missingFields: []
        };
    }
  }

  /**
   * Validate APA style requirements
   */
  private static validateAPARequirements(reference: Reference): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const missingFields: string[] = [];

    // Title is always required
    if (!reference.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Title is required for APA citations',
        severity: 'error'
      });
      missingFields.push('title');
    }

    // Author or organization name required
    if (!reference.authors || reference.authors.length === 0) {
      warnings.push({
        field: 'authors',
        message: 'Author information is recommended for proper APA citations',
        severity: 'warning'
      });
      missingFields.push('authors');
    }

    // Publication date recommended
    const pubDate = reference.publicationDate || (reference as any).publication_date;
    if (!pubDate) {
      warnings.push({
        field: 'publicationDate',
        message: 'Publication date is recommended for APA citations',
        severity: 'warning'
      });
      missingFields.push('publicationDate');
    }

    // Type-specific validations
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
            message: 'URL is required for website references',
            severity: 'error'
          });
          missingFields.push('url');
        }
        const accessDate = reference.accessDate || (reference as any).access_date;
        if (!accessDate) {
          warnings.push({
            field: 'accessDate',
            message: 'Access date is recommended for website references',
            severity: 'warning'
          });
          missingFields.push('accessDate');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields
    };
  }

  /**
   * Validate MLA style requirements
   */
  private static validateMLARequirements(reference: Reference): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const missingFields: string[] = [];

    // Title is always required
    if (!reference.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Title is required for MLA citations',
        severity: 'error'
      });
      missingFields.push('title');
    }

    // Author information recommended
    if (!reference.authors || reference.authors.length === 0) {
      warnings.push({
        field: 'authors',
        message: 'Author information is recommended for MLA citations',
        severity: 'warning'
      });
      missingFields.push('authors');
    }

    // Type-specific validations
    switch (reference.type) {
      case ReferenceType.JOURNAL_ARTICLE:
        if (!reference.journal) {
          errors.push({
            field: 'journal',
            message: 'Journal name is required for journal articles in MLA',
            severity: 'error'
          });
          missingFields.push('journal');
        }
        break;

      case ReferenceType.WEBSITE:
        if (!reference.url) {
          errors.push({
            field: 'url',
            message: 'URL is required for website references in MLA',
            severity: 'error'
          });
          missingFields.push('url');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields
    };
  }

  /**
   * Validate Chicago style requirements
   */
  private static validateChicagoRequirements(reference: Reference): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const missingFields: string[] = [];

    // Title is always required
    if (!reference.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Title is required for Chicago citations',
        severity: 'error'
      });
      missingFields.push('title');
    }

    // Author information recommended
    if (!reference.authors || reference.authors.length === 0) {
      warnings.push({
        field: 'authors',
        message: 'Author information is recommended for Chicago citations',
        severity: 'warning'
      });
      missingFields.push('authors');
    }

    // Publication date recommended
    const pubDate = reference.publicationDate || (reference as any).publication_date;
    if (!pubDate) {
      warnings.push({
        field: 'publicationDate',
        message: 'Publication date is recommended for Chicago citations',
        severity: 'warning'
      });
      missingFields.push('publicationDate');
    }

    // Type-specific validations
    switch (reference.type) {
      case ReferenceType.JOURNAL_ARTICLE:
        if (!reference.journal) {
          errors.push({
            field: 'journal',
            message: 'Journal name is required for journal articles in Chicago style',
            severity: 'error'
          });
          missingFields.push('journal');
        }
        break;

      case ReferenceType.BOOK:
        if (!reference.publisher) {
          warnings.push({
            field: 'publisher',
            message: 'Publisher is recommended for books in Chicago style',
            severity: 'warning'
          });
          missingFields.push('publisher');
        }
        break;

      case ReferenceType.WEBSITE:
        if (!reference.url) {
          errors.push({
            field: 'url',
            message: 'URL is required for website references in Chicago style',
            severity: 'error'
          });
          missingFields.push('url');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields
    };
  }

  /**
   * Validate Harvard style requirements
   */
  private static validateHarvardRequirements(reference: Reference): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const missingFields: string[] = [];

    // Title is always required
    if (!reference.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Title is required for Harvard citations',
        severity: 'error'
      });
      missingFields.push('title');
    }

    // Author information recommended
    if (!reference.authors || reference.authors.length === 0) {
      warnings.push({
        field: 'authors',
        message: 'Author information is recommended for Harvard citations',
        severity: 'warning'
      });
      missingFields.push('authors');
    }

    // Publication date recommended
    const pubDate = reference.publicationDate || (reference as any).publication_date;
    if (!pubDate) {
      warnings.push({
        field: 'publicationDate',
        message: 'Publication date is recommended for Harvard citations',
        severity: 'warning'
      });
      missingFields.push('publicationDate');
    }

    // Type-specific validations
    switch (reference.type) {
      case ReferenceType.JOURNAL_ARTICLE:
        if (!reference.journal) {
          errors.push({
            field: 'journal',
            message: 'Journal name is required for journal articles in Harvard style',
            severity: 'error'
          });
          missingFields.push('journal');
        }
        break;

      case ReferenceType.BOOK:
        if (!reference.publisher) {
          warnings.push({
            field: 'publisher',
            message: 'Publisher is recommended for books in Harvard style',
            severity: 'warning'
          });
          missingFields.push('publisher');
        }
        break;

      case ReferenceType.WEBSITE:
        if (!reference.url) {
          errors.push({
            field: 'url',
            message: 'URL is required for website references in Harvard style',
            severity: 'error'
          });
          missingFields.push('url');
        }
        const accessDate = reference.accessDate || (reference as any).access_date;
        if (!accessDate) {
          warnings.push({
            field: 'accessDate',
            message: 'Access date is recommended for website references in Harvard style',
            severity: 'warning'
          });
          missingFields.push('accessDate');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields
    };
  }

  /**
   * Validate IEEE style requirements
   */
  private static validateIEEERequirements(reference: Reference): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const missingFields: string[] = [];

    // Title is always required
    if (!reference.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Title is required for IEEE citations',
        severity: 'error'
      });
      missingFields.push('title');
    }

    // Author information recommended
    if (!reference.authors || reference.authors.length === 0) {
      warnings.push({
        field: 'authors',
        message: 'Author information is recommended for IEEE citations',
        severity: 'warning'
      });
      missingFields.push('authors');
    }

    // Publication date recommended
    const pubDate = reference.publicationDate || (reference as any).publication_date;
    if (!pubDate) {
      warnings.push({
        field: 'publicationDate',
        message: 'Publication date is recommended for IEEE citations',
        severity: 'warning'
      });
      missingFields.push('publicationDate');
    }

    // Type-specific validations
    switch (reference.type) {
      case ReferenceType.JOURNAL_ARTICLE:
        if (!reference.journal) {
          errors.push({
            field: 'journal',
            message: 'Journal name is required for journal articles in IEEE style',
            severity: 'error'
          });
          missingFields.push('journal');
        }
        break;

      case ReferenceType.CONFERENCE_PAPER:
        if (!reference.journal) { // Using journal field for conference name
          errors.push({
            field: 'journal',
            message: 'Conference name is required for conference papers in IEEE style',
            severity: 'error'
          });
          missingFields.push('journal');
        }
        break;

      case ReferenceType.BOOK:
        if (!reference.publisher) {
          warnings.push({
            field: 'publisher',
            message: 'Publisher is recommended for books in IEEE style',
            severity: 'warning'
          });
          missingFields.push('publisher');
        }
        break;

      case ReferenceType.WEBSITE:
        if (!reference.url) {
          errors.push({
            field: 'url',
            message: 'URL is required for website references in IEEE style',
            severity: 'error'
          });
          missingFields.push('url');
        }
        const accessDate = reference.accessDate || (reference as any).access_date;
        if (!accessDate) {
          warnings.push({
            field: 'accessDate',
            message: 'Access date is recommended for website references in IEEE style',
            severity: 'warning'
          });
          missingFields.push('accessDate');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields
    };
  }

  /**
   * Get style-specific requirements for a reference type
   * @param style - Citation style
   * @param referenceType - Type of reference
   * @returns Array of required fields for the style and type
   */
  static getStyleRequirements(style: CitationStyle, referenceType: ReferenceType): string[] {
    const requirements: Record<CitationStyle, Record<ReferenceType, string[]>> = {
      [CitationStyle.APA]: {
        [ReferenceType.JOURNAL_ARTICLE]: ['title', 'authors', 'journal', 'publicationDate'],
        [ReferenceType.BOOK]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.BOOK_CHAPTER]: ['title', 'authors', 'editor', 'journal', 'publisher', 'publicationDate'],
        [ReferenceType.CONFERENCE_PAPER]: ['title', 'authors', 'journal', 'publicationDate'],
        [ReferenceType.THESIS]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.WEBSITE]: ['title', 'url', 'accessDate'],
        [ReferenceType.REPORT]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.PATENT]: ['title', 'authors', 'publicationDate'],
        [ReferenceType.OTHER]: ['title']
      },
      [CitationStyle.MLA]: {
        [ReferenceType.JOURNAL_ARTICLE]: ['title', 'authors', 'journal', 'publicationDate'],
        [ReferenceType.BOOK]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.BOOK_CHAPTER]: ['title', 'authors', 'editor', 'journal', 'publisher', 'publicationDate'],
        [ReferenceType.CONFERENCE_PAPER]: ['title', 'authors', 'journal', 'publicationDate'],
        [ReferenceType.THESIS]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.WEBSITE]: ['title', 'authors', 'url', 'accessDate'],
        [ReferenceType.REPORT]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.PATENT]: ['title', 'authors', 'publicationDate'],
        [ReferenceType.OTHER]: ['title', 'authors']
      },
      [CitationStyle.CHICAGO]: {
        [ReferenceType.JOURNAL_ARTICLE]: ['title', 'authors', 'journal', 'publicationDate'],
        [ReferenceType.BOOK]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.BOOK_CHAPTER]: ['title', 'authors', 'editor', 'journal', 'publisher', 'publicationDate'],
        [ReferenceType.CONFERENCE_PAPER]: ['title', 'authors', 'journal', 'publicationDate'],
        [ReferenceType.THESIS]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.WEBSITE]: ['title', 'authors', 'url', 'accessDate'],
        [ReferenceType.REPORT]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.PATENT]: ['title', 'authors', 'publicationDate'],
        [ReferenceType.OTHER]: ['title', 'authors']
      },
      [CitationStyle.HARVARD]: {
        [ReferenceType.JOURNAL_ARTICLE]: ['title', 'authors', 'journal', 'publicationDate'],
        [ReferenceType.BOOK]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.BOOK_CHAPTER]: ['title', 'authors', 'editor', 'journal', 'publisher', 'publicationDate'],
        [ReferenceType.CONFERENCE_PAPER]: ['title', 'authors', 'journal', 'publicationDate'],
        [ReferenceType.THESIS]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.WEBSITE]: ['title', 'authors', 'url', 'accessDate'],
        [ReferenceType.REPORT]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.PATENT]: ['title', 'authors', 'publicationDate'],
        [ReferenceType.OTHER]: ['title', 'authors']
      },
      [CitationStyle.IEEE]: {
        [ReferenceType.JOURNAL_ARTICLE]: ['title', 'authors', 'journal', 'publicationDate'],
        [ReferenceType.BOOK]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.BOOK_CHAPTER]: ['title', 'authors', 'editor', 'journal', 'publisher', 'publicationDate'],
        [ReferenceType.CONFERENCE_PAPER]: ['title', 'authors', 'journal', 'publicationDate'],
        [ReferenceType.THESIS]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.WEBSITE]: ['title', 'authors', 'url', 'accessDate'],
        [ReferenceType.REPORT]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.PATENT]: ['title', 'authors', 'publicationDate'],
        [ReferenceType.OTHER]: ['title', 'authors']
      },
      [CitationStyle.VANCOUVER]: {
        [ReferenceType.JOURNAL_ARTICLE]: ['title', 'authors', 'journal', 'publicationDate'],
        [ReferenceType.BOOK]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.BOOK_CHAPTER]: ['title', 'authors', 'editor', 'journal', 'publisher', 'publicationDate'],
        [ReferenceType.CONFERENCE_PAPER]: ['title', 'authors', 'journal', 'publicationDate'],
        [ReferenceType.THESIS]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.WEBSITE]: ['title', 'authors', 'url', 'accessDate'],
        [ReferenceType.REPORT]: ['title', 'authors', 'publisher', 'publicationDate'],
        [ReferenceType.PATENT]: ['title', 'authors', 'publicationDate'],
        [ReferenceType.OTHER]: ['title', 'authors']
      }
    };

    return requirements[style]?.[referenceType] || ['title'];
  }
}
