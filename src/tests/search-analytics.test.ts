import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchAnalyticsManager } from '../worker/lib/search-analytics-manager';

// Mock the database environment
const createMockEnv = () => ({
  DB: {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        run: vi.fn().mockResolvedValue({ success: true }),
        first: vi.fn().mockResolvedValue({}),
        all: vi.fn().mockResolvedValue({ results: [] })
      })
    })
  }
});

describe('SearchAnalyticsManager', () => {
  let analyticsManager: SearchAnalyticsManager;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv = createMockEnv();
    analyticsManager = new SearchAnalyticsManager(mockEnv);
  });

  describe('recordSearchSession', () => {
    it('should record a search session successfully', async () => {
      const sessionData = {
        conversationId: 'test-conversation',
        userId: 'test-user',
        searchQuery: 'machine learning',
        contentSources: ['ideas' as const],
        searchFilters: {},
        resultsCount: 5,
        resultsAccepted: 0,
        resultsRejected: 0,
        searchSuccess: true,
        processingTimeMs: 1500
      };

      const sessionId = await analyticsManager.recordSearchSession(sessionData);

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO search_sessions')
      );
    });

    it('should handle search session recording errors', async () => {
      mockEnv.DB.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      const sessionData = {
        conversationId: 'test-conversation',
        userId: 'test-user',
        searchQuery: 'machine learning',
        contentSources: ['ideas' as const],
        searchFilters: {},
        resultsCount: 5,
        resultsAccepted: 0,
        resultsRejected: 0,
        searchSuccess: true,
        processingTimeMs: 1500
      };

      await expect(analyticsManager.recordSearchSession(sessionData))
        .rejects.toThrow('Database error');
    });
  });

  describe('recordSearchResult', () => {
    it('should record a search result successfully', async () => {
      const resultData = {
        searchSessionId: 'test-session',
        resultTitle: 'Test Paper',
        resultAuthors: ['Author 1', 'Author 2'],
        resultJournal: 'Test Journal',
        resultYear: 2023,
        resultDoi: '10.1234/test.2023.123',
        resultUrl: 'https://example.com/paper',
        relevanceScore: 0.85,
        confidenceScore: 0.90,
        qualityScore: 0.75,
        citationCount: 42,
        addedToLibrary: false
      };

      const resultId = await analyticsManager.recordSearchResult(resultData);

      expect(resultId).toBeDefined();
      expect(typeof resultId).toBe('string');
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO search_results')
      );
    });
  });

  describe('updateSearchResultAction', () => {
    it('should update search result action successfully', async () => {
      const resultId = 'test-result-id';
      const action = 'added';
      const referenceId = 'test-reference-id';

      await analyticsManager.updateSearchResultAction(resultId, action, referenceId);

      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE search_results')
      );
    });

    it('should handle different action types', async () => {
      const resultId = 'test-result-id';
      const actions = ['viewed', 'added', 'rejected', 'bookmarked', 'ignored'] as const;

      for (const action of actions) {
        await analyticsManager.updateSearchResultAction(resultId, action);
        expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE search_results')
        );
      }
    });
  });

  describe('recordSearchFeedback', () => {
    it('should record search feedback successfully', async () => {
      const feedbackData = {
        searchSessionId: 'test-session',
        userId: 'test-user',
        overallSatisfaction: 4,
        relevanceRating: 5,
        qualityRating: 4,
        easeOfUseRating: 3,
        feedbackComments: 'Great search results!',
        wouldRecommend: true,
        improvementSuggestions: 'Add more filters'
      };

      const feedbackId = await analyticsManager.recordSearchFeedback(feedbackData);

      expect(feedbackId).toBeDefined();
      expect(typeof feedbackId).toBe('string');
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO search_feedback')
      );
    });

    it('should validate rating ranges', async () => {
      const feedbackData = {
        searchSessionId: 'test-session',
        userId: 'test-user',
        overallSatisfaction: 4,
        relevanceRating: 5,
        qualityRating: 4,
        easeOfUseRating: 3,
        wouldRecommend: true
      };

      // Should not throw for valid ratings (1-5)
      await expect(analyticsManager.recordSearchFeedback(feedbackData))
        .resolves.toBeDefined();
    });
  });

  describe('getConversionMetrics', () => {
    it('should calculate conversion metrics correctly', async () => {
      // Mock database response
      mockEnv.DB.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            total_searches: 10,
            total_results: 50,
            results_viewed: 30,
            results_added: 15,
            results_rejected: 5
          })
        })
      });

      const metrics = await analyticsManager.getConversionMetrics('test-user', 'test-conversation');

      expect(metrics).toEqual({
        totalSearches: 10,
        totalResults: 50,
        resultsViewed: 30,
        resultsAdded: 15,
        resultsRejected: 5,
        conversionRate: 0.3, // 15/50
        viewRate: 0.6, // 30/50
        rejectionRate: 0.1 // 5/50
      });
    });

    it('should handle zero results gracefully', async () => {
      mockEnv.DB.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            total_searches: 5,
            total_results: 0,
            results_viewed: 0,
            results_added: 0,
            results_rejected: 0
          })
        })
      });

      const metrics = await analyticsManager.getConversionMetrics('test-user');

      expect(metrics.conversionRate).toBe(0);
      expect(metrics.viewRate).toBe(0);
      expect(metrics.rejectionRate).toBe(0);
    });
  });

  describe('getUserSatisfactionMetrics', () => {
    it('should calculate satisfaction metrics correctly', async () => {
      mockEnv.DB.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            avg_overall_satisfaction: 4.2,
            avg_relevance_rating: 4.5,
            avg_quality_rating: 4.0,
            avg_ease_of_use_rating: 3.8,
            recommendation_rate: 85.0,
            total_feedback_count: 20
          })
        })
      });

      const metrics = await analyticsManager.getUserSatisfactionMetrics('test-user');

      expect(metrics).toEqual({
        averageOverallSatisfaction: 4.2,
        averageRelevanceRating: 4.5,
        averageQualityRating: 4.0,
        averageEaseOfUseRating: 3.8,
        recommendationRate: 85.0,
        totalFeedbackCount: 20
      });
    });
  });

  describe('getSearchAnalytics', () => {
    it('should generate comprehensive search analytics', async () => {
      // Mock search statistics
      mockEnv.DB.prepare
        .mockReturnValueOnce({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue({
              total_searches: 25,
              successful_searches: 20,
              avg_results: 12.5,
              avg_processing_time: 2500
            })
          })
        })
        // Mock topics query
        .mockReturnValueOnce({
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({
              results: [
                { search_query: 'machine learning algorithms' },
                { search_query: 'natural language processing' },
                { search_query: 'deep learning neural networks' }
              ]
            })
          })
        })
        // Mock sources query
        .mockReturnValueOnce({
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({
              results: [
                { content_sources: '["ideas"]' },
                { content_sources: '["builder"]' },
                { content_sources: '["ideas", "builder"]' }
              ]
            })
          })
        });

      const analytics = await analyticsManager.getSearchAnalytics('test-user');

      expect(analytics.total_searches).toBe(25);
      expect(analytics.average_results).toBe(12.5);
      expect(analytics.successRate).toBe(0.8); // 20/25
      expect(analytics.popularTopics).toBeDefined();
      expect(analytics.topSources).toBeDefined();
    });
  });

  describe('clearAnalyticsData', () => {
    it('should clear analytics data for a user', async () => {
      await analyticsManager.clearAnalyticsData('test-user');

      // Should call DELETE for each analytics table
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM search_feedback')
      );
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM search_results')
      );
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM search_sessions')
      );
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM search_analytics')
      );
    });

    it('should clear analytics data for a specific conversation', async () => {
      await analyticsManager.clearAnalyticsData('test-user', 'test-conversation');

      // Should include conversation filter in queries
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('conversation_id = ?')
      );
    });
  });
});

