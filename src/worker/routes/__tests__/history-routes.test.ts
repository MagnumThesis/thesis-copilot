// src/worker/routes/__tests__/history-routes.test.ts
// Unit tests for history route handlers

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  handleGetHistoryRoute, 
  handleSaveHistoryRoute, 
  handleDeleteHistoryRoute, 
  handleSearchHistoryRoute 
} from '../history-routes';
import { HistoryService } from '../../services/history-service';

describe('history-routes', () => {
  const validContext = (body: any) => ({ request: { body } });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleGetHistoryRoute', () => {
    it('should throw error if conversationId is missing', async () => {
      await expect(handleGetHistoryRoute(validContext({}))).rejects.toThrow('Invalid request: missing conversationId');
      await expect(handleGetHistoryRoute(validContext({ limit: 10 }))).rejects.toThrow('Invalid request: missing conversationId');
    });

    it('should call HistoryService.getHistory with correct params and return response', async () => {
      const mockResponse = { success: true, data: [{ id: 1 }], metadata: { total: 1 } };
      const spy = vi.spyOn(HistoryService, 'getHistory').mockResolvedValueOnce(mockResponse as any);
      const ctx = validContext({ conversationId: 'c1', limit: 10, offset: 0, filters: { type: 'search' } });
      const result = await handleGetHistoryRoute(ctx as any);
      expect(spy).toHaveBeenCalledWith({ conversationId: 'c1', limit: 10, offset: 0, filters: { type: 'search' } });
      expect(result).toBe(mockResponse);
    });
  });

  describe('handleSaveHistoryRoute', () => {
    it('should throw error if conversationId or data is missing', async () => {
      await expect(handleSaveHistoryRoute(validContext({}))).rejects.toThrow('Invalid request: missing conversationId or data');
      await expect(handleSaveHistoryRoute(validContext({ conversationId: 'c1' }))).rejects.toThrow('Invalid request: missing conversationId or data');
      await expect(handleSaveHistoryRoute(validContext({ data: { test: true } }))).rejects.toThrow('Invalid request: missing conversationId or data');
    });

    it('should call HistoryService.saveHistory with correct params and return response', async () => {
      const mockResponse = { success: true, entry: { id: 'new-entry' }, metadata: { saved: true } };
      const spy = vi.spyOn(HistoryService, 'saveHistory').mockResolvedValueOnce(mockResponse as any);
      const ctx = validContext({ conversationId: 'c2', data: { query: 'test', result: 'success' }, metadata: { timestamp: '2023-01-01' } });
      const result = await handleSaveHistoryRoute(ctx as any);
      expect(spy).toHaveBeenCalledWith({ conversationId: 'c2', data: { query: 'test', result: 'success' }, metadata: { timestamp: '2023-01-01' } });
      expect(result).toBe(mockResponse);
    });
  });

  describe('handleDeleteHistoryRoute', () => {
    it('should throw error if conversationId is missing', async () => {
      await expect(handleDeleteHistoryRoute(validContext({}))).rejects.toThrow('Invalid request: missing conversationId');
      await expect(handleDeleteHistoryRoute(validContext({ entryId: 'entry1' }))).rejects.toThrow('Invalid request: missing conversationId');
    });

    it('should call HistoryService.deleteHistory with correct params and return response', async () => {
      const mockResponse = { success: true, metadata: { deleted: true } };
      const spy = vi.spyOn(HistoryService, 'deleteHistory').mockResolvedValueOnce(mockResponse as any);
      const ctx = validContext({ conversationId: 'c3', entryId: 'entry123' });
      const result = await handleDeleteHistoryRoute(ctx as any);
      expect(spy).toHaveBeenCalledWith({ conversationId: 'c3', entryId: 'entry123' });
      expect(result).toBe(mockResponse);
    });
  });

  describe('handleSearchHistoryRoute', () => {
    it('should throw error if query is missing', async () => {
      await expect(handleSearchHistoryRoute(validContext({}))).rejects.toThrow('Invalid request: missing query');
      await expect(handleSearchHistoryRoute(validContext({ conversationId: 'c1' }))).rejects.toThrow('Invalid request: missing query');
    });

    it('should call HistoryService.searchHistory with correct params and return response', async () => {
      const mockResponse = { success: true, data: [{ id: 1, match: 'test query' }], total: 1, metadata: { searchTime: 100 } };
      const spy = vi.spyOn(HistoryService, 'searchHistory').mockResolvedValueOnce(mockResponse as any);
      const ctx = validContext({ query: 'test search', conversationId: 'c4', filters: { dateRange: 'week' }, limit: 5, offset: 0 });
      const result = await handleSearchHistoryRoute(ctx as any);
      expect(spy).toHaveBeenCalledWith({ query: 'test search', conversationId: 'c4', filters: { dateRange: 'week' }, limit: 5, offset: 0 });
      expect(result).toBe(mockResponse);
    });
  });
});
