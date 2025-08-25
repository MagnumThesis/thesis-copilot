import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFeedbackLearning, useEnhancedSearchFeedback, useLearningEnhancedSearch } from '../hooks/useFeedbackLearning';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useFeedbackLearning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('submitLearningFeedback', () => {
    it('should submit learning feedback successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Learning feedback submitted successfully'
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useFeedbackLearning());

      const feedbackParams = {
        userId: 'test-user-123',
        searchSessionId: 'test-session-456',
        resultId: 'test-result-789',
        isRelevant: true,
        qualityRating: 4,
        comments: 'Very helpful paper',
        resultMetadata: {
          title: 'Machine Learning in Healthcare',
          authors: ['Smith, J.', 'Doe, A.'],
          journal: 'Nature Medicine',
          year: 2023,
          citationCount: 150,
          topics: ['machine learning', 'healthcare', 'AI']
        }
      };

      let response;
      await act(async () => {
        response = await result.current.submitLearningFeedback(feedbackParams);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/ai-searcher/learning/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackParams),
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle API errors', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Invalid feedback format'
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockErrorResponse),
      });

      const { result } = renderHook(() => useFeedbackLearning());

      const feedbackParams = {
        userId: 'test-user-123',
        searchSessionId: 'test-session-456',
        resultId: 'test-result-789',
        isRelevant: true,
        qualityRating: 6, // Invalid rating
        resultMetadata: {
          title: 'Test Paper',
          authors: ['Test, A.'],
          topics: ['test']
        }
      };

      await act(async () => {
        try {
          await result.current.submitLearningFeedback(feedbackParams);
        } catch (error) {
          expect(error.message).toBe('Invalid feedback format');
        }
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Invalid feedback format');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useFeedbackLearning());

      const feedbackParams = {
        userId: 'test-user-123',
        searchSessionId: 'test-session-456',
        resultId: 'test-result-789',
        isRelevant: true,
        qualityRating: 4,
        resultMetadata: {
          title: 'Test Paper',
          authors: ['Test, A.'],
          topics: ['test']
        }
      };

      await act(async () => {
        try {
          await result.current.submitLearningFeedback(feedbackParams);
        } catch (error) {
          expect(error.message).toBe('Network error');
        }
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Network error');
    });

    it('should set loading state correctly', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValue(promise);

      const { result } = renderHook(() => useFeedbackLearning());

      const feedbackParams = {
        userId: 'test-user-123',
        searchSessionId: 'test-session-456',
        resultId: 'test-result-789',
        isRelevant: true,
        qualityRating: 4,
        resultMetadata: {
          title: 'Test Paper',
          authors: ['Test, A.'],
          topics: ['test']
        }
      };

      act(() => {
        result.current.submitLearningFeedback(feedbackParams);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({
          json: () => Promise.resolve({ success: true })
        });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('applyLearningRanking', () => {
    it('should apply learning ranking successfully', async () => {
      const mockRankedResults = [
        {
          id: 'result-1',
          title: 'Enhanced Paper',
          relevanceScore: 0.95,
          qualityScore: 0.9
        }
      ];

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          results: mockRankedResults
        }),
      });

      const { result } = renderHook(() => useFeedbackLearning());

      const rankingParams = {
        userId: 'test-user-123',
        searchResults: [
          {
            id: 'result-1',
            title: 'Original Paper',
            relevanceScore: 0.7,
            qualityScore: 0.8
          }
        ]
      };

      let rankedResults;
      await act(async () => {
        rankedResults = await result.current.applyLearningRanking(rankingParams);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/ai-searcher/learning/apply-ranking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rankingParams),
      });

      expect(rankedResults).toEqual(mockRankedResults);
    });
  });

  describe('getUserPreferences', () => {
    it('should get user preferences successfully', async () => {
      const mockPreferences = {
        userId: 'test-user-123',
        preferredAuthors: ['Smith, J.'],
        preferredJournals: ['Nature'],
        topicPreferences: { 'AI': 0.8 },
        qualityThreshold: 0.7,
        lastUpdated: new Date()
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          preferences: mockPreferences
        }),
      });

      const { result } = renderHook(() => useFeedbackLearning());

      let preferences;
      await act(async () => {
        preferences = await result.current.getUserPreferences('test-user-123');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/ai-searcher/learning/preferences/test-user-123');
      expect(preferences).toEqual(mockPreferences);
    });
  });

  describe('getAdaptiveFilters', () => {
    it('should get adaptive filters successfully', async () => {
      const mockFilters = [
        {
          type: 'author',
          condition: 'boost',
          value: 'Smith, J.',
          weight: 0.8,
          confidence: 0.9,
          source: 'pattern_recognition'
        }
      ];

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          filters: mockFilters
        }),
      });

      const { result } = renderHook(() => useFeedbackLearning());

      let filters;
      await act(async () => {
        filters = await result.current.getAdaptiveFilters('test-user-123');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/ai-searcher/learning/adaptive-filters/test-user-123');
      expect(filters).toEqual(mockFilters);
    });
  });

  describe('getLearningMetrics', () => {
    it('should get learning metrics successfully', async () => {
      const mockMetrics = {
        totalFeedbackCount: 25,
        positiveRatings: 18,
        negativeRatings: 7,
        averageRating: 4.1,
        improvementTrend: 0.1,
        confidenceLevel: 0.8
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          metrics: mockMetrics
        }),
      });

      const { result } = renderHook(() => useFeedbackLearning());

      let metrics;
      await act(async () => {
        metrics = await result.current.getLearningMetrics('test-user-123');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/ai-searcher/learning/metrics/test-user-123');
      expect(metrics).toEqual(mockMetrics);
    });
  });

  describe('clearUserLearningData', () => {
    it('should clear user learning data successfully', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          message: 'User learning data cleared successfully'
        }),
      });

      const { result } = renderHook(() => useFeedbackLearning());

      let response;
      await act(async () => {
        response = await result.current.clearUserLearningData('test-user-123');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/ai-searcher/learning/user-data/test-user-123', {
        method: 'DELETE',
      });

      expect(response.success).toBe(true);
    });
  });

  describe('getLearningSystemStatus', () => {
    it('should get learning system status successfully', async () => {
      const mockStatus = {
        totalUsers: 150,
        totalFeedbackLast30Days: 500,
        activeFilters: 75,
        averageConfidenceLevel: 0.75,
        systemHealth: 'operational'
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          status: mockStatus
        }),
      });

      const { result } = renderHook(() => useFeedbackLearning());

      let status;
      await act(async () => {
        status = await result.current.getLearningSystemStatus();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/ai-searcher/learning/status');
      expect(status).toEqual(mockStatus);
    });
  });
});

