import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock heavy dependencies used by SearchService to keep the test focused
vi.mock('../../../worker/lib/query-generation-engine', () => ({
  QueryGenerationEngine: class {
    generateQueries() {
      return [{ query: 'test query', queryType: 'basic', confidence: 0.9 }]
    }
  }
}))

vi.mock('../../../worker/lib/content-extraction-engine', () => ({
  ContentExtractionEngine: class {
    constructor() {}
    async extract() { return { success: true, content: 'extracted' } }
  }
}))

vi.mock('../../../worker/lib/enhanced-google-scholar-client', () => ({
  EnhancedGoogleScholarClient: class {
    async search() { return [{ title: 'Paper', authors: ['A'], doi: '10.0/test' }] }
  }
}))

vi.mock('../../../worker/lib/search-analytics-manager', () => ({
  SearchAnalyticsManager: class { constructor() {} }
}))

vi.mock('../../../worker/lib/feedback-learning-system', () => ({
  FeedbackLearningSystem: class { constructor() {} }
}))

vi.mock('../../../../lib/ai-searcher-performance-optimizer', () => ({
  AISearcherPerformanceOptimizer: class {
    getCachedSearchResults() { return null }
    cacheSearchResults() {}
  }
}))

import { SearchService } from '../../../../src/worker/services/search-service'

describe('SearchService integration (smoke)', () => {
  it('returns a response shape for a basic search request', async () => {
    const req = { query: 'machine learning', conversationId: 'conv-1' }
    const res = await SearchService.search(req as any, {})

    expect(res).toBeDefined()
    expect(res.results).toBeDefined()
    expect(Array.isArray(res.results)).toBe(true)
  })
})
