import { SearchAnalyticsManager } from './search-analytics-manager';
import { FeedbackLearningSystem } from './feedback-learning-system';

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
    
    if (!env.DB) {
      console.warn('Database binding (DB) not found in environment - some features may be limited');
    }
    
    this.analyticsManager = new SearchAnalyticsManager(env);
    this.learningSystem = new FeedbackLearningSystem(env);
  }

  /**
   * Get privacy settings for a user
   */
  async getPrivacySettings(userId: string, conversationId?: string): Promise<PrivacySettings | null> {
    try {
      // Check if DB is available
      if (!this.env || !this.env.DB) {
        console.warn('Database not available, returning default privacy settings');
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

      let whereClause = 'WHERE user_id = ?';
      const params = [userId];

      if (conversationId) {
        whereClause += ' AND conversation_id = ?';
        params.push(conversationId);
      }

      const query = `
        SELECT * FROM privacy_settings
        ${whereClause}
        ORDER BY last_updated DESC
        LIMIT 1
      `;

      const result = await this.env.DB.prepare(query).bind(...params).first();

      if (!result) {
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
    // Check if DB is available
    if (!this.env || !this.env.DB) {
      console.warn('Database not available, cannot update privacy settings');
      return;
    }

    try {
      const query = `
        INSERT INTO privacy_settings (
          user_id, conversation_id, data_retention_days, auto_delete_enabled,
          analytics_enabled, learning_enabled, export_format, consent_given,
          consent_date, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (user_id, COALESCE(conversation_id::text, 'global')) DO UPDATE SET
          data_retention_days = excluded.data_retention_days,
          auto_delete_enabled = excluded.auto_delete_enabled,
          analytics_enabled = excluded.analytics_enabled,
          learning_enabled = excluded.learning_enabled,
          export_format = excluded.export_format,
          consent_given = excluded.consent_given,
          consent_date = excluded.consent_date,
          last_updated = excluded.last_updated
      `;

      await this.env.DB.prepare(query).bind(
        settings.userId,
        settings.conversationId || null,
        settings.dataRetentionDays,
        settings.autoDeleteEnabled,
        settings.analyticsEnabled,
        settings.learningEnabled,
        settings.exportFormat,
        settings.consentGiven,
        settings.consentDate?.toISOString() || null,
        new Date().toISOString()
      ).run();

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
    // Check if DB is available
    if (!this.env || !this.env.DB) {
      console.warn('Database not available, returning empty data summary');
      return {
        searchSessions: 0,
        searchResults: 0,
        feedbackEntries: 0,
        learningData: 0,
        totalSize: '0 KB'
      };
    }

    try {
      let whereClause = 'WHERE user_id = ?';
      const params = [userId];

      if (conversationId) {
        whereClause += ' AND conversation_id = ?';
        params.push(conversationId);
      }

      // Get search sessions count
      const sessionsQuery = `
        SELECT COUNT(*) as count, MIN(created_at) as oldest, MAX(created_at) as newest
        FROM search_sessions ss
        ${whereClause}
      `;
      const sessionsResult = await this.env.DB.prepare(sessionsQuery).bind(...params).first();

      // Get search results count
      const resultsQuery = `
        SELECT COUNT(*) as count
        FROM search_results sr
        JOIN search_sessions ss ON sr.search_session_id = ss.id
        ${whereClause}
      `;
      const resultsResult = await this.env.DB.prepare(resultsQuery).bind(...params).first();

      // Get feedback count
      const feedbackQuery = `
        SELECT COUNT(*) as count
        FROM search_feedback sf
        JOIN search_sessions ss ON sf.search_session_id = ss.id
        ${whereClause}
      `;
      const feedbackResult = await this.env.DB.prepare(feedbackQuery).bind(...params).first();

      // Get learning data count
      const learningQuery = `
        SELECT COUNT(*) as count
        FROM user_feedback_learning ufl
        ${whereClause.replace('ss.', 'ufl.')}
      `;
      const learningResult = await this.env.DB.prepare(learningQuery).bind(...params).first();

      // Calculate approximate storage size (rough estimate)
      const totalRecords = (sessionsResult?.count || 0) + 
                          (resultsResult?.count || 0) + 
                          (feedbackResult?.count || 0) + 
                          (learningResult?.count || 0);
      const estimatedSizeKB = Math.round(totalRecords * 2.5); // Rough estimate: 2.5KB per record
      const totalSize = estimatedSizeKB > 1024 
        ? `${(estimatedSizeKB / 1024).toFixed(1)} MB`
        : `${estimatedSizeKB} KB`;

      return {
        searchSessions: sessionsResult?.count || 0,
        searchResults: resultsResult?.count || 0,
        feedbackEntries: feedbackResult?.count || 0,
        learningData: learningResult?.count || 0,
        totalSize,
        oldestEntry: sessionsResult?.oldest ? new Date(sessionsResult.oldest) : undefined,
        newestEntry: sessionsResult?.newest ? new Date(sessionsResult.newest) : undefined
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
    // Check if DB is available
    if (!this.env || !this.env.DB) {
      console.warn('Database not available, cannot clear data');
      return { deletedCount: 0 };
    }

    try {
      let whereClause = 'WHERE user_id = ?';
      const params = [userId];

      if (conversationId) {
        whereClause += ' AND conversation_id = ?';
        params.push(conversationId);
      }

      let totalDeleted = 0;

      // Clear learning data first (has foreign key to search_sessions)
      const learningQuery = `DELETE FROM user_feedback_learning ${whereClause.replace('ss.', '')}`;
      const learningResult = await this.env.DB.prepare(learningQuery).bind(...params).run();
      totalDeleted += learningResult.changes || 0;

      // Clear user preference patterns
      const preferencesQuery = `DELETE FROM user_preference_patterns WHERE user_id = ?`;
      const preferencesResult = await this.env.DB.prepare(preferencesQuery).bind(userId).run();
      totalDeleted += preferencesResult.changes || 0;

      // Clear adaptive filters
      const filtersQuery = `DELETE FROM adaptive_filters WHERE user_id = ?`;
      const filtersResult = await this.env.DB.prepare(filtersQuery).bind(userId).run();
      totalDeleted += filtersResult.changes || 0;

      // Clear learning metrics
      const metricsQuery = `DELETE FROM learning_metrics WHERE user_id = ?`;
      const metricsResult = await this.env.DB.prepare(metricsQuery).bind(userId).run();
      totalDeleted += metricsResult.changes || 0;

      // Use analytics manager to clear search data (handles cascading deletes)
      await this.analyticsManager.clearAnalyticsData(userId, conversationId);

      console.log(`Cleared all data for user ${userId}${conversationId ? ` in conversation ${conversationId}` : ''}`);
      
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
    // Check if DB is available
    if (!this.env || !this.env.DB) {
      console.warn('Database not available, cannot clear old data');
      return { deletedCount: 0 };
    }

    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      let whereClause = 'WHERE user_id = ? AND created_at < ?';
      const params = [userId, cutoffDate.toISOString()];

      if (conversationId) {
        whereClause += ' AND conversation_id = ?';
        params.push(conversationId);
      }

      let totalDeleted = 0;

      // Clear old learning data
      const learningQuery = `DELETE FROM user_feedback_learning ${whereClause.replace('ss.', '')}`;
      const learningResult = await this.env.DB.prepare(learningQuery).bind(...params).run();
      totalDeleted += learningResult.changes || 0;

      // Clear old adaptive filters
      const filtersQuery = `DELETE FROM adaptive_filters WHERE user_id = ? AND created_at < ?`;
      const filtersResult = await this.env.DB.prepare(filtersQuery).bind(userId, cutoffDate.toISOString()).run();
      totalDeleted += filtersResult.changes || 0;

      // Clear old search sessions and related data
      const sessionsQuery = `
        DELETE FROM search_sessions 
        ${whereClause}
      `;
      const sessionsResult = await this.env.DB.prepare(sessionsQuery).bind(...params).run();
      totalDeleted += sessionsResult.changes || 0;

      console.log(`Cleared ${totalDeleted} old records for user ${userId} (older than ${retentionDays} days)`);
      
      return { deletedCount: totalDeleted };
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