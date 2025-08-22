/**
 * Export Formatters Utility
 * Converts formatted bibliographies to different export formats
 */

import { Reference, CitationStyle, ReferenceType } from '../lib/ai-types.js';

export enum ExportFormat {
  BIBTEX = 'bibtex',
  RIS = 'ris',
  ENDNOTE = 'endnote',
  ZOTERO = 'zotero',
  PLAIN_TEXT = 'plain_text'
}

export interface ExportOptions {
  includeUrls?: boolean;
  includeDOIs?: boolean;
  includeAbstracts?: boolean;
  customFields?: Record<string, string>;
}

/**
 * Main export formatter class
 */
export class ExportFormatter {
  /**
   * Export bibliography to specified format
   */
  static exportBibliography(
    references: Reference[],
    format: ExportFormat,
    options: ExportOptions = {}
  ): string {
    switch (format) {
      case ExportFormat.BIBTEX:
        return this.toBibTeX(references, options);
      case ExportFormat.RIS:
        return this.toRIS(references, options);
      case ExportFormat.ENDNOTE:
        return this.toEndNote(references, options);
      case ExportFormat.ZOTERO:
        return this.toZotero(references, options);
      case ExportFormat.PLAIN_TEXT:
        return this.toPlainText(references, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert references to BibTeX format
   */
  private static toBibTeX(references: Reference[], options: ExportOptions): string {
    const entries: string[] = [];

    for (const ref of references) {
      const bibtexKey = this.generateBibTeXKey(ref);
      let entry = `@${this.getBibTeXType(ref.type)}{${bibtexKey},\n`;

      // Author field
      if (ref.authors.length > 0) {
        const authors = ref.authors.map(author =>
          `${author.lastName}, ${author.firstName}${author.middleName ? ` ${author.middleName}` : ''}`
        ).join(' and ');
        entry += `  author = {${authors}},\n`;
      }

      // Title field
      entry += `  title = {${this.escapeBibTeX(ref.title)}},\n`;

      // Type-specific fields
      switch (ref.type) {
        case ReferenceType.JOURNAL_ARTICLE:
          if (ref.journal) {
            entry += `  journal = {${this.escapeBibTeX(ref.journal)}},\n`;
          }
          if (ref.volume) {
            entry += `  volume = {${ref.volume}},\n`;
          }
          if (ref.issue) {
            entry += `  number = {${ref.issue}},\n`;
          }
          if (ref.pages) {
            entry += `  pages = {${ref.pages}},\n`;
          }
          break;

        case ReferenceType.BOOK:
          if (ref.publisher) {
            entry += `  publisher = {${this.escapeBibTeX(ref.publisher)}},\n`;
          }
          if (ref.isbn) {
            entry += `  isbn = {${ref.isbn}},\n`;
          }
          if (ref.edition) {
            entry += `  edition = {${ref.edition}},\n`;
          }
          break;

        case ReferenceType.BOOK_CHAPTER:
          if (ref.journal) { // Using journal field for book title
            entry += `  booktitle = {${this.escapeBibTeX(ref.journal)}},\n`;
          }
          if (ref.publisher) {
            entry += `  publisher = {${this.escapeBibTeX(ref.publisher)}},\n`;
          }
          if (ref.pages) {
            entry += `  pages = {${ref.pages}},\n`;
          }
          if (ref.editor) {
            entry += `  editor = {${this.escapeBibTeX(ref.editor)}},\n`;
          }
          break;

        case ReferenceType.CONFERENCE_PAPER:
          if (ref.journal) { // Using journal field for conference name
            entry += `  booktitle = {${this.escapeBibTeX(ref.journal)}},\n`;
          }
          if (ref.publisher) {
            entry += `  publisher = {${this.escapeBibTeX(ref.publisher)}},\n`;
          }
          if (ref.pages) {
            entry += `  pages = {${ref.pages}},\n`;
          }
          break;

        case ReferenceType.THESIS:
          entry += `  type = {${ref.notes?.toLowerCase().includes('master') ? 'Master\'s thesis' : 'PhD thesis'}},\n`;
          if (ref.publisher) {
            entry += `  school = {${this.escapeBibTeX(ref.publisher)}},\n`;
          }
          break;

        case ReferenceType.WEBSITE:
          if (ref.url) {
            entry += `  url = {${ref.url}},\n`;
          }
          if (ref.accessDate) {
            entry += `  urldate = {${ref.accessDate.toISOString().split('T')[0]}},\n`;
          }
          break;
      }

      // Common fields
      if (ref.publicationDate) {
        entry += `  year = {${ref.publicationDate.getFullYear()}},\n`;
      }

      if (options.includeDOIs && ref.doi) {
        entry += `  doi = {${ref.doi}},\n`;
      }

      if (options.includeUrls && ref.url) {
        entry += `  url = {${ref.url}},\n`;
      }

      // Custom fields
      if (options.customFields) {
        for (const [key, value] of Object.entries(options.customFields)) {
          entry += `  ${key} = {${this.escapeBibTeX(value)}},\n`;
        }
      }

      entry += '}\n';
      entries.push(entry);
    }

    return entries.join('\n');
  }

  /**
   * Convert references to RIS format
   */
  private static toRIS(references: Reference[], options: ExportOptions): string {
    const entries: string[] = [];

    for (const ref of references) {
      const lines: string[] = [];

      // Reference type
      lines.push(`TY  - ${this.getRISType(ref.type)}`);

      // Authors
      for (const author of ref.authors) {
        lines.push(`AU  - ${author.lastName}, ${author.firstName}${author.middleName ? ` ${author.middleName}` : ''}`);
      }

      // Title
      lines.push(`TI  - ${ref.title}`);

      // Type-specific fields
      switch (ref.type) {
        case ReferenceType.JOURNAL_ARTICLE:
          if (ref.journal) {
            lines.push(`JO  - ${ref.journal}`);
          }
          if (ref.volume) {
            lines.push(`VL  - ${ref.volume}`);
          }
          if (ref.issue) {
            lines.push(`IS  - ${ref.issue}`);
          }
          if (ref.pages) {
            lines.push(`SP  - ${ref.pages}`);
          }
          break;

        case ReferenceType.BOOK:
          if (ref.publisher) {
            lines.push(`PB  - ${ref.publisher}`);
          }
          if (ref.isbn) {
            lines.push(`SN  - ${ref.isbn}`);
          }
          break;

        case ReferenceType.BOOK_CHAPTER:
          if (ref.journal) { // Book title
            lines.push(`BT  - ${ref.journal}`);
          }
          if (ref.publisher) {
            lines.push(`PB  - ${ref.publisher}`);
          }
          if (ref.pages) {
            lines.push(`SP  - ${ref.pages}`);
          }
          if (ref.editor) {
            lines.push(`ED  - ${ref.editor}`);
          }
          break;

        case ReferenceType.WEBSITE:
          if (ref.url) {
            lines.push(`UR  - ${ref.url}`);
          }
          break;
      }

      // Publication date
      if (ref.publicationDate) {
        lines.push(`PY  - ${ref.publicationDate.getFullYear()}`);
      }

      // DOI
      if (options.includeDOIs && ref.doi) {
        lines.push(`DO  - ${ref.doi}`);
      }

      // URL
      if (options.includeUrls && ref.url && ref.type !== ReferenceType.WEBSITE) {
        lines.push(`UR  - ${ref.url}`);
      }

      // End of reference
      lines.push('ER  - ');
      lines.push('');

      entries.push(lines.join('\n'));
    }

    return entries.join('\n');
  }

  /**
   * Convert references to EndNote format
   */
  private static toEndNote(references: Reference[], options: ExportOptions): string {
    const entries: string[] = [];

    for (const ref of references) {
      const lines: string[] = [];

      // Reference type
      lines.push(`%0 ${this.getEndNoteType(ref.type)}`);

      // Authors
      for (let i = 0; i < ref.authors.length; i++) {
        const author = ref.authors[i];
        const field = i === 0 ? '%A' : '%E';
        lines.push(`${field} ${author.lastName}, ${author.firstName}${author.middleName ? ` ${author.middleName}` : ''}`);
      }

      // Title
      lines.push(`%T ${ref.title}`);

      // Type-specific fields
      switch (ref.type) {
        case ReferenceType.JOURNAL_ARTICLE:
          if (ref.journal) {
            lines.push(`%J ${ref.journal}`);
          }
          if (ref.volume) {
            lines.push(`%V ${ref.volume}`);
          }
          if (ref.issue) {
            lines.push(`%N ${ref.issue}`);
          }
          if (ref.pages) {
            lines.push(`%P ${ref.pages}`);
          }
          break;

        case ReferenceType.BOOK:
          if (ref.publisher) {
            lines.push(`%I ${ref.publisher}`);
          }
          if (ref.isbn) {
            lines.push(`%@ ${ref.isbn}`);
          }
          break;

        case ReferenceType.BOOK_CHAPTER:
          if (ref.journal) { // Book title
            lines.push(`%B ${ref.journal}`);
          }
          if (ref.publisher) {
            lines.push(`%I ${ref.publisher}`);
          }
          if (ref.pages) {
            lines.push(`%P ${ref.pages}`);
          }
          if (ref.editor) {
            lines.push(`%E ${ref.editor}`);
          }
          break;

        case ReferenceType.WEBSITE:
          if (ref.url) {
            lines.push(`%U ${ref.url}`);
          }
          break;
      }

      // Publication date
      if (ref.publicationDate) {
        lines.push(`%D ${ref.publicationDate.getFullYear()}`);
      }

      // DOI
      if (options.includeDOIs && ref.doi) {
        lines.push(`%R ${ref.doi}`);
      }

      // URL (if not already added for websites)
      if (options.includeUrls && ref.url && ref.type !== ReferenceType.WEBSITE) {
        lines.push(`%U ${ref.url}`);
      }

      // Empty line to separate entries
      lines.push('');
      entries.push(lines.join('\n'));
    }

    return entries.join('\n');
  }

  /**
   * Convert references to Zotero RDF format
   */
  private static toZotero(references: Reference[], options: ExportOptions): string {
    let rdf = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF
 xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:z="http://www.zotero.org/namespaces/export#"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:bib="http://purl.org/net/biblio#"
 xmlns:foaf="http://xmlns.com/foaf/0.1/"
 xmlns:link="http://purl.org/rss/1.0/modules/link/"
 xmlns:prism="http://prismstandard.org/namespaces/1.2/basic/">\n`;

    for (const ref of references) {
      const id = `item_${ref.id.replace(/-/g, '_')}`;
      rdf += `  <bib:Article rdf:about="#${id}">\n`;

      // Title
      rdf += `    <dc:title>${this.escapeXML(ref.title)}</dc:title>\n`;

      // Authors
      for (const author of ref.authors) {
        rdf += `    <dc:creator>\n`;
        rdf += `      <foaf:Person>\n`;
        rdf += `        <foaf:surname>${this.escapeXML(author.lastName)}</foaf:surname>\n`;
        rdf += `        <foaf:givenname>${this.escapeXML(author.firstName)}${author.middleName ? ` ${author.middleName}` : ''}</foaf:givenname>\n`;
        rdf += `      </foaf:Person>\n`;
        rdf += `    </dc:creator>\n`;
      }

      // Publication date
      if (ref.publicationDate) {
        rdf += `    <dc:date>${ref.publicationDate.toISOString()}</dc:date>\n`;
      }

      // Type-specific fields
      switch (ref.type) {
        case ReferenceType.JOURNAL_ARTICLE:
          if (ref.journal) {
            rdf += `    <dc:source>${this.escapeXML(ref.journal)}</dc:source>\n`;
          }
          if (ref.volume) {
            rdf += `    <prism:volume>${ref.volume}</prism:volume>\n`;
          }
          if (ref.issue) {
            rdf += `    <prism:number>${ref.issue}</prism:number>\n`;
          }
          if (ref.pages) {
            rdf += `    <prism:startingPage>${ref.pages}</prism:startingPage>\n`;
          }
          break;

        case ReferenceType.BOOK:
          if (ref.publisher) {
            rdf += `    <dc:publisher>${this.escapeXML(ref.publisher)}</dc:publisher>\n`;
          }
          if (ref.isbn) {
            rdf += `    <dc:identifier>ISBN: ${ref.isbn}</dc:identifier>\n`;
          }
          break;

        case ReferenceType.WEBSITE:
          if (ref.url) {
            rdf += `    <dc:identifier>${ref.url}</dc:identifier>\n`;
          }
          break;
      }

      // DOI
      if (options.includeDOIs && ref.doi) {
        rdf += `    <dc:identifier>DOI: ${ref.doi}</dc:identifier>\n`;
      }

      // URL
      if (options.includeUrls && ref.url) {
        rdf += `    <dc:identifier>${ref.url}</dc:identifier>\n`;
      }

      rdf += `  </bib:Article>\n`;
    }

    rdf += '</rdf:RDF>';
    return rdf;
  }

  /**
   * Convert references to plain text format
   */
  private static toPlainText(references: Reference[], options: ExportOptions): string {
    const entries: string[] = [];

    for (const ref of references) {
      let entry = '';

      // Authors
      if (ref.authors.length > 0) {
        const authors = ref.authors.map(author =>
          `${author.lastName}, ${author.firstName}${author.middleName ? ` ${author.middleName}` : ''}`
        ).join('; ');
        entry += `${authors}. `;
      }

      // Title
      entry += `${ref.title}. `;

      // Type-specific information
      const info: string[] = [];

      switch (ref.type) {
        case ReferenceType.JOURNAL_ARTICLE:
          if (ref.journal) {
            let journalInfo = ref.journal;
            if (ref.volume) journalInfo += `, ${ref.volume}`;
            if (ref.issue) journalInfo += `(${ref.issue})`;
            if (ref.pages) journalInfo += `, ${ref.pages}`;
            info.push(journalInfo);
          }
          break;

        case ReferenceType.BOOK:
          if (ref.publisher) {
            info.push(ref.publisher);
          }
          break;

        case ReferenceType.BOOK_CHAPTER:
          if (ref.journal) { // Book title
            info.push(`In: ${ref.journal}`);
          }
          if (ref.pages) {
            info.push(`pp. ${ref.pages}`);
          }
          break;

        case ReferenceType.WEBSITE:
          if (ref.url) {
            info.push(ref.url);
          }
          break;
      }

      if (info.length > 0) {
        entry += `${info.join('. ')}. `;
      }

      // Publication date
      if (ref.publicationDate) {
        entry += `(${ref.publicationDate.getFullYear()}).`;
      }

      // DOI and URL
      const identifiers: string[] = [];
      if (options.includeDOIs && ref.doi) {
        identifiers.push(`DOI: ${ref.doi}`);
      }
      if (options.includeUrls && ref.url) {
        identifiers.push(ref.url);
      }

      if (identifiers.length > 0) {
        entry += ` ${identifiers.join('. ')}`;
      }

      entries.push(entry);
    }

    return entries.join('\n\n');
  }

  /**
   * Generate BibTeX citation key
   */
  private static generateBibTeXKey(ref: Reference): string {
    if (ref.authors.length === 0) {
      return `unknown_${ref.id.slice(0, 8)}`;
    }

    const firstAuthor = ref.authors[0];
    const year = ref.publicationDate?.getFullYear() || 'unknown';
    const titleWord = ref.title.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');

    return `${firstAuthor.lastName.toLowerCase()}${year}${titleWord}`;
  }

  /**
   * Get BibTeX entry type
   */
  private static getBibTeXType(type: ReferenceType): string {
    switch (type) {
      case ReferenceType.JOURNAL_ARTICLE:
        return 'article';
      case ReferenceType.BOOK:
        return 'book';
      case ReferenceType.BOOK_CHAPTER:
        return 'inbook';
      case ReferenceType.CONFERENCE_PAPER:
        return 'inproceedings';
      case ReferenceType.THESIS:
        return 'phdthesis';
      case ReferenceType.WEBSITE:
        return 'online';
      default:
        return 'misc';
    }
  }

  /**
   * Get RIS reference type
   */
  private static getRISType(type: ReferenceType): string {
    switch (type) {
      case ReferenceType.JOURNAL_ARTICLE:
        return 'JOUR';
      case ReferenceType.BOOK:
        return 'BOOK';
      case ReferenceType.BOOK_CHAPTER:
        return 'CHAP';
      case ReferenceType.CONFERENCE_PAPER:
        return 'CONF';
      case ReferenceType.THESIS:
        return 'THES';
      case ReferenceType.WEBSITE:
        return 'ELEC';
      default:
        return 'GEN';
    }
  }

  /**
   * Get EndNote reference type
   */
  private static getEndNoteType(type: ReferenceType): string {
    switch (type) {
      case ReferenceType.JOURNAL_ARTICLE:
        return 'Journal Article';
      case ReferenceType.BOOK:
        return 'Book';
      case ReferenceType.BOOK_CHAPTER:
        return 'Book Section';
      case ReferenceType.CONFERENCE_PAPER:
        return 'Conference Paper';
      case ReferenceType.THESIS:
        return 'Thesis';
      case ReferenceType.WEBSITE:
        return 'Web Page';
      default:
        return 'Generic';
    }
  }

  /**
   * Escape BibTeX special characters
   */
  private static escapeBibTeX(text: string): string {
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/[{}]/g, '\\$&')
      .replace(/[$%&_#^]/g, '\\$&');
  }

  /**
   * Escape XML special characters
   */
  private static escapeXML(text: string): string {
    return text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#39;');
  }
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  style: CitationStyle,
  format: ExportFormat,
  timestamp?: Date
): string {
  const date = timestamp || new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  const styleStr = style.toUpperCase();
  const formatStr = format.toUpperCase();

  return `bibliography_${styleStr}_${formatStr}_${dateStr}`;
}

/**
 * Get MIME type for export format
 */
export function getExportMimeType(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.BIBTEX:
      return 'application/x-bibtex';
    case ExportFormat.RIS:
      return 'application/x-research-info-systems';
    case ExportFormat.ENDNOTE:
      return 'application/x-endnote-refer';
    case ExportFormat.ZOTERO:
      return 'application/rdf+xml';
    case ExportFormat.PLAIN_TEXT:
      return 'text/plain';
    default:
      return 'text/plain';
  }
}

/**
 * Get file extension for export format
 */
export function getExportFileExtension(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.BIBTEX:
      return '.bib';
    case ExportFormat.RIS:
      return '.ris';
    case ExportFormat.ENDNOTE:
      return '.enw';
    case ExportFormat.ZOTERO:
      return '.rdf';
    case ExportFormat.PLAIN_TEXT:
      return '.txt';
    default:
      return '.txt';
  }
}
