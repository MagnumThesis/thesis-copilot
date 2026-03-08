// src/worker/services/history-service.ts
// Service for history management operations (modular refactor)

import { getSupabase } from '../lib/supabase';
import { getUserIdFromToken } from '../lib/auth-utils';
import { EnhancedSearchHistoryManager } from '../lib/enhanced-search-history-manager';
import { SearchHistoryManager } from '../lib/search-history-manager';

export interface HistoryServiceRequest {
  conversationId?: string; // Optional for cross-conversation search
  entryId?: string;
  query?: string;
  data?: any;
  metadata?: Record<string, any>;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
  env?: any; // Cloudflare environment bindings
  token?: string;
}

export interface HistoryServiceResponse {
  success: boolean;
  data?: any[];
  entry?: any;
  stats?: any;
  total?: number;
  metadata: Record<string, any>;
}

export class HistoryService {
  /**
   * Retrieves conversation history
   */
  static async getHistory(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    if (!req.conversationId) {
      throw new Error('Invalid request: missing conversationId');
    }

    const limit = req.limit && req.limit > 0 ? req.limit : 10;
    const offset = req.offset && req.offset >= 0 ? req.offset : 0;

    let userId = 'anonymous';
    if (req.token && req.env?.SUPABASE_JWT_SECRET) {
      userId = await getUserIdFromToken(req.token, req.env.SUPABASE_JWT_SECRET) || 'anonymous';
    } else if (req.metadata?.userId) {
      userId = req.metadata.userId;
    }

    try {
      if (req.env) {
        const { EnhancedSearchHistoryManager } = await import('../lib/enhanced-search-history-manager');
        const historyManager = new EnhancedSearchHistoryManager(req.env);

        const historyFilter = req.filters ? {
          query: typeof req.filters.query === 'string' ? req.filters.query : undefined,
          hasResults: req.filters.hasResults === true || req.filters.hasResults === 'true'
        } : undefined;

        const result = await historyManager.getSearchHistory(
          userId,
          req.conversationId,
          historyFilter,
          limit,
          offset
        );

        return {
          success: true,
          data: result.entries,
          total: result.total,
          metadata: {
            conversationId: req.conversationId,
            limit,
            offset,
            hasMore: result.hasMore
          }
        };
      }

      // Fallback if no env available
      return {
        success: true,
        data: [],
        total: 0,
        metadata: {
          conversationId: req.conversationId,
          limit,
          offset,
          hasMore: false,
          warning: 'No environment provided for database connection'
        }
      };
    } catch (error) {
      console.error('Error fetching history in HistoryService:', error);

      return {
        success: false,
        data: [],
        total: 0,
        metadata: {
          conversationId: req.conversationId,
          limit,
          offset,
          hasMore: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred while fetching history'
        }
      };
    }
  }

  /**
   * Saves conversation history entry
   */
  static async saveHistory(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    if (!req.conversationId) {
      throw new Error('Invalid request: missing conversationId');
    }

    if (!req.data) {
      throw new Error('Invalid request: missing data');
    }

    const entryId = crypto.randomUUID();
    const savedAt = new Date().toISOString();

    const entry = {
      id: entryId,
      conversationId: req.conversationId,
      savedAt: savedAt,
      ...req.data
    };

    // If environment is available, persist the data
    if (req.env) {
      try {
        const { getSupabase } = await import('../lib/supabase');
        const supabase = getSupabase(req.env);

        // Ensure userId is available, fallback if not
        const userId = req.metadata?.userId || 'system';

        if (req.data.type === 'search') {
          // If it is a search history item, save basic record to search_sessions
          await supabase.from('search_sessions').insert({
            id: entryId,
            conversation_id: req.conversationId,
            user_id: userId,
            search_query: req.data.query || 'unknown search',
            content_sources: req.data.contentSources || [],
            search_success: req.data.success !== false,
            results_count: req.data.resultCount || 0
          });
        } else {
          // Fallback: save generic user actions or data into messages table as a system message
          await supabase.from('messages').insert({
            id: entryId,
            chat_id: req.conversationId,
            role: 'system',
            content: JSON.stringify({
              action_type: req.data.type || 'generic_history_event',
              data: req.data,
              metadata: req.metadata
            }),
            message_id: entryId
          });
        }
      } catch (err) {
        console.error('Error persisting history entry:', err);
      }
    }

    return {
      success: true,
      entry: entry,
      metadata: req.metadata || {}
    };
  }

