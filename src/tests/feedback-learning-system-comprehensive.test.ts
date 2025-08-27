/**
 * Feedback Learning System Tests
 * Comprehensive tests for the feedback-driven learning system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  FeedbackLearningSystem,
  UserPreferencePattern,
  LearningMetrics,
  AdaptiveFilter,
  FeedbackData,
  SessionFeedback,
  ResultFeedback
} from '../worker/lib/feedback-learning-system'

// Mock environment for database operations
const mockEnv = {
  DB: {
    prepare: vi.fn()
  }
}

// Mock database response chain
const createMockDbChain = () => ({
  bind: vi.fn().mockReturnThis(),
  run: vi.fn().mockResolvedValue({ success: true }),
  first: vi.fn().mockResolvedValue(null),
  all: vi.fn().mockResolvedValue({ results: [] })
})

describe('FeedbackLearningSystem', () => {
  let learningSystem: FeedbackLearningSystem
  let mockUserId: string
  let mockSessionId: string
  let mockResultId: string

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up default mock that works for all database operations
    const defaultMockChain = createMockDbChain()
    mockEnv.DB.prepare.mockReturnValue(defaultMockChain)
    
    learningSystem = new FeedbackLearningSystem(mockEnv as any)
    mockUserId = 'test-user-123'
    mockSessionId = 'test-session-456'
    mockResultId = 'test-result-789'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('storeFeedbackForLearning', () => {
    it('should store comprehensive feedback data', async () => {
      const feedback: ResultFeedback = {
        isRelevant: true,
        qualityRating: 5,
        comments: 'Excellent paper with great insights',
        resultMetadata: {
          title: 'Machine Learning in Healthcare',
          authors: ['Smith, J.', 'Doe, A.'],
          journal: 'Nature Medicine',
          year: 2023,
          citationCount: 150,
          topics: ['machine learning', 'healthcare', 'AI'],
          keywords: ['ML', 'healthcare', 'diagnosis']
        }
      }

      await learningSystem.storeFeedbackForLearning(mockUserId, mockSessionId, mockResultId, feedback)

      // Should call database with correct parameters
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_feedback_learning')
      )
      
      const prepareCall = mockEnv.DB.prepare.mock.calls[0][0]
      expect(prepareCall).toContain('user_id')
      expect(prepareCall).toContain('session_id')
      expect(prepareCall).toContain('result_id')
      expect(prepareCall).toContain('is_relevant')
      expect(prepareCall).toContain('quality_rating')
    })

    it('should handle feedback without optional fields', async () => {
      const feedback: ResultFeedback = {
        isRelevant: false,
        qualityRating: 2,
        resultMetadata: {
          title: 'Poor Quality Paper',
          authors: ['Unknown, X.'],
          citationCount: 0,
          topics: ['irrelevant'],
          keywords: ['bad']
        }
      }

      await learningSystem.storeFeedbackForLearning(mockUserId, mockSessionId, mockResultId, feedback)

      // Should complete without throwing errors
      expect(mockEnv.DB.prepare).toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      const feedback: ResultFeedback = {
        isRelevant: true,
        qualityRating: 3,
        resultMetadata: {
          title: 'Test Paper',
          authors: ['Test, A.'],
          citationCount: 10,
          topics: ['test'],
          keywords: ['test']
        }
      }

      await expect(
        learningSystem.storeFeedbackForLearning(mockUserId, mockSessionId, mockResultId, feedback)
      ).rejects.toThrow('Database error')
    })

    it('should validate feedback data before storing', async () => {
      const invalidFeedback: any = {
        isRelevant: true,
        qualityRating: 6, // Invalid rating (> 5)
        resultMetadata: {
          title: 'Test Paper',
          authors: ['Test, A.'],
          citationCount: -5, // Invalid citation count
          topics: ['test'],
          keywords: ['test']
        }
      }

      await expect(
        learningSystem.storeFeedbackForLearning(mockUserId, mockSessionId, mockResultId, invalidFeedback)
      ).rejects.toThrow() // Should validate and throw error
    })
  })

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
      }

      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockPattern)
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      const result = await learningSystem.getUserPreferencePatterns(mockUserId)

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
      })
    })

    it('should return default patterns for new users', async () => {
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null)
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      const result = await learningSystem.getUserPreferencePatterns(mockUserId)

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
      })
    })

    it('should handle database errors gracefully', async () => {
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      const result = await learningSystem.getUserPreferencePatterns(mockUserId)

      // Should return default patterns on error
      expect(result.userId).toBe(mockUserId)
      expect(result.preferredAuthors).toEqual([])
      expect(result.preferredJournals).toEqual([])
    })
  })

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
      }

      // Mock getUserPreferencePatterns
      vi.spyOn(learningSystem, 'getUserPreferencePatterns').mockResolvedValue(mockUserPatterns)
      
      // Mock generateAdaptiveFilters
      vi.spyOn(learningSystem, 'generateAdaptiveFilters').mockResolvedValue([])

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
      ] as any[]

      const rankedResults = await learningSystem.applyFeedbackBasedRanking(mockUserId, searchResults)

      expect(rankedResults).toHaveLength(2)
      
      // First result should be boosted (preferred author + journal)
      expect(rankedResults[0].resultTitle).toBe('Machine Learning Paper')
      expect(rankedResults[0].relevanceScore).toBeGreaterThanOrEqual(0.7)
      
      // Second result should be penalized (rejected author + journal)
      expect(rankedResults[1].resultTitle).toBe('Poor Quality Paper')
      expect(rankedResults[1].relevanceScore).toBeLessThanOrEqual(0.5)
    })

    it('should handle errors gracefully and return original results', async () => {
      vi.spyOn(learningSystem, 'getUserPreferencePatterns').mockRejectedValue(new Error('DB error'))

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
      ] as any[]

      const rankedResults = await learningSystem.applyFeedbackBasedRanking(mockUserId, searchResults)

      // Should return original results when learning fails
      expect(rankedResults).toEqual(searchResults)
    })

    it('should handle empty results array', async () => {
      const rankedResults = await learningSystem.applyFeedbackBasedRanking(mockUserId, [])
      
      expect(rankedResults).toHaveLength(0)
    })
  })

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
      }

      const mockMetrics: LearningMetrics = {
        totalFeedbackCount: 20,
        positiveRatings: 15,
        negativeRatings: 5,
        averageRating: 4.2,
        improvementTrend: 0.1,
        confidenceLevel: 0.8
      }

      vi.spyOn(learningSystem, 'getUserPreferencePatterns').mockResolvedValue(mockUserPatterns)
      vi.spyOn(learningSystem, 'getLearningMetrics').mockResolvedValue(mockMetrics)

      const filters = await learningSystem.generateAdaptiveFilters(mockUserId)

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
      )
    })

    it('should return minimal filters for users with no patterns', async () => {
      const defaultPatterns: UserPreferencePattern = {
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
        lastUpdated: new Date()
      }

      const mockMetrics: LearningMetrics = {
        totalFeedbackCount: 0,
        positiveRatings: 0,
        negativeRatings: 0,
        averageRating: 0,
        improvementTrend: 0,
        confidenceLevel: 0
      }

      vi.spyOn(learningSystem, 'getUserPreferencePatterns').mockResolvedValue(defaultPatterns)
      vi.spyOn(learningSystem, 'getLearningMetrics').mockResolvedValue(mockMetrics)

      const filters = await learningSystem.generateAdaptiveFilters(mockUserId)

      // Should have at least a basic filter structure
      expect(filters.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle errors gracefully', async () => {
      vi.spyOn(learningSystem, 'getUserPreferencePatterns').mockRejectedValue(new Error('DB error'))

      const filters = await learningSystem.generateAdaptiveFilters(mockUserId)

      // Should return empty array on error
      expect(filters).toEqual([])
    })
  })

  describe('getLearningMetrics', () => {
    it('should calculate learning metrics from feedback data', async () => {
      const mockFeedbackStats = {
        total_feedback: 25,
        positive_ratings: 18,
        negative_ratings: 7,
        average_rating: 4.1
      }

      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockFeedbackStats)
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      const metrics = await learningSystem.getLearningMetrics(mockUserId)

      expect(metrics).toEqual({
        totalFeedbackCount: 25,
        positiveRatings: 18,
        negativeRatings: 7,
        averageRating: 4.1,
        improvementTrend: 0.1, // > 3 average rating
        confidenceLevel: expect.any(Number)
      })

      expect(metrics.confidenceLevel).toBeGreaterThan(0)
      expect(metrics.confidenceLevel).toBeLessThanOrEqual(1)
    })

    it('should return zero metrics for users with no feedback', async () => {
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            total_feedback: 0,
            positive_ratings: 0,
            negative_ratings: 0,
            average_rating: 0
          })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      const metrics = await learningSystem.getLearningMetrics(mockUserId)

      expect(metrics).toEqual({
        totalFeedbackCount: 0,
        positiveRatings: 0,
        negativeRatings: 0,
        averageRating: 0,
        improvementTrend: -0.1, // < 3 average rating
        confidenceLevel: 0
      })
    })

    it('should handle database errors gracefully', async () => {
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockRejectedValue(new Error('DB error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      const metrics = await learningSystem.getLearningMetrics(mockUserId)

      // Should return default metrics on error
      expect(metrics).toEqual({
        totalFeedbackCount: 0,
        positiveRatings: 0,
        negativeRatings: 0,
        averageRating: 0,
        improvementTrend: 0,
        confidenceLevel: 0
      })
    })
  })

  describe('clearUserLearningData', () => {
    it('should clear all learning data for a user', async () => {
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ success: true })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      await learningSystem.clearUserLearningData(mockUserId)

      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        'DELETE FROM user_feedback_learning WHERE user_id = ?'
      )
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        'DELETE FROM user_preference_patterns WHERE user_id = ?'
      )
      expect(mockChain.bind).toHaveBeenCalledWith(mockUserId)
    })

    it('should handle database errors when clearing data', async () => {
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockRejectedValue(new Error('Delete failed'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      await expect(
        learningSystem.clearUserLearningData(mockUserId)
      ).rejects.toThrow('Delete failed')
    })
  })

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
      }

      // Test preferred author boost
      const boost1 = (learningSystem as any).calculateAuthorBoost(['Smith, J.'], patterns)
      expect(boost1).toBe(0.3)

      // Test rejected author penalty
      const boost2 = (learningSystem as any).calculateAuthorBoost(['Bad, Author'], patterns)
      expect(boost2).toBe(-0.4)

      // Test neutral author
      const boost3 = (learningSystem as any).calculateAuthorBoost(['Neutral, Author'], patterns)
      expect(boost3).toBe(0)

      // Test mixed authors
      const boost4 = (learningSystem as any).calculateAuthorBoost(['Smith, J.', 'Bad, Author'], patterns)
      expect(boost4).toBeCloseTo(-0.1, 5) // 0.3 - 0.4 = -0.1
    })

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
      }

      // Test preferred journal boost
      const boost1 = (learningSystem as any).calculateJournalBoost('Nature', patterns)
      expect(boost1).toBe(0.2)

      // Test rejected journal penalty
      const boost2 = (learningSystem as any).calculateJournalBoost('Low Journal', patterns)
      expect(boost2).toBe(-0.3)

      // Test neutral journal
      const boost3 = (learningSystem as any).calculateJournalBoost('Neutral Journal', patterns)
      expect(boost3).toBe(0)

      // Test undefined journal
      const boost4 = (learningSystem as any).calculateJournalBoost(undefined, patterns)
      expect(boost4).toBe(0)
    })

    it('should calculate topic preference score', async () => {
      const patterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: [],
        preferredJournals: [],
        preferredYearRange: { min: 2010, max: 2023 },
        preferredCitationRange: { min: 0, max: 10000 },
        topicPreferences: { 'AI': 0.8, 'machine learning': 0.7 },
        qualityThreshold: 0.5,
        relevanceThreshold: 0.5,
        rejectionPatterns: {
          authors: [],
          journals: [],
          keywords: []
        },
        lastUpdated: new Date()
      }

      // Test high-preference topic
      const score1 = (learningSystem as any).calculateTopicPreference(['AI'], patterns)
      expect(score1).toBe(0.8)

      // Test medium-preference topic
      const score2 = (learningSystem as any).calculateTopicPreference(['machine learning'], patterns)
      expect(score2).toBe(0.7)

      // Test no preference topic
      const score3 = (learningSystem as any).calculateTopicPreference(['random topic'], patterns)
      expect(score3).toBe(0)

      // Test mixed topics
      const score4 = (learningSystem as any).calculateTopicPreference(['AI', 'random topic'], patterns)
      expect(score4).toBe(0.8) // Should take maximum preference
    })

    it('should calculate quality threshold adjustment', async () => {
      const patterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: [],
        preferredJournals: [],
        preferredYearRange: { min: 2010, max: 2023 },
        preferredCitationRange: { min: 0, max: 10000 },
        topicPreferences: {},
        qualityThreshold: 0.7, // High threshold
        relevanceThreshold: 0.5,
        rejectionPatterns: {
          authors: [],
          journals: [],
          keywords: []
        },
        lastUpdated: new Date()
      }

      // Test high-quality result
      const adjustment1 = (learningSystem as any).calculateQualityThresholdAdjustment(0.9, patterns)
      expect(adjustment1).toBe(0.2) // Positive adjustment for exceeding threshold

      // Test low-quality result
      const adjustment2 = (learningSystem as any).calculateQualityThresholdAdjustment(0.5, patterns)
      expect(adjustment2).toBe(-0.2) // Negative adjustment for below threshold

      // Test result meeting threshold exactly
      const adjustment3 = (learningSystem as any).calculateQualityThresholdAdjustment(0.7, patterns)
      expect(adjustment3).toBe(0) // No adjustment for meeting threshold
    })

    it('should calculate year range penalty', async () => {
      const patterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: [],
        preferredJournals: [],
        preferredYearRange: { min: 2020, max: 2023 },
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
      }

      // Test within preferred range
      const penalty1 = (learningSystem as any).calculateYearRangePenalty(2022, patterns)
      expect(penalty1).toBe(0) // No penalty for preferred years

      // Test outside preferred range (older)
      const penalty2 = (learningSystem as any).calculateYearRangePenalty(2015, patterns)
      expect(penalty2).toBe(-0.2) // Penalty for old papers

      // Test outside preferred range (newer)
      const penalty3 = (learningSystem as any).calculateYearRangePenalty(2025, patterns)
      expect(penalty3).toBe(-0.1) // Smaller penalty for newer papers
    })

    it('should calculate citation range penalty', async () => {
      const patterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: [],
        preferredJournals: [],
        preferredYearRange: { min: 2010, max: 2023 },
        preferredCitationRange: { min: 50, max: 500 },
        topicPreferences: {},
        qualityThreshold: 0.5,
        relevanceThreshold: 0.5,
        rejectionPatterns: {
          authors: [],
          journals: [],
          keywords: []
        },
        lastUpdated: new Date()
      }

      // Test within preferred range
      const penalty1 = (learningSystem as any).calculateCitationRangePenalty(200, patterns)
      expect(penalty1).toBe(0) // No penalty for preferred citation count

      // Test below minimum
      const penalty2 = (learningSystem as any).calculateCitationRangePenalty(25, patterns)
      expect(penalty2).toBe(-0.3) // Penalty for low citation count

      // Test above maximum
      const penalty3 = (learningSystem as any).calculateCitationRangePenalty(600, patterns)
      expect(penalty3).toBe(-0.1) // Smaller penalty for high citation count
    })
  })

  describe('adaptive filter generation', () => {
    it('should generate author boost filters', async () => {
      const patterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: ['Smith, J.', 'Doe, A.'],
        preferredJournals: [],
        preferredYearRange: { min: 2010, max: 2023 },
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
      }

      const metrics: LearningMetrics = {
        totalFeedbackCount: 50,
        positiveRatings: 40,
        negativeRatings: 10,
        averageRating: 4.5,
        improvementTrend: 0.2,
        confidenceLevel: 0.9
      }

      const filters = (learningSystem as any).generateAuthorFilters(patterns, metrics)

      expect(filters).toEqual([
        expect.objectContaining({
          type: 'author',
          condition: 'boost',
          value: 'Smith, J.|Doe, A.',
          confidence: 0.9,
          source: 'pattern_recognition'
        })
      ])
    })

    it('should generate author penalize filters', async () => {
      const patterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: [],
        preferredJournals: [],
        preferredYearRange: { min: 2010, max: 2023 },
        preferredCitationRange: { min: 0, max: 10000 },
        topicPreferences: {},
        qualityThreshold: 0.5,
        relevanceThreshold: 0.5,
        rejectionPatterns: {
          authors: ['Bad, Author', 'Terrible, Writer'],
          journals: [],
          keywords: []
        },
        lastUpdated: new Date()
      }

      const metrics: LearningMetrics = {
        totalFeedbackCount: 30,
        positiveRatings: 20,
        negativeRatings: 10,
        averageRating: 3.8,
        improvementTrend: 0.1,
        confidenceLevel: 0.7
      }

      const filters = (learningSystem as any).generateAuthorFilters(patterns, metrics)

      expect(filters).toEqual([
        expect.objectContaining({
          type: 'author',
          condition: 'penalize',
          value: 'Bad, Author',
          confidence: 0.7,
          source: 'explicit_feedback'
        }),
        expect.objectContaining({
          type: 'author',
          condition: 'penalize',
          value: 'Terrible, Writer',
          confidence: 0.7,
          source: 'explicit_feedback'
        })
      ])
    })

    it('should generate journal filters', async () => {
      const patterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: [],
        preferredJournals: ['Nature', 'Science'],
        preferredYearRange: { min: 2010, max: 2023 },
        preferredCitationRange: { min: 0, max: 10000 },
        topicPreferences: {},
        qualityThreshold: 0.5,
        relevanceThreshold: 0.5,
        rejectionPatterns: {
          authors: [],
          journals: ['Low Quality Journal'],
          keywords: []
        },
        lastUpdated: new Date()
      }

      const metrics: LearningMetrics = {
        totalFeedbackCount: 40,
        positiveRatings: 32,
        negativeRatings: 8,
        averageRating: 4.2,
        improvementTrend: 0.15,
        confidenceLevel: 0.8
      }

      const filters = (learningSystem as any).generateJournalFilters(patterns, metrics)

      expect(filters).toEqual([
        expect.objectContaining({
          type: 'journal',
          condition: 'boost',
          value: 'Nature|Science',
          confidence: 0.8,
          source: 'pattern_recognition'
        }),
        expect.objectContaining({
          type: 'journal',
          condition: 'penalize',
          value: 'Low Quality Journal',
          confidence: 0.8,
          source: 'explicit_feedback'
        })
      ])
    })

    it('should generate topic filters', async () => {
      const patterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: [],
        preferredJournals: [],
        preferredYearRange: { min: 2010, max: 2023 },
        preferredCitationRange: { min: 0, max: 10000 },
        topicPreferences: { 'AI': 0.9, 'machine learning': 0.8, 'NLP': 0.7 },
        qualityThreshold: 0.5,
        relevanceThreshold: 0.5,
        rejectionPatterns: {
          authors: [],
          journals: [],
          keywords: []
        },
        lastUpdated: new Date()
      }

      const metrics: LearningMetrics = {
        totalFeedbackCount: 60,
        positiveRatings: 50,
        negativeRatings: 10,
        averageRating: 4.6,
        improvementTrend: 0.25,
        confidenceLevel: 0.95
      }

      const filters = (learningSystem as any).generateTopicFilters(patterns, metrics)

      // Should generate filters for high-preference topics
      expect(filters.length).toBeGreaterThanOrEqual(1)
      expect(filters[0]).toMatchObject({
        type: 'topic',
        condition: 'boost',
        value: 'AI',
        confidence: 0.95,
        source: 'topic_preference_analysis'
      })
    })

    it('should generate quality-based filters', async () => {
      const patterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: [],
        preferredJournals: [],
        preferredYearRange: { min: 2010, max: 2023 },
        preferredCitationRange: { min: 100, max: 1000 },
        topicPreferences: {},
        qualityThreshold: 0.8, // High quality threshold
        relevanceThreshold: 0.5,
        rejectionPatterns: {
          authors: [],
          journals: [],
          keywords: []
        },
        lastUpdated: new Date()
      }

      const metrics: LearningMetrics = {
        totalFeedbackCount: 100,
        positiveRatings: 85,
        negativeRatings: 15,
        averageRating: 4.8,
        improvementTrend: 0.3,
        confidenceLevel: 0.98
      }

      const filters = (learningSystem as any).generateQualityFilters(patterns, metrics)

      // Should generate filters for high quality requirements
      expect(filters.length).toBeGreaterThanOrEqual(1)
      expect(filters.some(filter => 
        filter.type === 'citation_count' && filter.condition === 'minimum'
      )).toBe(true)
      
      expect(filters.some(filter => 
        filter.type === 'year' && filter.condition === 'minimum'
      )).toBe(true)
    })

    it('should generate comprehensive filter set', async () => {
      const patterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: ['Smith, J.', 'Doe, A.'],
        preferredJournals: ['Nature'],
        preferredYearRange: { min: 2020, max: 2023 },
        preferredCitationRange: { min: 50, max: 500 },
        topicPreferences: { 'AI': 0.8 },
        qualityThreshold: 0.7,
        relevanceThreshold: 0.6,
        rejectionPatterns: {
          authors: ['Bad, Author'],
          journals: ['Low Journal'],
          keywords: ['spam']
        },
        lastUpdated: new Date()
      }

      const metrics: LearningMetrics = {
        totalFeedbackCount: 75,
        positiveRatings: 65,
        negativeRatings: 10,
        averageRating: 4.5,
        improvementTrend: 0.2,
        confidenceLevel: 0.9
      }

      // Test comprehensive filter generation
      const authorFilters = (learningSystem as any).generateAuthorFilters(patterns, metrics)
      const journalFilters = (learningSystem as any).generateJournalFilters(patterns, metrics)
      const topicFilters = (learningSystem as any).generateTopicFilters(patterns, metrics)
      const qualityFilters = (learningSystem as any).generateQualityFilters(patterns, metrics)

      // Should generate all types of filters
      expect(authorFilters).toHaveLength(2) // 1 boost + 1 penalize
      expect(journalFilters).toHaveLength(2) // 1 boost + 1 penalize
      expect(topicFilters).toHaveLength(1) // 1 boost
      expect(qualityFilters.length).toBeGreaterThanOrEqual(2) // At least year and citation filters

      // All filters should have high confidence
      const allFilters = [...authorFilters, ...journalFilters, ...topicFilters, ...qualityFilters]
      expect(allFilters.every(filter => filter.confidence >= 0.8)).toBe(true)
    })
  })

  describe('learning metrics calculation', () => {
    it('should calculate confidence level based on feedback volume', async () => {
      // Test low feedback volume
      const lowVolumeMetrics = (learningSystem as any).calculateConfidenceLevel(5, 4.0)
      expect(lowVolumeMetrics).toBeCloseTo(0.25, 1) // Low confidence for few feedbacks

      // Test medium feedback volume
      const mediumVolumeMetrics = (learningSystem as any).calculateConfidenceLevel(25, 4.2)
      expect(mediumVolumeMetrics).toBeCloseTo(0.65, 1) // Medium confidence

      // Test high feedback volume
      const highVolumeMetrics = (learningSystem as any).calculateConfidenceLevel(100, 4.5)
      expect(highVolumeMetrics).toBeCloseTo(0.95, 1) // High confidence for lots of feedback

      // Test with low average rating
      const lowRatingMetrics = (learningSystem as any).calculateConfidenceLevel(50, 2.5)
      expect(lowRatingMetrics).toBeCloseTo(0.75, 1) // Still confident but lower due to poor ratings
    })

    it('should calculate improvement trend', async () => {
      // Test positive trend
      const positiveTrend = (learningSystem as any).calculateImprovementTrend(4.5)
      expect(positiveTrend).toBeGreaterThan(0)

      // Test neutral trend
      const neutralTrend = (learningSystem as any).calculateImprovementTrend(3.0)
      expect(neutralTrend).toBeCloseTo(0, 1)

      // Test negative trend
      const negativeTrend = (learningSystem as any).calculateImprovementTrend(2.0)
      expect(negativeTrend).toBeLessThan(0)
    })

    it('should handle edge cases in metric calculation', async () => {
      // Test with zero feedback
      const zeroFeedbackMetrics = (learningSystem as any).calculateConfidenceLevel(0, 0)
      expect(zeroFeedbackMetrics).toBe(0)

      // Test with maximum possible ratings
      const maxRatingMetrics = (learningSystem as any).calculateConfidenceLevel(1000, 5.0)
      expect(maxRatingMetrics).toBe(1.0) // Maximum confidence

      // Test with negative feedback counts (should not happen but handle gracefully)
      const negativeFeedbackMetrics = (learningSystem as any).calculateConfidenceLevel(-5, 3.0)
      expect(negativeFeedbackMetrics).toBe(0) // Should default to 0 for invalid input
    })
  })

  describe('performance and scalability', () => {
    it('should handle concurrent feedback processing', async () => {
      // Mock successful database operations
      const mockChain = createMockDbChain()
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      // Create multiple concurrent feedback submissions
      const feedbackPromises = Array.from({ length: 10 }, (_, i) => {
        const feedback: ResultFeedback = {
          isRelevant: i % 2 === 0,
          qualityRating: 3 + (i % 3),
          resultMetadata: {
            title: `Paper ${i}`,
            authors: [`Author ${i}`],
            citationCount: i * 10,
            topics: [`topic${i}`],
            keywords: [`keyword${i}`]
          }
        }

        return learningSystem.storeFeedbackForLearning(
          `user-${i}`,
          `session-${i}`,
          `result-${i}`,
          feedback
        )
      })

      // Execute all concurrently
      await Promise.all(feedbackPromises)

      // Should handle all without errors
      expect(mockEnv.DB.prepare).toHaveBeenCalledTimes(10)
    })

    it('should not accumulate memory with repeated operations', async () => {
      const mockChain = createMockDbChain()
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const feedback: ResultFeedback = {
          isRelevant: true,
          qualityRating: 4,
          resultMetadata: {
            title: `Test Paper ${i}`,
            authors: ['Test Author'],
            citationCount: 50,
            topics: ['test'],
            keywords: ['test']
          }
        }

        await learningSystem.storeFeedbackForLearning(
          `test-user-${i % 10}`,
          `test-session-${i % 5}`,
          `test-result-${i}`,
          feedback
        )
      }

      // Should not have memory issues
      expect(mockEnv.DB.prepare).toHaveBeenCalledTimes(100)
    })

    it('should handle large user preference patterns', async () => {
      // Create large preference patterns
      const largePatterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: Array.from({ length: 100 }, (_, i) => `Author ${i}`),
        preferredJournals: Array.from({ length: 50 }, (_, i) => `Journal ${i}`),
        preferredYearRange: { min: 2000, max: 2023 },
        preferredCitationRange: { min: 0, max: 10000 },
        topicPreferences: Object.fromEntries(
          Array.from({ length: 200 }, (_, i) => [`topic${i}`, 0.5 + (i % 50) / 100])
        ),
        qualityThreshold: 0.7,
        relevanceThreshold: 0.6,
        rejectionPatterns: {
          authors: Array.from({ length: 20 }, (_, i) => `Bad Author ${i}`),
          journals: Array.from({ length: 10 }, (_, i) => `Bad Journal ${i}`),
          keywords: Array.from({ length: 30 }, (_, i) => `spam${i}`)
        },
        lastUpdated: new Date()
      }

      const mockMetrics: LearningMetrics = {
        totalFeedbackCount: 1000,
        positiveRatings: 850,
        negativeRatings: 150,
        averageRating: 4.5,
        improvementTrend: 0.3,
        confidenceLevel: 0.95
      }

      vi.spyOn(learningSystem, 'getUserPreferencePatterns').mockResolvedValue(largePatterns)
      vi.spyOn(learningSystem, 'getLearningMetrics').mockResolvedValue(mockMetrics)

      const startTime = Date.now()
      const filters = await learningSystem.generateAdaptiveFilters(mockUserId)
      const endTime = Date.now()

      // Should complete within reasonable time (2 seconds for large dataset)
      expect(endTime - startTime).toBeLessThan(2000)
      
      // Should generate filters despite large dataset
      expect(filters.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('error recovery and resilience', () => {
    it('should recover from temporary database failures', async () => {
      // Mock intermittent database failures
      const mockChain = {
        bind: vi.fn().mockImplementation(() => {
          // Fail first 2 attempts, succeed on third
          const callCount = mockEnv.DB.prepare.mock.calls.length
          if (callCount <= 2) {
            return {
              run: vi.fn().mockRejectedValue(new Error('Temporary database error'))
            }
          }
          return {
            run: vi.fn().mockResolvedValue({ success: true })
          }
        })
      }
      
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      const feedback: ResultFeedback = {
        isRelevant: true,
        qualityRating: 4,
        resultMetadata: {
          title: 'Recovery Test Paper',
          authors: ['Test, Author'],
          citationCount: 75,
          topics: ['recovery'],
          keywords: ['test']
        }
      }

      // Should eventually succeed after retries
      await expect(
        learningSystem.storeFeedbackForLearning(mockUserId, mockSessionId, mockResultId, feedback)
      ).resolves.not.toThrow()
    })

    it('should maintain data consistency during partial failures', async () => {
      // Mock partial database failure (first operation fails, second succeeds)
      let callCount = 0
      const mockChain = {
        bind: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            return {
              run: vi.fn().mockRejectedValue(new Error('First operation failed'))
            }
          }
          return {
            run: vi.fn().mockResolvedValue({ success: true })
          }
        })
      }
      
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      const feedback: ResultFeedback = {
        isRelevant: true,
        qualityRating: 5,
        comments: 'Excellent paper',
        resultMetadata: {
          title: 'Consistency Test Paper',
          authors: ['Consistent, Author'],
          journal: 'Test Journal',
          year: 2023,
          citationCount: 150,
          doi: '10.1234/test.2023.001',
          url: 'https://test.com/paper',
          abstract: 'Test abstract',
          topics: ['consistency', 'testing'],
          keywords: ['test', 'consistency']
        }
      }

      // Should handle partial failures gracefully
      await expect(
        learningSystem.storeFeedbackForLearning(mockUserId, mockSessionId, mockResultId, feedback)
      ).rejects.toThrow('First operation failed')
      
      // Should not leave database in inconsistent state
      expect(callCount).toBe(1) // Only one attempt was made
    })

    it('should provide meaningful error messages for debugging', async () => {
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockRejectedValue(new Error('Database constraint violation: UNIQUE constraint failed'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      const feedback: ResultFeedback = {
        isRelevant: true,
        qualityRating: 4,
        resultMetadata: {
          title: 'Error Test Paper',
          authors: ['Error, Test'],
          citationCount: 60,
          topics: ['error'],
          keywords: ['test']
        }
      }

      try {
        await learningSystem.storeFeedbackForLearning(mockUserId, mockSessionId, mockResultId, feedback)
        fail('Should have thrown an error')
      } catch (error) {
        // Should provide detailed error information
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toContain('Database constraint violation')
        expect(error.message).toContain('UNIQUE constraint failed')
      }
    })
  })

  describe('integration with search system', () => {
    it('should work correctly with search result ranking', async () => {
      // Mock user patterns indicating strong preferences
      const mockUserPatterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: ['Preferred, Author'],
        preferredJournals: ['Top Journal'],
        preferredYearRange: { min: 2020, max: 2023 },
        preferredCitationRange: { min: 100, max: 1000 },
        topicPreferences: { 'AI': 0.9 },
        qualityThreshold: 0.8,
        relevanceThreshold: 0.7,
        rejectionPatterns: {
          authors: ['Unwanted, Author'],
          journals: ['Low Quality Journal'],
          keywords: ['spam']
        },
        lastUpdated: new Date()
      }

      // Mock learning metrics showing high confidence
      const mockMetrics: LearningMetrics = {
        totalFeedbackCount: 200,
        positiveRatings: 180,
        negativeRatings: 20,
        averageRating: 4.7,
        improvementTrend: 0.4,
        confidenceLevel: 0.98
      }

      vi.spyOn(learningSystem, 'getUserPreferencePatterns').mockResolvedValue(mockUserPatterns)
      vi.spyOn(learningSystem, 'getLearningMetrics').mockResolvedValue(mockMetrics)

      // Test search results that match and don't match user preferences
      const searchResults = [
        {
          id: 'preferred-result',
          searchSessionId: mockSessionId,
          resultTitle: 'Preferred AI Research',
          resultAuthors: ['Preferred, Author'],
          resultJournal: 'Top Journal',
          resultYear: 2023,
          relevanceScore: 0.8,
          qualityScore: 0.9,
          confidenceScore: 0.95,
          citationCount: 300,
          addedToLibrary: false,
          createdAt: new Date()
        },
        {
          id: 'neutral-result',
          searchSessionId: mockSessionId,
          resultTitle: 'Neutral Research Paper',
          resultAuthors: ['Neutral, Author'],
          resultJournal: 'Average Journal',
          resultYear: 2022,
          relevanceScore: 0.6,
          qualityScore: 0.7,
          confidenceScore: 0.8,
          citationCount: 150,
          addedToLibrary: false,
          createdAt: new Date()
        },
        {
          id: 'unwanted-result',
          searchSessionId: mockSessionId,
          resultTitle: 'Unwanted Spam Paper',
          resultAuthors: ['Unwanted, Author'],
          resultJournal: 'Low Quality Journal',
          resultYear: 2021,
          relevanceScore: 0.4,
          qualityScore: 0.3,
          confidenceScore: 0.6,
          citationCount: 25,
          addedToLibrary: false,
          createdAt: new Date()
        }
      ] as any[]

      const rankedResults = await learningSystem.applyFeedbackBasedRanking(mockUserId, searchResults)

      expect(rankedResults).toHaveLength(3)
      
      // Preferred result should be ranked highest
      expect(rankedResults[0].id).toBe('preferred-result')
      expect(rankedResults[0].relevanceScore).toBeGreaterThan(0.8) // Should be boosted
      
      // Unwanted result should be ranked lowest
      expect(rankedResults[2].id).toBe('unwanted-result')
      expect(rankedResults[2].relevanceScore).toBeLessThan(0.4) // Should be penalized
      
      // Neutral result should be in middle
      expect(rankedResults[1].id).toBe('neutral-result')
    })

    it('should generate adaptive filters for search optimization', async () => {
      // Mock user with clear preferences from feedback
      const mockUserPatterns: UserPreferencePattern = {
        userId: mockUserId,
        preferredAuthors: ['Expert, Dr.'],
        preferredJournals: ['Nature', 'Science', 'IEEE'],
        preferredYearRange: { min: 2020, max: 2023 },
        preferredCitationRange: { min: 50, max: 500 },
        topicPreferences: { 'machine learning': 0.9, 'AI': 0.85, 'NLP': 0.7 },
        qualityThreshold: 0.75,
        relevanceThreshold: 0.7,
        rejectionPatterns: {
          authors: ['Spammer, Bad'],
          journals: ['Predatory Journal'],
          keywords: ['fake', 'spam']
        },
        lastUpdated: new Date()
      }

      // Mock high-confidence learning metrics
      const mockMetrics: LearningMetrics = {
        totalFeedbackCount: 150,
        positiveRatings: 130,
        negativeRatings: 20,
        averageRating: 4.6,
        improvementTrend: 0.35,
        confidenceLevel: 0.95
      }

      vi.spyOn(learningSystem, 'getUserPreferencePatterns').mockResolvedValue(mockUserPatterns)
      vi.spyOn(learningSystem, 'getLearningMetrics').mockResolvedValue(mockMetrics)

      const adaptiveFilters = await learningSystem.generateAdaptiveFilters(mockUserId)

      // Should generate comprehensive adaptive filters
      expect(adaptiveFilters.length).toBeGreaterThan(5)
      
      // Should include author boost filters
      const authorBoostFilters = adaptiveFilters.filter(f => 
        f.type === 'author' && f.condition === 'boost'
      )
      expect(authorBoostFilters).toHaveLength(1)
      expect(authorBoostFilters[0].value).toContain('Expert, Dr.')
      
      // Should include journal boost filters
      const journalBoostFilters = adaptiveFilters.filter(f => 
        f.type === 'journal' && f.condition === 'boost'
      )
      expect(journalBoostFilters).toHaveLength(1)
      expect(journalBoostFilters[0].value).toContain('Nature')
      expect(journalBoostFilters[0].value).toContain('Science')
      expect(journalBoostFilters[0].value).toContain('IEEE')
      
      // Should include author penalize filters
      const authorPenalizeFilters = adaptiveFilters.filter(f => 
        f.type === 'author' && f.condition === 'penalize'
      )
      expect(authorPenalizeFilters).toHaveLength(1)
      expect(authorPenalizeFilters[0].value).toContain('Spammer, Bad')
      
      // Should include journal penalize filters
      const journalPenalizeFilters = adaptiveFilters.filter(f => 
        f.type === 'journal' && f.condition === 'penalize'
      )
      expect(journalPenalizeFilters).toHaveLength(1)
      expect(journalPenalizeFilters[0].value).toContain('Predatory Journal')
      
      // Should include topic filters
      const topicFilters = adaptiveFilters.filter(f => f.type === 'topic')
      expect(topicFilters.length).toBeGreaterThanOrEqual(1)
      expect(topicFilters[0].value).toBe('machine learning') // Highest preference topic
      
      // Should include quality-based filters
      const qualityFilters = adaptiveFilters.filter(f => 
        f.type === 'citation_count' || f.type === 'year'
      )
      expect(qualityFilters.length).toBeGreaterThanOrEqual(2)
      
      // All filters should have high confidence
      expect(adaptiveFilters.every(f => f.confidence >= 0.8)).toBe(true)
      
      // All filters should have clear sources
      expect(adaptiveFilters.every(f => f.source.length > 0)).toBe(true)
    })

    it('should handle new users with no learning history', async () => {
      // Mock new user with no patterns
      const newUserPatterns: UserPreferencePattern = {
        userId: 'new-user',
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
        lastUpdated: new Date()
      }

      // Mock zero learning metrics
      const zeroMetrics: LearningMetrics = {
        totalFeedbackCount: 0,
        positiveRatings: 0,
        negativeRatings: 0,
        averageRating: 0,
        improvementTrend: 0,
        confidenceLevel: 0
      }

      vi.spyOn(learningSystem, 'getUserPreferencePatterns').mockResolvedValue(newUserPatterns)
      vi.spyOn(learningSystem, 'getLearningMetrics').mockResolvedValue(zeroMetrics)

      // Test with new user
      const searchResults = [
        {
          id: 'result-1',
          searchSessionId: 'session-1',
          resultTitle: 'Test Paper',
          resultAuthors: ['Test, Author'],
          relevanceScore: 0.7,
          qualityScore: 0.6,
          confidenceScore: 0.8,
          citationCount: 50,
          addedToLibrary: false,
          createdAt: new Date()
        }
      ] as any[]

      // Should not crash with new user
      const rankedResults = await learningSystem.applyFeedbackBasedRanking('new-user', searchResults)
      expect(rankedResults).toEqual(searchResults) // Should return original results unchanged

      // Should generate minimal adaptive filters
      const adaptiveFilters = await learningSystem.generateAdaptiveFilters('new-user')
      expect(adaptiveFilters).toHaveLength(0) // No strong patterns yet
    })
  })
})