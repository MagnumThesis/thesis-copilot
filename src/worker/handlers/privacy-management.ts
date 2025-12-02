import { Hono, Context } from 'hono';
import { PrivacyManager, PrivacySettings } from '../lib/privacy-manager';
import { Env } from '../types/env';
import { SupabaseEnv } from '../lib/supabase';

// Type for the Hono context
type PrivacyManagementContext = {
  Bindings: Env & SupabaseEnv;
};

const app = new Hono<PrivacyManagementContext>();

/**
 * Get privacy settings for a user
 * Note: Privacy consent is fetched at account-level (not per-conversation)
 */
app.get('/settings', async (c: Context<PrivacyManagementContext>) => {
  try {
    const userId = c.req.header('x-user-id');
    // Note: conversationId is intentionally ignored - consent is account-level

    if (!userId) { 
      console.error('User ID is required', userId);
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400);
    }

    const privacyManager = new PrivacyManager(c.env);
    // Always fetch account-level settings (no conversationId)
    const settings = await privacyManager.getPrivacySettings(userId);

    return c.json({ 
      success: true, 
      settings 
    });
  } catch (error) {
    console.error('Error getting privacy settings:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to get privacy settings' 
    }, 500);
  }
});

/**
 * Update privacy settings for a user
 * Note: Privacy consent is stored at account-level (not per-conversation)
 */
app.post('/settings', async (c: Context<PrivacyManagementContext>) => {
  try {
    const userId = c.req.header('x-user-id');
    const body = await c.req.json();
    const { settings } = body;
    // Note: conversationId is intentionally ignored for consent settings
    // Consent is account-level, not per-conversation

    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400);
    }

    if (!settings) {
      return c.json({ 
        success: false, 
        error: 'Settings are required' 
      }, 400);
    }

    // Validate settings - always store at account level (no conversationId)
    const validatedSettings: PrivacySettings = {
      userId,
      conversationId: undefined, // Always account-level for consent
      dataRetentionDays: Math.max(1, Math.min(3650, settings.dataRetentionDays || 365)),
      autoDeleteEnabled: Boolean(settings.autoDeleteEnabled),
      analyticsEnabled: Boolean(settings.analyticsEnabled),
      learningEnabled: Boolean(settings.learningEnabled),
      exportFormat: ['json', 'csv'].includes(settings.exportFormat) ? settings.exportFormat : 'json',
      consentGiven: Boolean(settings.consentGiven),
      consentDate: settings.consentGiven ? (settings.consentDate ? new Date(settings.consentDate) : new Date()) : undefined,
      lastUpdated: new Date()
    };

    const privacyManager = new PrivacyManager(c.env);
    await privacyManager.updatePrivacySettings(validatedSettings);

    return c.json({ 
      success: true, 
      message: 'Privacy settings updated successfully' 
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to update privacy settings' 
    }, 500);
  }
});

/**
 * Get data summary for a user
 */
app.get('/data-summary', async (c: Context<PrivacyManagementContext>) => {
  try {
    const userId = c.req.header('x-user-id');
    const conversationId = c.req.query('conversationId');

    console.log("[ANALYTICS DEBUG] Data summary request:", {
      userId,
      conversationId
    });

    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400);
    }

    const privacyManager = new PrivacyManager(c.env);
    const summary = await privacyManager.getDataSummary(userId, conversationId);

    console.log("[ANALYTICS DEBUG] Data summary result:", summary);

    return c.json({ 
      success: true, 
      summary 
    });
  } catch (error: any) {
    console.error('Error getting data summary:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    });
    return c.json({ 
      success: false, 
      error: 'Failed to get data summary',
      details: error?.message || 'Unknown error'
    }, 500);
  }
});

/**
 * Clear user data
 */
