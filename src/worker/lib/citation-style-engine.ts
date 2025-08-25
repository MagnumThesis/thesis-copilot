/**
 * Citation Style Engine
 * Handles formatting of citations and bibliographies according to academic styles
 */

import { Reference, Author, CitationStyle, ReferenceType, ValidationResult, ValidationError, normalizeAuthors } from '../../lib/ai-types.js';

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
   * @param isFirstAuthor - Whether this is the first author in a list
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
   * @param isFirstAuthor - Whether this is the first author in a list
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
        const formatted = authors.slice(0, -1).map((author, index) =>
          this.formatAPA(author, index === 0)
        ).join(', ');
        return `${formatted}, & ${this.formatAPA(authors[authors.length - 1], false)}`;
      } else {
        // More than 20 authors: list first 19, then ... then last author
        const first19 = authors.slice(0, 19).map((author, index) =>
          this.formatAPA(author, index === 0)
        ).join(', ');
        const lastAuthor = this.formatAPA(authors[authors.length - 1], false);
        return `${first19}, ... ${lastAuthor}`;
      }
    }
  }
}

/**
 * Date formatting utilities
 */
export class DateFormatter {
  /**
   * Format date for MLA style
   * @param date - Date object or undefined
   * @returns Formatted date string
   */
  static formatMLA(date?: Date): string {
    if (!date) return '';
    
    const year = date.getFullYear();
    return year.toString();
  }

  /**
   * Format date for Chicago style
   * @param date - Date object or undefined
   * @returns Formatted date string
   */
  static formatChicago(date?: Date): string {
    if (!date) return '';
    
    const year = date.getFullYear();
    return year.toString();
  }

  /**
   * Format date for Harvard style
   * @param date - Date object or undefined
   * @returns Formatted date string
   */
  static formatHarvard(date?: Date): string {
    if (!date) return 'n.d.'; // no date
    
    const year = date.getFullYear();
    return year.toString();
  }

  /**
   * Format date for APA style
   * @param date - Date object or undefined
   * @returns Formatted date string
   */
  static formatAPA(date?: Date): string {
    if (!date) return 'n.d.'; // no date
    
    const year = date.getFullYear();
    return year.toString();
  }

  /**
   * Format access date for APA style
   * @param date - Access date
   * @returns Formatted access date string
   */
  static formatAccessDateAPA(date?: Date): string {
    if (!date) return '';
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `Retrieved ${month} ${day}, ${year}`;
  }
}

/**
 * Page formatting utilities
 */
export class PageFormatter {
  /**
   * Format page numbers for MLA style
   * @param pages - Page range string (e.g., "123-145" or "123")
   * @returns Formatted page string
   */
  static formatMLA(pages?: string): string {
    if (!pages) return '';
    return pages; // MLA uses plain page numbers
  }

  /**
   * Format page numbers for Chicago style
   * @param pages - Page range string (e.g., "123-145" or "123")
   * @returns Formatted page string
   */
  static formatChicago(pages?: string): string {
    if (!pages) return '';
    return pages; // Chicago uses plain page numbers
  }

  /**
   * Format page numbers for Harvard style
   * @param pages - Page range string (e.g., "123-145" or "123")
   * @returns Formatted page string
   */
  static formatHarvard(pages?: string): string {
    if (!pages) return '';
    
    // Check if it's a range (contains dash or hyphen)
    if (pages.includes('-') || pages.includes('–')) {
      return `pp. ${pages}`;
    } else {
      return `p. ${pages}`;
    }
  }

  /**
   * Format page numbers for APA style
   * @param pages - Page range string (e.g., "123-145" or "123")
   * @returns Formatted page string
   */
  static formatAPA(pages?: string): string {
    if (!pages) return '';
    
    // Check if it's a range (contains dash or hyphen)
    if (pages.includes('-') || pages.includes('–')) {
      return `pp. ${pages}`;
    } else {
      return `p. ${pages}`;
    }
  }
}

/**
 * Main Citation Style Engine
 */
