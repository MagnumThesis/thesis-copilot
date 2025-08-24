/**
 * Search Result Management Tests
 * Tests for bookmarking, comparison, export, and sharing functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SearchResultManagementServiceImpl } from '../worker/lib/search-result-management'
import { ScholarSearchResult, CitationStyle } from '../lib/ai-types'
import { ExportOptions } from '../components/ui/search-result-export'
import { ShareOptions } from '../components/ui/search-result-sharing'

describe('SearchResultManagementService', () => {
  let service: SearchResultManagementServiceImpl
  let mockResult: ScholarSearchResult
  const userId = 'test-user-123'

  beforeEach(() => {
    service = new SearchResultManagementServiceImpl()
    mockResult = {
      title: 'Test Paper Title',
      authors: ['John Doe', 'Jane Smith'],
      journal: 'Test Journal',
      year: 2023,
      citations: 42,
      doi: '10.1234/test.2023.001',
      url: 'https://example.com/paper',
      abstract: 'This is a test abstract for the paper.',
      keywords: ['test', 'research', 'paper'],
      confidence: 0.85,
      relevance_score: 0.92
    }
  })

  describe('Bookmarking', () => {
    it('should bookmark a result successfully', async () => {
      const tags = ['important', 'research']
      const notes = 'This is a key paper for my research'

      const bookmarkedResult = await service.bookmarkResult(mockResult, userId, tags, notes)

      expect(bookmarkedResult).toBeDefined()
      expect(bookmarkedResult.title).toBe(mockResult.title)
      expect(bookmarkedResult.tags).toEqual(tags)
      expect(bookmarkedResult.notes).toBe(notes)
      expect(bookmarkedResult.bookmarkId).toBeDefined()
      expect(bookmarkedResult.bookmarkedAt).toBeInstanceOf(Date)
    })

    it('should retrieve bookmarked results', async () => {
      await service.bookmarkResult(mockResult, userId, ['tag1'], 'note1')
      
      const bookmarks = await service.getBookmarkedResults(userId)
      
      expect(bookmarks).toHaveLength(1)
      expect(bookmarks[0].title).toBe(mockResult.title)
    })

    it('should check if result is bookmarked', async () => {
      expect(await service.isResultBookmarked(mockResult, userId)).toBe(false)
      
      await service.bookmarkResult(mockResult, userId)
      
      expect(await service.isResultBookmarked(mockResult, userId)).toBe(true)
    })

    it('should remove bookmark successfully', async () => {
      await service.bookmarkResult(mockResult, userId)
      expect(await service.isResultBookmarked(mockResult, userId)).toBe(true)
      
      await service.removeBookmark(mockResult, userId)
      
      expect(await service.isResultBookmarked(mockResult, userId)).toBe(false)
    })

    it('should update existing bookmark', async () => {
      await service.bookmarkResult(mockResult, userId, ['old-tag'], 'old note')
      
      const updatedBookmark = await service.bookmarkResult(mockResult, userId, ['new-tag'], 'new note')
      const bookmarks = await service.getBookmarkedResults(userId)
      
      expect(bookmarks).toHaveLength(1)
      expect(bookmarks[0].tags).toEqual(['new-tag'])
      expect(bookmarks[0].notes).toBe('new note')
    })
  })

  describe('Comparison', () => {
    it('should add result to comparison', async () => {
      const comparisonResult = await service.addToComparison(mockResult, userId)

      expect(comparisonResult).toBeDefined()
      expect(comparisonResult.title).toBe(mockResult.title)
      expect(comparisonResult.comparisonId).toBeDefined()
      expect(comparisonResult.addedAt).toBeInstanceOf(Date)
      expect(comparisonResult.relevanceScore).toBe(mockResult.relevance_score)
      expect(comparisonResult.confidenceScore).toBe(mockResult.confidence)
    })

    it('should retrieve comparison results', async () => {
      await service.addToComparison(mockResult, userId)
      
      const comparisons = await service.getComparisonResults(userId)
      
      expect(comparisons).toHaveLength(1)
      expect(comparisons[0].title).toBe(mockResult.title)
    })

    it('should remove result from comparison', async () => {
      await service.addToComparison(mockResult, userId)
      expect((await service.getComparisonResults(userId))).toHaveLength(1)
      
      await service.removeFromComparison(mockResult, userId)
      
      expect((await service.getComparisonResults(userId))).toHaveLength(0)
    })

    it('should clear all comparison results', async () => {
      await service.addToComparison(mockResult, userId)
      await service.addToComparison({ ...mockResult, title: 'Another Paper' }, userId)
      expect((await service.getComparisonResults(userId))).toHaveLength(2)
      
      await service.clearComparison(userId)
      
      expect((await service.getComparisonResults(userId))).toHaveLength(0)
    })
  })

  describe('Export', () => {
    const exportOptions: ExportOptions = {
      format: 'json',
      includeScores: true,
      includeAbstracts: true,
      includeUrls: true,
      includeDoi: true,
      includeKeywords: true,
      filename: 'test-export'
    }

    it('should export results as JSON', async () => {
      const results = [mockResult]
      
      const exported = await service.exportResults(results, exportOptions)
      
      expect(exported).toBeDefined()
      const parsed = JSON.parse(exported)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].title).toBe(mockResult.title)
      expect(parsed[0].relevance_score).toBe(mockResult.relevance_score)
      expect(parsed[0].abstract).toBe(mockResult.abstract)
    })

    it('should export results as CSV', async () => {
      const results = [mockResult]
      const csvOptions = { ...exportOptions, format: 'csv' as const }
      
      const exported = await service.exportResults(results, csvOptions)
      
      expect(exported).toBeDefined()
      expect(exported).toContain('Title,Authors,Journal')
      expect(exported).toContain(mockResult.title)
      expect(exported).toContain(mockResult.authors.join('; '))
    })

    it('should export results as BibTeX', async () => {
      const results = [mockResult]
      const bibtexOptions = { ...exportOptions, format: 'bibtex' as const }
      
      const exported = await service.exportResults(results, bibtexOptions)
      
      expect(exported).toBeDefined()
      expect(exported).toContain('@article')
      expect(exported).toContain(`title={${mockResult.title}}`)
      expect(exported).toContain(`author={${mockResult.authors.join(' and ')}}`)
    })

    it('should export results as RIS', async () => {
      const results = [mockResult]
      const risOptions = { ...exportOptions, format: 'ris' as const }
      
      const exported = await service.exportResults(results, risOptions)
      
      expect(exported).toBeDefined()
      expect(exported).toContain('TY  - JOUR')
      expect(exported).toContain(`TI  - ${mockResult.title}`)
      expect(exported).toContain('ER  -')
    })

    it('should export results as plain text', async () => {
      const results = [mockResult]
      const textOptions = { ...exportOptions, format: 'txt' as const }
      
      const exported = await service.exportResults(results, textOptions)
      
      expect(exported).toBeDefined()
      expect(exported).toContain(`1. ${mockResult.title}`)
      expect(exported).toContain(`Authors: ${mockResult.authors.join(', ')}`)
    })

    it('should export results as markdown', async () => {
      const results = [mockResult]
      const markdownOptions = { ...exportOptions, format: 'markdown' as const }
      
      const exported = await service.exportResults(results, markdownOptions)
      
      expect(exported).toBeDefined()
      expect(exported).toContain('# Search Results')
      expect(exported).toContain(`## 1. ${mockResult.title}`)
      expect(exported).toContain(`**Authors:** ${mockResult.authors.join(', ')}`)
    })

    it('should respect export options', async () => {
      const results = [mockResult]
      const limitedOptions: ExportOptions = {
        format: 'json',
        includeScores: false,
        includeAbstracts: false,
        includeUrls: false,
        includeDoi: false,
        includeKeywords: false,
        filename: 'limited-export'
      }
      
      const exported = await service.exportResults(results, limitedOptions)
      const parsed = JSON.parse(exported)
      
      expect(parsed[0]).not.toHaveProperty('relevance_score')
      expect(parsed[0]).not.toHaveProperty('abstract')
      expect(parsed[0]).not.toHaveProperty('url')
      expect(parsed[0]).not.toHaveProperty('doi')
      expect(parsed[0]).not.toHaveProperty('keywords')
    })

    it('should throw error for unsupported format', async () => {
      const results = [mockResult]
      const invalidOptions = { ...exportOptions, format: 'invalid' as any }
      
      await expect(service.exportResults(results, invalidOptions)).rejects.toThrow('Unsupported export format')
    })
  })

  describe('Sharing', () => {
    const shareOptions: ShareOptions = {
      shareType: 'link',
      includeScores: true,
      includeAbstracts: true,
      includePersonalNotes: false,
      expirationDays: 30,
      allowComments: false,
      requireAuth: false,
      customMessage: 'Check out these research papers!'
    }

    it('should create shared result', async () => {
      const results = [mockResult]
      
      const sharedResult = await service.shareResults(results, shareOptions, userId)
      
      expect(sharedResult).toBeDefined()
      expect(sharedResult.id).toBeDefined()
      expect(sharedResult.shareUrl).toContain(sharedResult.id)
      expect(sharedResult.results).toEqual(results)
      expect(sharedResult.shareOptions).toEqual(shareOptions)
      expect(sharedResult.createdAt).toBeInstanceOf(Date)
      expect(sharedResult.viewCount).toBe(0)
      expect(sharedResult.isActive).toBe(true)
    })

    it('should retrieve shared result', async () => {
      const results = [mockResult]
      const shared = await service.shareResults(results, shareOptions, userId)
      
      const retrieved = await service.getSharedResult(shared.id)
      
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(shared.id)
      expect(retrieved!.results).toEqual(results)
    })

    it('should return null for non-existent shared result', async () => {
      const retrieved = await service.getSharedResult('non-existent-id')
      
      expect(retrieved).toBeNull()
    })

    it('should update view count', async () => {
      const results = [mockResult]
      const shared = await service.shareResults(results, shareOptions, userId)
      
      await service.updateSharedResultViews(shared.id)
      const retrieved = await service.getSharedResult(shared.id)
      
      expect(retrieved!.viewCount).toBe(1)
    })

    it('should handle expiration', async () => {
      const results = [mockResult]
      const expiredOptions = { ...shareOptions, expirationDays: -1 } // Already expired
      
      const shared = await service.shareResults(results, expiredOptions, userId)
      const retrieved = await service.getSharedResult(shared.id)
      
      expect(retrieved).toBeNull()
    })

    it('should handle email sharing', async () => {
      const results = [mockResult]
      const emailOptions: ShareOptions = {
        ...shareOptions,
        shareType: 'email',
        recipientEmails: ['test1@example.com', 'test2@example.com']
      }
      
      // Mock console.log to capture email sending simulation
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const shared = await service.shareResults(results, emailOptions, userId)
      
      expect(shared).toBeDefined()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sending share emails to: test1@example.com, test2@example.com')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('User Isolation', () => {
    const userId1 = 'user1'
    const userId2 = 'user2'

    it('should isolate bookmarks between users', async () => {
      await service.bookmarkResult(mockResult, userId1)
      await service.bookmarkResult({ ...mockResult, title: 'User 2 Paper' }, userId2)
      
      const user1Bookmarks = await service.getBookmarkedResults(userId1)
      const user2Bookmarks = await service.getBookmarkedResults(userId2)
      
      expect(user1Bookmarks).toHaveLength(1)
      expect(user2Bookmarks).toHaveLength(1)
      expect(user1Bookmarks[0].title).toBe(mockResult.title)
      expect(user2Bookmarks[0].title).toBe('User 2 Paper')
    })

    it('should isolate comparisons between users', async () => {
      await service.addToComparison(mockResult, userId1)
      await service.addToComparison({ ...mockResult, title: 'User 2 Paper' }, userId2)
      
      const user1Comparisons = await service.getComparisonResults(userId1)
      const user2Comparisons = await service.getComparisonResults(userId2)
      
      expect(user1Comparisons).toHaveLength(1)
      expect(user2Comparisons).toHaveLength(1)
      expect(user1Comparisons[0].title).toBe(mockResult.title)
      expect(user2Comparisons[0].title).toBe('User 2 Paper')
    })
  })

  describe('Quality Score Calculation', () => {
    it('should calculate quality score based on citations', async () => {
      const highCitationResult = { ...mockResult, citations: 200 }
      const lowCitationResult = { ...mockResult, citations: 5 }
      
      const highQualityComparison = await service.addToComparison(highCitationResult, userId)
      const lowQualityComparison = await service.addToComparison(lowCitationResult, userId)
      
      expect(highQualityComparison.qualityScore).toBeGreaterThan(lowQualityComparison.qualityScore)
    })

    it('should calculate quality score based on recency', async () => {
      const recentResult = { ...mockResult, year: new Date().getFullYear() }
      const oldResult = { ...mockResult, year: 2000 }
      
      const recentComparison = await service.addToComparison(recentResult, userId)
      const oldComparison = await service.addToComparison(oldResult, userId)
      
      expect(recentComparison.qualityScore).toBeGreaterThan(oldComparison.qualityScore)
    })

    it('should handle missing quality factors gracefully', async () => {
      const incompleteResult: ScholarSearchResult = {
        title: 'Incomplete Paper',
        authors: ['Unknown Author'],
        confidence: 0.5,
        relevance_score: 0.7
      }
      
      const comparison = await service.addToComparison(incompleteResult, userId)
      
      expect(comparison.qualityScore).toBeDefined()
      expect(comparison.qualityScore).toBeGreaterThanOrEqual(0)
      expect(comparison.qualityScore).toBeLessThanOrEqual(1)
    })
  })
})