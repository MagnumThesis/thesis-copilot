import { describe, it, expect, beforeEach } from 'vitest'
import { SearchFilters } from '../lib/ai-types'

// Mock search result for testing
interface MockSearchResult {
  title: string
  authors: string[]
  journal?: string
  publication_date?: string
  doi?: string
  url?: string
  confidence: number
  relevance_score: number
  abstract?: string
  keywords?: string[]
}

// Mock implementation of filter application logic
class SearchFilterTester {
  applyFilters(results: MockSearchResult[], filters: SearchFilters): MockSearchResult[] {
    let filteredResults = [...results]

    // Apply date range filter
    if (filters.dateRange) {
      filteredResults = filteredResults.filter(result => {
        if (!result.publication_date) return false
        const year = parseInt(result.publication_date)
        const startYear = filters.dateRange!.start || 1900
        const endYear = filters.dateRange!.end || new Date().getFullYear()
        return year >= startYear && year <= endYear
      })
    }

    // Apply authors filter
    if (filters.authors && filters.authors.length > 0) {
      filteredResults = filteredResults.filter(result => {
        return filters.authors!.some(filterAuthor =>
          result.authors.some(author => 
            author.toLowerCase().includes(filterAuthor.toLowerCase())
          )
        )
      })
    }

    // Apply journals filter
    if (filters.journals && filters.journals.length > 0) {
      filteredResults = filteredResults.filter(result => {
        if (!result.journal) return false
        return filters.journals!.some(filterJournal =>
          result.journal!.toLowerCase().includes(filterJournal.toLowerCase())
        )
      })
    }

    // Apply minimum citations filter (mock implementation)
    if (filters.minCitations && filters.minCitations > 0) {
      filteredResults = filteredResults.filter(result => {
        const mockCitations = this.calculateMockCitations(result)
        return mockCitations >= filters.minCitations!
      })
    }

    // Apply sorting
    if (filters.sortBy) {
      filteredResults = this.sortResults(filteredResults, filters.sortBy)
    }

    // Apply max results limit
    if (filters.maxResults && filters.maxResults > 0) {
      filteredResults = filteredResults.slice(0, filters.maxResults)
    }

    return filteredResults
  }

  private sortResults(results: MockSearchResult[], sortBy: string): MockSearchResult[] {
    const sortedResults = [...results]

    switch (sortBy) {
      case 'date':
        return sortedResults.sort((a, b) => {
          const yearA = a.publication_date ? parseInt(a.publication_date) : 0
          const yearB = b.publication_date ? parseInt(b.publication_date) : 0
          return yearB - yearA // Newest first
        })

      case 'citations':
        return sortedResults.sort((a, b) => {
          const citationsA = this.calculateMockCitations(a)
          const citationsB = this.calculateMockCitations(b)
          return citationsB - citationsA // Highest first
        })

      case 'quality':
        return sortedResults.sort((a, b) => {
          const qualityA = this.calculateQualityScore(a)
          const qualityB = this.calculateQualityScore(b)
          return qualityB - qualityA // Highest first
        })

      case 'relevance':
      default:
        return sortedResults.sort((a, b) => {
          return (b.relevance_score || 0) - (a.relevance_score || 0) // Highest first
        })
    }
  }

  private calculateMockCitations(result: MockSearchResult): number {
    let citations = 0

    // Base citations on publication year
    if (result.publication_date) {
      const year = parseInt(result.publication_date)
      const currentYear = new Date().getFullYear()
      const yearsSincePublication = currentYear - year
      citations += Math.max(0, yearsSincePublication * 5)
    }

    // Boost for high-quality journals
    if (result.journal) {
      const highQualityJournals = ['Nature', 'Science', 'Cell', 'Journal of Artificial Intelligence Research']
      if (highQualityJournals.some(journal => result.journal!.includes(journal))) {
        citations += 50
      }
    }

    return citations + 10 // Base citations
  }

