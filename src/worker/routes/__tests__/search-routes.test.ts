// src/worker/routes/__tests__/search-routes.test.ts
// Unit tests for search and extract route handlers

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleSearchRoute, handleExtractRoute } from '../search-routes';
import { SearchService } from '../../services/search-service';

describe('search-routes', () => {
  const validContext = (body: any) => ({ 
    request: { body },
    env: { SUPABASE_URL: 'test', SUPABASE_ANON: 'test' }
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleSearchRoute', () => {
    it('should throw error if query or conversationId is missing', async () => {
      await expect(handleSearchRoute(validContext({}))).rejects.toThrow('Invalid request: missing query or conversationId');
      await expect(handleSearchRoute(validContext({ query: 'foo' }))).rejects.toThrow('Invalid request: missing query or conversationId');
      await expect(handleSearchRoute(validContext({ conversationId: 'bar' }))).rejects.toThrow('Invalid request: missing query or conversationId');
    });

    it('should call SearchService.search with correct params and return response', async () => {
      const mockResponse = { results: ['a'], metadata: { foo: 'bar' } };
      const spy = vi.spyOn(SearchService, 'search').mockResolvedValueOnce(mockResponse as any);
      const ctx = validContext({ query: 'q', conversationId: 'c', filters: { x: 1 }, options: { y: 2 } });
      const result = await handleSearchRoute(ctx as any);
      expect(spy).toHaveBeenCalledWith({ query: 'q', conversationId: 'c', filters: { x: 1 }, options: { y: 2 } }, ctx.env);
      expect(result).toBe(mockResponse);
    });
  });

  describe('handleExtractRoute', () => {
    it('should throw error if source or conversationId is missing', async () => {
      await expect(handleExtractRoute(validContext({}))).rejects.toThrow('Invalid request: missing source or conversationId');
      await expect(handleExtractRoute(validContext({ source: 'foo' }))).rejects.toThrow('Invalid request: missing source or conversationId');
      await expect(handleExtractRoute(validContext({ conversationId: 'bar' }))).rejects.toThrow('Invalid request: missing source or conversationId');
    });

    it('should call SearchService.extract with correct params and return response', async () => {
      const mockResponse = { results: ['b'], metadata: { bar: 'baz' } };
      const spy = vi.spyOn(SearchService, 'extract').mockResolvedValueOnce(mockResponse as any);
      const ctx = validContext({ source: 'test-source', conversationId: 'c2', filters: { x: 2 }, options: { y: 3 }, type: 'url' });
      const result = await handleExtractRoute(ctx as any);
      expect(spy).toHaveBeenCalledWith({ 
        query: 'test-source', 
        conversationId: 'c2', 
        filters: { x: 2 }, 
        options: { y: 3, type: 'url' } 
      }, ctx.env);
      expect(result).toBe(mockResponse);
    });
  });
});
