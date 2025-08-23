import { describe, it, expect, beforeEach } from 'vitest'
import { DuplicateDetectionEngine, DuplicateDetectionOptions } from '../worker/lib/duplicate-detection-engine'
import { ScholarSearchResult } from '../lib/ai-types'

describe('DuplicateDetectionEngine', () => {
  let engine: DuplicateDetectionEngine
  let defaultOptions: DuplicateDetectionOptions

  beforeEach(() => {
    defaultOptions = {
      titleSimilarityThreshold: 0.85,
      authorSimilarityThreshold: 0.8,
      enableFuzzyMatching: true,
      strictDOIMatching: true,
      mergeStrategy: 'keep_highest_quality'
    }
    engine = new DuplicateDetectionEngine(defaultOptions)
  })

  describe('DOI-based duplicate detection', () => {
    it('should detect duplicates with identical DOIs', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Machine Learning in Healthcare',
          authors: ['Smith, J.', 'Doe, A.'],
          doi: '10.1234/ml.2023.001',
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'ML in Healthcare Applications',
          authors: ['Smith, John', 'Doe, Alice'],
          doi: '10.1234/ml.2023.001',
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(1)
      expect(duplicateGroups[0].primary).toBe(results[0])
      expect(duplicateGroups[0].duplicates).toContain(results[1])
      expect(duplicateGroups[0].mergeStrategy).toBe('doi')
      expect(duplicateGroups[0].confidence).toBe(1.0)
    })

    it('should normalize DOI formats for comparison', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Research Paper',
          authors: ['Author, A.'],
          doi: 'https://doi.org/10.1234/test.2023.001',
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Research Paper',
          authors: ['Author, A.'],
          doi: 'doi:10.1234/test.2023.001',
          confidence: 0.85,
          relevance_score: 0.75
        },
        {
          title: 'Research Paper',
          authors: ['Author, A.'],
          doi: '10.1234/test.2023.001',
          confidence: 0.8,
          relevance_score: 0.7
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(1)
      expect(duplicateGroups[0].duplicates).toHaveLength(2)
      expect(duplicateGroups[0].mergeStrategy).toBe('doi')
    })
  })

  describe('URL-based duplicate detection', () => {
    it('should detect duplicates with identical URLs', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Paper Title',
          authors: ['Author, A.'],
          url: 'https://example.com/paper1',
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Paper Title',
          authors: ['Author, A.'],
          url: 'http://example.com/paper1/',
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(1)
      expect(duplicateGroups[0].mergeStrategy).toBe('url')
      expect(duplicateGroups[0].confidence).toBe(0.95)
    })
  })

  describe('Title and author similarity detection', () => {
    it('should detect duplicates with similar titles and authors', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Machine Learning Applications in Healthcare',
          authors: ['Smith, John', 'Doe, Alice'],
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Machine Learning Applications in Healthcare',
          authors: ['Smith, John', 'Doe, Alice'], // Exact same authors
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(1)
      expect(duplicateGroups[0].mergeStrategy).toBe('title_author')
    })

    it('should not detect duplicates when title similarity is below threshold', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Machine Learning in Healthcare',
          authors: ['Smith, John'],
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Deep Learning for Medical Diagnosis',
          authors: ['Smith, John'],
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(0)
    })

    it('should not detect duplicates when author similarity is below threshold', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Machine Learning Applications in Healthcare',
          authors: ['Smith, John', 'Doe, Alice'],
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Machine Learning Applications in Healthcare',
          authors: ['Brown, Bob', 'Wilson, Carol'],
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(0)
    })
  })

  describe('Fuzzy matching', () => {
    it('should detect duplicates using fuzzy matching when enabled', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Machine Learning in Healthcare',
          authors: ['Smith, J.'],
          year: 2023,
          journal: 'Medical AI Journal',
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Machine Learning in Healthcare Applications',
          authors: ['Smith, J.'],
          year: 2023,
          journal: 'Medical AI Journal',
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(1)
      expect(duplicateGroups[0].mergeStrategy).toBe('fuzzy_match')
    })

    it('should not use fuzzy matching when disabled', () => {
      const engineWithoutFuzzy = new DuplicateDetectionEngine({
        ...defaultOptions,
        enableFuzzyMatching: false
      })

      const results: ScholarSearchResult[] = [
        {
          title: 'AI in Medical Diagnosis',
          authors: ['Smith, J.'],
          year: 2023,
          journal: 'Medical AI Journal',
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Artificial Intelligence for Medical Diagnosis',
          authors: ['Smith, John'],
          year: 2023,
          journal: 'Medical AI Journal',
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = engineWithoutFuzzy.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(0)
    })
  })

  describe('Merge functionality', () => {
    it('should merge duplicates by highest quality', () => {
      const group = {
        primary: {
          title: 'Research Paper',
          authors: ['Smith, J.'],
          citations: 10,
          year: 2023,
          confidence: 0.8,
          relevance_score: 0.7
        },
        duplicates: [
          {
            title: 'Research Paper',
            authors: ['Smith, John'],
            citations: 25,
            year: 2023,
            doi: '10.1234/test.001',
            confidence: 0.9,
            relevance_score: 0.8
          }
        ],
        confidence: 1.0,
        mergeStrategy: 'doi' as const
      }

      const merged = engine.mergeDuplicates(group)
      
      expect(merged.citations).toBe(25) // Higher citation count
      expect(merged.doi).toBe('10.1234/test.001') // Valid DOI
      expect(merged.mergedFrom).toHaveLength(2)
      expect(merged.mergeConfidence).toBe(1.0)
    })

    it('should merge authors without duplicates', () => {
      const group = {
        primary: {
          title: 'Research Paper',
          authors: ['Smith, J.', 'Doe, A.'],
          confidence: 0.8,
          relevance_score: 0.7
        },
        duplicates: [
          {
            title: 'Research Paper',
            authors: ['Smith, John', 'Brown, B.'],
            confidence: 0.9,
            relevance_score: 0.8
          }
        ],
        confidence: 1.0,
        mergeStrategy: 'title_author' as const
      }

      const merged = engine.mergeDuplicates(group)
      
      expect(merged.authors).toHaveLength(4) // All unique authors
      expect(merged.authors).toContain('Smith, J.')
      expect(merged.authors).toContain('Doe, A.')
      expect(merged.authors).toContain('Smith, John')
      expect(merged.authors).toContain('Brown, B.')
    })

    it('should merge keywords without duplicates', () => {
      const group = {
        primary: {
          title: 'Research Paper',
          authors: ['Smith, J.'],
          keywords: ['machine learning', 'healthcare'],
          confidence: 0.8,
          relevance_score: 0.7
        },
        duplicates: [
          {
            title: 'Research Paper',
            authors: ['Smith, John'],
            keywords: ['healthcare', 'artificial intelligence'],
            confidence: 0.9,
            relevance_score: 0.8
          }
        ],
        confidence: 1.0,
        mergeStrategy: 'title_author' as const
      }

      const merged = engine.mergeDuplicates(group)
      
      expect(merged.keywords).toHaveLength(3)
      expect(merged.keywords).toContain('machine learning')
      expect(merged.keywords).toContain('healthcare')
      expect(merged.keywords).toContain('artificial intelligence')
    })
  })

  describe('Remove duplicates functionality', () => {
    it('should remove duplicates and return merged results', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Paper A',
          authors: ['Author 1'],
          doi: '10.1234/a.001',
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Paper A',
          authors: ['Author 1'],
          doi: '10.1234/a.001',
          confidence: 0.85,
          relevance_score: 0.75
        },
        {
          title: 'Paper B',
          authors: ['Author 2'],
          doi: '10.1234/b.001',
          confidence: 0.8,
          relevance_score: 0.7
        }
      ]

      const deduplicatedResults = engine.removeDuplicates(results)
      
      expect(deduplicatedResults).toHaveLength(2) // One duplicate removed
      expect(deduplicatedResults[0].title).toBe('Paper A')
      expect(deduplicatedResults[1].title).toBe('Paper B')
    })

    it('should return original results when no duplicates found', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Paper A',
          authors: ['Author 1'],
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Paper B',
          authors: ['Author 2'],
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const deduplicatedResults = engine.removeDuplicates(results)
      
      expect(deduplicatedResults).toHaveLength(2)
      expect(deduplicatedResults).toEqual(results)
    })
  })

  describe('Configuration options', () => {
    it('should respect title similarity threshold', () => {
      const strictEngine = new DuplicateDetectionEngine({
        ...defaultOptions,
        titleSimilarityThreshold: 0.95
      })

      const results: ScholarSearchResult[] = [
        {
          title: 'Machine Learning in Healthcare',
          authors: ['Smith, J.'],
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Deep Learning for Medical Applications',
          authors: ['Smith, J.'],
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = strictEngine.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(0) // Should not detect with strict threshold
    })

    it('should respect author similarity threshold', () => {
      const strictEngine = new DuplicateDetectionEngine({
        ...defaultOptions,
        authorSimilarityThreshold: 0.95
      })

      const results: ScholarSearchResult[] = [
        {
          title: 'Machine Learning in Healthcare',
          authors: ['Smith, J.', 'Doe, A.'],
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Machine Learning in Healthcare',
          authors: ['Smith, John'],
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = strictEngine.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(0) // Should not detect with strict threshold
    })
  })

  describe('Edge cases', () => {
    it('should handle empty results array', () => {
      const duplicateGroups = engine.detectDuplicates([])
      expect(duplicateGroups).toHaveLength(0)
    })

    it('should handle single result', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Single Paper',
          authors: ['Author'],
          confidence: 0.9,
          relevance_score: 0.8
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      expect(duplicateGroups).toHaveLength(0)
    })

    it('should handle results with missing fields', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Paper with minimal data',
          authors: [],
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Paper with minimal data',
          authors: [],
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(1) // Should still detect based on title
    })

    it('should handle very long author lists', () => {
      const longAuthorList = Array.from({ length: 50 }, (_, i) => `Author${i}`)
      
      const results: ScholarSearchResult[] = [
        {
          title: 'Paper with many authors',
          authors: longAuthorList,
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Paper with many authors',
          authors: longAuthorList.slice(0, 25), // Partial overlap
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(1)
    })
  })

  describe('Performance considerations', () => {
    it('should handle large result sets efficiently', () => {
      const results: ScholarSearchResult[] = Array.from({ length: 100 }, (_, i) => ({
        title: `Paper ${i}`,
        authors: [`Author ${i}`],
        confidence: 0.8 + (i % 20) * 0.01,
        relevance_score: 0.7 + (i % 15) * 0.01
      }))

      // Add some duplicates
      results.push({
        title: 'Paper 0',
        authors: ['Author 0'],
        confidence: 0.9,
        relevance_score: 0.8
      })

      const startTime = Date.now()
      const duplicateGroups = engine.detectDuplicates(results)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
      expect(duplicateGroups).toHaveLength(1) // Should find the duplicate
    })
  })
})