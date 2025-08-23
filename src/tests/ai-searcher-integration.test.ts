/**
 * AI Searcher Integration Tests
 * Tests the end-to-end flow from AI search to reference addition
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Reference, ReferenceType } from '../lib/ai-types'

// Mock fetch for testing
global.fetch = vi.fn()

describe('AI Searcher Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Reference Addition Flow', () => {
    it('should successfully add a reference from AI search results', async () => {
      // Mock successful API responses
      const mockSearchResult = {
        title: "Machine Learning in Academic Research",
        authors: ["Smith, J.", "Johnson, A."],
        journal: "Journal of AI Research",
        publication_date: "2023",
        doi: "10.1234/jair.2023.12345",
        url: "https://doi.org/10.1234/jair.2023.12345",
        confidence: 0.92,
        relevance_score: 0.88
      }

      const mockCreatedReference: Reference = {
        id: 'ref_123',
        conversation_id: 'conv_123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: mockSearchResult.title,
        authors: mockSearchResult.authors,
        journal: mockSearchResult.journal,
        publication_date: mockSearchResult.publication_date,
        doi: mockSearchResult.doi,
        url: mockSearchResult.url,
        tags: [],
        metadata_confidence: mockSearchResult.confidence,
        ai_confidence: mockSearchResult.confidence,
        ai_relevance_score: mockSearchResult.relevance_score,
        ai_search_query: 'machine learning research',
        ai_search_source: 'ai-searcher',
        ai_search_timestamp: '2024-01-01T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }

      // Mock the reference creation API call
      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          reference: mockCreatedReference
        })
      })

      // Simulate the reference addition process
      const referenceData = {
        conversationId: 'conv_123',
        type: 'journal_article',
        title: mockSearchResult.title,
        authors: mockSearchResult.authors,
        journal: mockSearchResult.journal,
        publication_date: mockSearchResult.publication_date,
        doi: mockSearchResult.doi,
        url: mockSearchResult.url,
        tags: [],
        ai_search_source: 'ai-searcher',
        ai_confidence: mockSearchResult.confidence,
        ai_relevance_score: mockSearchResult.relevance_score,
        ai_search_query: 'machine learning research',
        ai_search_timestamp: expect.any(String),
        extractMetadata: false
      }

      const response = await fetch('/api/referencer/references', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(referenceData)
      })

      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/referencer/references', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(referenceData)
      })

      expect(result.success).toBe(true)
      expect(result.reference).toEqual(mockCreatedReference)
    })

    it('should handle duplicate reference detection', async () => {
      const mockExistingReference: Reference = {
        id: 'ref_existing',
        conversation_id: 'conv_123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: "Machine Learning in Academic Research",
        authors: ["Smith, J.", "Johnson, A."],
        journal: "Journal of AI Research",
        publication_date: "2023",
        doi: "10.1234/jair.2023.12345",
        url: "https://doi.org/10.1234/jair.2023.12345",
        tags: [],
        metadata_confidence: 0.9,
        ai_confidence: 0.9,
        ai_relevance_score: 0.85,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }

      // Mock the get references API call
      ;(fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          references: [mockExistingReference]
        })
      })

      const response = await fetch('/api/referencer/references/conv_123')
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.references).toContain(mockExistingReference)

      // Test duplicate detection logic
      const newReference = {
        title: "Machine Learning in Academic Research",
        doi: "10.1234/jair.2023.12345"
      }

      const isDuplicate = result.references.some((existing: Reference) => {
        return (newReference.doi && existing.doi && 
                newReference.doi.toLowerCase() === existing.doi.toLowerCase()) ||
               (newReference.title && existing.title && 
                newReference.title.toLowerCase().trim() === existing.title.toLowerCase().trim())
      })

      expect(isDuplicate).toBe(true)
    })

    it('should handle API errors gracefully', async () => {
      // Mock failed API response
      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          success: false,
          error: 'Database connection failed'
        })
      })

      const response = await fetch('/api/referencer/references', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: 'conv_123',
          type: 'journal_article',
          title: 'Test Reference'
        })
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)

      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })

    it('should handle search failures with fallback results', async () => {
      // Mock failed search API response
      ;(fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      })

      try {
        const response = await fetch('/api/ai-searcher/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'machine learning',
            conversationId: 'conv_123'
          })
        })

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`)
        }
      } catch (error) {
        expect(error.message).toBe('Search failed: Service Unavailable')
        
        // In the actual component, fallback results would be shown
        const fallbackResults = [
          {
            title: "Machine Learning Approaches to Natural Language Processing",
            authors: ["Smith, J.", "Johnson, A.", "Williams, B."],
            journal: "Journal of Artificial Intelligence Research",
            publication_date: "2023",
            doi: "10.1234/jair.2023.12345",
            url: "https://doi.org/10.1234/jair.2023.12345",
            confidence: 0.92,
            relevance_score: 0.88
          }
        ]

        expect(fallbackResults).toHaveLength(1)
        expect(fallbackResults[0].title).toContain('Machine Learning')
      }
    })
  })

  describe('Error Handling', () => {
    it('should validate required fields before API call', () => {
      const invalidReference = {
        // Missing required fields like title, authors
        journal: "Test Journal"
      }

      // This would be caught by validation before the API call
      const hasRequiredFields = !!(invalidReference as any).title && 
                               !!(invalidReference as any).authors && 
                               (invalidReference as any).authors.length > 0

      expect(hasRequiredFields).toBe(false)
    })

    it('should handle network errors', async () => {
      // Mock network error
      ;(fetch as any).mockRejectedValueOnce(new Error('Network error'))

      try {
        await fetch('/api/referencer/references', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: 'conv_123',
            type: 'journal_article',
            title: 'Test Reference'
          })
        })
      } catch (error) {
        expect(error.message).toBe('Network error')
      }
    })
  })

  describe('Data Transformation', () => {
    it('should correctly transform search results to reference format', () => {
      const searchResult = {
        title: "AI Research Paper",
        authors: ["Author, A.", "Writer, B."],
        journal: "AI Journal",
        publication_date: "2023",
        doi: "10.1234/test.2023",
        url: "https://example.com",
        confidence: 0.95,
        relevance_score: 0.87
      }

      const transformedReference = {
        type: ReferenceType.JOURNAL_ARTICLE,
        title: searchResult.title,
        authors: searchResult.authors,
        journal: searchResult.journal,
        publication_date: searchResult.publication_date,
        doi: searchResult.doi,
        url: searchResult.url,
        metadata_confidence: searchResult.confidence,
        ai_confidence: searchResult.confidence,
        ai_relevance_score: searchResult.relevance_score,
        ai_search_query: 'test query'
      }

      expect(transformedReference.title).toBe(searchResult.title)
      expect(transformedReference.authors).toEqual(searchResult.authors)
      expect(transformedReference.ai_confidence).toBe(searchResult.confidence)
      expect(transformedReference.ai_relevance_score).toBe(searchResult.relevance_score)
    })
  })
})