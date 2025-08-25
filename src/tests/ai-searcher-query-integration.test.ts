import { describe, it, expect, beforeEach } from 'vitest';
import { AISearcherAPIHandler } from '../worker/handlers/ai-searcher-api';
import { QueryGenerationEngine } from '../worker/lib/query-generation-engine';
import { ContentExtractionEngine } from '../worker/lib/content-extraction-engine';

// Mock Hono context
const createMockContext = (body: any, query: Record<string, string> = {}) => ({
  req: {
    json: async () => body,
    query: (key: string) => query[key]
  },
  json: (data: any, status?: number) => ({
    data,
    status: status || 200
  })
});

describe('AI Searcher Query Integration', () => {
  let handler: AISearcherAPIHandler;

  beforeEach(() => {
    handler = new AISearcherAPIHandler();
  });

  describe('generateQuery endpoint', () => {
    it('should generate queries from content sources', async () => {
      const requestBody = {
        conversationId: 'test-conversation',
        contentSources: [
          { source: 'ideas' as const, id: '1' },
          { source: 'builder' as const, id: '2' }
        ],
        options: {
          maxKeywords: 5,
          maxTopics: 3,
          includeAlternatives: true
        }
      };

      const mockContext = createMockContext(requestBody);
      const response = await handler.generateQuery(mockContext as any);

      expect(response.data.success).toBe(true);
      expect(response.data.queries).toBeDefined();
      expect(Array.isArray(response.data.queries)).toBe(true);
      expect(response.data.queries.length).toBeGreaterThan(0);
      expect(response.data.extractedContent).toBeDefined();
      expect(response.data.processingTime).toBeGreaterThan(0);
    });

    it('should handle missing conversationId', async () => {
      const requestBody = {
        contentSources: [
          { source: 'ideas' as const, id: '1' }
        ]
      };

      const mockContext = createMockContext(requestBody);
      const response = await handler.generateQuery(mockContext as any);

      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain('conversationId');
      expect(response.status).toBe(400);
    });

    it('should handle missing content sources', async () => {
      const requestBody = {
        conversationId: 'test-conversation',
        contentSources: []
      };

      const mockContext = createMockContext(requestBody);
      const response = await handler.generateQuery(mockContext as any);

      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain('contentSources');
      expect(response.status).toBe(400);
    });
  });

  describe('extractContent endpoint', () => {
    it('should extract content from multiple sources', async () => {
      const requestBody = {
        conversationId: 'test-conversation',
        sources: [
          { source: 'ideas' as const, id: '1' },
          { source: 'builder' as const, id: '2' }
        ]
      };

      const mockContext = createMockContext(requestBody);
      const response = await handler.extractContent(mockContext as any);

      expect(response.data.success).toBe(true);
      expect(response.data.extractedContent).toBeDefined();
      expect(Array.isArray(response.data.extractedContent)).toBe(true);
      expect(response.data.processingTime).toBeGreaterThan(0);
    });

    it('should handle extraction errors gracefully', async () => {
      const requestBody = {
        conversationId: 'test-conversation',
        sources: [
          { source: 'ideas' as const, id: 'invalid-id' }
        ]
      };

      const mockContext = createMockContext(requestBody);
      const response = await handler.extractContent(mockContext as any);

      // Should still succeed but may have errors array
      expect(response.data.success).toBe(true);
      expect(response.data.extractedContent).toBeDefined();
    });
  });

  describe('validateQuery endpoint', () => {
    it('should validate a good query', async () => {
      const requestBody = {
        query: '"machine learning" AND "natural language processing" AND research'
      };

      const mockContext = createMockContext(requestBody);
      const response = await handler.validateQuery(mockContext as any);

      expect(response.data.success).toBe(true);
      expect(response.data.validation).toBeDefined();
      expect(response.data.validation.isValid).toBe(true);
      expect(response.data.validation.confidence).toBeGreaterThan(0);
    });

    it('should identify problematic queries', async () => {
      const requestBody = {
        query: 'ML'
      };

      const mockContext = createMockContext(requestBody);
      const response = await handler.validateQuery(mockContext as any);

      expect(response.data.success).toBe(true);
      expect(response.data.validation).toBeDefined();
      expect(response.data.validation.isValid).toBe(false);
      expect(response.data.validation.issues.length).toBeGreaterThan(0);
    });

    it('should handle missing query', async () => {
      const requestBody = {};

      const mockContext = createMockContext(requestBody);
      const response = await handler.validateQuery(mockContext as any);

      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain('Query is required');
      expect(response.status).toBe(400);
    });
  });

  describe('combineQueries endpoint', () => {
    it('should combine multiple queries', async () => {
      const requestBody = {
        queries: [
          {
            id: 'q1',
            query: '"machine learning" AND "algorithms"',
            originalContent: [],
            generatedAt: new Date(),
            confidence: 0.8,
            keywords: ['machine learning', 'algorithms'],
            topics: ['artificial intelligence'],
            queryType: 'basic' as const,
            optimization: {
              breadthScore: 0.5,
              specificityScore: 0.7,
              academicRelevance: 0.6,
              suggestions: [],
              alternativeQueries: []
            }
          },
          {
            id: 'q2',
            query: '"natural language processing" AND "research"',
            originalContent: [],
            generatedAt: new Date(),
            confidence: 0.7,
            keywords: ['natural language processing', 'research'],
            topics: ['computational linguistics'],
            queryType: 'basic' as const,
            optimization: {
              breadthScore: 0.4,
              specificityScore: 0.6,
              academicRelevance: 0.8,
              suggestions: [],
              alternativeQueries: []
            }
          }
        ]
      };

      const mockContext = createMockContext(requestBody);
      const response = await handler.combineQueries(mockContext as any);

      expect(response.data.success).toBe(true);
      expect(response.data.combinedQuery).toBeDefined();
      expect(response.data.combinedQuery.queryType).toBe('combined');
      expect(response.data.combinedQuery.keywords.length).toBeGreaterThan(0);
    });

    it('should handle empty queries array', async () => {
      const requestBody = {
        queries: []
      };

      const mockContext = createMockContext(requestBody);
      const response = await handler.combineQueries(mockContext as any);

      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain('Queries array is required');
      expect(response.status).toBe(400);
    });
  });

  describe('enhanced search endpoint', () => {
    it('should search with direct query', async () => {
      const requestBody = {
        query: 'machine learning algorithms',
        conversationId: 'test-conversation'
      };

      const mockContext = createMockContext(requestBody);
      const response = await handler.search(mockContext as any);

      expect(response.data.success).toBe(true);
      expect(response.data.results).toBeDefined();
      expect(response.data.query).toBe('machine learning algorithms');
      expect(response.data.originalQuery).toBe('machine learning algorithms');
    });

    it('should search with content sources (auto-generate query)', async () => {
      const requestBody = {
        conversationId: 'test-conversation',
        contentSources: [
          { source: 'ideas' as const, id: '1' }
        ],
        queryOptions: {
          maxKeywords: 5,
          optimizeForAcademic: true
        }
      };

      const mockContext = createMockContext(requestBody);
      const response = await handler.search(mockContext as any);

      expect(response.data.success).toBe(true);
      expect(response.data.results).toBeDefined();
      expect(response.data.query).toBeDefined();
      expect(response.data.generatedQueries).toBeDefined();
      expect(response.data.extractedContent).toBeDefined();
    });

    it('should handle missing conversationId', async () => {
      const requestBody = {
        query: 'test query'
      };

      const mockContext = createMockContext(requestBody);
      const response = await handler.search(mockContext as any);

      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain('conversationId');
      expect(response.status).toBe(400);
    });

    it('should handle missing query and content sources', async () => {
      const requestBody = {
        conversationId: 'test-conversation'
      };

      const mockContext = createMockContext(requestBody);
      const response = await handler.search(mockContext as any);

      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain('Query is required');
      expect(response.status).toBe(400);
    });
  });

  describe('integration with QueryGenerationEngine', () => {
    it('should properly integrate query generation with search', async () => {
      const requestBody = {
        conversationId: 'test-conversation',
        contentSources: [
          { source: 'ideas' as const, id: '1' }
        ],
        queryOptions: {
          maxKeywords: 3,
          maxTopics: 2,
          includeAlternatives: false,
          optimizeForAcademic: true
        }
      };

      const mockContext = createMockContext(requestBody);
      
      // First generate query
      const queryResponse = await handler.generateQuery(mockContext as any);
      expect(queryResponse.data.success).toBe(true);
      
      const generatedQuery = queryResponse.data.queries[0];
      expect(generatedQuery).toBeDefined();
      expect(generatedQuery.query).toBeTruthy();
      expect(generatedQuery.keywords.length).toBeGreaterThan(0);
      expect(generatedQuery.topics.length).toBeGreaterThan(0);

      // Then use generated query in search
      const searchBody = {
        query: generatedQuery.query,
        conversationId: 'test-conversation'
      };

      const searchContext = createMockContext(searchBody);
      const searchResponse = await handler.search(searchContext as any);
      
      expect(searchResponse.data.success).toBe(true);
      expect(searchResponse.data.results).toBeDefined();
      expect(searchResponse.data.query).toBe(generatedQuery.query);
    });
  });
});