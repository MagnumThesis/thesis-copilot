/**
 * Harvard Citation Style Module
 * Implements formatting for Harvard citation style
 */

import { Reference, ReferenceType } from '../../types/citation-types/reference-types';
import { normalizeAuthors } from '../../types/citation-types/author-types';
import { AuthorFormatter, DateFormatter, TitleFormatter } from '../formatters';

/**
 * Page formatter utility for Harvard style
 */
class PageFormatter {
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
}

/**
 * Harvard Citation Style Implementation
 */
export class HarvardStyle {
  /**
   * Format inline citation for Harvard style
   * @param reference - Reference object
   * @returns Formatted inline citation
   */
  static formatInlineCitation(reference: Reference): string {
    const authors = AuthorFormatter.formatMultipleHarvard(normalizeAuthors(reference.authors), true);
    const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
    const year = DateFormatter.formatHarvard(pubDate);
    
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
   * Format bibliography entry for Harvard style
   * @param reference - Reference object
   * @returns Formatted bibliography entry
   */
  static formatBibliographyEntry(reference: Reference): string {
    const authors = AuthorFormatter.formatMultipleHarvard(normalizeAuthors(reference.authors), false);
    const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
    const year = DateFormatter.formatHarvard(pubDate);
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
        entry += this.formatJournalArticle(reference, authors ? title : '');
        break;
      case ReferenceType.BOOK:
        entry += this.formatBook(reference, authors ? title : '');
        break;
      case ReferenceType.WEBSITE:
        entry += this.formatWebsite(reference, authors ? title : '');
        break;
      default:
        entry += this.formatGeneric(reference, authors ? title : '');
    }
    
    return entry.trim();
  }

  /**
   * Format journal article for Harvard style
   * @param reference - Reference object
   * @param title - Article title
   * @returns Formatted journal article entry
   */
  private static formatJournalArticle(reference: Reference, title: string): string {
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

  /**
   * Format book for Harvard style
   * @param reference - Reference object
   * @param title - Book title
   * @returns Formatted book entry
   */
  private static formatBook(reference: Reference, title: string): string {
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
   * Format website for Harvard style
   * @param reference - Reference object
   * @param title - Website title
   * @returns Formatted website entry
   */
  private static formatWebsite(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `'${title}'`;
    }
    
    if (reference.publisher) {
      entry += `, *${reference.publisher}*`;
    }
    
    if (reference.url) {
      entry += `, viewed`;
      
      const accessDate = reference.accessDate || (reference.access_date ? new Date(reference.access_date) : undefined);
      if (accessDate) {
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

  /**
   * Format generic reference for Harvard style
   * @param reference - Reference object
   * @param title - Reference title
   * @returns Formatted generic entry
   */
  private static formatGeneric(reference: Reference, title: string): string {
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
}
