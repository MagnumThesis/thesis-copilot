import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AISearcherAPIHandler } from '../worker/handlers/ai-searcher-api';
import { ContentExtractionEngine } from '../worker/lib/content-extraction-engine';
import { QueryGenerationEngine } from '../worker/lib/query-generation-engine';

// Mock environment for testing
const mockEnv = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON: 'test-anon-key',
  OPENAI_API_KEY: 'test-openai-key'
};

// Mock Hono context
const createMockContext = (body: any, query: Record<string, string> = {}, env: any = mockEnv) => ({
  req: {
    json: async () => body,
    query: (key: string) => query[key]
  },
  json: (data: any, status?: number) => ({
    data,
    status: status || 200
  }),
  env
});

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AI Searcher Content Integration Tests', () => {
  let handler: AISearcherAPIHandler;

  beforeEach(() => {
    handler = new AISearcherAPIHandler();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Content-to-Search Flow', () => {
    it('should extract content from Ideas and generate search query', async () => {
      // Mock Ideas API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          idea: {
            id: 1,
            title: 'Machine Learning in Education',
            description: 'Exploring the applications of machine learning algorithms in educational technology and personalized learning systems.',
            type: 'concept',
            tags: ['machine learning', 'education', 'AI'],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            conversationid: 'test-conversation'
          }
        })
      });

      // Test content extraction
      const extractRequest = {
        conversationId: 'test-conversation',
        sources: [
          { source: 'ideas' as const, id: '1' }
        ]
      };

      const mockContext = createMockContext(extractRequest);
      const extractResponse = await handler.extractContent(mockContext as any);

      expect(extractResponse.data.success).toBe(true);
      expect(extractResponse.data.extractedContent).toBeDefined();
      expect(extractResponse.data.extractedContent.length).toBe(1);

      const extractedContent = extractResponse.data.extractedContent[0];
      expect(extractedContent.source).toBe('ideas');
      expect(extractedContent.title).toBe('Machine Learning in Education');
      expect(extractedContent.keywords).toContain('machine');
      expect(extractedContent.keywords).toContain('learning');
      expect(extractedContent.confidence).toBeGreaterThan(0);

      // Test query generation from extracted content
      const queryRequest = {
        conversationId: 'test-conversation',
        contentSources: [
          { source: 'ideas' as const, id: '1' }
        ],
        options: {
          maxKeywords: 5,
          optimizeForAcademic: true
        }
      };

      const queryContext = createMockContext(queryRequest);
      const queryResponse = await handler.generateQuery(queryContext as any);

      expect(queryResponse.data.success).toBe(true);
      expect(queryResponse.data.queries).toBeDefined();
      expect(queryResponse.data.queries.length).toBeGreaterThan(0);
      expect(queryResponse.data.extractedContent).toBeDefined();

      const generatedQuery = queryResponse.data.queries[0];
      expect(generatedQuery.query).toBeTruthy();
      expect(generatedQuery.keywords).toContain('machine');
      expect(generatedQuery.keywords).toContain('learning');
    });

    it('should extract content from Builder and perform search', async () => {
      // Mock Builder API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          content: `# Thesis: AI-Powered Academic Writing Assistant

## Introduction
This thesis explores the development of AI-powered tools for academic writing assistance, focusing on reference management and citation generation.

## Literature Review
Recent advances in natural language processing have enabled sophisticated academic writing tools that can assist researchers in finding relevant literature and generating proper citations.

## Methodology
We employ a mixed-methods approach combining machine learning algorithms with user experience research to develop an effective academic writing assistant.`,
          title: 'AI-Powered Academic Writing Assistant',
          updated_at: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z'
        })
      });

      // Test content preview
      const previewRequest = {
        conversationId: 'test-conversation',
        source: 'builder' as const,
        id: 'test-conversation'
      };

      const previewContext = createMockContext(previewRequest);
      const previewResponse = await handler.contentPreview(previewContext as any);

      expect(previewResponse.data.success).toBe(true);
      expect(previewResponse.data.extractedContent).toBeDefined();

      const previewContent = previewResponse.data.extractedContent;
      expect(previewContent.source).toBe('builder');
      expect(previewContent.title).toBe('AI-Powered Academic Writing Assistant');
      expect(previewContent.content).toContain('thesis');
      expect(previewContent.keywords).toContain('academic');

      // Test search with content sources
      const searchRequest = {
        conversationId: 'test-conversation',
        contentSources: [
          { source: 'builder' as const, id: 'test-conversation' }
        ],
        queryOptions: {
          maxKeywords: 5,
          optimizeForAcademic: true
        }
      };

      const searchContext = createMockContext(searchRequest);
      const searchResponse = await handler.search(searchContext as any);

      expect(searchResponse.data.success).toBe(true);
      expect(searchResponse.data.results).toBeDefined();
      expect(searchResponse.data.query).toBeTruthy();
      expect(searchResponse.data.generatedQueries).toBeDefined();
      expect(searchResponse.data.extractedContent).toBeDefined();
    });

    it('should handle multiple content sources in search', async () => {
      // Mock Ideas API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          idea: {
            id: 1,
            title: 'Natural Language Processing',
            description: 'Advanced techniques in NLP for text analysis and understanding.',
            type: 'concept',
            tags: ['NLP', 'text analysis'],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            conversationid: 'test-conversation'
          }
        })
      });

      // Mock Builder API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          content: `# Research on Machine Learning Applications

## Abstract
This research investigates the practical applications of machine learning in various domains, with emphasis on natural language processing and computer vision.`,
          title: 'Machine Learning Applications Research',
          updated_at: '2024-01-01T00:00:00Z'
        })
      });

      // Test search with multiple content sources
      const searchRequest = {
        conversationId: 'test-conversation',
        contentSources: [
          { source: 'ideas' as const, id: '1' },
          { source: 'builder' as const, id: 'test-conversation' }
        ],
        queryOptions: {
          maxKeywords: 8,
          combineContent: true,
          optimizeForAcademic: true
        }
      };

      const searchContext = createMockContext(searchRequest);
      const searchResponse = await handler.search(searchContext as any);

      expect(searchResponse.data.success).toBe(true);
      expect(searchResponse.data.results).toBeDefined();
      expect(searchResponse.data.query).toBeTruthy();
      expect(searchResponse.data.extractedContent).toBeDefined();
      expect(searchResponse.data.extractedContent.length).toBe(2);

      // Verify that content from both sources is included
      const extractedContent = searchResponse.data.extractedContent;
      const ideasContent = extractedContent.find(ec => ec.source === 'ideas');
      const builderContent = extractedContent.find(ec => ec.source === 'builder');

      expect(ideasContent).toBeDefined();
      expect(builderContent).toBeDefined();
      expect(ideasContent?.title).toBe('Natural Language Processing');
      expect(builderContent?.title).toBe('Machine Learning Applications Research');
    });

    it('should handle content extraction errors gracefully', async () => {
      // Mock API failure
      mockFetch.mockRejectedValueOnce(new Error('API unavailable'));

      // Test content extraction with error
      const extractRequest = {
        conversationId: 'test-conversation',
        sources: [
          { source: 'ideas' as const, id: 'invalid-id' }
        ]
      };

      const mockContext = createMockContext(extractRequest);
      const extractResponse = await handler.extractContent(mockContext as any);

      // Should still succeed but use fallback data
      expect(extractResponse.data.success).toBe(true);
      expect(extractResponse.data.extractedContent).toBeDefined();
      expect(extractResponse.data.extractedContent.length).toBe(1);

      // Verify fallback content is used
      const extractedContent = extractResponse.data.extractedContent[0];
      expect(extractedContent.source).toBe('ideas');
      expect(extractedContent.title).toContain('Research Topic');
      expect(extractedContent.confidence).toBeGreaterThan(0);
    });

    it('should validate content quality before search', async () => {
      // Mock API with minimal content
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          idea: {
            id: 1,
            title: 'Test',
            description: 'Short',
            type: 'concept',
            tags: [],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            conversationid: 'test-conversation'
          }
        })
      });

      // Test content extraction with minimal content
      const extractRequest = {
        conversationId: 'test-conversation',
        sources: [
          { source: 'ideas' as const, id: '1' }
        ]
      };

      const mockContext = createMockContext(extractRequest);
      const extractResponse = await handler.extractContent(mockContext as any);

      expect(extractResponse.data.success).toBe(true);
      const extractedContent = extractResponse.data.extractedContent[0];
      
      // Should have lower confidence for minimal content
      expect(extractedContent.confidence).toBeLessThan(0.8);
      expect(extractedContent.keywords.length).toBeGreaterThan(0);
    });

    it('should optimize queries for academic search', async () => {
      // Mock Builder API with academic content
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          content: `# Systematic Review of Machine Learning in Healthcare

## Abstract
This systematic review examines the current state of machine learning applications in healthcare, analyzing peer-reviewed studies from 2020-2024.

## Methodology
We conducted a comprehensive literature search using PubMed, IEEE Xplore, and ACM Digital Library databases.

## Results
Our analysis of 150 peer-reviewed articles reveals significant advances in diagnostic accuracy and treatment personalization.`,
          title: 'Systematic Review of ML in Healthcare',
          updated_at: '2024-01-01T00:00:00Z'
        })
      });

      // Test query generation with academic optimization
      const queryRequest = {
        conversationId: 'test-conversation',
        contentSources: [
          { source: 'builder' as const, id: 'test-conversation' }
        ],
        options: {
          maxKeywords: 6,
          optimizeForAcademic: true,
          includeMethodologyTerms: true,
          preferPeerReviewed: true
        }
      };

      const queryContext = createMockContext(queryRequest);
      const queryResponse = await handler.generateQuery(queryContext as any);

      expect(queryResponse.data.success).toBe(true);
      expect(queryResponse.data.queries).toBeDefined();

      const generatedQuery = queryResponse.data.queries[0];
      expect(generatedQuery.query).toBeTruthy();
      
      // Should include academic terms
      const queryLower = generatedQuery.query.toLowerCase();
      expect(
        queryLower.includes('machine learning') ||
        queryLower.includes('healthcare') ||
        queryLower.includes('systematic review')
      ).toBe(true);

      // Should have high confidence for academic content
      expect(generatedQuery.confidence).toBeGreaterThan(0.7);
    });

    it('should handle empty or invalid content sources', async () => {
      // Test with empty content sources
      const searchRequest = {
        conversationId: 'test-conversation',
        contentSources: []
      };

      const searchContext = createMockContext(searchRequest);
      const searchResponse = await handler.search(searchContext as any);

      expect(searchResponse.data.success).toBe(false);
      expect(searchResponse.data.error).toContain('Query is required');
      expect(searchResponse.status).toBe(400);
    });

    it('should track content source usage in search analytics', async () => {
      // Mock Ideas API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          idea: {
            id: 1,
            title: 'AI Research Topic',
            description: 'Comprehensive research on artificial intelligence applications.',
            type: 'concept',
            tags: ['AI', 'research'],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            conversationid: 'test-conversation'
          }
        })
      });

      // Test search with content sources
      const searchRequest = {
        conversationId: 'test-conversation',
        contentSources: [
          { source: 'ideas' as const, id: '1' }
        ]
      };

      const searchContext = createMockContext(searchRequest);
      const searchResponse = await handler.search(searchContext as any);

      expect(searchResponse.data.success).toBe(true);
      expect(searchResponse.data.sessionId).toBeDefined();
      
      // Verify that content sources are tracked
      expect(searchResponse.data.extractedContent).toBeDefined();
      expect(searchResponse.data.extractedContent.length).toBe(1);
      expect(searchResponse.data.extractedContent[0].source).toBe('ideas');
    });
  });

  describe('Content Extraction Engine Integration', () => {
    it('should properly integrate with Ideas API', async () => {
      const engine = new ContentExtractionEngine();

      // Mock successful API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          idea: {
            id: 1,
            title: 'Test Idea',
            description: 'This is a test idea for content extraction.',
            type: 'concept',
            tags: ['test'],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            conversationid: 'test-conversation'
          }
        })
      });

      const extracted = await engine.extractContent({
        source: 'ideas',
        id: '1',
        conversationId: 'test-conversation'
      });

      expect(extracted.source).toBe('ideas');
      expect(extracted.title).toBe('Test Idea');
      expect(extracted.content).toContain('test idea');
      expect(extracted.keywords).toBeDefined();
      expect(extracted.confidence).toBeGreaterThan(0);
    });

    it('should properly integrate with Builder API', async () => {
      const engine = new ContentExtractionEngine();

      // Mock successful API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          content: '# Test Document\n\nThis is a test document for content extraction.',
          title: 'Test Document',
          updated_at: '2024-01-01T00:00:00Z'
        })
      });

      const extracted = await engine.extractContent({
        source: 'builder',
        id: 'test-conversation',
        conversationId: 'test-conversation'
      });

      expect(extracted.source).toBe('builder');
      expect(extracted.title).toBe('Test Document');
      expect(extracted.content).toContain('test document');
      expect(extracted.keywords).toBeDefined();
      expect(extracted.confidence).toBeGreaterThan(0);
    });

    it('should handle API failures with fallback content', async () => {
      const engine = new ContentExtractionEngine();

      // Mock API failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const extracted = await engine.extractContent({
        source: 'ideas',
        id: '1',
        conversationId: 'test-conversation'
      });

      // Should use fallback content
      expect(extracted.source).toBe('ideas');
      expect(extracted.title).toContain('Research Topic');
      expect(extracted.content).toBeTruthy();
      expect(extracted.confidence).toBeGreaterThan(0);
    });
  });

  describe('Query Generation Integration', () => {
    it('should generate academic-optimized queries from extracted content', async () => {
      const engine = new QueryGenerationEngine();

      const mockExtractedContent = [{
        id: '1',
        source: 'ideas' as const,
        title: 'Machine Learning Applications',
        content: 'This research explores machine learning applications in natural language processing and computer vision.',
        keywords: ['machine learning', 'natural language processing', 'computer vision', 'applications'],
        keyPhrases: ['machine learning applications', 'natural language processing'],
        topics: ['artificial intelligence', 'computer science'],
        confidence: 0.9,
        extractedAt: new Date()
      }];

      const queries = engine.generateQueries(mockExtractedContent, {
        maxKeywords: 5,
        optimizeForAcademic: true
      });

      expect(queries).toBeDefined();
      expect(queries.length).toBeGreaterThan(0);

      const query = queries[0];
      expect(query.query).toBeTruthy();
      expect(query.keywords).toContain('machine learning');
      expect(query.confidence).toBeGreaterThan(0);
      expect(query.queryType).toBe('academic');
    });

    it('should combine multiple content sources into unified queries', async () => {
      const engine = new QueryGenerationEngine();

      const mockExtractedContents = [
        {
          id: '1',
          source: 'ideas' as const,
          title: 'AI Research',
          content: 'Artificial intelligence research in healthcare applications.',
          keywords: ['artificial intelligence', 'healthcare', 'research'],
          keyPhrases: ['AI research', 'healthcare applications'],
          topics: ['artificial intelligence', 'healthcare'],
          confidence: 0.8,
          extractedAt: new Date()
        },
        {
          id: '2',
          source: 'builder' as const,
          title: 'Medical AI Systems',
          content: 'Development of AI systems for medical diagnosis and treatment.',
          keywords: ['AI systems', 'medical diagnosis', 'treatment'],
          keyPhrases: ['medical AI systems', 'medical diagnosis'],
          topics: ['medical technology', 'artificial intelligence'],
          confidence: 0.9,
          extractedAt: new Date()
        }
      ];

      const queries = engine.generateQueries(mockExtractedContents, {
        maxKeywords: 8,
        combineContent: true,
        optimizeForAcademic: true
      });

      expect(queries).toBeDefined();
      expect(queries.length).toBeGreaterThan(0);

      const query = queries[0];
      expect(query.query).toBeTruthy();
      
      // Should include keywords from both sources
      const combinedKeywords = query.keywords;
      expect(combinedKeywords).toContain('artificial intelligence');
      expect(combinedKeywords).toContain('healthcare');
      expect(combinedKeywords).toContain('medical');
    });
  });
});