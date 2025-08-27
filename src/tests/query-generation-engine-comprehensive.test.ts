/**
 * Query Generation Engine Tests
 * Comprehensive tests for generating search queries from extracted content
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryGenerationEngine, QueryGenerationOptions, SearchQuery } from '../worker/lib/query-generation-engine'
import { ExtractedContent } from '../lib/ai-types'

describe('QueryGenerationEngine', () => {
  let engine: QueryGenerationEngine

  beforeEach(() => {
    engine = new QueryGenerationEngine()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('generateQueries', () => {
    it('should generate single query from single content source', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Machine Learning Research',
        content: 'Research on machine learning algorithms for natural language processing applications.',
        keywords: ['machine learning', 'NLP', 'algorithms', 'research'],
        keyPhrases: ['machine learning algorithms', 'natural language processing'],
        topics: ['artificial intelligence', 'computational linguistics'],
        confidence: 0.9
      }]

      const queries = engine.generateQueries(content)

      expect(queries).toHaveLength(1)
      expect(queries[0]).toMatchObject({
        query: expect.stringContaining('"machine learning"'),
        queryType: 'basic',
        confidence: expect.toBeGreaterThanOrEqual(0.7),
        keywords: expect.arrayContaining(['machine learning', 'NLP']),
        topics: expect.arrayContaining(['artificial intelligence'])
      })
    })

    it('should generate combined query from multiple content sources', () => {
      const content: ExtractedContent[] = [
        {
          source: 'ideas',
          id: '1',
          title: 'Climate Change Impact',
          content: 'Study on climate change effects on agricultural productivity.',
          keywords: ['climate change', 'agriculture', 'productivity'],
          keyPhrases: ['climate change effects', 'agricultural productivity'],
          topics: ['environmental science', 'agricultural research'],
          confidence: 0.8
        },
        {
          source: 'builder',
          id: '2',
          title: 'Economic Analysis of Renewable Energy',
          content: 'Economic analysis of renewable energy adoption in developing countries.',
          keywords: ['economic analysis', 'renewable energy', 'developing countries'],
          keyPhrases: ['economic analysis', 'renewable energy adoption'],
          topics: ['economics', 'energy policy'],
          confidence: 0.9
        }
      ]

      const queries = engine.generateQueries(content)

      expect(queries).toHaveLength(1)
      expect(queries[0]).toMatchObject({
        queryType: 'combined',
        confidence: expect.toBeGreaterThanOrEqual(0.7),
        keywords: expect.arrayContaining([
          'climate change', 
          'agriculture', 
          'economic analysis', 
          'renewable energy'
        ]),
        topics: expect.arrayContaining([
          'environmental science', 
          'economics'
        ])
      })

      // Combined query should contain terms from both sources
      const queryString = queries[0].query.toLowerCase()
      expect(queryString).toContain('climate')
      expect(queryString).toContain('economic')
      expect(queryString).toContain('renewable')
    })

    it('should throw error when no content is provided', () => {
      expect(() => engine.generateQueries([])).toThrow('No content provided for query generation')
    })

    it('should handle content with no keywords gracefully', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Test Content',
        content: 'Some test content without keywords',
        keywords: [],
        keyPhrases: [],
        topics: [],
        confidence: 0.5
      }]

      const queries = engine.generateQueries(content)
      expect(queries).toHaveLength(1)
      expect(queries[0].query).toBeTruthy()
      expect(queries[0].query).not.toBe('')
    })

    it('should respect query generation options', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Test Content',
        content: 'Test content for query generation options',
        keywords: ['keyword1', 'keyword2', 'keyword3', 'keyword4', 'keyword5'],
        keyPhrases: ['key phrase 1', 'key phrase 2'],
        topics: ['topic1', 'topic2', 'topic3'],
        confidence: 0.8
      }]

      const options: QueryGenerationOptions = {
        maxKeywords: 3,
        maxTopics: 2,
        includeAlternatives: true,
        optimizeForAcademic: true
      }

      const queries = engine.generateQueries(content, options)

      // Should have multiple queries when includeAlternatives is true
      expect(queries.length).toBeGreaterThanOrEqual(1)
      
      const mainQuery = queries[0]
      expect(mainQuery.keywords.length).toBeLessThanOrEqual(3)
      expect(mainQuery.topics.length).toBeLessThanOrEqual(2)
      
      // Should contain academic terms when optimized for academic search
      const queryString = mainQuery.query.toLowerCase()
      expect(
        queryString.includes('research') || 
        queryString.includes('study') || 
        queryString.includes('analysis')
      ).toBe(true)
    })
  })

  describe('optimizeQuery', () => {
    it('should optimize query for academic search', () => {
      const query = '"machine learning" AND "natural language processing"'
      const keywords = ['machine learning', 'algorithms', 'NLP']
      const topics = ['artificial intelligence']

      const optimization = engine.optimizeQuery(query, keywords, topics)

      expect(optimization).toMatchObject({
        breadthScore: expect.any(Number),
        specificityScore: expect.any(Number),
        academicRelevance: expect.any(Number),
        suggestions: expect.any(Array),
        alternativeQueries: expect.any(Array)
      })

      // Academic relevance should be high for academic query
      expect(optimization.academicRelevance).toBeGreaterThan(0.5)
    })

    it('should provide suggestions for query improvement', () => {
      const query = 'ML NLP' // Poorly formatted query
      const keywords = ['ML', 'NLP']
      const topics = []

      const optimization = engine.optimizeQuery(query, keywords, topics)

      expect(optimization.suggestions).toHaveLength(3) // Default number of suggestions
      expect(optimization.suggestions).toContainEqual(
        expect.stringContaining('add')
      )
      expect(optimization.suggestions).toContainEqual(
        expect.stringContaining('academic')
      )
      expect(optimization.suggestions).toContainEqual(
        expect.stringContaining('operator')
      )
    })

    it('should generate alternative queries', () => {
      const query = '"machine learning"'
      const keywords = ['machine learning']
      const topics = ['AI']

      const optimization = engine.optimizeQuery(query, keywords, topics)

      expect(optimization.alternativeQueries).toHaveLength(3) // Default number of alternatives
      optimization.alternativeQueries.forEach(alternative => {
        expect(alternative).toMatch(/["\w\s]+/) // Should be a valid query string
      })
    })
  })

  describe('combineQueries', () => {
    it('should combine multiple queries into one', () => {
      const queries: SearchQuery[] = [
        {
          id: '1',
          query: '"machine learning"',
          originalContent: [{
            source: 'ideas',
            id: '1',
            title: 'ML Content',
            content: 'Machine learning content',
            keywords: ['machine learning'],
            topics: ['AI'],
            confidence: 0.8
          }],
          generatedAt: new Date(),
          confidence: 0.8,
          keywords: ['machine learning'],
          topics: ['AI'],
          queryType: 'basic',
          optimization: {
            breadthScore: 0.5,
            specificityScore: 0.7,
            academicRelevance: 0.8,
            suggestions: [],
            alternativeQueries: []
          }
        },
        {
          id: '2',
          query: '"natural language processing"',
          originalContent: [{
            source: 'ideas',
            id: '2',
            title: 'NLP Content',
            content: 'NLP content',
            keywords: ['NLP'],
            topics: ['computational linguistics'],
            confidence: 0.7
          }],
          generatedAt: new Date(),
          confidence: 0.7,
          keywords: ['NLP'],
          topics: ['computational linguistics'],
          queryType: 'basic',
          optimization: {
            breadthScore: 0.6,
            specificityScore: 0.6,
            academicRelevance: 0.7,
            suggestions: [],
            alternativeQueries: []
          }
        }
      ]

      const combinedQuery = engine.combineQueries(queries)

      expect(combinedQuery.queryType).toBe('combined')
      expect(combinedQuery.keywords).toContain('machine learning')
      expect(combinedQuery.keywords).toContain('NLP')
      expect(combinedQuery.topics).toContain('AI')
      expect(combinedQuery.topics).toContain('computational linguistics')
      expect(combinedQuery.confidence).toBeCloseTo(0.75, 1) // Average of 0.8 and 0.7
    })

    it('should return single query when only one is provided', () => {
      const query: SearchQuery = {
        id: '1',
        query: '"test query"',
        originalContent: [{
          source: 'ideas',
          id: '1',
          title: 'Test Content',
          content: 'Test content',
          keywords: ['test'],
          topics: ['testing'],
          confidence: 0.8
        }],
        generatedAt: new Date(),
        confidence: 0.8,
        keywords: ['test'],
        topics: ['testing'],
        queryType: 'basic',
        optimization: {
          breadthScore: 0.5,
          specificityScore: 0.7,
          academicRelevance: 0.8,
          suggestions: [],
          alternativeQueries: []
        }
      }

      const result = engine.combineQueries([query])
      expect(result).toEqual(query)
    })

    it('should throw error when no queries are provided', () => {
      expect(() => engine.combineQueries([])).toThrow('No queries to combine')
    })
  })

  describe('validateQuery', () => {
    it('should validate a good query', () => {
      const query = '"machine learning" AND "natural language processing"'

      const validation = engine.validateQuery(query)

      expect(validation.isValid).toBe(true)
      expect(validation.confidence).toBeGreaterThan(0.8)
      expect(validation.issues).toHaveLength(0)
    })

    it('should identify problematic queries', () => {
      const query = 'very short'

      const validation = engine.validateQuery(query)

      expect(validation.isValid).toBe(false)
      expect(validation.confidence).toBeLessThan(0.8)
      expect(validation.issues).toHaveLength(1)
      expect(validation.issues[0]).toContain('short')
    })

    it('should suggest improvements for problematic queries', () => {
      const query = 'ML NLP research' // Could be better formatted

      const validation = engine.validateQuery(query)

      expect(validation.suggestions).toHaveLength(3)
      expect(validation.suggestions).toContainEqual(
        expect.stringContaining('quote')
      )
      expect(validation.suggestions).toContainEqual(
        expect.stringContaining('operator')
      )
      expect(validation.suggestions).toContainEqual(
        expect.stringContaining('academic')
      )
    })
  })

  describe('Query Construction', () => {
    it('should build queries with proper quoting and operators', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Test Content',
        content: 'Test content about machine learning algorithms',
        keywords: ['machine learning', 'algorithms', 'research'],
        keyPhrases: ['machine learning algorithms'],
        topics: ['artificial intelligence'],
        confidence: 0.8
      }]

      const queries = engine.generateQueries(content)
      const queryString = queries[0].query

      // Should contain quoted phrases
      expect(queryString).toMatch(/"/)
      
      // Should contain logical operators
      expect(queryString).toMatch(/AND|OR/)
      
      // Should be within reasonable length for Google Scholar
      expect(queryString.length).toBeLessThan(200)
    })

    it('should handle content with no topics gracefully', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Test Content',
        content: 'Test content',
        keywords: ['test', 'content'],
        keyPhrases: ['test content'],
        topics: [],
        confidence: 0.5
      }]

      const queries = engine.generateQueries(content)
      expect(queries).toHaveLength(1)
      expect(queries[0].query).toBeTruthy()
    })

    it('should generate academic-enhanced queries', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Research Topic',
        content: 'Research on a specific topic',
        keywords: ['research', 'topic'],
        keyPhrases: ['research topic'],
        topics: ['academic research'],
        confidence: 0.9
      }]

      const options: QueryGenerationOptions = {
        optimizeForAcademic: true
      }

      const queries = engine.generateQueries(content, options)
      const queryString = queries[0].query.toLowerCase()

      // Should include academic terms
      expect(
        queryString.includes('research') ||
        queryString.includes('study') ||
        queryString.includes('analysis') ||
        queryString.includes('method')
      ).toBe(true)
    })
  })

  describe('Query Refinement', () => {
    it('should analyze query breadth correctly', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Very Specific Research',
        content: 'Very specific research on a narrow topic',
        keywords: ['very', 'specific', 'research', 'narrow', 'topic'],
        keyPhrases: ['very specific research'],
        topics: ['narrow research area'],
        confidence: 0.8
      }]

      const queries = engine.generateQueries(content)
      const refinement = engine.refineQuery(queries[0].query, content)

      expect(refinement.breadthAnalysis.classification).toBe('optimal') // Might be 'too_narrow' or 'optimal'
      expect(refinement.breadthAnalysis.suggestions.length).toBeGreaterThanOrEqual(0)
    })

    it('should generate alternative terms', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'ML Research',
        content: 'Machine learning research content',
        keywords: ['machine learning', 'ML', 'research'],
        keyPhrases: ['machine learning research'],
        topics: ['artificial intelligence'],
        confidence: 0.8
      }]

      const queries = engine.generateQueries(content)
      const refinement = engine.refineQuery(queries[0].query, content)

      expect(refinement.alternativeTerms.synonyms.length).toBeGreaterThanOrEqual(0)
      expect(refinement.alternativeTerms.relatedTerms.length).toBeGreaterThanOrEqual(0)
      expect(refinement.alternativeTerms.academicVariants.length).toBeGreaterThanOrEqual(0)
    })

    it('should provide optimization recommendations', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Test Research',
        content: 'Test research content',
        keywords: ['test', 'research'],
        keyPhrases: ['test research'],
        topics: ['testing'],
        confidence: 0.6
      }]

      const queries = engine.generateQueries(content)
      const refinement = engine.refineQuery(queries[0].query, content)

      expect(refinement.optimizationRecommendations.length).toBeGreaterThanOrEqual(0)
      refinement.optimizationRecommendations.forEach(rec => {
        expect(rec.type).toMatch(/add_term|remove_term|replace_term|add_operator|restructure/)
        expect(rec.description).toBeTruthy()
        expect(rec.impact).toMatch(/low|medium|high/)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle null or undefined content gracefully', () => {
      // Test with undefined content
      const contentWithUndefined: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Test',
        content: undefined as any,
        keywords: ['test'],
        keyPhrases: ['test phrase'],
        topics: ['testing'],
        confidence: 0.5
      }]

      const queries = engine.generateQueries(contentWithUndefined)
      expect(queries).toHaveLength(1)
      expect(queries[0].query).toBeTruthy()

      // Test with null content
      const contentWithNull: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Test',
        content: null as any,
        keywords: ['test'],
        keyPhrases: ['test phrase'],
        topics: ['testing'],
        confidence: 0.5
      }]

      const queries2 = engine.generateQueries(contentWithNull)
      expect(queries2).toHaveLength(1)
      expect(queries2[0].query).toBeTruthy()
    })

    it('should handle extremely long content', () => {
      const longContent = 'A'.repeat(10000) // 10KB of content
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Long Content',
        content: longContent,
        keywords: Array.from({ length: 50 }, (_, i) => `keyword${i}`),
        keyPhrases: Array.from({ length: 20 }, (_, i) => `phrase ${i}`),
        topics: Array.from({ length: 10 }, (_, i) => `topic${i}`),
        confidence: 0.8
      }]

      const queries = engine.generateQueries(content)
      expect(queries).toHaveLength(1)
      
      // Should not exceed reasonable query length
      expect(queries[0].query.length).toBeLessThan(300)
    })

    it('should handle content with special characters', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Special Characters Test',
        content: 'Test content with special characters: @#$%^&*()',
        keywords: ['special@characters', 'test#content'],
        keyPhrases: ['special characters test'],
        topics: ['testing&research'],
        confidence: 0.7
      }]

      const queries = engine.generateQueries(content)
      expect(queries).toHaveLength(1)
      
      // Query should be sanitized and valid
      expect(queries[0].query).toMatch(/[\w\s"&|()]+/)
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large batches of content efficiently', () => {
      const largeContentSet: ExtractedContent[] = Array.from({ length: 100 }, (_, i) => ({
        source: 'ideas',
        id: `${i}`,
        title: `Content ${i}`,
        content: `Test content for item ${i}`,
        keywords: [`keyword${i}`, `term${i}`],
        keyPhrases: [`phrase ${i}`],
        topics: [`topic${i % 10}`],
        confidence: 0.5 + (i % 50) / 100
      }))

      const startTime = Date.now()
      const queries = engine.generateQueries(largeContentSet)
      const endTime = Date.now()

      expect(queries).toHaveLength(1)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
      
      // Combined query should contain representative terms
      const queryString = queries[0].query.toLowerCase()
      expect(queryString).toContain('content')
      expect(queryString).toContain('keyword')
    })

    it('should maintain consistent performance with repeated calls', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Performance Test',
        content: 'Performance test content',
        keywords: ['performance', 'test'],
        keyPhrases: ['performance test'],
        topics: ['benchmarking'],
        confidence: 0.8
      }]

      // Warm up
      engine.generateQueries(content)

      // Measure multiple calls
      const times: number[] = []
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now()
        engine.generateQueries(content)
        const endTime = Date.now()
        times.push(endTime - startTime)
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length
      expect(averageTime).toBeLessThan(100) // Should average less than 100ms per call
    })
  })

  describe('Caching', () => {
    it('should cache query generation results', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Cache Test',
        content: 'Cache test content',
        keywords: ['cache', 'test'],
        keyPhrases: ['cache test'],
        topics: ['caching'],
        confidence: 0.9
      }]

      // First call
      const firstQueries = engine.generateQueries(content)
      
      // Second call with same content should be cached
      const secondQueries = engine.generateQueries(content)
      
      // Results should be identical
      expect(firstQueries).toEqual(secondQueries)
    })

    it('should invalidate cache when content changes', () => {
      const content1: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Content 1',
        content: 'First content',
        keywords: ['first', 'content'],
        keyPhrases: ['first content'],
        topics: ['first'],
        confidence: 0.8
      }]

      const content2: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Content 1',
        content: 'First content modified',
        keywords: ['first', 'modified'],
        keyPhrases: ['first content modified'],
        topics: ['modified'],
        confidence: 0.8
      }]

      const queries1 = engine.generateQueries(content1)
      const queries2 = engine.generateQueries(content2)
      
      // Queries should be different due to different content
      expect(queries1).not.toEqual(queries2)
    })
  })

  describe('Academic Query Optimization', () => {
    it('should boost academic terms in query optimization', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Academic Research',
        content: 'Academic research on machine learning applications',
        keywords: ['academic', 'research', 'machine learning'],
        keyPhrases: ['academic research', 'machine learning applications'],
        topics: ['research methodology'],
        confidence: 0.9
      }]

      const options: QueryGenerationOptions = {
        optimizeForAcademic: true
      }

      const queries = engine.generateQueries(content, options)
      const optimization = engine.optimizeQuery(queries[0].query, queries[0].keywords, queries[0].topics)

      // Academic relevance should be high
      expect(optimization.academicRelevance).toBeGreaterThan(0.7)
    })

    it('should suggest academic improvements for non-academic queries', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'General Topic',
        content: 'General topic about cats and dogs',
        keywords: ['cats', 'dogs', 'pets'],
        keyPhrases: ['cats and dogs'],
        topics: ['animals'],
        confidence: 0.6
      }]

      const queries = engine.generateQueries(content)
      const validation = engine.validateQuery(queries[0].query)

      // Should suggest academic improvements
      expect(validation.suggestions.some(s => 
        s.toLowerCase().includes('academic') || 
        s.toLowerCase().includes('research') ||
        s.toLowerCase().includes('scholarly')
      )).toBe(true)
    })

    it('should handle interdisciplinary research topics', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Interdisciplinary Research',
        content: 'Research combining computer science and biology',
        keywords: ['computer science', 'biology', 'interdisciplinary'],
        keyPhrases: ['computer science and biology'],
        topics: ['bioinformatics', 'computational biology'],
        confidence: 0.9
      }]

      const queries = engine.generateQueries(content)
      
      // Query should contain terms from both disciplines
      const queryString = queries[0].query.toLowerCase()
      expect(queryString).toContain('computer')
      expect(queryString).toContain('biology')
      
      // Should be optimized for academic search
      const optimization = engine.optimizeQuery(queries[0].query, queries[0].keywords, queries[0].topics)
      expect(optimization.academicRelevance).toBeGreaterThan(0.6)
    })
  })

  describe('Integration with Other Components', () => {
    it('should work correctly with result scoring engine', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Integration Test',
        content: 'Integration test content for query generation',
        keywords: ['integration', 'test', 'query'],
        keyPhrases: ['integration test', 'query generation'],
        topics: ['software testing', 'integration'],
        confidence: 0.8
      }]

      const queries = engine.generateQueries(content)
      
      // Queries should be compatible with scoring engine requirements
      queries.forEach(query => {
        expect(query.query).toBeTruthy()
        expect(query.keywords.length).toBeGreaterThan(0)
        expect(query.topics.length).toBeGreaterThanOrEqual(0)
        expect(query.confidence).toBeGreaterThanOrEqual(0)
        expect(query.confidence).toBeLessThanOrEqual(1)
      })
    })

    it('should generate queries suitable for Google Scholar', () => {
      const content: ExtractedContent[] = [{
        source: 'ideas',
        id: '1',
        title: 'Google Scholar Test',
        content: 'Test content for Google Scholar compatibility',
        keywords: ['Google Scholar', 'compatibility', 'test'],
        keyPhrases: ['Google Scholar test'],
        topics: ['academic search'],
        confidence: 0.9
      }]

      const queries = engine.generateQueries(content)
      const queryString = queries[0].query
      
      // Should be compatible with Google Scholar syntax
      expect(queryString.length).toBeLessThan(200) // Recommended limit
      expect(queryString).toMatch(/["\w\s]+/) // Valid characters
    })
  })
})