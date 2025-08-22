/**
 * Unit tests for URL metadata extraction functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  validateAndSanitizeUrl, 
  parseHtmlMetadata, 
  extractUrlMetadata 
} from '../worker/lib/url-metadata-extractor.js';
import { ReferenceType } from '../lib/ai-types.js';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('URL Metadata Extractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateAndSanitizeUrl', () => {
    it('should validate and sanitize a proper HTTP URL', () => {
      const result = validateAndSanitizeUrl('https://example.com/article');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://example.com/article');
    });

    it('should add HTTPS protocol to URLs without protocol', () => {
      const result = validateAndSanitizeUrl('example.com/article');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://example.com/article');
    });

    it('should reject empty or invalid URLs', () => {
      expect(validateAndSanitizeUrl('').isValid).toBe(false);
      expect(validateAndSanitizeUrl('   ').isValid).toBe(false);
      expect(validateAndSanitizeUrl('not-a-url').isValid).toBe(false);
      expect(validateAndSanitizeUrl('ftp://example.com').isValid).toBe(false);
    });

    it('should reject localhost and private IP addresses', () => {
      expect(validateAndSanitizeUrl('http://localhost:3000').isValid).toBe(false);
      expect(validateAndSanitizeUrl('https://127.0.0.1').isValid).toBe(false);
      expect(validateAndSanitizeUrl('https://192.168.1.1').isValid).toBe(false);
      expect(validateAndSanitizeUrl('https://10.0.0.1').isValid).toBe(false);
    });

    it('should handle malformed URLs gracefully', () => {
      const result = validateAndSanitizeUrl('https://');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid URL format');
    });
  });

  describe('parseHtmlMetadata', () => {
    it('should extract Open Graph metadata', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="Test Article Title" />
            <meta property="og:description" content="This is a test article description" />
            <meta property="og:site_name" content="Test Publisher" />
          </head>
        </html>
      `;
      
      const metadata = parseHtmlMetadata(html, 'https://example.com/article');
      
      expect(metadata.title).toBe('Test Article Title');
      expect(metadata.abstract).toBe('This is a test article description');
      expect(metadata.publisher).toBe('Test Publisher');
      expect(metadata.url).toBe('https://example.com/article');
      expect(metadata.type).toBe(ReferenceType.WEBSITE);
    });

    it('should extract Dublin Core metadata', () => {
      const html = `
        <html>
          <head>
            <meta name="DC.title" content="Research Paper Title" />
            <meta name="DC.creator" content="John Doe" />
            <meta name="DC.creator" content="Jane Smith" />
            <meta name="DC.date" content="2023-01-15" />
            <meta name="DC.publisher" content="Academic Press" />
          </head>
        </html>
      `;
      
      const metadata = parseHtmlMetadata(html, 'https://academic.edu/paper');
      
      expect(metadata.title).toBe('Research Paper Title');
      expect(metadata.authors).toHaveLength(2);
      expect(metadata.authors?.[0].firstName).toBe('John');
      expect(metadata.authors?.[0].lastName).toBe('Doe');
      expect(metadata.authors?.[1].firstName).toBe('Jane');
      expect(metadata.authors?.[1].lastName).toBe('Smith');
      expect(metadata.publicationDate).toEqual(new Date('2023-01-15'));
      expect(metadata.publisher).toBe('Academic Press');
    });

    it('should extract academic citation metadata', () => {
      const html = `
        <html>
          <head>
            <meta name="citation_title" content="Advanced Machine Learning Techniques" />
            <meta name="citation_author" content="Smith, John A." />
            <meta name="citation_author" content="Doe, Jane B." />
            <meta name="citation_date" content="2023" />
            <meta name="citation_journal_title" content="Journal of AI Research" />
            <meta name="citation_volume" content="15" />
            <meta name="citation_issue" content="3" />
            <meta name="citation_firstpage" content="123" />
            <meta name="citation_doi" content="10.1000/182" />
            <meta name="citation_publisher" content="AI Research Society" />
          </head>
        </html>
      `;
      
      const metadata = parseHtmlMetadata(html, 'https://journal.ai/article');
      
      expect(metadata.title).toBe('Advanced Machine Learning Techniques');
      expect(metadata.authors?.length).toBeGreaterThanOrEqual(2);
      expect(metadata.authors?.[0].firstName).toBe('John A.');
      expect(metadata.authors?.[0].lastName).toBe('Smith');
      expect(metadata.journal).toBe('Journal of AI Research');
      expect(metadata.volume).toBe('15');
      expect(metadata.issue).toBe('3');
      expect(metadata.pages).toBe('123');
      expect(metadata.doi).toBe('10.1000/182');
      expect(metadata.publisher).toBe('AI Research Society');
      expect(metadata.type).toBe(ReferenceType.JOURNAL_ARTICLE);
    });

    it('should handle multiple author formats', () => {
      const html = `
        <html>
          <head>
            <meta name="citation_author" content="Smith, John A." />
            <meta name="citation_author" content="Jane Doe and Bob Wilson" />
            <meta name="citation_author" content="Alice Cooper; David Brown" />
          </head>
        </html>
      `;
      
      const metadata = parseHtmlMetadata(html, 'https://example.com');
      
      expect(metadata.authors?.length).toBeGreaterThanOrEqual(5);
      expect(metadata.authors?.[0].lastName).toBe('Smith');
      expect(metadata.authors?.[1].firstName).toBe('Jane');
      expect(metadata.authors?.[1].lastName).toBe('Doe');
      expect(metadata.authors?.[2].firstName).toBe('Bob');
      expect(metadata.authors?.[2].lastName).toBe('Wilson');
    });

    it('should determine reference type based on URL and metadata', () => {
      // Journal article
      const journalHtml = `<meta name="citation_journal_title" content="Nature" />`;
      const journalMetadata = parseHtmlMetadata(journalHtml, 'https://nature.com/article');
      expect(journalMetadata.type).toBe(ReferenceType.JOURNAL_ARTICLE);

      // Academic thesis
      const thesisMetadata = parseHtmlMetadata('', 'https://university.edu/thesis/123');
      expect(thesisMetadata.type).toBe(ReferenceType.THESIS);

      // Book with ISBN
      const bookHtml = `<meta name="citation_isbn" content="978-0123456789" />`;
      const bookMetadata = parseHtmlMetadata(bookHtml, 'https://publisher.com/book');
      expect(bookMetadata.type).toBe(ReferenceType.BOOK);

      // Default website
      const websiteMetadata = parseHtmlMetadata('', 'https://blog.com/post');
      expect(websiteMetadata.type).toBe(ReferenceType.WEBSITE);
    });

    it('should calculate confidence scores appropriately', () => {
      // High confidence with complete metadata
      const completeHtml = `
        <meta name="citation_title" content="Complete Article" />
        <meta name="citation_author" content="John Doe" />
        <meta name="citation_date" content="2023" />
        <meta name="citation_journal_title" content="Test Journal" />
        <meta name="citation_doi" content="10.1000/123" />
        <meta name="citation_publisher" content="Test Publisher" />
        <meta name="citation_volume" content="1" />
      `;
      const completeMetadata = parseHtmlMetadata(completeHtml, 'https://example.com');
      expect(completeMetadata.confidence).toBeGreaterThan(0.8);

      // Low confidence with minimal metadata
      const minimalHtml = `<title>Basic Title</title>`;
      const minimalMetadata = parseHtmlMetadata(minimalHtml, 'https://example.com');
      expect(minimalMetadata.confidence).toBeLessThan(0.7);
    });

    it('should handle missing or malformed dates', () => {
      const html = `
        <meta name="citation_date" content="invalid-date" />
        <meta name="DC.date" content="2023-13-45" />
      `;
      
      const metadata = parseHtmlMetadata(html, 'https://example.com');
      expect(metadata.publicationDate).toBeNull();
    });

    it('should extract keywords from meta tags', () => {
      const html = `
        <meta name="keywords" content="machine learning, AI, neural networks, deep learning" />
      `;
      
      const metadata = parseHtmlMetadata(html, 'https://example.com');
      expect(metadata.keywords).toEqual(['machine learning', 'AI', 'neural networks', 'deep learning']);
    });
  });

  describe('extractUrlMetadata', () => {
    it('should successfully extract metadata from a valid URL', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta name="citation_title" content="Test Research Paper" />
            <meta name="citation_author" content="John Doe" />
            <meta name="citation_date" content="2023" />
            <meta name="citation_journal_title" content="Test Journal" />
          </head>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html; charset=utf-8']]),
        text: () => Promise.resolve(mockHtml)
      });

      const metadata = await extractUrlMetadata('https://example.com/article');
      
      expect(metadata.title).toBe('Test Research Paper');
      expect(metadata.authors).toHaveLength(1);
      expect(metadata.authors?.[0].firstName).toBe('John');
      expect(metadata.authors?.[0].lastName).toBe('Doe');
      expect(metadata.journal).toBe('Test Journal');
      expect(metadata.type).toBe(ReferenceType.JOURNAL_ARTICLE);
    });

    it('should handle HTTP errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(extractUrlMetadata('https://example.com/nonexistent'))
        .rejects.toThrow('HTTP 404: Not Found');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(extractUrlMetadata('https://example.com/article'))
        .rejects.toThrow('Failed to extract metadata from URL: Network error');
    });

    it('should reject non-HTML content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        text: () => Promise.resolve('{"data": "json"}')
      });

      await expect(extractUrlMetadata('https://api.example.com/data'))
        .rejects.toThrow('URL does not point to an HTML document');
    });

    it('should handle empty responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: () => Promise.resolve('')
      });

      await expect(extractUrlMetadata('https://example.com/empty'))
        .rejects.toThrow('Empty response from URL');
    });

    it('should use fallback extraction for minimal metadata', async () => {
      const mockHtml = `
        <html>
          <head><title>Basic Page</title></head>
          <body><h1>Main Heading</h1></body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: () => Promise.resolve(mockHtml)
      });

      const metadata = await extractUrlMetadata('https://example.com/basic');
      
      expect(metadata.title).toBe('Basic Page');
      expect(metadata.confidence).toBeLessThan(0.7);
    });

    it('should validate URL before processing', async () => {
      await expect(extractUrlMetadata('invalid-url'))
        .rejects.toThrow('Invalid URL format');
      
      await expect(extractUrlMetadata(''))
        .rejects.toThrow('URL is required and must be a string');
    });

    it('should handle timeout scenarios', async () => {
      // Mock a timeout scenario
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(extractUrlMetadata('https://slow-example.com'))
        .rejects.toThrow('Failed to extract metadata from URL');
    });
  });
});