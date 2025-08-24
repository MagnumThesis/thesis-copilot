import { useState, useCallback, useEffect } from 'react';
import { PrivacySettings, DataSummary } from '../worker/lib/privacy-manager';

interface UsePrivacyManagerReturn {
  // State
  settings: PrivacySettings | null;
  dataSummary: DataSummary | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<PrivacySettings>) => Promise<void>;
  loadDataSummary: () => Promise<void>;
  clearAllData: () => Promise<{ deletedCount: number }>;
  clearOldData: (retentionDays: number) => Promise<{ deletedCount: number }>;
  exportData: (format: 'json' | 'csv') => Promise<{ exportData: string; recordCount: number }>;
  checkConsentStatus: () => Promise<boolean>;
  anonymizeData: () => Promise<{ recordsAnonymized: number }>;

  // Utilities
  hasConsent: boolean;
  canUseAnalytics: boolean;
  canUseLearning: boolean;
}

export const usePrivacyManager = (conversationId?: string): UsePrivacyManagerReturn => {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const url = `/api/ai-searcher/privacy/settings${conversationId ? `?conversationId=${conversationId}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to load privacy settings: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load privacy settings');
      }

      setSettings(data.settings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load privacy settings';
      setError(errorMessage);
      console.error('Load privacy settings error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const updateSettings = useCallback(async (newSettings: Partial<PrivacySettings>) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedSettings = { ...settings, ...newSettings };

      const response = await fetch('/api/ai-searcher/privacy/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: updatedSettings,
          conversationId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update privacy settings: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update privacy settings');
      }

      // Reload settings to get the updated values
      await loadSettings();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update privacy settings';
      setError(errorMessage);
      console.error('Update privacy settings error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [settings, conversationId, loadSettings]);

  const loadDataSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const url = `/api/ai-searcher/privacy/data-summary${conversationId ? `?conversationId=${conversationId}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to load data summary: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load data summary');
      }

      setDataSummary(data.summary);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data summary';
      setError(errorMessage);
      console.error('Load data summary error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const clearAllData = useCallback(async (): Promise<{ deletedCount: number }> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai-searcher/privacy/clear-data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          clearAll: true
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to clear data: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to clear data');
      }

      // Reload data summary after clearing
      await loadDataSummary();

      return { deletedCount: data.deletedCount };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear data';
      setError(errorMessage);
      console.error('Clear all data error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, loadDataSummary]);

  const clearOldData = useCallback(async (retentionDays: number): Promise<{ deletedCount: number }> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai-searcher/privacy/clear-data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          retentionDays
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to clear old data: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to clear old data');
      }

      // Reload data summary after clearing
      await loadDataSummary();

      return { deletedCount: data.deletedCount };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear old data';
      setError(errorMessage);
      console.error('Clear old data error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, loadDataSummary]);

  const exportData = useCallback(async (format: 'json' | 'csv'): Promise<{ exportData: string; recordCount: number }> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai-searcher/privacy/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          format
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to export data: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to export data');
      }

      return {
        exportData: data.exportData,
        recordCount: data.recordCount
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
      console.error('Export data error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const checkConsentStatus = useCallback(async (): Promise<boolean> => {
    try {
      const url = `/api/ai-searcher/privacy/consent-status${conversationId ? `?conversationId=${conversationId}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to check consent status: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to check consent status');
      }

      return data.hasConsent;
    } catch (err) {
      console.error('Check consent status error:', err);
      return false;
    }
  }, [conversationId]);

  const anonymizeData = useCallback(async (): Promise<{ recordsAnonymized: number }> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai-searcher/privacy/anonymize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to anonymize data: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to anonymize data');
      }

      // Clear local state after anonymization
      setSettings(null);
      setDataSummary(null);

      return { recordsAnonymized: data.recordsAnonymized };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to anonymize data';
      setError(errorMessage);
      console.error('Anonymize data error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadSettings();
    loadDataSummary();
  }, [loadSettings, loadDataSummary]);

  // Computed values
  const hasConsent = settings?.consentGiven || false;
  const canUseAnalytics = hasConsent && (settings?.analyticsEnabled || false);
  const canUseLearning = hasConsent && (settings?.learningEnabled || false);

  return {
    // State
    settings,
    dataSummary,
    isLoading,
    error,

    // Actions
    loadSettings,
    updateSettings,
    loadDataSummary,
    clearAllData,
    clearOldData,
    exportData,
    checkConsentStatus,
    anonymizeData,

    // Utilities
    hasConsent,
    canUseAnalytics,
    canUseLearning
  };
};