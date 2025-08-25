import { ReferenceDatabaseOperations } from './reference-database-operations';
import { MetadataExtractionEngine } from './metadata-extraction-engine';
import { CitationStyleEngine } from './citation-style-engine';
import type { 
  Reference, 
  ReferenceFormData, 
  ReferenceMetadata,
  MetadataExtractionRequest,
  MetadataExtractionResponse,
  ValidationResult,
  ValidationError,
  ReferenceSearchOptions,
  ReferenceListResponse,
  CitationRequest,
  CitationResponse,
  BibliographyRequest,
  BibliographyResponse,
  Author
} from '../../lib/ai-types';

import { 
  ReferenceType,
  CitationStyle,
  normalizeAuthor
} from '../../lib/ai-types';

/**
 * Reference Management Engine
 * Coordinates reference operations with validation, metadata extraction, and citation formatting
 */
export class ReferenceManagementEngine {
  private dbOps: ReferenceDatabaseOperations;
  private metadataEngine: MetadataExtractionEngine;

  constructor() {
    this.dbOps = new ReferenceDatabaseOperations();
    this.metadataEngine = new MetadataExtractionEngine();
  }

  /**
   * Create a new reference with optional metadata extraction
   */
  async createReference(
    data: ReferenceFormData & { conversationId: string },
    extractMetadata: boolean = false
  ): Promise<Reference> {
    // Validate the reference data first
    const validationResult = this.validateReferenceData(data);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    let finalData = { ...data };

    // Extract metadata if requested and source is available
    if (extractMetadata && (data.url || data.doi)) {
      try {
        const extractionRequest: MetadataExtractionRequest = {
          source: data.url || data.doi!,
          type: data.doi ? 'doi' : 'url',
          conversationId: data.conversationId
        };

        const extractionResult = await this.metadataEngine.extractMetadata(extractionRequest);
        
        if (extractionResult.success && extractionResult.metadata) {
          const mergedData = this.mergeMetadataWithFormData({ ...data, conversationId: undefined }, extractionResult.metadata);
          finalData = { ...mergedData, conversationId: data.conversationId };
        }
      } catch (error) {
        // Log the error but don't fail the creation - use manual data
        console.warn('Metadata extraction failed, using manual data:', error);
      }
    }

    // Create the reference in the database
    return await this.dbOps.createReference(finalData);
  }

  /**
   * Update an existing reference
   */
  async updateReference(
    id: string, 
    data: Partial<ReferenceFormData>,
    extractMetadata: boolean = false
  ): Promise<Reference> {
    // Get the existing reference first
    const existingReference = await this.dbOps.getReferenceById(id);
    if (!existingReference) {
      throw new Error(`Reference with ID ${id} not found`);
    }

    // Validate the update data
    const mergedData = { ...this.referenceToFormData(existingReference), ...data };
    const validationResult = this.validateReferenceData(mergedData);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    let finalData = { ...data };

    // Extract metadata if requested and source is available
    if (extractMetadata && (data.url || data.doi || existingReference.url || existingReference.doi)) {
      try {
        const source = data.url || data.doi || existingReference.url || existingReference.doi!;
        const extractionRequest: MetadataExtractionRequest = {
          source,
          type: (data.doi || existingReference.doi) ? 'doi' : 'url',
          conversationId: existingReference.conversationId
        };

        const extractionResult = await this.metadataEngine.extractMetadata(extractionRequest);
        
        if (extractionResult.success && extractionResult.metadata) {
          finalData = this.mergeMetadataWithFormData(mergedData, extractionResult.metadata);
          // Only keep the fields that were actually updated
          finalData = Object.keys(data).reduce((acc, key) => {
            const value = finalData[key as keyof typeof finalData];
            if (value !== undefined) {
              (acc as Record<string, unknown>)[key] = value;
            }
            return acc;
          }, {} as Partial<ReferenceFormData>);
        }
      } catch (error) {
        // Log the error but don't fail the update - use manual data
        console.warn('Metadata extraction failed, using manual data:', error);
      }
    }

    // Update the reference in the database
    return await this.dbOps.updateReference(id, finalData);
  }

  /**
   * Delete a reference and its citation instances
   */
  async deleteReference(id: string): Promise<void> {
    // Delete citation instances first
    await this.dbOps.deleteCitationInstancesForReference(id);
    
    // Then delete the reference
    await this.dbOps.deleteReference(id);
  }

  /**
   * Get a reference by ID
   */
  async getReferenceById(id: string): Promise<Reference | null> {
    return await this.dbOps.getReferenceById(id);
  }

  /**
   * Get references for a conversation with search and filtering
   */
  async getReferencesForConversation(
    conversationId: string, 
    options: ReferenceSearchOptions = {}
  ): Promise<ReferenceListResponse> {
    return await this.dbOps.getReferencesForConversation(conversationId, options);
  }

  /**
   * Search references across all conversations
   */
  async searchReferences(options: ReferenceSearchOptions = {}): Promise<ReferenceListResponse> {
    return await this.dbOps.searchReferences(options);
  }

