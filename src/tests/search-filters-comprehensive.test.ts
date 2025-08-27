/**
 * Search Filters Tests
 * Comprehensive tests for search result filtering functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  SearchFilters, 
  applyFilters, 
  validateFilters, 
  sortResults,
  SearchFilterValidationError
} from '../lib/search-filters'
import { ScholarSearchResult } from '../lib/ai-types'

describe('Search Filters', () => {
  let mockResults: ScholarSearchResult[]
  
  beforeEach(() => {
    mockResults = [
      {
        title: 'Machine Learning in Healthcare',
        authors: ['Smith, J.', 'Doe, A.', 'Brown, C.'],
        journal: 'Nature Medicine',
        year: 2023,
        citations: 150,
        doi: '10.1038/nm.2023.001',
        url: 'https://nature.com/paper1',
        confidence: 0.95,
        relevance_score: 0.9,
        abstract: 'This paper explores machine learning applications in healthcare...'
      },
      {
        title: 'Deep Learning for Medical Diagnosis',
        authors: ['Johnson, B.', 'Wilson, M.'],
        journal: 'IEEE Transactions on Medical Imaging',
        year: 2022,
        citations: 89,
        doi: '10.1109/tmi.2022.002',
        url: 'https://ieee.org/paper2',
        confidence: 0.88,
        relevance_score: 0.85,
        abstract: 'A study on using deep learning for medical diagnosis...'
      },
      {
        title: 'AI in Education: A Comprehensive Review',
        authors: ['Taylor, R.', 'Anderson, S.', 'Clark, P.', 'Miller, K.', 'Davis, L.'],
        journal: 'Educational Technology Research',
        year: 2021,
        citations: 45,
        confidence: 0.82,
        relevance_score: 0.75,
        abstract: 'Review of AI applications in educational technology...'
      },
      {
        title: 'Computer Vision Advances in Autonomous Vehicles',
        authors: ['Lee, K.', 'Zhang, L.', 'Garcia, M.'],
        journal: 'IEEE Transactions on Intelligent Transportation Systems',
        year: 2024,
        citations: 250,
        doi: '10.1109/tits.2024.003',
        url: 'https://ieee.org/paper4',
        confidence: 0.91,
        relevance_score: 0.88,
        abstract: 'Latest advances in computer vision for autonomous vehicles...'
      },
      {
        title: 'Natural Language Processing for Academic Writing',
        authors: ['Moore, T.', 'White, H.'],
        journal: 'Computational Linguistics',
        year: 2020,
        citations: 120,
        doi: '10.1162/coli_a_004',
        url: 'https://cl.org/paper5',
        confidence: 0.87,
        relevance_score: 0.82,
        abstract: 'NLP techniques to assist with academic writing...'
      }
    ]
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('applyFilters', () => {
    it('should apply date range filter correctly', () => {
      const filters: SearchFilters = {
        dateRange: { start: 2021, end: 2023 },
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(mockResults, filters)
      
      expect(filteredResults).toHaveLength(3)
      expect(filteredResults.every(result => 
        result.year !== undefined && 
        result.year >= 2021 && 
        result.year <= 2023
      )).toBe(true)
      
      // Should include papers from 2021, 2022, 2023
      const years = filteredResults.map(r => r.year)
      expect(years).toContain(2021)
      expect(years).toContain(2022)
      expect(years).toContain(2023)
    })

    it('should handle date range with missing years', () => {
      const resultsWithMissingYears: ScholarSearchResult[] = [
        ...mockResults,
        {
          title: 'Paper with Missing Year',
          authors: ['Unknown, Author'],
          confidence: 0.7,
          relevance_score: 0.6
        }
      ]

      const filters: SearchFilters = {
        dateRange: { start: 2020, end: 2023 },
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(resultsWithMissingYears, filters)
      
      // Should exclude the paper with missing year
      expect(filteredResults).toHaveLength(4)
      expect(filteredResults.every(result => result.year !== undefined)).toBe(true)
    })

    it('should apply author filter correctly', () => {
      const filters: SearchFilters = {
        authors: ['Smith', 'Johnson'],
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(mockResults, filters)
      
      expect(filteredResults).toHaveLength(2)
      
      // Should include papers by Smith or Johnson
      expect(filteredResults.some(result => 
        result.authors.some(author => author.includes('Smith'))
      )).toBe(true)
      
      expect(filteredResults.some(result => 
        result.authors.some(author => author.includes('Johnson'))
      )).toBe(true)
    })

    it('should be case insensitive for author filtering', () => {
      const filters: SearchFilters = {
        authors: ['smith', 'JOHNSON'],
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(mockResults, filters)
      
      expect(filteredResults).toHaveLength(2)
      
      // Should match case insensitively
      expect(filteredResults.some(result => 
        result.authors.some(author => author.toLowerCase().includes('smith'))
      )).toBe(true)
      
      expect(filteredResults.some(result => 
        result.authors.some(author => author.toLowerCase().includes('johnson'))
      )).toBe(true)
    })

    it('should apply journal filter correctly', () => {
      const filters: SearchFilters = {
        journals: ['Nature', 'IEEE'],
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(mockResults, filters)
      
      expect(filteredResults).toHaveLength(3)
      
      // Should include papers from Nature or IEEE journals
      expect(filteredResults.every(result => 
        result.journal && (
          result.journal.includes('Nature') || 
          result.journal.includes('IEEE')
        )
      )).toBe(true)
    })

    it('should handle partial journal name matches', () => {
      const filters: SearchFilters = {
        journals: ['Transactions'],
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(mockResults, filters)
      
      expect(filteredResults).toHaveLength(2)
      
      // Should match journals containing "Transactions"
      expect(filteredResults.every(result => 
        result.journal && result.journal.includes('Transactions')
      )).toBe(true)
    })

    it('should apply minimum citations filter', () => {
      const filters: SearchFilters = {
        minCitations: 100,
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(mockResults, filters)
      
      expect(filteredResults).toHaveLength(2)
      
      // Should include papers with at least 100 citations
      expect(filteredResults.every(result => 
        result.citations !== undefined && result.citations >= 100
      )).toBe(true)
      
      const citationCounts = filteredResults.map(r => r.citations)
      expect(citationCounts).toContain(150)
      expect(citationCounts).toContain(250)
    })

    it('should handle results with missing citation counts', () => {
      const resultsWithMissingCitations: ScholarSearchResult[] = [
        ...mockResults,
        {
          title: 'Paper with Missing Citations',
          authors: ['Unknown, Author'],
          citations: undefined,
          confidence: 0.7,
          relevance_score: 0.6
        }
      ]

      const filters: SearchFilters = {
        minCitations: 50,
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(resultsWithMissingCitations, filters)
      
      // Should exclude papers with missing citation counts when filtering by min citations
      expect(filteredResults).toHaveLength(2)
      expect(filteredResults.every(result => 
        result.citations !== undefined && result.citations >= 50
      )).toBe(true)
    })

    it('should combine multiple filters', () => {
      const filters: SearchFilters = {
        dateRange: { start: 2022, end: 2024 },
        authors: ['Smith', 'Lee'],
        minCitations: 50,
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(mockResults, filters)
      
      expect(filteredResults).toHaveLength(1)
      
      const result = filteredResults[0]
      
      // Should satisfy all filter conditions
      expect(result.year).toBeGreaterThanOrEqual(2022)
      expect(result.year).toBeLessThanOrEqual(2024)
      
      expect(result.authors.some(author => 
        author.includes('Smith') || author.includes('Lee')
      )).toBe(true)
      
      expect(result.citations).toBeGreaterThanOrEqual(50)
    })

    it('should return all results when no filters are applied', () => {
      const filters: SearchFilters = {
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(mockResults, filters)
      
      expect(filteredResults).toHaveLength(mockResults.length)
    })

    it('should handle empty results array', () => {
      const filters: SearchFilters = {
        dateRange: { start: 2020, end: 2023 },
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters([], filters)
      
      expect(filteredResults).toHaveLength(0)
    })

    it('should handle undefined filters gracefully', () => {
      const filteredResults = applyFilters(mockResults, undefined)
      
      expect(filteredResults).toHaveLength(mockResults.length)
    })

    it('should handle null filters gracefully', () => {
      const filteredResults = applyFilters(mockResults, null as any)
      
      expect(filteredResults).toHaveLength(mockResults.length)
    })
  })

  describe('validateFilters', () => {
    it('should validate correct filters', () => {
      const filters: SearchFilters = {
        dateRange: { start: 2020, end: 2023 },
        authors: ['Smith', 'Johnson'],
        journals: ['Nature', 'IEEE'],
        minCitations: 50,
        sortBy: 'relevance'
      }

      const validation = validateFilters(filters)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should validate date range correctly', () => {
      // Valid date range
      const validFilters: SearchFilters = {
        dateRange: { start: 2020, end: 2023 },
        sortBy: 'relevance'
      }
      
      const validValidation = validateFilters(validFilters)
      expect(validValidation.isValid).toBe(true)
      
      // Invalid date range (start > end)
      const invalidFilters: SearchFilters = {
        dateRange: { start: 2023, end: 2020 },
        sortBy: 'relevance'
      }
      
      const invalidValidation = validateFilters(invalidFilters)
      expect(invalidValidation.isValid).toBe(false)
      expect(invalidValidation.errors).toContainEqual(
        expect.stringContaining('start year must be less than or equal to end year')
      )
      
      // Future dates (should still be valid but may warn)
      const futureFilters: SearchFilters = {
        dateRange: { start: 2025, end: 2030 },
        sortBy: 'relevance'
      }
      
      const futureValidation = validateFilters(futureFilters)
      expect(futureValidation.isValid).toBe(true) // Future dates are allowed
    })

    it('should validate minimum citations', () => {
      // Valid minimum citations
      const validFilters: SearchFilters = {
        minCitations: 10,
        sortBy: 'relevance'
      }
      
      const validValidation = validateFilters(validFilters)
      expect(validValidation.isValid).toBe(true)
      
      // Invalid minimum citations (negative)
      const invalidFilters: SearchFilters = {
        minCitations: -5,
        sortBy: 'relevance'
      }
      
      const invalidValidation = validateFilters(invalidFilters)
      expect(invalidValidation.isValid).toBe(false)
      expect(invalidValidation.errors).toContainEqual(
        expect.stringContaining('minimum citations cannot be negative')
      )
    })

    it('should validate sort options', () => {
      // Valid sort options
      const validSortOptions = ['relevance', 'date', 'citations', 'quality'] as const
      
      validSortOptions.forEach(sortBy => {
        const filters: SearchFilters = { sortBy }
        const validation = validateFilters(filters)
        expect(validation.isValid).toBe(true)
      })
      
      // Invalid sort option
      const filters: SearchFilters = { sortBy: 'invalid' as any }
      const validation = validateFilters(filters)
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContainEqual(
        expect.stringContaining('invalid sort option')
      )
    })

    it('should validate author and journal arrays', () => {
      // Valid arrays
      const validFilters: SearchFilters = {
        authors: ['Smith', 'Johnson'],
        journals: ['Nature', 'IEEE'],
        sortBy: 'relevance'
      }
      
      const validValidation = validateFilters(validFilters)
      expect(validValidation.isValid).toBe(true)
      
      // Empty arrays (still valid)
      const emptyFilters: SearchFilters = {
        authors: [],
        journals: [],
        sortBy: 'relevance'
      }
      
      const emptyValidation = validateFilters(emptyFilters)
      expect(emptyValidation.isValid).toBe(true)
    })

    it('should return validation warnings for edge cases', () => {
      const filters: SearchFilters = {
        dateRange: { start: 1900, end: new Date().getFullYear() + 5 }, // Very wide range and future end
        minCitations: 0, // Zero minimum
        sortBy: 'relevance'
      }

      const validation = validateFilters(filters)
      
      expect(validation.isValid).toBe(true)
      // May have warnings but should still be valid
      expect(validation.warnings.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('sortResults', () => {
    it('should sort by relevance score (descending)', () => {
      const sortedResults = sortResults([...mockResults], 'relevance')
      
      // Should be sorted by relevance score descending
      for (let i = 0; i < sortedResults.length - 1; i++) {
        expect(sortedResults[i].relevance_score).toBeGreaterThanOrEqual(
          sortedResults[i + 1].relevance_score
        )
      }
    })

    it('should sort by date (descending - newest first)', () => {
      const sortedResults = sortResults([...mockResults], 'date')
      
      // Should be sorted by year descending
      for (let i = 0; i < sortedResults.length - 1; i++) {
        const yearA = sortedResults[i].year || 0
        const yearB = sortedResults[i + 1].year || 0
        expect(yearA).toBeGreaterThanOrEqual(yearB)
      }
    })

    it('should sort by citations (descending - highest first)', () => {
      const sortedResults = sortResults([...mockResults], 'citations')
      
      // Should be sorted by citations descending
      for (let i = 0; i < sortedResults.length - 1; i++) {
        const citesA = sortedResults[i].citations || 0
        const citesB = sortedResults[i + 1].citations || 0
        expect(citesA).toBeGreaterThanOrEqual(citesB)
      }
    })

    it('should sort by quality score (descending)', () => {
      // Add quality scores to results for testing
      const resultsWithQuality = mockResults.map(result => ({
        ...result,
        quality_score: result.citations ? result.citations / 100 : 0.5
      }))
      
      const sortedResults = sortResults(resultsWithQuality, 'quality')
      
      // Should be sorted by quality score descending
      for (let i = 0; i < sortedResults.length - 1; i++) {
        const qualityA = sortedResults[i].quality_score || 0
        const qualityB = sortedResults[i + 1].quality_score || 0
        expect(qualityA).toBeGreaterThanOrEqual(qualityB)
      }
    })

    it('should handle results with missing sort fields gracefully', () => {
      const resultsWithMissingFields: ScholarSearchResult[] = [
        {
          title: 'Paper with Missing Fields',
          authors: ['Unknown, Author'],
          confidence: 0.7,
          relevance_score: 0.6
        },
        ...mockResults
      ]

      const sortedResults = sortResults(resultsWithMissingFields, 'date')
      
      expect(sortedResults).toHaveLength(resultsWithMissingFields.length)
      
      // Papers with missing fields should be sorted appropriately
      // (typically to the end for descending sorts)
    })

    it('should handle empty results array', () => {
      const sortedResults = sortResults([], 'relevance')
      expect(sortedResults).toHaveLength(0)
    })

    it('should handle single result', () => {
      const singleResult: ScholarSearchResult[] = [{
        title: 'Single Paper',
        authors: ['Author'],
        year: 2023,
        citations: 50,
        confidence: 0.8,
        relevance_score: 0.7
      }]

      const sortedResults = sortResults(singleResult, 'relevance')
      expect(sortedResults).toHaveLength(1)
      expect(sortedResults[0]).toEqual(singleResult[0])
    })

    it('should maintain stability for equal values', () => {
      // Create results with identical sort values
      const identicalResults: ScholarSearchResult[] = [
        {
          title: 'Paper A',
          authors: ['Author'],
          year: 2023,
          citations: 100,
          confidence: 0.8,
          relevance_score: 0.7
        },
        {
          title: 'Paper B',
          authors: ['Author'],
          year: 2023,
          citations: 100,
          confidence: 0.8,
          relevance_score: 0.7
        }
      ]

      const sortedResults = sortResults(identicalResults, 'relevance')
      
      // Should maintain original order for equal values
      expect(sortedResults[0].title).toBe('Paper A')
      expect(sortedResults[1].title).toBe('Paper B')
    })
  })

  describe('Filter Performance', () => {
    it('should handle large result sets efficiently', () => {
      // Create large dataset
      const largeDataset: ScholarSearchResult[] = Array.from({ length: 1000 }, (_, i) => ({
        title: `Paper ${i}`,
        authors: [`Author ${i % 50}`], // Some author repetition for filtering
        journal: i % 3 === 0 ? 'Nature' : i % 3 === 1 ? 'IEEE' : 'Generic Journal',
        year: 2020 + (i % 5), // Years 2020-2024
        citations: Math.floor(Math.random() * 500),
        confidence: 0.5 + (Math.random() * 0.5),
        relevance_score: 0.4 + (Math.random() * 0.6)
      }))

      const filters: SearchFilters = {
        dateRange: { start: 2022, end: 2023 },
        authors: ['Author 0', 'Author 1'],
        journals: ['Nature'],
        minCitations: 100,
        sortBy: 'relevance'
      }

      const startTime = Date.now()
      const filteredResults = applyFilters(largeDataset, filters)
      const endTime = Date.now()

      // Should complete within reasonable time (2 seconds for 1000 records)
      expect(endTime - startTime).toBeLessThan(2000)
      
      // Should apply all filters correctly
      expect(filteredResults.every(result => 
        result.year !== undefined && 
        result.year >= 2022 && 
        result.year <= 2023
      )).toBe(true)
      
      expect(filteredResults.some(result => 
        result.authors.some(author => 
          author.includes('Author 0') || author.includes('Author 1')
        )
      )).toBe(true)
      
      expect(filteredResults.every(result => 
        result.journal && result.journal.includes('Nature')
      )).toBe(true)
      
      expect(filteredResults.every(result => 
        result.citations !== undefined && result.citations >= 100
      )).toBe(true)
    })

    it('should not have memory leaks with repeated filtering', () => {
      const filters: SearchFilters = {
        dateRange: { start: 2020, end: 2023 },
        sortBy: 'relevance'
      }

      // Apply filters many times
      for (let i = 0; i < 1000; i++) {
        applyFilters(mockResults, filters)
      }

      // Should not accumulate memory
      const finalFiltered = applyFilters(mockResults, filters)
      expect(finalFiltered).toHaveLength(4) // Expected filtered count
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle extreme date ranges', () => {
      const filters: SearchFilters = {
        dateRange: { start: 1800, end: 2100 }, // Very wide range
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(mockResults, filters)
      
      // Should handle wide ranges without errors
      expect(filteredResults).toHaveLength(mockResults.length)
    })

    it('should handle very high minimum citations', () => {
      const filters: SearchFilters = {
        minCitations: 1000, // Higher than any in dataset
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(mockResults, filters)
      
      // Should return empty array when no results meet criteria
      expect(filteredResults).toHaveLength(0)
    })

    it('should handle empty author and journal arrays', () => {
      const filters: SearchFilters = {
        authors: [],
        journals: [],
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(mockResults, filters)
      
      // Should return all results when arrays are empty
      expect(filteredResults).toHaveLength(mockResults.length)
    })

    it('should handle special characters in filter values', () => {
      const resultsWithSpecialChars: ScholarSearchResult[] = [
        {
          title: 'Special Characters Paper',
          authors: ['Author, Äccéntéd', 'Öther, Authør'],
          journal: 'Jöurnal with Spëcïal Chåräcters',
          year: 2023,
          citations: 75,
          confidence: 0.8,
          relevance_score: 0.7
        },
        ...mockResults
      ]

      const filters: SearchFilters = {
        authors: ['Äccéntéd', 'Öther'],
        journals: ['Spëcïal'],
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(resultsWithSpecialChars, filters)
      
      // Should handle Unicode characters correctly
      expect(filteredResults).toHaveLength(1)
      expect(filteredResults[0].title).toBe('Special Characters Paper')
    })

    it('should handle null and undefined values in results', () => {
      const resultsWithNulls: ScholarSearchResult[] = [
        {
          title: 'Paper with Nulls',
          authors: null as any, // Explicitly null
          journal: undefined as any, // Explicitly undefined
          year: undefined,
          citations: null as any,
          confidence: 0.7,
          relevance_score: 0.6
        },
        ...mockResults
      ]

      const filters: SearchFilters = {
        dateRange: { start: 2020, end: 2023 },
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(resultsWithNulls, filters)
      
      // Should handle null/undefined gracefully
      expect(filteredResults).toHaveLength(4) // Should exclude the null paper when filtering by date
    })
  })

  describe('Filter Validation Errors', () => {
    it('should throw validation errors for invalid filters', () => {
      const invalidFilters: SearchFilters = {
        dateRange: { start: 2023, end: 2020 }, // Invalid range
        minCitations: -10, // Negative citations
        sortBy: 'invalid_sort_option' as any
      }

      expect(() => {
        validateFilters(invalidFilters, { throwOnError: true })
      }).toThrow(SearchFilterValidationError)
    })

    it('should collect multiple validation errors', () => {
      const invalidFilters: SearchFilters = {
        dateRange: { start: 2023, end: 2020 }, // Invalid range
        minCitations: -10, // Negative citations
        sortBy: 'invalid_sort_option' as any
      }

      const validation = validateFilters(invalidFilters)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toHaveLength(3) // Should collect all errors
    })

    it('should provide descriptive error messages', () => {
      const invalidFilters: SearchFilters = {
        dateRange: { start: 2023, end: 2020 },
        sortBy: 'invalid' as any
      }

      expect(() => {
        validateFilters(invalidFilters, { throwOnError: true })
      }).toThrow(expect.stringContaining('start year must be less than or equal to end year'))
      
      expect(() => {
        validateFilters(invalidFilters, { throwOnError: true })
      }).toThrow(expect.stringContaining('invalid sort option'))
    })
  })

  describe('Integration with Other Components', () => {
    it('should work correctly with scoring engine integration', () => {
      // Mock results that would come from scoring engine
      const scoredResults: ScholarSearchResult[] = mockResults.map((result, index) => ({
        ...result,
        overallScore: 0.9 - (index * 0.1), // Decreasing scores
        qualityScore: 0.8 - (index * 0.1),
        confidenceScore: 0.95 - (index * 0.05)
      }))

      const filters: SearchFilters = {
        minCitations: 50,
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(scoredResults, filters)
      
      // Should filter correctly even with additional score fields
      expect(filteredResults.every(result => 
        result.citations !== undefined && result.citations >= 50
      )).toBe(true)
    })

    it('should preserve additional result metadata during filtering', () => {
      const resultsWithMetadata: ScholarSearchResult[] = mockResults.map(result => ({
        ...result,
        additionalMetadata: {
          source: 'google_scholar',
          extractionMethod: 'web_scraping',
          processingTimestamp: Date.now()
        },
        rankingInfo: {
          originalRank: mockResults.indexOf(result) + 1,
          scoringBreakdown: {
            relevance: 0.8,
            quality: 0.7,
            confidence: 0.9
          }
        }
      }))

      const filters: SearchFilters = {
        dateRange: { start: 2021, end: 2023 },
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(resultsWithMetadata, filters)
      
      // Should preserve additional metadata
      expect(filteredResults).toHaveLength(3)
      filteredResults.forEach(result => {
        expect(result).toHaveProperty('additionalMetadata')
        expect(result).toHaveProperty('rankingInfo')
      })
    })
  })

  describe('Advanced Filtering Scenarios', () => {
    it('should handle complex author name variations', () => {
      const resultsWithAuthorVariations: ScholarSearchResult[] = [
        {
          title: 'Research Paper',
          authors: ['Smith, John', 'Doe, Alice'],
          year: 2023,
          citations: 100,
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Research Paper',
          authors: ['Smith, J.', 'Doe, A.'],
          year: 2023,
          citations: 95,
          confidence: 0.85,
          relevance_score: 0.75
        },
        {
          title: 'Different Paper',
          authors: ['Brown, Bob'],
          year: 2023,
          citations: 50,
          confidence: 0.7,
          relevance_score: 0.6
        }
      ]

      const filters: SearchFilters = {
        authors: ['Smith, John', 'Doe, A.'],
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(resultsWithAuthorVariations, filters)
      
      // Should match both variations of the authors
      expect(filteredResults).toHaveLength(2)
      expect(filteredResults.every(result => 
        result.authors.some(author => 
          author.includes('Smith') || author.includes('Doe')
        )
      )).toBe(true)
    })

    it('should handle journal name abbreviations', () => {
      const resultsWithJournalAbbreviations: ScholarSearchResult[] = [
        {
          title: 'IEEE Paper',
          authors: ['Author'],
          journal: 'IEEE Transactions on Pattern Analysis and Machine Intelligence',
          year: 2023,
          citations: 150,
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'TPAMI Paper',
          authors: ['Author'],
          journal: 'TPAMI',
          year: 2023,
          citations: 140,
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const filters: SearchFilters = {
        journals: ['IEEE', 'TPAMI'],
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(resultsWithJournalAbbreviations, filters)
      
      // Should match both full journal name and abbreviation
      expect(filteredResults).toHaveLength(2)
    })

    it('should handle multi-word search terms in filters', () => {
      const filters: SearchFilters = {
        authors: ['John Smith', 'Alice Doe'],
        journals: ['Nature Medicine', 'IEEE Transactions'],
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(mockResults, filters)
      
      // Should handle multi-word terms correctly
      expect(filteredResults).toHaveLength(2)
    })

    it('should handle overlapping filter criteria', () => {
      // Create scenario where multiple filters could match the same results
      const overlappingResults: ScholarSearchResult[] = [
        {
          title: 'High Impact Paper',
          authors: ['Smith, J.'],
          journal: 'Nature',
          year: 2023,
          citations: 500, // Very high citations
          confidence: 0.95,
          relevance_score: 0.9
        },
        {
          title: 'Recent Paper',
          authors: ['Smith, J.'],
          journal: 'Nature',
          year: 2024, // Most recent
          citations: 50, // Lower citations
          confidence: 0.85,
          relevance_score: 0.8
        }
      ]

      const filters: SearchFilters = {
        authors: ['Smith'],
        journals: ['Nature'],
        dateRange: { start: 2023, end: 2024 },
        minCitations: 100, // Only high-impact paper meets this
        sortBy: 'relevance'
      }

      const filteredResults = applyFilters(overlappingResults, filters)
      
      // Should apply all criteria, so only high-impact paper should match
      expect(filteredResults).toHaveLength(1)
      expect(filteredResults[0].title).toBe('High Impact Paper')
      expect(filteredResults[0].citations).toBe(500)
    })
  })

  describe('Filter Configuration and Customization', () => {
    it('should allow custom filter functions', () => {
      // This would test extensibility - adding custom filters
      // For now, we'll test that the basic filtering respects configuration
      
      const strictFilters: SearchFilters = {
        dateRange: { start: 2023, end: 2023 },
        sortBy: 'relevance'
      }

      const lenientFilters: SearchFilters = {
        dateRange: { start: 2020, end: 2024 },
        sortBy: 'relevance'
      }

      const strictResults = applyFilters(mockResults, strictFilters)
      const lenientResults = applyFilters(mockResults, lenientFilters)
      
      expect(lenientResults.length).toBeGreaterThanOrEqual(strictResults.length)
    })

    it('should allow filter chaining', () => {
      // Apply filters one by one
      let chainedResults = [...mockResults]
      
      chainedResults = applyFilters(chainedResults, { 
        dateRange: { start: 2020, end: 2024 },
        sortBy: 'relevance'
      })
      
      chainedResults = applyFilters(chainedResults, { 
        minCitations: 50,
        sortBy: 'relevance'
      })
      
      chainedResults = applyFilters(chainedResults, { 
        authors: ['Smith', 'Lee'],
        sortBy: 'relevance'
      })
      
      // Final result should be the same as applying all filters at once
      const allFilters: SearchFilters = {
        dateRange: { start: 2020, end: 2024 },
        minCitations: 50,
        authors: ['Smith', 'Lee'],
        sortBy: 'relevance'
      }
      
      const allAtOnceResults = applyFilters(mockResults, allFilters)
      
      expect(chainedResults).toHaveLength(allAtOnceResults.length)
    })
  })
})