app.delete('/clear-data', async (c: Context<PrivacyManagementContext>) => {
  try {
    const userId = c.req.header('x-user-id');
    const body = await c.req.json();
    const { conversationId, clearAll, retentionDays } = body;

    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400);
    }

    const privacyManager = new PrivacyManager(c.env);
    let result;

    if (clearAll) {
      result = await privacyManager.clearAllData(userId, conversationId);
    } else if (retentionDays) {
      result = await privacyManager.clearOldData(userId, retentionDays, conversationId);
    } else {
      return c.json({ 
        success: false, 
        error: 'Either clearAll or retentionDays must be specified' 
      }, 400);
    }

    return c.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} records` 
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to clear data' 
    }, 500);
  }
});

/**
 * Export user data
 */
app.post('/export-data', async (c: Context<PrivacyManagementContext>) => {
  try {
    const userId = c.req.header('x-user-id');
    const body = await c.req.json();
    const { conversationId, format = 'json' } = body;

    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400);
    }

    if (!['json', 'csv'].includes(format)) {
      return c.json({ 
        success: false, 
        error: 'Format must be json or csv' 
      }, 400);
    }

    const privacyManager = new PrivacyManager(c.env);
    const result = await privacyManager.exportData(userId, format, conversationId);

    return c.json({ 
      success: true, 
      exportData: result.exportData,
      recordCount: result.recordCount,
      format,
      message: `Successfully exported ${result.recordCount} records` 
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to export data' 
    }, 500);
  }
});

/**
 * Check user consent status
 * Note: Consent is checked at account-level (not per-conversation)
 */
app.get('/consent-status', async (c: Context<PrivacyManagementContext>) => {
  try {
    const userId = c.req.header('x-user-id');
    // Note: conversationId is intentionally ignored - consent is account-level

    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400);
    }

    const privacyManager = new PrivacyManager(c.env);
    // Always check account-level consent (no conversationId)
    const hasConsent = await privacyManager.hasUserConsent(userId);

    return c.json({ 
      success: true, 
      hasConsent 
    });
  } catch (error) {
    console.error('Error checking consent status:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to check consent status' 
    }, 500);
  }
});

/**
 * Anonymize user data (GDPR right to be forgotten)
 */
app.post('/anonymize', async (c: Context<PrivacyManagementContext>) => {
  try {
    const userId = c.req.header('x-user-id');

    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400);
    }

    const privacyManager = new PrivacyManager(c.env);
    const result = await privacyManager.anonymizeUserData(userId);

    return c.json({ 
      success: true, 
      recordsAnonymized: result.recordsAnonymized,
      message: `Successfully anonymized ${result.recordsAnonymized} records` 
    });
  } catch (error) {
    console.error('Error anonymizing user data:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to anonymize user data' 
    }, 500);
  }
});

/**
 * Run automatic cleanup (admin endpoint)
 */
app.post('/admin/cleanup', async (c: Context<PrivacyManagementContext>) => {
  try {
    // This should be protected by admin authentication in production
    const adminKey = c.req.header('x-admin-key');
    
    if (!adminKey || adminKey !== (c.env as any).ADMIN_KEY) {
      return c.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, 401);
    }

    const privacyManager = new PrivacyManager(c.env as any);
    const result = await privacyManager.runAutomaticCleanup();

    return c.json({ 
      success: true, 
      usersProcessed: result.usersProcessed,
      recordsDeleted: result.recordsDeleted,
      message: `Processed ${result.usersProcessed} users, deleted ${result.recordsDeleted} records` 
    });
  } catch (error) {
    console.error('Error running automatic cleanup:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to run automatic cleanup' 
    }, 500);
  }
});

/**
 * Get privacy compliance report (admin endpoint)
 */
app.get('/admin/compliance-report', async (c: Context<PrivacyManagementContext>) => {
  try {
    // This should be protected by admin authentication in production
    const adminKey = c.req.header('x-admin-key');
    
    if (!adminKey || adminKey !== (c.env as any).ADMIN_KEY) {
      return c.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, 401);
    }

    // Get compliance statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN consent_given = true THEN 1 END) as users_with_consent,
        COUNT(CASE WHEN auto_delete_enabled = true THEN 1 END) as users_with_auto_delete,
        COUNT(CASE WHEN analytics_enabled = true THEN 1 END) as users_with_analytics,
        COUNT(CASE WHEN learning_enabled = true THEN 1 END) as users_with_learning,
        AVG(data_retention_days) as avg_retention_days
      FROM privacy_settings
    `;

    const statsResult = await (c.env as any).DB.prepare(statsQuery).first();

    // Get data volume statistics
    const volumeQuery = `
      SELECT 
        (SELECT COUNT(*) FROM search_sessions) as total_search_sessions,
        (SELECT COUNT(*) FROM search_results) as total_search_results,
        (SELECT COUNT(*) FROM search_feedback) as total_feedback,
        (SELECT COUNT(*) FROM user_feedback_learning) as total_learning_data
    `;

    const volumeResult = await (c.env as any).DB.prepare(volumeQuery).first();

    const report = {
      compliance: {
        totalUsers: statsResult?.total_users || 0,
        usersWithConsent: statsResult?.users_with_consent || 0,
        usersWithAutoDelete: statsResult?.users_with_auto_delete || 0,
        usersWithAnalytics: statsResult?.users_with_analytics || 0,
        usersWithLearning: statsResult?.users_with_learning || 0,
        averageRetentionDays: Math.round(statsResult?.avg_retention_days || 0),
        consentRate: statsResult?.total_users > 0 
          ? Math.round((statsResult.users_with_consent / statsResult.total_users) * 100) 
          : 0
      },
      dataVolume: {
        totalSearchSessions: volumeResult?.total_search_sessions || 0,
        totalSearchResults: volumeResult?.total_search_results || 0,
        totalFeedback: volumeResult?.total_feedback || 0,
        totalLearningData: volumeResult?.total_learning_data || 0
      },
      generatedAt: new Date().toISOString()
    };

    return c.json({ 
      success: true, 
      report 
    });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to generate compliance report' 
    }, 500);
  }
});

export default app;