export class CitationStyleEngine {
  /**
   * Format inline citation for MLA style
   * @param reference - Reference object
   * @returns Formatted inline citation
   */
  static formatInlineCitationMLA(reference: Reference): string {
    const authors = AuthorFormatter.formatMultipleMLA(normalizeAuthors(reference.authors), true);
    
    if (!authors) {
      // No author - use title
      const shortTitle = reference.title.length > 30 
        ? `${reference.title.substring(0, 27)}...` 
        : reference.title;
      return `("${shortTitle}")`;
    }
    
    // MLA includes page numbers in inline citations if available
    if (reference.pages) {
      const pages = PageFormatter.formatMLA(reference.pages);
      return `(${authors} ${pages})`;
    }
    
    return `(${authors})`;
  }

  /**
   * Format inline citation for Chicago style
   * @param reference - Reference object
   * @returns Formatted inline citation
   */
  static formatInlineCitationChicago(reference: Reference): string {
    const authors = AuthorFormatter.formatMultipleChicago(normalizeAuthors(reference.authors), true);
    const year = DateFormatter.formatChicago(reference.publicationDate);
    
    if (!authors) {
      // No author - use title
      const shortTitle = reference.title.length > 30 
        ? `${reference.title.substring(0, 27)}...` 
        : reference.title;
      return `("${shortTitle}" ${year})`;
    }
    
    // Chicago includes page numbers in inline citations if available
    if (reference.pages) {
      const pages = PageFormatter.formatChicago(reference.pages);
      return `(${authors} ${year}, ${pages})`;
    }
    
    return `(${authors} ${year})`;
  }

  /**
   * Format inline citation for Harvard style
   * @param reference - Reference object
   * @returns Formatted inline citation
   */
  static formatInlineCitationHarvard(reference: Reference): string {
    const authors = AuthorFormatter.formatMultipleHarvard(normalizeAuthors(reference.authors), true);
    const year = DateFormatter.formatHarvard(reference.publicationDate);
    
    if (!authors) {
      // No author - use title
      const shortTitle = reference.title.length > 50 
        ? `${reference.title.substring(0, 47)}...` 
        : reference.title;
      return `("${shortTitle}," ${year})`;
    }
    
    return `(${authors} ${year})`;
  }

  /**
   * Format inline citation for APA style
   * @param reference - Reference object
   * @returns Formatted inline citation
   */
  static formatInlineCitationAPA(reference: Reference): string {
    const authors = AuthorFormatter.formatMultipleAPA(normalizeAuthors(reference.authors), true);
    const year = DateFormatter.formatAPA(reference.publicationDate);
    
    if (!authors) {
      // No author - use title
      const shortTitle = reference.title.length > 50 
        ? `${reference.title.substring(0, 47)}...` 
        : reference.title;
      return `("${shortTitle}," ${year})`;
    }
    
    return `(${authors}, ${year})`;
  }

  /**
   * Format bibliography entry for MLA style
   * @param reference - Reference object
   * @returns Formatted bibliography entry
   */
  static formatBibliographyEntryMLA(reference: Reference): string {
    const authors = AuthorFormatter.formatMultipleMLA(normalizeAuthors(reference.authors), false);
    const title = reference.title;
    
    let entry = '';
    
    // Author
    if (authors) {
      entry += `${authors}. `;
    }
    
    // Format based on reference type
    switch (reference.type) {
      case ReferenceType.JOURNAL_ARTICLE:
        entry += this.formatJournalArticleMLA(reference, title);
        break;
      case ReferenceType.BOOK:
        entry += this.formatBookMLA(reference, title);
        break;
      case ReferenceType.WEBSITE:
        entry += this.formatWebsiteMLA(reference, title);
        break;
      default:
        entry += this.formatGenericMLA(reference, title);
    }
    
    return entry.trim();
  }

  /**
   * Format bibliography entry for Chicago style
   * @param reference - Reference object
   * @returns Formatted bibliography entry
   */
  static formatBibliographyEntryChicago(reference: Reference): string {
    const authors = AuthorFormatter.formatMultipleChicago(normalizeAuthors(reference.authors), false);
    const title = reference.title;
    
    let entry = '';
    
    // Author
    if (authors) {
      entry += `${authors}. `;
    }
    
    // Format based on reference type
    switch (reference.type) {
      case ReferenceType.JOURNAL_ARTICLE:
        entry += this.formatJournalArticleChicago(reference, title);
        break;
      case ReferenceType.BOOK:
        entry += this.formatBookChicago(reference, title);
        break;
      case ReferenceType.WEBSITE:
        entry += this.formatWebsiteChicago(reference, title);
        break;
      default:
        entry += this.formatGenericChicago(reference, title);
    }
    
    return entry.trim();
  }

