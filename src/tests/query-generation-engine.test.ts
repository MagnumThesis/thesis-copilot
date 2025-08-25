import { describe, it, expect, beforeEach } from 'vitest';
import { QueryGenerationEngine, SearchQuery, QueryGenerationOptions } from '../worker/lib/query-generation-engine';
import { ExtractedContent } from '../lib/ai-types';

describe('QueryGenerationEngine', () => {
  let engine: QueryGenerationEngine;
  let mockContent: ExtractedContent;
  let mockMultipleContent: ExtractedContent[];

  beforeEach(() => {
    engine = new QueryGenerationEngine();
    
    mockContent = {
      source: 'ideas',
      content: 'Machine learning algorithms for natural language processing research',
      keywords: ['machine learning', 'algorithms', 'natural language processing', 'research', 'neural networks'],
      keyPhrases: ['machine learning algorithms', 'natural language processing', 'deep learning'],
      topics: ['artificial intelligence', 'computational linguistics', 'data science'],
      confidence: 0.8
    };

    mockMultipleContent = [
      {
        source: 'ideas',
        content: 'Climate change impact on agriculture',
        keywords: ['climate change', 'agriculture', 'impact', 'sustainability', 'farming'],
        keyPhrases: ['climate change impact', 'sustainable agriculture'],
        topics: ['environmental science', 'agricultural research'],
        confidence: 0.7
      },
      {
        source: 'builder',
        content: 'Economic analysis of renewable energy',
        keywords: ['economic analysis', 'renewable energy', 'cost-benefit', 'policy'],
        keyPhrases: ['renewable energy economics', 'policy analysis'],
        topics: ['economics', 'energy policy', 'sustainability'],
        confidence: 0.9
      }
    ];
  });

  describe('generateQueries', () => {
    it('should generate a single query from single content source', () => {
      const queries = engine.generateQueries([mockContent]);
      
      expect(queries).toHaveLength(1);
      expect(queries[0].queryType).toBe('basic');
      expect(queries[0].originalContent).toHaveLength(1);
      expect(queries[0].query).toContain('machine learning');
      expect(queries[0].confidence).toBeGreaterThan(0);
    });

    it('should generate combined query from multiple content sources', () => {
      const queries = engine.generateQueries(mockMultipleContent);
      
      expect(queries).toHaveLength(1);
      expect(queries[0].queryType).toBe('combined');
      expect(queries[0].originalContent).toHaveLength(2);
      expect(queries[0].keywords.length).toBeGreaterThan(0);
      expect(queries[0].topics.length).toBeGreaterThan(0);
    });

    it('should generate alternative queries when requested', () => {
      const options: QueryGenerationOptions = {
        includeAlternatives: true
      };
      
      const queries = engine.generateQueries(mockMultipleContent, options);
      
      expect(queries.length).toBeGreaterThan(1);
      expect(queries[0].queryType).toBe('combined');
      expect(queries.slice(1).every(q => q.queryType === 'basic')).toBe(true);
    });

    it('should throw error when no content provided', () => {
      expect(() => engine.generateQueries([])).toThrow('No content provided for query generation');
    });

    it('should respect maxKeywords option', () => {
      const options: QueryGenerationOptions = {
        maxKeywords: 3
      };
      
      const queries = engine.generateQueries([mockContent], options);
      
      expect(queries[0].keywords.length).toBeLessThanOrEqual(3);
    });

    it('should respect maxTopics option', () => {
      const options: QueryGenerationOptions = {
        maxTopics: 2
      };
      
      const queries = engine.generateQueries([mockContent], options);
      
      expect(queries[0].topics.length).toBeLessThanOrEqual(2);
    });
  });

  describe('optimizeQuery', () => {
    it('should return optimization analysis', () => {
      const query = '"machine learning" AND "natural language processing"';
      const keywords = ['machine learning', 'algorithms'];
      const topics = ['artificial intelligence'];
      
      const optimization = engine.optimizeQuery(query, keywords, topics);
      
      expect(optimization).toHaveProperty('breadthScore');
      expect(optimization).toHaveProperty('specificityScore');
      expect(optimization).toHaveProperty('academicRelevance');
      expect(optimization).toHaveProperty('suggestions');
      expect(optimization).toHaveProperty('alternativeQueries');
      
      expect(optimization.breadthScore).toBeGreaterThanOrEqual(0);
      expect(optimization.breadthScore).toBeLessThanOrEqual(1);
      expect(optimization.specificityScore).toBeGreaterThanOrEqual(0);
      expect(optimization.specificityScore).toBeLessThanOrEqual(1);
      expect(optimization.academicRelevance).toBeGreaterThanOrEqual(0);
      expect(optimization.academicRelevance).toBeLessThanOrEqual(1);
    });

    it('should provide suggestions for narrow queries', () => {
      const query = '"very specific technical term"';
      const keywords = ['specific'];
      const topics = [];
      
      const optimization = engine.optimizeQuery(query, keywords, topics);
      
      expect(optimization.suggestions.some(s => s.includes('narrow'))).toBe(true);
    });

    it('should provide suggestions for broad queries', () => {
      const query = 'research study analysis method approach framework system process development implementation evaluation assessment investigation examination exploration';
      const keywords = ['research', 'study', 'analysis', 'method', 'approach', 'framework', 'system', 'process', 'development'];
      const topics = ['general', 'broad', 'comprehensive'];
      
      const optimization = engine.optimizeQuery(query, keywords, topics);
      
      expect(optimization.suggestions.some(s => s.includes('broad'))).toBe(true);
    });

    it('should generate alternative queries', () => {
      const query = '"machine learning" AND "algorithms"';
      const keywords = ['machine learning', 'algorithms', 'neural networks'];
      const topics = ['artificial intelligence'];
      
      const optimization = engine.optimizeQuery(query, keywords, topics);
      
      expect(optimization.alternativeQueries.length).toBeGreaterThan(0);
      expect(optimization.alternativeQueries.every(alt => typeof alt === 'string')).toBe(true);
    });
  });

  describe('combineQueries', () => {
    it('should combine multiple queries into one', () => {
      const query1: SearchQuery = {
        id: 'q1',
        query: '"machine learning" AND "algorithms"',
        originalContent: [mockContent],
        generatedAt: new Date(),
        confidence: 0.8,
        keywords: ['machine learning', 'algorithms'],
        topics: ['artificial intelligence'],
        queryType: 'basic',
        optimization: {
          breadthScore: 0.5,
          specificityScore: 0.7,
          academicRelevance: 0.6,
          suggestions: [],
          alternativeQueries: []
        }
      };

      const query2: SearchQuery = {
        id: 'q2',
        query: '"climate change" AND "agriculture"',
        originalContent: [mockMultipleContent[0]],
        generatedAt: new Date(),
        confidence: 0.7,
        keywords: ['climate change', 'agriculture'],
        topics: ['environmental science'],
        queryType: 'basic',
        optimization: {
          breadthScore: 0.4,
          specificityScore: 0.6,
          academicRelevance: 0.8,
          suggestions: [],
          alternativeQueries: []
        }
      };

      const combined = engine.combineQueries([query1, query2]);
      
      expect(combined.queryType).toBe('combined');
      expect(combined.originalContent).toHaveLength(2);
      expect(combined.keywords.length).toBeGreaterThan(0);
      expect(combined.topics.length).toBeGreaterThan(0);
      expect(combined.confidence).toBeCloseTo(0.75, 1);
    });

    it('should return single query when only one provided', () => {
      const query: SearchQuery = {
        id: 'q1',
        query: '"test query"',
        originalContent: [mockContent],
        generatedAt: new Date(),
        confidence: 0.8,
        keywords: ['test'],
        topics: ['testing'],
        queryType: 'basic',
        optimization: {
          breadthScore: 0.5,
          specificityScore: 0.7,
          academicRelevance: 0.6,
          suggestions: [],
          alternativeQueries: []
        }
      };

      const result = engine.combineQueries([query]);
      
      expect(result).toEqual(query);
    });

    it('should throw error when no queries provided', () => {
      expect(() => engine.combineQueries([])).toThrow('No queries to combine');
    });
  });

  describe('validateQuery', () => {
    it('should validate a good query', () => {
      const query = '"machine learning" AND "natural language processing" AND research';
      
      const validation = engine.validateQuery(query);
      
      expect(validation.isValid).toBe(true);
      expect(validation.confidence).toBeGreaterThan(0.5);
      expect(validation.issues).toHaveLength(0);
    });

    it('should identify short queries as problematic', () => {
      const query = 'ML';
      
      const validation = engine.validateQuery(query);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('too short'))).toBe(true);
      expect(validation.confidence).toBeLessThan(0.8);
    });

    it('should identify long queries as problematic', () => {
      const query = 'a'.repeat(250);
      
      const validation = engine.validateQuery(query);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('too long'))).toBe(true);
      expect(validation.confidence).toBeLessThan(0.9);
    });

    it('should suggest academic terms for non-academic queries', () => {
      const query = 'cats and dogs playing together';
      
      const validation = engine.validateQuery(query);
      
      expect(validation.suggestions.some(s => s.includes('academic'))).toBe(true);
    });

    it('should suggest search operators for simple queries', () => {
      const query = 'machine learning algorithms';
      
      const validation = engine.validateQuery(query);
      
      expect(validation.suggestions.some(s => s.includes('operators'))).toBe(true);
    });
  });

  describe('query building and optimization', () => {
    it('should build proper query strings with quotes and operators', () => {
      const queries = engine.generateQueries([mockContent]);
      const query = queries[0].query;
      
      expect(query).toMatch(/"/); // Should contain quotes
      expect(query).toMatch(/AND|OR/); // Should contain operators
    });

    it('should handle content with no keywords gracefully', () => {
      const emptyContent: ExtractedContent = {
        source: 'ideas',
        content: 'Some content',
        keywords: [],
        keyPhrases: [],
        topics: ['general topic'],
        confidence: 0.5
      };

      const queries = engine.generateQueries([emptyContent]);
      
      expect(queries).toHaveLength(1);
      expect(queries[0].query).toBeTruthy();
      expect(queries[0].topics.length).toBeGreaterThan(0);
    });

    it('should handle content with no topics gracefully', () => {
      const noTopicsContent: ExtractedContent = {
        source: 'ideas',
        content: 'Some content',
        keywords: ['keyword1', 'keyword2'],
        keyPhrases: ['key phrase'],
        topics: [],
        confidence: 0.5
      };

      const queries = engine.generateQueries([noTopicsContent]);
      
      expect(queries).toHaveLength(1);
      expect(queries[0].query).toBeTruthy();
      expect(queries[0].keywords.length).toBeGreaterThan(0);
    });

    it('should throw error when no keywords or topics available', () => {
      const emptyContent: ExtractedContent = {
        source: 'ideas',
        content: 'Some content',
        keywords: [],
        keyPhrases: [],
        topics: [],
        confidence: 0.5
      };

      expect(() => engine.generateQueries([emptyContent])).toThrow();
    });
  });

  describe('combine strategies', () => {
    it('should use union strategy correctly', () => {
      const options: QueryGenerationOptions = {
        combineStrategy: 'union',
        maxKeywords: 5
      };

      const queries = engine.generateQueries(mockMultipleContent, options);
      
      expect(queries[0].keywords.length).toBeLessThanOrEqual(5);
      expect(queries[0].keywords.length).toBeGreaterThan(0);
    });

    it('should use intersection strategy correctly', () => {
      const commonContent: ExtractedContent[] = [
        {
          source: 'ideas',
          keywords: ['research', 'analysis', 'method'],
          topics: ['science'],
          confidence: 0.8
        },
        {
          source: 'builder',
          keywords: ['research', 'study', 'method'],
          topics: ['science'],
          confidence: 0.7
        }
      ];

      const options: QueryGenerationOptions = {
        combineStrategy: 'intersection'
      };

      const queries = engine.generateQueries(commonContent, options);
      
      expect(queries[0].keywords).toContain('research');
      expect(queries[0].keywords).toContain('method');
      expect(queries[0].topics).toContain('science');
    });

    it('should use weighted strategy correctly', () => {
      const options: QueryGenerationOptions = {
        combineStrategy: 'weighted'
      };

      const queries = engine.generateQueries(mockMultipleContent, options);
      
      // Higher confidence content should have more influence
      expect(queries[0].keywords.length).toBeGreaterThan(0);
      expect(queries[0].topics.length).toBeGreaterThan(0);
    });
  });

  describe('academic optimization', () => {
    it('should boost academic relevance for academic terms', () => {
      const academicContent: ExtractedContent = {
        source: 'ideas',
        keywords: ['research', 'methodology', 'analysis', 'empirical'],
        topics: ['systematic review', 'meta-analysis'],
        confidence: 0.8
      };

      const queries = engine.generateQueries([academicContent]);
      const optimization = queries[0].optimization;
      
      expect(optimization.academicRelevance).toBeGreaterThan(0.7);
    });

    it('should suggest academic terms for non-academic content', () => {
      const nonAcademicContent: ExtractedContent = {
        source: 'ideas',
        keywords: ['cats', 'dogs', 'pets'],
        topics: ['animals', 'companions'],
        confidence: 0.8
      };

      const queries = engine.generateQueries([nonAcademicContent]);
      const optimization = queries[0].optimization;
      
      expect(optimization.suggestions.some(s => s.includes('academic'))).toBe(true);
    });

    it('should optimize queries for Google Scholar format', () => {
      const queries = engine.generateQueries([mockContent]);
      const query = queries[0].query;
      
      // Should have proper quoting and length limits
      expect(query.length).toBeLessThan(200);
      expect(query).toMatch(/"/); // Should contain quotes
    });
  });
});