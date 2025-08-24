import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing search analytics and tracking
 */

export interface SearchAnalyticsData {
  totalSearches: number;
  successfulSearches: number;
  averageResultsPerSearch: number;
  averageSuccessRate: number;
  averageProcessingTime: number;
  mostUsedContentSources: Array<{
    source: 'ideas' | 'builder';
    count: number;
    percentage: number;
  }>;
  topSearchQueries: Array<{
    query: string;
    count: number;
    averageResults: number;
    successRate: number;
  }>;
  searchTrends: Array<{
    date: string;
    searchCount: number;
    successRate: number;
    averageResults: number;
  }>;
}

export interface ContentSourceUsage {
  source: 'ideas' | 'builder';
  totalUsage: number;
  successfulSearches: number;
  averageResults: number;
  topKeywords: string[];
  recentUsage: Array<{
    date: string;
    count: number;
  }>;
}

export interface SuccessRateTracking {
  date: string;
  totalSearches: number;
  successfulSearches: number;
  successRate: number;
  averageResults: number;
}

export interface SearchResultTracking {
  sessionId: string;
  resultId: string;
  action: 'viewed' | 'added' | 'rejected' | 'bookmarked' | 'ignored';
  timestamp: Date;
}

/**
 * @function useSearchAnalytics
 * @description Hook for managing search analytics and tracking.
 * @param {string} conversationId - The ID of the current conversation.
 * @param {string} userId - The ID of the current user.
 * @returns {{analytics: SearchAnalyticsData | null, contentUsage: ContentSourceUsage[], successTracking: SuccessRateTracking[], loading: boolean, error: string | null, fetchAnalytics: (days?: number) => Promise<void>, refreshAnalytics: (days?: number) => Promise<void>}}
 * - `analytics`: The main search analytics data.
 * - `contentUsage`: Data on how different content sources are used.
 * - `successTracking`: Data on search success rates over time.
 * - `loading`: A boolean indicating if analytics data is currently being loaded.
 * - `error`: Any error message from the last analytics fetch operation.
 * - `fetchAnalytics`: Function to fetch analytics data for a specified number of days.
 * - `refreshAnalytics`: Function to refresh the analytics data.
 */
export const useSearchAnalytics = (conversationId: string, userId: string) => {
  const [analytics, setAnalytics] = useState<SearchAnalyticsData | null>(null);
  const [contentUsage, setContentUsage] = useState<ContentSourceUsage[]>([]);
  const [successTracking, setSuccessTracking] = useState<SuccessRateTracking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (days: number = 30) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch search history statistics
      const statsResponse = await fetch(
        `/api/ai-searcher/history/stats?conversationId=${conversationId}&days=${days}`
      );
      const statsData = await statsResponse.json();

      if (!statsData.success) {
        throw new Error(statsData.error || 'Failed to fetch statistics');
      }

      setAnalytics(statsData.stats);

      // Fetch content source usage
      const usageResponse = await fetch(
        `/api/ai-searcher/history/content-usage?conversationId=${conversationId}&days=${days}`
      );
      const usageData = await usageResponse.json();

      if (usageData.success) {
        setContentUsage(usageData.usage || []);
      }

      // Fetch success rate tracking
      const trackingResponse = await fetch(
        `/api/ai-searcher/analytics/success-tracking`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            conversationId,
            days
          })
        }
      );
      const trackingData = await trackingResponse.json();

      if (trackingData.success) {
        setSuccessTracking(trackingData.tracking || []);
      }

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId]);

  const refreshAnalytics = useCallback((days: number = 30) => {
    return fetchAnalytics(days);
  }, [fetchAnalytics]);

  return {
    analytics,
    contentUsage,
    successTracking,
    loading,
    error,
    fetchAnalytics,
    refreshAnalytics
  };
};

/**
 * Hook for tracking search result interactions
 */
