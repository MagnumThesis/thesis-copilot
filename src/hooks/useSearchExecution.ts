import { useState, useCallback } from "react";
import { search } from "../lib/api/ai-searcher-api";
import { DuplicateDetectionEngine } from "../worker/lib/duplicate-detection-engine";
import { ScholarSearchResult, SearchFilters } from "../lib/ai-types";

/**
 * Custom hook for search execution functionality
 * @param duplicateDetectionEngine - The duplicate detection engine instance
 * @param deduplicationOptions - The deduplication options
 * @returns Object containing search execution state and functions
 */
export const useSearchExecution = (
  duplicateDetectionEngine: DuplicateDetectionEngine,
  deduplicationOptions: any
) => {
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [originalResults, setOriginalResults] = useState<ScholarSearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<ScholarSearchResult[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  const [duplicatesDetected, setDuplicatesDetected] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  /**
   * Executes a search with the provided query and filters
   * @param query - The search query
   * @param conversationId - The conversation ID for context
   * @param searchFilters - The search filters to apply
   * @param privacyManager - The privacy manager to check consent
   * @returns Promise that resolves when the search is complete
   */
  const handleSearch = useCallback(
    async (
      query: string,
      conversationId: string,
      searchFilters: SearchFilters,
      privacyManager: any
    ) => {
      if (!query.trim()) return;

      // Check if user has given consent for AI features
      if (!privacyManager.hasConsent) {
        setSearchError('Please provide consent for AI features to use the search functionality.');
        return;
      }

      setLoading(true);
      setSearchError(null);
      setSearchResults([]);

      try {
        const response = await search(query, conversationId, searchFilters);

        if (!response.success) {
          throw new Error(response.error || 'Search failed');
        }

        const data = response.data!;
        const results = data.results || [];
        setOriginalResults(results);

        // Capture sessionId for analytics tracking
        if (data.sessionId) {
          setCurrentSessionId(data.sessionId);
        }

        // Convert to ScholarSearchResult format for duplicate detection
        const scholarResults: ScholarSearchResult[] = results.map((result) => ({
          ...result,
          authors: result.authors || [],
          year: result.publication_date ? parseInt(result.publication_date) : undefined,
          citation_count: result.citations,
          keywords: result.keywords || []
        }));

        // Detect duplicates
        const detectedGroups = duplicateDetectionEngine.detectDuplicates(scholarResults);
        setDuplicateGroups(detectedGroups);
        setDuplicatesDetected(detectedGroups.length > 0);

        // Apply automatic deduplication if no manual review required
        if (deduplicationOptions.mergeStrategy !== 'manual_review' && detectedGroups.length > 0) {
          const deduplicatedResults = duplicateDetectionEngine.removeDuplicates(scholarResults);
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
          setSearchResults(results);
        }

        setHasSearched(true);
        setSearchError(null);
      } catch (error) {
        console.error('Error performing AI search:', error);
        setSearchError(error instanceof Error ? error.message : 'Search failed. Please try again.');

        // Fallback to mock results if API fails (for development/testing)
        const mockResults: ScholarSearchResult[] = [
          {
            title: "Machine Learning Approaches to Natural Language Processing",
            authors: ["Smith, J.", "Johnson, A.", "Williams, B."],
            journal: "Journal of Artificial Intelligence Research",
            publication_date: "2023",
            doi: "10.1234/jair.2023.12345",
            url: "https://doi.org/10.1234/jair.2023.12345",
            confidence: 0.92,
            relevance_score: 0.88
          },
          {
            title: "Deep Learning for Academic Writing Enhancement",
            authors: ["Brown, C.", "Davis, E."],
            journal: "International Journal of Computational Linguistics",
            publication_date: "2022",
            doi: "10.5678/ijcl.2022.67890",
            url: "https://doi.org/10.5678/ijcl.2022.67890",
            confidence: 0.87,
            relevance_score: 0.76
          },
          {
            title: "AI-Powered Reference Management Systems",
            authors: ["Wilson, M.", "Taylor, R.", "Anderson, S."],
            journal: "ACM Transactions on Information Systems",
            publication_date: "2024",
            doi: "10.9012/acm.2024.90123",
            url: "https://doi.org/10.9012/acm.2024.90123",
            confidence: 0.95,
            relevance_score: 0.91
          }
        ];
        setOriginalResults(mockResults);

        // Convert to ScholarSearchResult format for duplicate detection
        const scholarResults: ScholarSearchResult[] = mockResults.map(result => ({
          ...result,
          authors: result.authors || [],
          year: result.publication_date ? parseInt(result.publication_date) : undefined,
          citation_count: result.citations,
          keywords: result.keywords || []
        }));

        // Detect duplicates
        const detectedGroups = duplicateDetectionEngine.detectDuplicates(scholarResults);
        setDuplicateGroups(detectedGroups);
        setDuplicatesDetected(detectedGroups.length > 0);

        // Apply automatic deduplication if no manual review required
        if (deduplicationOptions.mergeStrategy !== 'manual_review' && detectedGroups.length > 0) {
          const deduplicatedResults = duplicateDetectionEngine.removeDuplicates(scholarResults);
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
          setSearchResults(mockResults);
        }

        setHasSearched(true);
      } finally {
        setLoading(false);
      }
    },
    [duplicateDetectionEngine, deduplicationOptions]
  );

  return {
    loading,
    searchError,
    hasSearched,
    originalResults,
    searchResults,
    duplicateGroups,
    duplicatesDetected,
    currentSessionId,
    handleSearch,
    setLoading,
    setSearchError,
    setHasSearched,
    setOriginalResults,
    setSearchResults,
    setDuplicateGroups,
    setDuplicatesDetected,
    setCurrentSessionId
  };
};