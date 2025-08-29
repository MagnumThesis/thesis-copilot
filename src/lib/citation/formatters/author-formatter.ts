/**
 * Author Formatter Module
 * Handles formatting of author names according to different academic citation styles
 */

import type { Author } from '../../types/citation-types/author-types';

/**
 * Author name formatting utilities
 */
export class AuthorFormatter {
  /**
   * Format author name for MLA style
   * @param author - Author object
   * @param isFirstAuthor - Whether this is the first author in a list
   * @param isInlineCitation - Whether this is for inline citation (abbreviated)
   * @returns Formatted author name
   */
  static formatMLA(author: Author, isFirstAuthor: boolean = true, isInlineCitation: boolean = false): string {
    const { firstName, lastName, middleName, suffix } = author;
    
    if (isInlineCitation) {
      // For inline citations, use last name only
      return lastName;
    }
    
    // For bibliography entries
    if (isFirstAuthor) {
      // First author: Last, First Middle
      let formatted = lastName;
      if (firstName) {
        formatted += `, ${firstName}`;
        if (middleName) {
          formatted += ` ${middleName}`;
        }
      }
      if (suffix) {
        formatted += `, ${suffix}`;
      }
      return formatted;
    } else {
      // Subsequent authors: First Middle Last
      let formatted = '';
      if (firstName) {
        formatted += firstName;
        if (middleName) {
          formatted += ` ${middleName}`;
        }
        formatted += ` `;
      }
      formatted += lastName;
      if (suffix) {
        formatted += `, ${suffix}`;
      }
      return formatted;
    }
  }

  /**
   * Format author name for Chicago style
   * @param author - Author object
   * @param isFirstAuthor - Whether this is the first author in a list
   * @param isInlineCitation - Whether this is for inline citation (abbreviated)
   * @returns Formatted author name
   */
  static formatChicago(author: Author, isFirstAuthor: boolean = true, isInlineCitation: boolean = false): string {
    const { firstName, lastName, middleName, suffix } = author;
    
    if (isInlineCitation) {
      // For inline citations, use last name only
      return lastName;
    }
    
    // For bibliography entries (similar to MLA but with periods)
    if (isFirstAuthor) {
      // First author: Last, First Middle.
      let formatted = lastName;
      if (firstName) {
        formatted += `, ${firstName}`;
        if (middleName) {
          formatted += ` ${middleName}`;
        }
      }
      if (suffix) {
        formatted += `, ${suffix}`;
      }
      return formatted;
    } else {
      // Subsequent authors: First Middle Last
      let formatted = '';
      if (firstName) {
        formatted += firstName;
        if (middleName) {
          formatted += ` ${middleName}`;
        }
        formatted += ` `;
      }
      formatted += lastName;
      if (suffix) {
        formatted += `, ${suffix}`;
      }
      return formatted;
    }
  }

  /**
   * Format author name for Harvard style
   * @param author - Author object
   * @param isInlineCitation - Whether this is for inline citation (abbreviated)
   * @returns Formatted author name
   */
  static formatHarvard(author: Author, isInlineCitation: boolean = false): string {
    // Harvard style is similar to APA
    return this.formatAPA(author, isInlineCitation);
  }

  /**
   * Format author name for APA style
   * @param author - Author object
   * @param isInlineCitation - Whether this is for inline citation (abbreviated)
   * @returns Formatted author name
   */
  static formatAPA(author: Author, isInlineCitation: boolean = false): string {
    const { firstName, lastName, middleName, suffix } = author;
    
    if (isInlineCitation) {
      // For inline citations, use last name only
      return lastName;
    }
    
    // For bibliography entries
    let formatted = lastName;
    
    // Add first initial
    if (firstName) {
      formatted += `, ${firstName.charAt(0).toUpperCase()}.`;
    }
    
    // Add middle initial if present
    if (middleName) {
      formatted += ` ${middleName.charAt(0).toUpperCase()}.`;
    }
    
    // Add suffix if present
    if (suffix) {
      formatted += `, ${suffix}`;
    }
    
    return formatted;
  }

