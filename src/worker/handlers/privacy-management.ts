import { Hono } from 'hono';
import { PrivacyManager, PrivacySettings } from '../lib/privacy-manager';

const app = new Hono();

/**
 * Get privacy settings for a user
 */
app.get('/settings', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    const conversationId = c.req.query('conversationId');

    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400);
    }

    const privacyManager = new PrivacyManager(c.env);
    const settings = await privacyManager.getPrivacySettings(userId, conversationId);

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
 */
app.post('/settings', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    const body = await c.req.json();
    const { settings, conversationId } = body;

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

    // Validate settings
    const validatedSettings: PrivacySettings = {
      userId,
      conversationId: conversationId || undefined,
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
app.get('/data-summary', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    const conversationId = c.req.query('conversationId');

    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400);
    }

    const privacyManager = new PrivacyManager(c.env);
    const summary = await privacyManager.getDataSummary(userId, conversationId);

    return c.json({ 
      success: true, 
      summary 
    });
  } catch (error) {
    console.error('Error getting data summary:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to get data summary' 
    }, 500);
  }
});

/**
 * Clear user data
 */
app.delete('/clear-data', async (c) => {
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
app.post('/export-data', async (c) => {
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
 */
app.get('/consent-status', async (c) => {
  try {
    const userId = c.req.header('x-user-id');
    const conversationId = c.req.query('conversationId');

    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400);
    }

    const privacyManager = new PrivacyManager(c.env);
    const hasConsent = await privacyManager.hasUserConsent(userId, conversationId);

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
app.post('/anonymize', async (c) => {
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
app.post('/admin/cleanup', async (c) => {
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
app.get('/admin/compliance-report', async (c) => {
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