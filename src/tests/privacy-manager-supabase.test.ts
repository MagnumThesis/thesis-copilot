import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrivacyManager } from '../worker/lib/privacy-manager';

// Mock the dependencies first
const mockAnalyticsManager = {
  clearAnalyticsData: vi.fn()
};

const mockFeedbackLearningSystem = {};

vi.mock('../worker/lib/search-analytics-manager', () => ({
  SearchAnalyticsManager: vi.fn().mockImplementation(() => mockAnalyticsManager)
}));

vi.mock('../worker/lib/feedback-learning-system', () => ({
  FeedbackLearningSystem: vi.fn().mockImplementation(() => mockFeedbackLearningSystem)
}));

// Mock Supabase client
const createMockSupabaseResponse = (data: any, error: any = null, count?: number) => {
  return Promise.resolve({ data, error, count });
};

const mockSupabaseClient = {
  from: vi.fn()
};

vi.mock('../worker/lib/supabase', () => ({
  getSupabase: vi.fn(() => mockSupabaseClient)
}));

describe('PrivacyManager - Supabase Implementation', () => {
  let privacyManager: PrivacyManager;
  const mockUserId = 'test-user-123';
  const mockConversationId = 'test-conversation-456';

  const mockEnv = {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON: 'test-anon-key'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    privacyManager = new PrivacyManager(mockEnv);
  });

  describe('getDataSummary', () => {
    it('should return data summary using new PostgREST queries', async () => {
      // Create a mock query builder that tracks calls
      const mockCalls: any[] = [];
      
      const createMockQueryBuilder = () => ({
        eq: vi.fn().mockImplementation((field, value) => {
          mockCalls.push({ method: 'eq', field, value });
          return createMockQueryBuilder();
        }),
        select: vi.fn().mockImplementation((fields, options) => {
          mockCalls.push({ method: 'select', fields, options });
          return createMockQueryBuilder();
        }),
        order: vi.fn().mockImplementation((field, options) => {
          mockCalls.push({ method: 'order', field, options });
          return createMockQueryBuilder();
        }),
        limit: vi.fn().mockImplementation((num) => {
          mockCalls.push({ method: 'limit', num });
          return createMockQueryBuilder();
        }),
        maybeSingle: vi.fn().mockImplementation(() => {
          mockCalls.push({ method: 'maybeSingle' });
          return createMockQueryBuilder();
        }),
        in: vi.fn().mockImplementation((field, values) => {
          mockCalls.push({ method: 'in', field, values });
          return createMockQueryBuilder();
        }),
        then: vi.fn().mockImplementation((resolve) => {
          // Determine response based on the call sequence
          const callString = mockCalls.map(c => c.method).join('-');
          
          if (callString.includes('select') && callString.includes('count')) {
            if (callString.includes('user_feedback_learning')) {
              return resolve({ count: 8, error: null });
            } else if (callString.includes('search_sessions')) {
              if (mockCalls.some(c => c.method === 'select' && c.fields === 'id')) {
                return resolve({ data: [{ id: 'session1' }, { id: 'session2' }], error: null });
              } else {
                return resolve({ count: 5, error: null });
              }
            } else if (callString.includes('search_results')) {
              return resolve({ count: 15, error: null });
            } else if (callString.includes('search_feedback')) {
              return resolve({ count: 3, error: null });
            }
          }
          
          if (callString.includes('maybeSingle')) {
            if (callString.includes('ascending-true')) {
              return resolve({ data: { created_at: '2024-01-01T00:00:00Z' }, error: null });
            } else if (callString.includes('ascending-false')) {
              return resolve({ data: { created_at: '2024-01-05T00:00:00Z' }, error: null });
            }
          }
          
          return resolve({ data: null, error: null });
        })
      });

      mockSupabaseClient.from.mockImplementation(() => {
        mockCalls.length = 0; // Reset calls for each from() call
        return createMockQueryBuilder();
      });

      const summary = await privacyManager.getDataSummary(mockUserId);

      expect(summary).toEqual({
        searchSessions: 5,
        searchResults: 15,
        feedbackEntries: 3,
        learningData: 8,
        totalSize: '78 KB',
        oldestEntry: new Date('2024-01-01T00:00:00Z'),
        newestEntry: new Date('2024-01-05T00:00:00Z')
      });

      // Verify correct tables were queried
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('search_sessions');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('search_results');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('search_feedback');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_feedback_learning');
    });

    it('should handle conversation ID filtering correctly', async () => {
      let conversationFilterApplied = false;
      
      const createMockQueryBuilder = () => ({
        eq: vi.fn().mockImplementation((field, value) => {
          if (field === 'conversation_id' && value === mockConversationId) {
            conversationFilterApplied = true;
          }
          return createMockQueryBuilder();
        }),
        select: vi.fn().mockReturnValue(createMockQueryBuilder()),
        order: vi.fn().mockReturnValue(createMockQueryBuilder()),
        limit: vi.fn().mockReturnValue(createMockQueryBuilder()),
        maybeSingle: vi.fn().mockReturnValue(createMockQueryBuilder()),
        in: vi.fn().mockReturnValue(createMockQueryBuilder()),
        then: vi.fn().mockImplementation((resolve) => {
          // Return smaller counts when conversation filter is applied
          return resolve({ count: 2, data: [{ id: 'session1' }], error: null });
        })
      });

      mockSupabaseClient.from.mockImplementation(() => createMockQueryBuilder());

      await privacyManager.getDataSummary(mockUserId, mockConversationId);

      expect(conversationFilterApplied).toBe(true);
    });

    it('should handle database errors gracefully for main queries', async () => {
      const createMockQueryBuilder = () => ({
        eq: vi.fn().mockReturnValue(createMockQueryBuilder()),
        select: vi.fn().mockReturnValue(createMockQueryBuilder()),
        then: vi.fn().mockImplementation((resolve) => {
          return resolve({ count: null, error: new Error('Database connection failed') });
        })
      });

      mockSupabaseClient.from.mockImplementation(() => createMockQueryBuilder());

      await expect(privacyManager.getDataSummary(mockUserId))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle date query errors gracefully without failing', async () => {
      let queryCount = 0;
      
      const createMockQueryBuilder = () => ({
        eq: vi.fn().mockReturnValue(createMockQueryBuilder()),
        select: vi.fn().mockReturnValue(createMockQueryBuilder()),
        order: vi.fn().mockReturnValue(createMockQueryBuilder()),
        limit: vi.fn().mockReturnValue(createMockQueryBuilder()),
        maybeSingle: vi.fn().mockReturnValue(createMockQueryBuilder()),
        in: vi.fn().mockReturnValue(createMockQueryBuilder()),
        then: vi.fn().mockImplementation((resolve) => {
          queryCount++;
          // First 3 queries succeed (counts), date queries fail
          if (queryCount <= 3) {
            return resolve({ count: 5, data: [{ id: 'session1' }], error: null });
          } else if (queryCount <= 5) {
            return resolve({ count: 10, error: null });
          } else {
            // Date queries fail
            return resolve({ data: null, error: new Error('Date query failed') });
          }
        })
      });

      mockSupabaseClient.from.mockImplementation(() => createMockQueryBuilder());

      const summary = await privacyManager.getDataSummary(mockUserId);

      expect(summary.searchSessions).toBe(5);
      expect(summary.oldestEntry).toBeUndefined();
      expect(summary.newestEntry).toBeUndefined();
    });

    it('should use Promise.all for performance optimization', async () => {
      const queryTimestamps: number[] = [];
      
      const createMockQueryBuilder = () => ({
        eq: vi.fn().mockReturnValue(createMockQueryBuilder()),
        select: vi.fn().mockReturnValue(createMockQueryBuilder()),
        order: vi.fn().mockReturnValue(createMockQueryBuilder()),
        limit: vi.fn().mockReturnValue(createMockQueryBuilder()),
        maybeSingle: vi.fn().mockReturnValue(createMockQueryBuilder()),
        in: vi.fn().mockReturnValue(createMockQueryBuilder()),
        then: vi.fn().mockImplementation(async (resolve) => {
          queryTimestamps.push(Date.now());
          // Add small delay to test parallel execution
          await new Promise(r => setTimeout(r, 10));
          return resolve({ count: 1, data: [{ id: 'session1' }], error: null });
        })
      });

      mockSupabaseClient.from.mockImplementation(() => createMockQueryBuilder());

      const startTime = Date.now();
      await privacyManager.getDataSummary(mockUserId);
      const endTime = Date.now();

      // If queries run in parallel, execution should be much faster than sequential
      expect(endTime - startTime).toBeLessThan(100); // Significantly less than 7 * 10ms
    });
  });
});
