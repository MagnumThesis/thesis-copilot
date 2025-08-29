/**
 * Title Formatter Module
 * Handles formatting of titles according to different academic citation styles
 */

/**
 * Title formatting utilities
 */
export class TitleFormatter {
  /**
   * Format title for MLA style
   * @param title - Title string
   * @param isJournalTitle - Whether this is a journal/book title (italicized)
   * @returns Formatted title string
   */
  static formatMLA(title: string, isJournalTitle: boolean = false): string {
    if (!title) return '';
    
    if (isJournalTitle) {
      // Journal and book titles are italicized
      return `*${title}*`;
    } else {
      // Article titles are in quotes
      return `"${title}"`;
    }
  }

  /**
   * Format title for Chicago style
   * @param title - Title string
   * @param isJournalTitle - Whether this is a journal/book title (italicized)
   * @returns Formatted title string
   */
  static formatChicago(title: string, isJournalTitle: boolean = false): string {
    if (!title) return '';
    
    if (isJournalTitle) {
      // Journal and book titles are italicized
      return `*${title}*`;
    } else {
      // Article titles are in quotes
      return `"${title}"`;
    }
  }

  /**
   * Format title for Harvard style
   * @param title - Title string
   * @param isJournalTitle - Whether this is a journal/book title (italicized)
   * @returns Formatted title string
   */
  static formatHarvard(title: string, isJournalTitle: boolean = false): string {
    if (!title) return '';
    
    if (isJournalTitle) {
      // Journal and book titles are italicized
      return `*${title}*`;
    } else {
      // Article titles use single quotes in Harvard style
      return `'${title}'`;
    }
  }

  /**
   * Format title for APA style
   * @param title - Title string
   * @param isJournalTitle - Whether this is a journal/book title (italicized)
   * @returns Formatted title string
   */
  static formatAPA(title: string, isJournalTitle: boolean = false): string {
    if (!title) return '';
    
    if (isJournalTitle) {
      // Journal and book titles are italicized and use title case
      return `*${title}*`;
    } else {
      // Article and chapter titles use sentence case (only first word and proper nouns capitalized)
      return this.toSentenceCase(title);
    }
  }

  /**
   * Convert title to sentence case (first word capitalized, rest lowercase except proper nouns)
   * @param title - Title string
   * @returns Title in sentence case
   */
  static toSentenceCase(title: string): string {
    if (!title) return '';
    
    // Simple implementation - capitalize first word and preserve capitalization after colons
    const words = title.split(' ');
    const result = words.map((word, index) => {
      if (index === 0) {
        // Capitalize first word
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      } else if (words[index - 1]?.endsWith(':')) {
        // Capitalize word after colon
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      } else {
        // Keep other words lowercase (in a real implementation, we'd preserve proper nouns)
        return word.toLowerCase();
      }
    });
    
    return result.join(' ');
  }

  /**
   * Convert title to title case (all major words capitalized)
   * @param title - Title string
   * @returns Title in title case
   */
  static toTitleCase(title: string): string {
    if (!title) return '';
    
    const minorWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet']);
    
    const words = title.split(' ');
    const result = words.map((word, index) => {
      const lowerWord = word.toLowerCase();
      
      // Always capitalize first and last words
      if (index === 0 || index === words.length - 1) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      
      // Don't capitalize minor words (articles, prepositions, conjunctions)
      if (minorWords.has(lowerWord)) {
        return lowerWord;
      }
      
      // Capitalize all other words
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    
    return result.join(' ');
  }

  /**
   * Create a shortened title for inline citations
   * @param title - Full title string
   * @param maxLength - Maximum length for shortened title
   * @returns Shortened title with ellipsis if truncated
   */
  static createShortTitle(title: string, maxLength: number = 50): string {
    if (!title) return '';
    
    if (title.length <= maxLength) {
      return title;
    }
    
    // Ensure we have room for the ellipsis
    const targetLength = maxLength - 3;
    if (targetLength < 1) {
      return title.substring(0, maxLength - 3) + '...';
    }
    
    // Find the last space before the targetLength to avoid cutting words
    const truncateIndex = title.lastIndexOf(' ', targetLength);
    const cutIndex = truncateIndex > 0 ? truncateIndex : targetLength;
    
    return `${title.substring(0, cutIndex)}...`;
  }

  /**
   * Format page numbers for citation
   * @param pages - Page range string (e.g., "123-145" or "123")
   * @param style - Citation style ('mla', 'chicago', 'harvard', 'apa')
   * @returns Formatted page string
   */
  static formatPages(pages?: string, style: 'mla' | 'chicago' | 'harvard' | 'apa' = 'apa'): string {
    if (!pages) return '';
    
    switch (style) {
      case 'mla':
      case 'chicago':
        return pages; // MLA and Chicago use plain page numbers
      
      case 'harvard':
      case 'apa':
        // Check if it's a range (contains dash or hyphen)
        if (pages.includes('-') || pages.includes('–')) {
          return `pp. ${pages}`;
        } else {
          return `p. ${pages}`;
        }
      
      default:
        return pages;
    }
  }
}
