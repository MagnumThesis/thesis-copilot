import { SearchAnalyticsManager } from './search-analytics-manager';
import { FeedbackLearningSystem } from './feedback-learning-system';
import { getSupabase } from './supabase';
import type { Database } from '../types/supabase_types';

/**
 * Privacy Manager
 * Handles privacy controls, data retention, and user consent management
 * for the AI Reference Searcher system
 */

export interface PrivacySettings {
  userId: string;
  conversationId?: string;
  dataRetentionDays: number;
  autoDeleteEnabled: boolean;
  analyticsEnabled: boolean;
  learningEnabled: boolean;
  exportFormat: 'json' | 'csv';
  consentGiven: boolean;
  consentDate?: Date;
  lastUpdated: Date;
}

export interface DataSummary {
  searchSessions: number;
  searchResults: number;
  feedbackEntries: number;
  learningData: number;
  totalSize: string;
  oldestEntry?: Date;
  newestEntry?: Date;
}

export interface ExportData {
  metadata: {
    exportDate: Date;
    userId: string;
    conversationId?: string;
    format: 'json' | 'csv';
    recordCount: number;
  };
  searchSessions: any[];
  searchResults: any[];
  feedback: any[];
  learningData: any[];
  analytics: any[];
}

export class PrivacyManager {
  private analyticsManager: SearchAnalyticsManager;
  private learningSystem: FeedbackLearningSystem;

  constructor(private env: any) {
    if (!env) {
      throw new Error('Environment object is required for PrivacyManager');
    }
    
    this.analyticsManager = new SearchAnalyticsManager(env);
    this.learningSystem = new FeedbackLearningSystem(env);
  }

  /**
   * Get privacy settings for a user
   */
  async getPrivacySettings(userId: string, conversationId?: string): Promise<PrivacySettings | null> {
    try {
      const supabase = getSupabase(this.env);

      let query = supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .order('last_updated', { ascending: false })
        .limit(1);

      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      } else {
        // For global settings, we might want to handle null conversation_id differently
        query = query.is('conversation_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting privacy settings:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        // Return default settings if none exist
        return {
          userId,
          conversationId,
          dataRetentionDays: 365,
          autoDeleteEnabled: false,
          analyticsEnabled: true,
          learningEnabled: true,
          exportFormat: 'json',
          consentGiven: false,
          lastUpdated: new Date()
        };
      }

      const result = data[0];

      return {
        userId: result.user_id,
        conversationId: result.conversation_id,
        dataRetentionDays: result.data_retention_days,
        autoDeleteEnabled: result.auto_delete_enabled,
        analyticsEnabled: result.analytics_enabled,
        learningEnabled: result.learning_enabled,
        exportFormat: result.export_format as 'json' | 'csv',
        consentGiven: result.consent_given,
        consentDate: result.consent_date ? new Date(result.consent_date) : undefined,
        lastUpdated: new Date(result.last_updated)
      };
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      throw error;
    }
  }

