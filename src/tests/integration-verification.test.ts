/**
 * Integration Verification Test
 * Simple test to verify the proofreader integration with Builder and Idealist tools
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { contentRetrievalService } from '@/lib/content-retrieval-service';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Integration Verification', () => {
  const mockConversationId = 'test-conversation-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should integrate with Builder tool content storage', async () => {
    // Mock Builder content in localStorage
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
      content: '# Test Thesis\n\nThis is test content for analysis.',
      lastModified: new Date().toISOString()
    }));

    const result = await contentRetrievalService.retrieveBuilderContent(mockConversationId);

    expect(result.success).toBe(true);
    expect(result.builderContent).toBeDefined();
    expect(result.builderContent?.content).toContain('Test Thesis');
  });

  it('should integrate with Idealist tool API', async () => {
    // Mock Idealist API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        {
          id: 1,
          title: 'Test Idea',
          description: 'A test idea definition',
          conversationid: mockConversationId
        }
      ])
    });

    const ideas = await contentRetrievalService.retrieveIdeaDefinitions(mockConversationId);

    expect(ideas).toHaveLength(1);
    expect(ideas[0].title).toBe('Test Idea');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/ideas?conversationId=${mockConversationId}`)
    );
  });

  it('should retrieve both Builder content and Idealist ideas together', async () => {
    // Mock both Builder content and Idealist API
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
      content: '# Test Thesis\n\nThis is test content.',
      lastModified: new Date().toISOString()
    }));

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        {
          id: 1,
          title: 'Test Idea',
          description: 'A test idea definition',
          conversationid: mockConversationId
        }
      ])
    });

    const result = await contentRetrievalService.retrieveAllContent(mockConversationId);

    expect(result.success).toBe(true);
    expect(result.builderContent).toBeDefined();
    expect(result.ideaDefinitions).toHaveLength(1);
    expect(result.builderContent?.content).toContain('Test Thesis');
    expect(result.ideaDefinitions?.[0].title).toBe('Test Idea');
  });

  it('should provide integration status', async () => {
    // Mock successful integrations
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
      content: '# Test Thesis\n\nThis is sufficient content for analysis with more than 50 characters.',
      lastModified: new Date().toISOString()
    }));

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, title: 'Idea 1', description: 'Description 1', conversationid: mockConversationId },
        { id: 2, title: 'Idea 2', description: 'Description 2', conversationid: mockConversationId }
      ])
    });

    const status = await contentRetrievalService.getIntegrationStatus(mockConversationId);

    expect(status.builderIntegration.connected).toBe(true);
    expect(status.builderIntegration.hasContent).toBe(true);
    expect(status.idealistIntegration.connected).toBe(true);
    expect(status.idealistIntegration.ideaCount).toBe(2);
  });

  it('should handle cache invalidation', () => {
    // Store some content
    contentRetrievalService.storeBuilderContent(mockConversationId, 'Test content');
    
    // Verify cache invalidation methods exist and can be called
    expect(() => {
      contentRetrievalService.invalidateCache(mockConversationId, 'builder');
      contentRetrievalService.invalidateCache(mockConversationId, 'ideas');
      contentRetrievalService.invalidateCache(mockConversationId, 'all');
      contentRetrievalService.clearCache(mockConversationId);
      contentRetrievalService.clearAllCache();
    }).not.toThrow();
  });

  it('should handle content change subscriptions', () => {
    // Test that subscription mechanism exists
    const callback = vi.fn();
    const unsubscribe = contentRetrievalService.subscribeToContentChanges(mockConversationId, callback);
    
    expect(typeof unsubscribe).toBe('function');
    
    // Clean up
    unsubscribe();
  });
});