  /**
   * Extract metadata from a source (URL or DOI)
   */
  async extractMetadata(request: MetadataExtractionRequest): Promise<MetadataExtractionResponse> {
    return await this.metadataEngine.extractMetadata(request);
  }

  /**
   * Format a citation for a reference
   */
  async formatCitation(request: CitationRequest): Promise<CitationResponse> {
    try {
      const reference = await this.dbOps.getReferenceById(request.referenceId);
      if (!reference) {
        return {
          success: false,
          error: `Reference with ID ${request.referenceId} not found`,
          style: request.style,
          type: request.type
        };
      }

      let citation: string;

      if (request.type === 'inline') {
        citation = this.formatInlineCitation(reference, request.style);
      } else {
        citation = this.formatBibliographyEntry(reference, request.style);
      }

      // Create citation instance for tracking
      await this.dbOps.createCitationInstance({
        referenceId: request.referenceId,
        conversationId: reference.conversationId,
        citationStyle: request.style,
        citationText: citation,
        context: request.context
      });

      return {
        success: true,
        citation,
        style: request.style,
        type: request.type
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown citation formatting error',
        style: request.style,
        type: request.type
      };
    }
  }

  /**
   * Generate a bibliography for a conversation
   */
  async generateBibliography(request: BibliographyRequest): Promise<BibliographyResponse> {
    try {
      const referencesResult = await this.dbOps.getReferencesForConversation(request.conversationId);
      
      if (!referencesResult.success || !referencesResult.references) {
        return {
          success: false,
          error: referencesResult.error || 'Failed to retrieve references',
          referenceCount: 0,
          style: request.style
        };
      }

      const references = referencesResult.references;
      
      if (references.length === 0) {
        return {
          success: true,
          bibliography: '',
          referenceCount: 0,
          style: request.style
        };
      }

      // Sort references according to the requested order
      const sortedReferences = this.sortReferences(references, request.sortOrder || 'alphabetical');

      // Format each reference as a bibliography entry
      const entries = sortedReferences.map(ref => {
        let entry = this.formatBibliographyEntry(ref, request.style);
        
        // Add URL if requested and not already included
        if (request.includeUrls && ref.url && !entry.includes(ref.url)) {
          entry += ` Retrieved from ${ref.url}`;
        }
        
        return entry;
      });

      const bibliography = entries.join('\n\n');

      return {
        success: true,
        bibliography,
        referenceCount: references.length,
        style: request.style
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown bibliography generation error',
        referenceCount: 0,
        style: request.style
      };
    }
  }

