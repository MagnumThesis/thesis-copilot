import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrivacyManager, PrivacySettings } from '../worker/lib/privacy-manager';

// Mock Supabase
const mockSupabaseClient = {
  from: vi.fn()
};

// Mock the getSupabase function
vi.mock('../worker/lib/supabase', () => ({
  getSupabase: vi.fn(() => mockSupabaseClient)
}));

// Mock SearchAnalyticsManager
vi.mock('../worker/lib/search-analytics-manager', () => ({
  SearchAnalyticsManager: vi.fn().mockImplementation(() => ({
    clearAnalyticsData: vi.fn()
  }))
}));

// Mock FeedbackLearningSystem
vi.mock('../worker/lib/feedback-learning-system', () => ({
  FeedbackLearningSystem: vi.fn().mockImplementation(() => ({}))
}));

// Mock environment
const mockEnv = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON: 'test-anon-key'
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
    it('should return data summary with new PostgREST queries', async () => {
      // Mock Supabase query chains for the new implementation
      const mockQueryBuilder = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
        in: vi.fn().mockReturnThis()
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      // Mock the responses for the parallel queries in order:
      // 1. Sessions count query
      // 2. Session IDs query  
      // 3. Learning data count query
      let callCount = 0;
      const mockResponses = [
        // Sessions count
        { count: 5, error: null },
        // Session IDs
        { data: [{ id: 'session1' }, { id: 'session2' }], error: null },
        // Learning data count
        { count: 8, error: null },
        // Results count (from Promise.all)
        { count: 15, error: null },
        // Feedback count (from Promise.all)
        { count: 3, error: null },
        // Oldest entry (from Promise.all)
        { data: { created_at: '2024-01-01T00:00:00Z' }, error: null },
        // Newest entry (from Promise.all)
        { data: { created_at: '2024-01-05T00:00:00Z' }, error: null }
      ];

      // Mock the query execution to return responses in sequence
      const mockExecution = vi.fn().mockImplementation(() => {
        return Promise.resolve(mockResponses[callCount++]);
      });

      // Replace the query builder with our mock execution
      Object.defineProperty(mockQueryBuilder, 'then', {
        get: () => mockExecution
      });

      mockQueryBuilder.maybeSingle.mockImplementation(() => mockQueryBuilder);

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

      // Verify that the correct tables were queried
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('search_sessions');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('search_results');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('search_feedback');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_feedback_learning');
    });

    it('should handle conversation ID filtering', async () => {
      const mockQueryBuilder = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
        in: vi.fn().mockReturnThis()
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      // Mock responses for conversation filtering test
      let callCount = 0;
      const mockResponses = [
        { count: 2, error: null },  // Sessions count with conversation filter
        { data: [{ id: 'session1' }], error: null },  // Session IDs with filter
        { count: 4, error: null },  // Learning data with filter
        { count: 6, error: null },  // Results count
        { count: 1, error: null },  // Feedback count
        { data: { created_at: '2024-01-01T00:00:00Z' }, error: null },  // Oldest
        { data: { created_at: '2024-01-03T00:00:00Z' }, error: null }   // Newest
      ];

      const mockExecution = vi.fn().mockImplementation(() => {
        return Promise.resolve(mockResponses[callCount++]);
      });

      Object.defineProperty(mockQueryBuilder, 'then', {
        get: () => mockExecution
      });

      mockQueryBuilder.maybeSingle.mockImplementation(() => mockQueryBuilder);

      const summary = await privacyManager.getDataSummary(mockUserId, mockConversationId);

      expect(summary).toEqual({
        searchSessions: 2,
        searchResults: 6,
        feedbackEntries: 1,
        learningData: 4,
        totalSize: '33 KB', // (2+6+1+4) * 2.5 = 32.5 KB rounded up
        oldestEntry: new Date('2024-01-01T00:00:00Z'),
        newestEntry: new Date('2024-01-03T00:00:00Z')
      });

      // Verify conversation ID was passed to eq() calls
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('conversation_id', mockConversationId);
    });

    it('should handle errors gracefully', async () => {
      const mockQueryBuilder = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
        in: vi.fn().mockReturnThis()
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      // Mock error responses - main query fails
      let callCount = 0;
      const mockResponses = [
        { count: null, error: new Error('Database connection failed') },
      ];

      const mockExecution = vi.fn().mockImplementation(() => {
        return Promise.resolve(mockResponses[callCount++]);
      });

      Object.defineProperty(mockQueryBuilder, 'then', {
        get: () => mockExecution
      });

      // Should throw error for main query failures
      await expect(privacyManager.getDataSummary(mockUserId)).rejects.toThrow('Database connection failed');
    });

    it('should handle graceful degradation for date queries', async () => {
      const mockQueryBuilder = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
        in: vi.fn().mockReturnThis()
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      // Mock responses where date queries fail but counts succeed
      let callCount = 0;
      const mockResponses = [
        { count: 5, error: null },  // Sessions count
        { data: [{ id: 'session1' }], error: null },  // Session IDs
        { count: 8, error: null },  // Learning data count
        { count: 15, error: null }, // Results count
        { count: 3, error: null },  // Feedback count
        { data: null, error: new Error('Date query failed') },  // Oldest - fails
        { data: null, error: new Error('Date query failed') }   // Newest - fails
      ];

      const mockExecution = vi.fn().mockImplementation(() => {
        return Promise.resolve(mockResponses[callCount++]);
      });

      Object.defineProperty(mockQueryBuilder, 'then', {
        get: () => mockExecution
      });

      mockQueryBuilder.maybeSingle.mockImplementation(() => mockQueryBuilder);

      const summary = await privacyManager.getDataSummary(mockUserId);

      expect(summary).toEqual({
        searchSessions: 5,
        searchResults: 15,
        feedbackEntries: 3,
        learningData: 8,
        totalSize: '78 KB',
        oldestEntry: undefined,  // Should be undefined due to error
        newestEntry: undefined   // Should be undefined due to error
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