  /**
   * Format bibliography entry for Harvard style
   * @param reference - Reference object
   * @returns Formatted bibliography entry
   */
  static formatBibliographyEntryHarvard(reference: Reference): string {
    const authors = AuthorFormatter.formatMultipleHarvard(normalizeAuthors(reference.authors), false);
    const year = DateFormatter.formatHarvard(reference.publicationDate);
    const title = reference.title;
    
    let entry = '';
    
    // Author and year
    if (authors) {
      entry += `${authors} ${year}, `;
    } else {
      entry += `${title} ${year}, `;
    }
    
    // Format based on reference type
    switch (reference.type) {
      case ReferenceType.JOURNAL_ARTICLE:
        entry += this.formatJournalArticleHarvard(reference, authors ? title : '');
        break;
      case ReferenceType.BOOK:
        entry += this.formatBookHarvard(reference, authors ? title : '');
        break;
      case ReferenceType.WEBSITE:
        entry += this.formatWebsiteHarvard(reference, authors ? title : '');
        break;
      default:
        entry += this.formatGenericHarvard(reference, authors ? title : '');
    }
    
    return entry.trim();
  }

  /**
   * Format bibliography entry for APA style
   * @param reference - Reference object
   * @returns Formatted bibliography entry
   */
  static formatBibliographyEntryAPA(reference: Reference): string {
    const authors = AuthorFormatter.formatMultipleAPA(normalizeAuthors(reference.authors), false);
    const year = DateFormatter.formatAPA(reference.publicationDate);
    const title = reference.title;
    
    let entry = '';
    
    // Author and year
    if (authors) {
      entry += `${authors} (${year}). `;
    } else {
      entry += `${title} (${year}). `;
    }
    
    // Format based on reference type
    switch (reference.type) {
      case ReferenceType.JOURNAL_ARTICLE:
        entry += this.formatJournalArticleAPA(reference, authors ? title : '');
        break;
      case ReferenceType.BOOK:
        entry += this.formatBookAPA(reference, authors ? title : '');
        break;
      case ReferenceType.BOOK_CHAPTER:
        entry += this.formatBookChapterAPA(reference, authors ? title : '');
        break;
      case ReferenceType.WEBSITE:
        entry += this.formatWebsiteAPA(reference, authors ? title : '');
        break;
      case ReferenceType.CONFERENCE_PAPER:
        entry += this.formatConferencePaperAPA(reference, authors ? title : '');
        break;
      case ReferenceType.THESIS:
        entry += this.formatThesisAPA(reference, authors ? title : '');
        break;
      case ReferenceType.REPORT:
        entry += this.formatReportAPA(reference, authors ? title : '');
        break;
      default:
        entry += this.formatGenericAPA(reference, authors ? title : '');
    }
    
    return entry.trim();
  }

  /**
   * Format journal article for APA style
   */
  private static formatJournalArticleAPA(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `${title}. `;
    }
    
    if (reference.journal) {
      entry += `*${reference.journal}*`;
      
      if (reference.volume) {
        entry += `, *${reference.volume}*`;
        
        if (reference.issue) {
          entry += `(${reference.issue})`;
        }
      }
      
      if (reference.pages) {
        entry += `, ${PageFormatter.formatAPA(reference.pages)}`;
      }
      
      entry += '. ';
    }
    
    if (reference.doi) {
      entry += `https://doi.org/${reference.doi}`;
    } else if (reference.url) {
      entry += reference.url;
    }
    
