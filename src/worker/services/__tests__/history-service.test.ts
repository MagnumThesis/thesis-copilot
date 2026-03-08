// src/worker/services/__tests__/history-service.test.ts
// Unit tests for HistoryService business logic

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryService, HistoryServiceRequest, HistoryServiceResponse } from '../history-service';

describe('HistoryService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getHistory', () => {
    it('should fallback to pagination defaults if no environment is provided', async () => {
      const request: HistoryServiceRequest = {
        conversationId: 'conv-123',
        limit: 25,
        offset: 50,
        metadata: { userId: 'user-123' }
      };

      const response = await HistoryService.getHistory(request);

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('data');
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.total).toBe(0);
      expect(response.metadata).toMatchObject({
        conversationId: 'conv-123',
        limit: 25,
        offset: 50,
        hasMore: false,
        warning: 'No environment provided for database connection'
      });
    });

    it('should use default limit and offset if not provided and no environment', async () => {
      const request: HistoryServiceRequest = {
        conversationId: 'conv-default'
      };

      const response = await HistoryService.getHistory(request);

      expect(response).toHaveProperty('success', true);
      expect(response.metadata).toMatchObject({
        conversationId: 'conv-default',
        limit: 10,
        offset: 0,
        hasMore: false
      });
    });

    it('should ignore negative limit and offset values and use defaults when no env', async () => {
      const request: HistoryServiceRequest = {
        conversationId: 'conv-negative',
        limit: -5,
        offset: -10
      };

      const response = await HistoryService.getHistory(request);

      expect(response).toHaveProperty('success', true);
      expect(response.metadata).toMatchObject({
        conversationId: 'conv-negative',
        limit: 10,
        offset: 0,
        hasMore: false
      });
    });

    it('should validate conversationId', async () => {
      const invalidRequest: HistoryServiceRequest = {
        conversationId: '',
        limit: 10
      };

      await expect(HistoryService.getHistory(invalidRequest)).rejects.toThrow('Invalid request: missing conversationId');
    });
  });

  describe('saveHistory', () => {
    it('should return successfully when data and conversationId are provided', async () => {
      const request: HistoryServiceRequest = {
        conversationId: 'conv-789',
        data: {
          query: 'machine learning',
          results: [{ id: 'paper-1', title: 'ML Paper' }],
          timestamp: '2023-01-01T12:00:00Z'
        }
      };
      
      const response = await HistoryService.saveHistory(request);

      expect(response.success).toBe(true);
      expect(response.entry).toHaveProperty('id');
      expect(response.entry).toHaveProperty('savedAt');
      expect(response.entry.conversationId).toBe('conv-789');
      expect(response.entry.query).toBe('machine learning');
    });

    it('should handle different data types successfully', async () => {
      const searchHistoryRequest: HistoryServiceRequest = {
        conversationId: 'conv-search',
        data: {
          type: 'search',
          query: 'quantum computing',
          filters: { year: 2023 },
          resultCount: 45,
          searchTime: 230
        },
        metadata: {
          userAgent: 'research-tool',
          sessionId: 'session-abc'
        }
      };

      const response1 = await HistoryService.saveHistory(searchHistoryRequest);
      expect(response1.success).toBe(true);
      expect(response1.metadata.userAgent).toBe('research-tool');
      expect(response1.entry.type).toBe('search');

      const downloadHistoryRequest: HistoryServiceRequest = {
        conversationId: 'conv-download',
        data: {
          type: 'download',
          paperId: 'arxiv-2023-001',
          downloadUrl: 'https://example.com/paper.pdf',
          downloadTime: '2023-01-01T14:30:00Z'
        },
        metadata: {
          fileSize: 2048576,
          downloadDuration: 3500
        }
      };

      const response2 = await HistoryService.saveHistory(downloadHistoryRequest);
      expect(response2.success).toBe(true);
      expect(response2.entry.type).toBe('download');
    });

    it('should validate required fields', async () => {
      const invalidDataRequest: HistoryServiceRequest = {
        conversationId: 'conv-invalid',
        data: null
      };

      await expect(HistoryService.saveHistory(invalidDataRequest)).rejects.toThrow('Invalid request: missing data');

      const missingConvIdRequest: HistoryServiceRequest = {
        data: { foo: 'bar' }
      };

      await expect(HistoryService.saveHistory(missingConvIdRequest)).rejects.toThrow('Invalid request: missing conversationId');
    });
  });

  describe('clearHistory', () => {
    it('should throw error if conversationId is not provided', async () => {
      const request: HistoryServiceRequest = {
        env: {}
      };

      await expect(HistoryService.clearHistory(request)).rejects.toThrow('conversationId is required to clear history');
    });

    it('should throw error if env is not provided', async () => {
      const request: HistoryServiceRequest = {
        conversationId: 'conv-123'
      };

      await expect(HistoryService.clearHistory(request)).rejects.toThrow('env is required to clear history');
    });

  });

  describe('deleteHistory', () => {
    // Tests for specific and full conversation deletion
    // since we use a real or mocked Supabase client, we would mock it out here in a real unit test
    // For now we test that it requires conversationId
    it('should require conversationId', async () => {
      const request: HistoryServiceRequest = {};
      
      await expect(HistoryService.deleteHistory(request)).rejects.toThrow('conversationId is required for deletion');
    });
  });

  describe('getSuccessTracking', () => {
    it('should throw error if conversationId is missing', async () => {
      const invalidRequest: HistoryServiceRequest = {
        metadata: { operation: 'get-success-tracking' }
      };

      await expect(HistoryService.getSuccessTracking(invalidRequest)).rejects.toThrow('Invalid request: missing conversationId');
    });

    it('should return default tracking data when conversationId is provided', async () => {
      const request: HistoryServiceRequest = {
        conversationId: 'conv-tracking',
        metadata: { operation: 'get-success-tracking' }
      };

      const response = await HistoryService.getSuccessTracking(request);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.length).toBe(1);

      const trackingData = response.data![0];
      expect(trackingData.conversationId).toBe('conv-tracking');
      expect(trackingData.successfulRequests).toBe(0);
      expect(trackingData.totalRequests).toBe(0);
      expect(trackingData.successRate).toBe(0);
      expect(trackingData.lastSuccessfulAction).toBeNull();

      expect(response.metadata.operation).toBe('get-success-tracking');
      expect(response.metadata.timestamp).toBeDefined();
    });
  });

  describe('getNextBatch', () => {
    it('should fallback to pagination defaults if no environment is provided', async () => {
      const request: HistoryServiceRequest = {
        conversationId: 'conv-page-1',
        limit: 25,
        offset: 50,
        metadata: { userId: 'user-123' }
      };

      const response = await HistoryService.getNextBatch(request);

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('data');
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.total).toBe(0);
      expect(response.metadata).toMatchObject({
        conversationId: 'conv-page-1',
        userId: 'user-123',
        limit: 25,
        offset: 50,
        hasMore: false,
        warning: 'No environment provided for database connection'
      });
    });

    it('should use default limit and offset if not provided and no environment', async () => {
      const request: HistoryServiceRequest = {
        conversationId: 'conv-default'
      };

      const response = await HistoryService.getNextBatch(request);

      expect(response).toHaveProperty('success', true);
      expect(response.metadata).toMatchObject({
        conversationId: 'conv-default',
        userId: 'anonymous',
        limit: 10,
        offset: 0,
        hasMore: false
      });
    });

    it('should ignore negative limit and offset values and use defaults when no env', async () => {
      const request: HistoryServiceRequest = {
        conversationId: 'conv-negative',
        limit: -5,
        offset: -10
      };

      const response = await HistoryService.getNextBatch(request);

      expect(response).toHaveProperty('success', true);
      expect(response.metadata).toMatchObject({
        conversationId: 'conv-negative',
        userId: 'anonymous',
        limit: 10,
        offset: 0,
        hasMore: false
      });
    });
  });

  describe('searchHistory', () => {
    it('should throw not implemented error currently', async () => {
      const request: HistoryServiceRequest = {
        query: 'search term',
        conversationId: 'conv-search-history'
      };
      
      await expect(HistoryService.searchHistory(request)).rejects.toThrow('Not implemented: HistoryService.searchHistory');
    });

    it('should handle cross-conversation search when implemented', async () => {
      const globalSearchRequest: HistoryServiceRequest = {
        query: 'neural networks',
        // No conversationId means search across all conversations
        filters: {
          dateRange: { start: '2023-01-01', end: '2023-12-31' },
          entryType: 'search',
          minResultCount: 5
        },
        limit: 20,
        offset: 0
      };

      await expect(HistoryService.searchHistory(globalSearchRequest)).rejects.toThrow('Not implemented');
    });

    it('should handle conversation-specific search when implemented', async () => {
      const conversationSearchRequest: HistoryServiceRequest = {
        query: 'quantum algorithms',
        conversationId: 'conv-quantum',
        filters: {
          entryType: ['search', 'download'],
          hasResults: true
        },
        limit: 10
      };

      await expect(HistoryService.searchHistory(conversationSearchRequest)).rejects.toThrow('Not implemented');
    });

    it('should validate search query when implemented', async () => {
      const emptyQueryRequest: HistoryServiceRequest = {
        query: '',
        conversationId: 'conv-empty-query'
      };

      await expect(HistoryService.searchHistory(emptyQueryRequest)).rejects.toThrow('Not implemented');
    });
  });

  describe('exportHistory', () => {
    it('should validate conversationId', async () => {
      const request: HistoryServiceRequest = {};
      await expect(HistoryService.exportHistory(request)).rejects.toThrow('Conversation ID is required for export');
    });

    it('should return exported history in json format by default', async () => {
      const request: HistoryServiceRequest = {
        conversationId: 'conv-123'
      };
      const response = await HistoryService.exportHistory(request);
      expect(response.success).toBe(true);
      expect(response.metadata.format).toBe('json');
      expect(response.metadata.conversationId).toBe('conv-123');
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data?.length).toBe(1);
      expect(typeof response.data?.[0]).toBe('string');
      expect(response.data?.[0]).toBe('[]');
    });

    it('should return exported history in csv format when specified', async () => {
      const request: HistoryServiceRequest = {
        conversationId: 'conv-456',
        metadata: { format: 'csv' }
      };
      const response = await HistoryService.exportHistory(request);
      expect(response.success).toBe(true);
      expect(response.metadata.format).toBe('csv');
      expect(response.metadata.conversationId).toBe('conv-456');
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data?.length).toBe(1);
      expect(typeof response.data?.[0]).toBe('string');
      expect(response.data?.[0]).toContain('id,timestamp,query,sources,total_results,accepted,rejected');
    });
  });

  describe('service response format', () => {
    it('should return properly structured response when implemented', () => {
      // Test getHistory response
      const getHistoryResponse: HistoryServiceResponse = {
        success: true,
        data: [
          {
            id: 'entry-1',
            type: 'search',
            query: 'machine learning',
            timestamp: '2023-01-01T12:00:00Z',
            resultCount: 15
          },
          {
            id: 'entry-2', 
            type: 'download',
            paperId: 'arxiv-2023-001',
            timestamp: '2023-01-01T12:05:00Z'
          }
        ],
        total: 25,
        metadata: {
          conversationId: 'conv-123',
          pageSize: 10,
          currentPage: 1
        }
      };

      expect(getHistoryResponse).toHaveProperty('success');
      expect(getHistoryResponse).toHaveProperty('data');
      expect(getHistoryResponse).toHaveProperty('total');
      expect(getHistoryResponse.data).toBeInstanceOf(Array);

      // Test saveHistory response
      const saveHistoryResponse: HistoryServiceResponse = {
        success: true,
        entry: {
          id: 'entry-new',
          conversationId: 'conv-456',
          savedAt: '2023-01-01T15:00:00Z'
        },
        metadata: {
          entrySize: 1024,
          storageLocation: 'primary'
        }
      };

      expect(saveHistoryResponse).toHaveProperty('entry');
      expect(saveHistoryResponse.entry).toHaveProperty('id');

      // Test deleteHistory response
      const deleteHistoryResponse: HistoryServiceResponse = {
        success: true,
        metadata: {
          deletedCount: 5,
          deletedAt: '2023-01-01T16:00:00Z',
          conversationId: 'conv-789'
        }
      };

      expect(deleteHistoryResponse).toHaveProperty('success');
      expect(deleteHistoryResponse.success).toBe(true);

      // Test searchHistory response
      const searchHistoryResponse: HistoryServiceResponse = {
        success: true,
        data: [
          {
            id: 'match-1',
            relevanceScore: 0.95,
            matchedFields: ['query', 'results'],
            entry: {
              id: 'entry-123',
              query: 'deep learning applications',
              timestamp: '2023-01-01T10:00:00Z'
            }
          }
        ],
        total: 3,
        metadata: {
          searchQuery: 'deep learning',
          searchTime: 45,
          totalScanned: 1000
        }
      };

      expect(searchHistoryResponse).toHaveProperty('data');
      expect(searchHistoryResponse.data?.[0]).toHaveProperty('relevanceScore');
    });
  });
});
