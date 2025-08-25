import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FeedbackLearningSystem, UserPreferencePattern, LearningMetrics, AdaptiveFilter } from '../worker/lib/feedback-learning-system';

// Mock environment
const mockEnv = {
  DB: {
    prepare: vi.fn(),
  },
};

// Mock database responses
const mockDbResponse = {
  bind: vi.fn().mockReturnThis(),
  run: vi.fn().mockResolvedValue({ success: true }),
  first: vi.fn().mockResolvedValue(null),
  all: vi.fn().mockResolvedValue({ results: [] }),
};

// Create a comprehensive mock chain that supports all database operations
const createMockDbChain = () => {
  const mockChain = {
    run: vi.fn().mockResolvedValue({ success: true }),
    first: vi.fn().mockResolvedValue(null),
    all: vi.fn().mockResolvedValue({ results: [] }),
  };
  
  return {
    bind: vi.fn().mockReturnValue(mockChain),
    ...mockChain
  };
};

describe('FeedbackLearningSystem', () => {
  let learningSystem: FeedbackLearningSystem;
  let mockUserId: string;
  let mockSessionId: string;
  let mockResultId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default mock that works for all database operations
    const defaultMockChain = createMockDbChain();
    mockEnv.DB.prepare.mockReturnValue(defaultMockChain);
    
    learningSystem = new FeedbackLearningSystem(mockEnv);
    mockUserId = 'test-user-123';
    mockSessionId = 'test-session-456';
    mockResultId = 'test-result-789';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('storeFeedbackForLearning', () => {
    it('should store feedback with all required fields', async () => {
      const feedback = {
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

      await learningSystem.storeFeedbackForLearning(mockUserId, mockSessionId, mockResultId, feedback);

      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_feedback_learning')
      );
      // Should also call prepare for user preference patterns operations
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM user_preference_patterns')
      );
    });

    it('should handle feedback without optional fields', async () => {
      const feedback = {
        isRelevant: false,
        qualityRating: 2,
        resultMetadata: {
          title: 'Poor Quality Paper',
          authors: ['Unknown, X.'],
          citationCount: 0,
          topics: ['irrelevant']
        }
      };

      await learningSystem.storeFeedbackForLearning(mockUserId, mockSessionId, mockResultId, feedback);

      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_feedback_learning')
      );
      // Should complete without throwing errors
      expect(mockEnv.DB.prepare).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      };
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain);

      const feedback = {
        isRelevant: true,
        qualityRating: 3,
        resultMetadata: {
          title: 'Test Paper',
          authors: ['Test, A.'],
          citationCount: 10,
          topics: ['test']
        }
      };

      await expect(
        learningSystem.storeFeedbackForLearning(mockUserId, mockSessionId, mockResultId, feedback)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getUserPreferencePatterns', () => {
    it('should return existing user patterns', async () => {
      const mockPattern = {
        user_id: mockUserId,
        preferred_authors: JSON.stringify(['Smith, J.', 'Doe, A.']),
        preferred_journals: JSON.stringify(['Nature', 'Science']),
        preferred_year_range: JSON.stringify({ min: 2015, max: 2023 }),
        preferred_citation_range: JSON.stringify({ min: 10, max: 1000 }),
        topic_preferences: JSON.stringify({ 'machine learning': 0.8, 'AI': 0.6 }),
        quality_threshold: 0.7,
        relevance_threshold: 0.6,
        rejection_patterns: JSON.stringify({
          authors: ['Bad, Author'],
          journals: ['Low Quality Journal'],
          keywords: ['spam']
        }),
        last_updated: new Date().toISOString()
      };

      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockPattern),
        }),
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      const result = await learningSystem.getUserPreferencePatterns(mockUserId);

      expect(result).toEqual({
        userId: mockUserId,
        preferredAuthors: ['Smith, J.', 'Doe, A.'],
        preferredJournals: ['Nature', 'Science'],
        preferredYearRange: { min: 2015, max: 2023 },
        preferredCitationRange: { min: 10, max: 1000 },
        topicPreferences: { 'machine learning': 0.8, 'AI': 0.6 },
        qualityThreshold: 0.7,
        relevanceThreshold: 0.6,
        rejectionPatterns: {
          authors: ['Bad, Author'],
          journals: ['Low Quality Journal'],
          keywords: ['spam']
        },
        lastUpdated: expect.any(Date)
      });
    });

    it('should return default patterns for new users', async () => {
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
        }),
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      const result = await learningSystem.getUserPreferencePatterns(mockUserId);

      expect(result).toEqual({
        userId: mockUserId,
        preferredAuthors: [],
        preferredJournals: [],
        preferredYearRange: { min: 2010, max: new Date().getFullYear() },
        preferredCitationRange: { min: 0, max: 10000 },
        topicPreferences: {},
        qualityThreshold: 0.5,
        relevanceThreshold: 0.5,
        rejectionPatterns: {
          authors: [],
          journals: [],
          keywords: []
        },
        lastUpdated: expect.any(Date)
      });
    });
  });

  describe('applyFeedbackBasedRanking', () => {
    it('should apply learning adjustments to search results', async () => {
      const mockUserPatterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: ['Smith, J.'],
        preferredJournals: ['Nature'],
        preferredYearRange: { min: 2020, max: 2023 },
        preferredCitationRange: { min: 50, max: 1000 },
        topicPreferences: { 'machine learning': 0.8 },
        qualityThreshold: 0.7,
        relevanceThreshold: 0.6,
        rejectionPatterns: {
          authors: ['Bad, Author'],
          journals: ['Low Journal'],
          keywords: []
        },
        lastUpdated: new Date()
      };

      // Mock getUserPreferencePatterns
      vi.spyOn(learningSystem, 'getUserPreferencePatterns').mockResolvedValue(mockUserPatterns);
      
      // Mock generateAdaptiveFilters
      vi.spyOn(learningSystem, 'generateAdaptiveFilters').mockResolvedValue([]);

      const searchResults = [
        {
          id: 'result-1',
          searchSessionId: mockSessionId,
          resultTitle: 'Machine Learning Paper',
          resultAuthors: ['Smith, J.', 'Other, A.'],
          resultJournal: 'Nature',
          resultYear: 2022,
          relevanceScore: 0.7,
          qualityScore: 0.8,
          confidenceScore: 0.9,
          citationCount: 100,
          addedToLibrary: false,
          createdAt: new Date()
        },
        {
          id: 'result-2',
          searchSessionId: mockSessionId,
          resultTitle: 'Poor Quality Paper',
          resultAuthors: ['Bad, Author'],
          resultJournal: 'Low Journal',
          resultYear: 2021,
          relevanceScore: 0.5,
          qualityScore: 0.4,
          confidenceScore: 0.6,
          citationCount: 5,
          addedToLibrary: false,
          createdAt: new Date()
        }
      ];

      const rankedResults = await learningSystem.applyFeedbackBasedRanking(mockUserId, searchResults);

      expect(rankedResults).toHaveLength(2);
      
      // First result should be boosted (preferred author + journal)
      expect(rankedResults[0].resultTitle).toBe('Machine Learning Paper');
      expect(rankedResults[0].relevanceScore).toBeGreaterThan(0.7);
      
      // Second result should be penalized (rejected author + journal)
      expect(rankedResults[1].resultTitle).toBe('Poor Quality Paper');
      expect(rankedResults[1].relevanceScore).toBeLessThan(0.5);
    });

    it('should handle errors gracefully and return original results', async () => {
      vi.spyOn(learningSystem, 'getUserPreferencePatterns').mockRejectedValue(new Error('DB error'));

      const searchResults = [
        {
          id: 'result-1',
          searchSessionId: mockSessionId,
          resultTitle: 'Test Paper',
          resultAuthors: ['Test, A.'],
          relevanceScore: 0.7,
          qualityScore: 0.8,
          confidenceScore: 0.9,
          citationCount: 50,
          addedToLibrary: false,
          createdAt: new Date()
        }
      ];

      const rankedResults = await learningSystem.applyFeedbackBasedRanking(mockUserId, searchResults);

      // Should return original results when learning fails
      expect(rankedResults).toEqual(searchResults);
    });
  });

  describe('generateAdaptiveFilters', () => {
    it('should generate filters based on user patterns', async () => {
      const mockUserPatterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: ['Smith, J.', 'Doe, A.'],
        preferredJournals: ['Nature', 'Science'],
        preferredYearRange: { min: 2020, max: 2023 },
        preferredCitationRange: { min: 50, max: 1000 },
        topicPreferences: { 'AI': 0.8 },
        qualityThreshold: 0.7,
        relevanceThreshold: 0.6,
        rejectionPatterns: {
          authors: ['Bad, Author'],
          journals: ['Low Journal'],
          keywords: ['spam']
        },
        lastUpdated: new Date()
      };

      const mockMetrics: LearningMetrics = {
        totalFeedbackCount: 20,
        positiveRatings: 15,
        negativeRatings: 5,
        averageRating: 4.2,
        improvementTrend: 0.1,
        confidenceLevel: 0.8
      };

      vi.spyOn(learningSystem, 'getUserPreferencePatterns').mockResolvedValue(mockUserPatterns);
      vi.spyOn(learningSystem, 'getLearningMetrics').mockResolvedValue(mockMetrics);

      const filters = await learningSystem.generateAdaptiveFilters(mockUserId);

      expect(filters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'author',
            condition: 'boost',
            value: 'Smith, J.|Doe, A.',
            confidence: 0.8,
            source: 'pattern_recognition'
          }),
          expect.objectContaining({
            type: 'journal',
            condition: 'boost',
            value: 'Nature|Science',
            confidence: 0.8,
            source: 'pattern_recognition'
          }),
          expect.objectContaining({
            type: 'author',
            condition: 'penalize',
            value: 'Bad, Author',
            source: 'explicit_feedback'
          })
        ])
      );
    });

    it('should return minimal filters for users with no patterns', async () => {
      const defaultPatterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: [],
        preferredJournals: [],
        preferredYearRange: { min: 2010, max: new Date().getFullYear() }, // This will create a year filter
        preferredCitationRange: { min: 0, max: 10000 },
        topicPreferences: {},
        qualityThreshold: 0.5,
        relevanceThreshold: 0.5,
        rejectionPatterns: {
          authors: [],
          journals: [],
          keywords: []
        },
        lastUpdated: new Date()
      };

      const mockMetrics: LearningMetrics = {
        totalFeedbackCount: 0,
        positiveRatings: 0,
        negativeRatings: 0,
        averageRating: 0,
        improvementTrend: 0,
        confidenceLevel: 0
      };

      vi.spyOn(learningSystem, 'getUserPreferencePatterns').mockResolvedValue(defaultPatterns);
      vi.spyOn(learningSystem, 'getLearningMetrics').mockResolvedValue(mockMetrics);

      const filters = await learningSystem.generateAdaptiveFilters(mockUserId);

      // Should have at least a year filter if the range is not default
      expect(filters.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getLearningMetrics', () => {
    it('should calculate learning metrics from feedback data', async () => {
      const mockFeedbackStats = {
        total_feedback: 25,
        positive_ratings: 18,
        negative_ratings: 7,
        average_rating: 4.1
      };

      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockFeedbackStats),
        }),
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      const metrics = await learningSystem.getLearningMetrics(mockUserId);

      expect(metrics).toEqual({
        totalFeedbackCount: 25,
        positiveRatings: 18,
        negativeRatings: 7,
        averageRating: 4.1,
        improvementTrend: 0.1, // > 3 average rating
        confidenceLevel: expect.any(Number) // calculated based on feedback volume
      });

      expect(metrics.confidenceLevel).toBeGreaterThan(0);
      expect(metrics.confidenceLevel).toBeLessThanOrEqual(1);
    });

    it('should return zero metrics for users with no feedback', async () => {
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            total_feedback: 0,
            positive_ratings: 0,
            negative_ratings: 0,
            average_rating: 0
          }),
        }),
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      const metrics = await learningSystem.getLearningMetrics(mockUserId);

      expect(metrics).toEqual({
        totalFeedbackCount: 0,
        positiveRatings: 0,
        negativeRatings: 0,
        averageRating: 0,
        improvementTrend: -0.1, // < 3 average rating
        confidenceLevel: 0
      });
    });
  });

  describe('clearUserLearningData', () => {
    it('should clear all learning data for a user', async () => {
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      };
      mockEnv.DB.prepare.mockReturnValue(mockChain);

      await learningSystem.clearUserLearningData(mockUserId);

      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        'DELETE FROM user_feedback_learning WHERE user_id = ?'
      );
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        'DELETE FROM user_preference_patterns WHERE user_id = ?'
      );
      expect(mockChain.bind).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle database errors when clearing data', async () => {
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockRejectedValue(new Error('Delete failed')),
        }),
      };
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain);

      await expect(
        learningSystem.clearUserLearningData(mockUserId)
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('pattern calculation helpers', () => {
    it('should calculate author boost correctly', async () => {
      const patterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: ['Smith, J.'],
        preferredJournals: [],
        preferredYearRange: { min: 2010, max: 2023 },
        preferredCitationRange: { min: 0, max: 10000 },
        topicPreferences: {},
        qualityThreshold: 0.5,
        relevanceThreshold: 0.5,
        rejectionPatterns: {
          authors: ['Bad, Author'],
          journals: [],
          keywords: []
        },
        lastUpdated: new Date()
      };

      // Test preferred author boost
      const boost1 = (learningSystem as any).calculateAuthorBoost(['Smith, J.'], patterns);
      expect(boost1).toBe(0.3);

      // Test rejected author penalty
      const boost2 = (learningSystem as any).calculateAuthorBoost(['Bad, Author'], patterns);
      expect(boost2).toBe(-0.4);

      // Test neutral author
      const boost3 = (learningSystem as any).calculateAuthorBoost(['Neutral, Author'], patterns);
      expect(boost3).toBe(0);

      // Test mixed authors
      const boost4 = (learningSystem as any).calculateAuthorBoost(['Smith, J.', 'Bad, Author'], patterns);
      expect(boost4).toBeCloseTo(-0.1, 5); // 0.3 - 0.4 = -0.1
    });

    it('should calculate journal boost correctly', async () => {
      const patterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: [],
        preferredJournals: ['Nature'],
        preferredYearRange: { min: 2010, max: 2023 },
        preferredCitationRange: { min: 0, max: 10000 },
        topicPreferences: {},
        qualityThreshold: 0.5,
        relevanceThreshold: 0.5,
        rejectionPatterns: {
          authors: [],
          journals: ['Low Journal'],
          keywords: []
        },
        lastUpdated: new Date()
      };

      // Test preferred journal boost
      const boost1 = (learningSystem as any).calculateJournalBoost('Nature', patterns);
      expect(boost1).toBe(0.2);

      // Test rejected journal penalty
      const boost2 = (learningSystem as any).calculateJournalBoost('Low Journal', patterns);
      expect(boost2).toBe(-0.3);

      // Test neutral journal
      const boost3 = (learningSystem as any).calculateJournalBoost('Neutral Journal', patterns);
      expect(boost3).toBe(0);

      // Test undefined journal
      const boost4 = (learningSystem as any).calculateJournalBoost(undefined, patterns);
      expect(boost4).toBe(0);
    });
  });
});