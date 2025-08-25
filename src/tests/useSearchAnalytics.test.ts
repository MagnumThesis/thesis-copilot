import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearchAnalytics, useSearchResultTracking, useSearchHistory } from '../hooks/useSearchAnalytics';

// Mock fetch globally
global.fetch = vi.fn();

const mockAnalyticsData = {
  totalSearches: 25,
  successfulSearches: 20,
  averageResultsPerSearch: 7.5,
  averageSuccessRate: 0.8,
  averageProcessingTime: 2200,
  mostUsedContentSources: [
    { source: 'ideas' as const, count: 15, percentage: 60 },
    { source: 'builder' as const, count: 10, percentage: 40 }
  ],
  topSearchQueries: [
    {
      query: 'machine learning research',
      count: 5,
      averageResults: 8.2,
      successRate: 0.85
    }
  ],
  searchTrends: [
    {
      date: '2024-01-15',
      searchCount: 8,
      successRate: 0.85,
      averageResults: 7.8
    }
  ]
};

const mockContentUsage = [
  {
    source: 'ideas' as const,
    totalUsage: 15,
    successfulSearches: 12,
    averageResults: 7.8,
    topKeywords: ['research', 'analysis', 'methodology'],
    recentUsage: [
      { date: '2024-01-15', count: 5 }
    ]
  }
];

const mockSuccessTracking = [
  {
    date: '2024-01-15',
    totalSearches: 8,
    successfulSearches: 7,
    successRate: 0.875,
    averageResults: 7.8
  }
];

const mockHistoryEntries = [
  {
    id: 'session-1',
    conversationId: 'conv-1',
    userId: 'user-1',
    searchQuery: 'machine learning research',
    contentSources: ['ideas', 'builder'],
    contentSourceDetails: [],
    searchFilters: {},
    resultsCount: 10,
    resultsAccepted: 3,
    resultsRejected: 1,
    searchSuccess: true,
    successRate: 0.3,
    processingTimeMs: 2500,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  }
];

describe('useSearchAnalytics', () => {
  const conversationId = 'conv-1';
  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
    
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/history/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            stats: mockAnalyticsData
          })
        });
      }
      
      if (url.includes('/history/content-usage')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            usage: mockContentUsage
          })
        });
      }
      
      if (url.includes('/analytics/success-tracking')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            tracking: mockSuccessTracking
          })
        });
      }
      
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization and data fetching', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useSearchAnalytics(conversationId, userId));
      
      expect(result.current.analytics).toBeNull();
      expect(result.current.contentUsage).toEqual([]);
      expect(result.current.successTracking).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should fetch analytics data on mount', async () => {
      const { result } = renderHook(() => useSearchAnalytics(conversationId, userId));
      
      act(() => {
        result.current.fetchAnalytics(30);
      });
      
      expect(result.current.loading).toBe(true);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.analytics).toEqual(mockAnalyticsData);
        expect(result.current.contentUsage).toEqual(mockContentUsage);
        expect(result.current.successTracking).toEqual(mockSuccessTracking);
      });
    });

    it('should call correct API endpoints with proper parameters', async () => {
      const { result } = renderHook(() => useSearchAnalytics(conversationId, userId));
      
      await act(async () => {
        await result.current.fetchAnalytics(30);
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/ai-searcher/history/stats?conversationId=${conversationId}&days=30`)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/ai-searcher/history/content-usage?conversationId=${conversationId}&days=30`)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai-searcher/analytics/success-tracking',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            conversationId,
            days: 30
          })
        })
      );
    });

    it('should handle different time periods', async () => {
      const { result } = renderHook(() => useSearchAnalytics(conversationId, userId));
      
      await act(async () => {
        await result.current.fetchAnalytics(7);
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('days=7')
      );
      
      await act(async () => {
        await result.current.fetchAnalytics(90);
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('days=90')
      );
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: false,
            error: 'Database connection failed'
          })
        })
      );
      
      const { result } = renderHook(() => useSearchAnalytics(conversationId, userId));
      
      await act(async () => {
        await result.current.fetchAnalytics(30);
      });
      
      expect(result.current.error).toBe('Database connection failed');
      expect(result.current.analytics).toBeNull();
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockImplementation(() => 
        Promise.reject(new Error('Network error'))
      );
      
      const { result } = renderHook(() => useSearchAnalytics(conversationId, userId));
      
      await act(async () => {
        await result.current.fetchAnalytics(30);
      });
      
      expect(result.current.error).toBe('Network error');
    });

    it('should handle partial API failures', async () => {
      let callCount = 0;
      (global.fetch as any).mockImplementation((url: string) => {
        callCount++;
        if (callCount === 1) {
          // First call (stats) succeeds
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              stats: mockAnalyticsData
            })
          });
        } else {
          // Subsequent calls fail
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: false,
              error: 'Partial failure'
            })
          });
        }
      });
      
      const { result } = renderHook(() => useSearchAnalytics(conversationId, userId));
      
      await act(async () => {
        await result.current.fetchAnalytics(30);
      });
      
      // Should have analytics data but empty arrays for failed calls
      expect(result.current.analytics).toEqual(mockAnalyticsData);
      expect(result.current.contentUsage).toEqual([]);
      expect(result.current.successTracking).toEqual([]);
    });
  });

  describe('refresh functionality', () => {
    it('should refresh analytics data', async () => {
      const { result } = renderHook(() => useSearchAnalytics(conversationId, userId));
      
      // Initial fetch
      await act(async () => {
        await result.current.fetchAnalytics(30);
      });
      
      expect(global.fetch).toHaveBeenCalledTimes(3);
      
      // Refresh
      await act(async () => {
        await result.current.refreshAnalytics(30);
      });
      
      expect(global.fetch).toHaveBeenCalledTimes(6); // 3 more calls
    });
  });
});

