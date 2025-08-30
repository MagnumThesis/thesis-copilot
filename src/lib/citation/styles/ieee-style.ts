/**
 * IEEE Citation Style Module
 * Implements formatting for IEEE (Institute of Electrical and Electronics Engineers) citation style
 */

import { Reference, ReferenceType } from '../../types/citation-types/reference-types';
import { normalizeAuthors } from '../../types/citation-types/author-types';
import { AuthorFormatter, DateFormatter, TitleFormatter } from '../formatters';

/**
 * IEEE Citation Style Implementation
 */
export class IEEEStyle {
  /**
   * Format inline citation for IEEE style
   * @param reference - Reference object
   * @returns Formatted inline citation
   */
  static formatInlineCitation(reference: Reference): string {
    // IEEE uses numbered citations [1], [2], etc.
    // This would require a reference counter/numbering system
    // For now, we'll return a placeholder
    return `[${reference.id.substring(0, 2)}]`;
  }

  /**
   * Format bibliography entry for IEEE style
   * @param reference - Reference object
   * @returns Formatted bibliography entry
   */
  static formatBibliographyEntry(reference: Reference): string {
    const authors = this.formatAuthorsIEEE(normalizeAuthors(reference.authors));
    const title = reference.title;
    
    let entry = '';
    
    // Author
    if (authors) {
      entry += `${authors}, `;
    }
    
    // Format based on reference type
    switch (reference.type) {
      case ReferenceType.JOURNAL_ARTICLE:
        entry += this.formatJournalArticle(reference, title);
        break;
      case ReferenceType.BOOK:
        entry += this.formatBook(reference, title);
        break;
      case ReferenceType.CONFERENCE_PAPER:
        entry += this.formatConferencePaper(reference, title);
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
   * Format authors for IEEE style
   * @param authors - Array of normalized authors
   * @returns Formatted author string
   */
  private static formatAuthorsIEEE(authors: any[]): string {
    if (!authors || authors.length === 0) return '';
    
    if (authors.length === 1) {
      const author = authors[0];
      return `${author.firstName ? author.firstName.charAt(0) + '. ' : ''}${author.lastName}`;
    }
    
    const formatted = authors.map((author, index) => {
      return `${author.firstName ? author.firstName.charAt(0) + '. ' : ''}${author.lastName}`;
    });
    
    if (authors.length <= 6) {
      return formatted.join(', ');
    } else {
      // For more than 6 authors, use "et al." after the first 6
      return formatted.slice(0, 6).join(', ') + ', et al.';
    }
  }

  /**
   * Format journal article for IEEE style
   * @param reference - Reference object
   * @param title - Article title
   * @returns Formatted journal article entry
   */
  private static formatJournalArticle(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `"${title}," `;
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
        entry += `, pp. ${reference.pages}`;
      }
      
      const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
      if (pubDate) {
        const month = pubDate.toLocaleDateString('en-US', { month: 'short' });
        const year = pubDate.getFullYear();
        entry += `, ${month}. ${year}`;
      }
      
      entry += '.';
    }
    
    if (reference.doi) {
      entry += ` doi: ${reference.doi}`;
    }
    
    return entry;
  }

  /**
   * Format book for IEEE style
   * @param reference - Reference object
   * @param title - Book title
   * @returns Formatted book entry
   */
  private static formatBook(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `*${title}*`;
      
      if (reference.edition && reference.edition !== '1st') {
        entry += `, ${reference.edition} ed.`;
      }
      
      entry += '. ';
    }
    
    if (reference.publisher) {
      entry += `${reference.publisher}`;
      
      const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
      if (pubDate) {
        entry += `, ${pubDate.getFullYear()}`;
      }
      
      entry += '.';
    }
    
    return entry;
  }

  /**
   * Format conference paper for IEEE style
   * @param reference - Reference object
   * @param title - Paper title
   * @returns Formatted conference paper entry
   */
  private static formatConferencePaper(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `"${title}," `;
    }
    
    if (reference.journal) { // Using journal field for conference name
      entry += `in *${reference.journal}*`;
      
      const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
      if (pubDate) {
        entry += `, ${pubDate.getFullYear()}`;
      }
      
      if (reference.pages) {
        entry += `, pp. ${reference.pages}`;
      }
      
      entry += '.';
    }
    
    if (reference.doi) {
      entry += ` doi: ${reference.doi}`;
    }
    
    return entry;
  }

  /**
   * Format website for IEEE style
   * @param reference - Reference object
   * @param title - Website title
   * @returns Formatted website entry
   */
  private static formatWebsite(reference: Reference, title: string): string {
    let entry = '';
    
    if (title) {
      entry += `"${title}," `;
    }
    
    if (reference.publisher) {
      entry += `*${reference.publisher}*`;
    }
    
    if (reference.url) {
      entry += `. [Online]. Available: ${reference.url}`;
      
      const accessDate = reference.accessDate || (reference.access_date ? new Date(reference.access_date) : undefined);
      if (accessDate) {
        const month = accessDate.toLocaleDateString('en-US', { month: 'short' });
        const day = accessDate.getDate();
        const year = accessDate.getFullYear();
        entry += `. [Accessed: ${day}-${month}-${year}]`;
      }
    }
    
    return entry;
  }

  /**
   * Format generic reference for IEEE style
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
      entry += `${reference.publisher}`;
      
      const pubDate = reference.publicationDate || (reference.publication_date ? new Date(reference.publication_date) : undefined);
      if (pubDate) {
        entry += `, ${pubDate.getFullYear()}`;
      }
      
      entry += '.';
    }
    
    return entry;
  }
}
