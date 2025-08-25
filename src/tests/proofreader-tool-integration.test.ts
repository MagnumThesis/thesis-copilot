/**
 * Proofreader Tool Integration Tests
 * Tests the integration between Proofreader, Builder, and Idealist tools
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Proofreader } from '@/components/ui/proofreader';
import { contentRetrievalService } from '@/lib/content-retrieval-service';
import { fetchIdeas } from '@/lib/idea-api';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

vi.mock('@/lib/idea-api', () => ({
  fetchIdeas: vi.fn()
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

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

describe('Proofreader Tool Integration Tests', () => {
  const mockConversationId = 'test-conversation-123';
  const mockConversation = { title: 'Test Thesis', id: mockConversationId };

  const mockBuilderContent = `# Thesis Proposal

## Introduction
This is a comprehensive thesis proposal about machine learning applications in healthcare.

## Literature Review
Previous research has shown significant potential for AI in medical diagnosis.

## Methodology
We will use supervised learning algorithms to analyze medical imaging data.`;

  const mockIdeaDefinitions = [
    {
      id: 1,
      title: 'Machine Learning',
      description: 'A subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed.',
      conversationid: mockConversationId
    },
    {
      id: 2,
      title: 'Medical Imaging',
      description: 'The technique and process of creating visual representations of the interior of a body for clinical analysis and medical intervention.',
      conversationid: mockConversationId
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage to return Builder content
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === `builder-content-${mockConversationId}`) {
        return JSON.stringify({
          content: mockBuilderContent,
          lastModified: new Date().toISOString()
        });
      }
      return null;
    });

    // Mock idea API
    vi.mocked(fetchIdeas).mockResolvedValue(mockIdeaDefinitions);

    // Mock fetch responses
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/proofreader/concerns/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ concerns: [] })
        });
      }
      if (url.includes('/api/ideas?conversationId=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockIdeaDefinitions)
        });
      }
      if (url.includes('/api/proofreader/analyze')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            concerns: [
              {
                id: 'concern-1',
                conversationId: mockConversationId,
                category: 'CLARITY',
                severity: 'medium',
                title: 'Unclear terminology usage',
                description: 'The term "machine learning" could be better defined in context.',
                suggestions: ['Provide a clear definition when first introducing the term'],
                status: 'to_be_done',
                createdAt: new Date(),
                updatedAt: new Date()
              }
            ]
          })
        });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Content Retrieval Integration', () => {
    it('should retrieve content from Builder tool', async () => {
      const result = await contentRetrievalService.retrieveBuilderContent(mockConversationId);
      
      expect(result.success).toBe(true);
      expect(result.builderContent).toBeDefined();
      expect(result.builderContent?.content).toContain('machine learning applications');
    });

    it('should retrieve idea definitions from Idealist tool', async () => {
      const ideas = await contentRetrievalService.retrieveIdeaDefinitions(mockConversationId);
      
      expect(ideas).toHaveLength(2);
      expect(ideas[0].title).toBe('Machine Learning');
      expect(ideas[1].title).toBe('Medical Imaging');
    });

    it('should retrieve all content for comprehensive analysis', async () => {
      const result = await contentRetrievalService.retrieveAllContent(mockConversationId);
      
      expect(result.success).toBe(true);
      expect(result.builderContent).toBeDefined();
      expect(result.ideaDefinitions).toHaveLength(2);
    });

    it('should handle missing Builder content gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/chats/')) {
          return Promise.resolve({
            ok: false,
            status: 404
          });
        }
        return Promise.reject(new Error('Unexpected fetch call'));
      });

      const result = await contentRetrievalService.retrieveBuilderContent(mockConversationId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Integration Status Display', () => {
    it('should display integration status in proofreader UI', async () => {
      render(
        React.createElement(Proofreader, {
          isOpen: true,
          onClose: () => {},
          currentConversation: mockConversation
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Tool Integration Status')).toBeInTheDocument();
      });

      expect(screen.getByText('Builder Tool:')).toBeInTheDocument();
      expect(screen.getByText('Idealist Tool:')).toBeInTheDocument();
      expect(screen.getByText('Connected with content')).toBeInTheDocument();
      expect(screen.getByText('2 ideas')).toBeInTheDocument();
    });

    it('should show warning when Builder has no content', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        content: '# Thesis Proposal\n\nStart writing...',
        lastModified: new Date().toISOString()
      }));

      render(
        React.createElement(Proofreader, {
          isOpen: true,
          onClose: () => {},
          currentConversation: mockConversation
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Connected but no content')).toBeInTheDocument();
      });
    });

    it('should show idea count from Idealist integration', async () => {
      render(
        React.createElement(Proofreader, {
          isOpen: true,
          onClose: () => {},
          currentConversation: mockConversation
        })
      );

      await waitFor(() => {
        expect(screen.getByText('2 ideas')).toBeInTheDocument();
      });
    });
  });

  describe('Analysis with Tool Integration', () => {
    it('should perform analysis using both Builder content and Idealist ideas', async () => {
      render(
        React.createElement(Proofreader, {
          isOpen: true,
          onClose: () => {},
          currentConversation: mockConversation
        })
      );

      const analyzeButton = screen.getByText('Analyze Content');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/Retrieving thesis content/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Loading idea definitions from Idealist tool/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Found 2 idea definitions for context/)).toBeInTheDocument();
      });

      // Verify the analysis request includes both content and ideas
      await waitFor(() => {
        const analyzeCall = mockFetch.mock.calls.find(call => 
          call[0].includes('/api/proofreader/analyze')
        );
        expect(analyzeCall).toBeDefined();
        
        const requestBody = JSON.parse(analyzeCall[1].body);
        expect(requestBody.documentContent).toContain('machine learning applications');
        expect(requestBody.ideaDefinitions).toHaveLength(2);
        expect(requestBody.ideaDefinitions[0].title).toBe('Machine Learning');
      });
    });

    it('should handle analysis when no ideas are available', async () => {
      vi.mocked(fetchIdeas).mockResolvedValue([]);
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/ideas?conversationId=')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          });
        }
        if (url.includes('/api/proofreader/concerns/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ concerns: [] })
          });
        }
        if (url.includes('/api/proofreader/analyze')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              concerns: []
            })
          });
        }
        return Promise.reject(new Error('Unexpected fetch call'));
      });

      render(
        React.createElement(Proofreader, {
          isOpen: true,
          onClose: () => {},
          currentConversation: mockConversation
        })
      );

      const analyzeButton = screen.getByText('Analyze Content');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/No idea definitions found - analysis will proceed without contextual information/)).toBeInTheDocument();
      });
    });

    it('should show error when Builder content is insufficient', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        content: 'Short content',
        lastModified: new Date().toISOString()
      }));

      render(
        React.createElement(Proofreader, {
          isOpen: true,
          onClose: () => {},
          currentConversation: mockConversation
        })
      );

      const analyzeButton = screen.getByText('Analyze Content');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/Content is too short for meaningful analysis/)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Content Updates', () => {
    it('should detect when Builder content changes', async () => {
      render(
        React.createElement(Proofreader, {
          isOpen: true,
          onClose: () => {},
          currentConversation: mockConversation
        })
      );

      // Simulate content change in Builder
      contentRetrievalService.storeBuilderContent(mockConversationId, 'Updated content');
      contentRetrievalService.invalidateCache(mockConversationId, 'builder');

      // Wait for the subscription to detect the change
      await waitFor(() => {
        expect(screen.getByText(/Content may have changed - consider re-analyzing/)).toBeInTheDocument();
      }, { timeout: 6000 });
    });

    it('should update integration status when ideas change', async () => {
      render(
        React.createElement(Proofreader, {
          isOpen: true,
          onClose: () => {},
          currentConversation: mockConversation
        })
      );

      // Initially shows 2 ideas
      await waitFor(() => {
        expect(screen.getByText('2 ideas')).toBeInTheDocument();
      });

      // Simulate idea change
      vi.mocked(fetchIdeas).mockResolvedValue([...mockIdeaDefinitions, {
        id: 3,
        title: 'Healthcare AI',
        description: 'AI applications in healthcare settings',
        conversationid: mockConversationId
      }]);

      contentRetrievalService.invalidateCache(mockConversationId, 'ideas');

      // Should eventually show 3 ideas
      await waitFor(() => {
        expect(screen.getByText('3 ideas')).toBeInTheDocument();
      }, { timeout: 6000 });
    });
  });

  describe('Error Handling in Integration', () => {
    it('should handle Builder tool connection errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      render(
        React.createElement(Proofreader, {
          isOpen: true,
          onClose: () => {},
          currentConversation: mockConversation
        })
      );

      const analyzeButton = screen.getByText('Analyze Content');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
          expect.stringContaining('No content available for analysis')
        );
      });
    });

    it('should handle Idealist tool API errors gracefully', async () => {
      vi.mocked(fetchIdeas).mockRejectedValue(new Error('API error'));
      mockFetch.mockImplementation((url) => {
        if (url.includes('/api/ideas?conversationId=')) {
          return Promise.reject(new Error('API error'));
        }
        if (url.includes('/api/proofreader/concerns/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ concerns: [] })
          });
        }
        if (url.includes('/api/proofreader/analyze')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              concerns: []
            })
          });
        }
        return Promise.reject(new Error('Unexpected fetch call'));
      });

      render(
        React.createElement(Proofreader, {
          isOpen: true,
          onClose: () => {},
          currentConversation: mockConversation
        })
      );

      const analyzeButton = screen.getByText('Analyze Content');
      fireEvent.click(analyzeButton);

      // Should still proceed with analysis even if ideas can't be loaded
      await waitFor(() => {
        expect(screen.getByText(/No idea definitions found - analysis will proceed without contextual information/)).toBeInTheDocument();
      });
    });
  });

  describe('Cache Management', () => {
    it('should invalidate cache when Builder content changes', () => {
      const spy = vi.spyOn(contentRetrievalService, 'invalidateCache');
      
      contentRetrievalService.storeBuilderContent(mockConversationId, 'New content');
      
      expect(spy).toHaveBeenCalledWith(mockConversationId, 'builder');
    });

    it('should clear all cache when requested', () => {
      // Store some content first
      contentRetrievalService.storeBuilderContent(mockConversationId, 'Test content');
      
      // Clear all cache
      contentRetrievalService.clearAllCache();
      
      // Verify cache is cleared by checking if fresh API call is made
      const spy = vi.spyOn(mockLocalStorage, 'getItem');
      contentRetrievalService.retrieveBuilderContent(mockConversationId);
      
      expect(spy).toHaveBeenCalled();
    });
  });
});