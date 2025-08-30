/**
 * MLA Citation Style Module
 * Implements formatting for MLA (Modern Language Association) citation style
 */

import { Reference, ReferenceType } from '../../types/citation-types/reference-types';
import { normalizeAuthors } from '../../types/citation-types/author-types';
import { AuthorFormatter, DateFormatter, TitleFormatter } from '../formatters';

/**
 * Page formatter utility for MLA style
 */
class PageFormatter {
  /**
   * Format page numbers for MLA style
   * @param pages - Page range string (e.g., "123-145" or "123")
   * @returns Formatted page string
   */
  static formatMLA(pages?: string): string {
    if (!pages) return '';
    return pages; // MLA uses plain page numbers
  }
}

/**
 * MLA Citation Style Implementation
 */
export class MLAStyle {
  /**
   * Format inline citation for MLA style
   * @param reference - Reference object
   * @returns Formatted inline citation
   */
  static formatInlineCitation(reference: Reference): string {
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
   * Format bibliography entry for MLA style
   * @param reference - Reference object
   * @returns Formatted bibliography entry
   */
  static formatBibliographyEntry(reference: Reference): string {
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
        entry += this.formatJournalArticle(reference, title);
        break;
      case ReferenceType.BOOK:
        entry += this.formatBook(reference, title);
        break;
      case ReferenceType.WEBSITE:
        entry += this.formatWebsite(reference, title);
        break;
      default:
        entry += this.formatGeneric(reference, title);
    }
    
    return entry.trim();
  }

  /**
   * Format journal article for MLA style
   * @param reference - Reference object
   * @param title - Article title
   * @returns Formatted journal article entry
   */
  private static formatJournalArticle(reference: Reference, title: string): string {
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
      
      if (reference.publicationDate || reference.publication_date) {
        const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
        entry += `, ${DateFormatter.formatMLA(pubDate)}`;
      }
      
      if (reference.pages) {
        entry += `, pp. ${PageFormatter.formatMLA(reference.pages)}`;
      }
      
      entry += '.';
    }
    
    if (reference.url) {
      entry += ` Web.`;
      const accessDate = reference.accessDate || (reference.access_date ? new Date(reference.access_date) : undefined);
      if (accessDate) {
        const day = accessDate.getDate();
        const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
        const month = months[accessDate.getMonth()];
        const year = accessDate.getFullYear();
        entry += ` ${day} ${month} ${year}.`;
      }
    }
    
    return entry;
  }

  /**
   * Format book for MLA style
   * @param reference - Reference object
   * @param title - Book title
   * @returns Formatted book entry
   */
  private static formatBook(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `*${title}*.`;
    }
    
    if (reference.publisher) {
      entry += ` ${reference.publisher}`;
    }
    
    if (reference.publicationDate || reference.publication_date) {
      const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
      entry += `, ${DateFormatter.formatMLA(pubDate)}`;
    }
    
    entry += '.';
    
    return entry;
  }

  /**
   * Format website for MLA style
   * @param reference - Reference object
   * @param title - Website title
   * @returns Formatted website entry
   */
  private static formatWebsite(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `"${title}." `;
    }
    
    if (reference.publisher) {
      entry += `*${reference.publisher}*`;
    }
    
    if (reference.publicationDate || reference.publication_date) {
      const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
      entry += `, ${DateFormatter.formatMLA(pubDate)}`;
    }
    
    entry += '. Web.';
    
    const accessDate = reference.accessDate || (reference.access_date ? new Date(reference.access_date) : undefined);
    if (accessDate) {
      const day = accessDate.getDate();
      const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
      const month = months[accessDate.getMonth()];
      const year = accessDate.getFullYear();
      entry += ` ${day} ${month} ${year}.`;
    }
    
    return entry;
  }

  /**
   * Format generic reference for MLA style
   * @param reference - Reference object
   * @param title - Reference title
   * @returns Formatted generic entry
   */
  private static formatGeneric(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `*${title}*.`;
    }
    
    if (reference.publisher) {
      entry += ` ${reference.publisher}`;
    }
    
    if (reference.publicationDate || reference.publication_date) {
      const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
      entry += `, ${DateFormatter.formatMLA(pubDate)}`;
    }
    
    entry += '.';
    
    return entry;
  }
}
