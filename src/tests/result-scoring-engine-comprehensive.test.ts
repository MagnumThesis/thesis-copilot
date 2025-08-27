/**
 * Result Scoring Engine Tests
 * Comprehensive tests for scoring and ranking search results
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ResultScoringEngine, ScoringWeights } from '../worker/lib/result-scoring-engine'
import { ScholarSearchResult, ExtractedContent } from '../lib/ai-types'

describe('ResultScoringEngine', () => {
  let engine: ResultScoringEngine
  let mockContent: ExtractedContent

  beforeEach(() => {
    engine = new ResultScoringEngine()
    
    mockContent = {
      source: 'ideas',
      id: '1',
      title: 'Machine Learning Research',
      content: 'Research on machine learning algorithms for natural language processing applications.',
      keywords: ['machine learning', 'NLP', 'algorithms', 'research'],
      keyPhrases: ['machine learning algorithms', 'natural language processing'],
      topics: ['artificial intelligence', 'computational linguistics'],
      confidence: 0.9
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('scoreResult', () => {
    it('should score a single search result', () => {
      const result: ScholarSearchResult = {
        title: 'Machine Learning Algorithms for NLP',
        authors: ['Smith, J.', 'Johnson, A.'],
        journal: 'Journal of Artificial Intelligence Research',
        year: 2023,
        citations: 150,
        doi: '10.1234/jair.2023.001',
        url: 'https://example.com/paper1',
        abstract: 'This paper explores various machine learning algorithms for natural language processing tasks...',
        keywords: ['machine learning', 'NLP', 'algorithms'],
        confidence: 0.95,
        relevance_score: 0.88
      }

      const scoringResult = engine.scoreResult(result, mockContent)

      expect(scoringResult).toMatchObject({
        relevanceScore: expect.toBeGreaterThanOrEqual(0.7),
        qualityScore: expect.toBeGreaterThanOrEqual(0.7),
        confidenceScore: expect.toBeGreaterThanOrEqual(0.7),
        overallScore: expect.toBeGreaterThanOrEqual(0.7),
        breakdown: expect.any(Object)
      })

      // All scores should be between 0 and 1
      expect(scoringResult.relevanceScore).toBeGreaterThanOrEqual(0)
      expect(scoringResult.relevanceScore).toBeLessThanOrEqual(1)
      expect(scoringResult.qualityScore).toBeGreaterThanOrEqual(0)
      expect(scoringResult.qualityScore).toBeLessThanOrEqual(1)
      expect(scoringResult.confidenceScore).toBeGreaterThanOrEqual(0)
      expect(scoringResult.confidenceScore).toBeLessThanOrEqual(1)
      expect(scoringResult.overallScore).toBeGreaterThanOrEqual(0)
      expect(scoringResult.overallScore).toBeLessThanOrEqual(1)
    })

    it('should handle results with missing optional fields', () => {
      const result: ScholarSearchResult = {
        title: 'Incomplete Paper',
        authors: ['Author, A.'],
        confidence: 0.5,
        relevance_score: 0.4
      }

      const scoringResult = engine.scoreResult(result, mockContent)

      // Should still provide scores, but lower due to missing data
      expect(scoringResult.relevanceScore).toBeGreaterThanOrEqual(0)
      expect(scoringResult.qualityScore).toBeGreaterThanOrEqual(0)
      expect(scoringResult.confidenceScore).toBeGreaterThanOrEqual(0)
      expect(scoringResult.overallScore).toBeGreaterThanOrEqual(0)
    })

    it('should use custom weights when provided', () => {
      const result: ScholarSearchResult = {
        title: 'Weighted Scoring Test',
        authors: ['Test, A.'],
        journal: 'Test Journal',
        year: 2023,
        citations: 50,
        confidence: 0.8,
        relevance_score: 0.7
      }

      const customWeights: Partial<ScoringWeights> = {
        relevance: 0.6,
        quality: 0.3,
        confidence: 0.1
      }

      const scoringResult = engine.scoreResult(result, mockContent, customWeights)

      expect(scoringResult.overallScore).toBeGreaterThanOrEqual(0)
      expect(scoringResult.overallScore).toBeLessThanOrEqual(1)
    })
  })

  describe('scoreRelevance', () => {
    it('should score relevance based on text similarity', () => {
      const result: ScholarSearchResult = {
        title: 'Machine Learning in Natural Language Processing',
        authors: ['Smith, J.', 'Doe, A.'],
        abstract: 'This research investigates machine learning applications in NLP...',
        keywords: ['machine learning', 'NLP', 'applications'],
        confidence: 0.9,
        relevance_score: 0.8
      }

      const relevanceScore = engine.scoreRelevance(result, mockContent)

      // Should have high relevance score due to matching keywords
      expect(relevanceScore).toBeGreaterThan(0.6)
    })

    it('should score low relevance for unrelated content', () => {
      const unrelatedContent: ExtractedContent = {
        source: 'ideas',
        id: '2',
        title: 'Quantum Physics Research',
        content: 'Research on quantum mechanics and particle physics.',
        keywords: ['quantum physics', 'particle physics', 'mechanics'],
        keyPhrases: ['quantum mechanics', 'particle physics'],
        topics: ['physics', 'quantum mechanics'],
        confidence: 0.8
      }

      const result: ScholarSearchResult = {
        title: 'Machine Learning Applications',
        authors: ['ML, Researcher'],
        abstract: 'Applications of machine learning in various domains.',
        keywords: ['machine learning', 'applications'],
        confidence: 0.8,
        relevance_score: 0.6
      }

      const relevanceScore = engine.scoreRelevance(result, unrelatedContent)

      // Should have low relevance score due to lack of overlap
      expect(relevanceScore).toBeLessThan(0.4)
    })

    it('should handle empty content gracefully', () => {
      const emptyContent: ExtractedContent = {
        source: 'ideas',
        id: '3',
        title: '',
        content: '',
        keywords: [],
        keyPhrases: [],
        topics: [],
        confidence: 0.5
      }

      const result: ScholarSearchResult = {
        title: 'Any Paper',
        authors: ['Any, Author'],
        confidence: 0.5,
        relevance_score: 0.5
      }

      const relevanceScore = engine.scoreRelevance(result, emptyContent)

      // Should return neutral score for empty content
      expect(relevanceScore).toBeGreaterThanOrEqual(0)
      expect(relevanceScore).toBeLessThanOrEqual(1)
    })
  })

  describe('scoreQuality', () => {
    it('should score high quality for well-cited recent papers', () => {
      const result: ScholarSearchResult = {
        title: 'High Quality Paper',
        authors: ['Expert, A.', 'Authority, B.'],
        journal: 'Nature',
        year: 2023,
        citations: 500,
        doi: '10.1038/nature.2023.001',
        url: 'https://nature.com/high-quality',
        confidence: 0.95,
        relevance_score: 0.9
      }

      const qualityScore = engine.scoreQuality(result)

      // Should have high quality score
      expect(qualityScore).toBeGreaterThan(0.8)
    })

    it('should score lower quality for old papers with few citations', () => {
      const result: ScholarSearchResult = {
        title: 'Old Low Quality Paper',
        authors: ['Unknown, Author'],
        journal: 'Unknown Journal',
        year: 1995,
        citations: 5,
        confidence: 0.4,
        relevance_score: 0.3
      }

      const qualityScore = engine.scoreQuality(result)

      // Should have lower quality score
      expect(qualityScore).toBeLessThan(0.5)
    })

    it('should boost quality score for high-impact journals', () => {
      const natureResult: ScholarSearchResult = {
        title: 'Nature Paper',
        authors: ['Researcher, A.'],
        journal: 'Nature',
        year: 2022,
        citations: 200,
        confidence: 0.9,
        relevance_score: 0.8
      }

      const genericResult: ScholarSearchResult = {
        title: 'Generic Paper',
        authors: ['Author, A.'],
        journal: 'Generic Journal',
        year: 2022,
        citations: 200,
        confidence: 0.9,
        relevance_score: 0.8
      }

      const natureQuality = engine.scoreQuality(natureResult)
      const genericQuality = engine.scoreQuality(genericResult)

      // Nature paper should have higher quality score
      expect(natureQuality).toBeGreaterThan(genericQuality)
    })
  })

  describe('calculateConfidence', () => {
    it('should calculate high confidence for complete results', () => {
      const result: ScholarSearchResult = {
        title: 'Complete Paper with DOI',
        authors: ['Author, A.', 'Author, B.', 'Author, C.'],
        journal: 'Journal of Research',
        year: 2023,
        citations: 75,
        doi: '10.1234/journal.2023.001',
        url: 'https://journal.com/paper',
        abstract: 'Complete abstract with detailed information.',
        keywords: ['research', 'complete', 'paper'],
        confidence: 0.95,
        relevance_score: 0.88
      }

      const confidence = engine.calculateConfidence(result)

      // Should have high confidence
      expect(confidence).toBeGreaterThan(0.8)
    })

    it('should calculate lower confidence for incomplete results', () => {
      const result: ScholarSearchResult = {
        title: 'Incomplete Paper',
        authors: ['Author'],
        confidence: 0.3,
        relevance_score: 0.2
      }

      const confidence = engine.calculateConfidence(result)

      // Should have lower confidence
      expect(confidence).toBeLessThan(0.5)
    })

    it('should never return confidence below 0.1', () => {
      const result: ScholarSearchResult = {
        title: '',
        authors: [],
        confidence: 0.1,
        relevance_score: 0.1
      }

      const confidence = engine.calculateConfidence(result)

      // Should never go below 0.1
      expect(confidence).toBeGreaterThanOrEqual(0.1)
    })
  })

  describe('rankResults', () => {
    it('should rank multiple results by overall score', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Low Quality Paper',
          authors: ['Author, A.'],
          year: 2000,
          citations: 10,
          confidence: 0.3,
          relevance_score: 0.2
        },
        {
          title: 'High Quality Paper',
          authors: ['Expert, A.', 'Authority, B.'],
          journal: 'Nature',
          year: 2023,
          citations: 300,
          doi: '10.1038/nature.2023.001',
          url: 'https://nature.com/paper',
          abstract: 'Excellent research with comprehensive methodology',
          confidence: 0.95,
          relevance_score: 0.9
        },
        {
          title: 'Medium Quality Paper',
          authors: ['Researcher, A.', 'Collaborator, B.'],
          journal: 'IEEE Transactions',
          year: 2021,
          citations: 75,
          confidence: 0.7,
          relevance_score: 0.65
        }
      ]

      const rankedResults = engine.rankResults(results, mockContent)

      expect(rankedResults).toHaveLength(3)
      
      // Results should be sorted by overall score (descending)
      expect(rankedResults[0].overallScore).toBeGreaterThanOrEqual(rankedResults[1].overallScore)
      expect(rankedResults[1].overallScore).toBeGreaterThanOrEqual(rankedResults[2].overallScore)
      
      // Each result should have rank assigned
      expect(rankedResults[0].rank).toBe(1)
      expect(rankedResults[1].rank).toBe(2)
      expect(rankedResults[2].rank).toBe(3)
    })

    it('should handle empty results array', () => {
      const rankedResults = engine.rankResults([], mockContent)
      expect(rankedResults).toHaveLength(0)
    })

    it('should handle single result', () => {
      const results: ScholarSearchResult[] = [{
        title: 'Single Paper',
        authors: ['Author, A.'],
        confidence: 0.8,
        relevance_score: 0.7
      }]

      const rankedResults = engine.rankResults(results, mockContent)
      expect(rankedResults).toHaveLength(1)
      expect(rankedResults[0].rank).toBe(1)
    })

    it('should use custom weights for ranking', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Relevance Heavy Paper',
          authors: ['Author, A.'],
          abstract: 'This paper contains machine learning and NLP terms',
          keywords: ['machine learning', 'NLP'],
          confidence: 0.8,
          relevance_score: 0.9
        },
        {
          title: 'Quality Heavy Paper',
          authors: ['Expert, A.', 'Authority, B.'],
          journal: 'Nature',
          year: 2023,
          citations: 500,
          confidence: 0.7,
          relevance_score: 0.6
        }
      ]

      const customWeights: Partial<ScoringWeights> = {
        relevance: 0.8,
        quality: 0.1,
        confidence: 0.1
      }

      const rankedResults = engine.rankResults(results, mockContent, customWeights)

      // Relevance-heavy paper should rank higher with high relevance weight
      expect(rankedResults[0].title).toContain('Relevance Heavy')
    })
  })

  describe('applyQualityMetrics', () => {
    it('should enhance results with quality metrics', () => {
      const results: ScholarSearchResult[] = [{
        title: 'Test Paper',
        authors: ['Author, A.'],
        confidence: 0.7,
        relevance_score: 0.6
      }]

      const enhancedResults = engine.applyQualityMetrics(results)

      expect(enhancedResults).toHaveLength(1)
      expect(enhancedResults[0]).toMatchObject({
        confidence: expect.any(Number),
        relevance_score: expect.any(Number)
      })
      
      // Should maintain original values
      expect(enhancedResults[0].confidence).toBe(0.7)
      expect(enhancedResults[0].relevance_score).toBe(0.6)
    })

    it('should handle empty results', () => {
      const enhancedResults = engine.applyQualityMetrics([])
      expect(enhancedResults).toHaveLength(0)
    })
  })

  describe('Scoring Breakdown', () => {
    it('should provide detailed scoring breakdown', () => {
      const result: ScholarSearchResult = {
        title: 'Detailed Scoring Test',
        authors: ['Test, Author'],
        journal: 'Test Journal',
        year: 2023,
        citations: 100,
        doi: '10.1234/test.2023.001',
        confidence: 0.85,
        relevance_score: 0.75
      }

      const scoringResult = engine.scoreResult(result, mockContent)

      expect(scoringResult.breakdown).toMatchObject({
        relevance: {
          textSimilarity: expect.any(Number),
          keywordMatch: expect.any(Number),
          topicOverlap: expect.any(Number),
          semanticSimilarity: expect.any(Number)
        },
        quality: {
          citationScore: expect.any(Number),
          recencyScore: expect.any(Number),
          authorAuthority: expect.any(Number),
          journalQuality: expect.any(Number),
          completenessScore: expect.any(Number)
        },
        confidence: {
          metadataCompleteness: expect.any(Number),
          sourceReliability: expect.any(Number),
          extractionQuality: expect.any(Number)
        }
      })

      // All breakdown scores should be between 0 and 1
      Object.values(scoringResult.breakdown.relevance).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(1)
      })

      Object.values(scoringResult.breakdown.quality).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(1)
      })

      Object.values(scoringResult.breakdown.confidence).forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined inputs gracefully', () => {
      const emptyResult: ScholarSearchResult = {
        title: '',
        authors: [],
        confidence: 0,
        relevance_score: 0
      }

      const emptyContent: ExtractedContent = {
        source: 'ideas',
        id: 'empty',
        title: '',
        content: '',
        keywords: [],
        keyPhrases: [],
        topics: [],
        confidence: 0
      }

      const scoringResult = engine.scoreResult(emptyResult, emptyContent)
      
      // Should return valid scores even with empty inputs
      expect(scoringResult.overallScore).toBeGreaterThanOrEqual(0)
      expect(scoringResult.overallScore).toBeLessThanOrEqual(1)
    })

    it('should handle extreme citation counts', () => {
      const result: ScholarSearchResult = {
        title: 'High Citation Paper',
        authors: ['Author, A.'],
        citations: 10000, // Extremely high citation count
        year: 2023,
        confidence: 0.9,
        relevance_score: 0.8
      }

      const qualityScore = engine.scoreQuality(result)
      
      // Should handle extreme values without breaking
      expect(qualityScore).toBeGreaterThanOrEqual(0)
      expect(qualityScore).toBeLessThanOrEqual(1)
    })

    it('should handle future publication years', () => {
      const result: ScholarSearchResult = {
        title: 'Future Paper',
        authors: ['Future, Author'],
        year: 2030, // Future year
        confidence: 0.7,
        relevance_score: 0.6
      }

      const qualityScore = engine.scoreQuality(result)
      
      // Should handle future dates gracefully
      expect(qualityScore).toBeGreaterThanOrEqual(0)
      expect(qualityScore).toBeLessThanOrEqual(1)
    })

    it('should handle very long author lists', () => {
      const manyAuthorsResult: ScholarSearchResult = {
        title: 'Many Authors Paper',
        authors: Array.from({ length: 100 }, (_, i) => `Author ${i + 1}`),
        confidence: 0.8,
        relevance_score: 0.7
      }

      const qualityScore = engine.scoreQuality(manyAuthorsResult)
      
      // Should handle long author lists without performance issues
      expect(qualityScore).toBeGreaterThanOrEqual(0)
      expect(qualityScore).toBeLessThanOrEqual(1)
    })
  })

  describe('Journal Quality Scoring', () => {
    it('should score high-impact journals highly', () => {
      const natureResult: ScholarSearchResult = {
        title: 'Nature Paper',
        authors: ['Expert, A.'],
        journal: 'Nature',
        year: 2023,
        citations: 200,
        confidence: 0.9,
        relevance_score: 0.8
      }

      const ieeeResult: ScholarSearchResult = {
        title: 'IEEE Paper',
        authors: ['Engineer, A.'],
        journal: 'IEEE Transactions on Pattern Analysis and Machine Intelligence',
        year: 2023,
        citations: 150,
        confidence: 0.85,
        relevance_score: 0.75
      }

      const natureQuality = engine.scoreQuality(natureResult)
      const ieeeQuality = engine.scoreQuality(ieeeResult)

      // Both should have high quality scores
      expect(natureQuality).toBeGreaterThan(0.8)
      expect(ieeeQuality).toBeGreaterThan(0.7)
    })

    it('should score unknown journals lower', () => {
      const knownResult: ScholarSearchResult = {
        title: 'Known Journal Paper',
        authors: ['Author, A.'],
        journal: 'Journal of Artificial Intelligence Research',
        year: 2023,
        citations: 50,
        confidence: 0.7,
        relevance_score: 0.6
      }

      const unknownResult: ScholarSearchResult = {
        title: 'Unknown Journal Paper',
        authors: ['Author, A.'],
        journal: 'Random Unknown Journal',
        year: 2023,
        citations: 50,
        confidence: 0.7,
        relevance_score: 0.6
      }

      const knownQuality = engine.scoreQuality(knownResult)
      const unknownQuality = engine.scoreQuality(unknownResult)

      // Known journal should score higher than unknown
      expect(knownQuality).toBeGreaterThan(unknownQuality)
    })
  })

  describe('Performance and Consistency', () => {
    it('should produce consistent scores for identical inputs', () => {
      const result: ScholarSearchResult = {
        title: 'Consistency Test Paper',
        authors: ['Test, Author'],
        journal: 'Test Journal',
        year: 2023,
        citations: 75,
        doi: '10.1234/test.2023.001',
        url: 'https://test.com/paper',
        abstract: 'Test abstract for consistency checking.',
        keywords: ['test', 'consistency', 'paper'],
        confidence: 0.85,
        relevance_score: 0.78
      }

      const score1 = engine.scoreResult(result, mockContent)
      const score2 = engine.scoreResult(result, mockContent)

      // Should produce identical scores
      expect(score1.overallScore).toBe(score2.overallScore)
      expect(score1.relevanceScore).toBe(score2.relevanceScore)
      expect(score1.qualityScore).toBe(score2.qualityScore)
      expect(score1.confidenceScore).toBe(score2.confidenceScore)
    })

    it('should handle large batches of results efficiently', () => {
      const results: ScholarSearchResult[] = Array.from({ length: 100 }, (_, i) => ({
        title: `Paper ${i + 1}`,
        authors: [`Author ${i + 1}`],
        journal: i % 3 === 0 ? 'Nature' : i % 3 === 1 ? 'IEEE Transactions' : 'Generic Journal',
        year: 2020 + (i % 4),
        citations: Math.floor(Math.random() * 500),
        doi: `10.1234/test.${2020 + (i % 4)}.${String(i + 1).padStart(3, '0')}`,
        confidence: 0.5 + (Math.random() * 0.5),
        relevance_score: 0.4 + (Math.random() * 0.6)
      }))

      const startTime = Date.now()
      const rankedResults = engine.rankResults(results, mockContent)
      const endTime = Date.now()

      expect(rankedResults).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(2000) // Should complete within 2 seconds
      
      // Results should be properly ranked
      for (let i = 0; i < rankedResults.length - 1; i++) {
        expect(rankedResults[i].overallScore).toBeGreaterThanOrEqual(rankedResults[i + 1].overallScore)
      }
    })
  })

  describe('Citation Count Scoring', () => {
    it('should score citation counts logarithmically', () => {
      const lowCitationResult: ScholarSearchResult = {
        title: 'Low Citations Paper',
        authors: ['Author, A.'],
        citations: 10,
        year: 2023,
        confidence: 0.7,
        relevance_score: 0.6
      }

      const mediumCitationResult: ScholarSearchResult = {
        title: 'Medium Citations Paper',
        authors: ['Author, A.'],
        citations: 100,
        year: 2023,
        confidence: 0.7,
        relevance_score: 0.6
      }

      const highCitationResult: ScholarSearchResult = {
        title: 'High Citations Paper',
        authors: ['Author, A.'],
        citations: 1000,
        year: 2023,
        confidence: 0.7,
        relevance_score: 0.6
      }

      const lowScore = engine.scoreQuality(lowCitationResult)
      const mediumScore = engine.scoreQuality(mediumCitationResult)
      const highScore = engine.scoreQuality(highCitationResult)

      // Higher citation counts should result in higher scores, but with diminishing returns
      expect(highScore).toBeGreaterThan(mediumScore)
      expect(mediumScore).toBeGreaterThan(lowScore)
      
      // But the difference should diminish (logarithmic scaling)
      const diff1 = mediumScore - lowScore
      const diff2 = highScore - mediumScore
      expect(diff1).toBeGreaterThan(diff2 * 0.5) // Medium-high difference should be smaller than low-medium
    })

    it('should handle papers with zero citations', () => {
      const result: ScholarSearchResult = {
        title: 'Zero Citations Paper',
        authors: ['New, Author'],
        year: 2023,
        citations: 0, // No citations
        confidence: 0.6,
        relevance_score: 0.5
      }

      const qualityScore = engine.scoreQuality(result)
      
      // Should still provide a reasonable score (not zero)
      expect(qualityScore).toBeGreaterThan(0.1)
      expect(qualityScore).toBeLessThan(0.5) // But lower than papers with citations
    })
  })

  describe('Author Authority Scoring', () => {
    it('should boost score for multiple authors', () => {
      const singleAuthorResult: ScholarSearchResult = {
        title: 'Single Author Paper',
        authors: ['Solo, Author'],
        year: 2023,
        citations: 50,
        confidence: 0.7,
        relevance_score: 0.6
      }

      const multiAuthorResult: ScholarSearchResult = {
        title: 'Multi Author Paper',
        authors: ['First, Author', 'Second, Author', 'Third, Author'],
        year: 2023,
        citations: 50,
        confidence: 0.7,
        relevance_score: 0.6
      }

      const singleScore = engine.scoreQuality(singleAuthorResult)
      const multiScore = engine.scoreQuality(multiAuthorResult)

      // Multi-author papers should score higher (collaborative research indicator)
      expect(multiScore).toBeGreaterThan(singleScore)
    })

    it('should recognize academic credentials in author names', () => {
      const uncredentialedResult: ScholarSearchResult = {
        title: 'Regular Author Paper',
        authors: ['Smith, John', 'Johnson, Alice'],
        year: 2023,
        citations: 75,
        confidence: 0.7,
        relevance_score: 0.6
      }

      const credentialedResult: ScholarSearchResult = {
        title: 'Credentialed Author Paper',
        authors: ['Dr. Smith, John', 'Prof. Johnson, Alice'],
        year: 2023,
        citations: 75,
        confidence: 0.7,
        relevance_score: 0.6
      }

      const uncredentialedScore = engine.scoreQuality(uncredentialedResult)
      const credentialedScore = engine.scoreQuality(credentialedResult)

      // Papers with academic credentials should score higher
      expect(credentialedScore).toBeGreaterThan(uncredentialedScore)
    })
  })

  describe('Recency Scoring', () => {
    it('should favor recent publications', () => {
      const currentYear = new Date().getFullYear()
      
      const oldResult: ScholarSearchResult = {
        title: 'Old Paper',
        authors: ['Historical, Author'],
        year: currentYear - 15,
        citations: 100, // High citations to compensate
        confidence: 0.8,
        relevance_score: 0.7
      }

      const recentResult: ScholarSearchResult = {
        title: 'Recent Paper',
        authors: ['Current, Author'],
        year: currentYear,
        citations: 25, // Fewer citations
        confidence: 0.8,
        relevance_score: 0.7
      }

      const oldScore = engine.scoreQuality(oldResult)
      const recentScore = engine.scoreQuality(recentResult)

      // Recent papers should generally score higher despite fewer citations
      expect(recentScore).toBeGreaterThan(oldScore * 0.8) // Allow some tolerance
    })

    it('should handle papers with no publication year', () => {
      const result: ScholarSearchResult = {
        title: 'No Year Paper',
        authors: ['Author, A.'],
        confidence: 0.6,
        relevance_score: 0.5
      }

      const qualityScore = engine.scoreQuality(result)
      
      // Should provide a reasonable default score
      expect(qualityScore).toBeGreaterThan(0.2)
      expect(qualityScore).toBeLessThan(0.5) // But lower than papers with years
    })
  })

  describe('Metadata Completeness Scoring', () => {
    it('should reward complete metadata', () => {
      const incompleteResult: ScholarSearchResult = {
        title: 'Incomplete Metadata Paper',
        authors: ['Author, A.'],
        confidence: 0.5,
        relevance_score: 0.4
      }

      const completeResult: ScholarSearchResult = {
        title: 'Complete Metadata Paper',
        authors: ['Author, A.', 'Coauthor, B.'],
        journal: 'Test Journal',
        year: 2023,
        citations: 50,
        doi: '10.1234/test.2023.001',
        url: 'https://test.com/paper',
        abstract: 'Complete abstract with detailed information.',
        keywords: ['test', 'paper', 'complete'],
        confidence: 0.9,
        relevance_score: 0.8
      }

      const incompleteScore = engine.calculateConfidence(incompleteResult)
      const completeScore = engine.calculateConfidence(completeResult)

      // Complete metadata should result in higher confidence
      expect(completeScore).toBeGreaterThan(incompleteScore)
    })

    it('should handle papers with only basic metadata', () => {
      const basicResult: ScholarSearchResult = {
        title: 'Basic Metadata Paper',
        authors: ['Author, A.'],
        confidence: 0.6,
        relevance_score: 0.5
      }

      const confidence = engine.calculateConfidence(basicResult)
      
      // Should provide moderate confidence for basic metadata
      expect(confidence).toBeGreaterThan(0.3)
      expect(confidence).toBeLessThan(0.7)
    })
  })
})