import { SearchHistoryItem, SearchAnalytics, safeDate } from '../../lib/ai-types';

/**
 * Search Analytics Manager
 * Enhanced version that tracks search results and provides comprehensive analytics
 * for the AI Reference Searcher
 */

export interface SearchSession {
  id: string;
  conversationId: string;
  userId: string;
  searchQuery: string;
  contentSources: ('ideas' | 'builder')[];
  searchFilters: Record<string, any>;
  resultsCount: number;
  resultsAccepted: number;
  resultsRejected: number;
  searchSuccess: boolean;
  processingTimeMs: number;
  errorMessage?: string;
  createdAt: Date;
}

export interface SearchResult {
  id: string;
  searchSessionId: string;
  referenceId?: string;
  resultTitle: string;
  resultAuthors: string[];
  resultJournal?: string;
  resultYear?: number;
  resultDoi?: string;
  resultUrl?: string;
  relevanceScore: number;
  confidenceScore: number;
  qualityScore: number;
  citationCount: number;
  userAction?: 'viewed' | 'added' | 'rejected' | 'bookmarked' | 'ignored';
  userFeedbackRating?: number; // 1-5 scale
  userFeedbackComments?: string;
  addedToLibrary: boolean;
  addedAt?: Date;
  createdAt: Date;
}

export interface SearchFeedback {
  id: string;
  searchSessionId: string;
  userId: string;
  overallSatisfaction: number; // 1-5 scale
  relevanceRating: number; // 1-5 scale
  qualityRating: number; // 1-5 scale
  easeOfUseRating: number; // 1-5 scale
  feedbackComments?: string;
  wouldRecommend: boolean;
  improvementSuggestions?: string;
  createdAt: Date;
}

export interface SearchAnalyticsData {
  id: string;
  conversationId: string;
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  totalSearches: number;
  successfulSearches: number;
  totalResults: number;
  resultsAdded: number;
  resultsRejected: number;
  averageResultsPerSearch: number;
  averageRelevanceScore: number;
  averageProcessingTimeMs: number;
  successRate: number;
  conversionRate: number;
  popularTopics: string[];
  popularSources: ('ideas' | 'builder')[];
  searchFrequency: Record<string, number>;
  userSatisfactionScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversionMetrics {
  totalSearches: number;
  totalResults: number;
  resultsViewed: number;
  resultsAdded: number;
  resultsRejected: number;
  conversionRate: number; // resultsAdded / totalResults
  viewRate: number; // resultsViewed / totalResults
  rejectionRate: number; // resultsRejected / totalResults
}

export interface UserSatisfactionMetrics {
  averageOverallSatisfaction: number;
  averageRelevanceRating: number;
  averageQualityRating: number;
  averageEaseOfUseRating: number;
  recommendationRate: number; // percentage who would recommend
  totalFeedbackCount: number;
}

export class SearchAnalyticsManager {
  private env: any; // Cloudflare environment with database binding

  constructor(env: any) {
    this.env = env;
  }