describe('useSearchResultTracking', () => {
  const sessionId = 'session-1';

  beforeEach(() => {
    vi.clearAllMocks();
    
    (global.fetch as any).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('tracking functionality', () => {
    it('should track reference views', async () => {
      const { result } = renderHook(() => useSearchResultTracking(sessionId));
      
      await act(async () => {
        await result.current.trackReferenceViewed('Test Paper Title');
      });
      
      expect(result.current.tracking).toHaveLength(1);
      expect(result.current.tracking[0].action).toBe('viewed');
      expect(result.current.tracking[0].sessionId).toBe(sessionId);
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai-searcher/track-result-action',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"action":"viewed"')
        })
      );
    });

    it('should track reference additions', async () => {
      const { result } = renderHook(() => useSearchResultTracking(sessionId));
      
      await act(async () => {
        await result.current.trackReferenceAdded('Test Paper', 'ref-1', 'result-1');
      });
      
      expect(result.current.tracking).toHaveLength(1);
      expect(result.current.tracking[0].action).toBe('added');
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai-searcher/track-result-action',
        expect.objectContaining({
          body: expect.stringContaining('"referenceId":"ref-1"')
        })
      );
    });

    it('should track reference rejections with feedback', async () => {
      const { result } = renderHook(() => useSearchResultTracking(sessionId));
      
      await act(async () => {
        await result.current.trackReferenceRejected('Test Paper', 'result-1', {
          comments: 'Not relevant'
        });
      });
      
      expect(result.current.tracking).toHaveLength(1);
      expect(result.current.tracking[0].action).toBe('rejected');
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai-searcher/track-result-action',
        expect.objectContaining({
          body: expect.stringContaining('"comments":"Not relevant"')
        })
      );
    });

    it('should track reference bookmarks', async () => {
      const { result } = renderHook(() => useSearchResultTracking(sessionId));
      
      await act(async () => {
        await result.current.trackReferenceBookmarked('Test Paper', 'result-1');
      });
      
      expect(result.current.tracking).toHaveLength(1);
      expect(result.current.tracking[0].action).toBe('bookmarked');
    });
  });

  describe('tracking statistics', () => {
    it('should calculate tracking statistics correctly', async () => {
      const { result } = renderHook(() => useSearchResultTracking(sessionId));
      
      // Add multiple tracking entries
      await act(async () => {
        await result.current.trackReferenceViewed('Paper 1');
        await result.current.trackReferenceViewed('Paper 2');
        await result.current.trackReferenceAdded('Paper 1', 'ref-1', 'result-1');
        await result.current.trackReferenceRejected('Paper 2', 'result-2');
        await result.current.trackReferenceBookmarked('Paper 3', 'result-3');
      });
      
      const stats = result.current.getTrackingStats();
      
      expect(stats.totalViews).toBe(2);
      expect(stats.totalAdded).toBe(1);
      expect(stats.totalRejected).toBe(1);
      expect(stats.totalBookmarked).toBe(1);
      expect(stats.conversionRate).toBe(0.25); // 1 added out of 4 total interactions
    });

    it('should handle empty tracking data', () => {
      const { result } = renderHook(() => useSearchResultTracking(sessionId));
      
      const stats = result.current.getTrackingStats();
      
      expect(stats.totalViews).toBe(0);
      expect(stats.totalAdded).toBe(0);
      expect(stats.totalRejected).toBe(0);
      expect(stats.totalBookmarked).toBe(0);
      expect(stats.conversionRate).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle API errors for tracking', async () => {
      (global.fetch as any).mockImplementation(() => 
        Promise.reject(new Error('API Error'))
      );
      
      const { result } = renderHook(() => useSearchResultTracking(sessionId));
      
      // Should not throw error for views/rejections/bookmarks
      await act(async () => {
        await result.current.trackReferenceViewed('Test Paper');
      });
      
      expect(result.current.tracking).toHaveLength(1);
      
      // Should throw error for additions (as specified in implementation)
      await expect(act(async () => {
        await result.current.trackReferenceAdded('Test Paper', 'ref-1', 'result-1');
      })).rejects.toThrow('API Error');
    });
  });
});

