import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EnhancedSearchHistoryManager } from '../worker/lib/enhanced-search-history-manager';

// Mock environment
const mockEnv = {
  DB: {
    prepare: vi.fn(),
  },
};

// Mock database responses
const mockSearchSessions = [
  {
    id: 'session-1',
    conversation_id: 'conv-1',
    user_id: 'user-1',
    search_query: 'machine learning research',
    content_sources: '["ideas", "builder"]',
    search_filters: '{"sortBy": "relevance"}',
    results_count: 10,
    results_accepted: 3,
    results_rejected: 1,
    search_success: true,
    processing_time_ms: 2500,
    created_at: '2024-01-15T10:00:00Z',
    success_rate: 0.3
  },
  {
    id: 'session-2',
    conversation_id: 'conv-1',
    user_id: 'user-1',
    search_query: 'natural language processing',
    content_sources: '["ideas"]',
    search_filters: '{}',
    results_count: 8,
    results_accepted: 2,
    results_rejected: 0,
    search_success: true,
    processing_time_ms: 1800,
    created_at: '2024-01-14T15:30:00Z',
    success_rate: 0.25
  }
];

const mockSearchResults = [
  {
    id: 'result-1',
    search_session_id: 'session-1',
    result_title: 'Deep Learning for NLP',
    result_authors: '["Smith, J.", "Doe, A."]',
    result_journal: 'AI Journal',
    result_year: 2023,
    result_doi: '10.1234/ai.2023.001',
    result_url: 'https://example.com/paper1',
    relevance_score: 0.95,
    confidence_score: 0.88,
    quality_score: 0.92,
    citation_count: 150,
    user_action: 'added',
    added_to_library: true,
    created_at: '2024-01-15T10:01:00Z'
  },
  {
    id: 'result-2',
    search_session_id: 'session-1',
    result_title: 'Machine Learning Applications',
    result_authors: '["Johnson, B."]',
    result_journal: 'ML Conference',
    result_year: 2023,
    relevance_score: 0.82,
    confidence_score: 0.75,
    quality_score: 0.80,
    citation_count: 85,
    user_action: 'viewed',
    added_to_library: false,
    created_at: '2024-01-15T10:01:30Z'
  }
];

const mockFeedback = {
  id: 'feedback-1',
  search_session_id: 'session-1',
  overall_satisfaction: 4,
  relevance_rating: 5,
  quality_rating: 4,
  ease_of_use_rating: 4,
  feedback_comments: 'Great results!',
  would_recommend: true,
  improvement_suggestions: 'More filtering options'
};

