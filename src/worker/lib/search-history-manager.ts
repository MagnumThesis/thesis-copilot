import { SearchHistoryItem, SearchAnalytics, safeDate } from '../../lib/ai-types';

/**
 * Search History Manager
 * Manages search history and analytics for the AI Searcher
 */

interface DatabaseRecord {
  id: string;
  userId: string;
  timestamp: Date;
  query: string;
  contentSources: string;
  resultsTotal: number;
  resultsAccepted: number;
  resultsRejected: number;
  sessionId: string;
}

export class SearchHistoryManager {
  private history: Map<string, SearchHistoryItem[]> = new Map();
  private analytics: Map<string, SearchAnalytics> = new Map();

  /**
   * Record a search operation
   */
  async recordSearch(searchData: Omit<SearchHistoryItem, 'id' | 'timestamp'>): Promise<void> {
    const searchItem: SearchHistoryItem = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...searchData
    };

    const userId = searchData.userId;
    if (!userId) {
      throw new Error('User ID is required for search recording');
    }

    if (!this.history.has(userId)) {
      this.history.set(userId, []);
    }

    this.history.get(userId)!.push(searchItem);

    // Update analytics
    await this.updateAnalytics(userId);

    console.log(`Search recorded for user ${userId}: ${searchItem.query}`);
  }

  /**
   * Get search history for a user
   */
  async getSearchHistory(userId: string, limit: number = 50): Promise<SearchHistoryItem[]> {
    const userHistory = this.history.get(userId) || [];
    return userHistory
      .sort((a, b) => {
        const aTime = safeDate(a.timestamp)?.getTime() ?? 0;
        const bTime = safeDate(b.timestamp)?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  /**
   * Get analytics for a user
   */
  async getAnalytics(userId: string): Promise<SearchAnalytics> {
    if (!this.analytics.has(userId)) {
      await this.updateAnalytics(userId);
    }

    return this.analytics.get(userId) || this.createEmptyAnalytics();
  }

  /**
   * Update analytics for a user
   */
  private async updateAnalytics(userId: string): Promise<void> {
    const userHistory = this.history.get(userId) || [];

    if (userHistory.length === 0) {
      this.analytics.set(userId, this.createEmptyAnalytics());
      return;
    }

    const totalSearches = userHistory.length;
    const successfulSearches = userHistory.filter(h => h.results.total > 0).length;
    const successRate = totalSearches > 0 ? successfulSearches / totalSearches : 0;

    // Calculate popular topics
    const topicCounts = new Map<string, number>();
    userHistory.forEach(search => {
      const topics = this.extractTopicsFromQuery(search.query);
      topics.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });

    const popularTopics = Array.from(topicCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic]) => topic);

    // Calculate average results
    const averageResults = userHistory.reduce((sum, h) => sum + h.results.total, 0) / totalSearches;

    // Calculate top sources
    const sourceCounts = new Map<string, number>();
    userHistory.forEach(search => {
      search.sources.forEach(source => {
        sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
      });
    });

    const topSources = Array.from(sourceCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([source]) => source as 'ideas' | 'builder');

    const analytics: SearchAnalytics = {
      total_searches: totalSearches,
      average_results: averageResults,
      popular_sources: topSources || [],
      search_frequency: {}, // Empty for now, could be populated with actual frequency data
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        end: new Date().toISOString()
      },
      successRate,
      popularTopics,
      averageResults,
      topSources
    };

    this.analytics.set(userId, analytics);
  }

  /**
   * Clear search history for a user
   */
  async clearHistory(userId: string): Promise<void> {
    this.history.delete(userId);
    this.analytics.delete(userId);
    console.log(`Search history cleared for user ${userId}`);
  }

  /**
   * Get search statistics
   */
  async getStatistics(userId: string): Promise<{
    totalSearches: number;
    searchesToday: number;
    searchesThisWeek: number;
    searchesThisMonth: number;
    averageResults: number;
    successRate: number;
  }> {
    const userHistory = this.history.get(userId) || [];
    const analytics = await this.getAnalytics(userId);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const searchesToday = userHistory.filter(h => h.timestamp >= today).length;
    const searchesThisWeek = userHistory.filter(h => h.timestamp >= weekAgo).length;
    const searchesThisMonth = userHistory.filter(h => h.timestamp >= monthAgo).length;

    return {
      totalSearches: userHistory.length,
      searchesToday,
      searchesThisWeek,
      searchesThisMonth,
      averageResults: analytics.averageResults,
      successRate: analytics.successRate
    };
  }

  /**
   * Get trending topics across all users
   */
  async getTrendingTopics(limit: number = 20): Promise<{ topic: string; count: number }[]> {
    const allTopics = new Map<string, number>();

    // Aggregate topics from all users
    for (const userHistory of this.history.values()) {
      userHistory.forEach(search => {
        const topics = this.extractTopicsFromQuery(search.query);
        topics.forEach(topic => {
          allTopics.set(topic, (allTopics.get(topic) || 0) + 1);
        });
      });
    }

    return Array.from(allTopics.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([topic, count]) => ({ topic, count }));
  }

  /**
   * Search history by query
   */
  async searchHistory(userId: string, searchQuery: string): Promise<SearchHistoryItem[]> {
    const userHistory = this.history.get(userId) || [];

    if (!searchQuery.trim()) {
      return userHistory;
    }

    const searchTerm = searchQuery.toLowerCase();
    return userHistory.filter(item =>
      item.query.toLowerCase().includes(searchTerm) ||
      item.sources.some(source => source.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get recent searches for a user
   */
  async getRecentSearches(userId: string, hours: number = 24): Promise<SearchHistoryItem[]> {
    const userHistory = this.history.get(userId) || [];
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    return userHistory
      .filter(item => item.timestamp >= cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Export search history for a user
   */
  async exportHistory(userId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    const userHistory = this.history.get(userId) || [];

    if (format === 'json') {
      return JSON.stringify(userHistory, null, 2);
    } else {
      // CSV format
      const headers = ['id', 'timestamp', 'query', 'sources', 'total_results', 'accepted', 'rejected'];
      const rows = userHistory.map(item => [
        item.id,
        item.timestamp.toISOString(),
        `"${item.query.replace(/"/g, '""')}"`,
        item.sources.join(';'),
        item.results.total,
        item.results.accepted,
        item.results.rejected
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  /**
   * Extract topics from search query
   */
  private extractTopicsFromQuery(query: string): string[] {
    // Simple topic extraction - split by AND/OR operators and clean terms
    const terms = query
      .split(/\s+(?:AND|OR)\s+/i)
      .map(term => term.replace(/[()"]/g, '').trim())
      .filter(term => term.length > 2);

    // Remove duplicates and common academic terms
    const commonTerms = new Set(['research', 'study', 'analysis', 'method', 'system', 'model']);
    return [...new Set(terms)].filter(term => !commonTerms.has(term.toLowerCase()));
  }

  /**
   * Create empty analytics object
   */
  private createEmptyAnalytics(): SearchAnalytics {
    return {
      total_searches: 0,
      average_results: 0,
      popular_sources: [],
      search_frequency: {},
      period: {
        start: new Date().toISOString(),
        end: new Date().toISOString()
      },
      successRate: 0,
      popularTopics: [],
      averageResults: 0,
      topSources: []
    };
  }

  /**
   * Convert to database record
   */
  private toDatabaseRecord(item: SearchHistoryItem): DatabaseRecord {
    const timestamp = safeDate(item.timestamp) || new Date();
    const userId = item.userId || 'unknown';
    const results = item.results || { total: 0, accepted: 0, rejected: 0 };

    return {
      id: item.id,
      userId,
      timestamp,
      query: item.query,
      contentSources: JSON.stringify(item.sources),
      resultsTotal: results.total,
      resultsAccepted: results.accepted,
      resultsRejected: results.rejected,
      sessionId: `session_${Date.now()}`
    };
  }

  /**
   * Convert from database record
   */
  private fromDatabaseRecord(record: DatabaseRecord): SearchHistoryItem {
    return {
      id: record.id,
      userId: record.userId,
      timestamp: record.timestamp,
      query: record.query,
      results_count: record.resultsTotal,
      sources: JSON.parse(record.contentSources),
      results: {
        total: record.resultsTotal,
        accepted: record.resultsAccepted,
        rejected: record.resultsRejected
      }
    };
  }

  /**
   * Get user activity summary
   */
  async getActivitySummary(userId: string): Promise<{
    totalSearches: number;
    lastSearchDate: Date | null;
    mostActiveDay: string | null;
    favoriteSource: 'ideas' | 'builder' | null;
  }> {
    const userHistory = this.history.get(userId) || [];

    if (userHistory.length === 0) {
      return {
        totalSearches: 0,
        lastSearchDate: null,
        mostActiveDay: null,
        favoriteSource: null
      };
    }

    const lastSearchDate = userHistory
      .sort((a, b) => {
        const aTime = safeDate(a.timestamp)?.getTime() ?? 0;
        const bTime = safeDate(b.timestamp)?.getTime() ?? 0;
        return bTime - aTime;
      })[0].timestamp;

    // Calculate most active day of week
    const dayCounts = new Map<string, number>();
    userHistory.forEach(search => {
      const date = safeDate(search.timestamp);
      if (date) {
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
      }
    });

    const mostActiveDay = Array.from(dayCounts.entries())
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    // Calculate favorite source
    const sourceCounts = new Map<string, number>();
    userHistory.forEach(search => {
      search.sources.forEach(source => {
        sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
      });
    });

    const favoriteSource = Array.from(sourceCounts.entries())
      .sort(([, a], [, b]) => b - a)[0]?.[0] as 'ideas' | 'builder' || null;

    return {
      totalSearches: userHistory.length,
      lastSearchDate: safeDate(lastSearchDate),
      mostActiveDay,
      favoriteSource
    };
  }
}
