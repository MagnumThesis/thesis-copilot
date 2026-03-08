// src/worker/services/history-service.ts
// Service for history management operations (modular refactor)

import { getSupabase } from '../lib/supabase';
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
}

export interface HistoryServiceResponse {
  success: boolean;
  data?: any[];
  entry?: any;
  total?: number;
  metadata: Record<string, any>;
}

export class HistoryService {
  /**
   * Retrieves conversation history
   */
  static async getHistory(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    // TODO: Implement history retrieval logic
    throw new Error('Not implemented: HistoryService.getHistory');
  }

  /**
   * Saves conversation history entry
   */
  static async saveHistory(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    // TODO: Implement history saving logic
    throw new Error('Not implemented: HistoryService.saveHistory');
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
    // TODO: Implement history search logic
    throw new Error('Not implemented: HistoryService.searchHistory');
  }

  /**
   * Clears conversation history
   */
  static async clearHistory(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    // TODO: Implement history clearing logic
    throw new Error('Not implemented: HistoryService.clearHistory');
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
    // TODO: Implement history stats logic
    throw new Error('Not implemented: HistoryService.getHistoryStats');
  }

  /**
   * Gets content usage statistics
   */
  static async getContentUsage(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    // TODO: Implement content usage logic
    throw new Error('Not implemented: HistoryService.getContentUsage');
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
    // TODO: Implement next batch logic
    throw new Error('Not implemented: HistoryService.getNextBatch');
  }

  /**
   * Gets search session details
   */
  static async getSearchSessionDetails(req: HistoryServiceRequest): Promise<HistoryServiceResponse> {
    // TODO: Implement session details logic
    throw new Error('Not implemented: HistoryService.getSearchSessionDetails');
  }
}