  /**
   * Format multiple authors for MLA style
   * @param authors - Array of authors
   * @param isInlineCitation - Whether this is for inline citation
   * @returns Formatted author string
   */
  static formatMultipleMLA(authors: Author[], isInlineCitation: boolean = false): string {
    if (authors.length === 0) return '';
    
    if (isInlineCitation) {
      if (authors.length === 1) {
        return this.formatMLA(authors[0], true, true);
      } else if (authors.length === 2) {
        return `${this.formatMLA(authors[0], true, true)} and ${this.formatMLA(authors[1], false, true)}`;
      } else {
        return `${this.formatMLA(authors[0], true, true)} et al.`;
      }
    } else {
      // Bibliography formatting
      if (authors.length === 1) {
        return this.formatMLA(authors[0], true, false);
      } else if (authors.length === 2) {
        return `${this.formatMLA(authors[0], true, false)}, and ${this.formatMLA(authors[1], false, false)}`;
      } else {
        const formatted = authors.slice(0, -1).map((author, index) => 
          this.formatMLA(author, index === 0, false)
        ).join(', ');
        return `${formatted}, and ${this.formatMLA(authors[authors.length - 1], false, false)}`;
      }
    }
  }

  /**
   * Format multiple authors for Chicago style
   * @param authors - Array of authors
   * @param isInlineCitation - Whether this is for inline citation
   * @returns Formatted author string
   */
  static formatMultipleChicago(authors: Author[], isInlineCitation: boolean = false): string {
    if (authors.length === 0) return '';
    
    if (isInlineCitation) {
      if (authors.length === 1) {
        return this.formatChicago(authors[0], true, true);
      } else if (authors.length === 2) {
        return `${this.formatChicago(authors[0], true, true)} and ${this.formatChicago(authors[1], false, true)}`;
      } else {
        return `${this.formatChicago(authors[0], true, true)} et al.`;
      }
    } else {
      // Bibliography formatting
      if (authors.length === 1) {
        return this.formatChicago(authors[0], true, false);
      } else if (authors.length === 2) {
        return `${this.formatChicago(authors[0], true, false)}, and ${this.formatChicago(authors[1], false, false)}`;
      } else {
        const formatted = authors.slice(0, -1).map((author, index) => 
          this.formatChicago(author, index === 0, false)
        ).join(', ');
        return `${formatted}, and ${this.formatChicago(authors[authors.length - 1], false, false)}`;
      }
    }
  }

  /**
   * Format multiple authors for Harvard style
   * @param authors - Array of authors
   * @param isInlineCitation - Whether this is for inline citation
   * @returns Formatted author string
   */
  static formatMultipleHarvard(authors: Author[], isInlineCitation: boolean = false): string {
    // Harvard style is similar to APA
    return this.formatMultipleAPA(authors, isInlineCitation);
  }

  /**
   * Format multiple authors for APA style
   * @param authors - Array of authors
   * @param isInlineCitation - Whether this is for inline citation
   * @returns Formatted author string
   */
  static formatMultipleAPA(authors: Author[], isInlineCitation: boolean = false): string {
    if (authors.length === 0) return '';
    
    if (isInlineCitation) {
      if (authors.length === 1) {
        return this.formatAPA(authors[0], true);
      } else if (authors.length === 2) {
        return `${this.formatAPA(authors[0], true)} & ${this.formatAPA(authors[1], true)}`;
      } else if (authors.length <= 5) {
        const formatted = authors.slice(0, -1).map(author => this.formatAPA(author, true)).join(', ');
        return `${formatted}, & ${this.formatAPA(authors[authors.length - 1], true)}`;
      } else {
        // 6 or more authors: use first author + et al.
        return `${this.formatAPA(authors[0], true)} et al.`;
      }
    } else {
      // Bibliography formatting
      if (authors.length === 1) {
        return this.formatAPA(authors[0], false);
      } else if (authors.length <= 20) {
        const formatted = authors.slice(0, -1).map((author) =>
          this.formatAPA(author, false)
        ).join(', ');
        return `${formatted}, & ${this.formatAPA(authors[authors.length - 1], false)}`;
      } else {
        // More than 20 authors: list first 19, then ... then last author
        const first19 = authors.slice(0, 19).map((author) =>
          this.formatAPA(author, false)
        ).join(', ');
        const lastAuthor = this.formatAPA(authors[authors.length - 1], false);
        return `${first19}, ... ${lastAuthor}`;
      }
    }
  }
}
