import { useState, useCallback } from "react";
import { refineQuery } from "../lib/api/ai-searcher-api";

// Types for query refinement - frontend representation
export interface QueryRefinement {
  breadthAnalysis?: any;
  alternativeTerms?: string[];
  validationResults?: any;
  optimizationRecommendations?: string[];
  refinedQueries?: string[];
}

export interface RefinedQuery {
  query: string;
  reasoning?: string;
}

import { ExtractedContent } from "../lib/ai-types";

/**
 * Custom hook for query refinement functionality
 * @returns Object containing query refinement state and functions
 */
export const useQueryRefinement = () => {
  const [showQueryRefinement, setShowQueryRefinement] = useState(false);
  const [queryRefinement, setQueryRefinement] = useState<QueryRefinement | null>(null);
  const [refinementLoading, setRefinementLoading] = useState(false);

  /**
   * Refines a search query using AI
   * @param query - The original query to refine
   * @param selectedContent - Content to use for context
   * @param conversationId - The conversation ID
   * @returns Promise that resolves when the query refinement is complete
   */
  const handleRefineQuery = useCallback(
    async (
      query: string,
      selectedContent: ExtractedContent[],
      conversationId: string
    ) => {
      if (!query.trim()) return;

      setRefinementLoading(true);
      setShowQueryRefinement(true);

      try {
        const response = await refineQuery(query, selectedContent, conversationId);

        if (!response.success) {
          throw new Error(response.error || 'Query refinement failed');
        }

        setQueryRefinement(response.data! as any);
      } catch (error) {
        console.error('Error refining query:', error);
        // For development, create a mock refinement
        const mockRefinement: any = {
          breadthAnalysis: { breadthScore: 0.6 },
          alternativeTerms: [],
          validationResults: { isValid: true },
          optimizationRecommendations: [],
          refinedQueries: []
        };
        setQueryRefinement(mockRefinement);
      } finally {
        setRefinementLoading(false);
      }
    },
    []
  );

  /**
   * Applies a refined query
   * @param refinedQuery - The refined query to apply
   * @param setSearchQuery - Function to update the search query
   */
  const handleApplyRefinement = useCallback(
    (refinedQuery: RefinedQuery, setSearchQuery: (query: string) => void) => {
      setSearchQuery(refinedQuery.query);
      setShowQueryRefinement(false);
    },
    []
  );

  /**
   * Regenerates query refinement
   * @param handleRefineQuery - Function to handle query refinement
   */
  const handleRegenerateRefinement = useCallback(
    (handleRefineQuery: () => void) => {
      handleRefineQuery();
    },
    []
  );

  return {
    showQueryRefinement,
    queryRefinement,
    refinementLoading,
    handleRefineQuery,
    handleApplyRefinement,
    handleRegenerateRefinement,
    setShowQueryRefinement,
    setQueryRefinement,
    setRefinementLoading
  };
};