describe('Analytics Integration', () => {
  it('should track complete search workflow', async () => {
    const mockEnv = createMockEnv();
    const analyticsManager = new SearchAnalyticsManager(mockEnv);
    
    // 1. Record search session
    const sessionId = await analyticsManager.recordSearchSession({
      conversationId: 'test-conversation',
      userId: 'test-user',
      searchQuery: 'machine learning',
      contentSources: ['ideas'],
      searchFilters: {},
      resultsCount: 3,
      resultsAccepted: 0,
      resultsRejected: 0,
      searchSuccess: true,
      processingTimeMs: 1500
    });

    // 2. Record search results
    const resultIds = [];
    for (let i = 0; i < 3; i++) {
      const resultId = await analyticsManager.recordSearchResult({
        searchSessionId: sessionId,
        resultTitle: `Test Paper ${i + 1}`,
        resultAuthors: [`Author ${i + 1}`],
        relevanceScore: 0.8 + (i * 0.05),
        confidenceScore: 0.9,
        qualityScore: 0.7,
        citationCount: 10 + i,
        addedToLibrary: false
      });
      resultIds.push(resultId);
    }

    // 3. Track user actions
    await analyticsManager.updateSearchResultAction(resultIds[0], 'added', 'ref-1');
    await analyticsManager.updateSearchResultAction(resultIds[1], 'viewed');
    await analyticsManager.updateSearchResultAction(resultIds[2], 'rejected');

    // 4. Record feedback
    await analyticsManager.recordSearchFeedback({
      searchSessionId: sessionId,
      userId: 'test-user',
      overallSatisfaction: 4,
      relevanceRating: 5,
      qualityRating: 4,
      easeOfUseRating: 4,
      wouldRecommend: true,
      feedbackComments: 'Good results overall'
    });

    // Verify all operations completed successfully
    expect(mockEnv.DB.prepare).toHaveBeenCalledTimes(8); // 1 session + 3 results + 3 actions + 1 feedback
  });
});