  /**
   * Deletes conversation history
   */
  static async deleteHistory(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    const { conversationId, entryId, metadata } = req;

    if (!conversationId) {
      throw new Error('conversationId is required for deletion');
    }

    try {
      // Pass env from metadata if available (useful for test mocks or passing Cloudflare context env)
      const supabase = getSupabase(metadata?.env);
      let deletedCount = 0;

      if (entryId) {
        // Delete specific entry related data
        await supabase.from('search_feedback').delete().eq('search_session_id', entryId);
        await supabase.from('search_results').delete().eq('search_session_id', entryId);

        const query = supabase.from('search_sessions').delete().eq('id', entryId);

        if (conversationId) {
          query.eq('conversation_id', conversationId);
        }

        const { data, error } = await query.select();

        if (error) throw error;
        deletedCount = data ? data.length : 0;
      } else {
        // Delete full conversation related data
        // Let's get the sessions first to delete the related results and feedback
        const { data: sessions } = await supabase
          .from('search_sessions')
          .select('id')
          .eq('conversation_id', conversationId);

        if (sessions && sessions.length > 0) {
          const sessionIds = sessions.map(s => s.id);

          await supabase.from('search_feedback').delete().in('search_session_id', sessionIds);
          await supabase.from('search_results').delete().in('search_session_id', sessionIds);
        }

        const { data, error } = await supabase
          .from('search_sessions')
          .delete()
          .eq('conversation_id', conversationId)
          .select();

        if (error) throw error;
        deletedCount = data ? data.length : 0;
      }

      return {
        success: true,
        metadata: {
          deletedCount,
          deletedAt: new Date().toISOString(),
          conversationId
        }
      };
    } catch (error) {
      console.error('Error deleting history:', error);
      throw error;
    }
  }

  /**
   * Searches conversation history
   */
  static async searchHistory(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    if (!req.query || req.query.trim() === '') {
      throw new Error('Search query is required');
    }

    const limit = req.limit && req.limit > 0 ? req.limit : 50;
    const offset = req.offset && req.offset >= 0 ? req.offset : 0;
    const userId = req.metadata?.userId || 'anonymous';
    const conversationId = req.conversationId;

    try {
      // Use env from request or metadata
      const env = req.env || req.metadata?.env;

      if (env) {
        // Dynamic import to avoid circular dependencies
        const { EnhancedSearchHistoryManager } = await import('../lib/enhanced-search-history-manager');
        const historyManager = new EnhancedSearchHistoryManager(env);

        const historyFilter: any = {
          searchQuery: req.query,
          ...req.filters
        };

        const result = await historyManager.getSearchHistory(
          userId,
          conversationId,
          historyFilter,
          limit,
          offset
        );

        return {
          success: true,
          data: result.entries,
          total: result.total,
          metadata: {
            conversationId,
            userId,
            limit,
            offset,
            hasMore: result.hasMore,
            query: req.query
          }
        };
      }

      // Fallback if no env available
      return {
        success: true,
        data: [],
        total: 0,
        metadata: {
          conversationId,
          userId,
          limit,
          offset,
          hasMore: false,
          query: req.query,
          warning: 'No environment provided for database connection'
        }
      };
    } catch (error) {
      console.error('Error searching history:', error);

      return {
        success: false,
        data: [],
        total: 0,
        metadata: {
          conversationId,
          userId,
          limit,
          offset,
          hasMore: false,
          query: req.query,
          error: error instanceof Error ? error.message : 'Unknown error occurred while searching history'
        }
      };
    }
  }

