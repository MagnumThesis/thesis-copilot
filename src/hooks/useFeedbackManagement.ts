import { useState, useCallback } from "react";
import { submitResultFeedback, submitSessionFeedback } from "../lib/api/ai-searcher-api";
import { SearchResultFeedback, SearchSessionFeedback } from "../lib/ai-types";

/**
 * Custom hook for feedback management functionality
 * @returns Object containing feedback management state and functions
 */
export const useFeedbackManagement = () => {
  const [showSessionFeedback, setShowSessionFeedback] = useState(false);
  const [sessionFeedbackSubmitted, setSessionFeedbackSubmitted] = useState(false);

  /**
   * Submits feedback for a specific search result
   * @param resultId - The result ID
   * @param feedback - The feedback data
   * @param currentSessionId - The current search session ID
   * @returns Promise that resolves when the feedback is submitted
   */
  const handleResultFeedback = useCallback(
    async (
      resultId: string,
      feedback: SearchResultFeedback,
      currentSessionId: string | null
    ) => {
      if (!currentSessionId) {
        throw new Error('No active search session');
      }

      try {
        const response = await submitResultFeedback(currentSessionId, resultId, {
          isRelevant: feedback.isRelevant,
          qualityRating: feedback.qualityRating,
          comments: feedback.comments,
          timestamp: feedback.timestamp
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to submit feedback');
        }

        console.log('Result feedback submitted successfully');
      } catch (error) {
        console.error('Error submitting result feedback:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Submits feedback for an entire search session
   * @param feedback - The session feedback data
   * @param currentSessionId - The current search session ID
   * @param conversationId - The conversation ID
   * @param setShowSessionFeedback - Function to update showSessionFeedback state
   * @returns Promise that resolves when the feedback is submitted
   */
  const handleSessionFeedback = useCallback(
    async (
      feedback: SearchSessionFeedback,
      currentSessionId: string | null,
      conversationId: string,
      setShowSessionFeedback: (show: boolean) => void
    ) => {
      if (!currentSessionId) {
        throw new Error('No active search session');
      }

      try {
        const response = await submitSessionFeedback(currentSessionId, conversationId, {
          overallSatisfaction: feedback.overallSatisfaction,
          relevanceRating: feedback.relevanceRating,
          qualityRating: feedback.qualityRating,
          easeOfUseRating: feedback.easeOfUseRating,
          feedbackComments: feedback.feedbackComments,
          wouldRecommend: feedback.wouldRecommend,
          improvementSuggestions: feedback.improvementSuggestions,
          timestamp: feedback.timestamp
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to submit session feedback');
        }

        setSessionFeedbackSubmitted(true);
        setShowSessionFeedback(false);
        console.log('Session feedback submitted successfully');
      } catch (error) {
        console.error('Error submitting session feedback:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Shows the session feedback form
   */
  const handleShowSessionFeedback = useCallback(() => {
    setShowSessionFeedback(true);
  }, []);

  /**
   * Cancels the session feedback form
   */
  const handleCancelSessionFeedback = useCallback(() => {
    setShowSessionFeedback(false);
  }, []);

  return {
    showSessionFeedback,
    sessionFeedbackSubmitted,
    handleResultFeedback,
    handleSessionFeedback,
    handleShowSessionFeedback,
    handleCancelSessionFeedback,
    setShowSessionFeedback,
    setSessionFeedbackSubmitted
  };
};