describe('useEnhancedSearchFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should submit enhanced feedback with session and user context', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(() => 
      useEnhancedSearchFeedback('test-session-456', 'test-user-123')
    );

    const resultMetadata = {
      title: 'Test Paper',
      authors: ['Test, A.'],
      journal: 'Test Journal',
      year: 2023,
      citationCount: 50,
      topics: ['test', 'research']
    };

    await act(async () => {
      await result.current.submitEnhancedFeedback(
        'test-result-789',
        true,
        4,
        resultMetadata,
        'Great paper!'
      );
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/ai-searcher/learning/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-user-123',
        searchSessionId: 'test-session-456',
        resultId: 'test-result-789',
        isRelevant: true,
        qualityRating: 4,
        comments: 'Great paper!',
        resultMetadata
      }),
    });
  });
});

describe('useLearningEnhancedSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should enhance search results with learning', async () => {
    const mockEnhancedResults = [
      {
        id: 'result-1',
        title: 'Enhanced Paper',
        relevanceScore: 0.95,
        qualityScore: 0.9
      }
    ];

    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        results: mockEnhancedResults
      }),
    });

    const { result } = renderHook(() => useLearningEnhancedSearch());

    const originalResults = [
      {
        id: 'result-1',
        title: 'Original Paper',
        relevanceScore: 0.7,
        qualityScore: 0.8
      }
    ];

    let enhancedResults;
    await act(async () => {
      enhancedResults = await result.current.enhanceSearchResults('test-user-123', originalResults);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/ai-searcher/learning/apply-ranking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-user-123',
        searchResults: originalResults
      }),
    });

    expect(enhancedResults).toEqual(mockEnhancedResults);
  });

  it('should fallback to original results on error', async () => {
    mockFetch.mockRejectedValue(new Error('Learning service unavailable'));

    const { result } = renderHook(() => useLearningEnhancedSearch());

    const originalResults = [
      {
        id: 'result-1',
        title: 'Original Paper',
        relevanceScore: 0.7,
        qualityScore: 0.8
      }
    ];

    let enhancedResults;
    await act(async () => {
      enhancedResults = await result.current.enhanceSearchResults('test-user-123', originalResults);
    });

    // Should return original results when learning fails
    expect(enhancedResults).toEqual(originalResults);
  });
});