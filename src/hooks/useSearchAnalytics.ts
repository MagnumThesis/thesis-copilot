import { useState, useCallback } from 'react';

interface TrackResultActionParams {
  resultId?: string;
  sessionId: string;
  resultTitle: string;
  action: 'viewed' | 'added' | 'rejected' | 'bookmarked' | 'ignored';
  referenceId?: string;
  feedback?: {
    rating?: number;
    comments?: string;
  };
}

interface RecordFeedbackParams {
  sessionId: string;
  conversationId: string;
  overallSatisfaction: number;
  relevanceRating: number;
  qualityRating: number;
  easeOfUseRating: number;
  feedbackComments?: string;
  wouldRecommend: boolean;
  improvementSuggestions?: string;
}

export function useSearchAnalytics() {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackResultAction = useCallback(async (params: TrackResultActionParams) => {
    try {
      setIsTracking(true);
      setError(null);

      const response = await fetch('/api/ai-searcher/track-result-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to track result action');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track result action';
      setError(errorMessage);
      console.error('Track result action error:', err);
      throw err;
    } finally {
      setIsTracking(false);
    }
  }, []);

  const recordFeedback = useCallback(async (params: RecordFeedbackParams) => {
    try {
      setIsTracking(true);
      setError(null);

      const response = await fetch('/api/ai-searcher/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to record feedback');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record feedback';
      setError(errorMessage);
      console.error('Record feedback error:', err);
      throw err;
    } finally {
      setIsTracking(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async (conversationId: string, days: number = 30) => {
    try {
      setError(null);

      const response = await fetch(`/api/ai-searcher/analytics?conversationId=${conversationId}&days=${days}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      return data.analytics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      console.error('Fetch analytics error:', err);
      throw err;
    }
  }, []);

  return {
    trackResultAction,
    recordFeedback,
    fetchAnalytics,
    isTracking,
    error,
  };
}

// Helper hook for tracking reference additions from search results
export function useSearchResultTracking(sessionId: string) {
  const { trackResultAction } = useSearchAnalytics();

  const trackReferenceAdded = useCallback(async (
    resultTitle: string,
    referenceId: string,
    resultId?: string
  ) => {
    return trackResultAction({
      resultId,
      sessionId,
      resultTitle,
      action: 'added',
      referenceId,
    });
  }, [sessionId, trackResultAction]);

  const trackReferenceRejected = useCallback(async (
    resultTitle: string,
    resultId?: string,
    feedback?: { rating?: number; comments?: string }
  ) => {
    return trackResultAction({
      resultId,
      sessionId,
      resultTitle,
      action: 'rejected',
      feedback,
    });
  }, [sessionId, trackResultAction]);

  const trackReferenceViewed = useCallback(async (
    resultTitle: string,
    resultId?: string
  ) => {
    return trackResultAction({
      resultId,
      sessionId,
      resultTitle,
      action: 'viewed',
    });
  }, [sessionId, trackResultAction]);

  const trackReferenceBookmarked = useCallback(async (
    resultTitle: string,
    resultId?: string
  ) => {
    return trackResultAction({
      resultId,
      sessionId,
      resultTitle,
      action: 'bookmarked',
    });
  }, [sessionId, trackResultAction]);

  return {
    trackReferenceAdded,
    trackReferenceRejected,
    trackReferenceViewed,
    trackReferenceBookmarked,
  };
}