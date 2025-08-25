/**
 * Search Filters Implementation Demo
 * 
 * This file demonstrates the search filters functionality
 * that has been implemented for task 7.1
 */

import { SearchFilters } from '../lib/ai-types'

// Mock search results for demonstration
interface MockSearchResult {
  title: string
  authors: string[]
  journal?: string
  publication_date?: string
  doi?: string
  url?: string
  confidence: number
  relevance_score: number
}

const mockResults: MockSearchResult[] = [
  {
    title: "Machine Learning in Healthcare: A Comprehensive Review",
    authors: ["Smith, J.", "Johnson, A.", "Williams, B."],
    journal: "Nature Medicine",
    publication_date: "2023",
    doi: "10.1038/nm.2023.001",
    confidence: 0.95,
    relevance_score: 0.92
  },
  {
    title: "Deep Learning Applications in Computer Vision",
    authors: ["Brown, C.", "Davis, E."],
    journal: "Science",
    publication_date: "2020",
    doi: "10.1126/science.2020.002",
    confidence: 0.88,
    relevance_score: 0.85
  },
  {
    title: "Artificial Intelligence in Educational Technology",
    authors: ["Wilson, M.", "Taylor, R.", "Anderson, S."],
    journal: "Educational Technology Research and Development",
    publication_date: "2019",
    confidence: 0.82,
    relevance_score: 0.75
  },
  {
    title: "Computer Vision Advances in Medical Imaging",
    authors: ["Lee, K.", "Zhang, L."],
    journal: "IEEE Transactions on Medical Imaging",
    publication_date: "2024",
    doi: "10.1109/tmi.2024.003",
    confidence: 0.91,
    relevance_score: 0.88
  },
  {
    title: "Natural Language Processing for Academic Writing",
    authors: ["Garcia, P.", "Smith, J.", "Martinez, C."],
    journal: "Computational Linguistics",
    publication_date: "2022",
    confidence: 0.87,
    relevance_score: 0.80
  }
]

// Filter application function (simplified version of the API implementation)
function applyFilters(results: MockSearchResult[], filters: SearchFilters): MockSearchResult[] {
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

  // Apply sorting
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'date':
        filteredResults.sort((a, b) => {
          const yearA = a.publication_date ? parseInt(a.publication_date) : 0
          const yearB = b.publication_date ? parseInt(b.publication_date) : 0
          return yearB - yearA // Newest first
        })
        break
      case 'relevance':
        filteredResults.sort((a, b) => b.relevance_score - a.relevance_score)
        break
      case 'quality':
        filteredResults.sort((a, b) => b.confidence - a.confidence)
        break
    }
  }

  // Apply max results limit
  if (filters.maxResults && filters.maxResults > 0) {
    filteredResults = filteredResults.slice(0, filters.maxResults)
  }

  return filteredResults
}

// Demonstration functions
console.log('🔍 Search Filters Implementation Demo')
console.log('=====================================\n')

console.log('📊 Original Results:', mockResults.length)
mockResults.forEach((result, index) => {
  console.log(`${index + 1}. ${result.title} (${result.publication_date})`)
})

console.log('\n🎯 Filter Demo 1: Date Range (2020-2023)')
const dateRangeFilter: SearchFilters = {
  dateRange: { start: 2020, end: 2023 },
  sortBy: 'date'
}
const dateFiltered = applyFilters(mockResults, dateRangeFilter)
console.log(`Results: ${dateFiltered.length}`)
dateFiltered.forEach((result, index) => {
  console.log(`${index + 1}. ${result.title} (${result.publication_date})`)
})

console.log('\n👥 Filter Demo 2: Author Filter (Smith)')
const authorFilter: SearchFilters = {
  authors: ['Smith'],
  sortBy: 'relevance'
}
const authorFiltered = applyFilters(mockResults, authorFilter)
console.log(`Results: ${authorFiltered.length}`)
authorFiltered.forEach((result, index) => {
  console.log(`${index + 1}. ${result.title} - Authors: ${result.authors.join(', ')}`)
})

console.log('\n📚 Filter Demo 3: Journal Filter (Nature, Science)')
const journalFilter: SearchFilters = {
  journals: ['Nature', 'Science'],
  sortBy: 'quality'
}
const journalFiltered = applyFilters(mockResults, journalFilter)
console.log(`Results: ${journalFiltered.length}`)
journalFiltered.forEach((result, index) => {
  console.log(`${index + 1}. ${result.title} - Journal: ${result.journal}`)
})

console.log('\n🔗 Filter Demo 4: Combined Filters')
const combinedFilter: SearchFilters = {
  dateRange: { start: 2020, end: 2024 },
  authors: ['Smith', 'Lee'],
  maxResults: 2,
  sortBy: 'date'
}
const combinedFiltered = applyFilters(mockResults, combinedFilter)
console.log(`Results: ${combinedFiltered.length}`)
combinedFiltered.forEach((result, index) => {
  console.log(`${index + 1}. ${result.title} (${result.publication_date}) - Authors: ${result.authors.join(', ')}`)
})

console.log('\n✅ All filter types implemented:')
console.log('- ✅ Publication date range filters')
console.log('- ✅ Author filtering options')
console.log('- ✅ Journal filtering options')
console.log('- ✅ Maximum results limit')
console.log('- ✅ Sort options (relevance, date, citations, quality)')
console.log('- ✅ Advanced search options interface')
console.log('- ✅ Filter combination and reset functionality')

console.log('\n🧪 Tests implemented:')
console.log('- ✅ Unit tests for filter logic')
console.log('- ✅ Integration tests for filter application')
console.log('- ✅ Type safety tests for SearchFilters interface')
console.log('- ✅ Edge case handling tests')

export { applyFilters, mockResults }