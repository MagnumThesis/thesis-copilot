import { SearchAnalyticsManager, SearchSession, SearchResult, SearchFeedback } from './search-analytics-manager';

/**
 * Enhanced Search History Manager
 * Extends the existing search analytics manager with AI search specific features
 * for comprehensive search history management and analytics
 */

export interface SearchHistoryEntry {
  id: string;
  conversationId: string;
  userId: string;
  searchQuery: string;
  contentSources: ('ideas' | 'builder')[];
  contentSourceDetails: Array<{
    source: 'ideas' | 'builder';
    id: string;
    title: string;
    extractedKeywords: string[];
  }>;
  searchFilters: Record<string, any>;
  resultsCount: number;
  resultsAccepted: number;
  resultsRejected: number;
  searchSuccess: boolean;
  successRate: number; // resultsAccepted / resultsCount
  processingTimeMs: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchHistoryFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  contentSources?: ('ideas' | 'builder')[];
  successOnly?: boolean;
  minResultsCount?: number;
  searchQuery?: string;
}

export interface SearchHistoryStats {
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

export class EnhancedSearchHistoryManager extends SearchAnalyticsManager {
  constructor(env: any) {
    super(env);
  }

  /**
   * Get search success rate tracking over time
   */
  async getSearchSuccessRateTracking(
    userId: string,
    conversationId?: string,
    days: number = 30
  ): Promise<Array<{
    date: string;
    totalSearches: number;
    successfulSearches: number;
    successRate: number;
    averageResults: number;
  }>> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      let whereClause = 'WHERE ss.user_id = ? AND ss.created_at >= ?';
      const params = [userId, cutoffDate.toISOString()];

      if (conversationId) {
        whereClause += ' AND ss.conversation_id = ?';
        params.push(conversationId);
      }

      const query = `
        SELECT 
          DATE(ss.created_at) as search_date,
          COUNT(*) as total_searches,
          COUNT(CASE WHEN ss.search_success = true THEN 1 END) as successful_searches,
          AVG(ss.results_count) as average_results
        FROM search_sessions ss
        ${whereClause}
        GROUP BY DATE(ss.created_at)
        ORDER BY search_date DESC
        LIMIT 30
      `;

      const result = await this.env.DB.prepare(query).bind(...params).all();
      
