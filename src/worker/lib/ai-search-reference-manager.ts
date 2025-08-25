import { Reference, ReferenceMetadata, ReferenceSuggestion, ReferenceType, ScholarSearchResult } from '../../lib/ai-types';
import { ReferenceDatabaseOperations } from './reference-database-operations';
import { DuplicateDetectionEngine, DuplicateGroup, DuplicateDetectionOptions } from './duplicate-detection-engine';

/**
 * Options for adding references from search results
 */
export interface AddReferenceFromSearchOptions {
  /** Whether to check for duplicates before adding */
  checkDuplicates?: boolean;
  /** How to handle duplicate conflicts */
  duplicateHandling?: 'skip' | 'merge' | 'add_anyway' | 'prompt_user';
  /** Minimum confidence threshold for adding references */
  minConfidence?: number;
  /** Whether to auto-populate metadata from search results */
  autoPopulateMetadata?: boolean;
}

/**
 * Result of adding a reference from search results
 */
export interface AddReferenceResult {
  success: boolean;
  reference?: Reference;
  isDuplicate?: boolean;
  duplicateReference?: Reference;
  mergeOptions?: DuplicateMergeOptions;
  error?: string;
}

/**
 * Options for merging duplicate references
 */
export interface DuplicateMergeOptions {
  existingReference: Reference;
  newReference: Partial<Reference>;
  conflicts: Array<{
    field: keyof Reference;
    existingValue: any;
    newValue: any;
    recommendation: 'keep_existing' | 'use_new' | 'merge' | 'manual_review';
  }>;
}

/**
 * Manages adding references from AI search results with duplicate detection and merging
 */
export class AISearchReferenceManager {
  private dbOps: ReferenceDatabaseOperations;
  private duplicateEngine: DuplicateDetectionEngine;

  constructor(duplicateOptions?: Partial<DuplicateDetectionOptions>) {
    this.dbOps = new ReferenceDatabaseOperations();
    this.duplicateEngine = new DuplicateDetectionEngine(duplicateOptions);
  }