describe('EnhancedSearchHistoryManager', () => {
  let manager: EnhancedSearchHistoryManager;
  let mockPrepare: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockPrepare = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      all: vi.fn(),
      run: vi.fn()
    };
    
    mockEnv.DB.prepare.mockReturnValue(mockPrepare);
    manager = new EnhancedSearchHistoryManager(mockEnv);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSearchHistory', () => {
    it('should fetch search history with pagination', async () => {
      mockPrepare.first.mockResolvedValue({ total: 2 });
      mockPrepare.all.mockResolvedValue({ results: mockSearchSessions });

      const result = await manager.getSearchHistory('user-1', 'conv-1', undefined, 10, 0);

      expect(result.entries).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
      expect(result.entries[0].searchQuery).toBe('machine learning research');
      expect(result.entries[0].contentSources).toEqual(['ideas', 'builder']);
    });

    it('should apply filters correctly', async () => {
      const filter = {
        contentSources: ['ideas' as const],
        successOnly: true,
        minResultsCount: 5
      };

      mockPrepare.first.mockResolvedValue({ total: 1 });
      mockPrepare.all.mockResolvedValue({ results: [mockSearchSessions[1]] });

      const result = await manager.getSearchHistory('user-1', 'conv-1', filter, 10, 0);

      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('JSON_EXTRACT(ss.content_sources, "$") LIKE ?')
      );
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('ss.search_success = true')
      );
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('ss.results_count >= ?')
      );
    });

    it('should handle date range filters', async () => {
      const filter = {
        dateRange: {
          start: new Date('2024-01-14'),
          end: new Date('2024-01-16')
        }
      };

      mockPrepare.first.mockResolvedValue({ total: 2 });
      mockPrepare.all.mockResolvedValue({ results: mockSearchSessions });

      await manager.getSearchHistory('user-1', 'conv-1', filter, 10, 0);

      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('ss.created_at BETWEEN ? AND ?')
      );
    });
  });

  describe('getSearchHistoryStats', () => {
    it('should calculate comprehensive statistics', async () => {
      const mockStats = {
        total_searches: 10,
        successful_searches: 8,
        avg_results_per_search: 7.5,
        avg_success_rate: 0.6,
        avg_processing_time: 2000
      };

      const mockSourcesData = [
        { content_sources: '["ideas"]', usage_count: 5 },
        { content_sources: '["builder"]', usage_count: 3 },
        { content_sources: '["ideas", "builder"]', usage_count: 2 }
      ];

      const mockQueriesData = [
        {
          search_query: 'machine learning',
          query_count: 3,
          avg_results: 8.5,
          success_rate: 0.7
        },
        {
          search_query: 'deep learning',
          query_count: 2,
          avg_results: 6.0,
          success_rate: 0.5
        }
      ];

      const mockTrendsData = [
        {
          search_date: '2024-01-15',
          search_count: 5,
          success_rate: 0.8,
          avg_results: 8.2
        },
        {
          search_date: '2024-01-14',
          search_count: 3,
          success_rate: 0.6,
          avg_results: 6.5
        }
      ];

      mockPrepare.first
        .mockResolvedValueOnce(mockStats);
      
      mockPrepare.all
        .mockResolvedValueOnce({ results: mockSourcesData })
        .mockResolvedValueOnce({ results: mockQueriesData })
        .mockResolvedValueOnce({ results: mockTrendsData });

      const stats = await manager.getSearchHistoryStats('user-1', 'conv-1', 30);

      expect(stats.totalSearches).toBe(10);
      expect(stats.successfulSearches).toBe(8);
      expect(stats.averageResultsPerSearch).toBe(7.5);
      expect(stats.averageSuccessRate).toBe(0.6);
      expect(stats.averageProcessingTime).toBe(2000);
      expect(stats.mostUsedContentSources).toHaveLength(2);
      expect(stats.topSearchQueries).toHaveLength(2);
      expect(stats.searchTrends).toHaveLength(2);
    });
  });

  describe('getContentSourceUsage', () => {
    it('should analyze content source effectiveness', async () => {
      const mockUsageData = [
        {
          content_sources: '["ideas"]',
          total_usage: 5,
          successful_searches: 4,
          avg_results: 7.2,
          usage_date: '2024-01-15'
        },
        {
          content_sources: '["builder"]',
          total_usage: 3,
          successful_searches: 2,
          avg_results: 5.8,
          usage_date: '2024-01-15'
        }
      ];

      mockPrepare.all.mockResolvedValue({ results: mockUsageData });

      const usage = await manager.getContentSourceUsage('user-1', 'conv-1', 30);

      expect(usage).toHaveLength(2);
      expect(usage[0].source).toBe('ideas');
      expect(usage[0].totalUsage).toBe(5);
      expect(usage[0].successfulSearches).toBe(4);
      expect(usage[0].averageResults).toBe(7.2);
      expect(usage[0].topKeywords).toEqual(['research', 'analysis', 'methodology', 'results', 'conclusion']);
    });
  });

  describe('getSearchSuccessRateTracking', () => {
    it('should track success rates over time', async () => {
      const mockTrackingData = [
        {
          search_date: '2024-01-15',
          total_searches: 5,
          successful_searches: 4,
          average_results: 8.2
        },
        {
          search_date: '2024-01-14',
          total_searches: 3,
          successful_searches: 2,
          average_results: 6.5
        }
      ];

      mockPrepare.all.mockResolvedValue({ results: mockTrackingData });

      const tracking = await manager.getSearchSuccessRateTracking('user-1', 'conv-1', 30);

      expect(tracking).toHaveLength(2);
      expect(tracking[0].date).toBe('2024-01-15');
      expect(tracking[0].totalSearches).toBe(5);
      expect(tracking[0].successfulSearches).toBe(4);
      expect(tracking[0].successRate).toBe(0.8);
      expect(tracking[0].averageResults).toBe(8.2);
    });
  });

  describe('getSearchSessionDetails', () => {
    it('should fetch detailed session information', async () => {
      mockPrepare.first
        .mockResolvedValueOnce(mockSearchSessions[0])
        .mockResolvedValueOnce(mockFeedback);
      
      mockPrepare.all.mockResolvedValue({ results: mockSearchResults });

      const details = await manager.getSearchSessionDetails('session-1');

      expect(details).not.toBeNull();
      expect(details!.session.id).toBe('session-1');
      expect(details!.session.searchQuery).toBe('machine learning research');
      expect(details!.results).toHaveLength(2);
      expect(details!.results[0].title).toBe('Deep Learning for NLP');
      expect(details!.feedback).toBeDefined();
      expect(details!.feedback!.overallSatisfaction).toBe(4);
    });

    it('should return null for non-existent session', async () => {
      mockPrepare.first.mockResolvedValue(null);

      const details = await manager.getSearchSessionDetails('non-existent');

      expect(details).toBeNull();
    });
  });

  describe('getQueryPerformanceAnalytics', () => {
    it('should analyze query performance', async () => {
      const mockPerformanceData = [
        {
          search_query: 'machine learning',
          search_count: 3,
          avg_results: 8.5,
          success_rate: 0.7,
          avg_processing_time: 2200,
          last_used: '2024-01-15T10:00:00Z'
        }
      ];

      const mockTopResults = [
        {
          result_title: 'Deep Learning for NLP',
          relevance_score: 0.95,
          added_to_library: true
        }
      ];

      mockPrepare.all
        .mockResolvedValueOnce({ results: mockPerformanceData })
        .mockResolvedValueOnce({ results: mockTopResults });

      const analytics = await manager.getQueryPerformanceAnalytics('user-1', 'conv-1', 30);

      expect(analytics).toHaveLength(1);
      expect(analytics[0].query).toBe('machine learning');
      expect(analytics[0].searchCount).toBe(3);
      expect(analytics[0].averageResults).toBe(8.5);
      expect(analytics[0].successRate).toBe(0.7);
      expect(analytics[0].averageProcessingTime).toBe(2200);
      expect(analytics[0].topResults).toHaveLength(1);
      expect(analytics[0].topResults[0].title).toBe('Deep Learning for NLP');
    });
  });

  describe('getContentSourceEffectiveness', () => {
    it('should analyze content source effectiveness with trends', async () => {
      const mockEffectivenessData = [
        {
          content_sources: '["ideas"]',
          total_searches: 5,
          avg_results: 7.2,
          success_rate: 0.8,
          conversion_rate: 0.6
        }
      ];

      const mockRelevanceData = [
        {
          content_sources: '["ideas"]',
          avg_relevance_score: 0.85
        }
      ];

      const mockTrendData = [
        {
          content_sources: '["ideas"]',
          period: 'recent',
          search_count: 3
        },
        {
          content_sources: '["ideas"]',
          period: 'older',
          search_count: 2
        }
      ];

      mockPrepare.all
        .mockResolvedValueOnce({ results: mockEffectivenessData })
        .mockResolvedValueOnce({ results: mockRelevanceData })
        .mockResolvedValueOnce({ results: mockTrendData });

      const effectiveness = await manager.getContentSourceEffectiveness('user-1', 'conv-1', 30);

      expect(effectiveness).toHaveLength(1);
      expect(effectiveness[0].source).toBe('ideas');
      expect(effectiveness[0].totalSearches).toBe(5);
      expect(effectiveness[0].averageResults).toBe(7.2);
      expect(effectiveness[0].successRate).toBe(0.8);
      expect(effectiveness[0].conversionRate).toBe(0.6);
      expect(effectiveness[0].averageRelevanceScore).toBe(0.85);
      expect(effectiveness[0].recentTrend).toBe('up'); // 3/2 = 1.5 > 1.2
      expect(effectiveness[0].topKeywords).toEqual(['research', 'analysis', 'methodology', 'results', 'conclusion']);
    });
  });

  describe('updateSearchSessionResults', () => {
    it('should update session results', async () => {
      mockPrepare.run.mockResolvedValue({ success: true });

      await manager.updateSearchSessionResults('session-1', 10, 3, 1);

      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE search_sessions')
      );
      expect(mockPrepare.bind).toHaveBeenCalledWith(10, 3, 1, true, null, 'session-1');
    });
  });

  describe('deleteSearchHistory', () => {
    it('should delete specific entries', async () => {
      mockPrepare.run.mockResolvedValue({ success: true });

      await manager.deleteSearchHistory('user-1', 'conv-1', ['session-1', 'session-2']);

      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM search_sessions')
      );
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id IN (?,?)')
      );
    });

    it('should clear all history for user/conversation', async () => {
      mockPrepare.run.mockResolvedValue({ success: true });

      await manager.deleteSearchHistory('user-1', 'conv-1');

      // Should call clearAnalyticsData which deletes from multiple tables
      expect(mockEnv.DB.prepare).toHaveBeenCalledTimes(4); // 4 tables
    });
  });

  describe('exportSearchHistory', () => {
    it('should export history as JSON', async () => {
      mockPrepare.first.mockResolvedValue({ total: 1 });
      mockPrepare.all.mockResolvedValue({ results: [mockSearchSessions[0]] });

      const exported = await manager.exportSearchHistory('user-1', 'conv-1', 'json');

      const data = JSON.parse(exported);
      expect(data.exportDate).toBeDefined();
      expect(data.userId).toBe('user-1');
      expect(data.conversationId).toBe('conv-1');
      expect(data.totalEntries).toBe(1);
      expect(data.entries).toHaveLength(1);
    });

    it('should export history as CSV', async () => {
      mockPrepare.first.mockResolvedValue({ total: 1 });
      mockPrepare.all.mockResolvedValue({ results: [mockSearchSessions[0]] });

      const exported = await manager.exportSearchHistory('user-1', 'conv-1', 'csv');

      expect(exported).toContain('"ID","Date","Search Query"');
      expect(exported).toContain('session-1');
      expect(exported).toContain('machine learning research');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrepare.first.mockRejectedValue(new Error('Database connection failed'));

      await expect(manager.getSearchHistory('user-1', 'conv-1')).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid JSON in content sources', async () => {
      const invalidSession = {
        ...mockSearchSessions[0],
        content_sources: 'invalid-json'
      };

      mockPrepare.first.mockResolvedValue({ total: 1 });
      mockPrepare.all.mockResolvedValue({ results: [invalidSession] });

      const result = await manager.getSearchHistory('user-1', 'conv-1');

      // Should handle gracefully and return empty content sources
      expect(result.entries[0].contentSources).toEqual([]);
    });
  });

  describe('pagination', () => {
    it('should handle pagination correctly', async () => {
      mockPrepare.first.mockResolvedValue({ total: 25 });
      mockPrepare.all.mockResolvedValue({ results: mockSearchSessions });

      const result = await manager.getSearchHistory('user-1', 'conv-1', undefined, 10, 0);

      expect(result.total).toBe(25);
      expect(result.hasMore).toBe(true);
      expect(mockPrepare.bind).toHaveBeenCalledWith(
        expect.any(String), // userId
        expect.any(String), // conversationId
        10, // limit
        0   // offset
      );
    });

    it('should indicate no more results when at end', async () => {
      mockPrepare.first.mockResolvedValue({ total: 15 });
      mockPrepare.all.mockResolvedValue({ results: mockSearchSessions });

      const result = await manager.getSearchHistory('user-1', 'conv-1', undefined, 10, 10);

      expect(result.hasMore).toBe(false);
    });
  });

  describe('enhanced AI search features', () => {
    describe('search query storage with content source tracking', () => {
      it('should store search queries with detailed content source information', async () => {
        const mockSessionWithContentDetails = {
          ...mockSearchSessions[0],
          content_sources: '["ideas", "builder"]'
        };

        mockPrepare.first.mockResolvedValue({ total: 1 });
        mockPrepare.all.mockResolvedValue({ results: [mockSessionWithContentDetails] });

        const result = await manager.getSearchHistory('user-1', 'conv-1');

        expect(result.entries[0].contentSources).toEqual(['ideas', 'builder']);
        expect(result.entries[0].contentSourceDetails).toHaveLength(2);
        expect(result.entries[0].contentSourceDetails[0].source).toBe('ideas');
        expect(result.entries[0].contentSourceDetails[1].source).toBe('builder');
        expect(result.entries[0].contentSourceDetails[0].extractedKeywords).toEqual(['research', 'analysis', 'methodology', 'results', 'conclusion']);
      });

      it('should track search filters and query parameters', async () => {
        const mockSessionWithFilters = {
          ...mockSearchSessions[0],
          search_filters: '{"sortBy": "relevance", "dateRange": {"start": 2020, "end": 2024}, "minCitations": 10}'
        };

        mockPrepare.first.mockResolvedValue({ total: 1 });
        mockPrepare.all.mockResolvedValue({ results: [mockSessionWithFilters] });

        const result = await manager.getSearchHistory('user-1', 'conv-1');

        expect(result.entries[0].searchFilters).toEqual({
          sortBy: 'relevance',
          dateRange: { start: 2020, end: 2024 },
          minCitations: 10
        });
      });

      it('should handle complex content source combinations', async () => {
        const mockComplexSession = {
          ...mockSearchSessions[0],
          content_sources: '["ideas", "builder", "ideas"]' // Duplicate sources
        };

        mockPrepare.first.mockResolvedValue({ total: 1 });
        mockPrepare.all.mockResolvedValue({ results: [mockComplexSession] });

        const result = await manager.getSearchHistory('user-1', 'conv-1');

        expect(result.entries[0].contentSources).toEqual(['ideas', 'builder', 'ideas']);
        expect(result.entries[0].contentSourceDetails).toHaveLength(3);
      });
    });

    describe('search result success rate tracking', () => {
      it('should calculate and track success rates accurately', async () => {
        const mockTrackingData = [
          {
            search_date: '2024-01-15',
            total_searches: 10,
            successful_searches: 8,
            average_results: 7.5
          },
          {
            search_date: '2024-01-14',
            total_searches: 5,
            successful_searches: 3,
            average_results: 6.2
          }
        ];

        mockPrepare.all.mockResolvedValue({ results: mockTrackingData });

        const tracking = await manager.getSearchSuccessRateTracking('user-1', 'conv-1', 30);

        expect(tracking).toHaveLength(2);
        expect(tracking[0].successRate).toBe(0.8); // 8/10
        expect(tracking[1].successRate).toBe(0.6); // 3/5
        expect(tracking[0].averageResults).toBe(7.5);
        expect(tracking[1].averageResults).toBe(6.2);
      });

      it('should handle zero searches gracefully', async () => {
        const mockEmptyTrackingData = [
          {
            search_date: '2024-01-15',
            total_searches: 0,
            successful_searches: 0,
            average_results: 0
          }
        ];

        mockPrepare.all.mockResolvedValue({ results: mockEmptyTrackingData });

        const tracking = await manager.getSearchSuccessRateTracking('user-1', 'conv-1', 30);

        expect(tracking).toHaveLength(1);
        expect(tracking[0].successRate).toBe(0);
        expect(tracking[0].totalSearches).toBe(0);
      });

      it('should track success rates over different time periods', async () => {
        const mockPrepareInstance = {
          bind: vi.fn().mockReturnThis(),
          all: vi.fn()
        };

        mockEnv.DB.prepare.mockReturnValue(mockPrepareInstance);

        // Test 7 days
        mockPrepareInstance.all.mockResolvedValueOnce({ results: [] });
        await manager.getSearchSuccessRateTracking('user-1', 'conv-1', 7);
        
        // Test 30 days
        mockPrepareInstance.all.mockResolvedValueOnce({ results: [] });
        await manager.getSearchSuccessRateTracking('user-1', 'conv-1', 30);

        // Test 90 days
        mockPrepareInstance.all.mockResolvedValueOnce({ results: [] });
        await manager.getSearchSuccessRateTracking('user-1', 'conv-1', 90);

        expect(mockPrepareInstance.bind).toHaveBeenCalledTimes(3);
      });
    });

    describe('advanced analytics features', () => {
      it('should provide query performance analytics', async () => {
        const mockPerformanceData = [
          {
            search_query: 'machine learning research',
            search_count: 5,
            avg_results: 8.2,
            success_rate: 0.75,
            avg_processing_time: 2200,
            last_used: '2024-01-15T10:00:00Z'
          },
          {
            search_query: 'deep learning applications',
            search_count: 3,
            avg_results: 6.5,
            success_rate: 0.85,
            avg_processing_time: 1800,
            last_used: '2024-01-14T15:30:00Z'
          }
        ];

        const mockTopResults = [
          {
            result_title: 'Advanced ML Techniques',
            relevance_score: 0.92,
            added_to_library: true
          },
          {
            result_title: 'ML in Healthcare',
            relevance_score: 0.88,
            added_to_library: false
          }
        ];

        mockPrepare.all
          .mockResolvedValueOnce({ results: mockPerformanceData })
          .mockResolvedValueOnce({ results: mockTopResults })
          .mockResolvedValueOnce({ results: mockTopResults });

        const analytics = await manager.getQueryPerformanceAnalytics('user-1', 'conv-1', 30);

        expect(analytics).toHaveLength(2);
        expect(analytics[0].query).toBe('machine learning research');
        expect(analytics[0].searchCount).toBe(5);
        expect(analytics[0].averageResults).toBe(8.2);
        expect(analytics[0].successRate).toBe(0.75);
        expect(analytics[0].averageProcessingTime).toBe(2200);
        expect(analytics[0].topResults).toHaveLength(2);
        expect(analytics[0].lastUsed).toEqual(new Date('2024-01-15T10:00:00Z'));
      });

      it('should analyze content source effectiveness with trends', async () => {
        const mockEffectivenessData = [
          {
            content_sources: '["ideas"]',
            total_searches: 8,
            avg_results: 7.5,
            success_rate: 0.8,
            conversion_rate: 0.65
          },
          {
            content_sources: '["builder"]',
            total_searches: 5,
            avg_results: 6.2,
            success_rate: 0.7,
            conversion_rate: 0.55
          }
        ];

        const mockRelevanceData = [
          {
            content_sources: '["ideas"]',
            avg_relevance_score: 0.88
          },
          {
            content_sources: '["builder"]',
            avg_relevance_score: 0.82
          }
        ];

        const mockTrendData = [
          {
            content_sources: '["ideas"]',
            period: 'recent',
            search_count: 5
          },
          {
            content_sources: '["ideas"]',
            period: 'older',
            search_count: 3
          },
          {
            content_sources: '["builder"]',
            period: 'recent',
            search_count: 2
          },
          {
            content_sources: '["builder"]',
            period: 'older',
            search_count: 3
          }
        ];

        mockPrepare.all
          .mockResolvedValueOnce({ results: mockEffectivenessData })
          .mockResolvedValueOnce({ results: mockRelevanceData })
          .mockResolvedValueOnce({ results: mockTrendData });

        const effectiveness = await manager.getContentSourceEffectiveness('user-1', 'conv-1', 30);

        expect(effectiveness).toHaveLength(2);
        
        // Ideas source should be first (higher usage)
        expect(effectiveness[0].source).toBe('ideas');
        expect(effectiveness[0].totalSearches).toBe(8);
        expect(effectiveness[0].averageResults).toBe(7.5);
        expect(effectiveness[0].successRate).toBe(0.8);
        expect(effectiveness[0].conversionRate).toBe(0.65);
        expect(effectiveness[0].averageRelevanceScore).toBe(0.88);
        expect(effectiveness[0].recentTrend).toBe('up'); // 5/3 = 1.67 > 1.2

        // Builder source should be second
        expect(effectiveness[1].source).toBe('builder');
        expect(effectiveness[1].totalSearches).toBe(5);
        expect(effectiveness[1].recentTrend).toBe('down'); // 2/3 = 0.67 < 0.8
      });

      it('should provide comprehensive search session details', async () => {
        const mockSessionDetails = {
          ...mockSearchSessions[0],
          success_rate: 0.3
        };

        const mockSessionResults = [
          {
            id: 'result-1',
            result_title: 'Deep Learning for NLP',
            result_authors: '["Smith, J.", "Doe, A."]',
            result_journal: 'AI Journal',
            result_year: 2023,
            result_doi: '10.1234/ai.2023.001',
            result_url: 'https://example.com/paper1',
            relevance_score: 0.95,
            confidence_score: 0.88,
            quality_score: 0.92,
            citation_count: 150,
            user_action: 'added',
            added_to_library: true,
            created_at: '2024-01-15T10:01:00Z'
          }
        ];

        const mockSessionFeedback = {
          overall_satisfaction: 4,
          relevance_rating: 5,
          quality_rating: 4,
          ease_of_use_rating: 4,
          feedback_comments: 'Excellent results!',
          would_recommend: true,
          improvement_suggestions: 'More filtering options'
        };

        mockPrepare.first
          .mockResolvedValueOnce(mockSessionDetails)
          .mockResolvedValueOnce(mockSessionFeedback);
        
        mockPrepare.all.mockResolvedValue({ results: mockSessionResults });

        const details = await manager.getSearchSessionDetails('session-1');

        expect(details).not.toBeNull();
        expect(details!.session.id).toBe('session-1');
        expect(details!.session.searchQuery).toBe('machine learning research');
        expect(details!.session.successRate).toBe(0.3);
        expect(details!.results).toHaveLength(1);
        expect(details!.results[0].title).toBe('Deep Learning for NLP');
        expect(details!.results[0].authors).toEqual(['Smith, J.', 'Doe, A.']);
        expect(details!.results[0].addedToLibrary).toBe(true);
        expect(details!.feedback).toBeDefined();
        expect(details!.feedback!.overallSatisfaction).toBe(4);
        expect(details!.feedback!.feedbackComments).toBe('Excellent results!');
      });
    });

    describe('data management and export', () => {
      it('should update search session results correctly', async () => {
        mockPrepare.run.mockResolvedValue({ success: true });

        await manager.updateSearchSessionResults('session-1', 15, 5, 2, undefined);

        expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE search_sessions')
        );
        expect(mockPrepare.bind).toHaveBeenCalledWith(15, 5, 2, true, null, 'session-1');
      });

      it('should update search session with error message', async () => {
        mockPrepare.run.mockResolvedValue({ success: true });

        await manager.updateSearchSessionResults('session-1', 0, 0, 0, 'Search failed');

        expect(mockPrepare.bind).toHaveBeenCalledWith(0, 0, 0, false, 'Search failed', 'session-1');
      });

      it('should delete specific search history entries', async () => {
        mockPrepare.run.mockResolvedValue({ success: true });

        await manager.deleteSearchHistory('user-1', 'conv-1', ['session-1', 'session-2']);

        expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM search_feedback')
        );
        expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM search_results')
        );
        expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
          expect.stringContaining('DELETE FROM search_sessions')
        );
      });

      it('should export search history as JSON with comprehensive data', async () => {
        const mockExportSessions = [
          {
            ...mockSearchSessions[0],
            success_rate: 0.3
          }
        ];

        mockPrepare.first.mockResolvedValue({ total: 1 });
        mockPrepare.all.mockResolvedValue({ results: mockExportSessions });

        const exported = await manager.exportSearchHistory('user-1', 'conv-1', 'json');

        const data = JSON.parse(exported);
        expect(data.exportDate).toBeDefined();
        expect(data.userId).toBe('user-1');
        expect(data.conversationId).toBe('conv-1');
        expect(data.totalEntries).toBe(1);
        expect(data.entries).toHaveLength(1);
        expect(data.entries[0].searchQuery).toBe('machine learning research');
        expect(data.entries[0].contentSources).toEqual(['ideas', 'builder']);
        expect(data.entries[0].successRate).toBe(0.3);
        expect(data.entries[0].processingTimeMs).toBe(2500);
      });

      it('should export search history as CSV with proper formatting', async () => {
        const mockExportSessions = [
          {
            ...mockSearchSessions[0],
            success_rate: 0.3
          }
        ];

        mockPrepare.first.mockResolvedValue({ total: 1 });
        mockPrepare.all.mockResolvedValue({ results: mockExportSessions });

        const exported = await manager.exportSearchHistory('user-1', 'conv-1', 'csv');

        expect(exported).toContain('"ID","Date","Search Query"');
        expect(exported).toContain('session-1');
        expect(exported).toContain('machine learning research');
        expect(exported).toContain('ideas;builder');
        expect(exported).toContain('0.300'); // Success rate as decimal
        expect(exported).toContain('2500'); // Processing time
      });

      it('should handle large export datasets efficiently', async () => {
        // Create a large dataset
        const largeMockSessions = Array.from({ length: 500 }, (_, i) => ({
          ...mockSearchSessions[0],
          id: `session-${i}`,
          search_query: `query ${i}`,
          success_rate: Math.random()
        }));

        mockPrepare.first.mockResolvedValue({ total: 500 });
        mockPrepare.all.mockResolvedValue({ results: largeMockSessions });

        const exported = await manager.exportSearchHistory('user-1', 'conv-1', 'json');

        const data = JSON.parse(exported);
        expect(data.totalEntries).toBe(500);
        expect(data.entries).toHaveLength(500);
      });
    });

    describe('performance and error handling', () => {
      it('should handle database connection errors gracefully', async () => {
        mockPrepare.first.mockRejectedValue(new Error('Database connection timeout'));

        await expect(manager.getSearchHistory('user-1', 'conv-1')).rejects.toThrow('Database connection timeout');
      });

      it('should handle malformed JSON in content sources', async () => {
        const invalidSession = {
          ...mockSearchSessions[0],
          content_sources: 'invalid-json-string'
        };

        mockPrepare.first.mockResolvedValue({ total: 1 });
        mockPrepare.all.mockResolvedValue({ results: [invalidSession] });

        const result = await manager.getSearchHistory('user-1', 'conv-1');

        expect(result.entries[0].contentSources).toEqual([]);
        expect(result.entries[0].contentSourceDetails).toEqual([]);
      });

      it('should handle empty search filters gracefully', async () => {
        const sessionWithEmptyFilters = {
          ...mockSearchSessions[0],
          search_filters: ''
        };

        mockPrepare.first.mockResolvedValue({ total: 1 });
        mockPrepare.all.mockResolvedValue({ results: [sessionWithEmptyFilters] });

        const result = await manager.getSearchHistory('user-1', 'conv-1');

        expect(result.entries[0].searchFilters).toEqual({});
      });

      it('should validate input parameters', async () => {
        // Test missing userId
        await expect(manager.getSearchHistory('', 'conv-1')).rejects.toThrow();

        // Test invalid limit/offset
        mockPrepare.first.mockResolvedValue({ total: 0 });
        mockPrepare.all.mockResolvedValue({ results: [] });

        const result = await manager.getSearchHistory('user-1', 'conv-1', undefined, -1, -1);
        expect(result.entries).toEqual([]);
      });
    });
  });
});