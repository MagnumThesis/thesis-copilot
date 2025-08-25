/**
 * Unit tests for DOI metadata extraction functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  validateDoi, 
  extractDoiMetadata, 
  extractMultipleDoiMetadata,
  checkDoiAccessibility 
} from '../worker/lib/doi-metadata-extractor.js';
import { ReferenceType } from '../lib/ai-types.js';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('DOI Metadata Extractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateDoi', () => {
    it('should validate proper DOI format', () => {
      const result = validateDoi('10.1000/182');
      expect(result.isValid).toBe(true);
      expect(result.normalizedDoi).toBe('10.1000/182');
    });

    it('should normalize DOI with prefixes', () => {
      const testCases = [
        'https://doi.org/10.1000/182',
        'https://dx.doi.org/10.1000/182',
        'doi:10.1000/182',
        'DOI:10.1000/182'
      ];

      testCases.forEach(doi => {
        const result = validateDoi(doi);
        expect(result.isValid).toBe(true);
        expect(result.normalizedDoi).toBe('10.1000/182');
      });
    });

    it('should reject invalid DOI formats', () => {
      const invalidDois = [
        '',
        '   ',
        'not-a-doi',
        '10.1000',
        '10/182',
        'invalid.doi/123'
      ];

      invalidDois.forEach(doi => {
        const result = validateDoi(doi);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should handle null and undefined inputs', () => {
      expect(validateDoi(null as any).isValid).toBe(false);
      expect(validateDoi(undefined as any).isValid).toBe(false);
    });
  });

  describe('extractDoiMetadata', () => {
    const mockCrossRefResponse = {
      message: {
        title: ['Advanced Machine Learning Techniques'],
        author: [
          { given: 'John', family: 'Smith' },
          { given: 'Jane', family: 'Doe' }
        ],
        'published-print': {
          'date-parts': [[2023, 3, 15]]
        },
        'container-title': ['Journal of AI Research'],
        volume: '15',
        issue: '3',
        page: '123-145',
        publisher: 'AI Research Society',
        DOI: '10.1000/182',
        type: 'journal-article',
        abstract: 'This paper presents advanced machine learning techniques...'
      }
    };

    it('should successfully extract metadata from CrossRef API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockCrossRefResponse)
      });

      const metadata = await extractDoiMetadata('10.1000/182');

      expect(metadata.title).toBe('Advanced Machine Learning Techniques');
      expect(metadata.authors).toHaveLength(2);
      expect(metadata.authors?.[0].firstName).toBe('John');
      expect(metadata.authors?.[0].lastName).toBe('Smith');
      expect(metadata.authors?.[1].firstName).toBe('Jane');
      expect(metadata.authors?.[1].lastName).toBe('Doe');
      expect(metadata.publicationDate).toEqual(new Date(2023, 2, 15)); // Month is 0-indexed
      expect(metadata.journal).toBe('Journal of AI Research');
      expect(metadata.volume).toBe('15');
      expect(metadata.issue).toBe('3');
      expect(metadata.pages).toBe('123-145');
      expect(metadata.publisher).toBe('AI Research Society');
      expect(metadata.doi).toBe('10.1000/182');
      expect(metadata.type).toBe(ReferenceType.JOURNAL_ARTICLE);
      expect(metadata.abstract).toBe('This paper presents advanced machine learning techniques...');
      expect(metadata.confidence).toBeGreaterThan(0.8);
    });

    it('should handle different reference types', async () => {
      const bookResponse = {
        message: {
          title: ['Machine Learning Handbook'],
          author: [{ given: 'Alice', family: 'Johnson' }],
          'published-print': { 'date-parts': [[2022]] },
          publisher: 'Tech Books',
          ISBN: ['978-0123456789'],
          type: 'book'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(bookResponse)
      });

      const metadata = await extractDoiMetadata('10.1000/book123');

      expect(metadata.type).toBe(ReferenceType.BOOK);
      expect(metadata.isbn).toBe('978-0123456789');
      expect(metadata.title).toBe('Machine Learning Handbook');
    });

    it('should handle conference papers', async () => {
      const conferenceResponse = {
        message: {
          title: ['Neural Networks in Practice'],
          author: [{ given: 'Bob', family: 'Wilson' }],
          'published-print': { 'date-parts': [[2023, 6]] },
          'container-title': ['Proceedings of AI Conference 2023'],
          type: 'proceedings-article'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(conferenceResponse)
      });

      const metadata = await extractDoiMetadata('10.1000/conf123');

      expect(metadata.type).toBe(ReferenceType.CONFERENCE_PAPER);
      expect(metadata.journal).toBe('Proceedings of AI Conference 2023');
    });

    it('should handle page information variations', async () => {
      const responseWithSeparatePages = {
        message: {
          title: ['Test Article'],
          'first-page': '100',
          'last-page': '120',
          type: 'journal-article'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responseWithSeparatePages)
      });

      const metadata = await extractDoiMetadata('10.1000/pages123');
      expect(metadata.pages).toBe('100-120');
    });

    it('should handle DOI not found error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(extractDoiMetadata('10.1000/nonexistent'))
        .rejects.toThrow('DOI not found: 10.1000/nonexistent');
    });

    it('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      await expect(extractDoiMetadata('10.1000/ratelimited'))
        .rejects.toThrow('Rate limit exceeded. Please try again later.');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(extractDoiMetadata('10.1000/network'))
        .rejects.toThrow('Failed to extract DOI metadata: Network error');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(timeoutError);

      await expect(extractDoiMetadata('10.1000/timeout'))
        .rejects.toThrow('Request timeout while fetching DOI metadata');
    });

    it('should handle invalid API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}) // Empty response
      });

      await expect(extractDoiMetadata('10.1000/empty'))
        .rejects.toThrow('Invalid response from CrossRef API');
    });

    it('should handle responses with no meaningful data', async () => {
      const emptyResponse = {
        message: {
          type: 'journal-article'
          // No title, authors, or other meaningful data
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(emptyResponse)
      });

      await expect(extractDoiMetadata('10.1000/nomeaningfuldata'))
        .rejects.toThrow('No meaningful metadata found for DOI');
    });

    it('should validate DOI before making API call', async () => {
      await expect(extractDoiMetadata('invalid-doi'))
        .rejects.toThrow('Invalid DOI format');
    });

    it('should handle missing date parts gracefully', async () => {
      const responseWithInvalidDate = {
        message: {
          title: ['Test Article'],
          'published-print': {
            'date-parts': [] // Empty date parts
          },
          type: 'journal-article'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responseWithInvalidDate)
      });

      const metadata = await extractDoiMetadata('10.1000/nodate');
      expect(metadata.publicationDate).toBeNull();
    });

    it('should handle authors with missing names', async () => {
      const responseWithIncompleteAuthors = {
        message: {
          title: ['Test Article'],
          author: [
            { given: 'John', family: 'Smith' },
            { family: 'Doe' }, // Missing given name
            { given: 'Jane' }, // Missing family name
            {} // Empty author object
          ],
          type: 'journal-article'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responseWithIncompleteAuthors)
      });

      const metadata = await extractDoiMetadata('10.1000/incompleteauthors');
      expect(metadata.authors).toHaveLength(3); // Should filter out empty author
      expect(metadata.authors?.[0].firstName).toBe('John');
      expect(metadata.authors?.[1].firstName).toBe('');
      expect(metadata.authors?.[1].lastName).toBe('Doe');
      expect(metadata.authors?.[2].firstName).toBe('Jane');
      expect(metadata.authors?.[2].lastName).toBe('');
    });
  });

  describe('extractMultipleDoiMetadata', () => {
    it('should extract metadata for multiple DOIs', async () => {
      const response1 = {
        message: {
          title: ['Article 1'],
          author: [{ given: 'John', family: 'Smith' }],
          type: 'journal-article'
        }
      };

      const response2 = {
        message: {
          title: ['Article 2'],
          author: [{ given: 'Jane', family: 'Doe' }],
          type: 'journal-article'
        }
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(response1)
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(response2)
        });

      const results = await extractMultipleDoiMetadata(['10.1000/1', '10.1000/2']);

      expect(results).toHaveLength(2);
      expect(results[0].metadata?.title).toBe('Article 1');
      expect(results[1].metadata?.title).toBe('Article 2');
      expect(results[0].error).toBeUndefined();
      expect(results[1].error).toBeUndefined();
    });

    it('should handle mixed success and failure', async () => {
      const successResponse = {
        message: {
          title: ['Successful Article'],
          type: 'journal-article'
        }
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(successResponse)
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        });

      const results = await extractMultipleDoiMetadata(['10.1000/success', '10.1000/fail']);

      expect(results).toHaveLength(2);
      expect(results[0].metadata?.title).toBe('Successful Article');
      expect(results[0].error).toBeUndefined();
      expect(results[1].metadata).toBeUndefined();
      expect(results[1].error).toContain('DOI not found');
    });
  });

  describe('checkDoiAccessibility', () => {
    it('should return accessible true for valid DOI', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const result = await checkDoiAccessibility('10.1000/182');
      expect(result.accessible).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return accessible false for invalid DOI', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await checkDoiAccessibility('10.1000/nonexistent');
      expect(result.accessible).toBe(false);
    });

    it('should handle network errors in accessibility check', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkDoiAccessibility('10.1000/network');
      expect(result.accessible).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should validate DOI format before checking accessibility', async () => {
      const result = await checkDoiAccessibility('invalid-doi');
      expect(result.accessible).toBe(false);
      expect(result.error).toContain('Invalid DOI format');
    });
  });
});