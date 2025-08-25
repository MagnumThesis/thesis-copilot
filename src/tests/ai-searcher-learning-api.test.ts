import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Hono } from 'hono';
import learningApi from '../worker/handlers/ai-searcher-learning';

// Mock FeedbackLearningSystem
vi.mock('../worker/lib/feedback-learning-system', () => ({
  FeedbackLearningSystem: vi.fn().mockImplementation(() => ({
    storeFeedbackForLearning: vi.fn(),
    applyFeedbackBasedRanking: vi.fn(),
    getUserPreferencePatterns: vi.fn(),
    generateAdaptiveFilters: vi.fn(),
    getLearningMetrics: vi.fn(),
    clearUserLearningData: vi.fn(),
  }))
}));

const mockEnv = {
  DB: {
    prepare: vi.fn(),
  },
};

describe('AI Searcher Learning API', () => {
  let app: Hono;
  let mockLearningSystem: any;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    app.route('/', learningApi);
    
    const { FeedbackLearningSystem } = require('../worker/lib/feedback-learning-system');
    mockLearningSystem = new FeedbackLearningSystem(mockEnv);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /feedback', () => {
    it('should submit learning feedback successfully', async () => {
      mockLearningSystem.storeFeedbackForLearning.mockResolvedValue(undefined);

      const requestBody = {
        userId: 'test-user-123',
        searchSessionId: 'test-session-456',
        resultId: 'test-result-789',
        isRelevant: true,
        qualityRating: 4,
        comments: 'Very helpful paper',
        resultMetadata: {
          title: 'Machine Learning in Healthcare',
          authors: ['Smith, J.', 'Doe, A.'],
          journal: 'Nature Medicine',
          year: 2023,
          citationCount: 150,
          topics: ['machine learning', 'healthcare', 'AI']
        }
      };

      const response = await app.request('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual({
        success: true,
        message: 'Learning feedback submitted successfully'
      });

      expect(mockLearningSystem.storeFeedbackForLearning).toHaveBeenCalledWith(
        'test-user-123',
        'test-session-456',
        'test-result-789',
        {
          isRelevant: true,
          qualityRating: 4,
          comments: 'Very helpful paper',
          resultMetadata: {
            title: 'Machine Learning in Healthcare',
            authors: ['Smith, J.', 'Doe, A.'],
            journal: 'Nature Medicine',
            year: 2023,
            citationCount: 150,
            topics: ['machine learning', 'healthcare', 'AI']
          }
        }
      );
    });

    it('should validate required fields', async () => {
      const requestBody = {
        userId: 'test-user-123',
        // Missing required fields
      };

      const response = await app.request('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, mockEnv);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should validate quality rating range', async () => {
      const requestBody = {
        userId: 'test-user-123',
        searchSessionId: 'test-session-456',
        resultId: 'test-result-789',
        isRelevant: true,
        qualityRating: 6, // Invalid rating
        resultMetadata: {
          title: 'Test Paper',
          authors: ['Test, A.'],
          topics: ['test']
        }
      };

      const response = await app.request('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, mockEnv);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Quality rating must be between 1 and 5');
    });

    it('should validate result metadata format', async () => {
      const requestBody = {
        userId: 'test-user-123',
        searchSessionId: 'test-session-456',
        resultId: 'test-result-789',
        isRelevant: true,
        qualityRating: 4,
        resultMetadata: {
          // Missing required fields
          title: 'Test Paper'
        }
      };

      const response = await app.request('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, mockEnv);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid result metadata format');
    });

    it('should handle learning system errors', async () => {
      mockLearningSystem.storeFeedbackForLearning.mockRejectedValue(new Error('Database error'));

      const requestBody = {
        userId: 'test-user-123',
        searchSessionId: 'test-session-456',
        resultId: 'test-result-789',
        isRelevant: true,
        qualityRating: 4,
        resultMetadata: {
          title: 'Test Paper',
          authors: ['Test, A.'],
          topics: ['test']
        }
      };

      const response = await app.request('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, mockEnv);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /apply-ranking', () => {
    it('should apply learning-based ranking successfully', async () => {
      const mockRankedResults = [
        {
          id: 'result-1',
          resultTitle: 'Enhanced Paper',
          relevanceScore: 0.95,
          qualityScore: 0.9
        }
      ];

      mockLearningSystem.applyFeedbackBasedRanking.mockResolvedValue(mockRankedResults);

      const requestBody = {
        userId: 'test-user-123',
        searchResults: [
          {
            id: 'result-1',
            title: 'Original Paper',
            relevanceScore: 0.7,
            qualityScore: 0.8
          }
        ]
      };

      const response = await app.request('/apply-ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual({
        success: true,
        results: mockRankedResults,
        message: 'Learning-based ranking applied successfully'
      });

      expect(mockLearningSystem.applyFeedbackBasedRanking).toHaveBeenCalledWith(
        'test-user-123',
        requestBody.searchResults
      );
    });

    it('should validate required fields for ranking', async () => {
      const requestBody = {
        userId: 'test-user-123'
        // Missing searchResults
      };

      const response = await app.request('/apply-ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, mockEnv);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });
  });

  describe('GET /preferences/:userId', () => {
    it('should get user preferences successfully', async () => {
      const mockPreferences = {
        userId: 'test-user-123',
        preferredAuthors: ['Smith, J.'],
        preferredJournals: ['Nature'],
        topicPreferences: { 'AI': 0.8 },
        qualityThreshold: 0.7,
        lastUpdated: new Date()
      };

      mockLearningSystem.getUserPreferencePatterns.mockResolvedValue(mockPreferences);

      const response = await app.request('/preferences/test-user-123', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual({
        success: true,
        preferences: mockPreferences,
        message: 'User preferences retrieved successfully'
      });

      expect(mockLearningSystem.getUserPreferencePatterns).toHaveBeenCalledWith('test-user-123');
    });

    it('should validate user ID parameter', async () => {
      const response = await app.request('/preferences/', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(404); // Route not found without userId
    });
  });

  describe('GET /adaptive-filters/:userId', () => {
    it('should generate adaptive filters successfully', async () => {
      const mockFilters = [
        {
          type: 'author',
          condition: 'boost',
          value: 'Smith, J.',
          weight: 0.8,
          confidence: 0.9,
          source: 'pattern_recognition'
        }
      ];

      mockLearningSystem.generateAdaptiveFilters.mockResolvedValue(mockFilters);

      const response = await app.request('/adaptive-filters/test-user-123', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual({
        success: true,
        filters: mockFilters,
        message: 'Adaptive filters generated successfully'
      });

      expect(mockLearningSystem.generateAdaptiveFilters).toHaveBeenCalledWith('test-user-123');
    });
  });

  describe('GET /metrics/:userId', () => {
    it('should get learning metrics successfully', async () => {
      const mockMetrics = {
        totalFeedbackCount: 25,
        positiveRatings: 18,
        negativeRatings: 7,
        averageRating: 4.1,
        improvementTrend: 0.1,
        confidenceLevel: 0.8
      };

      mockLearningSystem.getLearningMetrics.mockResolvedValue(mockMetrics);

      const response = await app.request('/metrics/test-user-123', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual({
        success: true,
        metrics: mockMetrics,
        message: 'Learning metrics retrieved successfully'
      });

      expect(mockLearningSystem.getLearningMetrics).toHaveBeenCalledWith('test-user-123');
    });
  });

  describe('DELETE /user-data/:userId', () => {
    it('should clear user learning data successfully', async () => {
      mockLearningSystem.clearUserLearningData.mockResolvedValue(undefined);

      const response = await app.request('/user-data/test-user-123', {
        method: 'DELETE',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual({
        success: true,
        message: 'User learning data cleared successfully'
      });

      expect(mockLearningSystem.clearUserLearningData).toHaveBeenCalledWith('test-user-123');
    });
  });

  describe('POST /batch-update', () => {
    it('should process batch feedback updates successfully', async () => {
      mockLearningSystem.storeFeedbackForLearning
        .mockResolvedValueOnce(undefined) // First feedback succeeds
        .mockRejectedValueOnce(new Error('DB error')) // Second feedback fails
        .mockResolvedValueOnce(undefined); // Third feedback succeeds

      const requestBody = {
        feedbackBatch: [
          {
            userId: 'user-1',
            searchSessionId: 'session-1',
            resultId: 'result-1',
            feedbackData: {
              isRelevant: true,
              qualityRating: 4,
              resultMetadata: {
                title: 'Paper 1',
                authors: ['Author 1'],
                topics: ['topic1']
              }
            }
          },
          {
            userId: 'user-2',
            searchSessionId: 'session-2',
            resultId: 'result-2',
            feedbackData: {
              isRelevant: false,
              qualityRating: 2,
              resultMetadata: {
                title: 'Paper 2',
                authors: ['Author 2'],
                topics: ['topic2']
              }
            }
          },
          {
            userId: 'user-3',
            searchSessionId: 'session-3',
            resultId: 'result-3',
            feedbackData: {
              isRelevant: true,
              qualityRating: 5,
              resultMetadata: {
                title: 'Paper 3',
                authors: ['Author 3'],
                topics: ['topic3']
              }
            }
          }
        ]
      };

      const response = await app.request('/batch-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.processed).toBe(3);
      expect(data.successful).toBe(2);
      expect(data.failed).toBe(1);
      expect(data.results).toHaveLength(3);
      expect(data.results[0].success).toBe(true);
      expect(data.results[1].success).toBe(false);
      expect(data.results[2].success).toBe(true);
    });

    it('should validate batch format', async () => {
      const requestBody = {
        feedbackBatch: 'not-an-array'
      };

      const response = await app.request('/batch-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, mockEnv);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('feedbackBatch must be an array');
    });
  });

  describe('GET /status', () => {
    it('should return learning system status', async () => {
      // Mock database queries for status
      const mockDbResponse = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn()
      };

      mockEnv.DB.prepare.mockReturnValue(mockDbResponse);
      
      mockDbResponse.first
        .mockResolvedValueOnce({ count: 150 }) // total users
        .mockResolvedValueOnce({ count: 500 }) // total feedback
        .mockResolvedValueOnce({ count: 75 })  // active filters
        .mockResolvedValueOnce({ avg_confidence: 0.75 }); // avg confidence

      const response = await app.request('/status', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.status).toEqual({
        totalUsers: 150,
        totalFeedbackLast30Days: 500,
        activeFilters: 75,
        averageConfidenceLevel: 0.75,
        systemHealth: 'operational'
      });
    });

    it('should handle database errors in status check', async () => {
      mockEnv.DB.prepare.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await app.request('/status', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });
});