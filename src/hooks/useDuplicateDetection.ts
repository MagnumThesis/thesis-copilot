import { useState, useCallback } from "react";
import { DuplicateDetectionEngine } from "../worker/lib/duplicate-detection-engine";
import { ScholarSearchResult } from "../lib/ai-types";

/**
 * Custom hook for duplicate detection functionality
 * @returns Object containing duplicate detection state and functions
 */
export const useDuplicateDetection = () => {
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  const [showDuplicateResolver, setShowDuplicateResolver] = useState(false);
  const [showDeduplicationSettings, setShowDeduplicationSettings] = useState(false);
  const [deduplicationOptions, setDeduplicationOptions] = useState<DuplicateDetectionOptions>({
    titleSimilarityThreshold: 0.85,
    authorSimilarityThreshold: 0.8,
    enableFuzzyMatching: true,
    strictDOIMatching: true,
    mergeStrategy: 'keep_highest_quality'
  });
  const [duplicatesDetected, setDuplicatesDetected] = useState(false);

  /**
   * Handles changes to deduplication options
   * @param options - The new deduplication options
   * @param originalResults - The original search results
   * @param setSearchResults - Function to update search results
   * @returns void
   */
  const handleDeduplicationOptionsChange = useCallback(
    (
      options: DuplicateDetectionOptions,
      originalResults: any[],
      setSearchResults: (results: any[]) => void
    ) => {
      setDeduplicationOptions(options);
      // Create new engine instance with updated options
      const newEngine = new DuplicateDetectionEngine(options);

      // Re-run duplicate detection with new options if we have results
      if (originalResults.length > 0) {
        const scholarResults: ScholarSearchResult[] = originalResults.map(result => ({
          ...result,
          authors: result.authors || [],
          year: result.publication_date ? parseInt(result.publication_date) : undefined,
          citation_count: result.citations,
          keywords: result.keywords || []
        }));

        const detectedGroups = newEngine.detectDuplicates(scholarResults);
        setDuplicateGroups(detectedGroups);
        setDuplicatesDetected(detectedGroups.length > 0);

        // Apply automatic deduplication if no manual review required
        if (options.mergeStrategy !== 'manual_review' && detectedGroups.length > 0) {
          const deduplicatedResults = newEngine.removeDuplicates(scholarResults);
          const convertedResults = deduplicatedResults.map(result => ({
            title: result.title,
            authors: result.authors,
            journal: result.journal,
            publication_date: result.year?.toString(),
            doi: result.doi,
            url: result.url,
            confidence: result.confidence,
            relevance_score: result.relevance_score,
            citations: result.citations
          }));
          setSearchResults(convertedResults);
        } else {
          setSearchResults(originalResults);
        }
      }
    },
    []
  );

  /**
   * Resolves duplicate conflicts
   * @param resolvedResults - The resolved results
   * @param setSearchResults - Function to update search results
   * @returns void
   */
  const handleResolveDuplicateConflicts = useCallback(
    (
      resolvedResults: ScholarSearchResult[],
      setSearchResults: (results: any[]) => void
    ) => {
      const convertedResults = resolvedResults.map(result => ({
        title: result.title,
        authors: result.authors,
        journal: result.journal,
        publication_date: result.year?.toString(),
        doi: result.doi,
        url: result.url,
        confidence: result.confidence,
        relevance_score: result.relevance_score,
        citations: result.citations
      }));

      setSearchResults(convertedResults);
      setShowDuplicateResolver(false);
      setDuplicatesDetected(false);
    },
    []
  );

  /**
   * Shows the duplicate resolver
   */
  const handleShowDuplicateResolver = useCallback(() => {
    setShowDuplicateResolver(true);
  }, []);

  /**
   * Cancels duplicate resolution
   */
  const handleCancelDuplicateResolution = useCallback(() => {
    setShowDuplicateResolver(false);
  }, []);

  return {
    duplicateGroups,
    showDuplicateResolver,
    showDeduplicationSettings,
    deduplicationOptions,
    duplicatesDetected,
    handleDeduplicationOptionsChange,
    handleResolveDuplicateConflicts,
    handleShowDuplicateResolver,
    handleCancelDuplicateResolution,
    setDuplicateGroups,
    setShowDuplicateResolver,
    setShowDeduplicationSettings,
    setDeduplicationOptions,
    setDuplicatesDetected
  };
};