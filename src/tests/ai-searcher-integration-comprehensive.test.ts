/**
 * AI Searcher Integration Tests
 * Comprehensive integration tests for the complete AI Searcher workflow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AISearcherIntegrationTests } from '../tests/integration/ai-searcher-integration'
import { ScholarSearchResult, ExtractedContent } from '../lib/ai-types'

// Mock all dependencies
vi.mock('../worker/lib/google-scholar-client', () => ({
  GoogleScholarClient: vi.fn().mockImplementation(() => ({
    search: vi.fn(),
    parseResults: vi.fn(),
    validateResults: vi.fn(),
    getRateLimitStatus: vi.fn().mockReturnValue({
      isBlocked: false,
      blockUntil: 0,
      requestsInLastMinute: 0,
      requestsInLastHour: 0,
      remainingMinuteRequests: 100,
      remainingHourlyRequests: 1000
    })
  }))
}))

vi.mock('../worker/lib/content-extraction-engine', () => ({
  ContentExtractionEngine: vi.fn().mockImplementation(() => ({
    extractContent: vi.fn(),
    batchExtract: vi.fn(),
    combineExtractedContents: vi.fn()
  }))
}))

vi.mock('../worker/lib/query-generation-engine', () => ({
  QueryGenerationEngine: vi.fn().mockImplementation(() => ({
    generateQueries: vi.fn(),
    optimizeQuery: vi.fn(),
    combineQueries: vi.fn(),
    validateQuery: vi.fn(),
    refineQuery: vi.fn()
  }))
}))

vi.mock('../worker/lib/result-scoring-engine', () => ({
  ResultScoringEngine: vi.fn().mockImplementation(() => ({
    scoreResult: vi.fn(),
    scoreRelevance: vi.fn(),
    scoreQuality: vi.fn(),
    calculateConfidence: vi.fn(),
    rankResults: vi.fn(),
    applyQualityMetrics: vi.fn()
  }))
}))

vi.mock('../worker/lib/duplicate-detection-engine', () => ({
  DuplicateDetectionEngine: vi.fn().mockImplementation(() => ({
    detectDuplicates: vi.fn(),
    removeDuplicates: vi.fn(),
    mergeDuplicates: vi.fn()
  }))
}))

vi.mock('../worker/lib/feedback-learning-system', () => ({
  FeedbackLearningSystem: vi.fn().mockImplementation(() => ({
    storeFeedbackForLearning: vi.fn(),
    getUserPreferencePatterns: vi.fn(),
    applyFeedbackBasedRanking: vi.fn(),
    generateAdaptiveFilters: vi.fn(),
    getLearningMetrics: vi.fn(),
    clearUserLearningData: vi.fn()
  }))
}))

vi.mock('../lib/search-filters', () => ({
  applyFilters: vi.fn(),
  validateFilters: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
  sortResults: vi.fn()
}))

// Mock fetch for external API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AISearcherIntegrationTests', () => {
  let integrationTests: AISearcherIntegrationTests
  let mockEnv: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockEnv = {
      DB: {
        prepare: vi.fn()
      },
      SUPABASE_URL: 'test-supabase-url',
      SUPABASE_ANON: 'test-supabase-anon-key'
    }
    
    integrationTests = new AISearcherIntegrationTests(mockEnv)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Full Workflow Integration', () => {
    it('should execute complete search workflow from content extraction to ranked results', async () => {
      // Mock content extraction
      const mockExtractedContent: ExtractedContent[] = [
        {
          source: 'ideas',
          id: '1',
          title: 'Machine Learning Research',
          content: 'Research on machine learning algorithms for natural language processing applications.',
          keywords: ['machine learning', 'NLP', 'algorithms', 'research'],
          keyPhrases: ['machine learning algorithms', 'natural language processing'],
          topics: ['artificial intelligence', 'computational linguistics'],
          confidence: 0.9
        },
        {
          source: 'builder',
          id: 'test-conversation',
          title: 'AI-Powered Academic Writing',
          content: 'Exploring artificial intelligence applications in academic writing assistance tools.',
          keywords: ['artificial intelligence', 'academic writing', 'assistance', 'tools'],
          keyPhrases: ['AI applications', 'academic writing tools'],
          topics: ['educational technology', 'writing assistance'],
          confidence: 0.85
        }
      ]

      // Mock query generation
      const mockQueries = [
        {
          id: 'query-1',
          query: '"machine learning" AND "NLP" AND "algorithms"',
          originalContent: [mockExtractedContent[0]],
          generatedAt: new Date(),
          confidence: 0.9,
          keywords: ['machine learning', 'NLP', 'algorithms'],
          topics: ['artificial intelligence', 'computational linguistics'],
          queryType: 'basic' as const,
          optimization: {
            breadthScore: 0.7,
            specificityScore: 0.8,
            academicRelevance: 0.9,
            suggestions: [],
            alternativeQueries: []
          }
        },
        {
          id: 'query-2',
          query: '"artificial intelligence" AND "academic writing" AND "tools"',
          originalContent: [mockExtractedContent[1]],
          generatedAt: new Date(),
          confidence: 0.85,
          keywords: ['artificial intelligence', 'academic writing', 'tools'],
          topics: ['educational technology', 'writing assistance'],
          queryType: 'basic' as const,
          optimization: {
            breadthScore: 0.6,
            specificityScore: 0.7,
            academicRelevance: 0.85,
            suggestions: [],
            alternativeQueries: []
          }
        }
      ]

      // Mock search results
      const mockSearchResults: ScholarSearchResult[] = [
        {
          title: 'Machine Learning Algorithms for NLP',
          authors: ['Smith, J.', 'Doe, A.'],
          journal: 'Journal of AI Research',
          year: 2023,
          citations: 150,
          doi: '10.1234/jair.2023.001',
          url: 'https://example.com/paper1',
          abstract: 'This paper explores various machine learning algorithms for natural language processing tasks...',
          keywords: ['machine learning', 'NLP', 'algorithms'],
          confidence: 0.95,
          relevance_score: 0.9,
          citation_count: 150
        },
        {
          title: 'AI-Powered Writing Assistance Tools',
          authors: ['Johnson, B.', 'Wilson, M.'],
          journal: 'Computational Linguistics',
          year: 2022,
          citations: 89,
          doi: '10.5678/cl.2022.002',
          url: 'https://example.com/paper2',
          abstract: 'A comprehensive study on AI tools for academic writing assistance...',
          keywords: ['AI', 'writing assistance', 'tools'],
          confidence: 0.88,
          relevance_score: 0.85,
          citation_count: 89
        },
        {
          title: 'Deep Learning for Academic Research',
          authors: ['Brown, C.', 'Davis, E.'],
          journal: 'IEEE Transactions on Education',
          year: 2021,
          citations: 45,
          doi: '10.9012/ieee.2021.003',
          url: 'https://example.com/paper3',
          abstract: 'Applying deep learning techniques to enhance academic research productivity...',
          keywords: ['deep learning', 'academic research', 'productivity'],
          confidence: 0.82,
          relevance_score: 0.8,
          citation_count: 45
        }
      ]

      // Mock ranked results
      const mockRankedResults = [
        {
          ...mockSearchResults[0],
          relevanceScore: 0.9,
          qualityScore: 0.85,
          confidenceScore: 0.95,
          overallScore: 0.9,
          rank: 1,
          scoringBreakdown: {
            relevance: {
              textSimilarity: 0.9,
              keywordMatch: 0.85,
              topicOverlap: 0.8,
              semanticSimilarity: 0.75
            },
            quality: {
              citationScore: 0.9,
              recencyScore: 0.85,
              authorAuthority: 0.8,
              journalQuality: 0.95,
              completenessScore: 0.9
            },
            confidence: {
              metadataCompleteness: 0.95,
              sourceReliability: 0.9,
              extractionQuality: 0.85
            }
          }
        },
        {
          ...mockSearchResults[1],
          relevanceScore: 0.85,
          qualityScore: 0.8,
          confidenceScore: 0.88,
          overallScore: 0.84,
          rank: 2,
          scoringBreakdown: {
            relevance: {
              textSimilarity: 0.85,
              keywordMatch: 0.8,
              topicOverlap: 0.75,
              semanticSimilarity: 0.7
            },
            quality: {
              citationScore: 0.8,
              recencyScore: 0.75,
              authorAuthority: 0.7,
              journalQuality: 0.85,
              completenessScore: 0.85
            },
            confidence: {
              metadataCompleteness: 0.9,
              sourceReliability: 0.85,
              extractionQuality: 0.8
            }
          }
        },
        {
          ...mockSearchResults[2],
          relevanceScore: 0.8,
          qualityScore: 0.75,
          confidenceScore: 0.82,
          overallScore: 0.79,
          rank: 3,
          scoringBreakdown: {
            relevance: {
              textSimilarity: 0.8,
              keywordMatch: 0.75,
              topicOverlap: 0.7,
              semanticSimilarity: 0.65
            },
            quality: {
              citationScore: 0.75,
              recencyScore: 0.7,
              authorAuthority: 0.65,
              journalQuality: 0.8,
              completenessScore: 0.8
            },
            confidence: {
              metadataCompleteness: 0.85,
              sourceReliability: 0.8,
              extractionQuality: 0.75
            }
          }
        }
      ]

      // Mock all service responses
      const mockServices = {
        contentExtractionEngine: {
          extractContent: vi.fn().mockResolvedValue(mockExtractedContent[0]),
          batchExtract: vi.fn().mockResolvedValue(mockExtractedContent),
          combineExtractedContents: vi.fn().mockResolvedValue(mockExtractedContent[0])
        },
        queryGenerationEngine: {
          generateQueries: vi.fn().mockResolvedValue(mockQueries),
          optimizeQuery: vi.fn().mockResolvedValue({
            breadthScore: 0.7,
            specificityScore: 0.8,
            academicRelevance: 0.9,
            suggestions: [],
            alternativeQueries: []
          }),
          combineQueries: vi.fn().mockResolvedValue(mockQueries[0]),
          validateQuery: vi.fn().mockResolvedValue({
            isValid: true,
            confidence: 0.9,
            issues: [],
            suggestions: []
          }),
          refineQuery: vi.fn().mockResolvedValue({
            breadthAnalysis: {
              breadthScore: 0.7,
              classification: 'optimal' as const,
              reasoning: 'Good balance',
              termCount: 3,
              specificityLevel: 'moderate' as const,
              suggestions: []
            },
            alternativeTerms: {
              synonyms: [],
              relatedTerms: [],
              broaderTerms: [],
              narrowerTerms: [],
              academicVariants: []
            },
            validationResults: {
              isValid: true,
              issues: [],
              suggestions: [],
              confidence: 0.9
            },
            optimizationRecommendations: [],
            refinedQueries: []
          })
        },
        googleScholarClient: {
          search: vi.fn().mockResolvedValue(mockSearchResults),
          parseResults: vi.fn().mockResolvedValue(mockSearchResults),
          validateResults: vi.fn().mockResolvedValue(mockSearchResults),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        },
        resultScoringEngine: {
          scoreResult: vi.fn().mockImplementation((result) => ({
            relevanceScore: result.relevance_score || 0.5,
            qualityScore: 0.7,
            confidenceScore: result.confidence || 0.5,
            overallScore: 0.7,
            breakdown: {
              relevance: {
                textSimilarity: 0.5,
                keywordMatch: 0.5,
                topicOverlap: 0.5,
                semanticSimilarity: 0.5
              },
              quality: {
                citationScore: 0.5,
                recencyScore: 0.5,
                authorAuthority: 0.5,
                journalQuality: 0.5,
                completenessScore: 0.5
              },
              confidence: {
                metadataCompleteness: 0.5,
                sourceReliability: 0.5,
                extractionQuality: 0.5
              }
            }
          })),
          rankResults: vi.fn().mockResolvedValue(mockRankedResults),
          applyQualityMetrics: vi.fn().mockResolvedValue(mockSearchResults)
        },
        duplicateDetectionEngine: {
          detectDuplicates: vi.fn().mockReturnValue([]),
          removeDuplicates: vi.fn().mockResolvedValue(mockSearchResults),
          mergeDuplicates: vi.fn().mockImplementation((group) => group.primary)
        },
        feedbackLearningSystem: {
          getUserPreferencePatterns: vi.fn().mockResolvedValue({
            userId: 'test-user',
            preferredAuthors: [],
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
          }),
          applyFeedbackBasedRanking: vi.fn().mockResolvedValue(mockRankedResults),
          generateAdaptiveFilters: vi.fn().mockResolvedValue([]),
          getLearningMetrics: vi.fn().mockResolvedValue({
            totalFeedbackCount: 0,
            positiveRatings: 0,
            negativeRatings: 0,
            averageRating: 0,
            improvementTrend: 0,
            confidenceLevel: 0
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/content-extraction-engine')).ContentExtractionEngine
        .mockImplementation(() => mockServices.contentExtractionEngine)
        
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)
        
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)
        
      vi.mocked(require('../worker/lib/result-scoring-engine')).ResultScoringEngine
        .mockImplementation(() => mockServices.resultScoringEngine)
        
      vi.mocked(require('../worker/lib/duplicate-detection-engine')).DuplicateDetectionEngine
        .mockImplementation(() => mockServices.duplicateDetectionEngine)
        
      vi.mocked(require('../worker/lib/feedback-learning-system')).FeedbackLearningSystem
        .mockImplementation(() => mockServices.feedbackLearningSystem)

      // Execute the complete workflow
      const result = await integrationTests.executeCompleteWorkflow({
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' },
          { source: 'builder', id: 'test-conversation' }
        ],
        queryOptions: {
          maxKeywords: 5,
          optimizeForAcademic: true
        },
        filters: {
          dateRange: { start: 2020, end: 2023 },
          sortBy: 'relevance' as const
        }
      })

      // Verify complete workflow execution
      expect(result).toMatchObject({
        success: true,
        results: expect.arrayContaining([
          expect.objectContaining({
            title: 'Machine Learning Algorithms for NLP',
            authors: ['Smith, J.', 'Doe, A.'],
            journal: 'Journal of AI Research',
            year: 2023,
            citations: 150,
            doi: '10.1234/jair.2023.001',
            url: 'https://example.com/paper1',
            abstract: expect.stringContaining('machine learning algorithms'),
            keywords: ['machine learning', 'NLP', 'algorithms'],
            confidence: 0.95,
            relevance_score: 0.9,
            citation_count: 150,
            relevanceScore: 0.9,
            qualityScore: 0.85,
            confidenceScore: 0.95,
            overallScore: 0.9,
            rank: 1
          }),
          expect.objectContaining({
            title: 'AI-Powered Writing Assistance Tools',
            authors: ['Johnson, B.', 'Wilson, M.'],
            journal: 'Computational Linguistics',
            year: 2022,
            citations: 89,
            doi: '10.5678/cl.2022.002',
            url: 'https://example.com/paper2',
            abstract: expect.stringContaining('AI tools for academic writing'),
            keywords: ['AI', 'writing assistance', 'tools'],
            confidence: 0.88,
            relevance_score: 0.85,
            citation_count: 89,
            relevanceScore: 0.85,
            qualityScore: 0.8,
            confidenceScore: 0.88,
            overallScore: 0.84,
            rank: 2
          }),
          expect.objectContaining({
            title: 'Deep Learning for Academic Research',
            authors: ['Brown, C.', 'Davis, E.'],
            journal: 'IEEE Transactions on Education',
            year: 2021,
            citations: 45,
            doi: '10.9012/ieee.2021.003',
            url: 'https://example.com/paper3',
            abstract: expect.stringContaining('deep learning techniques'),
            keywords: ['deep learning', 'academic research', 'productivity'],
            confidence: 0.82,
            relevance_score: 0.8,
            citation_count: 45,
            relevanceScore: 0.8,
            qualityScore: 0.75,
            confidenceScore: 0.82,
            overallScore: 0.79,
            rank: 3
          })
        ]),
        total_results: 3,
        loaded_results: 3,
        has_more: false,
        sessionId: expect.any(String),
        processingTime: expect.any(Number),
        learningApplied: true,
        performance_metrics: expect.any(Object),
        search_metadata: expect.any(Object)
      })

      // Verify all components were called in the correct sequence
      expect(mockServices.contentExtractionEngine.batchExtract).toHaveBeenCalled()
      expect(mockServices.queryGenerationEngine.generateQueries).toHaveBeenCalled()
      expect(mockServices.googleScholarClient.search).toHaveBeenCalled()
      expect(mockServices.resultScoringEngine.rankResults).toHaveBeenCalled()
      expect(mockServices.duplicateDetectionEngine.removeDuplicates).toHaveBeenCalled()
      expect(mockServices.feedbackLearningSystem.applyFeedbackBasedRanking).toHaveBeenCalled()

      // Verify processing time is reasonable
      expect(result.processingTime).toBeGreaterThan(0)
      expect(result.processingTime).toBeLessThan(10000) // Should complete within 10 seconds
    })

    it('should handle workflow with direct query input', async () => {
      // Mock search results
      const mockSearchResults: ScholarSearchResult[] = [
        {
          title: 'Direct Query Paper',
          authors: ['Test, Author'],
          journal: 'Test Journal',
          year: 2023,
          citations: 25,
          doi: '10.1234/test.2023.001',
          url: 'https://example.com/test-paper',
          abstract: 'Test paper for direct query workflow...',
          keywords: ['test', 'query'],
          confidence: 0.8,
          relevance_score: 0.75,
          citation_count: 25
        }
      ]

      // Mock ranked results
      const mockRankedResults = [
        {
          ...mockSearchResults[0],
          relevanceScore: 0.75,
          qualityScore: 0.7,
          confidenceScore: 0.8,
          overallScore: 0.75,
          rank: 1,
          scoringBreakdown: {
            relevance: {
              textSimilarity: 0.75,
              keywordMatch: 0.7,
              topicOverlap: 0.65,
              semanticSimilarity: 0.6
            },
            quality: {
              citationScore: 0.7,
              recencyScore: 0.65,
              authorAuthority: 0.6,
              journalQuality: 0.75,
              completenessScore: 0.75
            },
            confidence: {
              metadataCompleteness: 0.8,
              sourceReliability: 0.75,
              extractionQuality: 0.7
            }
          }
        }
      ]

      // Mock service responses
      const mockServices = {
        googleScholarClient: {
          search: vi.fn().mockResolvedValue(mockSearchResults),
          parseResults: vi.fn().mockResolvedValue(mockSearchResults),
          validateResults: vi.fn().mockResolvedValue(mockSearchResults),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        },
        resultScoringEngine: {
          scoreResult: vi.fn().mockImplementation((result) => ({
            relevanceScore: result.relevance_score || 0.5,
            qualityScore: 0.7,
            confidenceScore: result.confidence || 0.5,
            overallScore: 0.7,
            breakdown: {
              relevance: {
                textSimilarity: 0.5,
                keywordMatch: 0.5,
                topicOverlap: 0.5,
                semanticSimilarity: 0.5
              },
              quality: {
                citationScore: 0.5,
                recencyScore: 0.5,
                authorAuthority: 0.5,
                journalQuality: 0.5,
                completenessScore: 0.5
              },
              confidence: {
                metadataCompleteness: 0.5,
                sourceReliability: 0.5,
                extractionQuality: 0.5
              }
            }
          })),
          rankResults: vi.fn().mockResolvedValue(mockRankedResults),
          applyQualityMetrics: vi.fn().mockResolvedValue(mockSearchResults)
        },
        duplicateDetectionEngine: {
          detectDuplicates: vi.fn().mockReturnValue([]),
          removeDuplicates: vi.fn().mockResolvedValue(mockSearchResults),
          mergeDuplicates: vi.fn().mockImplementation((group) => group.primary)
        },
        feedbackLearningSystem: {
          getUserPreferencePatterns: vi.fn().mockResolvedValue({
            userId: 'test-user',
            preferredAuthors: [],
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
          }),
          applyFeedbackBasedRanking: vi.fn().mockResolvedValue(mockRankedResults),
          generateAdaptiveFilters: vi.fn().mockResolvedValue([]),
          getLearningMetrics: vi.fn().mockResolvedValue({
            totalFeedbackCount: 0,
            positiveRatings: 0,
            negativeRatings: 0,
            averageRating: 0,
            improvementTrend: 0,
            confidenceLevel: 0
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)
        
      vi.mocked(require('../worker/lib/result-scoring-engine')).ResultScoringEngine
        .mockImplementation(() => mockServices.resultScoringEngine)
        
      vi.mocked(require('../worker/lib/duplicate-detection-engine')).DuplicateDetectionEngine
        .mockImplementation(() => mockServices.duplicateDetectionEngine)
        
      vi.mocked(require('../worker/lib/feedback-learning-system')).FeedbackLearningSystem
        .mockImplementation(() => mockServices.feedbackLearningSystem)

      // Execute workflow with direct query
      const result = await integrationTests.executeCompleteWorkflow({
        query: '"machine learning" AND "healthcare"',
        conversationId: 'test-conversation-123',
        filters: {
          dateRange: { start: 2020, end: 2023 },
          sortBy: 'relevance' as const
        }
      })

      // Verify direct query workflow
      expect(result).toMatchObject({
        success: true,
        results: expect.arrayContaining([
          expect.objectContaining({
            title: 'Direct Query Paper',
            authors: ['Test, Author'],
            journal: 'Test Journal',
            year: 2023,
            citations: 25,
            doi: '10.1234/test.2023.001',
            url: 'https://example.com/test-paper',
            abstract: expect.stringContaining('Test paper for direct query'),
            keywords: ['test', 'query'],
            confidence: 0.8,
            relevance_score: 0.75,
            citation_count: 25,
            relevanceScore: 0.75,
            qualityScore: 0.7,
            confidenceScore: 0.8,
            overallScore: 0.75,
            rank: 1
          })
        ]),
        query: '"machine learning" AND "healthcare"',
        originalQuery: '"machine learning" AND "healthcare"',
        total_results: 1,
        loaded_results: 1,
        has_more: false,
        sessionId: expect.any(String),
        processingTime: expect.any(Number),
        learningApplied: true
      })

      // Verify service calls
      expect(mockServices.googleScholarClient.search).toHaveBeenCalled()
      expect(mockServices.resultScoringEngine.rankResults).toHaveBeenCalled()
      expect(mockServices.duplicateDetectionEngine.removeDuplicates).toHaveBeenCalled()
      expect(mockServices.feedbackLearningSystem.applyFeedbackBasedRanking).toHaveBeenCalled()
    })

    it('should handle workflow errors gracefully and provide fallback results', async () => {
      // Mock service failures
      const mockServices = {
        contentExtractionEngine: {
          extractContent: vi.fn().mockRejectedValue(new Error('Content extraction failed')),
          batchExtract: vi.fn().mockRejectedValue(new Error('Batch extraction failed')),
          combineExtractedContents: vi.fn().mockRejectedValue(new Error('Content combination failed'))
        },
        queryGenerationEngine: {
          generateQueries: vi.fn().mockRejectedValue(new Error('Query generation failed')),
          optimizeQuery: vi.fn().mockRejectedValue(new Error('Query optimization failed')),
          combineQueries: vi.fn().mockRejectedValue(new Error('Query combination failed')),
          validateQuery: vi.fn().mockRejectedValue(new Error('Query validation failed')),
          refineQuery: vi.fn().mockRejectedValue(new Error('Query refinement failed'))
        },
        googleScholarClient: {
          search: vi.fn().mockRejectedValue(new Error('Search failed')),
          parseResults: vi.fn().mockRejectedValue(new Error('Parsing failed')),
          validateResults: vi.fn().mockRejectedValue(new Error('Validation failed')),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/content-extraction-engine')).ContentExtractionEngine
        .mockImplementation(() => mockServices.contentExtractionEngine)
        
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)
        
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)

      // Execute workflow that should fail
      const result = await integrationTests.executeCompleteWorkflow({
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ]
      })

      // Should handle errors gracefully
      expect(result).toMatchObject({
        success: false,
        error: expect.any(String),
        processingTime: expect.any(Number)
      })

      // Should provide meaningful error message
      expect(result.error).toContain('Failed to execute AI search workflow')
    })

    it('should handle partial workflow successes with degraded functionality', async () => {
      // Mock partial service failures
      const mockExtractedContent: ExtractedContent = {
        source: 'ideas',
        id: '1',
        title: 'Partial Success Content',
        content: 'Content for partial success test',
        keywords: ['partial', 'success'],
        keyPhrases: ['partial success'],
        topics: ['testing'],
        confidence: 0.7
      }

      const mockServices = {
        contentExtractionEngine: {
          extractContent: vi.fn().mockResolvedValue(mockExtractedContent),
          batchExtract: vi.fn().mockResolvedValue([mockExtractedContent]),
          combineExtractedContents: vi.fn().mockResolvedValue(mockExtractedContent)
        },
        queryGenerationEngine: {
          generateQueries: vi.fn().mockResolvedValue([
            {
              id: 'query-1',
              query: 'partial success',
              originalContent: [mockExtractedContent],
              generatedAt: new Date(),
              confidence: 0.7,
              keywords: ['partial', 'success'],
              topics: ['testing'],
              queryType: 'basic' as const,
              optimization: {
                breadthScore: 0.5,
                specificityScore: 0.6,
                academicRelevance: 0.7,
                suggestions: [],
                alternativeQueries: []
              }
            }
          ]),
          optimizeQuery: vi.fn().mockResolvedValue({
            breadthScore: 0.5,
            specificityScore: 0.6,
            academicRelevance: 0.7,
            suggestions: [],
            alternativeQueries: []
          }),
          combineQueries: vi.fn().mockResolvedValue({
            id: 'query-1',
            query: 'partial success',
            originalContent: [mockExtractedContent],
            generatedAt: new Date(),
            confidence: 0.7,
            keywords: ['partial', 'success'],
            topics: ['testing'],
            queryType: 'basic' as const,
            optimization: {
              breadthScore: 0.5,
              specificityScore: 0.6,
              academicRelevance: 0.7,
              suggestions: [],
              alternativeQueries: []
            }
          }),
          validateQuery: vi.fn().mockResolvedValue({
            isValid: true,
            confidence: 0.7,
            issues: [],
            suggestions: []
          }),
          refineQuery: vi.fn().mockResolvedValue({
            breadthAnalysis: {
              breadthScore: 0.5,
              classification: 'optimal' as const,
              reasoning: 'Acceptable',
              termCount: 2,
              specificityLevel: 'moderate' as const,
              suggestions: []
            },
            alternativeTerms: {
              synonyms: [],
              relatedTerms: [],
              broaderTerms: [],
              narrowerTerms: [],
              academicVariants: []
            },
            validationResults: {
              isValid: true,
              issues: [],
              suggestions: [],
              confidence: 0.7
            },
            optimizationRecommendations: [],
            refinedQueries: []
          })
        },
        googleScholarClient: {
          search: vi.fn().mockRejectedValue(new Error('Search temporarily unavailable')),
          parseResults: vi.fn().mockRejectedValue(new Error('Parsing failed')),
          validateResults: vi.fn().mockRejectedValue(new Error('Validation failed')),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/content-extraction-engine')).ContentExtractionEngine
        .mockImplementation(() => mockServices.contentExtractionEngine)
        
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)
        
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)

      // Execute workflow with partial success
      const result = await integrationTests.executeCompleteWorkflow({
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ]
      })

      // Should handle partial success gracefully
      expect(result).toMatchObject({
        success: false,
        error: expect.any(String),
        processingTime: expect.any(Number)
      })

      // Should still have processed content extraction and query generation
      expect(mockServices.contentExtractionEngine.batchExtract).toHaveBeenCalled()
      expect(mockServices.queryGenerationEngine.generateQueries).toHaveBeenCalled()
    })
  })

  describe('Content Extraction Integration', () => {
    it('should integrate content extraction with query generation', async () => {
      // Mock extracted content
      const mockExtractedContent: ExtractedContent[] = [
        {
          source: 'ideas',
          id: '1',
          title: 'Integrated Content',
          content: 'Content for integration testing',
          keywords: ['integration', 'testing'],
          keyPhrases: ['integration testing'],
          topics: ['software testing'],
          confidence: 0.8
        }
      ]

      // Mock generated queries
      const mockQueries = [
        {
          id: 'query-1',
          query: '"integration" AND "testing"',
          originalContent: mockExtractedContent,
          generatedAt: new Date(),
          confidence: 0.8,
          keywords: ['integration', 'testing'],
          topics: ['software testing'],
          queryType: 'basic' as const,
          optimization: {
            breadthScore: 0.6,
            specificityScore: 0.7,
            academicRelevance: 0.8,
            suggestions: [],
            alternativeQueries: []
          }
        }
      ]

      // Mock services
      const mockServices = {
        contentExtractionEngine: {
          extractContent: vi.fn().mockResolvedValue(mockExtractedContent[0]),
          batchExtract: vi.fn().mockResolvedValue(mockExtractedContent),
          combineExtractedContents: vi.fn().mockResolvedValue(mockExtractedContent[0])
        },
        queryGenerationEngine: {
          generateQueries: vi.fn().mockResolvedValue(mockQueries),
          optimizeQuery: vi.fn().mockResolvedValue({
            breadthScore: 0.6,
            specificityScore: 0.7,
            academicRelevance: 0.8,
            suggestions: [],
            alternativeQueries: []
          }),
          combineQueries: vi.fn().mockResolvedValue(mockQueries[0]),
          validateQuery: vi.fn().mockResolvedValue({
            isValid: true,
            confidence: 0.8,
            issues: [],
            suggestions: []
          }),
          refineQuery: vi.fn().mockResolvedValue({
            breadthAnalysis: {
              breadthScore: 0.6,
              classification: 'optimal' as const,
              reasoning: 'Good',
              termCount: 2,
              specificityLevel: 'moderate' as const,
              suggestions: []
            },
            alternativeTerms: {
              synonyms: [],
              relatedTerms: [],
              broaderTerms: [],
              narrowerTerms: [],
              academicVariants: []
            },
            validationResults: {
              isValid: true,
              issues: [],
              suggestions: [],
              confidence: 0.8
            },
            optimizationRecommendations: [],
            refinedQueries: []
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/content-extraction-engine')).ContentExtractionEngine
        .mockImplementation(() => mockServices.contentExtractionEngine)
        
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)

      // Execute content-to-query integration
      const result = await integrationTests.integrateContentExtractionWithQueryGeneration({
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ]
      })

      // Verify integration
      expect(result).toMatchObject({
        success: true,
        extractedContent: expect.arrayContaining([
          expect.objectContaining({
            source: 'ideas',
            id: '1',
            title: 'Integrated Content',
            content: 'Content for integration testing',
            keywords: ['integration', 'testing'],
            keyPhrases: ['integration testing'],
            topics: ['software testing'],
            confidence: 0.8
          })
        ]),
        generatedQueries: expect.arrayContaining([
          expect.objectContaining({
            id: 'query-1',
            query: '"integration" AND "testing"',
            confidence: 0.8,
            keywords: ['integration', 'testing'],
            topics: ['software testing']
          })
        ]),
        processingTime: expect.any(Number)
      })

      // Verify service calls
      expect(mockServices.contentExtractionEngine.batchExtract).toHaveBeenCalled()
      expect(mockServices.queryGenerationEngine.generateQueries).toHaveBeenCalled()
    })

    it('should handle content extraction failures gracefully', async () => {
      // Mock service failures
      const mockServices = {
        contentExtractionEngine: {
          extractContent: vi.fn().mockRejectedValue(new Error('Content extraction failed')),
          batchExtract: vi.fn().mockRejectedValue(new Error('Batch extraction failed')),
          combineExtractedContents: vi.fn().mockRejectedValue(new Error('Content combination failed'))
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/content-extraction-engine')).ContentExtractionEngine
        .mockImplementation(() => mockServices.contentExtractionEngine)

      // Execute integration with failures
      const result = await integrationTests.integrateContentExtractionWithQueryGeneration({
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ]
      })

      // Should handle failures gracefully
      expect(result).toMatchObject({
        success: false,
        error: expect.any(String),
        processingTime: expect.any(Number)
      })

      // Should still attempt content extraction
      expect(mockServices.contentExtractionEngine.batchExtract).toHaveBeenCalled()
    })
  })

  describe('Query Generation Integration', () => {
    it('should integrate query generation with search execution', async () => {
      // Mock generated queries
      const mockQueries = [
        {
          id: 'query-1',
          query: '"machine learning" AND "healthcare"',
          originalContent: [],
          generatedAt: new Date(),
          confidence: 0.9,
          keywords: ['machine learning', 'healthcare'],
          topics: ['AI', 'medicine'],
          queryType: 'basic' as const,
          optimization: {
            breadthScore: 0.7,
            specificityScore: 0.8,
            academicRelevance: 0.9,
            suggestions: [],
            alternativeQueries: []
          }
        }
      ]

      // Mock search results
      const mockSearchResults: ScholarSearchResult[] = [
        {
          title: 'ML in Healthcare',
          authors: ['Test, Author'],
          journal: 'Test Journal',
          year: 2023,
          citations: 50,
          doi: '10.1234/test.2023.001',
          url: 'https://example.com/test',
          abstract: 'Test abstract',
          keywords: ['ML', 'healthcare'],
          confidence: 0.85,
          relevance_score: 0.8,
          citation_count: 50
        }
      ]

      // Mock services
      const mockServices = {
        queryGenerationEngine: {
          generateQueries: vi.fn().mockResolvedValue(mockQueries),
          optimizeQuery: vi.fn().mockResolvedValue({
            breadthScore: 0.7,
            specificityScore: 0.8,
            academicRelevance: 0.9,
            suggestions: [],
            alternativeQueries: []
          }),
          combineQueries: vi.fn().mockResolvedValue(mockQueries[0]),
          validateQuery: vi.fn().mockResolvedValue({
            isValid: true,
            confidence: 0.9,
            issues: [],
            suggestions: []
          }),
          refineQuery: vi.fn().mockResolvedValue({
            breadthAnalysis: {
              breadthScore: 0.7,
              classification: 'optimal' as const,
              reasoning: 'Good',
              termCount: 2,
              specificityLevel: 'moderate' as const,
              suggestions: []
            },
            alternativeTerms: {
              synonyms: [],
              relatedTerms: [],
              broaderTerms: [],
              narrowerTerms: [],
              academicVariants: []
            },
            validationResults: {
              isValid: true,
              issues: [],
              suggestions: [],
              confidence: 0.9
            },
            optimizationRecommendations: [],
            refinedQueries: []
          })
        },
        googleScholarClient: {
          search: vi.fn().mockResolvedValue(mockSearchResults),
          parseResults: vi.fn().mockResolvedValue(mockSearchResults),
          validateResults: vi.fn().mockResolvedValue(mockSearchResults),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)
        
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)

      // Execute query-to-search integration
      const result = await integrationTests.integrateQueryGenerationWithSearch({
        query: '"machine learning" AND "healthcare"',
        conversationId: 'test-conversation-123'
      })

      // Verify integration
      expect(result).toMatchObject({
        success: true,
        query: '"machine learning" AND "healthcare"',
        results: expect.arrayContaining([
          expect.objectContaining({
            title: 'ML in Healthcare',
            authors: ['Test, Author'],
            journal: 'Test Journal',
            year: 2023,
            citations: 50,
            doi: '10.1234/test.2023.001',
            url: 'https://example.com/test',
            abstract: 'Test abstract',
            keywords: ['ML', 'healthcare'],
            confidence: 0.85,
            relevance_score: 0.8,
            citation_count: 50
          })
        ]),
        total_results: 1,
        loaded_results: 1,
        has_more: false,
        processingTime: expect.any(Number)
      })

      // Verify service calls
      expect(mockServices.queryGenerationEngine.generateQueries).not.toHaveBeenCalled() // Direct query
      expect(mockServices.googleScholarClient.search).toHaveBeenCalled()
    })

    it('should handle query generation failures gracefully', async () => {
      // Mock service failures
      const mockServices = {
        queryGenerationEngine: {
          generateQueries: vi.fn().mockRejectedValue(new Error('Query generation failed')),
          optimizeQuery: vi.fn().mockRejectedValue(new Error('Query optimization failed')),
          combineQueries: vi.fn().mockRejectedValue(new Error('Query combination failed')),
          validateQuery: vi.fn().mockRejectedValue(new Error('Query validation failed')),
          refineQuery: vi.fn().mockRejectedValue(new Error('Query refinement failed'))
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)

      // Execute integration with failures
      const result = await integrationTests.integrateQueryGenerationWithSearch({
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ]
      })

      // Should handle failures gracefully
      expect(result).toMatchObject({
        success: false,
        error: expect.any(String),
        processingTime: expect.any(Number)
      })

      // Should still attempt query generation
      expect(mockServices.queryGenerationEngine.generateQueries).toHaveBeenCalled()
    })
  })

  describe('Search Execution Integration', () => {
    it('should integrate search execution with result processing', async () => {
      // Mock search results
      const mockSearchResults: ScholarSearchResult[] = [
        {
          title: 'Search Execution Test',
          authors: ['Execution, Test'],
          journal: 'Execution Journal',
          year: 2023,
          citations: 75,
          doi: '10.1234/exec.2023.001',
          url: 'https://example.com/exec',
          abstract: 'Test abstract for execution',
          keywords: ['execution', 'test'],
          confidence: 0.9,
          relevance_score: 0.85,
          citation_count: 75
        }
      ]

      // Mock ranked results
      const mockRankedResults = [
        {
          ...mockSearchResults[0],
          relevanceScore: 0.85,
          qualityScore: 0.8,
          confidenceScore: 0.9,
          overallScore: 0.85,
          rank: 1,
          scoringBreakdown: {
            relevance: {
              textSimilarity: 0.85,
              keywordMatch: 0.8,
              topicOverlap: 0.75,
              semanticSimilarity: 0.7
            },
            quality: {
              citationScore: 0.8,
              recencyScore: 0.75,
              authorAuthority: 0.7,
              journalQuality: 0.85,
              completenessScore: 0.85
            },
            confidence: {
              metadataCompleteness: 0.9,
              sourceReliability: 0.85,
              extractionQuality: 0.8
            }
          }
        }
      ]

      // Mock services
      const mockServices = {
        googleScholarClient: {
          search: vi.fn().mockResolvedValue(mockSearchResults),
          parseResults: vi.fn().mockResolvedValue(mockSearchResults),
          validateResults: vi.fn().mockResolvedValue(mockSearchResults),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        },
        resultScoringEngine: {
          scoreResult: vi.fn().mockImplementation((result) => ({
            relevanceScore: result.relevance_score || 0.5,
            qualityScore: 0.8,
            confidenceScore: result.confidence || 0.5,
            overallScore: 0.75,
            breakdown: {
              relevance: {
                textSimilarity: 0.5,
                keywordMatch: 0.5,
                topicOverlap: 0.5,
                semanticSimilarity: 0.5
              },
              quality: {
                citationScore: 0.5,
                recencyScore: 0.5,
                authorAuthority: 0.5,
                journalQuality: 0.5,
                completenessScore: 0.5
              },
              confidence: {
                metadataCompleteness: 0.5,
                sourceReliability: 0.5,
                extractionQuality: 0.5
              }
            }
          })),
          rankResults: vi.fn().mockResolvedValue(mockRankedResults),
          applyQualityMetrics: vi.fn().mockResolvedValue(mockSearchResults)
        },
        duplicateDetectionEngine: {
          detectDuplicates: vi.fn().mockReturnValue([]),
          removeDuplicates: vi.fn().mockResolvedValue(mockSearchResults),
          mergeDuplicates: vi.fn().mockImplementation((group) => group.primary)
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)
        
      vi.mocked(require('../worker/lib/result-scoring-engine')).ResultScoringEngine
        .mockImplementation(() => mockServices.resultScoringEngine)
        
      vi.mocked(require('../worker/lib/duplicate-detection-engine')).DuplicateDetectionEngine
        .mockImplementation(() => mockServices.duplicateDetectionEngine)

      // Execute search-to-processing integration
      const result = await integrationTests.integrateSearchExecutionWithResultProcessing({
        query: '"search execution" AND "integration"',
        conversationId: 'test-conversation-123'
      })

      // Verify integration
      expect(result).toMatchObject({
        success: true,
        query: '"search execution" AND "integration"',
        results: expect.arrayContaining([
          expect.objectContaining({
            title: 'Search Execution Test',
            authors: ['Execution, Test'],
            journal: 'Execution Journal',
            year: 2023,
            citations: 75,
            doi: '10.1234/exec.2023.001',
            url: 'https://example.com/exec',
            abstract: 'Test abstract for execution',
            keywords: ['execution', 'test'],
            confidence: 0.9,
            relevance_score: 0.85,
            citation_count: 75,
            relevanceScore: 0.85,
            qualityScore: 0.8,
            confidenceScore: 0.9,
            overallScore: 0.85,
            rank: 1
          })
        ]),
        total_results: 1,
        loaded_results: 1,
        has_more: false,
        processingTime: expect.any(Number)
      })

      // Verify service calls
      expect(mockServices.googleScholarClient.search).toHaveBeenCalled()
      expect(mockServices.resultScoringEngine.rankResults).toHaveBeenCalled()
      expect(mockServices.duplicateDetectionEngine.removeDuplicates).toHaveBeenCalled()
    })

    it('should handle search execution failures gracefully', async () => {
      // Mock service failures
      const mockServices = {
        googleScholarClient: {
          search: vi.fn().mockRejectedValue(new Error('Search execution failed')),
          parseResults: vi.fn().mockRejectedValue(new Error('Parsing failed')),
          validateResults: vi.fn().mockRejectedValue(new Error('Validation failed')),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)

      // Execute integration with failures
      const result = await integrationTests.integrateSearchExecutionWithResultProcessing({
        query: '"search failure" AND "test"',
        conversationId: 'test-conversation-123'
      })

      // Should handle failures gracefully
      expect(result).toMatchObject({
        success: false,
        error: expect.any(String),
        processingTime: expect.any(Number)
      })

      // Should still attempt search execution
      expect(mockServices.googleScholarClient.search).toHaveBeenCalled()
    })
  })

  describe('Result Processing Integration', () => {
    it('should integrate result processing with user feedback learning', async () => {
      // Mock search results
      const mockSearchResults: ScholarSearchResult[] = [
        {
          title: 'Feedback Learning Test',
          authors: ['Learning, Feedback'],
          journal: 'Learning Journal',
          year: 2023,
          citations: 100,
          doi: '10.1234/learn.2023.001',
          url: 'https://example.com/learn',
          abstract: 'Test abstract for feedback learning',
          keywords: ['feedback', 'learning'],
          confidence: 0.95,
          relevance_score: 0.9,
          citation_count: 100
        }
      ]

      // Mock ranked results
      const mockRankedResults = [
        {
          ...mockSearchResults[0],
          relevanceScore: 0.9,
          qualityScore: 0.85,
          confidenceScore: 0.95,
          overallScore: 0.9,
          rank: 1,
          scoringBreakdown: {
            relevance: {
              textSimilarity: 0.9,
              keywordMatch: 0.85,
              topicOverlap: 0.8,
              semanticSimilarity: 0.75
            },
            quality: {
              citationScore: 0.85,
              recencyScore: 0.8,
              authorAuthority: 0.75,
              journalQuality: 0.9,
              completenessScore: 0.9
            },
            confidence: {
              metadataCompleteness: 0.95,
              sourceReliability: 0.9,
              extractionQuality: 0.85
            }
          }
        }
      ]

      // Mock services
      const mockServices = {
        resultScoringEngine: {
          scoreResult: vi.fn().mockImplementation((result) => ({
            relevanceScore: result.relevance_score || 0.5,
            qualityScore: 0.85,
            confidenceScore: result.confidence || 0.5,
            overallScore: 0.8,
            breakdown: {
              relevance: {
                textSimilarity: 0.5,
                keywordMatch: 0.5,
                topicOverlap: 0.5,
                semanticSimilarity: 0.5
              },
              quality: {
                citationScore: 0.5,
                recencyScore: 0.5,
                authorAuthority: 0.5,
                journalQuality: 0.5,
                completenessScore: 0.5
              },
              confidence: {
                metadataCompleteness: 0.5,
                sourceReliability: 0.5,
                extractionQuality: 0.5
              }
            }
          })),
          rankResults: vi.fn().mockResolvedValue(mockRankedResults),
          applyQualityMetrics: vi.fn().mockResolvedValue(mockSearchResults)
        },
        duplicateDetectionEngine: {
          detectDuplicates: vi.fn().mockReturnValue([]),
          removeDuplicates: vi.fn().mockResolvedValue(mockSearchResults),
          mergeDuplicates: vi.fn().mockImplementation((group) => group.primary)
        },
        feedbackLearningSystem: {
          getUserPreferencePatterns: vi.fn().mockResolvedValue({
            userId: 'test-user',
            preferredAuthors: [],
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
          }),
          applyFeedbackBasedRanking: vi.fn().mockResolvedValue(mockRankedResults),
          generateAdaptiveFilters: vi.fn().mockResolvedValue([]),
          getLearningMetrics: vi.fn().mockResolvedValue({
            totalFeedbackCount: 0,
            positiveRatings: 0,
            negativeRatings: 0,
            averageRating: 0,
            improvementTrend: 0,
            confidenceLevel: 0
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/result-scoring-engine')).ResultScoringEngine
        .mockImplementation(() => mockServices.resultScoringEngine)
        
      vi.mocked(require('../worker/lib/duplicate-detection-engine')).DuplicateDetectionEngine
        .mockImplementation(() => mockServices.duplicateDetectionEngine)
        
      vi.mocked(require('../worker/lib/feedback-learning-system')).FeedbackLearningSystem
        .mockImplementation(() => mockServices.feedbackLearningSystem)

      // Execute processing-to-learning integration
      const result = await integrationTests.integrateResultProcessingWithFeedbackLearning({
        query: '"feedback learning" AND "integration"',
        conversationId: 'test-conversation-123',
        results: mockSearchResults
      })

      // Verify integration
      expect(result).toMatchObject({
        success: true,
        query: '"feedback learning" AND "integration"',
        results: expect.arrayContaining([
          expect.objectContaining({
            title: 'Feedback Learning Test',
            authors: ['Learning, Feedback'],
            journal: 'Learning Journal',
            year: 2023,
            citations: 100,
            doi: '10.1234/learn.2023.001',
            url: 'https://example.com/learn',
            abstract: 'Test abstract for feedback learning',
            keywords: ['feedback', 'learning'],
            confidence: 0.95,
            relevance_score: 0.9,
            citation_count: 100,
            relevanceScore: 0.9,
            qualityScore: 0.85,
            confidenceScore: 0.95,
            overallScore: 0.9,
            rank: 1
          })
        ]),
        total_results: 1,
        loaded_results: 1,
        has_more: false,
        processingTime: expect.any(Number),
        learningApplied: true
      })

      // Verify service calls
      expect(mockServices.resultScoringEngine.rankResults).toHaveBeenCalled()
      expect(mockServices.duplicateDetectionEngine.removeDuplicates).toHaveBeenCalled()
      expect(mockServices.feedbackLearningSystem.applyFeedbackBasedRanking).toHaveBeenCalled()
    })

    it('should handle result processing failures gracefully', async () => {
      // Mock service failures
      const mockServices = {
        resultScoringEngine: {
          scoreResult: vi.fn().mockRejectedValue(new Error('Scoring failed')),
          rankResults: vi.fn().mockRejectedValue(new Error('Ranking failed')),
          applyQualityMetrics: vi.fn().mockRejectedValue(new Error('Quality metrics failed'))
        },
        duplicateDetectionEngine: {
          detectDuplicates: vi.fn().mockReturnValue([]),
          removeDuplicates: vi.fn().mockRejectedValue(new Error('Duplicate removal failed')),
          mergeDuplicates: vi.fn().mockImplementation((group) => group.primary)
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/result-scoring-engine')).ResultScoringEngine
        .mockImplementation(() => mockServices.resultScoringEngine)
        
      vi.mocked(require('../worker/lib/duplicate-detection-engine')).DuplicateDetectionEngine
        .mockImplementation(() => mockServices.duplicateDetectionEngine)

      // Execute integration with failures
      const result = await integrationTests.integrateResultProcessingWithFeedbackLearning({
        query: '"processing failure" AND "test"',
        conversationId: 'test-conversation-123',
        results: [
          {
            title: 'Processing Failure Test',
            authors: ['Failure, Processing'],
            confidence: 0.5,
            relevance_score: 0.5
          }
        ]
      })

      // Should handle failures gracefully
      expect(result).toMatchObject({
        success: false,
        error: expect.any(String),
        processingTime: expect.any(Number)
      })

      // Should still attempt result processing
      expect(mockServices.resultScoringEngine.rankResults).toHaveBeenCalled()
      expect(mockServices.duplicateDetectionEngine.removeDuplicates).toHaveBeenCalled()
    })
  })

  describe('Performance Integration', () => {
    it('should maintain performance across integrated components', async () => {
      // Mock large dataset for performance testing
      const mockExtractedContent: ExtractedContent[] = Array.from({ length: 10 }, (_, i) => ({
        source: 'ideas',
        id: `${i}`,
        title: `Content ${i}`,
        content: `Content for performance test ${i}`,
        keywords: [`keyword${i}`, `test${i}`],
        keyPhrases: [`phrase ${i}`],
        topics: [`topic${i % 3}`],
        confidence: 0.5 + (i * 0.05)
      }))

      const mockQueries = [
        {
          id: 'performance-query',
          query: 'performance test',
          originalContent: mockExtractedContent,
          generatedAt: new Date(),
          confidence: 0.8,
          keywords: ['performance', 'test'],
          topics: ['testing'],
          queryType: 'combined' as const,
          optimization: {
            breadthScore: 0.6,
            specificityScore: 0.7,
            academicRelevance: 0.8,
            suggestions: [],
            alternativeQueries: []
          }
        }
      ]

      const mockSearchResults: ScholarSearchResult[] = Array.from({ length: 50 }, (_, i) => ({
        title: `Performance Paper ${i}`,
        authors: [`Author ${i}`],
        journal: i % 3 === 0 ? 'Nature' : i % 3 === 1 ? 'Science' : 'Generic Journal',
        year: 2020 + (i % 4),
        citations: Math.floor(Math.random() * 500),
        doi: `10.1234/perf.${2020 + (i % 4)}.${String(i).padStart(3, '0')}`,
        url: `https://example.com/paper${i}`,
        abstract: `Performance test abstract ${i}`,
        keywords: [`perf${i}`, `test${i}`],
        confidence: 0.5 + (Math.random() * 0.5),
        relevance_score: 0.4 + (Math.random() * 0.6),
        citation_count: Math.floor(Math.random() * 500)
      }))

      const mockRankedResults = mockSearchResults.map((result, i) => ({
        ...result,
        relevanceScore: result.relevance_score,
        qualityScore: 0.7,
        confidenceScore: result.confidence,
        overallScore: 0.7,
        rank: i + 1,
        scoringBreakdown: {
          relevance: {
            textSimilarity: 0.5,
            keywordMatch: 0.5,
            topicOverlap: 0.5,
            semanticSimilarity: 0.5
          },
          quality: {
            citationScore: 0.5,
            recencyScore: 0.5,
            authorAuthority: 0.5,
            journalQuality: 0.5,
            completenessScore: 0.5
          },
          confidence: {
            metadataCompleteness: 0.5,
            sourceReliability: 0.5,
            extractionQuality: 0.5
          }
        }
      }))

      // Mock services
      const mockServices = {
        contentExtractionEngine: {
          extractContent: vi.fn().mockResolvedValue(mockExtractedContent[0]),
          batchExtract: vi.fn().mockResolvedValue(mockExtractedContent),
          combineExtractedContents: vi.fn().mockResolvedValue(mockExtractedContent[0])
        },
        queryGenerationEngine: {
          generateQueries: vi.fn().mockResolvedValue(mockQueries),
          optimizeQuery: vi.fn().mockResolvedValue({
            breadthScore: 0.6,
            specificityScore: 0.7,
            academicRelevance: 0.8,
            suggestions: [],
            alternativeQueries: []
          }),
          combineQueries: vi.fn().mockResolvedValue(mockQueries[0]),
          validateQuery: vi.fn().mockResolvedValue({
            isValid: true,
            confidence: 0.8,
            issues: [],
            suggestions: []
          }),
          refineQuery: vi.fn().mockResolvedValue({
            breadthAnalysis: {
              breadthScore: 0.6,
              classification: 'optimal' as const,
              reasoning: 'Good',
              termCount: 2,
              specificityLevel: 'moderate' as const,
              suggestions: []
            },
            alternativeTerms: {
              synonyms: [],
              relatedTerms: [],
              broaderTerms: [],
              narrowerTerms: [],
              academicVariants: []
            },
            validationResults: {
              isValid: true,
              issues: [],
              suggestions: [],
              confidence: 0.8
            },
            optimizationRecommendations: [],
            refinedQueries: []
          })
        },
        googleScholarClient: {
          search: vi.fn().mockResolvedValue(mockSearchResults),
          parseResults: vi.fn().mockResolvedValue(mockSearchResults),
          validateResults: vi.fn().mockResolvedValue(mockSearchResults),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        },
        resultScoringEngine: {
          scoreResult: vi.fn().mockImplementation((result) => ({
            relevanceScore: result.relevance_score || 0.5,
            qualityScore: 0.7,
            confidenceScore: result.confidence || 0.5,
            overallScore: 0.65,
            breakdown: {
              relevance: {
                textSimilarity: 0.5,
                keywordMatch: 0.5,
                topicOverlap: 0.5,
                semanticSimilarity: 0.5
              },
              quality: {
                citationScore: 0.5,
                recencyScore: 0.5,
                authorAuthority: 0.5,
                journalQuality: 0.5,
                completenessScore: 0.5
              },
              confidence: {
                metadataCompleteness: 0.5,
                sourceReliability: 0.5,
                extractionQuality: 0.5
              }
            }
          })),
          rankResults: vi.fn().mockResolvedValue(mockRankedResults),
          applyQualityMetrics: vi.fn().mockResolvedValue(mockSearchResults)
        },
        duplicateDetectionEngine: {
          detectDuplicates: vi.fn().mockReturnValue([]),
          removeDuplicates: vi.fn().mockResolvedValue(mockSearchResults),
          mergeDuplicates: vi.fn().mockImplementation((group) => group.primary)
        },
        feedbackLearningSystem: {
          getUserPreferencePatterns: vi.fn().mockResolvedValue({
            userId: 'test-user',
            preferredAuthors: [],
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
          }),
          applyFeedbackBasedRanking: vi.fn().mockResolvedValue(mockRankedResults),
          generateAdaptiveFilters: vi.fn().mockResolvedValue([]),
          getLearningMetrics: vi.fn().mockResolvedValue({
            totalFeedbackCount: 0,
            positiveRatings: 0,
            negativeRatings: 0,
            averageRating: 0,
            improvementTrend: 0,
            confidenceLevel: 0
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/content-extraction-engine')).ContentExtractionEngine
        .mockImplementation(() => mockServices.contentExtractionEngine)
        
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)
        
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)
        
      vi.mocked(require('../worker/lib/result-scoring-engine')).ResultScoringEngine
        .mockImplementation(() => mockServices.resultScoringEngine)
        
      vi.mocked(require('../worker/lib/duplicate-detection-engine')).DuplicateDetectionEngine
        .mockImplementation(() => mockServices.duplicateDetectionEngine)
        
      vi.mocked(require('../worker/lib/feedback-learning-system')).FeedbackLearningSystem
        .mockImplementation(() => mockServices.feedbackLearningSystem)

      // Execute performance test
      const startTime = Date.now()
      const result = await integrationTests.executeCompleteWorkflow({
        conversationId: 'test-conversation-123',
        contentSources: mockExtractedContent.map(content => ({
          source: content.source,
          id: content.id as string
        })),
        queryOptions: {
          maxKeywords: 5,
          optimizeForAcademic: true
        },
        filters: {
          dateRange: { start: 2020, end: 2023 },
          sortBy: 'relevance' as const
        }
      })
      const endTime = Date.now()

      // Verify performance
      expect(result).toMatchObject({
        success: true,
        results: expect.any(Array),
        total_results: 50,
        loaded_results: 50,
        has_more: false,
        sessionId: expect.any(String),
        processingTime: expect.any(Number),
        learningApplied: true
      })

      // Should complete within reasonable time (5 seconds for 50 results)
      expect(endTime - startTime).toBeLessThan(5000)

      // Should handle large result set
      expect(result.results).toHaveLength(50)
      expect(result.results[0]).toMatchObject({
        title: expect.stringContaining('Performance Paper'),
        authors: expect.any(Array),
        journal: expect.any(String),
        year: expect.any(Number),
        citations: expect.any(Number),
        doi: expect.any(String),
        url: expect.any(String),
        abstract: expect.any(String),
        keywords: expect.any(Array),
        confidence: expect.any(Number),
        relevance_score: expect.any(Number),
        citation_count: expect.any(Number),
        relevanceScore: expect.any(Number),
        qualityScore: expect.any(Number),
        confidenceScore: expect.any(Number),
        overallScore: expect.any(Number),
        rank: expect.any(Number)
      })

      // Verify all services were called
      expect(mockServices.contentExtractionEngine.batchExtract).toHaveBeenCalled()
      expect(mockServices.queryGenerationEngine.generateQueries).toHaveBeenCalled()
      expect(mockServices.googleScholarClient.search).toHaveBeenCalled()
      expect(mockServices.resultScoringEngine.rankResults).toHaveBeenCalled()
      expect(mockServices.duplicateDetectionEngine.removeDuplicates).toHaveBeenCalled()
      expect(mockServices.feedbackLearningSystem.applyFeedbackBasedRanking).toHaveBeenCalled()
    })

    it('should handle resource exhaustion gracefully', async () => {
      // Mock services that consume excessive resources
      const mockServices = {
        contentExtractionEngine: {
          extractContent: vi.fn().mockImplementation(() => {
            // Simulate memory-intensive operation
            const largeArray = new Array(1000000).fill('memory-intensive')
            return Promise.resolve({
              source: 'ideas',
              id: '1',
              title: 'Memory Test',
              content: 'Memory test content',
              keywords: ['memory', 'test'],
              keyPhrases: ['memory test'],
              topics: ['testing'],
              confidence: 0.5
            })
          }),
          batchExtract: vi.fn().mockImplementation(() => {
            // Simulate memory-intensive operation
            const largeArray = new Array(1000000).fill('memory-intensive')
            return Promise.resolve([{
              source: 'ideas',
              id: '1',
              title: 'Memory Test',
              content: 'Memory test content',
              keywords: ['memory', 'test'],
              keyPhrases: ['memory test'],
              topics: ['testing'],
              confidence: 0.5
            }])
          }),
          combineExtractedContents: vi.fn().mockImplementation(() => {
            // Simulate memory-intensive operation
            const largeArray = new Array(1000000).fill('memory-intensive')
            return Promise.resolve({
              source: 'ideas',
              id: '1',
              title: 'Memory Test',
              content: 'Memory test content',
              keywords: ['memory', 'test'],
              keyPhrases: ['memory test'],
              topics: ['testing'],
              confidence: 0.5
            })
          })
        },
        queryGenerationEngine: {
          generateQueries: vi.fn().mockImplementation(() => {
            // Simulate CPU-intensive operation
            let result = 0
            for (let i = 0; i < 1000000; i++) {
              result += Math.sqrt(i)
            }
            return Promise.resolve([{
              id: 'query-1',
              query: 'memory test',
              originalContent: [],
              generatedAt: new Date(),
              confidence: 0.5,
              keywords: ['memory', 'test'],
              topics: ['testing'],
              queryType: 'basic' as const,
              optimization: {
                breadthScore: 0.5,
                specificityScore: 0.5,
                academicRelevance: 0.5,
                suggestions: [],
                alternativeQueries: []
              }
            }])
          }),
          optimizeQuery: vi.fn().mockImplementation(() => {
            // Simulate CPU-intensive operation
            let result = 0
            for (let i = 0; i < 1000000; i++) {
              result += Math.sqrt(i)
            }
            return Promise.resolve({
              breadthScore: 0.5,
              specificityScore: 0.5,
              academicRelevance: 0.5,
              suggestions: [],
              alternativeQueries: []
            })
          }),
          combineQueries: vi.fn().mockImplementation(() => {
            // Simulate CPU-intensive operation
            let result = 0
            for (let i = 0; i < 1000000; i++) {
              result += Math.sqrt(i)
            }
            return Promise.resolve({
              id: 'query-1',
              query: 'memory test',
              originalContent: [],
              generatedAt: new Date(),
              confidence: 0.5,
              keywords: ['memory', 'test'],
              topics: ['testing'],
              queryType: 'basic' as const,
              optimization: {
                breadthScore: 0.5,
                specificityScore: 0.5,
                academicRelevance: 0.5,
                suggestions: [],
                alternativeQueries: []
              }
            })
          }),
          validateQuery: vi.fn().mockImplementation(() => {
            // Simulate CPU-intensive operation
            let result = 0
            for (let i = 0; i < 1000000; i++) {
              result += Math.sqrt(i)
            }
            return Promise.resolve({
              isValid: true,
              confidence: 0.5,
              issues: [],
              suggestions: []
            })
          }),
          refineQuery: vi.fn().mockImplementation(() => {
            // Simulate CPU-intensive operation
            let result = 0
            for (let i = 0; i < 1000000; i++) {
              result += Math.sqrt(i)
            }
            return Promise.resolve({
              breadthAnalysis: {
                breadthScore: 0.5,
                classification: 'optimal' as const,
                reasoning: 'Good',
                termCount: 2,
                specificityLevel: 'moderate' as const,
                suggestions: []
              },
              alternativeTerms: {
                synonyms: [],
                relatedTerms: [],
                broaderTerms: [],
                narrowerTerms: [],
                academicVariants: []
              },
              validationResults: {
                isValid: true,
                issues: [],
                suggestions: [],
                confidence: 0.5
              },
              optimizationRecommendations: [],
              refinedQueries: []
            })
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/content-extraction-engine')).ContentExtractionEngine
        .mockImplementation(() => mockServices.contentExtractionEngine)
        
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)

      // Execute performance test with resource monitoring
      const performanceMonitor = {
        startTime: Date.now(),
        startMemory: process.memoryUsage(),
        startCpu: process.cpuUsage()
      }

      const result = await integrationTests.integrateContentExtractionWithQueryGeneration({
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ]
      })

      const performanceMonitorEnd = {
        endTime: Date.now(),
        endMemory: process.memoryUsage(),
        endCpu: process.cpuUsage()
      }

      // Verify graceful handling of resource usage
      expect(result).toMatchObject({
        success: true,
        processingTime: expect.any(Number)
      })

      // Should complete within reasonable time despite resource usage
      expect(performanceMonitorEnd.endTime - performanceMonitor.startTime).toBeLessThan(10000)

      // Should handle resource-intensive operations
      expect(mockServices.contentExtractionEngine.batchExtract).toHaveBeenCalled()
      expect(mockServices.queryGenerationEngine.generateQueries).toHaveBeenCalled()
    })
  })

  describe('Error Recovery Integration', () => {
    it('should recover from component failures and continue workflow', async () => {
      // Mock partial failures in workflow
      const mockExtractedContent: ExtractedContent = {
        source: 'ideas',
        id: '1',
        title: 'Recovery Test',
        content: 'Content for recovery testing',
        keywords: ['recovery', 'test'],
        keyPhrases: ['recovery test'],
        topics: ['testing'],
        confidence: 0.7
      }

      const mockQueries = [
        {
          id: 'recovery-query',
          query: '"recovery" AND "test"',
          originalContent: [mockExtractedContent],
          generatedAt: new Date(),
          confidence: 0.7,
          keywords: ['recovery', 'test'],
          topics: ['testing'],
          queryType: 'basic' as const,
          optimization: {
            breadthScore: 0.6,
            specificityScore: 0.7,
            academicRelevance: 0.7,
            suggestions: [],
            alternativeQueries: []
          }
        }
      ]

      const mockSearchResults: ScholarSearchResult[] = [
        {
          title: 'Recovery Success',
          authors: ['Recovery, Success'],
          journal: 'Recovery Journal',
          year: 2023,
          citations: 25,
          doi: '10.1234/recover.2023.001',
          url: 'https://example.com/recover',
          abstract: 'Recovery test abstract',
          keywords: ['recovery', 'success'],
          confidence: 0.8,
          relevance_score: 0.75,
          citation_count: 25
        }
      ]

      const mockRankedResults = [
        {
          ...mockSearchResults[0],
          relevanceScore: 0.75,
          qualityScore: 0.7,
          confidenceScore: 0.8,
          overallScore: 0.75,
          rank: 1,
          scoringBreakdown: {
            relevance: {
              textSimilarity: 0.75,
              keywordMatch: 0.7,
              topicOverlap: 0.65,
              semanticSimilarity: 0.6
            },
            quality: {
              citationScore: 0.7,
              recencyScore: 0.65,
              authorAuthority: 0.6,
              journalQuality: 0.75,
              completenessScore: 0.75
            },
            confidence: {
              metadataCompleteness: 0.8,
              sourceReliability: 0.75,
              extractionQuality: 0.7
            }
          }
        }
      ]

      // Mock services with intermittent failures
      let contentExtractionCallCount = 0
      let queryGenerationCallCount = 0
      let searchExecutionCallCount = 0

      const mockServices = {
        contentExtractionEngine: {
          extractContent: vi.fn().mockImplementation(() => {
            contentExtractionCallCount++
            if (contentExtractionCallCount <= 2) {
              throw new Error('Temporary content extraction failure')
            }
            return Promise.resolve(mockExtractedContent)
          }),
          batchExtract: vi.fn().mockImplementation(() => {
            contentExtractionCallCount++
            if (contentExtractionCallCount <= 2) {
              throw new Error('Temporary batch extraction failure')
            }
            return Promise.resolve([mockExtractedContent])
          }),
          combineExtractedContents: vi.fn().mockImplementation(() => {
            contentExtractionCallCount++
            if (contentExtractionCallCount <= 2) {
              throw new Error('Temporary content combination failure')
            }
            return Promise.resolve(mockExtractedContent)
          })
        },
        queryGenerationEngine: {
          generateQueries: vi.fn().mockImplementation(() => {
            queryGenerationCallCount++
            if (queryGenerationCallCount <= 1) {
              throw new Error('Temporary query generation failure')
            }
            return Promise.resolve(mockQueries)
          }),
          optimizeQuery: vi.fn().mockImplementation(() => {
            queryGenerationCallCount++
            if (queryGenerationCallCount <= 1) {
              throw new Error('Temporary query optimization failure')
            }
            return Promise.resolve({
              breadthScore: 0.6,
              specificityScore: 0.7,
              academicRelevance: 0.7,
              suggestions: [],
              alternativeQueries: []
            })
          }),
          combineQueries: vi.fn().mockImplementation(() => {
            queryGenerationCallCount++
            if (queryGenerationCallCount <= 1) {
              throw new Error('Temporary query combination failure')
            }
            return Promise.resolve(mockQueries[0])
          }),
          validateQuery: vi.fn().mockImplementation(() => {
            queryGenerationCallCount++
            if (queryGenerationCallCount <= 1) {
              throw new Error('Temporary query validation failure')
            }
            return Promise.resolve({
              isValid: true,
              confidence: 0.7,
              issues: [],
              suggestions: []
            })
          }),
          refineQuery: vi.fn().mockImplementation(() => {
            queryGenerationCallCount++
            if (queryGenerationCallCount <= 1) {
              throw new Error('Temporary query refinement failure')
            }
            return Promise.resolve({
              breadthAnalysis: {
                breadthScore: 0.6,
                classification: 'optimal' as const,
                reasoning: 'Good',
                termCount: 2,
                specificityLevel: 'moderate' as const,
                suggestions: []
              },
              alternativeTerms: {
                synonyms: [],
                relatedTerms: [],
                broaderTerms: [],
                narrowerTerms: [],
                academicVariants: []
              },
              validationResults: {
                isValid: true,
                issues: [],
                suggestions: [],
                confidence: 0.7
              },
              optimizationRecommendations: [],
              refinedQueries: []
            })
          })
        },
        googleScholarClient: {
          search: vi.fn().mockImplementation(() => {
            searchExecutionCallCount++
            if (searchExecutionCallCount <= 1) {
              throw new Error('Temporary search execution failure')
            }
            return Promise.resolve(mockSearchResults)
          }),
          parseResults: vi.fn().mockImplementation(() => {
            searchExecutionCallCount++
            if (searchExecutionCallCount <= 1) {
              throw new Error('Temporary parsing failure')
            }
            return Promise.resolve(mockSearchResults)
          }),
          validateResults: vi.fn().mockImplementation(() => {
            searchExecutionCallCount++
            if (searchExecutionCallCount <= 1) {
              throw new Error('Temporary validation failure')
            }
            return Promise.resolve(mockSearchResults)
          }),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        },
        resultScoringEngine: {
          scoreResult: vi.fn().mockImplementation((result) => ({
            relevanceScore: result.relevance_score || 0.5,
            qualityScore: 0.7,
            confidenceScore: result.confidence || 0.5,
            overallScore: 0.65,
            breakdown: {
              relevance: {
                textSimilarity: 0.5,
                keywordMatch: 0.5,
                topicOverlap: 0.5,
                semanticSimilarity: 0.5
              },
              quality: {
                citationScore: 0.5,
                recencyScore: 0.5,
                authorAuthority: 0.5,
                journalQuality: 0.5,
                completenessScore: 0.5
              },
              confidence: {
                metadataCompleteness: 0.5,
                sourceReliability: 0.5,
                extractionQuality: 0.5
              }
            }
          })),
          rankResults: vi.fn().mockResolvedValue(mockRankedResults),
          applyQualityMetrics: vi.fn().mockResolvedValue(mockSearchResults)
        },
        duplicateDetectionEngine: {
          detectDuplicates: vi.fn().mockReturnValue([]),
          removeDuplicates: vi.fn().mockResolvedValue(mockSearchResults),
          mergeDuplicates: vi.fn().mockImplementation((group) => group.primary)
        },
        feedbackLearningSystem: {
          getUserPreferencePatterns: vi.fn().mockResolvedValue({
            userId: 'test-user',
            preferredAuthors: [],
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
          }),
          applyFeedbackBasedRanking: vi.fn().mockResolvedValue(mockRankedResults),
          generateAdaptiveFilters: vi.fn().mockResolvedValue([]),
          getLearningMetrics: vi.fn().mockResolvedValue({
            totalFeedbackCount: 0,
            positiveRatings: 0,
            negativeRatings: 0,
            averageRating: 0,
            improvementTrend: 0,
            confidenceLevel: 0
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/content-extraction-engine')).ContentExtractionEngine
        .mockImplementation(() => mockServices.contentExtractionEngine)
        
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)
        
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)
        
      vi.mocked(require('../worker/lib/result-scoring-engine')).ResultScoringEngine
        .mockImplementation(() => mockServices.resultScoringEngine)
        
      vi.mocked(require('../worker/lib/duplicate-detection-engine')).DuplicateDetectionEngine
        .mockImplementation(() => mockServices.duplicateDetectionEngine)
        
      vi.mocked(require('../worker/lib/feedback-learning-system')).FeedbackLearningSystem
        .mockImplementation(() => mockServices.feedbackLearningSystem)

      // Execute workflow with error recovery
      const result = await integrationTests.executeCompleteWorkflow({
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ],
        queryOptions: {
          maxKeywords: 5,
          optimizeForAcademic: true
        },
        filters: {
          dateRange: { start: 2020, end: 2023 },
          sortBy: 'relevance' as const
        }
      })

      // Verify successful recovery and completion
      expect(result).toMatchObject({
        success: true,
        results: expect.arrayContaining([
          expect.objectContaining({
            title: 'Recovery Success',
            authors: ['Recovery, Success'],
            journal: 'Recovery Journal',
            year: 2023,
            citations: 25,
            doi: '10.1234/recover.2023.001',
            url: 'https://example.com/recover',
            abstract: 'Recovery test abstract',
            keywords: ['recovery', 'success'],
            confidence: 0.8,
            relevance_score: 0.75,
            citation_count: 25,
            relevanceScore: 0.75,
            qualityScore: 0.7,
            confidenceScore: 0.8,
            overallScore: 0.75,
            rank: 1
          })
        ]),
        total_results: 1,
        loaded_results: 1,
        has_more: false,
        sessionId: expect.any(String),
        processingTime: expect.any(Number),
        learningApplied: true
      })

      // Should have retried failed operations
      expect(contentExtractionCallCount).toBeGreaterThan(2)
      expect(queryGenerationCallCount).toBeGreaterThan(1)
      expect(searchExecutionCallCount).toBeGreaterThan(1)

      // Should have completed all workflow steps
      expect(mockServices.contentExtractionEngine.batchExtract).toHaveBeenCalled()
      expect(mockServices.queryGenerationEngine.generateQueries).toHaveBeenCalled()
      expect(mockServices.googleScholarClient.search).toHaveBeenCalled()
      expect(mockServices.resultScoringEngine.rankResults).toHaveBeenCalled()
      expect(mockServices.duplicateDetectionEngine.removeDuplicates).toHaveBeenCalled()
      expect(mockServices.feedbackLearningSystem.applyFeedbackBasedRanking).toHaveBeenCalled()
    })

    it('should provide meaningful error messages during recovery failures', async () => {
      // Mock complete workflow failure
      const mockServices = {
        contentExtractionEngine: {
          extractContent: vi.fn().mockRejectedValue(new Error('Content extraction permanently failed')),
          batchExtract: vi.fn().mockRejectedValue(new Error('Batch extraction permanently failed')),
          combineExtractedContents: vi.fn().mockRejectedValue(new Error('Content combination permanently failed'))
        },
        queryGenerationEngine: {
          generateQueries: vi.fn().mockRejectedValue(new Error('Query generation permanently failed')),
          optimizeQuery: vi.fn().mockRejectedValue(new Error('Query optimization permanently failed')),
          combineQueries: vi.fn().mockRejectedValue(new Error('Query combination permanently failed')),
          validateQuery: vi.fn().mockRejectedValue(new Error('Query validation permanently failed')),
          refineQuery: vi.fn().mockRejectedValue(new Error('Query refinement permanently failed'))
        },
        googleScholarClient: {
          search: vi.fn().mockRejectedValue(new Error('Search permanently failed')),
          parseResults: vi.fn().mockRejectedValue(new Error('Parsing permanently failed')),
          validateResults: vi.fn().mockRejectedValue(new Error('Validation permanently failed')),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/content-extraction-engine')).ContentExtractionEngine
        .mockImplementation(() => mockServices.contentExtractionEngine)
        
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)
        
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)

      // Execute workflow that should fail completely
      const result = await integrationTests.executeCompleteWorkflow({
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ]
      })

      // Should provide meaningful error message
      expect(result).toMatchObject({
        success: false,
        error: expect.stringContaining('Failed to execute AI search workflow'),
        processingTime: expect.any(Number)
      })

      // Should have attempted all workflow steps
      expect(mockServices.contentExtractionEngine.batchExtract).toHaveBeenCalled()
      expect(mockServices.queryGenerationEngine.generateQueries).toHaveBeenCalled()
      expect(mockServices.googleScholarClient.search).toHaveBeenCalled()
    })
  })

  describe('End-to-End Integration', () => {
    it('should execute complete end-to-end workflow with real data', async () => {
      // Mock real-world data for end-to-end test
      const mockExtractedContent: ExtractedContent[] = [
        {
          source: 'ideas',
          id: '1',
          title: 'End-to-End Integration Test',
          content: 'This is a comprehensive end-to-end integration test for the AI searcher functionality. The test covers the complete workflow from content extraction to final result presentation with all intermediate processing steps.',
          keywords: ['integration', 'test', 'workflow', 'AI', 'searcher'],
          keyPhrases: ['integration test', 'AI searcher', 'end-to-end'],
          topics: ['software testing', 'AI systems', 'integration'],
          confidence: 0.9
        }
      ]

      const mockQueries = [
        {
          id: 'query-1',
          query: '"integration" AND "test" AND "AI" AND "searcher"',
          originalContent: mockExtractedContent,
          generatedAt: new Date(),
          confidence: 0.9,
          keywords: ['integration', 'test', 'AI', 'searcher'],
          topics: ['software testing', 'AI systems', 'integration'],
          queryType: 'basic' as const,
          optimization: {
            breadthScore: 0.7,
            specificityScore: 0.8,
            academicRelevance: 0.9,
            suggestions: [],
            alternativeQueries: []
          }
        }
      ]

      const mockSearchResults: ScholarSearchResult[] = [
        {
          title: 'Comprehensive AI Searcher Integration Testing',
          authors: ['Tester, Integration', 'Developer, System'],
          journal: 'Journal of Software Testing',
          year: 2023,
          citations: 150,
          doi: '10.1234/integration.2023.001',
          url: 'https://example.com/integration-test',
          abstract: 'This paper presents a comprehensive approach to testing AI searcher integration in academic environments. We evaluate the complete workflow from content extraction to result presentation, including error handling, performance optimization, and user experience validation.',
          keywords: ['AI', 'searcher', 'integration', 'testing'],
          confidence: 0.95,
          relevance_score: 0.9,
          citation_count: 150
        },
        {
          title: 'End-to-End Workflow Validation in AI Systems',
          authors: ['Validator, End', 'Checker, System'],
          journal: 'AI Systems Review',
          year: 2022,
          citations: 89,
          doi: '10.5678/systems.2022.002',
          url: 'https://example.com/system-validation',
          abstract: 'A systematic approach to validating end-to-end workflows in artificial intelligence systems. This work focuses on automated testing frameworks and continuous integration practices for complex AI pipelines.',
          keywords: ['AI', 'workflow', 'validation', 'systems'],
          confidence: 0.88,
          relevance_score: 0.85,
          citation_count: 89
        }
      ]

      const mockRankedResults = [
        {
          ...mockSearchResults[0],
          relevanceScore: 0.9,
          qualityScore: 0.85,
          confidenceScore: 0.95,
          overallScore: 0.9,
          rank: 1,
          scoringBreakdown: {
            relevance: {
              textSimilarity: 0.9,
              keywordMatch: 0.85,
              topicOverlap: 0.8,
              semanticSimilarity: 0.75
            },
            quality: {
              citationScore: 0.85,
              recencyScore: 0.8,
              authorAuthority: 0.75,
              journalQuality: 0.9,
              completenessScore: 0.85
            },
            confidence: {
              metadataCompleteness: 0.95,
              sourceReliability: 0.9,
              extractionQuality: 0.85
            }
          }
        },
        {
          ...mockSearchResults[1],
          relevanceScore: 0.85,
          qualityScore: 0.8,
          confidenceScore: 0.88,
          overallScore: 0.84,
          rank: 2,
          scoringBreakdown: {
            relevance: {
              textSimilarity: 0.85,
              keywordMatch: 0.8,
              topicOverlap: 0.75,
              semanticSimilarity: 0.7
            },
            quality: {
              citationScore: 0.8,
              recencyScore: 0.75,
              authorAuthority: 0.7,
              journalQuality: 0.85,
              completenessScore: 0.8
            },
            confidence: {
              metadataCompleteness: 0.88,
              sourceReliability: 0.85,
              extractionQuality: 0.8
            }
          }
        }
      ]

      // Mock all services
      const mockServices = {
        contentExtractionEngine: {
          extractContent: vi.fn().mockResolvedValue(mockExtractedContent[0]),
          batchExtract: vi.fn().mockResolvedValue(mockExtractedContent),
          combineExtractedContents: vi.fn().mockResolvedValue(mockExtractedContent[0])
        },
        queryGenerationEngine: {
          generateQueries: vi.fn().mockResolvedValue(mockQueries),
          optimizeQuery: vi.fn().mockResolvedValue({
            breadthScore: 0.7,
            specificityScore: 0.8,
            academicRelevance: 0.9,
            suggestions: [],
            alternativeQueries: []
          }),
          combineQueries: vi.fn().mockResolvedValue(mockQueries[0]),
          validateQuery: vi.fn().mockResolvedValue({
            isValid: true,
            confidence: 0.9,
            issues: [],
            suggestions: []
          }),
          refineQuery: vi.fn().mockResolvedValue({
            breadthAnalysis: {
              breadthScore: 0.7,
              classification: 'optimal' as const,
              reasoning: 'Good',
              termCount: 4,
              specificityLevel: 'moderate' as const,
              suggestions: []
            },
            alternativeTerms: {
              synonyms: [],
              relatedTerms: [],
              broaderTerms: [],
              narrowerTerms: [],
              academicVariants: []
            },
            validationResults: {
              isValid: true,
              issues: [],
              suggestions: [],
              confidence: 0.9
            },
            optimizationRecommendations: [],
            refinedQueries: []
          })
        },
        googleScholarClient: {
          search: vi.fn().mockResolvedValue(mockSearchResults),
          parseResults: vi.fn().mockResolvedValue(mockSearchResults),
          validateResults: vi.fn().mockResolvedValue(mockSearchResults),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        },
        resultScoringEngine: {
          scoreResult: vi.fn().mockImplementation((result) => ({
            relevanceScore: result.relevance_score || 0.5,
            qualityScore: 0.8,
            confidenceScore: result.confidence || 0.5,
            overallScore: 0.75,
            breakdown: {
              relevance: {
                textSimilarity: 0.5,
                keywordMatch: 0.5,
                topicOverlap: 0.5,
                semanticSimilarity: 0.5
              },
              quality: {
                citationScore: 0.5,
                recencyScore: 0.5,
                authorAuthority: 0.5,
                journalQuality: 0.5,
                completenessScore: 0.5
              },
              confidence: {
                metadataCompleteness: 0.5,
                sourceReliability: 0.5,
                extractionQuality: 0.5
              }
            }
          })),
          rankResults: vi.fn().mockResolvedValue(mockRankedResults),
          applyQualityMetrics: vi.fn().mockResolvedValue(mockSearchResults)
        },
        duplicateDetectionEngine: {
          detectDuplicates: vi.fn().mockReturnValue([]),
          removeDuplicates: vi.fn().mockResolvedValue(mockSearchResults),
          mergeDuplicates: vi.fn().mockImplementation((group) => group.primary)
        },
        feedbackLearningSystem: {
          getUserPreferencePatterns: vi.fn().mockResolvedValue({
            userId: 'test-user',
            preferredAuthors: [],
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
          }),
          applyFeedbackBasedRanking: vi.fn().mockResolvedValue(mockRankedResults),
          generateAdaptiveFilters: vi.fn().mockResolvedValue([]),
          getLearningMetrics: vi.fn().mockResolvedValue({
            totalFeedbackCount: 0,
            positiveRatings: 0,
            negativeRatings: 0,
            averageRating: 0,
            improvementTrend: 0,
            confidenceLevel: 0
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/content-extraction-engine')).ContentExtractionEngine
        .mockImplementation(() => mockServices.contentExtractionEngine)
        
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)
        
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)
        
      vi.mocked(require('../worker/lib/result-scoring-engine')).ResultScoringEngine
        .mockImplementation(() => mockServices.resultScoringEngine)
        
      vi.mocked(require('../worker/lib/duplicate-detection-engine')).DuplicateDetectionEngine
        .mockImplementation(() => mockServices.duplicateDetectionEngine)
        
      vi.mocked(require('../worker/lib/feedback-learning-system')).FeedbackLearningSystem
        .mockImplementation(() => mockServices.feedbackLearningSystem)

      // Execute complete end-to-end workflow
      const startTime = Date.now()
      const result = await integrationTests.executeCompleteWorkflow({
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ],
        queryOptions: {
          maxKeywords: 10,
          optimizeForAcademic: true,
          includeAlternatives: true
        },
        filters: {
          dateRange: { start: 2020, end: 2023 },
          sortBy: 'relevance' as const,
          maxResults: 50
        }
      })
      const endTime = Date.now()

      // Verify complete end-to-end execution
      expect(result).toMatchObject({
        success: true,
        query: '"integration" AND "test" AND "AI" AND "searcher"',
        originalQuery: undefined,
        generatedQueries: expect.arrayContaining([
          expect.objectContaining({
            id: 'query-1',
            query: '"integration" AND "test" AND "AI" AND "searcher"',
            confidence: 0.9,
            keywords: ['integration', 'test', 'AI', 'searcher'],
            topics: ['software testing', 'AI systems', 'integration']
          })
        ]),
        extractedContent: expect.arrayContaining([
          expect.objectContaining({
            source: 'ideas',
            id: '1',
            title: 'End-to-End Integration Test',
            content: expect.stringContaining('comprehensive end-to-end integration test'),
            keywords: ['integration', 'test', 'workflow', 'AI', 'searcher'],
            keyPhrases: ['integration test', 'AI searcher', 'end-to-end'],
            topics: ['software testing', 'AI systems', 'integration'],
            confidence: 0.9
          })
        ]),
        results: expect.arrayContaining([
          expect.objectContaining({
            title: 'Comprehensive AI Searcher Integration Testing',
            authors: ['Tester, Integration', 'Developer, System'],
            journal: 'Journal of Software Testing',
            year: 2023,
            citations: 150,
            doi: '10.1234/integration.2023.001',
            url: 'https://example.com/integration-test',
            abstract: expect.stringContaining('comprehensive approach'),
            keywords: ['AI', 'searcher', 'integration', 'testing'],
            confidence: 0.95,
            relevance_score: 0.9,
            citation_count: 150,
            relevanceScore: 0.9,
            qualityScore: 0.85,
            confidenceScore: 0.95,
            overallScore: 0.9,
            rank: 1
          }),
          expect.objectContaining({
            title: 'End-to-End Workflow Validation in AI Systems',
            authors: ['Validator, End', 'Checker, System'],
            journal: 'AI Systems Review',
            year: 2022,
            citations: 89,
            doi: '10.5678/systems.2022.002',
            url: 'https://example.com/system-validation',
            abstract: expect.stringContaining('systematic approach'),
            keywords: ['AI', 'workflow', 'validation', 'systems'],
            confidence: 0.88,
            relevance_score: 0.85,
            citation_count: 89,
            relevanceScore: 0.85,
            qualityScore: 0.8,
            confidenceScore: 0.88,
            overallScore: 0.84,
            rank: 2
          })
        ]),
        total_results: 2,
        loaded_results: 2,
        has_more: false,
        sessionId: expect.any(String),
        processingTime: expect.any(Number),
        learningApplied: true,
        performance_metrics: expect.any(Object),
        search_metadata: expect.any(Object)
      })

      // Should complete within reasonable time
      expect(result.processingTime).toBeLessThan(5000) // 5 seconds for complete workflow

      // Should have meaningful performance metrics
      expect(result.performance_metrics).toMatchObject({
        content_extraction_time: expect.any(Number),
        query_generation_time: expect.any(Number),
        search_execution_time: expect.any(Number),
        result_processing_time: expect.any(Number),
        duplicate_detection_time: expect.any(Number),
        feedback_application_time: expect.any(Number),
        total_time: expect.any(Number)
      })

      // Should have search metadata
      expect(result.search_metadata).toMatchObject({
        query_complexity: expect.any(String),
        result_diversity: expect.any(Number),
        user_satisfaction_estimate: expect.any(Number),
        average_result_quality: expect.any(Number)
      })

      // Verify all components were called
      expect(mockServices.contentExtractionEngine.batchExtract).toHaveBeenCalled()
      expect(mockServices.queryGenerationEngine.generateQueries).toHaveBeenCalled()
      expect(mockServices.googleScholarClient.search).toHaveBeenCalled()
      expect(mockServices.resultScoringEngine.rankResults).toHaveBeenCalled()
      expect(mockServices.duplicateDetectionEngine.removeDuplicates).toHaveBeenCalled()
      expect(mockServices.feedbackLearningSystem.applyFeedbackBasedRanking).toHaveBeenCalled()
    })

    it('should handle end-to-end workflow errors gracefully', async () => {
      // Mock end-to-end workflow failure
      const mockServices = {
        contentExtractionEngine: {
          extractContent: vi.fn().mockRejectedValue(new Error('Content extraction failed')),
          batchExtract: vi.fn().mockRejectedValue(new Error('Batch extraction failed')),
          combineExtractedContents: vi.fn().mockRejectedValue(new Error('Content combination failed'))
        },
        queryGenerationEngine: {
          generateQueries: vi.fn().mockRejectedValue(new Error('Query generation failed')),
          optimizeQuery: vi.fn().mockRejectedValue(new Error('Query optimization failed')),
          combineQueries: vi.fn().mockRejectedValue(new Error('Query combination failed')),
          validateQuery: vi.fn().mockRejectedValue(new Error('Query validation failed')),
          refineQuery: vi.fn().mockRejectedValue(new Error('Query refinement failed'))
        },
        googleScholarClient: {
          search: vi.fn().mockRejectedValue(new Error('Search failed')),
          parseResults: vi.fn().mockRejectedValue(new Error('Parsing failed')),
          validateResults: vi.fn().mockRejectedValue(new Error('Validation failed')),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/content-extraction-engine')).ContentExtractionEngine
        .mockImplementation(() => mockServices.contentExtractionEngine)
        
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)
        
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)

      // Execute workflow that should fail completely
      const result = await integrationTests.executeCompleteWorkflow({
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ]
      })

      // Should handle complete workflow failure gracefully
      expect(result).toMatchObject({
        success: false,
        error: expect.stringContaining('Failed to execute AI search workflow'),
        processingTime: expect.any(Number)
      })

      // Should still attempt all workflow steps
      expect(mockServices.contentExtractionEngine.batchExtract).toHaveBeenCalled()
      expect(mockServices.queryGenerationEngine.generateQueries).toHaveBeenCalled()
      expect(mockServices.googleScholarClient.search).toHaveBeenCalled()
    })
  })

  describe('Cross-Component Integration', () => {
    it('should integrate all components seamlessly', async () => {
      // Mock seamless integration data
      const mockExtractedContent: ExtractedContent[] = [
        {
          source: 'ideas',
          id: '1',
          title: 'Cross-Component Integration',
          content: 'Test content for cross-component integration',
          keywords: ['integration', 'component', 'cross'],
          keyPhrases: ['cross-component integration'],
          topics: ['integration testing'],
          confidence: 0.85
        }
      ]

      const mockQueries = [
        {
          id: 'query-1',
          query: '"integration" AND "component"',
          originalContent: mockExtractedContent,
          generatedAt: new Date(),
          confidence: 0.85,
          keywords: ['integration', 'component'],
          topics: ['integration testing'],
          queryType: 'basic' as const,
          optimization: {
            breadthScore: 0.65,
            specificityScore: 0.75,
            academicRelevance: 0.85,
            suggestions: [],
            alternativeQueries: []
          }
        }
      ]

      const mockSearchResults: ScholarSearchResult[] = [
        {
          title: 'Cross-Component Integration Success',
          authors: ['Integrator, Cross', 'Component, Test'],
          journal: 'Integration Testing Journal',
          year: 2023,
          citations: 125,
          doi: '10.1234/cross.2023.001',
          url: 'https://example.com/cross-component',
          abstract: 'Successful cross-component integration test',
          keywords: ['integration', 'component', 'success'],
          confidence: 0.9,
          relevance_score: 0.85,
          citation_count: 125
        }
      ]

      const mockRankedResults = [
        {
          ...mockSearchResults[0],
          relevanceScore: 0.85,
          qualityScore: 0.8,
          confidenceScore: 0.9,
          overallScore: 0.85,
          rank: 1,
          scoringBreakdown: {
            relevance: {
              textSimilarity: 0.85,
              keywordMatch: 0.8,
              topicOverlap: 0.75,
              semanticSimilarity: 0.7
            },
            quality: {
              citationScore: 0.8,
              recencyScore: 0.75,
              authorAuthority: 0.7,
              journalQuality: 0.85,
              completenessScore: 0.85
            },
            confidence: {
              metadataCompleteness: 0.9,
              sourceReliability: 0.85,
              extractionQuality: 0.8
            }
          }
        }
      ]

      // Mock all services
      const mockServices = {
        contentExtractionEngine: {
          extractContent: vi.fn().mockResolvedValue(mockExtractedContent[0]),
          batchExtract: vi.fn().mockResolvedValue(mockExtractedContent),
          combineExtractedContents: vi.fn().mockResolvedValue(mockExtractedContent[0])
        },
        queryGenerationEngine: {
          generateQueries: vi.fn().mockResolvedValue(mockQueries),
          optimizeQuery: vi.fn().mockResolvedValue({
            breadthScore: 0.65,
            specificityScore: 0.75,
            academicRelevance: 0.85,
            suggestions: [],
            alternativeQueries: []
          }),
          combineQueries: vi.fn().mockResolvedValue(mockQueries[0]),
          validateQuery: vi.fn().mockResolvedValue({
            isValid: true,
            confidence: 0.85,
            issues: [],
            suggestions: []
          }),
          refineQuery: vi.fn().mockResolvedValue({
            breadthAnalysis: {
              breadthScore: 0.65,
              classification: 'optimal' as const,
              reasoning: 'Good',
              termCount: 2,
              specificityLevel: 'moderate' as const,
              suggestions: []
            },
            alternativeTerms: {
              synonyms: [],
              relatedTerms: [],
              broaderTerms: [],
              narrowerTerms: [],
              academicVariants: []
            },
            validationResults: {
              isValid: true,
              issues: [],
              suggestions: [],
              confidence: 0.85
            },
            optimizationRecommendations: [],
            refinedQueries: []
          })
        },
        googleScholarClient: {
          search: vi.fn().mockResolvedValue(mockSearchResults),
          parseResults: vi.fn().mockResolvedValue(mockSearchResults),
          validateResults: vi.fn().mockResolvedValue(mockSearchResults),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        },
        resultScoringEngine: {
          scoreResult: vi.fn().mockImplementation((result) => ({
            relevanceScore: result.relevance_score || 0.5,
            qualityScore: 0.8,
            confidenceScore: result.confidence || 0.5,
            overallScore: 0.75,
            breakdown: {
              relevance: {
                textSimilarity: 0.5,
                keywordMatch: 0.5,
                topicOverlap: 0.5,
                semanticSimilarity: 0.5
              },
              quality: {
                citationScore: 0.5,
                recencyScore: 0.5,
                authorAuthority: 0.5,
                journalQuality: 0.5,
                completenessScore: 0.5
              },
              confidence: {
                metadataCompleteness: 0.5,
                sourceReliability: 0.5,
                extractionQuality: 0.5
              }
            }
          })),
          rankResults: vi.fn().mockResolvedValue(mockRankedResults),
          applyQualityMetrics: vi.fn().mockResolvedValue(mockSearchResults)
        },
        duplicateDetectionEngine: {
          detectDuplicates: vi.fn().mockReturnValue([]),
          removeDuplicates: vi.fn().mockResolvedValue(mockSearchResults),
          mergeDuplicates: vi.fn().mockImplementation((group) => group.primary)
        },
        feedbackLearningSystem: {
          getUserPreferencePatterns: vi.fn().mockResolvedValue({
            userId: 'test-user',
            preferredAuthors: [],
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
          }),
          applyFeedbackBasedRanking: vi.fn().mockResolvedValue(mockRankedResults),
          generateAdaptiveFilters: vi.fn().mockResolvedValue([]),
          getLearningMetrics: vi.fn().mockResolvedValue({
            totalFeedbackCount: 0,
            positiveRatings: 0,
            negativeRatings: 0,
            averageRating: 0,
            improvementTrend: 0,
            confidenceLevel: 0
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/content-extraction-engine')).ContentExtractionEngine
        .mockImplementation(() => mockServices.contentExtractionEngine)
        
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)
        
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)
        
      vi.mocked(require('../worker/lib/result-scoring-engine')).ResultScoringEngine
        .mockImplementation(() => mockServices.resultScoringEngine)
        
      vi.mocked(require('../worker/lib/duplicate-detection-engine')).DuplicateDetectionEngine
        .mockImplementation(() => mockServices.duplicateDetectionEngine)
        
      vi.mocked(require('../worker/lib/feedback-learning-system')).FeedbackLearningSystem
        .mockImplementation(() => mockServices.feedbackLearningSystem)

      // Execute cross-component integration test
      const result = await integrationTests.executeCompleteWorkflow({
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ],
        queryOptions: {
          maxKeywords: 5,
          optimizeForAcademic: true
        },
        filters: {
          dateRange: { start: 2020, end: 2023 },
          sortBy: 'relevance' as const
        }
      })

      // Verify seamless integration
      expect(result).toMatchObject({
        success: true,
        query: '"integration" AND "component"',
        results: expect.arrayContaining([
          expect.objectContaining({
            title: 'Cross-Component Integration Success',
            authors: ['Integrator, Cross', 'Component, Test'],
            journal: 'Integration Testing Journal',
            year: 2023,
            citations: 125,
            doi: '10.1234/cross.2023.001',
            url: 'https://example.com/cross-component',
            abstract: 'Successful cross-component integration test',
            keywords: ['integration', 'component', 'success'],
            confidence: 0.9,
            relevance_score: 0.85,
            citation_count: 125,
            relevanceScore: 0.85,
            qualityScore: 0.8,
            confidenceScore: 0.9,
            overallScore: 0.85,
            rank: 1
          })
        ]),
        total_results: 1,
        loaded_results: 1,
        has_more: false,
        sessionId: expect.any(String),
        processingTime: expect.any(Number),
        learningApplied: true
      })

      // Verify all components were called
      expect(mockServices.contentExtractionEngine.batchExtract).toHaveBeenCalled()
      expect(mockServices.queryGenerationEngine.generateQueries).toHaveBeenCalled()
      expect(mockServices.googleScholarClient.search).toHaveBeenCalled()
      expect(mockServices.resultScoringEngine.rankResults).toHaveBeenCalled()
      expect(mockServices.duplicateDetectionEngine.removeDuplicates).toHaveBeenCalled()
      expect(mockServices.feedbackLearningSystem.applyFeedbackBasedRanking).toHaveBeenCalled()
    })

    it('should handle cross-component integration errors gracefully', async () => {
      // Mock cross-component integration failure
      const mockServices = {
        contentExtractionEngine: {
          extractContent: vi.fn().mockRejectedValue(new Error('Content extraction failed')),
          batchExtract: vi.fn().mockRejectedValue(new Error('Batch extraction failed')),
          combineExtractedContents: vi.fn().mockRejectedValue(new Error('Content combination failed'))
        },
        queryGenerationEngine: {
          generateQueries: vi.fn().mockRejectedValue(new Error('Query generation failed')),
          optimizeQuery: vi.fn().mockRejectedValue(new Error('Query optimization failed')),
          combineQueries: vi.fn().mockRejectedValue(new Error('Query combination failed')),
          validateQuery: vi.fn().mockRejectedValue(new Error('Query validation failed')),
          refineQuery: vi.fn().mockRejectedValue(new Error('Query refinement failed'))
        },
        googleScholarClient: {
          search: vi.fn().mockRejectedValue(new Error('Search failed')),
          parseResults: vi.fn().mockRejectedValue(new Error('Parsing failed')),
          validateResults: vi.fn().mockRejectedValue(new Error('Validation failed')),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/content-extraction-engine')).ContentExtractionEngine
        .mockImplementation(() => mockServices.contentExtractionEngine)
        
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)
        
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)

      // Execute integration that should fail completely
      const result = await integrationTests.executeCompleteWorkflow({
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ]
      })

      // Should handle cross-component integration failures gracefully
      expect(result).toMatchObject({
        success: false,
        error: expect.stringContaining('Failed to execute AI search workflow'),
        processingTime: expect.any(Number)
      })

      // Should still attempt all workflow steps
      expect(mockServices.contentExtractionEngine.batchExtract).toHaveBeenCalled()
      expect(mockServices.queryGenerationEngine.generateQueries).toHaveBeenCalled()
      expect(mockServices.googleScholarClient.search).toHaveBeenCalled()
    })
  })

  describe('Integration with External Systems', () => {
    it('should integrate with external systems and APIs', async () => {
      // Mock external system integration
      const mockExtractedContent: ExtractedContent[] = [
        {
          source: 'ideas',
          id: '1',
          title: 'External System Integration',
          content: 'Content for external system integration',
          keywords: ['integration', 'external', 'system'],
          keyPhrases: ['external system integration'],
          topics: ['system integration'],
          confidence: 0.8
        }
      ]

      const mockQueries = [
        {
          id: 'query-1',
          query: '"integration" AND "external" AND "system"',
          originalContent: mockExtractedContent,
          generatedAt: new Date(),
          confidence: 0.8,
          keywords: ['integration', 'external', 'system'],
          topics: ['system integration'],
          queryType: 'basic' as const,
          optimization: {
            breadthScore: 0.7,
            specificityScore: 0.8,
            academicRelevance: 0.8,
            suggestions: [],
            alternativeQueries: []
          }
        }
      ]

      // Mock external API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            idea: {
              id: 1,
              title: 'External System Integration',
              description: 'Content for external system integration',
              content: 'Content for external system integration',
              type: 'concept',
              tags: ['integration', 'external', 'system'],
              confidence: 0.8,
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
              conversationid: 'test-conversation-123'
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => `
            <div class="gs_r gs_or gs_scl">
              <div class="gs_ri">
                <h3 class="gs_rt">
                  <a href="https://example.com/external">External System Integration Success</a>
                </h3>
                <div class="gs_a">External, System - Integration Journal, 2023</div>
                <span class="gs_rs">Successful external system integration</span>
                <div class="gs_fl">Cited by 75</div>
              </div>
            </div>
          `
        })

      // Mock services
      const mockServices = {
        contentExtractionEngine: {
          extractContent: vi.fn().mockResolvedValue(mockExtractedContent[0]),
          batchExtract: vi.fn().mockResolvedValue(mockExtractedContent),
          combineExtractedContents: vi.fn().mockResolvedValue(mockExtractedContent[0])
        },
        queryGenerationEngine: {
          generateQueries: vi.fn().mockResolvedValue(mockQueries),
          optimizeQuery: vi.fn().mockResolvedValue({
            breadthScore: 0.7,
            specificityScore: 0.8,
            academicRelevance: 0.8,
            suggestions: [],
            alternativeQueries: []
          }),
          combineQueries: vi.fn().mockResolvedValue(mockQueries[0]),
          validateQuery: vi.fn().mockResolvedValue({
            isValid: true,
            confidence: 0.8,
            issues: [],
            suggestions: []
          }),
          refineQuery: vi.fn().mockResolvedValue({
            breadthAnalysis: {
              breadthScore: 0.7,
              classification: 'optimal' as const,
              reasoning: 'Good',
              termCount: 3,
              specificityLevel: 'moderate' as const,
              suggestions: []
            },
            alternativeTerms: {
              synonyms: [],
              relatedTerms: [],
              broaderTerms: [],
              narrowerTerms: [],
              academicVariants: []
            },
            validationResults: {
              isValid: true,
              issues: [],
              suggestions: [],
              confidence: 0.8
            },
            optimizationRecommendations: [],
            refinedQueries: []
          })
        },
        googleScholarClient: {
          search: vi.fn().mockResolvedValue([
            {
              title: 'External System Integration Success',
              authors: ['External, System'],
              journal: 'Integration Journal',
              year: 2023,
              citations: 75,
              doi: '10.1234/external.2023.001',
              url: 'https://example.com/external',
              abstract: 'Successful external system integration',
              keywords: ['integration', 'external', 'system'],
              confidence: 0.85,
              relevance_score: 0.8,
              citation_count: 75
            }
          ]),
          parseResults: vi.fn().mockResolvedValue([
            {
              title: 'External System Integration Success',
              authors: ['External, System'],
              journal: 'Integration Journal',
              year: 2023,
              citations: 75,
              doi: '10.1234/external.2023.001',
              url: 'https://example.com/external',
              abstract: 'Successful external system integration',
              keywords: ['integration', 'external', 'system'],
              confidence: 0.85,
              relevance_score: 0.8,
              citation_count: 75
            }
          ]),
          validateResults: vi.fn().mockResolvedValue([
            {
              title: 'External System Integration Success',
              authors: ['External, System'],
              journal: 'Integration Journal',
              year: 2023,
              citations: 75,
              doi: '10.1234/external.2023.001',
              url: 'https://example.com/external',
              abstract: 'Successful external system integration',
              keywords: ['integration', 'external', 'system'],
              confidence: 0.85,
              relevance_score: 0.8,
              citation_count: 75
            }
          ]),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/content-extraction-engine')).ContentExtractionEngine
        .mockImplementation(() => mockServices.contentExtractionEngine)
        
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)
        
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)

      // Execute external system integration
      const result = await integrationTests.executeCompleteWorkflow({
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ],
        queryOptions: {
          maxKeywords: 5,
          optimizeForAcademic: true
        },
        filters: {
          dateRange: { start: 2020, end: 2023 },
          sortBy: 'relevance' as const
        }
      })

      // Verify external system integration
      expect(result).toMatchObject({
        success: true,
        query: '"integration" AND "external" AND "system"',
        results: expect.arrayContaining([
          expect.objectContaining({
            title: 'External System Integration Success',
            authors: ['External, System'],
            journal: 'Integration Journal',
            year: 2023,
            citations: 75,
            doi: '10.1234/external.2023.001',
            url: 'https://example.com/external',
            abstract: 'Successful external system integration',
            keywords: ['integration', 'external', 'system'],
            confidence: 0.85,
            relevance_score: 0.8,
            citation_count: 75
          })
        ]),
        total_results: 1,
        loaded_results: 1,
        has_more: false,
        sessionId: expect.any(String),
        processingTime: expect.any(Number),
        learningApplied: false
      })

      // Verify external API calls
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ideas/1',
        expect.any(Object)
      )

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('scholar.google.com'),
        expect.any(Object)
      )

      // Verify service calls
      expect(mockServices.contentExtractionEngine.batchExtract).toHaveBeenCalled()
      expect(mockServices.queryGenerationEngine.generateQueries).toHaveBeenCalled()
      expect(mockServices.googleScholarClient.search).toHaveBeenCalled()
    })

    it('should handle external system errors gracefully', async () => {
      // Mock external system failures
      mockFetch
        .mockRejectedValueOnce(new Error('External API failure'))
        .mockRejectedValueOnce(new Error('Google Scholar API failure'))

      // Mock services
      const mockServices = {
        contentExtractionEngine: {
          extractContent: vi.fn().mockRejectedValue(new Error('Content extraction failed')),
          batchExtract: vi.fn().mockRejectedValue(new Error('Batch extraction failed')),
          combineExtractedContents: vi.fn().mockRejectedValue(new Error('Content combination failed'))
        },
        queryGenerationEngine: {
          generateQueries: vi.fn().mockRejectedValue(new Error('Query generation failed')),
          optimizeQuery: vi.fn().mockRejectedValue(new Error('Query optimization failed')),
          combineQueries: vi.fn().mockRejectedValue(new Error('Query combination failed')),
          validateQuery: vi.fn().mockRejectedValue(new Error('Query validation failed')),
          refineQuery: vi.fn().mockRejectedValue(new Error('Query refinement failed'))
        },
        googleScholarClient: {
          search: vi.fn().mockRejectedValue(new Error('Search failed')),
          parseResults: vi.fn().mockRejectedValue(new Error('Parsing failed')),
          validateResults: vi.fn().mockRejectedValue(new Error('Validation failed')),
          getRateLimitStatus: vi.fn().mockReturnValue({
            isBlocked: false,
            blockUntil: 0,
            requestsInLastMinute: 0,
            requestsInLastHour: 0,
            remainingMinuteRequests: 100,
            remainingHourlyRequests: 1000
          })
        }
      }

      // Override service mocks
      vi.mocked(require('../worker/lib/content-extraction-engine')).ContentExtractionEngine
        .mockImplementation(() => mockServices.contentExtractionEngine)
        
      vi.mocked(require('../worker/lib/query-generation-engine')).QueryGenerationEngine
        .mockImplementation(() => mockServices.queryGenerationEngine)
        
      vi.mocked(require('../worker/lib/google-scholar-client')).GoogleScholarClient
        .mockImplementation(() => mockServices.googleScholarClient)

      // Execute integration that should fail due to external system errors
      const result = await integrationTests.executeCompleteWorkflow({
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ]
      })

      // Should handle external system errors gracefully
      expect(result).toMatchObject({
        success: false,
        error: expect.stringContaining('Failed to execute AI search workflow'),
        processingTime: expect.any(Number)
      })

      // Should still attempt external API calls
      expect(mockFetch).toHaveBeenCalled()
    })
  })
})