  private calculateQualityScore(result: MockSearchResult): number {
    let score = 0.5 // Base score

    // Boost score for recent publications
    if (result.publication_date) {
      const year = parseInt(result.publication_date)
      const currentYear = new Date().getFullYear()
      const yearDiff = currentYear - year
      if (yearDiff <= 2) score += 0.3
      else if (yearDiff <= 5) score += 0.2
      else if (yearDiff <= 10) score += 0.1
    }

    // Boost score for DOI presence
    if (result.doi) score += 0.2

    // Boost score for journal publications
    if (result.journal) score += 0.1

    // Boost score for multiple authors
    if (result.authors && result.authors.length > 1) score += 0.1

    return Math.min(score, 1.0)
  }
}

describe('Search Filters', () => {
  let filterTester: SearchFilterTester
  let mockResults: MockSearchResult[]

  beforeEach(() => {
    filterTester = new SearchFilterTester()
    mockResults = [
      {
        title: "Machine Learning in Healthcare",
        authors: ["Smith, J.", "Johnson, A."],
        journal: "Nature Medicine",
        publication_date: "2023",
        doi: "10.1038/nm.2023.001",
        confidence: 0.95,
        relevance_score: 0.9
      },
      {
        title: "Deep Learning Applications",
        authors: ["Brown, C.", "Davis, E."],
        journal: "Science",
        publication_date: "2020",
        doi: "10.1126/science.2020.002",
        confidence: 0.88,
        relevance_score: 0.85
      },
      {
        title: "AI in Education",
        authors: ["Wilson, M.", "Taylor, R.", "Anderson, S."],
        journal: "Educational Technology Research",
        publication_date: "2019",
        confidence: 0.82,
        relevance_score: 0.75
      },
      {
        title: "Computer Vision Advances",
        authors: ["Lee, K.", "Zhang, L."],
        journal: "IEEE Transactions on Pattern Analysis",
        publication_date: "2024",
        doi: "10.1109/tpami.2024.003",
        confidence: 0.91,
        relevance_score: 0.88
      }
    ]
  })

  describe('Date Range Filter', () => {
    it('should filter results by publication date range', () => {
      const filters: SearchFilters = {
        dateRange: { start: 2020, end: 2023 },
        sortBy: 'relevance'
      }

      const filtered = filterTester.applyFilters(mockResults, filters)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(result => {
        const year = parseInt(result.publication_date!)
        return year >= 2020 && year <= 2023
      })).toBe(true)
    })

    it('should handle missing publication dates', () => {
      const resultsWithMissingDates = [
        ...mockResults,
        {
          title: "Paper Without Date",
          authors: ["Unknown, A."],
          confidence: 0.7,
          relevance_score: 0.6
        }
      ]

      const filters: SearchFilters = {
        dateRange: { start: 2020, end: 2023 },
        sortBy: 'relevance'
      }

      const filtered = filterTester.applyFilters(resultsWithMissingDates, filters)
      
      // Should exclude the paper without a date
      expect(filtered.every(result => result.publication_date)).toBe(true)
    })
  })

  describe('Authors Filter', () => {
    it('should filter results by author names', () => {
      const filters: SearchFilters = {
        authors: ['Smith', 'Brown'],
        sortBy: 'relevance'
      }

      const filtered = filterTester.applyFilters(mockResults, filters)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.some(result => 
        result.authors.some(author => author.includes('Smith'))
      )).toBe(true)
      expect(filtered.some(result => 
        result.authors.some(author => author.includes('Brown'))
      )).toBe(true)
    })

    it('should be case insensitive', () => {
      const filters: SearchFilters = {
        authors: ['smith', 'BROWN'],
        sortBy: 'relevance'
      }

      const filtered = filterTester.applyFilters(mockResults, filters)
      
      expect(filtered).toHaveLength(2)
    })
  })

  describe('Journals Filter', () => {
    it('should filter results by journal names', () => {
      const filters: SearchFilters = {
        journals: ['Nature', 'Science'],
        sortBy: 'relevance'
      }

      const filtered = filterTester.applyFilters(mockResults, filters)
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(result => 
        result.journal && (result.journal.includes('Nature') || result.journal.includes('Science'))
      )).toBe(true)
    })

    it('should handle partial journal name matches', () => {
      const filters: SearchFilters = {
        journals: ['IEEE'],
        sortBy: 'relevance'
      }

      const filtered = filterTester.applyFilters(mockResults, filters)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].journal).toContain('IEEE')
    })
  })

  describe('Minimum Citations Filter', () => {
    it('should filter results by minimum citation count', () => {
      const filters: SearchFilters = {
        minCitations: 50,
        sortBy: 'relevance'
      }

      const filtered = filterTester.applyFilters(mockResults, filters)
      
      // Should include results with high-quality journals or older papers
      expect(filtered.length).toBeGreaterThan(0)
      filtered.forEach(result => {
        const citations = filterTester['calculateMockCitations'](result)
        expect(citations).toBeGreaterThanOrEqual(50)
      })
    })
  })

  describe('Sorting', () => {
    it('should sort by publication date (newest first)', () => {
      const filters: SearchFilters = {
        sortBy: 'date'
      }

      const sorted = filterTester.applyFilters(mockResults, filters)
      
      for (let i = 0; i < sorted.length - 1; i++) {
        const yearA = parseInt(sorted[i].publication_date!)
        const yearB = parseInt(sorted[i + 1].publication_date!)
        expect(yearA).toBeGreaterThanOrEqual(yearB)
      }
    })

    it('should sort by relevance score (highest first)', () => {
      const filters: SearchFilters = {
        sortBy: 'relevance'
      }

      const sorted = filterTester.applyFilters(mockResults, filters)
      
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].relevance_score).toBeGreaterThanOrEqual(sorted[i + 1].relevance_score)
      }
    })

    it('should sort by citations (highest first)', () => {
      const filters: SearchFilters = {
        sortBy: 'citations'
      }

      const sorted = filterTester.applyFilters(mockResults, filters)
      
      for (let i = 0; i < sorted.length - 1; i++) {
        const citationsA = filterTester['calculateMockCitations'](sorted[i])
        const citationsB = filterTester['calculateMockCitations'](sorted[i + 1])
        expect(citationsA).toBeGreaterThanOrEqual(citationsB)
      }
    })

    it('should sort by quality score (highest first)', () => {
      const filters: SearchFilters = {
        sortBy: 'quality'
      }

      const sorted = filterTester.applyFilters(mockResults, filters)
      
      for (let i = 0; i < sorted.length - 1; i++) {
        const qualityA = filterTester['calculateQualityScore'](sorted[i])
        const qualityB = filterTester['calculateQualityScore'](sorted[i + 1])
        expect(qualityA).toBeGreaterThanOrEqual(qualityB)
      }
    })
  })

  describe('Max Results Filter', () => {
    it('should limit the number of results', () => {
      const filters: SearchFilters = {
        maxResults: 2,
        sortBy: 'relevance'
      }

      const filtered = filterTester.applyFilters(mockResults, filters)
      
      expect(filtered).toHaveLength(2)
    })

    it('should return all results if maxResults is greater than available', () => {
      const filters: SearchFilters = {
        maxResults: 10,
        sortBy: 'relevance'
      }

      const filtered = filterTester.applyFilters(mockResults, filters)
      
      expect(filtered).toHaveLength(mockResults.length)
    })
  })

  describe('Combined Filters', () => {
    it('should apply multiple filters together', () => {
      const filters: SearchFilters = {
        dateRange: { start: 2020, end: 2024 },
        authors: ['Smith', 'Lee'],
        maxResults: 1,
        sortBy: 'date'
      }

      const filtered = filterTester.applyFilters(mockResults, filters)
      
      expect(filtered).toHaveLength(1)
      
      // Should match date range
      const year = parseInt(filtered[0].publication_date!)
      expect(year).toBeGreaterThanOrEqual(2020)
      expect(year).toBeLessThanOrEqual(2024)
      
      // Should match author filter
      expect(filtered[0].authors.some(author => 
        author.includes('Smith') || author.includes('Lee')
      )).toBe(true)
    })
  })

  describe('Empty Filters', () => {
    it('should return all results when no filters are applied', () => {
      const filters: SearchFilters = {
        sortBy: 'relevance'
      }

      const filtered = filterTester.applyFilters(mockResults, filters)
      
      expect(filtered).toHaveLength(mockResults.length)
    })
  })
})