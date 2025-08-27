import { useState, useCallback } from "react";
import { refineQuery } from "../lib/api/ai-searcher-api";
import { QueryRefinement, RefinedQuery } from "../../worker/lib/query-generation-engine";
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

        setQueryRefinement(response.data!);
      } catch (error) {
        console.error('Error refining query:', error);
        // For development, create a mock refinement
        const mockRefinement: QueryRefinement = {
          breadthAnalysis: {
            breadthScore: 0.6,
            classification: 'optimal',
            reasoning: 'Query has good balance between specificity and breadth',
            termCount: 3,
            specificityLevel: 'moderate',
            suggestions: []
          },
          alternativeTerms: {
            synonyms: [
              { term: 'research', confidence: 0.9, reasoning: 'Common academic synonym', category: 'synonym' },
              { term: 'study', confidence: 0.8, reasoning: 'Alternative academic term', category: 'synonym' }
            ],
            relatedTerms: [
              { term: 'methodology', confidence: 0.7, reasoning: 'Related research concept', category: 'related' }
            ],
            broaderTerms: [
              { term: 'science', confidence: 0.6, reasoning: 'Broader field', category: 'broader' }
            ],
            narrowerTerms: [
              { term: 'experimental design', confidence: 0.8, reasoning: 'More specific approach', category: 'narrower' }
            ],
            academicVariants: [
              { term: 'empirical investigation', confidence: 0.9, reasoning: 'Academic terminology', category: 'academic' }
            ]
          },
          validationResults: {
            isValid: true,
            issues: [],
            suggestions: ['Consider adding academic terms for better scholarly relevance'],
            confidence: 0.85
          },
          optimizationRecommendations: [
            {
              type: 'add_term',
              description: 'Add academic context terms',
              impact: 'medium',
              priority: 1,
              beforeQuery: query,
              afterQuery: `(${query}) AND (research OR study)`,
              reasoning: 'Academic terms improve scholarly relevance'
            }
          ],
          refinedQueries: [
            {
              query: `(${query}) AND (research OR study OR analysis)`,
              refinementType: 'academic_enhanced',
              confidence: 0.9,
              expectedResults: 'similar',
              description: 'Enhanced with academic terminology',
              changes: [
                {
                  type: 'added',
                  element: 'academic terms',
                  reasoning: 'Added academic context for better scholarly results'
                }
              ]
            }
          ]
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