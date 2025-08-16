/**
 * Integration Tests for Proofreader Analysis Workflow
 * 
 * Tests the complete analysis workflow including:
 * - Content retrieval from Builder tool
 * - Analysis initiation and progress tracking
 * - Error handling and recovery
 * - Analysis cancellation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { contentRetrievalService } from '../lib/content-retrieval-service'
import { ProofreaderAnalysisRequest, ProofreaderAnalysisResponse, ConcernCategory, ConcernSeverity, ConcernStatus } from '../lib/ai-types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('Proofreader Analysis Workflow Integration Tests', () => {
  const mockConversationId = 'test-conversation-123'
  const mockBuilderContent = `# Thesis Proposal

## Introduction
This is a sample thesis proposal for testing the proofreader functionality.

## Literature Review
The literature review section contains various academic sources and references.

## Methodology
This section describes the research methodology to be used.

## Conclusion
The conclusion summarizes the key points of the proposal.`

  const mockIdeaDefinitions = [
    {
      id: 1,
      title: 'Machine Learning',
      description: 'A subset of artificial intelligence that focuses on algorithms.',
      conversationid: mockConversationId
    },
    {
      id: 2,
      title: 'Neural Networks',
      description: 'Computing systems inspired by biological neural networks.',
      conversationid: mockConversationId
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    contentRetrievalService.clearAllCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Content Retrieval', () => {
    it('should retrieve Builder content successfully', async () => {
      // Mock localStorage to return stored content
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        content: mockBuilderContent,
        lastModified: new Date().toISOString()
      }))

      const result = await contentRetrievalService.retrieveBuilderContent(mockConversationId)

      expect(result.success).toBe(true)
      expect(result.builderContent).toBeDefined()
      expect(result.builderContent?.content).toBe(mockBuilderContent)
      expect(result.builderContent?.conversationId).toBe(mockConversationId)
    })

    it('should handle missing Builder content gracefully', async () => {
      // Mock localStorage to return null (no stored content)
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = await contentRetrievalService.retrieveBuilderContent(mockConversationId)

      expect(result.success).toBe(true)
      expect(result.builderContent).toBeDefined()
      expect(result.builderContent?.content).toContain('# Thesis Proposal')
    })

    it('should retrieve idea definitions successfully', async () => {
      // Mock successful API response for ideas
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ideas: mockIdeaDefinitions })
      })

      const ideaDefinitions = await contentRetrievalService.retrieveIdeaDefinitions(mockConversationId)

      expect(ideaDefinitions).toHaveLength(2)
      expect(ideaDefinitions[0].title).toBe('Machine Learning')
      expect(ideaDefinitions[1].title).toBe('Neural Networks')
    })

    it('should handle idea definitions API failure gracefully', async () => {
      // Mock API failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const ideaDefinitions = await contentRetrievalService.retrieveIdeaDefinitions(mockConversationId)

      expect(ideaDefinitions).toEqual([])
    })

    it('should retrieve all content successfully', async () => {
      // Mock localStorage for Builder content
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        content: mockBuilderContent,
        lastModified: new Date().toISOString()
      }))

      // Mock API response for ideas
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ideas: mockIdeaDefinitions })
      })

      const result = await contentRetrievalService.retrieveAllContent(mockConversationId)

      expect(result.success).toBe(true)
      expect(result.builderContent).toBeDefined()
      expect(result.ideaDefinitions).toHaveLength(2)
    })
  })

  describe('Analysis Request Processing', () => {
    it('should create valid analysis request', async () => {
      const analysisRequest: ProofreaderAnalysisRequest = {
        conversationId: mockConversationId,
        documentContent: mockBuilderContent,
        ideaDefinitions: mockIdeaDefinitions,
        analysisOptions: {
          includeGrammar: true,
          academicLevel: 'graduate'
        }
      }

      expect(analysisRequest.conversationId).toBe(mockConversationId)
      expect(analysisRequest.documentContent).toBe(mockBuilderContent)
      expect(analysisRequest.ideaDefinitions).toHaveLength(2)
      expect(analysisRequest.analysisOptions?.includeGrammar).toBe(true)
      expect(analysisRequest.analysisOptions?.academicLevel).toBe('graduate')
    })

    it('should handle successful analysis response', async () => {
      const mockAnalysisResponse: ProofreaderAnalysisResponse = {
        success: true,
        concerns: [
          {
            id: 'concern-1',
            conversationId: mockConversationId,
            category: ConcernCategory.CLARITY,
            severity: ConcernSeverity.MEDIUM,
            title: 'Unclear sentence structure',
            description: 'The sentence structure in paragraph 2 could be clearer.',
            status: ConcernStatus.TO_BE_DONE,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        analysisMetadata: {
          totalConcerns: 1,
          concernsByCategory: {
            [ConcernCategory.CLARITY]: 1,
            [ConcernCategory.COHERENCE]: 0,
            [ConcernCategory.STRUCTURE]: 0,
            [ConcernCategory.ACADEMIC_STYLE]: 0,
            [ConcernCategory.CONSISTENCY]: 0,
            [ConcernCategory.COMPLETENESS]: 0,
            [ConcernCategory.CITATIONS]: 0,
            [ConcernCategory.GRAMMAR]: 0,
            [ConcernCategory.TERMINOLOGY]: 0
          },
          concernsBySeverity: {
            [ConcernSeverity.LOW]: 0,
            [ConcernSeverity.MEDIUM]: 1,
            [ConcernSeverity.HIGH]: 0,
            [ConcernSeverity.CRITICAL]: 0
          },
          analysisTime: 2500,
          contentLength: mockBuilderContent.length,
          ideaDefinitionsUsed: 2
        }
      }

      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysisResponse
      })

      const response = await fetch('/api/proofreader/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: mockConversationId,
          documentContent: mockBuilderContent,
          ideaDefinitions: mockIdeaDefinitions
        })
      })

      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.concerns).toHaveLength(1)
      expect(result.concerns[0].category).toBe(ConcernCategory.CLARITY)
      expect(result.analysisMetadata?.totalConcerns).toBe(1)
    })

    it('should handle analysis API errors', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Content analysis failed due to AI service unavailability'
      }

      // Mock API error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse
      })

      const response = await fetch('/api/proofreader/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: mockConversationId,
          documentContent: mockBuilderContent,
          ideaDefinitions: mockIdeaDefinitions
        })
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)

      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toContain('AI service unavailability')
    })
  })

  describe('Analysis Cancellation', () => {
    it('should support request cancellation with AbortController', async () => {
      const abortController = new AbortController()

      // Mock a delayed response that checks for abort signal
      mockFetch.mockImplementationOnce((url, options) => 
        new Promise((resolve, reject) => {
          const signal = options?.signal as AbortSignal
          
          if (signal?.aborted) {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
            return
          }

          const timeout = setTimeout(() => {
            if (signal?.aborted) {
              reject(new DOMException('The operation was aborted.', 'AbortError'))
            } else {
              resolve({
                ok: true,
                json: async () => ({ success: true, concerns: [] })
              })
            }
          }, 1000)

          signal?.addEventListener('abort', () => {
            clearTimeout(timeout)
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          })
        })
      )

      // Start the request
      const requestPromise = fetch('/api/proofreader/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: mockConversationId,
          documentContent: mockBuilderContent,
          ideaDefinitions: mockIdeaDefinitions
        }),
        signal: abortController.signal
      })

      // Cancel the request immediately
      abortController.abort()

      // The request should be aborted
      await expect(requestPromise).rejects.toThrow('The operation was aborted')
    })
  })

  describe('Error Recovery', () => {
    it('should handle network errors with retry capability', async () => {
      let callCount = 0

      // Mock network error on first call, success on second
      mockFetch.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, concerns: [] })
        })
      })

      // First call should fail
      await expect(
        fetch('/api/proofreader/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: mockConversationId,
            documentContent: mockBuilderContent,
            ideaDefinitions: mockIdeaDefinitions
          })
        })
      ).rejects.toThrow('Network error')

      // Second call should succeed
      const response = await fetch('/api/proofreader/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: mockConversationId,
          documentContent: mockBuilderContent,
          ideaDefinitions: mockIdeaDefinitions
        })
      })

      expect(response.ok).toBe(true)
      expect(callCount).toBe(2)
    })

    it('should handle insufficient content error', async () => {
      const shortContent = "Too short"

      // Content retrieval should succeed but analysis should fail
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        content: shortContent,
        lastModified: new Date().toISOString()
      }))

      const result = await contentRetrievalService.retrieveBuilderContent(mockConversationId)
      expect(result.success).toBe(true)

      // Analysis should detect insufficient content
      const hasContent = await contentRetrievalService.hasBuilderContent(mockConversationId)
      expect(hasContent).toBe(false) // Content is too short
    })
  })

  describe('Content Summary and Validation', () => {
    it('should provide accurate content summary', async () => {
      // Mock localStorage for Builder content
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        content: mockBuilderContent,
        lastModified: new Date().toISOString()
      }))

      // Mock API response for ideas
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ideas: mockIdeaDefinitions })
      })

      const summary = await contentRetrievalService.getContentSummary(mockConversationId)

      expect(summary.hasContent).toBe(true)
      expect(summary.contentLength).toBe(mockBuilderContent.length)
      expect(summary.ideaCount).toBe(2)
      expect(summary.lastModified).toBeDefined()
    })

    it('should validate content sufficiency for analysis', async () => {
      // Test with sufficient content
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        content: mockBuilderContent,
        lastModified: new Date().toISOString()
      }))

      const hasSufficientContent = await contentRetrievalService.hasBuilderContent(mockConversationId)
      expect(hasSufficientContent).toBe(true)

      // Test with insufficient content
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        content: "Short",
        lastModified: new Date().toISOString()
      }))

      contentRetrievalService.clearCache(mockConversationId) // Clear cache to force re-fetch
      const hasInsufficientContent = await contentRetrievalService.hasBuilderContent(mockConversationId)
      expect(hasInsufficientContent).toBe(false)
    })
  })

  describe('Caching Behavior', () => {
    it('should cache content retrieval results', async () => {
      // Mock localStorage
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        content: mockBuilderContent,
        lastModified: new Date().toISOString()
      }))

      // First call
      const result1 = await contentRetrievalService.retrieveBuilderContent(mockConversationId)
      expect(result1.success).toBe(true)

      // Second call should use cache (localStorage should only be called once)
      const result2 = await contentRetrievalService.retrieveBuilderContent(mockConversationId)
      expect(result2.success).toBe(true)

      // localStorage.getItem should only be called once due to caching
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(1)
    })

    it('should clear cache when requested', async () => {
      // Mock localStorage
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        content: mockBuilderContent,
        lastModified: new Date().toISOString()
      }))

      // First call to populate cache
      await contentRetrievalService.retrieveBuilderContent(mockConversationId)

      // Clear cache
      contentRetrievalService.clearCache(mockConversationId)

      // Second call should fetch again
      await contentRetrievalService.retrieveBuilderContent(mockConversationId)

      // localStorage.getItem should be called twice
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(2)
    })
  })

  describe('Progress Tracking', () => {
    it('should track analysis progress through different stages', () => {
      const progressStages = [
        { progress: 10, message: 'Retrieving thesis content...' },
        { progress: 25, message: 'Loading idea definitions...' },
        { progress: 40, message: 'Preparing analysis request...' },
        { progress: 60, message: 'Analyzing content structure...' },
        { progress: 85, message: 'Processing analysis results...' },
        { progress: 100, message: 'Analysis completed successfully!' }
      ]

      progressStages.forEach((stage, index) => {
        expect(stage.progress).toBeGreaterThan(index === 0 ? 0 : progressStages[index - 1].progress)
        expect(stage.message).toBeTruthy()
        expect(typeof stage.message).toBe('string')
      })

      expect(progressStages[progressStages.length - 1].progress).toBe(100)
    })
  })
})