/**
 * @function useSearchResultTracking
 * @description Hook for tracking search result interactions.
 * @param {string} sessionId - The ID of the current search session.
 * @returns {{tracking: SearchResultTracking[], trackReferenceViewed: (resultTitle: string) => Promise<void>, trackReferenceAdded: (resultTitle: string, referenceId: string, resultId: string) => Promise<void>, trackReferenceRejected: (resultTitle: string, resultId: string, feedback?: {comments?: string}) => Promise<void>, trackReferenceBookmarked: (resultTitle: string, resultId: string) => Promise<void>, getTrackingStats: () => {totalViews: number, totalAdded: number, totalRejected: number, totalBookmarked: number, conversionRate: number}}}
 * - `tracking`: An array of tracked search result interactions.
 * - `trackReferenceViewed`: Function to track when a search result is viewed.
 * - `trackReferenceAdded`: Function to track when a search result is added (e.g., to a bibliography).
 * - `trackReferenceRejected`: Function to track when a search result is rejected.
 * - `trackReferenceBookmarked`: Function to track when a search result is bookmarked.
 * - `getTrackingStats`: Function to get statistics about tracked interactions.
 */
export const useSearchResultTracking = (sessionId: string) => {
  const [tracking, setTracking] = useState<SearchResultTracking[]>([]);

  const trackReferenceViewed = useCallback(async (resultTitle: string) => {
    try {
      const trackingEntry: SearchResultTracking = {
        sessionId,
        resultId: `${resultTitle}-${Date.now()}`,
        action: 'viewed',
        timestamp: new Date()
      };

      setTracking(prev => [...prev, trackingEntry]);

      // Optional: Send to analytics API
      await fetch('/api/ai-searcher/track-result-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          resultTitle,
          action: 'viewed',
          timestamp: trackingEntry.timestamp.toISOString()
        })
      });

    } catch (error) {
      console.error('Error tracking reference view:', error);
    }
  }, [sessionId]);

  const trackReferenceAdded = useCallback(async (
    resultTitle: string,
    referenceId: string,
    resultId: string
  ) => {
    try {
      const trackingEntry: SearchResultTracking = {
        sessionId,
        resultId,
        action: 'added',
        timestamp: new Date()
      };

      setTracking(prev => [...prev, trackingEntry]);

      // Send to analytics API
      await fetch('/api/ai-searcher/track-result-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          resultId,
          resultTitle,
          referenceId,
          action: 'added',
          timestamp: trackingEntry.timestamp.toISOString()
        })
      });

    } catch (error) {
      console.error('Error tracking reference addition:', error);
      throw error; // Re-throw to handle in UI
    }
  }, [sessionId]);

  const trackReferenceRejected = useCallback(async (
    resultTitle: string,
    resultId: string,
    feedback?: { comments?: string }
  ) => {
    try {
      const trackingEntry: SearchResultTracking = {
        sessionId,
        resultId,
        action: 'rejected',
        timestamp: new Date()
      };

      setTracking(prev => [...prev, trackingEntry]);

      // Send to analytics API
      await fetch('/api/ai-searcher/track-result-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          resultId,
          resultTitle,
          action: 'rejected',
          feedback,
          timestamp: trackingEntry.timestamp.toISOString()
        })
      });

    } catch (error) {
      console.error('Error tracking reference rejection:', error);
    }
  }, [sessionId]);

  const trackReferenceBookmarked = useCallback(async (
    resultTitle: string,
    resultId: string
  ) => {
    try {
      const trackingEntry: SearchResultTracking = {
        sessionId,
        resultId,
        action: 'bookmarked',
        timestamp: new Date()
      };

      setTracking(prev => [...prev, trackingEntry]);

      // Send to analytics API
      await fetch('/api/ai-searcher/track-result-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          resultId,
          resultTitle,
          action: 'bookmarked',
          timestamp: trackingEntry.timestamp.toISOString()
        })
      });

    } catch (error) {
      console.error('Error tracking reference bookmark:', error);
    }
  }, [sessionId]);

  const getTrackingStats = useCallback(() => {
    const stats = {
      totalViews: tracking.filter(t => t.action === 'viewed').length,
      totalAdded: tracking.filter(t => t.action === 'added').length,
      totalRejected: tracking.filter(t => t.action === 'rejected').length,
      totalBookmarked: tracking.filter(t => t.action === 'bookmarked').length,
      conversionRate: 0
    };

    const totalInteractions = stats.totalViews + stats.totalAdded + stats.totalRejected;
    if (totalInteractions > 0) {
      stats.conversionRate = stats.totalAdded / totalInteractions;
    }

    return stats;
  }, [tracking]);

  return {
    tracking,
    trackReferenceViewed,
    trackReferenceAdded,
    trackReferenceRejected,
    trackReferenceBookmarked,
    getTrackingStats
  };
};

