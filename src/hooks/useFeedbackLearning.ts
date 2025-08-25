import { useState, useCallback } from 'react';

export interface UserPreferencePattern {
  userId: string;
  preferredAuthors: string[];
  preferredJournals: string[];
  preferredYearRange: { min: number; max: number };
  preferredCitationRange: { min: number; max: number };
  topicPreferences: Record<string, number>;
  qualityThreshold: number;
  relevanceThreshold: number;
  rejectionPatterns: {
    authors: string[];
    journals: string[];
    keywords: string[];
  };
  lastUpdated: Date;
}

export interface LearningMetrics {
  totalFeedbackCount: number;
  positiveRatings: number;
  negativeRatings: number;
  averageRating: number;
  improvementTrend: number;
  confidenceLevel: number;
}

export interface AdaptiveFilter {
  type: 'author' | 'journal' | 'year' | 'citation' | 'topic' | 'quality';
  condition: 'include' | 'exclude' | 'boost' | 'penalize';
  value: string | number | { min: number; max: number };
  weight: number;
  confidence: number;
  source: 'explicit_feedback' | 'implicit_behavior' | 'pattern_recognition';
}

interface SubmitLearningFeedbackParams {
  userId: string;
  searchSessionId: string;
  resultId: string;
  isRelevant: boolean;
  qualityRating: number;
  comments?: string;
  resultMetadata: {
    title: string;
    authors: string[];
    journal?: string;
    year?: number;
    citationCount: number;
    topics: string[];
  };
}

interface ApplyLearningRankingParams {
  userId: string;
  searchResults: any[];
}

/**
 * @function useFeedbackLearning
 * @description Hook for managing user feedback and learning for AI searcher.
 * @returns {{submitLearningFeedback: (params: SubmitLearningFeedbackParams) => Promise<any>, applyLearningRanking: (params: ApplyLearningRankingParams) => Promise<any[]>, getUserPreferences: (userId: string) => Promise<UserPreferencePattern>, getAdaptiveFilters: (userId: string) => Promise<AdaptiveFilter[]>, getLearningMetrics: (userId: string) => Promise<LearningMetrics>, clearUserLearningData: (userId: string) => Promise<any>, getLearningSystemStatus: () => Promise<any>, isLoading: boolean, error: string | null}}
 * - `submitLearningFeedback`: Submits user feedback for a search result.
 * - `applyLearningRanking`: Applies learning-based ranking to search results.
 * - `getUserPreferences`: Retrieves user-specific learning preferences.
 * - `getAdaptiveFilters`: Retrieves adaptive filters based on user learning.
 * - `getLearningMetrics`: Retrieves performance metrics of the learning system.
 * - `clearUserLearningData`: Clears all learning data for a specific user.
 * - `getLearningSystemStatus`: Retrieves the status of the learning system.
 * - `isLoading`: Boolean indicating if an asynchronous operation is in progress.
 * - `error`: Any error message from the last operation.
 */
export function useFeedbackLearning() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitLearningFeedback = useCallback(async (params: SubmitLearningFeedbackParams) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai-searcher/learning/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit learning feedback');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit learning feedback';
      setError(errorMessage);
      console.error('Submit learning feedback error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyLearningRanking = useCallback(async (params: ApplyLearningRankingParams) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai-searcher/learning/apply-ranking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to apply learning ranking');
      }

      return data.results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply learning ranking';
      setError(errorMessage);
      console.error('Apply learning ranking error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserPreferences = useCallback(async (userId: string): Promise<UserPreferencePattern> => {
    try {
      setError(null);

      const response = await fetch(`/api/ai-searcher/learning/preferences/${userId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get user preferences');
      }

      return data.preferences;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user preferences';
      setError(errorMessage);
      console.error('Get user preferences error:', err);
      throw err;
    }
  }, []);

  const getAdaptiveFilters = useCallback(async (userId: string): Promise<AdaptiveFilter[]> => {
    try {
      setError(null);

      const response = await fetch(`/api/ai-searcher/learning/adaptive-filters/${userId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get adaptive filters');
      }

      return data.filters;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get adaptive filters';
      setError(errorMessage);
      console.error('Get adaptive filters error:', err);
      throw err;
    }
  }, []);

  const getLearningMetrics = useCallback(async (userId: string): Promise<LearningMetrics> => {
    try {
      setError(null);

      const response = await fetch(`/api/ai-searcher/learning/metrics/${userId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get learning metrics');
      }

      return data.metrics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get learning metrics';
      setError(errorMessage);
      console.error('Get learning metrics error:', err);
      throw err;
    }
  }, []);

  const clearUserLearningData = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/ai-searcher/learning/user-data/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to clear user learning data');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear user learning data';
      setError(errorMessage);
      console.error('Clear user learning data error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLearningSystemStatus = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch('/api/ai-searcher/learning/status');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get learning system status');
      }

      return data.status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get learning system status';
      setError(errorMessage);
      console.error('Get learning system status error:', err);
      throw err;
    }
  }, []);

  return {
    submitLearningFeedback,
    applyLearningRanking,
    getUserPreferences,
    getAdaptiveFilters,
    getLearningMetrics,
    clearUserLearningData,
    getLearningSystemStatus,
    isLoading,
    error,
  };
}

// Helper hook for enhanced search result feedback
/**
 * @function useEnhancedSearchFeedback
 * @description Helper hook for enhanced search result feedback.
 * @param {string} sessionId - The ID of the search session.
 * @param {string} userId - The ID of the user.
 * @returns {{submitEnhancedFeedback: (resultId: string, isRelevant: boolean, qualityRating: number, resultMetadata: {title: string, authors: string[], journal?: string, year?: number, citationCount: number, topics: string[]}, comments?: string) => Promise<any>}}
 * - `submitEnhancedFeedback`: Submits enhanced feedback for a search result.
 */
export function useEnhancedSearchFeedback(sessionId: string, userId: string) {
  const { submitLearningFeedback } = useFeedbackLearning();

  const submitEnhancedFeedback = useCallback(async (
    resultId: string,
    isRelevant: boolean,
    qualityRating: number,
    resultMetadata: {
      title: string;
      authors: string[];
      journal?: string;
      year?: number;
      citationCount: number;
      topics: string[];
    },
    comments?: string
  ) => {
    return submitLearningFeedback({
      userId,
      searchSessionId: sessionId,
      resultId,
      isRelevant,
      qualityRating,
      comments,
      resultMetadata,
    });
  }, [submitLearningFeedback, sessionId, userId]);

  return {
    submitEnhancedFeedback,
  };
}

// Helper hook for learning-enhanced search
/**
 * @function useLearningEnhancedSearch
 * @description Helper hook for learning-enhanced search.
 * @returns {{enhanceSearchResults: (userId: string, searchResults: any[]) => Promise<any[]>}}
 * - `enhanceSearchResults`: Enhances search results using learning-based ranking.
 */
export function useLearningEnhancedSearch() {
  const { applyLearningRanking } = useFeedbackLearning();

  const enhanceSearchResults = useCallback(async (
    userId: string,
    searchResults: any[]
  ) => {
    try {
      return await applyLearningRanking({ userId, searchResults });
    } catch (error) {
      console.warn('Failed to enhance search results with learning, using original results:', error);
      return searchResults; // Fallback to original results
    }
  }, [applyLearningRanking]);

  return {
    enhanceSearchResults,
  };
}