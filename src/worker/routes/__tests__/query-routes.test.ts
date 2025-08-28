// src/worker/routes/__tests__/query-routes.test.ts
// Unit tests for query route handlers

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  handleGenerateQueryRoute, 
  handleValidateQueryRoute, 
  handleCombineQueriesRoute, 
  handleRefineQueryRoute 
} from '../query-routes';
import { QueryService } from '../../services/query-service';

describe('query-routes', () => {
  const validContext = (body: any) => ({ request: { body } });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleGenerateQueryRoute', () => {
    it('should throw error if conversationId is missing', async () => {
      await expect(handleGenerateQueryRoute(validContext({}))).rejects.toThrow('Invalid request: missing conversationId');
      await expect(handleGenerateQueryRoute(validContext({ prompt: 'test' }))).rejects.toThrow('Invalid request: missing conversationId');
    });

    it('should call QueryService.generateQuery with correct params and return response', async () => {
      const mockResponse = { query: 'generated query', metadata: { foo: 'bar' } };
      const spy = vi.spyOn(QueryService, 'generateQuery').mockResolvedValueOnce(mockResponse as any);
      const ctx = validContext({ conversationId: 'c1', prompt: 'test prompt', context: { x: 1 }, options: { y: 2 } });
      const result = await handleGenerateQueryRoute(ctx as any);
      expect(spy).toHaveBeenCalledWith({ conversationId: 'c1', prompt: 'test prompt', context: { x: 1 }, options: { y: 2 } });
      expect(result).toBe(mockResponse);
    });
  });

  describe('handleValidateQueryRoute', () => {
    it('should throw error if query or conversationId is missing', async () => {
      await expect(handleValidateQueryRoute(validContext({}))).rejects.toThrow('Invalid request: missing query or conversationId');
      await expect(handleValidateQueryRoute(validContext({ query: 'test' }))).rejects.toThrow('Invalid request: missing query or conversationId');
      await expect(handleValidateQueryRoute(validContext({ conversationId: 'c1' }))).rejects.toThrow('Invalid request: missing query or conversationId');
    });

    it('should call QueryService.validateQuery with correct params and return response', async () => {
      const mockResponse = { isValid: true, suggestions: [], metadata: { valid: true } };
      const spy = vi.spyOn(QueryService, 'validateQuery').mockResolvedValueOnce(mockResponse as any);
      const ctx = validContext({ conversationId: 'c2', query: 'test query', options: { strict: true } });
      const result = await handleValidateQueryRoute(ctx as any);
      expect(spy).toHaveBeenCalledWith({ conversationId: 'c2', query: 'test query', options: { strict: true } });
      expect(result).toBe(mockResponse);
    });
  });

  describe('handleCombineQueriesRoute', () => {
    it('should throw error if queries array or conversationId is missing', async () => {
      await expect(handleCombineQueriesRoute(validContext({}))).rejects.toThrow('Invalid request: missing queries array or conversationId');
      await expect(handleCombineQueriesRoute(validContext({ queries: ['q1'] }))).rejects.toThrow('Invalid request: missing queries array or conversationId');
      await expect(handleCombineQueriesRoute(validContext({ conversationId: 'c1' }))).rejects.toThrow('Invalid request: missing queries array or conversationId');
      await expect(handleCombineQueriesRoute(validContext({ conversationId: 'c1', queries: 'not-array' }))).rejects.toThrow('Invalid request: missing queries array or conversationId');
    });

    it('should call QueryService.combineQueries with correct params and return response', async () => {
      const mockResponse = { query: 'combined query', metadata: { combined: true } };
      const spy = vi.spyOn(QueryService, 'combineQueries').mockResolvedValueOnce(mockResponse as any);
      const ctx = validContext({ conversationId: 'c3', queries: ['q1', 'q2'], options: { method: 'OR' } });
      const result = await handleCombineQueriesRoute(ctx as any);
      expect(spy).toHaveBeenCalledWith({ conversationId: 'c3', queries: ['q1', 'q2'], options: { method: 'OR' } });
      expect(result).toBe(mockResponse);
    });
  });

  describe('handleRefineQueryRoute', () => {
    it('should throw error if query or conversationId is missing', async () => {
      await expect(handleRefineQueryRoute(validContext({}))).rejects.toThrow('Invalid request: missing query or conversationId');
      await expect(handleRefineQueryRoute(validContext({ query: 'test' }))).rejects.toThrow('Invalid request: missing query or conversationId');
      await expect(handleRefineQueryRoute(validContext({ conversationId: 'c1' }))).rejects.toThrow('Invalid request: missing query or conversationId');
    });

    it('should call QueryService.refineQuery with correct params and return response', async () => {
      const mockResponse = { query: 'refined query', suggestions: ['alt1'], metadata: { refined: true } };
      const spy = vi.spyOn(QueryService, 'refineQuery').mockResolvedValueOnce(mockResponse as any);
      const ctx = validContext({ conversationId: 'c4', query: 'original query', refinementContext: { context: 'academic' }, options: { level: 'high' } });
      const result = await handleRefineQueryRoute(ctx as any);
      expect(spy).toHaveBeenCalledWith({ conversationId: 'c4', query: 'original query', refinementContext: { context: 'academic' }, options: { level: 'high' } });
      expect(result).toBe(mockResponse);
    });
  });
});
