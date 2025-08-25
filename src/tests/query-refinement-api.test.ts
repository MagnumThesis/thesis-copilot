import { describe, it, expect } from 'vitest';
import { AISearcherAPIHandler } from '../worker/handlers/ai-searcher-api';

describe('Query Refinement API', () => {
  const handler = new AISearcherAPIHandler();

  // Mock context for testing
  const createMockContext = (body: any) => ({
    req: {
      json: async () => body
    },
    json: (data: any, status?: number) => ({
      data,
      status: status || 200
    })
  });

  describe('refineQuery endpoint', () => {
    it('should refine a simple query', async () => {
      const mockContext = createMockContext({
        query: 'machine learning research',
        conversationId: 'test-conversation',
        originalContent: []
      });

      const response = await handler.refineQuery(mockContext as any);

      expect(response.data.success).toBe(true);
      expect(response.data.refinement).toBeDefined();
      expect(response.data.refinement.breadthAnalysis).toBeDefined();
      expect(response.data.refinement.alternativeTerms).toBeDefined();
      expect(response.data.refinement.validationResults).toBeDefined();
      expect(response.data.refinement.optimizationRecommendations).toBeDefined();
      expect(response.data.refinement.refinedQueries).toBeDefined();
      expect(response.data.originalQuery).toBe('machine learning research');
      expect(response.data.processingTime).toBeGreaterThan(0);
    });

    it('should refine a query with content context', async () => {
      const mockContent = [{
        sourceId: 'test-1',
        sourceType: 'ideas' as const,
        title: 'AI Research',
        content: 'Research on artificial intelligence and machine learning algorithms.',
        keywords: ['artificial intelligence', 'machine learning', 'algorithms'],
        keyPhrases: ['AI research', 'ML algorithms'],
        topics: ['computer science', 'artificial intelligence'],
        confidence: 0.9,
        extractedAt: new Date()
      }];

      const mockContext = createMockContext({
        query: 'AI research methodology',
        conversationId: 'test-conversation',
        originalContent: mockContent
      });

      const response = await handler.refineQuery(mockContext as any);

      expect(response.data.success).toBe(true);
      expect(response.data.refinement).toBeDefined();
      expect(response.data.refinement.alternativeTerms.relatedTerms.length).toBeGreaterThan(0);
    });

    it('should handle missing query', async () => {
      const mockContext = createMockContext({
        conversationId: 'test-conversation'
      });

      const response = await handler.refineQuery(mockContext as any);

      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain('Query and conversationId are required');
      expect(response.status).toBe(400);
    });

    it('should handle missing conversationId', async () => {
      const mockContext = createMockContext({
        query: 'machine learning research'
      });

      const response = await handler.refineQuery(mockContext as any);

      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain('Query and conversationId are required');
      expect(response.status).toBe(400);
    });

    it('should handle empty query', async () => {
      const mockContext = createMockContext({
        query: '',
        conversationId: 'test-conversation'
      });

      const response = await handler.refineQuery(mockContext as any);

      expect(response.data.success).toBe(false);
      expect(response.data.error).toContain('Query and conversationId are required');
      expect(response.status).toBe(400);
    });

    it('should provide comprehensive refinement analysis', async () => {
      const mockContext = createMockContext({
        query: 'deep learning neural networks',
        conversationId: 'test-conversation',
        originalContent: []
      });

      const response = await handler.refineQuery(mockContext as any);

      expect(response.data.success).toBe(true);
      
      const refinement = response.data.refinement;
      
      // Check breadth analysis
      expect(refinement.breadthAnalysis.breadthScore).toBeGreaterThanOrEqual(0);
      expect(refinement.breadthAnalysis.breadthScore).toBeLessThanOrEqual(1);
      expect(['too_narrow', 'optimal', 'too_broad']).toContain(refinement.breadthAnalysis.classification);
      expect(refinement.breadthAnalysis.termCount).toBeGreaterThan(0);
      expect(refinement.breadthAnalysis.reasoning).toBeDefined();
      
      // Check alternative terms
      expect(refinement.alternativeTerms.synonyms).toBeDefined();
      expect(refinement.alternativeTerms.relatedTerms).toBeDefined();
      expect(refinement.alternativeTerms.broaderTerms).toBeDefined();
      expect(refinement.alternativeTerms.narrowerTerms).toBeDefined();
      expect(refinement.alternativeTerms.academicVariants).toBeDefined();
      
      // Check validation results
      expect(refinement.validationResults.isValid).toBeDefined();
      expect(refinement.validationResults.confidence).toBeGreaterThanOrEqual(0);
      expect(refinement.validationResults.confidence).toBeLessThanOrEqual(1);
      
      // Check optimization recommendations
      expect(Array.isArray(refinement.optimizationRecommendations)).toBe(true);
      refinement.optimizationRecommendations.forEach((rec: any) => {
        expect(rec.type).toBeDefined();
        expect(rec.description).toBeDefined();
        expect(rec.impact).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.beforeQuery).toBeDefined();
        expect(rec.afterQuery).toBeDefined();
        expect(rec.reasoning).toBeDefined();
      });
      
      // Check refined queries
      expect(Array.isArray(refinement.refinedQueries)).toBe(true);
      expect(refinement.refinedQueries.length).toBeGreaterThan(0);
      refinement.refinedQueries.forEach((query: any) => {
        expect(query.query).toBeDefined();
        expect(query.refinementType).toBeDefined();
        expect(query.confidence).toBeGreaterThanOrEqual(0);
        expect(query.confidence).toBeLessThanOrEqual(1);
        expect(['fewer', 'similar', 'more']).toContain(query.expectedResults);
        expect(query.description).toBeDefined();
        expect(Array.isArray(query.changes)).toBe(true);
      });
    });

    it('should handle different query types appropriately', async () => {
      const queries = [
        'AI',  // Very short
        'machine learning research methodology framework analysis',  // Medium
        'artificial intelligence machine learning deep learning neural networks computer vision natural language processing reinforcement learning supervised learning unsupervised learning semi-supervised learning transfer learning meta-learning few-shot learning zero-shot learning multi-task learning representation learning feature learning dimensionality reduction clustering classification regression optimization gradient descent backpropagation convolutional neural networks recurrent neural networks transformer models attention mechanisms'  // Very long
      ];

      for (const query of queries) {
        const mockContext = createMockContext({
          query,
          conversationId: 'test-conversation',
          originalContent: []
        });

        const response = await handler.refineQuery(mockContext as any);

        expect(response.data.success).toBe(true);
        expect(response.data.refinement).toBeDefined();
        
        // Each query should get appropriate analysis
        const refinement = response.data.refinement;
        expect(refinement.breadthAnalysis.classification).toBeDefined();
        expect(refinement.validationResults.isValid).toBeDefined();
        expect(refinement.optimizationRecommendations.length).toBeGreaterThanOrEqual(0);
        expect(refinement.refinedQueries.length).toBeGreaterThan(0);
      }
    });
  });
});