  /**
   * Clears conversation history
   */
  static async clearHistory(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    if (!req.conversationId) {
      throw new Error('conversationId is required to clear history');
    }
    if (!req.env) {
      throw new Error('env is required to clear history');
    }

    const supabase = getSupabase(req.env);
    const conversationId = req.conversationId;

    let userId: string | null = null;
    if (req.token) {
      userId = await getUserIdFromToken(req.token, req.env?.SUPABASE_JWT_SECRET || '');
    } else if (req.metadata?.userId) {
      userId = req.metadata.userId;
    }

    if (userId) {
      const { error } = await supabase.rpc('cleanup_old_data_for_user', {
        target_conversation_id: conversationId,
        target_user_id: userId
      });
      if (error) {
        console.error('Error calling cleanup RPC:', error);
      }
    }

    // Manual cleanup as fallback/primary
    const { data: sessions } = await supabase.from('search_sessions').select('id').eq('conversation_id', conversationId);
    const sessionIds = sessions?.map(s => s.id) || [];

    if (sessionIds.length > 0) {
      await supabase.from('search_feedback').delete().in('search_session_id', sessionIds);
      await supabase.from('search_results').delete().in('search_session_id', sessionIds);
      await supabase.from('user_feedback_learning').delete().in('search_session_id', sessionIds);
    }

    await Promise.all([
      supabase.from('messages').delete().eq('chat_id', conversationId),
      supabase.from('ideas').delete().eq('conversationid', conversationId),
      supabase.from('builder_content').delete().eq('conversation_id', conversationId),
      supabase.from('citation_instances').delete().eq('conversation_id', conversationId),
      supabase.from('privacy_settings').delete().eq('conversation_id', conversationId),
      supabase.from('proofreading_concerns').delete().eq('conversation_id', conversationId),
      supabase.from('proofreading_sessions').delete().eq('conversation_id', conversationId),
      supabase.from('references').delete().eq('conversation_id', conversationId),
      supabase.from('search_analytics').delete().eq('conversation_id', conversationId),
      supabase.from('search_sessions').delete().eq('conversation_id', conversationId)
    ]);

    return {
      success: true,
      metadata: {
        operation: 'clear-history',
        clearedConversationId: conversationId
      }
    };
  }

