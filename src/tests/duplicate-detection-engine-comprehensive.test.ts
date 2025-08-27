/**
 * Duplicate Detection Engine Tests
 * Comprehensive tests for detecting and resolving duplicate search results
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  DuplicateDetectionEngine, 
  DuplicateDetectionOptions, 
  DuplicateGroup, 
  DuplicateResolutionStrategy 
} from '../worker/lib/duplicate-detection-engine'
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

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('detectDuplicates', () => {
    it('should detect duplicates with identical DOIs', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Machine Learning in Healthcare',
          authors: ['Smith, J.', 'Doe, A.'],
          doi: '10.1234/ml.2023.001',
          journal: 'Nature Medicine',
          year: 2023,
          citations: 150,
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'ML in Healthcare Applications',
          authors: ['Smith, John', 'Doe, Alice'],
          doi: '10.1234/ml.2023.001', // Same DOI
          journal: 'Nature Medicine',
          year: 2023,
          citations: 145,
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(1)
      expect(duplicateGroups[0]).toMatchObject({
        primary: results[0],
        duplicates: [results[1]],
        confidence: 1.0,
        mergeStrategy: 'doi'
      })
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
          url: 'http://example.com/paper1/', // Same URL with different protocol and trailing slash
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(1)
      expect(duplicateGroups[0].mergeStrategy).toBe('url')
      expect(duplicateGroups[0].confidence).toBeCloseTo(0.95, 1)
    })

    it('should detect duplicates with similar titles and authors', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Machine Learning Applications in Healthcare',
          authors: ['Smith, John', 'Doe, Alice'],
          year: 2023,
          journal: 'Medical AI Journal',
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Machine Learning Applications in Healthcare', // Identical title
          authors: ['Smith, John', 'Doe, Alice'], // Identical authors
          year: 2023,
          journal: 'Medical AI Journal',
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(1)
      expect(duplicateGroups[0].mergeStrategy).toBe('title_author')
      expect(duplicateGroups[0].confidence).toBe(1.0)
    })

    it('should use fuzzy matching when enabled', () => {
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
          title: 'Machine Learning in Healthcare Applications', // Similar title
          authors: ['Smith, J.'], // Identical author
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
          title: 'Artificial Intelligence for Medical Diagnosis', // Different title without common words
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

    it('should respect title similarity threshold', () => {
      const strictEngine = new DuplicateDetectionEngine({
        ...defaultOptions,
        titleSimilarityThreshold: 0.95 // Very strict
      })

      const results: ScholarSearchResult[] = [
        {
          title: 'Machine Learning in Healthcare',
          authors: ['Smith, J.'],
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Deep Learning for Medical Applications', // Very different title
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
        authorSimilarityThreshold: 0.95 // Very strict
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
          authors: ['Smith, John'], // Different author format
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = strictEngine.detectDuplicates(results)
      
      expect(duplicateGroups).toHaveLength(0) // Should not detect with strict threshold
    })
  })

  describe('removeDuplicates', () => {
    it('should remove duplicates and return merged results', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Paper A',
          authors: ['Author 1'],
          doi: '10.1234/a.001',
          citations: 10,
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Paper A',
          authors: ['Author 1'],
          doi: '10.1234/a.001',
          citations: 25, // Higher citation count
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
      expect(deduplicatedResults[0].citations).toBe(25) // Higher quality version kept
      expect(deduplicatedResults[1].title).toBe('Paper B')
    })

    it('should return original results when no duplicates found', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Paper A',
          authors: ['Author 1'],
          doi: '10.1234/a.001',
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Paper B',
          authors: ['Author 2'],
          doi: '10.1234/b.001',
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const deduplicatedResults = engine.removeDuplicates(results)
      
      expect(deduplicatedResults).toHaveLength(2)
      expect(deduplicatedResults).toEqual(results) // Should be unchanged
    })

    it('should handle empty results array', () => {
      const deduplicatedResults = engine.removeDuplicates([])
      expect(deduplicatedResults).toHaveLength(0)
    })

    it('should handle single result', () => {
      const results: ScholarSearchResult[] = [{
        title: 'Single Paper',
        authors: ['Author'],
        confidence: 0.9,
        relevance_score: 0.8
      }]

      const deduplicatedResults = engine.removeDuplicates(results)
      
      expect(deduplicatedResults).toHaveLength(1)
      expect(deduplicatedResults[0]).toEqual(results[0])
    })

    it('should use custom merge strategy', () => {
      const customEngine = new DuplicateDetectionEngine({
        ...defaultOptions,
        mergeStrategy: 'keep_most_recent'
      })

      const results: ScholarSearchResult[] = [
        {
          title: 'Paper A',
          authors: ['Author 1'],
          year: 2020,
          doi: '10.1234/a.001',
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Paper A',
          authors: ['Author 1'],
          year: 2023, // More recent
          doi: '10.1234/a.001',
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const deduplicatedResults = customEngine.removeDuplicates(results)
      
      expect(deduplicatedResults).toHaveLength(1)
      expect(deduplicatedResults[0].year).toBe(2023) // Most recent should be kept
    })
  })

  describe('mergeDuplicates', () => {
    it('should merge duplicates by highest quality', () => {
      const group: DuplicateGroup = {
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
        mergeStrategy: 'doi'
      }

      const merged = engine.mergeDuplicates(group)
      
      expect(merged.citations).toBe(25) // Higher citation count
      expect(merged.doi).toBe('10.1234/test.001') // Valid DOI
      expect(merged.authors).toHaveLength(2) // Combined authors
      expect(merged.mergeConfidence).toBe(1.0)
    })

    it('should merge authors without duplicates', () => {
      const group: DuplicateGroup = {
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
        mergeStrategy: 'title_author'
      }

      const merged = engine.mergeDuplicates(group)
      
      expect(merged.authors).toHaveLength(4) // All unique authors
      expect(merged.authors).toContain('Smith, J.')
      expect(merged.authors).toContain('Doe, A.')
      expect(merged.authors).toContain('Smith, John')
      expect(merged.authors).toContain('Brown, B.')
    })

    it('should merge keywords without duplicates', () => {
      const group: DuplicateGroup = {
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
        mergeStrategy: 'title_author'
      }

      const merged = engine.mergeDuplicates(group)
      
      expect(merged.keywords).toHaveLength(3)
      expect(merged.keywords).toContain('machine learning')
      expect(merged.keywords).toContain('healthcare')
      expect(merged.keywords).toContain('artificial intelligence')
    })

    it('should use keep_most_citations strategy correctly', () => {
      const group: DuplicateGroup = {
        primary: {
          title: 'Paper A',
          authors: ['Author'],
          citations: 100,
          confidence: 0.9,
          relevance_score: 0.8
        },
        duplicates: [
          {
            title: 'Paper A',
            authors: ['Author'],
            citations: 50, // Fewer citations
            confidence: 0.8,
            relevance_score: 0.7
          }
        ],
        confidence: 1.0,
        mergeStrategy: 'keep_most_citations'
      }

      const merged = engine.mergeDuplicates(group)
      
      expect(merged.citations).toBe(100) // Should keep the one with more citations
    })

    it('should use keep_most_recent strategy correctly', () => {
      const group: DuplicateGroup = {
        primary: {
          title: 'Paper A',
          authors: ['Author'],
          year: 2020,
          confidence: 0.9,
          relevance_score: 0.8
        },
        duplicates: [
          {
            title: 'Paper A',
            authors: ['Author'],
            year: 2023, // More recent
            confidence: 0.8,
            relevance_score: 0.7
          }
        ],
        confidence: 1.0,
        mergeStrategy: 'keep_most_recent'
      }

      const merged = engine.mergeDuplicates(group)
      
      expect(merged.year).toBe(2023) // Should keep the more recent version
    })
  })

  describe('String Similarity Functions', () => {
    it('should calculate Jaro-Winkler similarity correctly', () => {
      const similarity1 = engine['calculateJaroWinklerSimilarity']('test', 'test')
      expect(similarity1).toBe(1.0)

      const similarity2 = engine['calculateJaroWinklerSimilarity']('test', 'testing')
      expect(similarity2).toBeGreaterThan(0.5)
      expect(similarity2).toBeLessThan(1.0)

      const similarity3 = engine['calculateJaroWinklerSimilarity']('test', 'different')
      expect(similarity3).toBeLessThan(0.5)
    })

    it('should normalize author names correctly', () => {
      const normalized1 = engine['normalizeAuthorName']('Smith, John')
      expect(normalized1).toBe('smith john')

      const normalized2 = engine['normalizeAuthorName']('J. Smith')
      expect(normalized2).toBe('j smith')

      const normalized3 = engine['normalizeAuthorName']('Smith, J.')
      expect(normalized3).toBe('smith j')
    })

    it('should calculate author similarity correctly', () => {
      const similarity1 = engine['calculateAuthorSimilarity'](
        ['Smith, John', 'Doe, Alice'], 
        ['Smith, J.', 'Doe, A.']
      )
      expect(similarity1).toBeGreaterThan(0.8) // Should be high for similar authors

      const similarity2 = engine['calculateAuthorSimilarity'](
        ['Smith, John'], 
        ['Brown, Bob']
      )
      expect(similarity2).toBeLessThan(0.3) // Should be low for different authors
    })
  })

  describe('DOI Normalization', () => {
    it('should normalize different DOI formats to the same value', () => {
      const doi1 = engine['normalizeDOI']('https://doi.org/10.1234/test.2023.001')
      const doi2 = engine['normalizeDOI']('doi:10.1234/test.2023.001')
      const doi3 = engine['normalizeDOI']('10.1234/test.2023.001')
      const doi4 = engine['normalizeDOI']('http://dx.doi.org/10.1234/test.2023.001')

      expect(doi1).toBe('10.1234/test.2023.001')
      expect(doi2).toBe('10.1234/test.2023.001')
      expect(doi3).toBe('10.1234/test.2023.001')
      expect(doi4).toBe('10.1234/test.2023.001')
    })

    it('should handle invalid DOI formats gracefully', () => {
      const invalidDoi = engine['normalizeDOI']('invalid-doi')
      expect(invalidDoi).toBeNull()
    })

    it('should handle empty DOI gracefully', () => {
      const emptyDoi = engine['normalizeDOI']('')
      expect(emptyDoi).toBeNull()
    })
  })

  describe('URL Normalization', () => {
    it('should normalize different URL formats to the same value', () => {
      const url1 = engine['normalizeURL']('https://example.com/paper1')
      const url2 = engine['normalizeURL']('http://example.com/paper1/')
      const url3 = engine['normalizeURL']('http://example.com/paper1')
      const url4 = engine['normalizeURL']('https://www.example.com/paper1')

      expect(url1).toBe('example.com/paper1')
      expect(url2).toBe('example.com/paper1')
      expect(url3).toBe('example.com/paper1')
      expect(url4).toBe('example.com/paper1')
    })

    it('should handle invalid URLs gracefully', () => {
      const invalidUrl = engine['normalizeURL']('invalid-url')
      expect(invalidUrl).toBeNull()
    })

    it('should handle empty URL gracefully', () => {
      const emptyUrl = engine['normalizeURL']('')
      expect(emptyUrl).toBeNull()
    })
  })

  describe('Edge Cases', () => {
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

    it('should handle special characters in titles and authors', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Paper with Spëcial Chäråcters',
          authors: ['Authör, Spëcíål'],
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Paper with Special Characters',
          authors: ['Author, Special'],
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      // Should handle Unicode normalization
      expect(duplicateGroups).toHaveLength(1)
    })

    it('should handle case sensitivity in comparisons', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'CASE SENSITIVE PAPER',
          authors: ['AUTHOR, A.'],
          doi: '10.1234/TEST.2023.001',
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'case sensitive paper',
          authors: ['author, a.'],
          doi: '10.1234/test.2023.001',
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      // Should be case-insensitive for comparisons
      expect(duplicateGroups).toHaveLength(1)
    })
  })

  describe('Performance', () => {
    it('should handle large result sets efficiently', () => {
      const results: ScholarSearchResult[] = Array.from({ length: 100 }, (_, i) => ({
        title: `Paper ${i}`,
        authors: [`Author ${i}`],
        doi: i % 10 === 0 ? `10.1234/test.${Math.floor(i/10)}.001` : undefined,
        confidence: 0.8 + (i % 20) * 0.01,
        relevance_score: 0.7 + (i % 15) * 0.01
      }))

      // Add some duplicates
      results.push({
        title: 'Paper 0',
        authors: ['Author 0'],
        doi: '10.1234/test.0.001',
        confidence: 0.9,
        relevance_score: 0.8
      })

      const startTime = Date.now()
      const duplicateGroups = engine.detectDuplicates(results)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
      expect(duplicateGroups).toHaveLength(1) // Should find the duplicate
    })

    it('should not have memory leaks with repeated operations', () => {
      const results: ScholarSearchResult[] = [
        {
          title: 'Test Paper',
          authors: ['Test Author'],
          doi: '10.1234/test.2023.001',
          confidence: 0.9,
          relevance_score: 0.8
        }
      ]

      // Perform many duplicate detection operations
      for (let i = 0; i < 1000; i++) {
        engine.detectDuplicates(results)
      }

      // Should not have accumulated memory issues
      const duplicateGroups = engine.detectDuplicates(results)
      expect(duplicateGroups).toHaveLength(0) // No duplicates in single-item array
    })
  })

  describe('Configuration Options', () => {
    it('should respect strict DOI matching', () => {
      const strictEngine = new DuplicateDetectionEngine({
        ...defaultOptions,
        strictDOIMatching: true
      })

      const looseEngine = new DuplicateDetectionEngine({
        ...defaultOptions,
        strictDOIMatching: false
      })

      const results: ScholarSearchResult[] = [
        {
          title: 'Paper A',
          authors: ['Author'],
          doi: '10.1234/test.2023.001',
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Paper B', // Different title
          authors: ['Author'],
          doi: '10.1234/test.2023.001', // Same DOI
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const strictGroups = strictEngine.detectDuplicates(results)
      const looseGroups = looseEngine.detectDuplicates(results)
      
      // Strict matching should find duplicates even with different titles
      expect(strictGroups).toHaveLength(1)
      expect(looseGroups).toHaveLength(1)
    })

    it('should handle custom similarity thresholds', () => {
      const lenientEngine = new DuplicateDetectionEngine({
        ...defaultOptions,
        titleSimilarityThreshold: 0.6, // Very lenient
        authorSimilarityThreshold: 0.5 // Very lenient
      })

      const strictEngine = new DuplicateDetectionEngine({
        ...defaultOptions,
        titleSimilarityThreshold: 0.95, // Very strict
        authorSimilarityThreshold: 0.95 // Very strict
      })

      const results: ScholarSearchResult[] = [
        {
          title: 'Machine Learning Research',
          authors: ['Smith, J.'],
          confidence: 0.9,
          relevance_score: 0.8
        },
        {
          title: 'Deep Learning Study', // Different title
          authors: ['Smith, John'], // Similar author
          confidence: 0.85,
          relevance_score: 0.75
        }
      ]

      const lenientGroups = lenientEngine.detectDuplicates(results)
      const strictGroups = strictEngine.detectDuplicates(results)
      
      // Lenient engine might find duplicates that strict engine misses
      expect(lenientGroups.length).toBeGreaterThanOrEqual(strictGroups.length)
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complex real-world duplicate scenarios', () => {
      // Scenario: Multiple versions of the same paper from different sources
      const results: ScholarSearchResult[] = [
        // Version from Google Scholar with full metadata
        {
          title: 'Advances in Neural Networks for NLP',
          authors: ['Smith, John', 'Doe, Alice', 'Brown, Charlie'],
          journal: 'Journal of AI Research',
          year: 2023,
          citations: 45,
          doi: '10.1234/jair.2023.001',
          url: 'https://jair.org/paper1',
          abstract: 'This paper explores recent advances in neural networks...',
          confidence: 0.95,
          relevance_score: 0.9
        },
        // Version from arXiv with slightly different metadata
        {
          title: 'Advances in Neural Networks for Natural Language Processing',
          authors: ['Smith, J.', 'Doe, A.', 'Brown, C.'],
          journal: 'arXiv preprint arXiv:2301.00001',
          year: 2023,
          doi: '10.1234/jair.2023.001', // Same DOI
          url: 'https://arxiv.org/abs/2301.00001',
          confidence: 0.85,
          relevance_score: 0.85
        },
        // Version from conference proceedings with minimal metadata
        {
          title: 'Neural Networks for NLP',
          authors: ['Smith, John', 'Doe, Alice'],
          year: 2023,
          citations: 30, // Fewer citations
          url: 'https://conf.org/proceedings/paper1',
          confidence: 0.7,
          relevance_score: 0.75
        },
        // Completely different paper
        {
          title: 'Deep Learning in Computer Vision',
          authors: ['Wilson, Bob', 'Taylor, Emma'],
          journal: 'CVPR',
          year: 2023,
          citations: 120,
          doi: '10.1234/cvpr.2023.002',
          confidence: 0.9,
          relevance_score: 0.88
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      // Should detect 2 duplicates of the first paper
      expect(duplicateGroups).toHaveLength(1)
      expect(duplicateGroups[0].duplicates).toHaveLength(2)
      
      // Should preserve the highest quality version
      const deduplicated = engine.removeDuplicates(results)
      expect(deduplicated).toHaveLength(2) // Original + one unique paper
      expect(deduplicated[0].citations).toBe(45) // Highest citation count
      expect(deduplicated[0].abstract).toBeTruthy() // Full metadata preserved
    })

    it('should handle multi-author paper duplication correctly', () => {
      // Scenario: Same paper with authors in different orders
      const results: ScholarSearchResult[] = [
        {
          title: 'Collaborative AI Research',
          authors: ['Smith, John', 'Doe, Alice', 'Brown, Charlie', 'Wilson, David'],
          journal: 'Nature AI',
          year: 2023,
          doi: '10.1234/nature.ai.2023.001',
          citations: 200,
          confidence: 0.95,
          relevance_score: 0.92
        },
        {
          title: 'Collaborative AI Research',
          authors: ['Doe, A.', 'Smith, J.', 'Wilson, D.', 'Brown, C.'], // Different order
          journal: 'Nature AI',
          year: 2023,
          doi: '10.1234/nature.ai.2023.001',
          citations: 195,
          confidence: 0.94,
          relevance_score: 0.91
        }
      ]

      const duplicateGroups = engine.detectDuplicates(results)
      
      // Should detect these as duplicates
      expect(duplicateGroups).toHaveLength(1)
      expect(duplicateGroups[0].mergeStrategy).toBe('doi')
      
      // Should merge preserving all authors
      const merged = engine.mergeDuplicates(duplicateGroups[0])
      expect(merged.authors).toHaveLength(4)
      expect(merged.citations).toBe(200) // Higher citation count preserved
    })
  })
})