  /**
   * Validate reference data
   */
  validateReferenceData(data: ReferenceFormData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const missingFields: string[] = [];

    // Required fields
    if (!data.title || data.title.trim() === '') {
      errors.push({
        field: 'title',
        message: 'Title is required',
        severity: 'error'
      });
      missingFields.push('title');
    }

    if (!data.authors || data.authors.length === 0) {
      warnings.push({
        field: 'authors',
        message: 'At least one author is recommended',
        severity: 'warning'
      });
      missingFields.push('authors');
    } else {
      // Validate author fields
      data.authors.forEach((author, index) => {
        // Normalize author to Author object if it's a string
        const normalizedAuthor = normalizeAuthor(author);
          
        if (!normalizedAuthor.lastName || normalizedAuthor.lastName.trim() === '') {
          errors.push({
            field: `authors[${index}].lastName`,
            message: `Author ${index + 1} must have a last name`,
            severity: 'error'
          });
        }
      });
    }

    // Type-specific validation
    switch (data.type) {
      case ReferenceType.JOURNAL_ARTICLE:
        if (!data.journal) {
          warnings.push({
            field: 'journal',
            message: 'Journal name is recommended for journal articles',
            severity: 'warning'
          });
          missingFields.push('journal');
        }
        break;
      
      case ReferenceType.BOOK:
        if (!data.publisher) {
          warnings.push({
            field: 'publisher',
            message: 'Publisher is recommended for books',
            severity: 'warning'
          });
          missingFields.push('publisher');
        }
        break;
      
      case ReferenceType.WEBSITE:
        if (!data.url) {
          errors.push({
            field: 'url',
            message: 'URL is required for websites',
            severity: 'error'
          });
          missingFields.push('url');
        }
        break;
    }

    // URL validation
    if (data.url && !this.isValidUrl(data.url)) {
      errors.push({
        field: 'url',
        message: 'Invalid URL format',
        severity: 'error'
      });
    }

    // DOI validation
    if (data.doi && !this.isValidDoi(data.doi)) {
      errors.push({
        field: 'doi',
        message: 'Invalid DOI format',
        severity: 'error'
      });
    }

    // Date validation
    if (data.publicationDate) {
      const date = new Date(data.publicationDate);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'publicationDate',
          message: 'Invalid publication date format',
          severity: 'error'
        });
      } else if (date > new Date()) {
        warnings.push({
          field: 'publicationDate',
          message: 'Publication date is in the future',
          severity: 'warning'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields
    };
  }

  /**
   * Format inline citation based on style
   */
  private formatInlineCitation(reference: Reference, style: CitationStyle): string {
    switch (style) {
      case CitationStyle.APA:
        return CitationStyleEngine.formatInlineCitationAPA(reference);
      case CitationStyle.MLA:
        return CitationStyleEngine.formatInlineCitationMLA(reference);
      case CitationStyle.CHICAGO:
        return CitationStyleEngine.formatInlineCitationChicago(reference);
      case CitationStyle.HARVARD:
        return CitationStyleEngine.formatInlineCitationHarvard(reference);
      default:
        return CitationStyleEngine.formatInlineCitationAPA(reference);
    }
  }

  /**
   * Format bibliography entry based on style
   */
  private formatBibliographyEntry(reference: Reference, style: CitationStyle): string {
    switch (style) {
      case CitationStyle.APA:
        return CitationStyleEngine.formatBibliographyEntryAPA(reference);
      case CitationStyle.MLA:
        return CitationStyleEngine.formatBibliographyEntryMLA(reference);
      case CitationStyle.CHICAGO:
        return CitationStyleEngine.formatBibliographyEntryChicago(reference);
      case CitationStyle.HARVARD:
        return CitationStyleEngine.formatBibliographyEntryHarvard(reference);
      default:
        return CitationStyleEngine.formatBibliographyEntryAPA(reference);
    }
  }

  /**
   * Sort references according to the specified order
   */
  private sortReferences(references: Reference[], sortOrder: 'alphabetical' | 'chronological' | 'appearance'): Reference[] {
    const sorted = [...references];

    switch (sortOrder) {
      case 'alphabetical':
        return sorted.sort((a, b) => {
          // Sort by first author's last name, then by title
          const firstAuthorA = a.authors[0] ? normalizeAuthor(a.authors[0]) : null;
          const firstAuthorB = b.authors[0] ? normalizeAuthor(b.authors[0]) : null;
          const aAuthor = firstAuthorA?.lastName || a.title;
          const bAuthor = firstAuthorB?.lastName || b.title;
          return aAuthor.localeCompare(bAuthor);
        });
      
      case 'chronological':
        return sorted.sort((a, b) => {
          // Sort by publication date, newest first
          const aDate = a.publicationDate || new Date(0);
          const bDate = b.publicationDate || new Date(0);
          return bDate.getTime() - aDate.getTime();
        });
      
      case 'appearance':
      default:
        // Sort by creation date (order of appearance in document)
        return sorted.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });
    }
  }

  /**
   * Merge extracted metadata with form data
   */
  private mergeMetadataWithFormData(formData: ReferenceFormData & { conversationId?: string }, metadata: ReferenceMetadata): ReferenceFormData & { conversationId?: string } {
    return {
      type: metadata.type || formData.type,
      title: metadata.title || formData.title,
      authors: metadata.authors && metadata.authors.length > 0 ? metadata.authors : formData.authors,
      publicationDate: metadata.publicationDate ? metadata.publicationDate.toISOString().split('T')[0] : formData.publicationDate,
      url: metadata.url || formData.url,
      doi: metadata.doi || formData.doi,
      journal: metadata.journal || formData.journal,
      volume: metadata.volume || formData.volume,
      issue: metadata.issue || formData.issue,
      pages: metadata.pages || formData.pages,
      publisher: metadata.publisher || formData.publisher,
      isbn: metadata.isbn || formData.isbn,
      edition: formData.edition, // Usually not in metadata
      chapter: formData.chapter, // Usually not in metadata
      editor: formData.editor, // Usually not in metadata
      accessDate: formData.accessDate,
      notes: formData.notes,
      tags: formData.tags
    };
  }

  /**
   * Convert Reference to ReferenceFormData
   */
  private referenceToFormData(reference: Reference): ReferenceFormData {
    return {
      type: reference.type,
      title: reference.title,
      authors: reference.authors,
      publicationDate: reference.publicationDate?.toISOString().split('T')[0],
      url: reference.url,
      doi: reference.doi,
      journal: reference.journal,
      volume: reference.volume,
      issue: reference.issue,
      pages: reference.pages,
      publisher: reference.publisher,
      isbn: reference.isbn,
      edition: reference.edition,
      chapter: reference.chapter,
      editor: reference.editor,
      accessDate: reference.accessDate?.toISOString().split('T')[0],
      notes: reference.notes,
      tags: reference.tags
    };
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate DOI format
   */
  private isValidDoi(doi: string): boolean {
    // Basic DOI format validation
    const doiPattern = /^10\.\d{4,}\/.*$/;
    return doiPattern.test(doi);
  }

  /**
   * Normalize an author from string to Author object
   */
  private normalizeAuthor(author: string | Author): Author {
    return normalizeAuthor(author);
  }
}