  /**
   * Record a new search session
   */
  async recordSearchSession(sessionData: Omit<SearchSession, 'id' | 'createdAt'>): Promise<string> {
    const sessionId = crypto.randomUUID();
    
    try {
      await this.env.DB.prepare(`
        INSERT INTO search_sessions (
          id, conversation_id, user_id, search_query, content_sources,
          search_filters, results_count, results_accepted, results_rejected,
          search_success, processing_time_ms, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        sessionId,
        sessionData.conversationId,
        sessionData.userId,
        sessionData.searchQuery,
        JSON.stringify(sessionData.contentSources),
        JSON.stringify(sessionData.searchFilters),
        sessionData.resultsCount,
        sessionData.resultsAccepted,
        sessionData.resultsRejected,
        sessionData.searchSuccess,
        sessionData.processingTimeMs,
        sessionData.errorMessage || null
      ).run();

      console.log(`Search session recorded: ${sessionId}`);
      return sessionId;
    } catch (error) {
      console.error('Error recording search session:', error);
      throw error;
    }
  }

  /**
   * Record a search result interaction
   */
  async recordSearchResult(resultData: Omit<SearchResult, 'id' | 'createdAt'>): Promise<string> {
    const resultId = crypto.randomUUID();
    
    try {
      await this.env.DB.prepare(`
        INSERT INTO search_results (
          id, search_session_id, reference_id, result_title, result_authors,
          result_journal, result_year, result_doi, result_url, relevance_score,
          confidence_score, quality_score, citation_count, user_action,
          user_feedback_rating, user_feedback_comments, added_to_library, added_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        resultId,
        resultData.searchSessionId,
        resultData.referenceId || null,
        resultData.resultTitle,
        JSON.stringify(resultData.resultAuthors),
        resultData.resultJournal || null,
        resultData.resultYear || null,
        resultData.resultDoi || null,
        resultData.resultUrl || null,
        resultData.relevanceScore,
        resultData.confidenceScore,
        resultData.qualityScore,
        resultData.citationCount,
        resultData.userAction || null,
        resultData.userFeedbackRating || null,
        resultData.userFeedbackComments || null,
        resultData.addedToLibrary,
        resultData.addedAt?.toISOString() || null
      ).run();

      console.log(`Search result recorded: ${resultId}`);
      return resultId;
    } catch (error) {
      console.error('Error recording search result:', error);
      throw error;
    }
  }

  /**
   * Update search result with user action
   */
  async updateSearchResultAction(
    resultId: string, 
    action: 'viewed' | 'added' | 'rejected' | 'bookmarked' | 'ignored',
    referenceId?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        user_action: action,
        added_to_library: action === 'added',
        added_at: action === 'added' ? new Date().toISOString() : null
      };

      if (referenceId && action === 'added') {
        updateData.reference_id = referenceId;
      }

      await this.env.DB.prepare(`
        UPDATE search_results 
        SET user_action = ?, added_to_library = ?, added_at = ?, reference_id = ?
        WHERE id = ?
      `).bind(
        updateData.user_action,
        updateData.added_to_library,
        updateData.added_at,
        referenceId || null,
        resultId
      ).run();

      console.log(`Search result action updated: ${resultId} -> ${action}`);
    } catch (error) {
      console.error('Error updating search result action:', error);
      throw error;
    }
  }

