/**
 * Chicago Citation Style Module
 * Implements formatting for Chicago Manual of Style citation style
 */

import { Reference, ReferenceType } from '../../types/citation-types/reference-types';
import { normalizeAuthors } from '../../types/citation-types/author-types';
import { AuthorFormatter, DateFormatter, TitleFormatter } from '../formatters';

/**
 * Page formatter utility for Chicago style
 */
class PageFormatter {
  /**
   * Format page numbers for Chicago style
   * @param pages - Page range string (e.g., "123-145" or "123")
   * @returns Formatted page string
   */
  static formatChicago(pages?: string): string {
    if (!pages) return '';
    return pages; // Chicago uses plain page numbers
  }
}

/**
 * Chicago Citation Style Implementation
 */
export class ChicagoStyle {
  /**
   * Format inline citation for Chicago style
   * @param reference - Reference object
   * @returns Formatted inline citation
   */
  static formatInlineCitation(reference: Reference): string {
    const authors = AuthorFormatter.formatMultipleChicago(normalizeAuthors(reference.authors), true);
    const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
    const year = DateFormatter.formatChicago(pubDate);
    
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
   * Format bibliography entry for Chicago style
   * @param reference - Reference object
   * @returns Formatted bibliography entry
   */
  static formatBibliographyEntry(reference: Reference): string {
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
   * Format journal article for Chicago style
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
        entry += ` ${reference.volume}`;
        
        if (reference.issue) {
          entry += `, no. ${reference.issue}`;
        }
      }
      
      const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
      if (pubDate) {
        entry += ` (${DateFormatter.formatChicago(pubDate)})`;
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

  /**
   * Format book for Chicago style
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
    
    const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
    if (pubDate) {
      entry += `, ${DateFormatter.formatChicago(pubDate)}`;
    }
    
    entry += '.';
    
    return entry;
  }

  /**
   * Format website for Chicago style
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
      entry += `*${reference.publisher}*.`;
    }
    
    const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
    if (pubDate) {
      entry += ` ${DateFormatter.formatChicago(pubDate)}.`;
    }
    
    if (reference.url) {
      entry += ` ${reference.url}`;
      
      const accessDate = reference.accessDate || (reference.access_date ? new Date(reference.access_date) : undefined);
      if (accessDate) {
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

  /**
   * Format generic reference for Chicago style
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
    
    const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
    if (pubDate) {
      entry += `, ${DateFormatter.formatChicago(pubDate)}`;
    }
    
    entry += '.';
    
    return entry;
  }
}
