import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrivacyManager, PrivacySettings } from '../worker/lib/privacy-manager';

// Mock environment
const mockEnv = {
  DB: {
    prepare: vi.fn(),
  }
};

describe('PrivacyManager', () => {
  let privacyManager: PrivacyManager;
  const mockUserId = 'test-user-123';
  const mockConversationId = 'test-conversation-456';

  beforeEach(() => {
    vi.clearAllMocks();
    privacyManager = new PrivacyManager(mockEnv);
  });

  describe('getPrivacySettings', () => {
    it('should return default settings when none exist', async () => {
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null)
        })
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      const settings = await privacyManager.getPrivacySettings(mockUserId);

      expect(settings).toEqual({
        userId: mockUserId,
        conversationId: undefined,
        dataRetentionDays: 365,
        autoDeleteEnabled: false,
        analyticsEnabled: true,
        learningEnabled: true,
        exportFormat: 'json',
        consentGiven: false,
        lastUpdated: expect.any(Date)
      });
    });

    it('should return existing settings', async () => {
      const mockSettings = {
        user_id: mockUserId,
        conversation_id: mockConversationId,
        data_retention_days: 90,
        auto_delete_enabled: true,
        analytics_enabled: true,
        learning_enabled: false,
        export_format: 'csv',
        consent_given: true,
        consent_date: '2024-01-01T00:00:00Z',
        last_updated: '2024-01-01T00:00:00Z'
      };

      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockSettings)
        })
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      const settings = await privacyManager.getPrivacySettings(mockUserId, mockConversationId);

      expect(settings).toEqual({
        userId: mockUserId,
        conversationId: mockConversationId,
        dataRetentionDays: 90,
        autoDeleteEnabled: true,
        analyticsEnabled: true,
        learningEnabled: false,
        exportFormat: 'csv',
        consentGiven: true,
        consentDate: new Date('2024-01-01T00:00:00Z'),
        lastUpdated: new Date('2024-01-01T00:00:00Z')
      });
    });
  });

  describe('updatePrivacySettings', () => {
    it('should update privacy settings successfully', async () => {
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ success: true })
        })
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      const settings: PrivacySettings = {
        userId: mockUserId,
        conversationId: mockConversationId,
        dataRetentionDays: 180,
        autoDeleteEnabled: true,
        analyticsEnabled: true,
        learningEnabled: true,
        exportFormat: 'json',
        consentGiven: true,
        consentDate: new Date(),
        lastUpdated: new Date()
      };

      await privacyManager.updatePrivacySettings(settings);

      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO privacy_settings')
      );
      expect(mockChain.bind).toHaveBeenCalledWith(
        mockUserId,
        mockConversationId,
        180,
        true,
        true,
        true,
        'json',
        true,
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('getDataSummary', () => {
    it('should return data summary', async () => {
      const mockResults = [
        { count: 5, oldest: '2024-01-01T00:00:00Z', newest: '2024-01-05T00:00:00Z' },
        { count: 15 },
        { count: 3 },
        { count: 8 }
      ];

      let callIndex = 0;
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockImplementation(() => {
            return Promise.resolve(mockResults[callIndex++]);
          })
        })
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      const summary = await privacyManager.getDataSummary(mockUserId);

      expect(summary).toEqual({
        searchSessions: 5,
        searchResults: 15,
        feedbackEntries: 3,
        learningData: 8,
        totalSize: '78 KB', // (5+15+3+8) * 2.5 = 77.5 KB rounded up
        oldestEntry: new Date('2024-01-01T00:00:00Z'),
        newestEntry: new Date('2024-01-05T00:00:00Z')
      });
    });
  });

  describe('clearAllData', () => {
    it('should clear all user data', async () => {
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ changes: 5 })
        })
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      // Mock the analytics manager clearAnalyticsData method
      const mockAnalyticsManager = {
        clearAnalyticsData: vi.fn().mockResolvedValue(undefined)
      };
      privacyManager['analyticsManager'] = mockAnalyticsManager;

      const result = await privacyManager.clearAllData(mockUserId);

      expect(result.deletedCount).toBe(20); // 4 tables * 5 changes each
      expect(mockAnalyticsManager.clearAnalyticsData).toHaveBeenCalledWith(mockUserId, undefined);
    });
  });

  describe('clearOldData', () => {
    it('should clear old data based on retention policy', async () => {
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ changes: 3 })
        })
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      const result = await privacyManager.clearOldData(mockUserId, 30);

      expect(result.deletedCount).toBe(9); // 3 tables * 3 changes each
      expect(mockChain.bind).toHaveBeenCalledWith(
        mockUserId,
        expect.any(String) // cutoff date
      );
    });
  });

  describe('exportData', () => {
    it('should export data in JSON format', async () => {
      const mockData = {
        results: [
          { id: '1', query: 'test query' },
          { id: '2', query: 'another query' }
        ]
      };

      const mockChain = {
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue(mockData)
        })
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      const result = await privacyManager.exportData(mockUserId, 'json');

      expect(result.recordCount).toBe(10); // 5 queries * 2 results each
      expect(result.exportData).toContain('"exportDate"');
      expect(result.exportData).toContain('"userId"');
      expect(result.exportData).toContain('"searchSessions"');
    });

    it('should export data in CSV format', async () => {
      const mockData = {
        results: [
          { id: '1', query: 'test query', created_at: '2024-01-01T00:00:00Z' }
        ]
      };

      const mockChain = {
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue(mockData)
        })
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      const result = await privacyManager.exportData(mockUserId, 'csv');

      expect(result.recordCount).toBe(5); // 5 queries * 1 result each
      expect(result.exportData).toContain('# Export Metadata');
      expect(result.exportData).toContain('Export Date,');
      expect(result.exportData).toContain('User ID,');
    });
  });

  describe('hasUserConsent', () => {
    it('should return true when user has given consent', async () => {
      const mockSettings = {
        user_id: mockUserId,
        consent_given: true
      };

      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockSettings)
        })
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      const hasConsent = await privacyManager.hasUserConsent(mockUserId);

      expect(hasConsent).toBe(true);
    });

    it('should return false when user has not given consent', async () => {
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null)
        })
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      const hasConsent = await privacyManager.hasUserConsent(mockUserId);

      expect(hasConsent).toBe(false);
    });
  });

  describe('runAutomaticCleanup', () => {
    it('should run cleanup for users with auto-delete enabled', async () => {
      const mockUsers = {
        results: [
          { user_id: 'user1', conversation_id: null, data_retention_days: 30 },
          { user_id: 'user2', conversation_id: 'conv1', data_retention_days: 90 }
        ]
      };

      const mockChain = {
        all: vi.fn().mockResolvedValue(mockUsers)
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      // Mock clearOldData to return some deleted count
      vi.spyOn(privacyManager, 'clearOldData').mockResolvedValue({ deletedCount: 5 });

      const result = await privacyManager.runAutomaticCleanup();

      expect(result.usersProcessed).toBe(2);
      expect(result.recordsDeleted).toBe(10); // 2 users * 5 records each
    });
  });

  describe('anonymizeUserData', () => {
    it('should anonymize all user data', async () => {
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ changes: 2 })
        })
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      const result = await privacyManager.anonymizeUserData(mockUserId);

      expect(result.recordsAnonymized).toBe(8); // 4 tables * 2 changes each (based on actual implementation)
      expect(mockChain.bind).toHaveBeenCalledWith(
        expect.stringMatching(/^anon_\d+_[a-z0-9]+$/), // anonymized ID pattern
        mockUserId
      );
    });
  });
});