import { SearchHistoryItem, SearchAnalytics, safeDate } from '../../lib/ai-types';
import { getSupabase } from './supabase';
import type { Database } from '../types/supabase_types';

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
    if (!env) {
      throw new Error('Environment object is required for SearchAnalyticsManager');
    }
    
    
    this.env = env;
  }

  /**
   * Protected getter for accessing the environment
   */
  protected getEnvironment() {
    return this.env;
  }

  /**
   * Check if database is available
   */
  protected isDatabaseAvailable(): boolean {
    return !!(this.env && this.env.DB);
  }

  /**
   * Record a new search session
   */
  async recordSearchSession(sessionData: Omit<SearchSession, 'id' | 'createdAt'>): Promise<string> {
    try {
      const supabase = getSupabase(this.env);
      const sessionId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('search_sessions')
        .insert({
          id: sessionId,
          conversation_id: sessionData.conversationId,
          user_id: sessionData.userId,
          search_query: sessionData.searchQuery,
          content_sources: sessionData.contentSources,
          search_filters: sessionData.searchFilters,
          results_count: sessionData.resultsCount,
          results_accepted: sessionData.resultsAccepted,
          results_rejected: sessionData.resultsRejected,
          search_success: sessionData.searchSuccess,
          processing_time_ms: sessionData.processingTimeMs,
          error_message: sessionData.errorMessage || null
        });

      if (error) {
        console.error('Error recording search session:', error);
        throw error;
      }

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
      const supabase = getSupabase(this.env);
      const { error } = await supabase
        .from('search_results')
        .insert({
          id: resultId,
          search_session_id: resultData.searchSessionId,
          reference_id: resultData.referenceId || null,
          result_title: resultData.resultTitle,
          result_authors: resultData.resultAuthors,
          result_journal: resultData.resultJournal || null,
          result_year: resultData.resultYear || null,
          result_doi: resultData.resultDoi || null,
          result_url: resultData.resultUrl || null,
          relevance_score: resultData.relevanceScore,
          confidence_score: resultData.confidenceScore,
          quality_score: resultData.qualityScore,
          citation_count: resultData.citationCount,
          user_action: resultData.userAction || null,
          user_feedback_rating: resultData.userFeedbackRating || null,
          user_feedback_comments: resultData.userFeedbackComments || null,
          added_to_library: resultData.addedToLibrary,
          added_at: resultData.addedAt?.toISOString() || null
        });

      if (error) {
        console.error('Error recording search result:', error);
        throw error;
      }

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
      const supabase = getSupabase(this.env);
      const updateData: any = {
        user_action: action,
        added_to_library: action === 'added',
        added_at: action === 'added' ? new Date().toISOString() : null
      };

      if (referenceId && action === 'added') {
        updateData.reference_id = referenceId;
      }

      const { error } = await supabase
        .from('search_results')
        .update(updateData)
        .eq('id', resultId);

      if (error) {
        console.error('Error updating search result action:', error);
        throw error;
      }

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
      const supabase = getSupabase(this.env);
      const { error } = await supabase
        .from('search_feedback')
        .insert({
          id: feedbackId,
          search_session_id: feedbackData.searchSessionId,
          user_id: feedbackData.userId,
          overall_satisfaction: feedbackData.overallSatisfaction,
          relevance_rating: feedbackData.relevanceRating,
          quality_rating: feedbackData.qualityRating,
          ease_of_use_rating: feedbackData.easeOfUseRating,
          feedback_comments: feedbackData.feedbackComments || null,
          would_recommend: feedbackData.wouldRecommend,
          improvement_suggestions: feedbackData.improvementSuggestions || null
        });

      if (error) {
        console.error('Error recording search feedback:', error);
        throw error;
      }

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
      const supabase = getSupabase(this.env);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Get search sessions with their results
      let sessionsQuery = supabase
        .from('search_sessions')
        .select('id, results_count')
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString());
      
      if (conversationId) {
        sessionsQuery = sessionsQuery.eq('conversation_id', conversationId);
      }
      
      const { data: sessions, error: sessionsError } = await sessionsQuery;
      
      if (sessionsError) {
        console.error('Error getting search sessions:', sessionsError);
        throw sessionsError;
      }
      
      // Get search results with user actions
      const sessionIds = sessions.map(session => session.id);
      let resultsQuery = supabase
        .from('search_results')
        .select('user_action')
        .in('search_session_id', sessionIds);
      
      const { data: results, error: resultsError } = await resultsQuery;
      
      if (resultsError) {
        console.error('Error getting search results:', resultsError);
        throw resultsError;
      }
      
      // Calculate metrics
      const totalSearches = sessions.length;
      const totalResults = sessions.reduce((sum, session) => sum + (session.results_count || 0), 0);
      const resultsViewed = results.filter(result => result.user_action === 'viewed').length;
      const resultsAdded = results.filter(result => result.user_action === 'added').length;
      const resultsRejected = results.filter(result => result.user_action === 'rejected').length;

      return {
        totalSearches,
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
      const supabase = getSupabase(this.env);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Get feedback data with session information
      let feedbackQuery = supabase
        .from('search_feedback')
        .select(`
          overall_satisfaction,
          relevance_rating,
          quality_rating,
          ease_of_use_rating,
          would_recommend
        `)
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString());
      
      // Join with search_sessions to filter by conversationId if needed
      if (conversationId) {
        feedbackQuery = feedbackQuery.eq('conversation_id', conversationId);
      }
      
      const { data: feedbackData, error: feedbackError } = await feedbackQuery;
      
      if (feedbackError) {
        console.error('Error getting user satisfaction metrics:', feedbackError);
        throw feedbackError;
      }
      
      // Calculate metrics from the data
      const totalFeedbackCount = feedbackData.length;
      
      if (totalFeedbackCount === 0) {
        return {
          averageOverallSatisfaction: 0,
          averageRelevanceRating: 0,
          averageQualityRating: 0,
          averageEaseOfUseRating: 0,
          recommendationRate: 0,
          totalFeedbackCount: 0
        };
      }
      
      // Calculate averages
      const avgOverallSatisfaction = feedbackData.reduce((sum, item) => sum + (item.overall_satisfaction || 0), 0) / totalFeedbackCount;
      const avgRelevanceRating = feedbackData.reduce((sum, item) => sum + (item.relevance_rating || 0), 0) / totalFeedbackCount;
      const avgQualityRating = feedbackData.reduce((sum, item) => sum + (item.quality_rating || 0), 0) / totalFeedbackCount;
      const avgEaseOfUseRating = feedbackData.reduce((sum, item) => sum + (item.ease_of_use_rating || 0), 0) / totalFeedbackCount;
      
      // Calculate recommendation rate
      const wouldRecommendCount = feedbackData.filter(item => item.would_recommend).length;
      const recommendationRate = (wouldRecommendCount / totalFeedbackCount) * 100;

      return {
        averageOverallSatisfaction: avgOverallSatisfaction,
        averageRelevanceRating: avgRelevanceRating,
        averageQualityRating: avgQualityRating,
        averageEaseOfUseRating: avgEaseOfUseRating,
        recommendationRate,
        totalFeedbackCount
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
      const supabase = getSupabase(this.env);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Get basic search statistics
      let sessionsQuery = supabase
        .from('search_sessions')
        .select('search_success, results_count, processing_time_ms')
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString());
      
      if (conversationId) {
        sessionsQuery = sessionsQuery.eq('conversation_id', conversationId);
      }
      
      const { data: sessions, error: sessionsError } = await sessionsQuery;
      
      if (sessionsError) {
        console.error('Error getting search sessions:', sessionsError);
        throw sessionsError;
      }
      
      // Calculate statistics
      const totalSearches = sessions.length;
      const successfulSearches = sessions.filter(session => session.search_success).length;
      const avgResults = totalSearches > 0 
        ? sessions.reduce((sum, session) => sum + ((session.results_count ?? 0) as number), 0) / totalSearches 
        : 0;
      const avgProcessingTime = totalSearches > 0 
        ? sessions.reduce((sum, session) => sum + ((session.processing_time_ms ?? 0) as number), 0) / totalSearches 
        : 0;
      
      // Get search queries for popular topics
      let queriesQuery = supabase
        .from('search_sessions')
        .select('search_query, content_sources')
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString());
      
      if (conversationId) {
        queriesQuery = queriesQuery.eq('conversation_id', conversationId);
      }
      
      const { data: queries, error: queriesError } = await queriesQuery;
      
      if (queriesError) {
        console.error('Error getting search queries:', queriesError);
        throw queriesError;
      }
      
      // Extract popular topics and sources
      const popularTopics = this.extractPopularTopics(queries.map(q => q.search_query));
      const contentSourcesFlat = (queries.map(q => q.content_sources as any))
        .filter((source): source is string[] => Array.isArray(source))
        .flat();
      const popularSources = this.extractPopularSources(contentSourcesFlat.filter((s): s is string => typeof s === 'string'));
      
      const successRate = totalSearches > 0 ? successfulSearches / totalSearches : 0;
      
      return {
        total_searches: totalSearches,
        average_results: avgResults,
        popular_sources: popularSources,
        search_frequency: {}, // Could be enhanced with daily/weekly frequency
        period: {
          start: cutoffDate.toISOString(),
          end: new Date().toISOString()
        },
        successRate,
        popularTopics,
        averageResults: avgResults,
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
      const supabase = getSupabase(this.env);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Get search results with session information
      let resultsQuery = supabase
        .from('search_results')
        .select(`
          id,
          search_session_id,
          reference_id,
          result_title,
          result_authors,
          result_journal,
          result_year,
          result_doi,
          result_url,
          relevance_score,
          confidence_score,
          quality_score,
          citation_count,
          user_action,
          user_feedback_rating,
          user_feedback_comments,
          added_to_library,
          added_at,
          created_at
        `)
        .gte('created_at', cutoffDate.toISOString());
      
      // Join with search_sessions to filter by user and conversation
      if (conversationId) {
        resultsQuery = resultsQuery.eq('conversation_id', conversationId);
      }
      
      // We need to join with search_sessions to get the user_id
      const { data: searchResults, error: resultsError } = await supabase
        .from('search_results')
        .select('*')
        .gte('created_at', cutoffDate.toISOString());
      
      if (resultsError) {
        console.error('Error getting search results:', resultsError);
        throw resultsError;
      }
      
      // Filter by conversationId if needed
      const filteredResults = conversationId && searchResults
        ? (searchResults as any[]).filter(result => result.conversation_id === conversationId)
        : searchResults;
      
      // Calculate metrics
      const resultsByAction: Record<string, number> = {};
      let totalRelevanceScore = 0;
      let totalQualityScore = 0;
      let scoredResults = 0;

      filteredResults.forEach((result: any) => {
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
      const topPerformingResults = filteredResults
        .filter((r: any) => r.relevance_score && r.quality_score)
        .sort((a: any, b: any) => (b.relevance_score + b.quality_score) - (a.relevance_score + a.quality_score))
        .slice(0, 10)
        .map(this.mapDatabaseResultToSearchResult);

      return {
        totalResults: filteredResults.length,
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
    // Check if DB is available
    if (!this.isDatabaseAvailable()) {
      console.warn('Database not available, cannot clear analytics data');
      return;
    }

    try {
      const supabase = getSupabase(this.env);
      
      // Delete search feedback
      let feedbackQuery = supabase
        .from('search_feedback')
        .delete()
        .eq('user_id', userId);
      
      if (conversationId) {
        feedbackQuery = feedbackQuery.eq('conversation_id', conversationId);
      }
      
      const { error: feedbackError } = await feedbackQuery;
      
      if (feedbackError) {
        console.error('Error clearing search feedback:', feedbackError);
        throw feedbackError;
      }
      
      // Delete search results
      let resultsQuery = supabase
        .from('search_results')
        .delete()
        .eq('user_id', userId);
      
      if (conversationId) {
        resultsQuery = resultsQuery.eq('conversation_id', conversationId);
      }
      
      const { error: resultsError } = await resultsQuery;
      
      if (resultsError) {
        console.error('Error clearing search results:', resultsError);
        throw resultsError;
      }
      
      // Delete search sessions
      let sessionsQuery = supabase
        .from('search_sessions')
        .delete()
        .eq('user_id', userId);
      
      if (conversationId) {
        sessionsQuery = sessionsQuery.eq('conversation_id', conversationId);
      }
      
      const { error: sessionsError } = await sessionsQuery;
      
      if (sessionsError) {
        console.error('Error clearing search sessions:', sessionsError);
        throw sessionsError;
      }
      
      // Delete search analytics
      let analyticsQuery = supabase
        .from('search_analytics')
        .delete()
        .eq('user_id', userId);
      
      if (conversationId) {
        analyticsQuery = analyticsQuery.eq('conversation_id', conversationId);
      }
      
      const { error: analyticsError } = await analyticsQuery;
      
      if (analyticsError) {
        console.error('Error clearing search analytics:', analyticsError);
        throw analyticsError;
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
      resultAuthors: dbResult.result_authors || [],
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