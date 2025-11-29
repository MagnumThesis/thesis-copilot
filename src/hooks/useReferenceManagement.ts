import { useState, useCallback } from "react";
import { addReferenceFromSearch } from "../lib/api/ai-searcher-api";
import { ScholarSearchResult } from "../lib/ai-types";

/**
 * Custom hook for reference management functionality
 * @returns Object containing reference management state and functions
 */
export const useReferenceManagement = () => {
  const [addingReference, setAddingReference] = useState<string | null>(null);

  /**
   * Adds a reference from search results
   * @param result - The search result to add as a reference
   * @param conversationId - The conversation ID
   * @param onAddReference - Callback function to add the reference
   * @param currentSessionId - The current search session ID for analytics
   * @param searchTracking - The search tracking object for analytics
   * @returns Promise that resolves when the reference is added
   */
  const handleAddReference = useCallback(
    async (
      result: any,
      conversationId: string,
      onAddReference: ((reference: any) => void) | undefined,
      currentSessionId: string | null,
      searchTracking: any
    ) => {
      if (!onAddReference) return;

      const resultId = `${result.title}-${result.authors[0]}`;
      setAddingReference(resultId);

      try {
        // Convert SearchResult to ScholarSearchResult format for the API
        const searchResult: ScholarSearchResult = {
          title: result.title,
          authors: result.authors,
          journal: result.journal,
          year: result.publication_date ? parseInt(result.publication_date) : undefined,
          doi: result.doi,
          url: result.url,
          confidence: result.confidence,
          relevance_score: result.relevance_score,
          citation_count: result.citations,
          keywords: [],
        };

        // Call the new AI search reference addition API
        const response = await addReferenceFromSearch(searchResult, conversationId, {
          checkDuplicates: true,
          duplicateHandling: 'prompt_user',
          minConfidence: 0.5,
          autoPopulateMetadata: true
        });

        if (!response.success) {
          if (response.data?.isDuplicate && response.data?.mergeOptions) {
            // Handle duplicate reference - for now, show error
            // In a full implementation, this would show a merge dialog
            console.warn('Duplicate reference detected:', response.data.duplicateReference);
            throw new Error(`Reference already exists: "${response.data.duplicateReference?.title}"`);
          } else {
            throw new Error(response.error || 'Failed to add reference');
          }
        }

        const data = response.data!;

        // Successfully added reference - just notify parent (no need to add again)
        // The reference is already in the database from addReferenceFromSearch
        if (onAddReference) {
          // Just pass the reference for UI updates, don't add it again
          onAddReference(data.reference);
        }

        // Track reference addition for analytics
        if (currentSessionId) {
          try {
            await searchTracking.trackReferenceAdded(
              result.title,
              data.reference.id,
              resultId
            );
          } catch (trackingError) {
            console.warn('Failed to track reference addition:', trackingError);
          }
        }
      } catch (error) {
        console.error('Error adding reference:', error);

        // Track reference rejection for analytics
        if (currentSessionId) {
          try {
            await searchTracking.trackReferenceRejected(
              result.title,
              resultId,
              { comments: error instanceof Error ? error.message : 'Unknown error' }
            );
          } catch (trackingError) {
            console.warn('Failed to track reference rejection:', trackingError);
          }
        }

        // Error handling is done in the parent component
        throw error;
      } finally {
        setAddingReference(null);
      }
    },
    []
  );

  return {
    addingReference,
    handleAddReference,
    setAddingReference
  };
};