  /**
   * Exports conversation history
   */
  static async exportHistory(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    if (!req.conversationId) {
      throw new Error('Conversation ID is required for export');
    }

    const format = req.metadata?.format === 'csv' ? 'csv' : 'json';
    const manager = new SearchHistoryManager();
    const exportData = await manager.exportHistory(req.conversationId, format);

    return {
      success: true,
      data: [exportData],
      metadata: {
        conversationId: req.conversationId,
        format,
        exportedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Gets history statistics
   */
  static async getHistoryStats(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    if (!req.env) {
      throw new Error('Environment object is required for getting history statistics');
    }

    const userId = req.metadata?.userId || 'unknown';
    const days = req.metadata?.days ? parseInt(req.metadata.days, 10) : 30;
    const conversationId = req.conversationId;

    try {
      const manager = new EnhancedSearchHistoryManager(req.env);
      const stats = await manager.getSearchHistoryStats(userId, conversationId, days);

      return {
        success: true,
        stats,
        metadata: {
          operation: 'get-history-stats',
          userId,
          conversationId,
          days
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching history stats';
      throw new Error(`Failed to get history statistics: ${errorMessage}`);
    }
  }

  /**
   * Gets content usage statistics
   */
  static async getContentUsage(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    if (!req.env) {
      throw new Error('Environment object is required for getting content usage statistics');
    }

    const userId = req.metadata?.userId || 'unknown';
    const days = req.metadata?.days ? parseInt(req.metadata.days, 10) : 30;
    const conversationId = req.conversationId;

    try {
      const manager = new EnhancedSearchHistoryManager(req.env);
      const usage = await manager.getContentSourceUsage(userId, conversationId, days);

      return {
        success: true,
        data: usage,
        metadata: {
          operation: 'get-content-usage',
          userId,
          conversationId,
          days
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching content usage statistics';
      throw new Error(`Failed to get content usage statistics: ${errorMessage}`);
    }
  }

  /**
   * Gets success tracking data
   */
  static async getSuccessTracking(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    if (!req.conversationId) {
      throw new Error('Invalid request: missing conversationId');
    }

    let trackingData = null;

    if (req.metadata?.env && req.metadata?.userId) {
      const historyManager = new EnhancedSearchHistoryManager(req.metadata.env);
      try {
        const result = await historyManager.getSearchSuccessRateTracking(
          req.metadata.userId,
          req.conversationId,
          30 // Default 30 days
        );
        trackingData = result;
      } catch (error) {
        console.warn('Failed to retrieve success rate tracking data:', error);
      }
    }

    // Fallback to default format if not retrieved
    if (!trackingData) {
      trackingData = [{
        conversationId: req.conversationId,
        successfulRequests: 0,
        totalRequests: 0,
        successRate: 0,
        lastSuccessfulAction: null
      }];
    }

    return {
      success: true,
      data: trackingData,
      metadata: {
        operation: 'get-success-tracking',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Gets next batch of history items
   */
  static async getNextBatch(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    // Implement next batch logic with pagination standards (offset-based)
    const limit = req.limit && req.limit > 0 ? req.limit : 10;
    const offset = req.offset && req.offset >= 0 ? req.offset : 0;
    const userId = req.metadata?.userId || 'anonymous';
    const conversationId = req.conversationId;

    try {
      // If we have an environment object with database access, use the manager
      if (req.metadata && req.metadata.env) {
        // Dynamic import to avoid circular dependencies if any
        const { EnhancedSearchHistoryManager } = await import('../lib/enhanced-search-history-manager');
        const historyManager = new EnhancedSearchHistoryManager(req.metadata.env);

        // Pass the request filters to the history manager's filter object
        const historyFilter = req.filters ? {
          query: typeof req.filters.query === 'string' ? req.filters.query : undefined,
          hasResults: req.filters.hasResults === true || req.filters.hasResults === 'true'
        } : undefined;

        const result = await historyManager.getSearchHistory(
          userId,
          conversationId,
          historyFilter,
          limit,
          offset
        );

        return {
          success: true,
          data: result.entries,
          total: result.total,
          metadata: {
            conversationId,
            userId,
            limit,
            offset,
            hasMore: result.hasMore
          }
        };
      }

      // Fallback if no env available (e.g., in some test environments without db mock)
      return {
        success: true,
        data: [],
        total: 0,
        metadata: {
          conversationId,
          userId,
          limit,
          offset,
          hasMore: false,
          warning: 'No environment provided for database connection'
        }
      };
    } catch (error) {
      console.error('Error fetching next batch in HistoryService:', error);

      return {
        success: false,
        data: [],
        total: 0,
        metadata: {
          conversationId,
          userId,
          limit,
          offset,
          hasMore: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred while fetching history'
        }
      };
    }
  }

  /**
   * Gets search session details
   */
  static async getSearchSessionDetails(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    const sessionId = req.metadata?.sessionId;

    if (!sessionId) {
      throw new Error('Invalid request: missing sessionId in metadata');
    }

    if (!req.env) {
      throw new Error('Environment object is required for getting session details');
    }

    try {
      // Dynamic import to avoid circular dependencies if any
      const { EnhancedSearchHistoryManager } = await import('../lib/enhanced-search-history-manager');
      const manager = new EnhancedSearchHistoryManager(req.env);

      const details = await manager.getSearchSessionDetails(sessionId);

      if (!details) {
        return {
          success: false,
          metadata: {
            operation: 'get-session-details',
            sessionId,
            error: 'Session not found'
          }
        };
      }

      return {
        success: true,
        data: [details],
        metadata: {
          operation: 'get-session-details',
          sessionId
        }
      };
    } catch (error) {
      console.error('Error fetching search session details:', error);

      return {
        success: false,
        metadata: {
          operation: 'get-session-details',
          sessionId,
          error: error instanceof Error ? error.message : 'Unknown error occurred while fetching session details'
        }
      };
    }
  }
}