      return (result.results || []).map((row: any) => ({
        date: row.search_date,
        totalSearches: row.total_searches,
        successfulSearches: row.successful_searches,
        successRate: row.total_searches > 0 ? row.successful_searches / row.total_searches : 0,
        averageResults: row.average_results || 0
      }));
    } catch (error) {
      console.error('Error getting search success rate tracking:', error);
      throw error;
    }
  }

  /**
   * Get detailed search session information
   */
  async getSearchSessionDetails(sessionId: string): Promise<{
    session: SearchHistoryEntry;
    results: Array<{
      id: string;
      title: string;
      authors: string[];
      journal?: string;
      year?: number;
      doi?: string;
      url?: string;
      relevanceScore: number;
      confidenceScore: number;
      qualityScore: number;
      citationCount: number;
      userAction?: string;
      addedToLibrary: boolean;
      createdAt: Date;
    }>;
    feedback?: {
      overallSatisfaction: number;
      relevanceRating: number;
      qualityRating: number;
      easeOfUseRating: number;
      feedbackComments?: string;
      wouldRecommend: boolean;
      improvementSuggestions?: string;
    };
  } | null> {
    try {
      // Get session details
      const sessionQuery = `
        SELECT ss.*,
          CASE 
            WHEN ss.results_count > 0 THEN CAST(ss.results_accepted AS FLOAT) / ss.results_count
            ELSE 0
          END as success_rate
        FROM search_sessions ss
        WHERE ss.id = ?
      `;

      const sessionResult = await this.env.DB.prepare(sessionQuery).bind(sessionId).first();
      
      if (!sessionResult) {
        return null;
      }

      // Get search results for this session
      const resultsQuery = `
        SELECT sr.*
        FROM search_results sr
        WHERE sr.search_session_id = ?
        ORDER BY sr.relevance_score DESC, sr.quality_score DESC
      `;

      const resultsResult = await this.env.DB.prepare(resultsQuery).bind(sessionId).all();
      const results = (resultsResult.results || []).map((row: any) => ({
        id: row.id,
        title: row.result_title,
        authors: JSON.parse(row.result_authors || '[]'),
        journal: row.result_journal,
        year: row.result_year,
        doi: row.result_doi,
        url: row.result_url,
        relevanceScore: row.relevance_score,
        confidenceScore: row.confidence_score,
        qualityScore: row.quality_score,
        citationCount: row.citation_count,
        userAction: row.user_action,
        addedToLibrary: row.added_to_library,
        createdAt: new Date(row.created_at)
      }));

      // Get feedback for this session
      const feedbackQuery = `
        SELECT sf.*
        FROM search_feedback sf
        WHERE sf.search_session_id = ?
        ORDER BY sf.created_at DESC
        LIMIT 1
      `;

      const feedbackResult = await this.env.DB.prepare(feedbackQuery).bind(sessionId).first();
      const feedback = feedbackResult ? {
        overallSatisfaction: feedbackResult.overall_satisfaction,
        relevanceRating: feedbackResult.relevance_rating,
        qualityRating: feedbackResult.quality_rating,
        easeOfUseRating: feedbackResult.ease_of_use_rating,
        feedbackComments: feedbackResult.feedback_comments,
        wouldRecommend: feedbackResult.would_recommend,
        improvementSuggestions: feedbackResult.improvement_suggestions
      } : undefined;

      // Transform session to SearchHistoryEntry format
      const contentSources = JSON.parse(sessionResult.content_sources || '[]');
      const session: SearchHistoryEntry = {
        id: sessionResult.id,
        conversationId: sessionResult.conversation_id,
        userId: sessionResult.user_id,
        searchQuery: sessionResult.search_query,
        contentSources,
        contentSourceDetails: await this.getContentSourceDetails(contentSources, sessionResult.id),
        searchFilters: JSON.parse(sessionResult.search_filters || '{}'),
        resultsCount: sessionResult.results_count || 0,
        resultsAccepted: sessionResult.results_accepted || 0,
        resultsRejected: sessionResult.results_rejected || 0,
        searchSuccess: sessionResult.search_success || false,
        successRate: sessionResult.success_rate || 0,
        processingTimeMs: sessionResult.processing_time_ms || 0,
        errorMessage: sessionResult.error_message,
        createdAt: new Date(sessionResult.created_at),
        updatedAt: new Date(sessionResult.created_at)
      };

      return {
        session,
        results,
        feedback
      };
    } catch (error) {
      console.error('Error getting search session details:', error);
      throw error;
    }
  }

  /**
   * Get search query performance analytics
   */
  async getQueryPerformanceAnalytics(
    userId: string,
    conversationId?: string,
    days: number = 30
  ): Promise<Array<{
    query: string;
    searchCount: number;
    averageResults: number;
    successRate: number;
    averageProcessingTime: number;
    lastUsed: Date;
    topResults: Array<{
      title: string;
      relevanceScore: number;
      addedToLibrary: boolean;
    }>;
  }>> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      let whereClause = 'WHERE ss.user_id = ? AND ss.created_at >= ?';
      const params = [userId, cutoffDate.toISOString()];

      if (conversationId) {
        whereClause += ' AND ss.conversation_id = ?';
        params.push(conversationId);
      }

      const query = `
        SELECT 
          ss.search_query,
          COUNT(*) as search_count,
          AVG(ss.results_count) as avg_results,
          AVG(CASE 
            WHEN ss.results_count > 0 THEN CAST(ss.results_accepted AS FLOAT) / ss.results_count
            ELSE 0
          END) as success_rate,
          AVG(ss.processing_time_ms) as avg_processing_time,
          MAX(ss.created_at) as last_used
        FROM search_sessions ss
        ${whereClause}
        GROUP BY ss.search_query
        HAVING search_count > 1
        ORDER BY search_count DESC, success_rate DESC
        LIMIT 20
      `;

      const result = await this.env.DB.prepare(query).bind(...params).all();
      
      // Get top results for each query
      const queryAnalytics = await Promise.all(
        (result.results || []).map(async (row: any) => {
          const topResultsQuery = `
            SELECT sr.result_title, sr.relevance_score, sr.added_to_library
            FROM search_results sr
            JOIN search_sessions ss ON sr.search_session_id = ss.id
            WHERE ss.search_query = ? AND ss.user_id = ?
            ${conversationId ? 'AND ss.conversation_id = ?' : ''}
            ORDER BY sr.relevance_score DESC
            LIMIT 3
          `;

          const topResultsParams = [row.search_query, userId];
          if (conversationId) {
            topResultsParams.push(conversationId);
          }

          const topResultsResult = await this.env.DB.prepare(topResultsQuery).bind(...topResultsParams).all();
          const topResults = (topResultsResult.results || []).map((r: any) => ({
            title: r.result_title,
            relevanceScore: r.relevance_score,
            addedToLibrary: r.added_to_library
          }));

          return {
            query: row.search_query,
            searchCount: row.search_count,
            averageResults: row.avg_results || 0,
            successRate: row.success_rate || 0,
            averageProcessingTime: row.avg_processing_time || 0,
            lastUsed: new Date(row.last_used),
            topResults
          };
        })
      );

      return queryAnalytics;
    } catch (error) {
      console.error('Error getting query performance analytics:', error);
      throw error;
    }
  }

  /**
   * Get content source effectiveness metrics
   */
  async getContentSourceEffectiveness(
    userId: string,
    conversationId?: string,
    days: number = 30
  ): Promise<Array<{
    source: 'ideas' | 'builder';
    totalSearches: number;
    averageResults: number;
    successRate: number;
    conversionRate: number;
    averageRelevanceScore: number;
    topKeywords: string[];
    recentTrend: 'up' | 'down' | 'stable';
  }>> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const halfwayDate = new Date(Date.now() - (days / 2) * 24 * 60 * 60 * 1000);
      
      let whereClause = 'WHERE ss.user_id = ? AND ss.created_at >= ?';
      const params = [userId, cutoffDate.toISOString()];

      if (conversationId) {
        whereClause += ' AND ss.conversation_id = ?';
        params.push(conversationId);
      }

      // Get effectiveness metrics by source
      const effectivenessQuery = `
        SELECT 
          ss.content_sources,
          COUNT(*) as total_searches,
          AVG(ss.results_count) as avg_results,
          AVG(CASE 
            WHEN ss.results_count > 0 THEN CAST(ss.results_accepted AS FLOAT) / ss.results_count
            ELSE 0
          END) as success_rate,
          AVG(CASE 
            WHEN ss.results_count > 0 THEN CAST(ss.results_accepted AS FLOAT) / ss.results_count
            ELSE 0
          END) as conversion_rate
        FROM search_sessions ss
        ${whereClause}
        GROUP BY ss.content_sources
      `;

      const effectivenessResult = await this.env.DB.prepare(effectivenessQuery).bind(...params).all();
      
      // Get relevance scores by source
      const relevanceQuery = `
        SELECT 
          ss.content_sources,
          AVG(sr.relevance_score) as avg_relevance_score
        FROM search_sessions ss
        JOIN search_results sr ON ss.id = sr.search_session_id
        ${whereClause}
        GROUP BY ss.content_sources
      `;

      const relevanceResult = await this.env.DB.prepare(relevanceQuery).bind(...params).all();
      
      // Get trend data (compare first half vs second half of period)
      const trendQuery = `
        SELECT 
          ss.content_sources,
          CASE 
            WHEN ss.created_at >= ? THEN 'recent'
            ELSE 'older'
          END as period,
          COUNT(*) as search_count
        FROM search_sessions ss
        ${whereClause}
        GROUP BY ss.content_sources, period
      `;

      const trendParams = [halfwayDate.toISOString(), ...params];
      const trendResult = await this.env.DB.prepare(trendQuery).bind(...trendParams).all();

      // Process results by source type
      const sourceMetrics = new Map<string, any>();
      
      // Process effectiveness data
      (effectivenessResult.results || []).forEach((row: any) => {
        try {
          const sources = JSON.parse(row.content_sources || '[]');
          sources.forEach((source: string) => {
            if (source === 'ideas' || source === 'builder') {
              if (!sourceMetrics.has(source)) {
                sourceMetrics.set(source, {
                  source,
                  totalSearches: 0,
                  averageResults: 0,
                  successRate: 0,
                  conversionRate: 0,
                  averageRelevanceScore: 0,
                  topKeywords: [],
                  recentTrend: 'stable' as const
                });
              }
              
              const metrics = sourceMetrics.get(source);
              metrics.totalSearches += row.total_searches;
              metrics.averageResults += row.avg_results * row.total_searches;
              metrics.successRate += row.success_rate * row.total_searches;
              metrics.conversionRate += row.conversion_rate * row.total_searches;
            }
          });
        } catch (e) {
          // Ignore invalid JSON
        }
      });

      // Process relevance data
      (relevanceResult.results || []).forEach((row: any) => {
        try {
          const sources = JSON.parse(row.content_sources || '[]');
          sources.forEach((source: string) => {
            if (sourceMetrics.has(source)) {
              sourceMetrics.get(source).averageRelevanceScore = row.avg_relevance_score || 0;
            }
          });
        } catch (e) {
          // Ignore invalid JSON
        }
      });

      // Process trend data
      const trendData = new Map<string, { recent: number; older: number }>();
      (trendResult.results || []).forEach((row: any) => {
        try {
          const sources = JSON.parse(row.content_sources || '[]');
          sources.forEach((source: string) => {
            if (!trendData.has(source)) {
              trendData.set(source, { recent: 0, older: 0 });
            }
            
            const trend = trendData.get(source)!;
            if (row.period === 'recent') {
              trend.recent += row.search_count;
            } else {
              trend.older += row.search_count;
            }
          });
        } catch (e) {
          // Ignore invalid JSON
        }
      });

      // Calculate final metrics and trends
      const finalMetrics: Array<{
        source: 'ideas' | 'builder';
        totalSearches: number;
        averageResults: number;
        successRate: number;
        conversionRate: number;
        averageRelevanceScore: number;
        topKeywords: string[];
        recentTrend: 'up' | 'down' | 'stable';
      }> = [];

      for (const [source, metrics] of sourceMetrics.entries()) {
        // Normalize weighted averages
        if (metrics.totalSearches > 0) {
          metrics.averageResults /= metrics.totalSearches;
          metrics.successRate /= metrics.totalSearches;
          metrics.conversionRate /= metrics.totalSearches;
        }

        // Calculate trend
        const trend = trendData.get(source);
        let recentTrend: 'up' | 'down' | 'stable' = 'stable';
        if (trend && trend.older > 0) {
          const changeRatio = trend.recent / trend.older;
          if (changeRatio > 1.2) {
            recentTrend = 'up';
          } else if (changeRatio < 0.8) {
            recentTrend = 'down';
          }
        }

        // Get top keywords for this source
        const topKeywords = await this.getTopKeywordsForSource(userId, source as 'ideas' | 'builder', conversationId, days);

        finalMetrics.push({
          ...metrics,
          topKeywords,
          recentTrend
        });
      }

      return finalMetrics.sort((a, b) => b.totalSearches - a.totalSearches);
    } catch (error) {
      console.error('Error getting content source effectiveness:', error);
      throw error;
    }
  }

  /**
   * Get paginated search history with enhanced filtering
   */
  async getSearchHistory(
    userId: string,
    conversationId?: string,
    filter?: SearchHistoryFilter,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    entries: SearchHistoryEntry[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      let whereClause = 'WHERE ss.user_id = ?';
      const params: any[] = [userId];

      if (conversationId) {
        whereClause += ' AND ss.conversation_id = ?';
        params.push(conversationId);
      }

      if (filter?.dateRange) {
        whereClause += ' AND ss.created_at BETWEEN ? AND ?';
        params.push(filter.dateRange.start.toISOString(), filter.dateRange.end.toISOString());
      }

      if (filter?.contentSources && filter.contentSources.length > 0) {
        const sourcesConditions = filter.contentSources.map(() => 'JSON_EXTRACT(ss.content_sources, "$") LIKE ?').join(' OR ');
        whereClause += ` AND (${sourcesConditions})`;
        filter.contentSources.forEach(source => {
          params.push(`%"${source}"%`);
        });
      }

      if (filter?.successOnly) {
        whereClause += ' AND ss.search_success = true';
      }

      if (filter?.minResultsCount) {
        whereClause += ' AND ss.results_count >= ?';
        params.push(filter.minResultsCount);
      }

      if (filter?.searchQuery) {
        whereClause += ' AND ss.search_query LIKE ?';
        params.push(`%${filter.searchQuery}%`);
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM search_sessions ss
        ${whereClause}
      `;
      const countResult = await this.env.DB.prepare(countQuery).bind(...params).first();
      const total = countResult.total || 0;

      // Get paginated results
      const query = `
        SELECT 
          ss.*,
          CASE 
            WHEN ss.results_count > 0 THEN CAST(ss.results_accepted AS FLOAT) / ss.results_count
            ELSE 0
          END as success_rate
        FROM search_sessions ss
        ${whereClause}
        ORDER BY ss.created_at DESC
        LIMIT ? OFFSET ?
      `;
      params.push(limit, offset);

      const result = await this.env.DB.prepare(query).bind(...params).all();
      const sessions = result.results || [];

      // Transform to SearchHistoryEntry format
      const entries: SearchHistoryEntry[] = await Promise.all(
        sessions.map(async (session: any) => {
          // Get content source details if available
          let contentSources: ('ideas' | 'builder')[] = [];
          try {
            contentSources = JSON.parse(session.content_sources || '[]');
          } catch (e) {
            console.warn('Invalid JSON in content_sources:', session.content_sources);
            contentSources = [];
          }
          const contentSourceDetails = await this.getContentSourceDetails(contentSources, session.id);

          return {
            id: session.id,
            conversationId: session.conversation_id,
            userId: session.user_id,
            searchQuery: session.search_query,
            contentSources,
            contentSourceDetails,
            searchFilters: JSON.parse(session.search_filters || '{}'),
            resultsCount: session.results_count || 0,
            resultsAccepted: session.results_accepted || 0,
            resultsRejected: session.results_rejected || 0,
            searchSuccess: session.search_success || false,
            successRate: session.success_rate || 0,
            processingTimeMs: session.processing_time_ms || 0,
            errorMessage: session.error_message,
            createdAt: new Date(session.created_at),
            updatedAt: new Date(session.created_at) // Using created_at as updated_at for now
          };
        })
      );

      return {
        entries,
        total,
        hasMore: offset + limit < total
      };
    } catch (error) {
      console.error('Error getting search history:', error);
      throw error;
    }
  }

  /**
   * Get search history statistics
   */
  async getSearchHistoryStats(
    userId: string,
    conversationId?: string,
    days: number = 30
  ): Promise<SearchHistoryStats> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      let whereClause = 'WHERE ss.user_id = ? AND ss.created_at >= ?';
      const params = [userId, cutoffDate.toISOString()];

      if (conversationId) {
        whereClause += ' AND ss.conversation_id = ?';
        params.push(conversationId);
      }

      // Get basic statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_searches,
          COUNT(CASE WHEN search_success = true THEN 1 END) as successful_searches,
          AVG(results_count) as avg_results_per_search,
          AVG(CASE 
            WHEN results_count > 0 THEN CAST(results_accepted AS FLOAT) / results_count
            ELSE 0
          END) as avg_success_rate,
          AVG(processing_time_ms) as avg_processing_time
        FROM search_sessions ss
        ${whereClause}
      `;

      const statsResult = await this.env.DB.prepare(statsQuery).bind(...params).first();

      // Get content source usage
      const sourcesQuery = `
        SELECT 
          content_sources,
          COUNT(*) as usage_count
        FROM search_sessions ss
        ${whereClause}
        GROUP BY content_sources
      `;

      const sourcesResult = await this.env.DB.prepare(sourcesQuery).bind(...params).all();
      const mostUsedContentSources = this.calculateContentSourceUsage(sourcesResult.results || []);

      // Get top search queries
      const queriesQuery = `
        SELECT 
          search_query,
          COUNT(*) as query_count,
          AVG(results_count) as avg_results,
          AVG(CASE 
            WHEN results_count > 0 THEN CAST(results_accepted AS FLOAT) / results_count
            ELSE 0
          END) as success_rate
        FROM search_sessions ss
        ${whereClause}
        GROUP BY search_query
        ORDER BY query_count DESC
        LIMIT 10
      `;

      const queriesResult = await this.env.DB.prepare(queriesQuery).bind(...params).all();
      const topSearchQueries = (queriesResult.results || []).map((row: any) => ({
        query: row.search_query,
        count: row.query_count,
        averageResults: row.avg_results || 0,
        successRate: row.success_rate || 0
      }));

      // Get search trends (daily aggregation)
      const trendsQuery = `
        SELECT 
          DATE(created_at) as search_date,
          COUNT(*) as search_count,
          AVG(CASE 
            WHEN results_count > 0 THEN CAST(results_accepted AS FLOAT) / results_count
            ELSE 0
          END) as success_rate,
          AVG(results_count) as avg_results
        FROM search_sessions ss
        ${whereClause}
        GROUP BY DATE(created_at)
        ORDER BY search_date DESC
        LIMIT 30
      `;

      const trendsResult = await this.env.DB.prepare(trendsQuery).bind(...params).all();
      const searchTrends = (trendsResult.results || []).map((row: any) => ({
        date: row.search_date,
        searchCount: row.search_count,
        successRate: row.success_rate || 0,
        averageResults: row.avg_results || 0
      }));

      return {
        totalSearches: statsResult.total_searches || 0,
        successfulSearches: statsResult.successful_searches || 0,
        averageResultsPerSearch: statsResult.avg_results_per_search || 0,
        averageSuccessRate: statsResult.avg_success_rate || 0,
        averageProcessingTime: statsResult.avg_processing_time || 0,
        mostUsedContentSources,
        topSearchQueries,
        searchTrends
      };
    } catch (error) {
      console.error('Error getting search history stats:', error);
      throw error;
    }
  }

  /**
   * Get content source usage analytics
   */
  async getContentSourceUsage(
    userId: string,
    conversationId?: string,
    days: number = 30
  ): Promise<ContentSourceUsage[]> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      let whereClause = 'WHERE ss.user_id = ? AND ss.created_at >= ?';
      const params = [userId, cutoffDate.toISOString()];

      if (conversationId) {
        whereClause += ' AND ss.conversation_id = ?';
        params.push(conversationId);
      }

      // Get usage by source type
      const usageQuery = `
        SELECT 
          content_sources,
          COUNT(*) as total_usage,
          COUNT(CASE WHEN search_success = true THEN 1 END) as successful_searches,
          AVG(results_count) as avg_results,
          DATE(created_at) as usage_date
        FROM search_sessions ss
        ${whereClause}
        GROUP BY content_sources, DATE(created_at)
        ORDER BY usage_date DESC
      `;

      const usageResult = await this.env.DB.prepare(usageQuery).bind(...params).all();
      const usageData = usageResult.results || [];

      // Process usage data by source type
      const sourceUsageMap = new Map<string, {
        totalUsage: number;
        successfulSearches: number;
        totalResults: number;
        recentUsage: Array<{ date: string; count: number }>;
      }>();

      usageData.forEach((row: any) => {
        try {
          const sources = JSON.parse(row.content_sources || '[]');
          sources.forEach((source: string) => {
            if (!sourceUsageMap.has(source)) {
              sourceUsageMap.set(source, {
                totalUsage: 0,
                successfulSearches: 0,
                totalResults: 0,
                recentUsage: []
              });
            }

            const usage = sourceUsageMap.get(source)!;
            usage.totalUsage += row.total_usage;
            usage.successfulSearches += row.successful_searches;
            usage.totalResults += row.avg_results * row.total_usage;
            
            const existingDate = usage.recentUsage.find(u => u.date === row.usage_date);
            if (existingDate) {
              existingDate.count += row.total_usage;
            } else {
              usage.recentUsage.push({
                date: row.usage_date,
                count: row.total_usage
              });
            }
          });
        } catch (e) {
          // Ignore invalid JSON
        }
      });

      // Convert to ContentSourceUsage format
      const contentSourceUsage: ContentSourceUsage[] = [];
      
      for (const [source, usage] of sourceUsageMap.entries()) {
        if (source === 'ideas' || source === 'builder') {
          // Get top keywords for this source (simplified implementation)
          const topKeywords = await this.getTopKeywordsForSource(
            userId, 
            source as 'ideas' | 'builder', 
            conversationId, 
            days
          );

          contentSourceUsage.push({
            source: source as 'ideas' | 'builder',
            totalUsage: usage.totalUsage,
            successfulSearches: usage.successfulSearches,
            averageResults: usage.totalUsage > 0 ? usage.totalResults / usage.totalUsage : 0,
            topKeywords,
            recentUsage: usage.recentUsage.sort((a, b) => b.date.localeCompare(a.date))
          });
        }
      }

      return contentSourceUsage;
    } catch (error) {
      console.error('Error getting content source usage:', error);
      throw error;
    }
  }

  /**
   * Update search session with results
   */
  async updateSearchSessionResults(
    sessionId: string,
    resultsCount: number,
    resultsAccepted: number,
    resultsRejected: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.env.DB.prepare(`
        UPDATE search_sessions 
        SET results_count = ?, results_accepted = ?, results_rejected = ?, 
            search_success = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        resultsCount,
        resultsAccepted,
        resultsRejected,
        resultsCount > 0 && !errorMessage,
        errorMessage || null,
        sessionId
      ).run();

      console.log(`Search session updated: ${sessionId}`);
    } catch (error) {
      console.error('Error updating search session:', error);
      throw error;
    }
  }

  /**
   * Delete search history entries
   */
  async deleteSearchHistory(
    userId: string,
    conversationId?: string,
    entryIds?: string[]
  ): Promise<void> {
    try {
      if (entryIds && entryIds.length > 0) {
        // Delete specific entries
        const placeholders = entryIds.map(() => '?').join(',');
        
        // Delete related data first (foreign key constraints)
        await this.env.DB.prepare(`
          DELETE FROM search_feedback 
          WHERE search_session_id IN (${placeholders})
        `).bind(...entryIds).run();

        await this.env.DB.prepare(`
          DELETE FROM search_results 
          WHERE search_session_id IN (${placeholders})
        `).bind(...entryIds).run();

        await this.env.DB.prepare(`
          DELETE FROM search_sessions 
          WHERE id IN (${placeholders}) AND user_id = ?
          ${conversationId ? 'AND conversation_id = ?' : ''}
        `).bind(...entryIds, userId, ...(conversationId ? [conversationId] : [])).run();

      } else {
        // Clear all history for user/conversation
        await this.clearAnalyticsData(userId, conversationId);
      }

      console.log(`Search history deleted for user ${userId}${conversationId ? ` in conversation ${conversationId}` : ''}`);
    } catch (error) {
      console.error('Error deleting search history:', error);
      throw error;
    }
  }

  /**
   * Export search history data
   */
  async exportSearchHistory(
    userId: string,
    conversationId?: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const { entries, total } = await this.getSearchHistory(
        userId,
        conversationId,
        undefined,
        1000, // Export up to 1000 entries
        0
      );

      if (format === 'json') {
        return JSON.stringify({
          exportDate: new Date().toISOString(),
          userId,
          conversationId,
          totalEntries: total,
          entries: entries.map(entry => ({
            id: entry.id,
            date: entry.createdAt.toISOString(),
            searchQuery: entry.searchQuery,
            contentSources: entry.contentSources,
            contentSourceDetails: entry.contentSourceDetails,
            searchFilters: entry.searchFilters,
            resultsCount: entry.resultsCount,
            resultsAccepted: entry.resultsAccepted,
            resultsRejected: entry.resultsRejected,
            searchSuccess: entry.searchSuccess,
            successRate: entry.successRate,
            processingTimeMs: entry.processingTimeMs,
            errorMessage: entry.errorMessage
          }))
        }, null, 2);
      } else {
        // CSV format
        const headers = [
          'ID',
          'Date',
          'Search Query',
          'Content Sources',
          'Results Count',
          'Results Accepted',
          'Results Rejected',
          'Success Rate',
          'Processing Time (ms)',
          'Search Success',
          'Error Message'
        ];

        const rows = entries.map(entry => [
          entry.id,
          entry.createdAt.toISOString(),
          `"${entry.searchQuery.replace(/"/g, '""')}"`,
          entry.contentSources.join(';'),
          entry.resultsCount,
          entry.resultsAccepted,
          entry.resultsRejected,
          (entry.successRate * 100).toFixed(1) + '%',
          entry.processingTimeMs,
          entry.searchSuccess ? 'Yes' : 'No',
          entry.errorMessage ? `"${entry.errorMessage.replace(/"/g, '""')}"` : ''
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
      }
    } catch (error) {
      console.error('Error exporting search history:', error);
      throw error;
    }
  }

  /**
   * Update search session results
   */
  async updateSearchSessionResults(
    sessionId: string,
    resultsCount: number,
    resultsAccepted: number,
    resultsRejected: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.env.DB.prepare(`
        UPDATE search_sessions 
        SET results_count = ?, results_accepted = ?, results_rejected = ?, 
            search_success = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        resultsCount,
        resultsAccepted,
        resultsRejected,
        resultsCount > 0 && !errorMessage,
        errorMessage || null,
        sessionId
      ).run();

      console.log(`Search session results updated: ${sessionId}`);
    } catch (error) {
      console.error('Error updating search session results:', error);
      throw error;
    }
  }

  /**
   * Delete search history entries
   */
  async deleteSearchHistory(
    userId: string,
    conversationId?: string,
    entryIds?: string[]
  ): Promise<void> {
    try {
      if (entryIds && entryIds.length > 0) {
        // Delete specific entries
        const placeholders = entryIds.map(() => '?').join(',');
        
        // Delete related data first (foreign key constraints)
        await this.env.DB.prepare(`
          DELETE FROM search_feedback 
          WHERE search_session_id IN (${placeholders})
        `).bind(...entryIds).run();

        await this.env.DB.prepare(`
          DELETE FROM search_results 
          WHERE search_session_id IN (${placeholders})
        `).bind(...entryIds).run();

        let query = `
          DELETE FROM search_sessions 
          WHERE id IN (${placeholders}) AND user_id = ?
        `;
        const params = [...entryIds, userId];
        
        if (conversationId) {
          query += ' AND conversation_id = ?';
          params.push(conversationId);
        }
        
        await this.env.DB.prepare(query).bind(...params).run();
      } else {
        // Delete all entries for user/conversation
        await this.clearAnalyticsData(userId, conversationId);
      }

      console.log(`Search history deleted for user ${userId}${conversationId ? ` in conversation ${conversationId}` : ''}`);
    } catch (error) {
      console.error('Error deleting search history:', error);
      throw error;
    }
  }

  /**
   * Export search history data
   */
  async exportSearchHistory(
    userId: string,
    conversationId?: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const { entries } = await this.getSearchHistory(userId, conversationId, undefined, 1000, 0);
      
      if (format === 'csv') {
        return this.convertToCSV(entries);
      } else {
        return JSON.stringify({
          exportDate: new Date().toISOString(),
          userId,
          conversationId,
          totalEntries: entries.length,
          entries
        }, null, 2);
      }
    } catch (error) {
      console.error('Error exporting search history:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getContentSourceDetails(
    contentSources: string[],
    sessionId: string
  ): Promise<Array<{
    source: 'ideas' | 'builder';
    id: string;
    title: string;
    extractedKeywords: string[];
  }>> {
    // This would typically fetch details from the content extraction results
    // For now, return a simplified structure
    return contentSources.map((source, index) => ({
      source: source as 'ideas' | 'builder',
      id: `${source}-${sessionId}-${index}`,
      title: `${source.charAt(0).toUpperCase() + source.slice(1)} Content ${index + 1}`,
      extractedKeywords: this.getMockKeywords(source as 'ideas' | 'builder')
    }));
  }

  private calculateContentSourceUsage(sourcesData: any[]): Array<{
    source: 'ideas' | 'builder';
    count: number;
    percentage: number;
  }> {
    const sourceCounts = new Map<string, number>();
    let totalUsage = 0;

    sourcesData.forEach(row => {
      try {
        const sources = JSON.parse(row.content_sources || '[]');
        sources.forEach((source: string) => {
          sourceCounts.set(source, (sourceCounts.get(source) || 0) + row.usage_count);
          totalUsage += row.usage_count;
        });
      } catch (e) {
        // Ignore invalid JSON
      }
    });

    return Array.from(sourceCounts.entries())
      .filter(([source]) => source === 'ideas' || source === 'builder')
      .map(([source, count]) => ({
        source: source as 'ideas' | 'builder',
        count,
        percentage: totalUsage > 0 ? (count / totalUsage) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  private async getTopKeywordsForSource(
    userId: string,
    source: 'ideas' | 'builder',
    conversationId?: string,
    days: number = 30
  ): Promise<string[]> {
    // Simplified implementation - would typically analyze search queries
    // and extracted content to identify common keywords
    return ['research', 'analysis', 'methodology', 'results', 'conclusion'];
  }

  private convertToCSV(entries: SearchHistoryEntry[]): string {
    const headers = [
      'ID', 'Date', 'Search Query', 'Content Sources', 'Results Count',
      'Results Accepted', 'Results Rejected', 'Success Rate', 'Processing Time (ms)',
      'Search Success', 'Error Message'
    ];

    const rows = entries.map(entry => [
      entry.id,
      entry.createdAt.toISOString(),
      entry.searchQuery,
      entry.contentSources.join(';'),
      entry.resultsCount.toString(),
      entry.resultsAccepted.toString(),
      entry.resultsRejected.toString(),
      entry.successRate.toFixed(3),
      entry.processingTimeMs.toString(),
      entry.searchSuccess.toString(),
      entry.errorMessage || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  /**
   * Get mock keywords for content sources
   */
  private getMockKeywords(source: 'ideas' | 'builder'): string[] {
    const mockKeywords = {
      ideas: ['research', 'analysis', 'methodology', 'results', 'conclusion'],
      builder: ['structure', 'framework', 'implementation', 'design', 'architecture']
    };

    return mockKeywords[source] || [];
  }
}