  /**
   * Record user feedback for a search session
   */
  async recordSearchFeedback(feedbackData: Omit<SearchFeedback, 'id' | 'createdAt'>): Promise<string> {
    const feedbackId = crypto.randomUUID();
    
    try {
      await this.env.DB.prepare(`
        INSERT INTO search_feedback (
          id, search_session_id, user_id, overall_satisfaction, relevance_rating,
          quality_rating, ease_of_use_rating, feedback_comments, would_recommend,
          improvement_suggestions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        feedbackId,
        feedbackData.searchSessionId,
        feedbackData.userId,
        feedbackData.overallSatisfaction,
        feedbackData.relevanceRating,
        feedbackData.qualityRating,
        feedbackData.easeOfUseRating,
        feedbackData.feedbackComments || null,
        feedbackData.wouldRecommend,
        feedbackData.improvementSuggestions || null
      ).run();

      console.log(`Search feedback recorded: ${feedbackId}`);
      return feedbackId;
    } catch (error) {
      console.error('Error recording search feedback:', error);
      throw error;
    }
  }

  /**
   * Get conversion metrics for a user or conversation
   */
  async getConversionMetrics(userId: string, conversationId?: string, days: number = 30): Promise<ConversionMetrics> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      let query = `
        SELECT 
          COUNT(DISTINCT ss.id) as total_searches,
          COALESCE(SUM(ss.results_count), 0) as total_results,
          COUNT(CASE WHEN sr.user_action = 'viewed' THEN 1 END) as results_viewed,
          COUNT(CASE WHEN sr.user_action = 'added' THEN 1 END) as results_added,
          COUNT(CASE WHEN sr.user_action = 'rejected' THEN 1 END) as results_rejected
        FROM search_sessions ss
        LEFT JOIN search_results sr ON ss.id = sr.search_session_id
        WHERE ss.user_id = ? AND ss.created_at >= ?
      `;
      
      const params = [userId, cutoffDate.toISOString()];
      
      if (conversationId) {
        query += ' AND ss.conversation_id = ?';
        params.push(conversationId);
      }

      const result = await this.env.DB.prepare(query).bind(...params).first();
      
      const totalResults = result.total_results || 0;
      const resultsViewed = result.results_viewed || 0;
      const resultsAdded = result.results_added || 0;
      const resultsRejected = result.results_rejected || 0;

      return {
        totalSearches: result.total_searches || 0,
        totalResults,
        resultsViewed,
        resultsAdded,
        resultsRejected,
        conversionRate: totalResults > 0 ? resultsAdded / totalResults : 0,
        viewRate: totalResults > 0 ? resultsViewed / totalResults : 0,
        rejectionRate: totalResults > 0 ? resultsRejected / totalResults : 0
      };
    } catch (error) {
      console.error('Error getting conversion metrics:', error);
      throw error;
    }
  }

  /**
   * Get user satisfaction metrics
   */
  async getUserSatisfactionMetrics(userId: string, conversationId?: string, days: number = 30): Promise<UserSatisfactionMetrics> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      let query = `
        SELECT 
          AVG(sf.overall_satisfaction) as avg_overall_satisfaction,
          AVG(sf.relevance_rating) as avg_relevance_rating,
          AVG(sf.quality_rating) as avg_quality_rating,
          AVG(sf.ease_of_use_rating) as avg_ease_of_use_rating,
          COUNT(CASE WHEN sf.would_recommend = true THEN 1 END) * 100.0 / COUNT(*) as recommendation_rate,
          COUNT(*) as total_feedback_count
        FROM search_feedback sf
        JOIN search_sessions ss ON sf.search_session_id = ss.id
        WHERE sf.user_id = ? AND sf.created_at >= ?
      `;
      
      const params = [userId, cutoffDate.toISOString()];
      
      if (conversationId) {
        query += ' AND ss.conversation_id = ?';
        params.push(conversationId);
      }

      const result = await this.env.DB.prepare(query).bind(...params).first();
      
      return {
        averageOverallSatisfaction: result.avg_overall_satisfaction || 0,
        averageRelevanceRating: result.avg_relevance_rating || 0,
        averageQualityRating: result.avg_quality_rating || 0,
        averageEaseOfUseRating: result.avg_ease_of_use_rating || 0,
        recommendationRate: result.recommendation_rate || 0,
        totalFeedbackCount: result.total_feedback_count || 0
      };
    } catch (error) {
      console.error('Error getting user satisfaction metrics:', error);
      throw error;
    }
  }

  /**
   * Get search success rates and analytics
   */
  async getSearchAnalytics(userId: string, conversationId?: string, days: number = 30): Promise<SearchAnalytics> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Get basic search statistics
      let searchQuery = `
        SELECT 
          COUNT(*) as total_searches,
          COUNT(CASE WHEN search_success = true THEN 1 END) as successful_searches,
          AVG(results_count) as avg_results,
          AVG(processing_time_ms) as avg_processing_time
        FROM search_sessions
        WHERE user_id = ? AND created_at >= ?
      `;
      
      const searchParams = [userId, cutoffDate.toISOString()];
      
      if (conversationId) {
        searchQuery += ' AND conversation_id = ?';
        searchParams.push(conversationId);
      }

      const searchStats = await this.env.DB.prepare(searchQuery).bind(...searchParams).first();
      
      // Get popular topics from search queries
      const topicsQuery = `
        SELECT search_query
        FROM search_sessions
        WHERE user_id = ? AND created_at >= ?
        ${conversationId ? 'AND conversation_id = ?' : ''}
      `;
      
      const topicsResult = await this.env.DB.prepare(topicsQuery).bind(...searchParams).all();
      const popularTopics = this.extractPopularTopics(topicsResult.results?.map((r: any) => r.search_query) || []);
      
      // Get popular sources
      const sourcesQuery = `
        SELECT content_sources
        FROM search_sessions
        WHERE user_id = ? AND created_at >= ?
        ${conversationId ? 'AND conversation_id = ?' : ''}
      `;
      
      const sourcesResult = await this.env.DB.prepare(sourcesQuery).bind(...searchParams).all();
      const popularSources = this.extractPopularSources(sourcesResult.results?.map((r: any) => r.content_sources) || []);

      const totalSearches = searchStats.total_searches || 0;
      const successfulSearches = searchStats.successful_searches || 0;
      
      return {
        total_searches: totalSearches,
        average_results: searchStats.avg_results || 0,
        popular_sources: popularSources,
        search_frequency: {}, // Could be enhanced with daily/weekly frequency
        period: {
          start: cutoffDate.toISOString(),
          end: new Date().toISOString()
        },
        successRate: totalSearches > 0 ? successfulSearches / totalSearches : 0,
        popularTopics,
        averageResults: searchStats.avg_results || 0,
        topSources: popularSources
      };
    } catch (error) {
      console.error('Error getting search analytics:', error);
      throw error;
    }
  }

  /**
   * Get search result usage tracking
   */
  async getSearchResultUsage(userId: string, conversationId?: string, days: number = 30): Promise<{
    totalResults: number;
    resultsByAction: Record<string, number>;
    averageRelevanceScore: number;
    averageQualityScore: number;
    topPerformingResults: SearchResult[];
  }> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      let query = `
        SELECT 
          sr.*,
          ss.user_id
        FROM search_results sr
        JOIN search_sessions ss ON sr.search_session_id = ss.id
        WHERE ss.user_id = ? AND sr.created_at >= ?
      `;
      
      const params = [userId, cutoffDate.toISOString()];
      
      if (conversationId) {
        query += ' AND ss.conversation_id = ?';
        params.push(conversationId);
      }

      const results = await this.env.DB.prepare(query).bind(...params).all();
      const searchResults = results.results || [];
      
      // Calculate metrics
      const resultsByAction: Record<string, number> = {};
      let totalRelevanceScore = 0;
      let totalQualityScore = 0;
      let scoredResults = 0;

      searchResults.forEach((result: any) => {
        if (result.user_action) {
          resultsByAction[result.user_action] = (resultsByAction[result.user_action] || 0) + 1;
        }
        
        if (result.relevance_score !== null) {
          totalRelevanceScore += result.relevance_score;
          scoredResults++;
        }
        
        if (result.quality_score !== null) {
          totalQualityScore += result.quality_score;
        }
      });

      // Get top performing results (highest relevance + quality scores)
      const topPerformingResults = searchResults
        .filter((r: any) => r.relevance_score && r.quality_score)
        .sort((a: any, b: any) => (b.relevance_score + b.quality_score) - (a.relevance_score + a.quality_score))
        .slice(0, 10)
        .map(this.mapDatabaseResultToSearchResult);

      return {
        totalResults: searchResults.length,
        resultsByAction,
        averageRelevanceScore: scoredResults > 0 ? totalRelevanceScore / scoredResults : 0,
        averageQualityScore: scoredResults > 0 ? totalQualityScore / scoredResults : 0,
        topPerformingResults
      };
    } catch (error) {
      console.error('Error getting search result usage:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive analytics report
   */
  async generateAnalyticsReport(userId: string, conversationId?: string, days: number = 30): Promise<{
    searchAnalytics: SearchAnalytics;
    conversionMetrics: ConversionMetrics;
    satisfactionMetrics: UserSatisfactionMetrics;
    usageMetrics: any;
    trends: {
      searchTrend: Array<{ date: string; searches: number; success_rate: number }>;
      conversionTrend: Array<{ date: string; conversion_rate: number }>;
    };
  }> {
    try {
      const [searchAnalytics, conversionMetrics, satisfactionMetrics, usageMetrics] = await Promise.all([
        this.getSearchAnalytics(userId, conversationId, days),
        this.getConversionMetrics(userId, conversationId, days),
        this.getUserSatisfactionMetrics(userId, conversationId, days),
        this.getSearchResultUsage(userId, conversationId, days)
      ]);

      // Generate trend data (simplified for now)
      const trends = {
        searchTrend: await this.getSearchTrend(userId, conversationId, days),
        conversionTrend: await this.getConversionTrend(userId, conversationId, days)
      };

      return {
        searchAnalytics,
        conversionMetrics,
        satisfactionMetrics,
        usageMetrics,
        trends
      };
    } catch (error) {
      console.error('Error generating analytics report:', error);
      throw error;
    }
  }

  /**
   * Clear analytics data for a user
   */
  async clearAnalyticsData(userId: string, conversationId?: string): Promise<void> {
    try {
      const tables = ['search_feedback', 'search_results', 'search_sessions', 'search_analytics'];
      
      for (const table of tables) {
        let query = `DELETE FROM ${table} WHERE `;
        const params = [];
        
        if (table === 'search_sessions' || table === 'search_analytics') {
          query += 'user_id = ?';
          params.push(userId);
          
          if (conversationId) {
            query += ' AND conversation_id = ?';
            params.push(conversationId);
          }
        } else if (table === 'search_feedback') {
          query += 'user_id = ?';
          params.push(userId);
          
          if (conversationId) {
            query += ` AND search_session_id IN (
              SELECT id FROM search_sessions WHERE user_id = ? AND conversation_id = ?
            )`;
            params.push(userId, conversationId);
          }
        } else if (table === 'search_results') {
          query += `search_session_id IN (
            SELECT id FROM search_sessions WHERE user_id = ?
          )`;
          params.push(userId);
          
          if (conversationId) {
            query = query.replace('user_id = ?', 'user_id = ? AND conversation_id = ?');
            params.push(conversationId);
          }
        }
        
        await this.env.DB.prepare(query).bind(...params).run();
      }
      
      console.log(`Analytics data cleared for user ${userId}${conversationId ? ` in conversation ${conversationId}` : ''}`);
    } catch (error) {
      console.error('Error clearing analytics data:', error);
      throw error;
    }
  }

  // Helper methods
  private extractPopularTopics(queries: string[]): string[] {
    const topicCounts = new Map<string, number>();
    
    queries.forEach(query => {
      const topics = this.extractTopicsFromQuery(query);
      topics.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });

    return Array.from(topicCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic]) => topic);
  }

  private extractPopularSources(sourcesJson: string[]): ('ideas' | 'builder')[] {
    const sourceCounts = new Map<string, number>();
    
    sourcesJson.forEach(json => {
      try {
        const sources = JSON.parse(json);
        sources.forEach((source: string) => {
          sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
        });
      } catch (e) {
        // Ignore invalid JSON
      }
    });

    return Array.from(sourceCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([source]) => source as 'ideas' | 'builder');
  }

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

  private mapDatabaseResultToSearchResult(dbResult: any): SearchResult {
    return {
      id: dbResult.id,
      searchSessionId: dbResult.search_session_id,
      referenceId: dbResult.reference_id,
      resultTitle: dbResult.result_title,
      resultAuthors: JSON.parse(dbResult.result_authors || '[]'),
      resultJournal: dbResult.result_journal,
      resultYear: dbResult.result_year,
      resultDoi: dbResult.result_doi,
      resultUrl: dbResult.result_url,
      relevanceScore: dbResult.relevance_score,
      confidenceScore: dbResult.confidence_score,
      qualityScore: dbResult.quality_score,
      citationCount: dbResult.citation_count,
      userAction: dbResult.user_action,
      userFeedbackRating: dbResult.user_feedback_rating,
      userFeedbackComments: dbResult.user_feedback_comments,
      addedToLibrary: dbResult.added_to_library,
      addedAt: dbResult.added_at ? new Date(dbResult.added_at) : undefined,
      createdAt: new Date(dbResult.created_at)
    };
  }

  private async getSearchTrend(userId: string, conversationId?: string, days: number = 30): Promise<Array<{ date: string; searches: number; success_rate: number }>> {
    // Simplified implementation - could be enhanced with daily aggregation
    return [];
  }

  private async getConversionTrend(userId: string, conversationId?: string, days: number = 30): Promise<Array<{ date: string; conversion_rate: number }>> {
    // Simplified implementation - could be enhanced with daily aggregation
    return [];
  }
}