    return entry;
  }

  /**
   * Format book for APA style
   */
  private static formatBookAPA(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `*${title}*`;
      
      if (reference.edition && reference.edition !== '1st') {
        entry += ` (${reference.edition} ed.)`;
      }
      
      entry += '. ';
    }
    
    if (reference.publisher) {
      entry += `${reference.publisher}. `;
    }
    
    if (reference.doi) {
      entry += `https://doi.org/${reference.doi}`;
    } else if (reference.url) {
      entry += reference.url;
    }
    
    return entry;
  }

  /**
   * Format book chapter for APA style
   */
  private static formatBookChapterAPA(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `${title}. `;
    }
    
    if (reference.editor) {
      entry += `In ${reference.editor} (Ed.), `;
    }
    
    if (reference.journal) { // Using journal field for book title
      entry += `*${reference.journal}*`;
      
      if (reference.pages) {
        entry += ` (${PageFormatter.formatAPA(reference.pages)})`;
      }
      
      entry += '. ';
    }
    
    if (reference.publisher) {
      entry += `${reference.publisher}. `;
    }
    
    if (reference.doi) {
      entry += `https://doi.org/${reference.doi}`;
    } else if (reference.url) {
      entry += reference.url;
    }
    
    return entry;
  }

  /**
   * Format website for APA style
   */
  private static formatWebsiteAPA(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `${title}. `;
    }
    
    if (reference.publisher) {
      entry += `*${reference.publisher}*. `;
    }
    
    if (reference.url) {
      entry += reference.url;
      
      if (reference.accessDate) {
        entry += `. ${DateFormatter.formatAccessDateAPA(reference.accessDate)}`;
      }
    }
    
    return entry;
  }

  /**
   * Format conference paper for APA style
   */
  private static formatConferencePaperAPA(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `${title}. `;
    }
    
    if (reference.journal) { // Using journal field for conference name
      entry += `Paper presented at ${reference.journal}`;
      
      if (reference.publisher) { // Using publisher for location
        entry += `, ${reference.publisher}`;
      }
      
      entry += '. ';
    }
    
    if (reference.doi) {
      entry += `https://doi.org/${reference.doi}`;
    } else if (reference.url) {
      entry += reference.url;
    }
    
    return entry;
  }

  /**
   * Format thesis for APA style
   */
  private static formatThesisAPA(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `*${title}*`;
      
      // Determine thesis type from notes or default to "Doctoral dissertation"
      const thesisType = reference.notes?.toLowerCase().includes('master') 
        ? 'Master\'s thesis' 
        : 'Doctoral dissertation';
      
      entry += ` [${thesisType}]. `;
    }
    
    if (reference.publisher) {
      entry += `${reference.publisher}. `;
    }
    
    if (reference.doi) {
      entry += `https://doi.org/${reference.doi}`;
    } else if (reference.url) {
      entry += reference.url;
    }
    
    return entry;
  }

  /**
   * Format report for APA style
   */
  private static formatReportAPA(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `*${title}*`;
      
      if (reference.volume) { // Using volume for report number
        entry += ` (Report No. ${reference.volume})`;
      }
      
      entry += '. ';
    }
    
    if (reference.publisher) {
      entry += `${reference.publisher}. `;
    }
    
    if (reference.doi) {
      entry += `https://doi.org/${reference.doi}`;
    } else if (reference.url) {
      entry += reference.url;
    }
    
    return entry;
  }

  /**
   * Format generic reference for APA style
   */
  private static formatGenericAPA(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `*${title}*. `;
    }
    
    if (reference.publisher) {
      entry += `${reference.publisher}. `;
    }
    
    if (reference.doi) {
      entry += `https://doi.org/${reference.doi}`;
    } else if (reference.url) {
      entry += reference.url;
    }
    
    return entry;
  }

  // MLA formatting methods
  private static formatJournalArticleMLA(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `"${title}." `;
    }
    
    if (reference.journal) {
      entry += `*${reference.journal}*`;
      
      if (reference.volume) {
        entry += `, vol. ${reference.volume}`;
        
        if (reference.issue) {
          entry += `, no. ${reference.issue}`;
        }
      }
      
      if (reference.publicationDate) {
        entry += `, ${DateFormatter.formatMLA(reference.publicationDate)}`;
      }
      
      if (reference.pages) {
        entry += `, pp. ${PageFormatter.formatMLA(reference.pages)}`;
      }
      
      entry += '.';
    }
    
    if (reference.url) {
      entry += ` Web.`;
      if (reference.accessDate) {
        const accessDate = reference.accessDate;
        const day = accessDate.getDate();
        const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
        const month = months[accessDate.getMonth()];
        const year = accessDate.getFullYear();
        entry += ` ${day} ${month} ${year}.`;
      }
    }
    
    return entry;
  }

  private static formatBookMLA(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `*${title}*.`;
    }
    
    if (reference.publisher) {
      entry += ` ${reference.publisher}`;
    }
    
    if (reference.publicationDate) {
      entry += `, ${DateFormatter.formatMLA(reference.publicationDate)}`;
    }
    
    entry += '.';
    
    return entry;
  }

  private static formatWebsiteMLA(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `"${title}." `;
    }
    
    if (reference.publisher) {
      entry += `*${reference.publisher}*`;
    }
    
    if (reference.publicationDate) {
      entry += `, ${DateFormatter.formatMLA(reference.publicationDate)}`;
    }
    
    entry += '. Web.';
    
    if (reference.accessDate) {
      const accessDate = reference.accessDate;
      const day = accessDate.getDate();
      const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
      const month = months[accessDate.getMonth()];
      const year = accessDate.getFullYear();
      entry += ` ${day} ${month} ${year}.`;
    }
    
    return entry;
  }

  private static formatGenericMLA(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `*${title}*.`;
    }
    
    if (reference.publisher) {
      entry += ` ${reference.publisher}`;
    }
    
    if (reference.publicationDate) {
      entry += `, ${DateFormatter.formatMLA(reference.publicationDate)}`;
    }
    
    entry += '.';
    
    return entry;
  }

  // Chicago formatting methods
  private static formatJournalArticleChicago(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `"${title}." `;
    }
    
    if (reference.journal) {
      entry += `*${reference.journal}*`;
      
      if (reference.volume) {
        entry += ` ${reference.volume}`;
        
        if (reference.issue) {
          entry += `, no. ${reference.issue}`;
        }
      }
      
      if (reference.publicationDate) {
        entry += ` (${DateFormatter.formatChicago(reference.publicationDate)})`;
      }
      
      if (reference.pages) {
        entry += `: ${PageFormatter.formatChicago(reference.pages)}`;
      }
      
      entry += '.';
    }
    
    if (reference.doi) {
      entry += ` https://doi.org/${reference.doi}.`;
    } else if (reference.url) {
      entry += ` ${reference.url}.`;
    }
    
    return entry;
  }

  private static formatBookChicago(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `*${title}*.`;
    }
    
    if (reference.publisher) {
      entry += ` ${reference.publisher}`;
    }
    
    if (reference.publicationDate) {
      entry += `, ${DateFormatter.formatChicago(reference.publicationDate)}`;
    }
    
    entry += '.';
    
    return entry;
  }

  private static formatWebsiteChicago(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `"${title}." `;
    }
    
    if (reference.publisher) {
      entry += `*${reference.publisher}*.`;
    }
    
    if (reference.publicationDate) {
      entry += ` ${DateFormatter.formatChicago(reference.publicationDate)}.`;
    }
    
    if (reference.url) {
      entry += ` ${reference.url}`;
      
      if (reference.accessDate) {
        const accessDate = reference.accessDate;
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const month = months[accessDate.getMonth()];
        const day = accessDate.getDate();
        const year = accessDate.getFullYear();
        entry += ` (accessed ${month} ${day}, ${year})`;
      }
      
      entry += '.';
    }
    
    return entry;
  }

  private static formatGenericChicago(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `*${title}*.`;
    }
    
    if (reference.publisher) {
      entry += ` ${reference.publisher}`;
    }
    
    if (reference.publicationDate) {
      entry += `, ${DateFormatter.formatChicago(reference.publicationDate)}`;
    }
    
    entry += '.';
    
    return entry;
  }

  // Harvard formatting methods
  private static formatJournalArticleHarvard(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `'${title}', `;
    }
    
    if (reference.journal) {
      entry += `*${reference.journal}*`;
      
      if (reference.volume) {
        entry += `, vol. ${reference.volume}`;
        
        if (reference.issue) {
          entry += `, no. ${reference.issue}`;
        }
      }
      
      if (reference.pages) {
        entry += `, ${PageFormatter.formatHarvard(reference.pages)}`;
      }
      
      entry += '.';
    }
    
    if (reference.doi) {
      entry += ` https://doi.org/${reference.doi}`;
    } else if (reference.url) {
      entry += ` ${reference.url}`;
    }
    
    return entry;
  }

  private static formatBookHarvard(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `*${title}*`;
    }
    
    if (reference.publisher) {
      entry += `, ${reference.publisher}`;
    }
    
    entry += '.';
    
    if (reference.url) {
      entry += ` ${reference.url}`;
    }
    
    return entry;
  }

  private static formatWebsiteHarvard(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `'${title}'`;
    }
    
    if (reference.publisher) {
      entry += `, *${reference.publisher}*`;
    }
    
    if (reference.url) {
      entry += `, viewed`;
      
      if (reference.accessDate) {
        const accessDate = reference.accessDate;
        const day = accessDate.getDate();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const month = months[accessDate.getMonth()];
        const year = accessDate.getFullYear();
        entry += ` ${day} ${month} ${year}`;
      }
      
      entry += `, <${reference.url}>`;
    }
    
    entry += '.';
    
    return entry;
  }

  private static formatGenericHarvard(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `*${title}*`;
    }
    
    if (reference.publisher) {
      entry += `, ${reference.publisher}`;
    }
    
    entry += '.';
    
    if (reference.url) {
      entry += ` ${reference.url}`;
    }
    
    return entry;
  }

  /**
   * Generate bibliography from multiple references
   * @param references - Array of references
   * @param style - Citation style
   * @param sortOrder - Sorting order for bibliography
   * @returns Formatted bibliography string
   */
  static generateBibliography(
    references: Reference[], 
    style: CitationStyle, 
    sortOrder: 'alphabetical' | 'chronological' | 'appearance' = 'alphabetical'
  ): string {
    if (references.length === 0) {
      return '';
    }

    // Remove duplicates based on DOI or title+author combination
    const uniqueReferences = this.removeDuplicateReferences(references);

    // Sort references according to specified order
    const sortedReferences = this.sortReferences(uniqueReferences, sortOrder);

    // Format each reference as bibliography entry
    const bibliographyEntries = sortedReferences.map(ref => 
      this.formatBibliographyEntry(ref, style)
    );

    // Join entries with double line breaks for proper bibliography formatting
    return bibliographyEntries.join('\n\n');
  }

  /**
   * Remove duplicate references from array
   * @param references - Array of references
   * @returns Array with duplicates removed
   */
  private static removeDuplicateReferences(references: Reference[]): Reference[] {
    const seen = new Set<string>();
    const uniqueReferences: Reference[] = [];

    for (const ref of references) {
      // Create a unique key based on DOI (if available) or title+first author
      let key: string;
      
      if (ref.doi) {
        key = `doi:${ref.doi.toLowerCase()}`;
      } else {
        const normalizedAuthors = normalizeAuthors(ref.authors);
        const firstAuthor = normalizedAuthors.length > 0 
          ? `${normalizedAuthors[0].lastName.toLowerCase()}_${normalizedAuthors[0].firstName.toLowerCase()}`
          : 'no_author';
        key = `title:${ref.title.toLowerCase().replace(/\s+/g, '_')}_${firstAuthor}`;
      }

      if (!seen.has(key)) {
        seen.add(key);
        uniqueReferences.push(ref);
      }
    }

    return uniqueReferences;
  }

  /**
   * Sort references according to specified order
   * @param references - Array of references
   * @param sortOrder - Sorting order
   * @returns Sorted array of references
   */
  private static sortReferences(
    references: Reference[], 
    sortOrder: 'alphabetical' | 'chronological' | 'appearance'
  ): Reference[] {
    const sortedRefs = [...references];

    switch (sortOrder) {
      case 'alphabetical':
        return sortedRefs.sort((a, b) => {
          // Sort by first author's last name, then first name, then title
          const aNormalizedAuthors = normalizeAuthors(a.authors);
          const bNormalizedAuthors = normalizeAuthors(b.authors);
          const aAuthor = aNormalizedAuthors.length > 0 ? aNormalizedAuthors[0] : null;
          const bAuthor = bNormalizedAuthors.length > 0 ? bNormalizedAuthors[0] : null;

          if (!aAuthor && !bAuthor) {
            return a.title.localeCompare(b.title);
          }
          if (!aAuthor) return 1; // References without authors go last
          if (!bAuthor) return -1;

          const lastNameCompare = aAuthor.lastName.localeCompare(bAuthor.lastName);
          if (lastNameCompare !== 0) return lastNameCompare;

          const firstNameCompare = aAuthor.firstName.localeCompare(bAuthor.firstName);
          if (firstNameCompare !== 0) return firstNameCompare;

          return a.title.localeCompare(b.title);
        });

      case 'chronological':
        return sortedRefs.sort((a, b) => {
          // Sort by publication date (newest first), then alphabetically
          const aDate = a.publicationDate?.getTime() || 0;
          const bDate = b.publicationDate?.getTime() || 0;

          if (aDate !== bDate) {
            return bDate - aDate; // Newest first
          }

          // If dates are the same, sort alphabetically by author
          const aNormalizedAuthors = normalizeAuthors(a.authors);
          const bNormalizedAuthors = normalizeAuthors(b.authors);
          const aAuthor = aNormalizedAuthors.length > 0 ? aNormalizedAuthors[0].lastName : a.title;
          const bAuthor = bNormalizedAuthors.length > 0 ? bNormalizedAuthors[0].lastName : b.title;
          return aAuthor.localeCompare(bAuthor);
        });

      case 'appearance':
        // Keep original order (order of appearance in document)
        return sortedRefs;

      default:
        return sortedRefs;
    }
  }

  /**
   * Detect duplicate references in a list
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
      const normalized1 = normalizeAuthors(ref1.authors);
      const normalized2 = normalizeAuthors(ref2.authors);
      if (normalized1.length > 0 && normalized2.length > 0) {
        const author1 = normalized1[0];
        const author2 = normalized2[0];
        
        return author1.lastName.toLowerCase() === author2.lastName.toLowerCase() &&
               author1.firstName.toLowerCase() === author2.firstName.toLowerCase();
      }
      
      // If one has no authors, still consider it a duplicate if titles match exactly
      return true;
    }

    // For very different titles, don't consider them duplicates even if authors match
    // This prevents false positives like "Climate Change Research" vs "Environmental Studies"
    return false;
  }



  /**
   * Format inline citation based on style
   * @param reference - Reference object
   * @param style - Citation style
   * @returns Formatted inline citation
   */
  static formatInlineCitation(reference: Reference, style: CitationStyle): string {
    switch (style) {
      case CitationStyle.APA:
        return this.formatInlineCitationAPA(reference);
      case CitationStyle.MLA:
        return this.formatInlineCitationMLA(reference);
      case CitationStyle.CHICAGO:
        return this.formatInlineCitationChicago(reference);
      case CitationStyle.HARVARD:
        return this.formatInlineCitationHarvard(reference);
      default:
        throw new Error(`Citation style ${style} not yet implemented`);
    }
  }

  /**
   * Format bibliography entry based on style
   * @param reference - Reference object
   * @param style - Citation style
   * @returns Formatted bibliography entry
   */
  static formatBibliographyEntry(reference: Reference, style: CitationStyle): string {
    switch (style) {
      case CitationStyle.APA:
        return this.formatBibliographyEntryAPA(reference);
      case CitationStyle.MLA:
        return this.formatBibliographyEntryMLA(reference);
      case CitationStyle.CHICAGO:
        return this.formatBibliographyEntryChicago(reference);
      case CitationStyle.HARVARD:
        return this.formatBibliographyEntryHarvard(reference);
      default:
        throw new Error(`Citation style ${style} not yet implemented`);
    }
  }

  /**
   * Validate style requirements for a reference
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
    if (!reference.publicationDate) {
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
        if (!reference.accessDate) {
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
    if (!reference.publicationDate) {
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
    if (!reference.publicationDate) {
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
        if (!reference.accessDate) {
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
}
