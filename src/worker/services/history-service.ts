// src/worker/services/history-service.ts
// Service for history management operations (modular refactor)

import { getSupabase } from '../lib/supabase';
import { getUserIdFromToken } from '../lib/auth-utils';

export interface HistoryServiceRequest {
  conversationId?: string; // Optional for cross-conversation search
  entryId?: string;
  query?: string;
  data?: any;
  metadata?: Record<string, any>;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
  env?: any;
  token?: string;
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
    // TODO: Implement history deletion logic
    throw new Error('Not implemented: HistoryService.deleteHistory');
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
      userId = await getUserIdFromToken(req.token);
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
    // TODO: Implement history export logic
    throw new Error('Not implemented: HistoryService.exportHistory');
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
    // TODO: Implement success tracking logic
    throw new Error('Not implemented: HistoryService.getSuccessTracking');
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
