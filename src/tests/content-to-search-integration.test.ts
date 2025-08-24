import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ContentExtractionEngine } from '../worker/lib/content-extraction-engine';
import { QueryGenerationEngine } from '../worker/lib/query-generation-engine';
import { ExtractedContent } from '../lib/ai-types';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Content-to-Search Integration Flow', () => {
  let contentEngine: ContentExtractionEngine;
  let queryEngine: QueryGenerationEngine;

  beforeEach(() => {
    contentEngine = new ContentExtractionEngine();
    queryEngine = new QueryGenerationEngine();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Ideas Content Integration', () => {
    it('should extract content from Ideas and generate search query', async () => {
      // Mock Ideas API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          idea: {
            id: 1,
            title: 'Machine Learning in Healthcare',
            description: 'Exploring the applications of machine learning algorithms in medical diagnosis and treatment optimization.',
            type: 'concept',
            tags: ['machine learning', 'healthcare', 'AI'],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            conversationid: 'test-conversation'
          }
        })
      });

      // Step 1: Extract content from Ideas
      const extractedContent = await contentEngine.extractContent({
        source: 'ideas',
        id: '1',
        conversationId: 'test-conversation'
      });

      expect(extractedContent.source).toBe('ideas');
      expect(extractedContent.title).toBe('Machine Learning in Healthcare');
      expect(extractedContent.content).toContain('machine learning');
      expect(extractedContent.keywords).toBeDefined();
      expect(extractedContent.keywords.length).toBeGreaterThan(0);
      expect(extractedContent.confidence).toBeGreaterThan(0);

      // Step 2: Generate search query from extracted content
      const queries = queryEngine.generateQueries([extractedContent], {
        maxKeywords: 5,
        optimizeForAcademic: true
      });

      expect(queries).toBeDefined();
      expect(queries.length).toBeGreaterThan(0);

      const query = queries[0];
      expect(query.query).toBeTruthy();
      expect(query.keywords).toBeDefined();
      expect(query.confidence).toBeGreaterThan(0);
      
      // Verify query contains relevant terms
      const queryLower = query.query.toLowerCase();
      expect(
        queryLower.includes('machine') || 
        queryLower.includes('learning') || 
        queryLower.includes('healthcare')
      ).toBe(true);
    });

    it('should handle Ideas API failure gracefully', async () => {
      // Mock API failure
      mockFetch.mockRejectedValueOnce(new Error('API unavailable'));

      // Should still extract content using fallback
      const extractedContent = await contentEngine.extractContent({
        source: 'ideas',
        id: '1',
        conversationId: 'test-conversation'
      });

      expect(extractedContent.source).toBe('ideas');
      expect(extractedContent.title).toContain('Research Topic');
      expect(extractedContent.content).toBeTruthy();
      expect(extractedContent.confidence).toBeGreaterThan(0);

      // Should still be able to generate queries
      const queries = queryEngine.generateQueries([extractedContent]);
      expect(queries.length).toBeGreaterThan(0);
    });
  });

  describe('Builder Content Integration', () => {
    it('should extract content from Builder and generate search query', async () => {
      // Mock Builder API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          content: `# Thesis: AI-Powered Academic Writing Assistant

## Introduction
This thesis explores the development of artificial intelligence tools for academic writing assistance, focusing on natural language processing and machine learning techniques.

## Literature Review
Recent advances in natural language processing have enabled sophisticated academic writing tools that can assist researchers in finding relevant literature and generating proper citations.

## Methodology
We employ a mixed-methods approach combining machine learning algorithms with user experience research to develop an effective academic writing assistant.`,
          title: 'AI-Powered Academic Writing Assistant',
          updated_at: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z'
        })
      });

      // Step 1: Extract content from Builder
      const extractedContent = await contentEngine.extractContent({
        source: 'builder',
        id: 'test-conversation',
        conversationId: 'test-conversation'
      });

      expect(extractedContent.source).toBe('builder');
      expect(extractedContent.title).toBe('AI-Powered Academic Writing Assistant');
      expect(extractedContent.content).toContain('artificial intelligence');
      expect(extractedContent.keywords).toBeDefined();
      expect(extractedContent.keywords.length).toBeGreaterThan(0);
      expect(extractedContent.confidence).toBeGreaterThan(0);

      // Step 2: Generate search query from extracted content
      const queries = queryEngine.generateQueries([extractedContent], {
        maxKeywords: 6,
        optimizeForAcademic: true
      });

      expect(queries).toBeDefined();
      expect(queries.length).toBeGreaterThan(0);

      const query = queries[0];
      expect(query.query).toBeTruthy();
      expect(query.keywords).toBeDefined();
      expect(query.confidence).toBeGreaterThan(0);

      // Verify query contains academic terms
      const queryLower = query.query.toLowerCase();
      expect(
        queryLower.includes('artificial intelligence') ||
        queryLower.includes('academic') ||
        queryLower.includes('writing') ||
        queryLower.includes('natural language')
      ).toBe(true);
    });

    it('should handle Builder API failure gracefully', async () => {
      // Mock API failure
      mockFetch.mockRejectedValueOnce(new Error('Builder API unavailable'));

      // Should still extract content using fallback
      const extractedContent = await contentEngine.extractContent({
        source: 'builder',
        id: 'test-conversation',
        conversationId: 'test-conversation'
      });

      expect(extractedContent.source).toBe('builder');
      expect(extractedContent.title).toBeTruthy();
      expect(extractedContent.content).toBeTruthy();
      expect(extractedContent.confidence).toBeGreaterThan(0);

      // Should still be able to generate queries
      const queries = queryEngine.generateQueries([extractedContent]);
      expect(queries.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-Source Content Integration', () => {
    it('should combine content from multiple sources and generate unified query', async () => {
      // Mock Ideas API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          idea: {
            id: 1,
            title: 'Natural Language Processing Research',
            description: 'Advanced techniques in NLP for text analysis and understanding in academic contexts.',
            type: 'concept',
            tags: ['NLP', 'text analysis', 'research'],
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
This research investigates the practical applications of machine learning in various domains, with emphasis on natural language processing and computer vision technologies.

## Objectives
- Develop novel ML algorithms for text processing
- Evaluate performance in real-world applications
- Create frameworks for academic research`,
          title: 'Machine Learning Applications Research',
          updated_at: '2024-01-01T00:00:00Z'
        })
      });

      // Step 1: Extract content from both sources
      const ideasContent = await contentEngine.extractContent({
        source: 'ideas',
        id: '1',
        conversationId: 'test-conversation'
      });

      const builderContent = await contentEngine.extractContent({
        source: 'builder',
        id: 'test-conversation',
        conversationId: 'test-conversation'
      });

      expect(ideasContent.source).toBe('ideas');
      expect(builderContent.source).toBe('builder');

      // Step 2: Generate unified query from both sources
      const combinedContent = [ideasContent, builderContent];
      const queries = queryEngine.generateQueries(combinedContent, {
        maxKeywords: 8,
        combineContent: true,
        optimizeForAcademic: true
      });

      expect(queries).toBeDefined();
      expect(queries.length).toBeGreaterThan(0);

      const query = queries[0];
      expect(query.query).toBeTruthy();
      expect(query.keywords).toBeDefined();
      expect(query.keywords.length).toBeGreaterThan(0);

      // Verify query combines terms from both sources
      const allKeywords = query.keywords.join(' ').toLowerCase();
      expect(
        allKeywords.includes('natural') ||
        allKeywords.includes('language') ||
        allKeywords.includes('machine') ||
        allKeywords.includes('learning') ||
        allKeywords.includes('research')
      ).toBe(true);
    });

    it('should handle mixed success/failure scenarios', async () => {
      // Mock successful Ideas API response
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

      // Mock failed Builder API response
      mockFetch.mockRejectedValueOnce(new Error('Builder API failure'));

      // Extract from both sources (one success, one fallback)
      const ideasContent = await contentEngine.extractContent({
        source: 'ideas',
        id: '1',
        conversationId: 'test-conversation'
      });

      const builderContent = await contentEngine.extractContent({
        source: 'builder',
        id: 'test-conversation',
        conversationId: 'test-conversation'
      });

      // Both should succeed (one real, one fallback)
      expect(ideasContent.source).toBe('ideas');
      expect(ideasContent.title).toBe('AI Research Topic');
      expect(builderContent.source).toBe('builder');
      expect(builderContent.title).toBeTruthy();

      // Should still generate meaningful queries
      const queries = queryEngine.generateQueries([ideasContent, builderContent]);
      expect(queries.length).toBeGreaterThan(0);
      expect(queries[0].query).toBeTruthy();
    });
  });

  describe('Content Quality and Validation', () => {
    it('should validate content quality and adjust confidence scores', async () => {
      // Mock high-quality content
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          idea: {
            id: 1,
            title: 'Comprehensive Machine Learning Research Framework',
            description: 'This comprehensive research framework explores advanced machine learning techniques including deep neural networks, reinforcement learning, and natural language processing. The framework provides detailed methodologies for academic research, evaluation metrics, and practical implementation guidelines for researchers in the field of artificial intelligence.',
            type: 'concept',
            tags: ['machine learning', 'research', 'framework', 'AI'],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            conversationid: 'test-conversation'
          }
        })
      });

      const highQualityContent = await contentEngine.extractContent({
        source: 'ideas',
        id: '1',
        conversationId: 'test-conversation'
      });

      // High-quality content should have higher confidence
      expect(highQualityContent.confidence).toBeGreaterThan(0.7);
      expect(highQualityContent.keywords.length).toBeGreaterThan(5);
      expect(highQualityContent.topics.length).toBeGreaterThan(2);

      // Mock low-quality content
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          idea: {
            id: 2,
            title: 'Test',
            description: 'Short description.',
            type: 'concept',
            tags: [],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            conversationid: 'test-conversation'
          }
        })
      });

      const lowQualityContent = await contentEngine.extractContent({
        source: 'ideas',
        id: '2',
        conversationId: 'test-conversation'
      });

      // Low-quality content should have lower confidence
      expect(lowQualityContent.confidence).toBeLessThan(highQualityContent.confidence);
      expect(lowQualityContent.keywords.length).toBeLessThan(highQualityContent.keywords.length);
    });

    it('should handle empty or minimal content gracefully', async () => {
      // Mock minimal content
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          idea: {
            id: 1,
            title: '',
            description: '',
            type: 'concept',
            tags: [],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            conversationid: 'test-conversation'
          }
        })
      });

      // Should handle empty content by using fallback
      const extractedContent = await contentEngine.extractContent({
        source: 'ideas',
        id: '1',
        conversationId: 'test-conversation'
      });

      expect(extractedContent.source).toBe('ideas');
      expect(extractedContent.content).toBeTruthy(); // Should have fallback content
      expect(extractedContent.confidence).toBeGreaterThan(0);

      // Should still generate queries
      const queries = queryEngine.generateQueries([extractedContent]);
      expect(queries.length).toBeGreaterThan(0);
    });
  });

  describe('Query Optimization for Academic Search', () => {
    it('should optimize queries for academic search contexts', async () => {
      // Mock academic content
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          content: `# Systematic Review of Deep Learning in Medical Imaging

## Abstract
This systematic review examines the current state of deep learning applications in medical imaging, analyzing peer-reviewed studies from 2020-2024.

## Methodology
We conducted a comprehensive literature search using PubMed, IEEE Xplore, and ACM Digital Library databases, following PRISMA guidelines.

## Results
Our analysis of 150 peer-reviewed articles reveals significant advances in diagnostic accuracy and clinical implementation.`,
          title: 'Systematic Review of Deep Learning in Medical Imaging',
          updated_at: '2024-01-01T00:00:00Z'
        })
      });

      const extractedContent = await contentEngine.extractContent({
        source: 'builder',
        id: 'test-conversation',
        conversationId: 'test-conversation'
      });

      // Generate academic-optimized query
      const queries = queryEngine.generateQueries([extractedContent], {
        maxKeywords: 6,
        optimizeForAcademic: true,
        includeMethodologyTerms: true,
        preferPeerReviewed: true
      });

      expect(queries.length).toBeGreaterThan(0);
      const query = queries[0];

      // Should include academic terms
      const queryText = query.query.toLowerCase();
      expect(
        queryText.includes('deep learning') ||
        queryText.includes('medical') ||
        queryText.includes('systematic') ||
        queryText.includes('review') ||
        queryText.includes('imaging')
      ).toBe(true);

      // Should have high confidence for academic content
      expect(query.confidence).toBeGreaterThan(0.7);
    });

    it('should generate multiple query variations', async () => {
      const mockContent: ExtractedContent = {
        id: '1',
        source: 'ideas',
        title: 'Machine Learning Research',
        content: 'Advanced machine learning techniques for natural language processing and computer vision applications.',
        keywords: ['machine learning', 'natural language processing', 'computer vision'],
        keyPhrases: ['machine learning techniques', 'natural language processing'],
        topics: ['artificial intelligence', 'computer science'],
        confidence: 0.9,
        extractedAt: new Date()
      };

      const queries = queryEngine.generateQueries([mockContent], {
        maxQueries: 3,
        includeAlternatives: true,
        optimizeForAcademic: true
      });

      expect(queries.length).toBeGreaterThanOrEqual(1);
      expect(queries.length).toBeLessThanOrEqual(3);

      // Each query should be different
      if (queries.length > 1) {
        expect(queries[0].query).not.toBe(queries[1].query);
      }

      // All queries should have reasonable confidence
      queries.forEach(query => {
        expect(query.confidence).toBeGreaterThan(0);
        expect(query.query).toBeTruthy();
        expect(query.keywords.length).toBeGreaterThan(0);
      });
    });
  });
});