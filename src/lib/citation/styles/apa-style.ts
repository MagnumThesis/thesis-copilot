/**
 * APA Citation Style Module
 * Implements formatting for APA (American Psychological Association) citation style
 */

import { Reference, ReferenceType } from '../../types/citation-types/reference-types';
import { normalizeAuthors } from '../../types/citation-types/author-types';
import { AuthorFormatter, DateFormatter, TitleFormatter } from '../formatters';

/**
 * Page formatter utility for APA style
 */
class PageFormatter {
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
 * APA Citation Style Implementation
 */
export class APAStyle {
  /**
   * Format inline citation for APA style
   * @param reference - Reference object
   * @returns Formatted inline citation
   */
  static formatInlineCitation(reference: Reference): string {
    const authors = AuthorFormatter.formatMultipleAPA(normalizeAuthors(reference.authors), true);
    const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
    const year = DateFormatter.formatAPA(pubDate);
    
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
   * Format bibliography entry for APA style
   * @param reference - Reference object
   * @returns Formatted bibliography entry
   */
  static formatBibliographyEntry(reference: Reference): string {
    const authors = AuthorFormatter.formatMultipleAPA(normalizeAuthors(reference.authors), false);
    const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
    const year = DateFormatter.formatAPA(pubDate);
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
        entry += this.formatJournalArticle(reference, authors ? title : '');
        break;
      case ReferenceType.BOOK:
        entry += this.formatBook(reference, authors ? title : '');
        break;
      case ReferenceType.BOOK_CHAPTER:
        entry += this.formatBookChapter(reference, authors ? title : '');
        break;
      case ReferenceType.WEBSITE:
        entry += this.formatWebsite(reference, authors ? title : '');
        break;
      case ReferenceType.CONFERENCE_PAPER:
        entry += this.formatConferencePaper(reference, authors ? title : '');
        break;
      case ReferenceType.THESIS:
        entry += this.formatThesis(reference, authors ? title : '');
        break;
      case ReferenceType.REPORT:
        entry += this.formatReport(reference, authors ? title : '');
        break;
      default:
        entry += this.formatGeneric(reference, authors ? title : '');
    }
    
    return entry.trim();
  }

  /**
   * Format journal article for APA style
   * @param reference - Reference object
   * @param title - Article title
   * @returns Formatted journal article entry
   */
  private static formatJournalArticle(reference: Reference, title: string): string {
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
   * @param reference - Reference object
   * @param title - Book title
   * @returns Formatted book entry
   */
  private static formatBook(reference: Reference, title: string): string {
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
   * @param reference - Reference object
   * @param title - Chapter title
   * @returns Formatted book chapter entry
   */
  private static formatBookChapter(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `${title}. `;
    }
    
    if (reference.journal) { // Using journal field for book title
      entry += `In *${reference.journal}*`;
      
      if (reference.edition && reference.edition !== '1st') {
        entry += ` (${reference.edition} ed.)`;
      }
      
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
   * @param reference - Reference object
   * @param title - Website title
   * @returns Formatted website entry
   */
  private static formatWebsite(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `${title}. `;
    }
    
    if (reference.publisher) {
      entry += `*${reference.publisher}*. `;
    }
    
    if (reference.url) {
      entry += reference.url;
      
      const accessDate = reference.accessDate || (reference.access_date ? new Date(reference.access_date) : undefined);
      if (accessDate) {
        entry += `. ${this.formatAccessDate(accessDate)}`;
      }
    }
    
    return entry;
  }

  /**
   * Format conference paper for APA style
   * @param reference - Reference object
   * @param title - Paper title
   * @returns Formatted conference paper entry
   */
  private static formatConferencePaper(reference: Reference, title: string): string {
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
   * @param reference - Reference object
   * @param title - Thesis title
   * @returns Formatted thesis entry
   */
  private static formatThesis(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `*${title}* [Unpublished doctoral dissertation]. `;
    }
    
    if (reference.publisher) {
      entry += `${reference.publisher}. `;
    }
    
    if (reference.url) {
      entry += reference.url;
    }
    
    return entry;
  }

  /**
   * Format report for APA style
   * @param reference - Reference object
   * @param title - Report title
   * @returns Formatted report entry
   */
  private static formatReport(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `*${title}*`;
      
      if (reference.pages) {
        entry += ` (Report No. ${reference.pages})`;
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
   * @param reference - Reference object
   * @param title - Reference title
   * @returns Formatted generic entry
   */
  private static formatGeneric(reference: Reference, title: string): string {
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

  /**
   * Format access date for APA style
   * @param date - Access date
   * @returns Formatted access date string
   */
  private static formatAccessDate(date?: Date): string {
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