  /**
   * Add a reference from search result metadata
   */
  async addReferenceFromSearchResult(
    searchResult: ScholarSearchResult | ReferenceMetadata,
    conversationId: string,
    options: AddReferenceFromSearchOptions = {}
  ): Promise<AddReferenceResult> {
    try {
      // Set default options
      const opts = {
        checkDuplicates: true,
        duplicateHandling: 'prompt_user' as const,
        minConfidence: 0.5,
        autoPopulateMetadata: true,
        ...options
      };

      // Check confidence threshold
      const confidence = 'confidence' in searchResult ? searchResult.confidence : 0.8;
      if (confidence < opts.minConfidence) {
        return {
          success: false,
          error: `Reference confidence (${confidence}) below minimum threshold (${opts.minConfidence})`
        };
      }

      // Convert search result to reference format
      const referenceData = this.convertSearchResultToReference(searchResult, conversationId);

      // Check for duplicates if enabled
      if (opts.checkDuplicates) {
        const duplicateCheck = await this.checkForDuplicates(referenceData, conversationId);
        
        if (duplicateCheck.isDuplicate && duplicateCheck.existingReference) {
          switch (opts.duplicateHandling) {
            case 'skip':
              return {
                success: false,
                isDuplicate: true,
                duplicateReference: duplicateCheck.existingReference,
                error: 'Reference already exists and duplicate handling is set to skip'
              };
              
            case 'add_anyway':
              // Continue with adding the reference
              break;
              
            case 'merge':
              return await this.mergeWithExistingReference(
                duplicateCheck.existingReference,
                referenceData
              );
              
            case 'prompt_user':
            default:
              const mergeOptions = this.generateMergeOptions(
                duplicateCheck.existingReference,
                referenceData
              );
              return {
                success: false,
                isDuplicate: true,
                duplicateReference: duplicateCheck.existingReference,
                mergeOptions,
                error: 'Duplicate reference found - user intervention required'
              };
          }
        }
      }

      // Create the reference
      const createdReference = await this.dbOps.createReference(referenceData);

      return {
        success: true,
        reference: createdReference
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Add multiple references from search results with batch duplicate detection
   */
  async addMultipleReferencesFromSearchResults(
    searchResults: (ScholarSearchResult | ReferenceMetadata)[],
    conversationId: string,
    options: AddReferenceFromSearchOptions = {}
  ): Promise<AddReferenceResult[]> {
    const results: AddReferenceResult[] = [];

    // Convert all search results to scholar format for duplicate detection
    const scholarResults = searchResults.map(result => 
      this.convertToScholarSearchResult(result)
    );

    // Detect duplicates within the batch
    const duplicateGroups = this.duplicateEngine.detectDuplicates(scholarResults);
    const processedIndices = new Set<number>();

    // Process duplicate groups first
    for (const group of duplicateGroups) {
      const primaryIndex = scholarResults.findIndex(r => r === group.primary);
      if (primaryIndex !== -1) {
        processedIndices.add(primaryIndex);
        
        // Mark duplicate indices as processed
        group.duplicates.forEach(duplicate => {
          const dupIndex = scholarResults.findIndex(r => r === duplicate);
          if (dupIndex !== -1) {
            processedIndices.add(dupIndex);
          }
        });

        // Add only the primary reference from each duplicate group
        const result = await this.addReferenceFromSearchResult(
          searchResults[primaryIndex],
          conversationId,
          options
        );
        results.push(result);
      }
    }

    // Process remaining non-duplicate results
    for (let i = 0; i < searchResults.length; i++) {
      if (!processedIndices.has(i)) {
        const result = await this.addReferenceFromSearchResult(
          searchResults[i],
          conversationId,
          options
        );
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Convert search result to reference format
   */
  private convertSearchResultToReference(
    searchResult: ScholarSearchResult | ReferenceMetadata,
    conversationId: string
  ): any {
    const baseData: any = {
      conversationId,
      type: this.determineReferenceType(searchResult),
      title: searchResult.title,
      authors: Array.isArray(searchResult.authors) 
        ? searchResult.authors.map(author => typeof author === 'string' ? author : `${author.firstName} ${author.lastName}`)
        : [],
      doi: searchResult.doi,
      url: searchResult.url,
      journal: searchResult.journal,
      publication_date: undefined as string | undefined,
      metadata_confidence: undefined as number | undefined,
      tags: [],
      notes: null
    };

    // Handle publication date
    if ('year' in searchResult && searchResult.year) {
      baseData.publication_date = new Date(searchResult.year, 0, 1).toISOString();
    } else if ('publication_date' in searchResult && searchResult.publication_date) {
      baseData.publication_date = searchResult.publication_date;
    } else if ('publicationDate' in searchResult && searchResult.publicationDate) {
      baseData.publication_date = searchResult.publicationDate instanceof Date 
        ? searchResult.publicationDate.toISOString() 
        : searchResult.publicationDate;
    }

    // Handle metadata confidence
    if ('confidence' in searchResult && searchResult.confidence !== undefined) {
      baseData.metadata_confidence = searchResult.confidence;
    }

    return baseData;
  }

  /**
   * Convert any search result to ScholarSearchResult format
   */
  private convertToScholarSearchResult(
    result: ScholarSearchResult | ReferenceMetadata
  ): ScholarSearchResult {
    if ('year' in result) {
      return result as ScholarSearchResult;
    }

    // Convert ReferenceMetadata to ScholarSearchResult
    const metadata = result as ReferenceMetadata;
    return {
      title: metadata.title,
      authors: Array.isArray(metadata.authors) 
        ? metadata.authors.map(author => typeof author === 'string' ? author : `${author.firstName} ${author.lastName}`)
        : [],
      year: metadata.publication_date ? new Date(metadata.publication_date).getFullYear() : undefined,
      journal: metadata.journal,
      doi: metadata.doi,
      url: metadata.url,
      citations: 0,
      publication_date: metadata.publication_date,
      confidence: metadata.confidence,
      keywords: metadata.keywords || [],
      abstract: undefined,
      relevance_score: 0.0 // Adding the missing relevance_score property
    };
  }

  /**
   * Determine reference type from search result
   */
  private determineReferenceType(
    searchResult: ScholarSearchResult | ReferenceMetadata
  ): ReferenceType {
    if ('type' in searchResult && searchResult.type) {
      return searchResult.type;
    }

    // Infer type from available fields
    if (searchResult.journal) {
      return ReferenceType.JOURNAL_ARTICLE;
    }
    if ('publisher' in searchResult && (searchResult as any).publisher && !searchResult.journal) {
      return ReferenceType.BOOK;
    }
    if (searchResult.url && !searchResult.journal && !('publisher' in searchResult && (searchResult as any).publisher)) {
      return ReferenceType.WEBSITE;
    }

    // Default to journal article
    return ReferenceType.JOURNAL_ARTICLE;
  }

  /**
   * Check for duplicate references in the database
   */
  private async checkForDuplicates(
    referenceData: any,
    conversationId: string
  ): Promise<{ isDuplicate: boolean; existingReference?: Reference }> {
    try {
      // Get existing references for the conversation
      const existingRefsResponse = await this.dbOps.getReferencesForConversation(conversationId);
      
      if (!existingRefsResponse.success || !existingRefsResponse.references) {
        return { isDuplicate: false };
      }

      const existingRefs = existingRefsResponse.references;

      // Convert new reference to scholar format for comparison
      const newScholarResult: ScholarSearchResult = {
        title: referenceData.title,
        authors: Array.isArray(referenceData.authors) 
          ? referenceData.authors.map((author: string | { firstName: string; lastName: string; }) => typeof author === 'string' ? author : `${author.firstName} ${author.lastName}`)
          : [],
        journal: referenceData.journal,
        doi: referenceData.doi,
        url: referenceData.url,
        citations: 0,
        publication_date: referenceData.publication_date,
        year: referenceData.publication_date ? new Date(referenceData.publication_date).getFullYear() : undefined,
        confidence: referenceData.metadata_confidence || 0.8,
        keywords: [],
        abstract: undefined,
        relevance_score: 0.0 // Adding the missing relevance_score property
      };

      // Convert existing references to scholar format
    const existingScholarResults = existingRefs.map(ref => ({
      title: ref.title,
      authors: Array.isArray(ref.authors) 
        ? ref.authors.map((author: string | { firstName: string; lastName: string; }) => typeof author === 'string' ? author : `${author.firstName} ${author.lastName}`)
        : [],
      year: ref.publication_date ? new Date(ref.publication_date).getFullYear() : undefined,
      journal: ref.journal,
      doi: ref.doi,
      url: ref.url,
      citations: 0,
      publication_date: ref.publication_date,
      confidence: ref.metadata_confidence || 1.0,
      keywords: [],
      abstract: undefined,
      relevance_score: 0.0 // Adding the missing relevance_score property
    }));

      // Check for duplicates using the duplicate detection engine
      const allResults = [newScholarResult, ...existingScholarResults];
      let duplicateGroups: any[] = [];
      
      try {
        duplicateGroups = this.duplicateEngine.detectDuplicates(allResults) || [];
      } catch (error) {
        console.error('Error in duplicate detection:', error);
        duplicateGroups = [];
      }

      // Check if the new reference is in any duplicate group
      for (const group of duplicateGroups) {
        // Check if the new reference matches any item in the group by title and authors
        const isNewRefInGroup = this.isReferenceInGroup(newScholarResult, group);
        
        if (isNewRefInGroup) {
          // Find the corresponding existing reference by matching with existing refs
          for (let i = 0; i < existingScholarResults.length; i++) {
            const existing = existingScholarResults[i];
            const isExistingInGroup = this.isReferenceInGroup(existing, group);
            
            if (isExistingInGroup) {
              return {
                isDuplicate: true,
                existingReference: existingRefs[i]
              };
            }
          }
        }
      }

      return { isDuplicate: false };

    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return { isDuplicate: false };
    }
  }

  /**
   * Check if a reference is part of a duplicate group
   */
  private isReferenceInGroup(reference: any, group: any): boolean {
    // Check if reference matches the primary
    if (this.referencesMatch(reference, group.primary)) {
      return true;
    }
    
    // Check if reference matches any duplicate
    return group.duplicates.some((duplicate: any) => 
      this.referencesMatch(reference, duplicate)
    );
  }

  /**
   * Check if two references match (same title and authors)
   */

  /**
   * Check if two references match (same title and authors)
   */
  /**
   * Check if two references match (same title and authors)
   */
  private referencesMatch(ref1: any, ref2: any): boolean {
    if (!ref1 || !ref2) return false;
    const authors1 = Array.isArray(ref1.authors) ? ref1.authors : [];
    const authors2 = Array.isArray(ref2.authors) ? ref2.authors : [];
    
    if (authors1.length !== authors2.length) return false;
    
    // Simple author comparison (could be more sophisticated)
    const normalizedAuthors1 = authors1.map((a: any) => (a || '').toLowerCase().trim()).sort();
    const normalizedAuthors2 = authors2.map((a: any) => (a || '').toLowerCase().trim()).sort();
    
    return normalizedAuthors1.every((author: any, index: string | number) => author === normalizedAuthors2[index]);
  }

  /**
   * Generate merge options for duplicate references
   */
  private generateMergeOptions(
    existingReference: Reference,
    newReferenceData: any
  ): DuplicateMergeOptions {
    const conflicts: DuplicateMergeOptions['conflicts'] = [];

    // Compare key fields and identify conflicts
    const fieldsToCompare: (keyof Reference)[] = [
      'title', 'authors', 'journal', 'doi', 'url', 
      'publicationDate', 'volume', 'issue', 'pages'
    ];

    for (const field of fieldsToCompare) {
      const existingValue = existingReference[field];
      const newValue = newReferenceData[field === 'publicationDate' ? 'publicationDate' : field];

      if (existingValue !== newValue && newValue !== undefined && newValue !== null) {
        let recommendation: 'keep_existing' | 'use_new' | 'merge' | 'manual_review' = 'manual_review';

        // Provide smart recommendations based on field type and content
        if (field === 'doi' && newValue && !existingValue) {
          recommendation = 'use_new';
        } else if (field === 'url' && newValue && !existingValue) {
          recommendation = 'use_new';
        } else if (field === 'authors' && Array.isArray(newValue) && Array.isArray(existingValue)) {
          recommendation = newValue.length > existingValue.length ? 'use_new' : 'keep_existing';
        } else if (field === 'title' && typeof newValue === 'string' && typeof existingValue === 'string') {
          recommendation = newValue.length > existingValue.length ? 'use_new' : 'keep_existing';
        }

        conflicts.push({
          field,
          existingValue,
          newValue,
          recommendation
        });
      }
    }

    return {
      existingReference,
      newReference: newReferenceData,
      conflicts
    };
  }

  /**
   * Merge new reference data with existing reference
   */
  private async mergeWithExistingReference(
    existingReference: Reference,
    newReferenceData: any
  ): Promise<AddReferenceResult> {
    try {
      const mergeOptions = this.generateMergeOptions(existingReference, newReferenceData);
      const updatedData: any = {};

      // Apply automatic merge recommendations
      for (const conflict of mergeOptions.conflicts) {
        switch (conflict.recommendation) {
          case 'use_new':
            updatedData[conflict.field] = conflict.newValue;
            break;
          case 'merge':
            if (conflict.field === 'authors' && Array.isArray(conflict.existingValue) && Array.isArray(conflict.newValue)) {
              // Merge author arrays, removing duplicates
              const mergedAuthors = [...new Set([...conflict.existingValue, ...conflict.newValue])];
              updatedData[conflict.field] = mergedAuthors;
            }
            break;
          case 'keep_existing':
          default:
            // Keep existing value, no update needed
            break;
        }
      }

      // Update the existing reference if there are changes
      if (Object.keys(updatedData).length > 0) {
        const updatedReference = await this.dbOps.updateReference(existingReference.id, updatedData);
        return {
          success: true,
          reference: updatedReference,
          isDuplicate: true
        };
      }

      return {
        success: true,
        reference: existingReference,
        isDuplicate: true
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to merge references'
      };
    }
  }
}