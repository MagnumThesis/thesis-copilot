import { search, addReferenceFromSearch, refineQuery, submitResultFeedback, submitSessionFeedback } from '../ai-searcher-api';
import { ScholarSearchResult, SearchFilters } from '../../ai-types';
import { QueryRefinement } from '../../../worker/lib/query-generation-engine';
import { ExtractedContent } from '../../ai-types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the global fetch function
global.fetch = vi.fn();

describe('AI Searcher API Service', () => {
  const mockConversationId = 'test-conversation-id';
  const mockQuery = 'test query';
  const mockFilters: SearchFilters = { sortBy: 'relevance' };
  
  beforeEach(() => {
    (fetch as any).mockClear();
  });

  describe('search', () => {
    it('should call the search API with correct parameters', async () => {
      const mockResponse = {
        success: true,
        results: [],
        sessionId: 'test-session-id'
      };
      
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await search(mockQuery, mockConversationId, mockFilters);

      expect(fetch).toHaveBeenCalledWith('/api/ai-searcher/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mockQuery,
          conversationId: mockConversationId,
          filters: mockFilters
        })
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      });

      const result = await search(mockQuery, mockConversationId, mockFilters);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Search failed');
    });

    it('should handle network errors', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await search(mockQuery, mockConversationId, mockFilters);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('addReferenceFromSearch', () => {
    it('should call the add reference API with correct parameters', async () => {
      const mockSearchResult: ScholarSearchResult = {
        title: 'Test Paper',
        authors: ['Author 1', 'Author 2'],
        confidence: 0.9,
        relevance_score: 0.8
      };
      
      const mockOptions = {
        checkDuplicates: true,
        duplicateHandling: 'prompt_user',
        minConfidence: 0.5,
        autoPopulateMetadata: true
      };
      
      const mockResponse = {
        success: true,
        reference: { id: 'ref-123', title: 'Test Paper' }
      };
      
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await addReferenceFromSearch(mockSearchResult, mockConversationId, mockOptions);

      expect(fetch).toHaveBeenCalledWith('/api/referencer/add-from-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchResult: mockSearchResult,
          conversationId: mockConversationId,
          options: mockOptions
        })
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const mockSearchResult: ScholarSearchResult = {
        title: 'Test Paper',
        authors: ['Author 1', 'Author 2'],
        confidence: 0.9,
        relevance_score: 0.8
      };
      
      const mockOptions = {
        checkDuplicates: true,
        duplicateHandling: 'prompt_user',
        minConfidence: 0.5,
        autoPopulateMetadata: true
      };
      
      (fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Custom error message' })
      });

      const result = await addReferenceFromSearch(mockSearchResult, mockConversationId, mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to add reference');
    });
  });

  describe('refineQuery', () => {
    it('should call the refine query API with correct parameters', async () => {
      const mockContent: ExtractedContent[] = [
        {
          id: 'content-1',
          content: 'Test content',
          type: 'idea',
          confidence: 0.8
        }
      ];
      
      const mockResponse = {
        success: true,
        refinement: {
          breadthAnalysis: {
            breadthScore: 0.7,
            classification: 'optimal',
            reasoning: 'Good query',
            termCount: 2,
            specificityLevel: 'moderate',
            suggestions: []
          }
        } as QueryRefinement
      };
      
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await refineQuery(mockQuery, mockContent, mockConversationId);

      expect(fetch).toHaveBeenCalledWith('/api/ai-searcher/refine-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mockQuery,
          originalContent: mockContent,
          conversationId: mockConversationId
        })
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.refinement);
    });

    it('should handle API errors', async () => {
      const mockContent: ExtractedContent[] = [
        {
          id: 'content-1',
          content: 'Test content',
          type: 'idea',
          confidence: 0.8
        }
      ];
      
      (fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      });

      const result = await refineQuery(mockQuery, mockContent, mockConversationId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query refinement failed');
    });
  });

  describe('submitResultFeedback', () => {
    it('should call the result feedback API with correct parameters', async () => {
      const mockSessionId = 'test-session-id';
      const mockResultId = 'result-123';
      const mockFeedback = {
        isRelevant: true,
        qualityRating: 4,
        comments: 'Good result',
        timestamp: new Date()
      };
      
      const mockResponse = {
        success: true
      };
      
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await submitResultFeedback(mockSessionId, mockResultId, mockFeedback);

      expect(fetch).toHaveBeenCalledWith('/api/ai-searcher/feedback/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchSessionId: mockSessionId,
          resultId: mockResultId,
          feedback: {
            ...mockFeedback,
            timestamp: mockFeedback.timestamp.toISOString()
          }
        })
      });
      
      expect(result.success).toBe(true);
    });

    it('should handle API errors', async () => {
      const mockSessionId = 'test-session-id';
      const mockResultId = 'result-123';
      const mockFeedback = {
        isRelevant: true,
        qualityRating: 4,
        comments: 'Good result',
        timestamp: new Date()
      };
      
      (fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      });

      const result = await submitResultFeedback(mockSessionId, mockResultId, mockFeedback);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to submit feedback');
    });
  });

  describe('submitSessionFeedback', () => {
    it('should call the session feedback API with correct parameters', async () => {
      const mockSessionId = 'test-session-id';
      const mockFeedback = {
        overallSatisfaction: 5,
        relevanceRating: 4,
        qualityRating: 4,
        easeOfUseRating: 5,
        feedbackComments: 'Great search experience',
        wouldRecommend: true,
        improvementSuggestions: 'None',
        timestamp: new Date()
      };
      
      const mockResponse = {
        success: true
      };
      
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await submitSessionFeedback(mockSessionId, mockConversationId, mockFeedback);

      expect(fetch).toHaveBeenCalledWith('/api/ai-searcher/feedback/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchSessionId: mockSessionId,
          conversationId: mockConversationId,
          feedback: {
            ...mockFeedback,
            timestamp: mockFeedback.timestamp.toISOString()
          }
        })
      });
      
      expect(result.success).toBe(true);
    });

    it('should handle API errors', async () => {
      const mockSessionId = 'test-session-id';
      const mockFeedback = {
        overallSatisfaction: 5,
        relevanceRating: 4,
        qualityRating: 4,
        easeOfUseRating: 5,
        feedbackComments: 'Great search experience',
        wouldRecommend: true,
        improvementSuggestions: 'None',
        timestamp: new Date()
      };
      
      (fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      });

      const result = await submitSessionFeedback(mockSessionId, mockConversationId, mockFeedback);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to submit session feedback');
    });
  });
});