/**
 * API service module for AISearcher component.
 * Centralizes all API interactions for the AI-powered reference search functionality.
 */

import { ScholarSearchResult, SearchFilters } from "../ai-types";
import { QueryRefinement, RefinedQuery } from "../../worker/lib/query-generation-engine";
import { ExtractedContent } from "../ai-types";

// Standardized response interface for all API calls
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Request interfaces
interface SearchRequest {
  query: string;
  conversationId: string;
  userId?: string;
  filters: SearchFilters;
}

interface AddReferenceRequest {
  searchResult: ScholarSearchResult;
  conversationId: string;
  options: {
    checkDuplicates: boolean;
    duplicateHandling: string;
    minConfidence: number;
    autoPopulateMetadata: boolean;
  };
}

interface RefineQueryRequest {
  query: string;
  originalContent: ExtractedContent[];
  conversationId: string;
}

interface ResultFeedbackRequest {
  searchSessionId: string;
  resultId: string;
  feedback: {
    isRelevant: boolean;
    qualityRating: number;
    comments: string;
    timestamp: string;
  };
}

interface SessionFeedbackRequest {
  searchSessionId: string;
  conversationId: string;
  feedback: {
    overallSatisfaction: number;
    relevanceRating: number;
    qualityRating: number;
    easeOfUseRating: number;
    feedbackComments: string;
    wouldRecommend: boolean;
    improvementSuggestions: string;
    timestamp: string;
  };
}

/**
 * Performs a search using the AI searcher API
 * @param query - The search query
 * @param conversationId - The conversation ID for context
 * @param filters - Search filters to apply
 * @param userId - Optional user ID for analytics (defaults to client ID)
 * @returns Promise with search results or error
 */
export async function search(
  query: string,
  conversationId: string,
  filters: SearchFilters,
  userId?: string
): Promise<ApiResponse<{ results: ScholarSearchResult[]; sessionId: string }>> {
  try {
    // Import dynamically to avoid issues with client-id-manager
    const { getClientId } = await import('../../utils/client-id-manager');
    
    const response = await fetch('/api/ai-searcher/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        conversationId,
        userId: userId || getClientId(),
        filters
      } as SearchRequest)
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Search failed: ${response.statusText}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error performing AI search:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed. Please try again.'
    };
  }
}

/**
 * Adds a reference from search results
 * @param searchResult - The search result to add as a reference
 * @param conversationId - The conversation ID
 * @param options - Options for adding the reference
 * @returns Promise with the added reference or error
 */
export async function addReferenceFromSearch(
  searchResult: ScholarSearchResult,
  conversationId: string,
  options: {
    checkDuplicates: boolean;
    duplicateHandling: string;
    minConfidence: number;
    autoPopulateMetadata: boolean;
  }
): Promise<ApiResponse<{ reference: any; isDuplicate?: boolean; duplicateReference?: any }>> {
  try {
    const response = await fetch('/api/referencer/add-from-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchResult,
        conversationId,
        options
      } as AddReferenceRequest)
    });

    const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error ? `Failed to add reference: ${data.error}` : `Failed to add reference: ${response.statusText}`
        };
      }

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error adding reference:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add reference'
    };
  }
}

/**
 * Refines a search query using AI
 * @param query - The original query to refine
 * @param originalContent - Content to use for context
 * @param conversationId - The conversation ID
 * @returns Promise with query refinement or error
 */
export async function refineQuery(
  query: string,
  originalContent: ExtractedContent[],
  conversationId: string
): Promise<ApiResponse<QueryRefinement>> {
  try {
    const response = await fetch('/api/ai-searcher/refine-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        originalContent,
        conversationId
      } as RefineQueryRequest)
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Query refinement failed: ${response.statusText}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.refinement
    };
  } catch (error) {
    console.error('Error refining query:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Query refinement failed'
    };
  }
}

/**
 * Submits feedback for a specific search result
 * @param searchSessionId - The search session ID
 * @param resultId - The result ID
 * @param feedback - The feedback data
 * @returns Promise with success status or error
 */
export async function submitResultFeedback(
  searchSessionId: string,
  resultId: string,
  feedback: {
    isRelevant: boolean;
    qualityRating: number;
    comments: string;
    timestamp: Date;
  }
): Promise<ApiResponse<null>> {
  try {
    const response = await fetch('/api/ai-searcher/feedback/result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchSessionId,
        resultId,
        feedback: {
          ...feedback,
          timestamp: feedback.timestamp.toISOString()
        }
      } as ResultFeedbackRequest)
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to submit feedback: ${response.statusText}`
      };
    }

    const data = await response.json();
    
    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to submit feedback'
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Error submitting result feedback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit feedback'
    };
  }
}

/**
 * Submits feedback for an entire search session
 * @param searchSessionId - The search session ID
 * @param conversationId - The conversation ID
 * @param feedback - The session feedback data
 * @returns Promise with success status or error
 */
export async function submitSessionFeedback(
  searchSessionId: string,
  conversationId: string,
  feedback: {
    overallSatisfaction: number;
    relevanceRating: number;
    qualityRating: number;
    easeOfUseRating: number;
    feedbackComments: string;
    wouldRecommend: boolean;
    improvementSuggestions: string;
    timestamp: Date;
  }
): Promise<ApiResponse<null>> {
  try {
    const response = await fetch('/api/ai-searcher/feedback/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchSessionId,
        conversationId,
        feedback: {
          ...feedback,
          timestamp: feedback.timestamp.toISOString()
        }
      } as SessionFeedbackRequest)
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to submit session feedback: ${response.statusText}`
      };
    }

    const data = await response.json();
    
    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to submit session feedback'
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Error submitting session feedback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit session feedback'
    };
  }
}