describe('useSearchHistory', () => {
  const conversationId = 'conv-1';
  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
    
    (global.fetch as any).mockImplementation((url: string, options?: any) => {
      if (options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      
      if (url.includes('/history/export')) {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['test data'], { type: 'text/csv' }))
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          entries: mockHistoryEntries,
          total: 1,
          hasMore: false
        })
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('history fetching', () => {
    it('should fetch search history with default parameters', async () => {
      const { result } = renderHook(() => useSearchHistory(conversationId, userId));
      
      await act(async () => {
        await result.current.fetchHistory();
      });
      
      expect(result.current.entries).toHaveLength(1);
      expect(result.current.total).toBe(1);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.entries[0].searchQuery).toBe('machine learning research');
    });

    it('should apply filters correctly', async () => {
      const { result } = renderHook(() => useSearchHistory(conversationId, userId));
      
      const filter = {
        searchQuery: 'machine learning',
        successOnly: true,
        contentSources: ['ideas']
      };
      
      await act(async () => {
        await result.current.fetchHistory(filter, 20, 0, true);
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('searchQuery=machine%20learning')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('successOnly=true')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('contentSources=ideas')
      );
    });

    it('should handle pagination correctly', async () => {
      const { result } = renderHook(() => useSearchHistory(conversationId, userId));
      
      await act(async () => {
        await result.current.fetchHistory(undefined, 10, 20, false);
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10&offset=20')
      );
    });

    it('should reset entries when specified', async () => {
      const { result } = renderHook(() => useSearchHistory(conversationId, userId));
      
      // Initial fetch
      await act(async () => {
        await result.current.fetchHistory(undefined, 50, 0, false);
      });
      
      expect(result.current.entries).toHaveLength(1);
      
      // Reset fetch
      await act(async () => {
        await result.current.fetchHistory(undefined, 50, 0, true);
      });
      
      expect(result.current.entries).toHaveLength(1); // Should replace, not append
    });
  });

  describe('entry deletion', () => {
    it('should delete selected entries', async () => {
      const { result } = renderHook(() => useSearchHistory(conversationId, userId));
      
      // First fetch some entries
      await act(async () => {
        await result.current.fetchHistory();
      });
      
      expect(result.current.entries).toHaveLength(1);
      
      // Delete entries
      await act(async () => {
        await result.current.deleteEntries(['session-1']);
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai-searcher/history',
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({
            conversationId,
            entryIds: ['session-1']
          })
        })
      );
      
      expect(result.current.entries).toHaveLength(0);
      expect(result.current.total).toBe(0);
    });

    it('should handle deletion errors', async () => {
      (global.fetch as any).mockImplementation((url: string, options?: any) => {
        if (options?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: false,
              error: 'Deletion failed'
            })
          });
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            entries: mockHistoryEntries,
            total: 1,
            hasMore: false
          })
        });
      });
      
      const { result } = renderHook(() => useSearchHistory(conversationId, userId));
      
      await act(async () => {
        await result.current.fetchHistory();
      });
      
      await expect(act(async () => {
        await result.current.deleteEntries(['session-1']);
      })).rejects.toThrow('Deletion failed');
    });
  });

  describe('history export', () => {
    it('should export history as CSV', async () => {
      // Mock DOM methods
      const mockCreateElement = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      const mockClick = vi.fn();
      const mockCreateObjectURL = vi.fn(() => 'blob:url');
      const mockRevokeObjectURL = vi.fn();
      
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick
      };
      
      mockCreateElement.mockReturnValue(mockAnchor);
      
      Object.defineProperty(document, 'createElement', {
        value: mockCreateElement,
        writable: true
      });
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        writable: true
      });
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        writable: true
      });
      Object.defineProperty(window.URL, 'createObjectURL', {
        value: mockCreateObjectURL,
        writable: true
      });
      Object.defineProperty(window.URL, 'revokeObjectURL', {
        value: mockRevokeObjectURL,
        writable: true
      });
      
      const { result } = renderHook(() => useSearchHistory(conversationId, userId));
      
      await act(async () => {
        await result.current.exportHistory('csv');
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/history/export?conversationId=conv-1&format=csv')
      );
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(mockAnchor.download).toContain('.csv');
    });

    it('should export history as JSON', async () => {
      const { result } = renderHook(() => useSearchHistory(conversationId, userId));
      
      await act(async () => {
        await result.current.exportHistory('json');
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('format=json')
      );
    });

    it('should handle export errors', async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/export')) {
          return Promise.resolve({
            ok: false,
            status: 500
          });
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            entries: [],
            total: 0,
            hasMore: false
          })
        });
      });
      
      const { result } = renderHook(() => useSearchHistory(conversationId, userId));
      
      await expect(act(async () => {
        await result.current.exportHistory('csv');
      })).rejects.toThrow('Export failed');
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: false,
            error: 'Database error'
          })
        })
      );
      
      const { result } = renderHook(() => useSearchHistory(conversationId, userId));
      
      await act(async () => {
        await result.current.fetchHistory();
      });
      
      expect(result.current.error).toBe('Database error');
      expect(result.current.entries).toEqual([]);
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockImplementation(() => 
        Promise.reject(new Error('Network error'))
      );
      
      const { result } = renderHook(() => useSearchHistory(conversationId, userId));
      
      await act(async () => {
        await result.current.fetchHistory();
      });
      
      expect(result.current.error).toBe('Network error');
    });
  });
});