/**
 * Hook for managing search history with enhanced filtering
 */
/**
 * @function useSearchHistory
 * @description Hook for managing search history with enhanced filtering.
 * @param {string} conversationId - The ID of the current conversation.
 * @param {string} userId - The ID of the current user.
 * @returns {{entries: any[], total: number, hasMore: boolean, loading: boolean, error: string | null, fetchHistory: (filter?: any, limit?: number, offset?: number, resetEntries?: boolean) => Promise<void>, deleteEntries: (entryIds: string[]) => Promise<void>, exportHistory: (format?: 'json' | 'csv') => Promise<void>}}
 * - `entries`: The list of search history entries.
 * - `total`: The total number of search history entries.
 * - `hasMore`: A boolean indicating if there are more entries to load.
 * - `loading`: A boolean indicating if search history is currently being loaded.
 * - `error`: Any error message from the last search history operation.
 * - `fetchHistory`: Function to fetch search history entries with optional filters, limit, and offset.
 * - `deleteEntries`: Function to delete specific search history entries.
 * - `exportHistory`: Function to export search history in a specified format.
 */
export const useSearchHistory = (conversationId: string, userId: string) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (
    filter?: any,
    limit: number = 50,
    offset: number = 0,
    resetEntries: boolean = false
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        conversationId,
        limit: limit.toString(),
        offset: offset.toString()
      });

      // Add filter parameters
      if (filter?.searchQuery) {
        params.append('searchQuery', filter.searchQuery);
      }
      if (filter?.successOnly) {
        params.append('successOnly', 'true');
      }
      if (filter?.minResultsCount) {
        params.append('minResultsCount', filter.minResultsCount.toString());
      }
      if (filter?.contentSources && filter.contentSources.length > 0) {
        params.append('contentSources', filter.contentSources.join(','));
      }
      if (filter?.dateRange) {
        params.append('startDate', filter.dateRange.start.toISOString());
        params.append('endDate', filter.dateRange.end.toISOString());
      }

      const response = await fetch(`/api/ai-searcher/history?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch search history');
      }

      const newEntries = data.entries.map((entry: any) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      }));

      if (resetEntries) {
        setEntries(newEntries);
      } else {
        setEntries(prev => [...prev, ...newEntries]);
      }

      setTotal(data.total);
      setHasMore(data.hasMore);

    } catch (err) {
      console.error('Error fetching search history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load search history');
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId]);

  const deleteEntries = useCallback(async (entryIds: string[]) => {
    try {
      const response = await fetch('/api/ai-searcher/history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          entryIds
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete entries');
      }

      // Remove deleted entries from state
      setEntries(prev => prev.filter(entry => !entryIds.includes(entry.id)));
      setTotal(prev => prev - entryIds.length);

    } catch (err) {
      console.error('Error deleting entries:', err);
      throw err;
    }
  }, [conversationId]);

  const exportHistory = useCallback(async (format: 'json' | 'csv' = 'csv') => {
    try {
      const response = await fetch(
        `/api/ai-searcher/history/export?conversationId=${conversationId}&format=${format}`
      );
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-history-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting history:', err);
      throw err;
    }
  }, [conversationId]);

  return {
    entries,
    total,
    hasMore,
    loading,
    error,
    fetchHistory,
    deleteEntries,
    exportHistory
  };
};