  /**
   * Update privacy settings for a user
   */
  async updatePrivacySettings(settings: PrivacySettings): Promise<void> {
    try {
      const supabase = getSupabase(this.env);

      const { error } = await supabase
        .from('privacy_settings')
        .upsert({
          user_id: settings.userId,
          conversation_id: settings.conversationId || null,
          data_retention_days: settings.dataRetentionDays,
          auto_delete_enabled: settings.autoDeleteEnabled,
          analytics_enabled: settings.analyticsEnabled,
          learning_enabled: settings.learningEnabled,
          export_format: settings.exportFormat,
          consent_given: settings.consentGiven,
          consent_date: settings.consentDate?.toISOString() || null,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id,conversation_id'
        });

      if (error) {
        console.error('Error updating privacy settings:', error);
        throw error;
      }

      console.log(`Privacy settings updated for user ${settings.userId}`);
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  /**
   * Get data summary for a user
   */
  async getDataSummary(userId: string, conversationId?: string): Promise<DataSummary> {
    try {
      const supabase = getSupabase(this.env);

      // Build query conditions
      const userFilter = `user_id.eq.${userId}`;
      
      let sessionFilter = userFilter;
      let resultFilter = `search_session_id.in.(${sessionFilter})`;
      let feedbackFilter = `search_session_id.in.(${sessionFilter})`;
      let learningFilter = userFilter;
      
      if (conversationId) {
        sessionFilter += `,conversation_id.eq.${conversationId}`;
        resultFilter = `search_session_id.in.(${sessionFilter})`;
        feedbackFilter = `search_session_id.in.(${sessionFilter})`;
        learningFilter += `,conversation_id.eq.${conversationId}`;
      }

      // Get search sessions count and date range
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('search_sessions')
        .select('count(), min(created_at), max(created_at)')
        .eq('user_id', userId)
        .maybeSingle();

      if (sessionsError) {
        console.error('Error getting search sessions data:', sessionsError);
        throw sessionsError;
      }

      // Get search results count
      // First get session IDs for the user/conversation
      const { data: sessionIds, error: sessionIdsError } = await supabase
        .from('search_sessions')
        .select('id')
        .eq('user_id', userId);
      
      if (sessionIdsError) {
        console.error('Error getting session IDs:', sessionIdsError);
        throw sessionIdsError;
      }

      let resultsCount = 0;
      if (sessionIds && sessionIds.length > 0) {
        const sessionIdList = sessionIds.map(s => s.id);
        const { count: resultsCountResult, error: resultsCountError } = await supabase
          .from('search_results')
          .select('*', { count: 'exact', head: true })
          .in('search_session_id', sessionIdList);
        
        if (resultsCountError) {
          console.error('Error getting search results count:', resultsCountError);
          throw resultsCountError;
        }
        
        resultsCount = resultsCountResult || 0;
      }

      // Get feedback count
      let feedbackCount = 0;
      if (sessionIds && sessionIds.length > 0) {
        const sessionIdList = sessionIds.map(s => s.id);
        const { count: feedbackCountResult, error: feedbackCountError } = await supabase
          .from('search_feedback')
          .select('*', { count: 'exact', head: true })
          .in('search_session_id', sessionIdList);
        
        if (feedbackCountError) {
          console.error('Error getting feedback count:', feedbackCountError);
          throw feedbackCountError;
        }
        
        feedbackCount = feedbackCountResult || 0;
      }

      // Get learning data count
      const { count: learningCount, error: learningCountError } = await supabase
        .from('user_feedback_learning')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (learningCountError) {
        console.error('Error getting learning data count:', learningCountError);
        throw learningCountError;
      }

      // Calculate approximate storage size (rough estimate)
      const totalRecords = (sessionsData?.count || 0) + 
                          resultsCount + 
                          feedbackCount + 
                          (learningCount || 0);
      const estimatedSizeKB = Math.round(totalRecords * 2.5); // Rough estimate: 2.5KB per record
      const totalSize = estimatedSizeKB > 1024 
        ? `${(estimatedSizeKB / 1024).toFixed(1)} MB`
        : `${estimatedSizeKB} KB`;

      return {
        searchSessions: sessionsData?.count || 0,
        searchResults: resultsCount,
        feedbackEntries: feedbackCount,
        learningData: learningCount || 0,
        totalSize,
        oldestEntry: sessionsData?.min ? new Date(sessionsData.min) : undefined,
        newestEntry: sessionsData?.max ? new Date(sessionsData.max) : undefined
      };
    } catch (error) {
      console.error('Error getting data summary:', error);
      throw error;
    }
  }

  /**
   * Clear all data for a user
   */
  async clearAllData(userId: string, conversationId?: string): Promise<{ deletedCount: number }> {
    try {
      const supabase = getSupabase(this.env);
      let totalDeleted = 0;

      // Build filter conditions
      let userFilter = `user_id.eq.${userId}`;
      if (conversationId) {
        userFilter += ` ,conversation_id.eq.${conversationId}`;
      }

      // Clear learning data first (has foreign key to search_sessions)
      const { error: learningError } = await supabase
        .from('user_feedback_learning')
        .delete()
        .match({ user_id: userId });
      
      if (learningError) {
        console.error('Error clearing learning data:', learningError);
        throw learningError;
      }

      // Clear user preference patterns
      const { error: preferencesError } = await supabase
        .from('user_preference_patterns')
        .delete()
        .match({ user_id: userId });
      
      if (preferencesError) {
        console.error('Error clearing preference patterns:', preferencesError);
        throw preferencesError;
      }

      // Clear adaptive filters
      const { error: filtersError } = await supabase
        .from('adaptive_filters')
        .delete()
        .match({ user_id: userId });
      
      if (filtersError) {
        console.error('Error clearing adaptive filters:', filtersError);
        throw filtersError;
      }

      // Clear learning metrics
      const { error: metricsError } = await supabase
        .from('learning_metrics')
        .delete()
        .match({ user_id: userId });
      
      if (metricsError) {
        console.error('Error clearing learning metrics:', metricsError);
        throw metricsError;
      }

      // Use analytics manager to clear search data (handles cascading deletes)
      await this.analyticsManager.clearAnalyticsData(userId, conversationId);

      console.log(`Cleared all data for user ${userId}${conversationId ? ` in conversation ${conversationId}` : ''}`);
      
      // Note: We're not returning an accurate count since Supabase doesn't easily provide
      // the number of deleted rows in a single operation
      return { deletedCount: totalDeleted };
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  /**
   * Clear old data based on retention policy
   */
  async clearOldData(userId: string, retentionDays: number, conversationId?: string): Promise<{ deletedCount: number }> {
    try {
      const supabase = getSupabase(this.env);
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      // Build filter conditions
      let userFilter = `user_id.eq.${userId}`;
      let dateFilter = `created_at.lt.${cutoffDate.toISOString()}`;
      
      if (conversationId) {
        userFilter += `,conversation_id.eq.${conversationId}`;
      }

      // Clear old learning data
      const { error: learningError } = await supabase
        .from('user_feedback_learning')
        .delete()
        .match({ user_id: userId })
        .lt('created_at', cutoffDate.toISOString());
      
      if (learningError) {
        console.error('Error clearing old learning data:', learningError);
        throw learningError;
      }

      // Clear old adaptive filters
      const { error: filtersError } = await supabase
        .from('adaptive_filters')
        .delete()
        .match({ user_id: userId })
        .lt('created_at', cutoffDate.toISOString());
      
      if (filtersError) {
        console.error('Error clearing old adaptive filters:', filtersError);
        throw filtersError;
      }

      // Clear old search sessions and related data
      const { error: sessionsError } = await supabase
        .from('search_sessions')
        .delete()
        .match({ user_id: userId })
        .lt('created_at', cutoffDate.toISOString());
      
      if (sessionsError) {
        console.error('Error clearing old search sessions:', sessionsError);
        throw sessionsError;
      }

      console.log(`Cleared old records for user ${userId} (older than ${retentionDays} days)`);
      
      // Note: We're not returning an accurate count since Supabase doesn't easily provide
      // the number of deleted rows in a single operation
      return { deletedCount: 0 };
    } catch (error) {
      console.error('Error clearing old data:', error);
      throw error;
    }
  }

  /**
   * Export user data
   */
  async exportData(userId: string, format: 'json' | 'csv', conversationId?: string): Promise<{ exportData: string; recordCount: number }> {
    // Check if DB is available
    if (!this.env || !this.env.DB) {
      console.warn('Database not available, cannot export data');
      return { 
        exportData: JSON.stringify({ 
          error: 'Database not available', 
          message: 'Data export is not available at this time' 
        }, null, 2), 
        recordCount: 0 
      };
    }

    try {
      let whereClause = 'WHERE user_id = ?';
      const params = [userId];

      if (conversationId) {
        whereClause += ' AND conversation_id = ?';
        params.push(conversationId);
      }

      // Get all user data
      const exportData: ExportData = {
        metadata: {
          exportDate: new Date(),
          userId,
          conversationId,
          format,
          recordCount: 0
        },
        searchSessions: [],
        searchResults: [],
        feedback: [],
        learningData: [],
        analytics: []
      };

      // Export search sessions
      const sessionsQuery = `SELECT * FROM search_sessions ss ${whereClause} ORDER BY created_at DESC`;
      const sessionsResult = await this.env.DB.prepare(sessionsQuery).bind(...params).all();
      exportData.searchSessions = sessionsResult.results || [];

      // Export search results
      const resultsQuery = `
        SELECT sr.* FROM search_results sr
        JOIN search_sessions ss ON sr.search_session_id = ss.id
        ${whereClause}
        ORDER BY sr.created_at DESC
      `;
      const resultsResult = await this.env.DB.prepare(resultsQuery).bind(...params).all();
      exportData.searchResults = resultsResult.results || [];

      // Export feedback
      const feedbackQuery = `
        SELECT sf.* FROM search_feedback sf
        JOIN search_sessions ss ON sf.search_session_id = ss.id
        ${whereClause}
        ORDER BY sf.created_at DESC
      `;
      const feedbackResult = await this.env.DB.prepare(feedbackQuery).bind(...params).all();
      exportData.feedback = feedbackResult.results || [];

      // Export learning data
      const learningQuery = `SELECT * FROM user_feedback_learning ${whereClause.replace('ss.', '')} ORDER BY created_at DESC`;
      const learningResult = await this.env.DB.prepare(learningQuery).bind(...params).all();
      exportData.learningData = learningResult.results || [];

      // Export analytics
      const analyticsQuery = `SELECT * FROM search_analytics sa ${whereClause.replace('ss.', 'sa.')} ORDER BY created_at DESC`;
      const analyticsResult = await this.env.DB.prepare(analyticsQuery).bind(...params).all();
      exportData.analytics = analyticsResult.results || [];

      const totalRecords = exportData.searchSessions.length + 
                          exportData.searchResults.length + 
                          exportData.feedback.length + 
                          exportData.learningData.length + 
                          exportData.analytics.length;

      exportData.metadata.recordCount = totalRecords;

      if (format === 'json') {
        return {
          exportData: JSON.stringify(exportData, null, 2),
          recordCount: totalRecords
        };
      } else {
        // Convert to CSV format
        const csvData = this.convertToCSV(exportData);
        return {
          exportData: csvData,
          recordCount: totalRecords
        };
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Convert export data to CSV format
   */
  private convertToCSV(data: ExportData): string {
    const csvSections: string[] = [];

    // Metadata section
    csvSections.push('# Export Metadata');
    csvSections.push(`Export Date,${data.metadata.exportDate.toISOString()}`);
    csvSections.push(`User ID,${data.metadata.userId}`);
    csvSections.push(`Conversation ID,${data.metadata.conversationId || 'All'}`);
    csvSections.push(`Total Records,${data.metadata.recordCount}`);
    csvSections.push('');

    // Search Sessions
    if (data.searchSessions.length > 0) {
      csvSections.push('# Search Sessions');
      const sessionHeaders = Object.keys(data.searchSessions[0]).join(',');
      csvSections.push(sessionHeaders);
      data.searchSessions.forEach(session => {
        const values = Object.values(session).map(v => 
          typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
        ).join(',');
        csvSections.push(values);
      });
      csvSections.push('');
    }

    // Search Results
    if (data.searchResults.length > 0) {
      csvSections.push('# Search Results');
      const resultHeaders = Object.keys(data.searchResults[0]).join(',');
      csvSections.push(resultHeaders);
      data.searchResults.forEach(result => {
        const values = Object.values(result).map(v => 
          typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
        ).join(',');
        csvSections.push(values);
      });
      csvSections.push('');
    }

    // Feedback
    if (data.feedback.length > 0) {
      csvSections.push('# Feedback');
      const feedbackHeaders = Object.keys(data.feedback[0]).join(',');
      csvSections.push(feedbackHeaders);
      data.feedback.forEach(feedback => {
        const values = Object.values(feedback).map(v => 
          typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
        ).join(',');
        csvSections.push(values);
      });
      csvSections.push('');
    }

    // Learning Data
    if (data.learningData.length > 0) {
      csvSections.push('# Learning Data');
      const learningHeaders = Object.keys(data.learningData[0]).join(',');
      csvSections.push(learningHeaders);
      data.learningData.forEach(learning => {
        const values = Object.values(learning).map(v => 
          typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
        ).join(',');
        csvSections.push(values);
      });
      csvSections.push('');
    }

    return csvSections.join('\n');
  }

  /**
   * Check if user has given consent for data processing
   */
  async hasUserConsent(userId: string, conversationId?: string): Promise<boolean> {
    try {
      // If DB is not available, assume no consent
      if (!this.env || !this.env.DB) {
        console.warn('Database not available, assuming no user consent');
        return false;
      }

      const settings = await this.getPrivacySettings(userId, conversationId);
      return settings?.consentGiven || false;
    } catch (error) {
      console.error('Error checking user consent:', error);
      return false;
    }
  }

  /**
   * Run automatic cleanup based on retention policies
   */
  async runAutomaticCleanup(): Promise<{ usersProcessed: number; recordsDeleted: number }> {
    // Check if DB is available
    if (!this.env || !this.env.DB) {
      console.warn('Database not available, cannot run automatic cleanup');
      return { usersProcessed: 0, recordsDeleted: 0 };
    }

    try {
      // Get all users with auto-delete enabled
      const query = `
        SELECT DISTINCT user_id, conversation_id, data_retention_days
        FROM privacy_settings
        WHERE auto_delete_enabled = true AND consent_given = true
      `;

      const result = await this.env.DB.prepare(query).all();
      const settings = result.results || [];

      let totalDeleted = 0;
      let usersProcessed = 0;

      for (const setting of settings) {
        try {
          const { deletedCount } = await this.clearOldData(
            setting.user_id,
            setting.data_retention_days,
            setting.conversation_id
          );
          totalDeleted += deletedCount;
          usersProcessed++;
        } catch (error) {
          console.error(`Error cleaning up data for user ${setting.user_id}:`, error);
        }
      }

      console.log(`Automatic cleanup completed: ${usersProcessed} users processed, ${totalDeleted} records deleted`);
      
      return {
        usersProcessed,
        recordsDeleted: totalDeleted
      };
    } catch (error) {
      console.error('Error running automatic cleanup:', error);
      throw error;
    }
  }

  /**
   * Anonymize user data (for GDPR compliance)
   */
  async anonymizeUserData(userId: string): Promise<{ recordsAnonymized: number }> {
    // Check if DB is available
    if (!this.env || !this.env.DB) {
      console.warn('Database not available, cannot anonymize user data');
      return { recordsAnonymized: 0 };
    }

    try {
      const anonymizedUserId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let totalAnonymized = 0;

      // Anonymize search sessions
      const sessionsQuery = `UPDATE search_sessions SET user_id = ? WHERE user_id = ?`;
      const sessionsResult = await this.env.DB.prepare(sessionsQuery).bind(anonymizedUserId, userId).run();
      totalAnonymized += sessionsResult.changes || 0;

      // Anonymize feedback
      const feedbackQuery = `UPDATE search_feedback SET user_id = ? WHERE user_id = ?`;
      const feedbackResult = await this.env.DB.prepare(feedbackQuery).bind(anonymizedUserId, userId).run();
      totalAnonymized += feedbackResult.changes || 0;

      // Anonymize learning data
      const learningQuery = `UPDATE user_feedback_learning SET user_id = ? WHERE user_id = ?`;
      const learningResult = await this.env.DB.prepare(learningQuery).bind(anonymizedUserId, userId).run();
      totalAnonymized += learningResult.changes || 0;

      // Anonymize analytics
      const analyticsQuery = `UPDATE search_analytics SET user_id = ? WHERE user_id = ?`;
      const analyticsResult = await this.env.DB.prepare(analyticsQuery).bind(anonymizedUserId, userId).run();
      totalAnonymized += analyticsResult.changes || 0;

      // Remove privacy settings (contains PII)
      const privacyQuery = `DELETE FROM privacy_settings WHERE user_id = ?`;
      await this.env.DB.prepare(privacyQuery).bind(userId).run();

      console.log(`Anonymized ${totalAnonymized} records for user ${userId}`);
      
      return { recordsAnonymized: totalAnonymized };
    } catch (error) {
      console.error('Error anonymizing user data:', error);
      throw error;
    }
  }
}