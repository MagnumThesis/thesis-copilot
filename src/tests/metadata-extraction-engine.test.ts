/**
 * Integration tests for Metadata Extraction Engine
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  MetadataExtractionEngine, 
  extractMetadata, 
  validateMetadataSource,
  defaultMetadataExtractionEngine 
} from '../worker/lib/metadata-extraction-engine.js';
import { MetadataExtractionRequest } from '../lib/ai-types.js';

// Mock the extraction modules
vi.mock('../worker/lib/url-metadata-extractor.js', () => ({
  extractUrlMetadata: vi.fn(),
  validateAndSanitizeUrl: vi.fn()
}));

vi.mock('../worker/lib/doi-metadata-extractor.js', () => ({
  extractDoiMetadata: vi.fn(),
  validateDoi: vi.fn()
}));

// Import mocked functions
import { extractUrlMetadata, validateAndSanitizeUrl } from '../worker/lib/url-metadata-extractor.js';
import { extractDoiMetadata, validateDoi } from '../worker/lib/doi-metadata-extractor.js';

const mockExtractUrlMetadata = vi.mocked(extractUrlMetadata);
const mockValidateAndSanitizeUrl = vi.mocked(validateAndSanitizeUrl);
const mockExtractDoiMetadata = vi.mocked(extractDoiMetadata);
const mockValidateDoi = vi.mocked(validateDoi);

describe('Metadata Extraction Engine', () => {
  let engine: MetadataExtractionEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new MetadataExtractionEngine();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DOI extraction', () => {
    it('should successfully extract metadata from DOI', async () => {
      const mockMetadata = {
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        confidence: 0.9,
        doi: '10.1000/182'
      };

      mockValidateDoi.mockReturnValue({
        isValid: true,
        normalizedDoi: '10.1000/182'
      });

      mockExtractDoiMetadata.mockResolvedValue(mockMetadata);

      const request: MetadataExtractionRequest = {
        source: '10.1000/182',
        type: 'doi',
        conversationId: 'test-conversation'
      };

      const response = await engine.extractMetadata(request);

      expect(response.success).toBe(true);
      expect(response.metadata).toEqual(mockMetadata);
      expect(response.extractionTime).toBeGreaterThan(0);
      expect(response.source).toBe('10.1000/182');
      expect(mockExtractDoiMetadata).toHaveBeenCalledWith('10.1000/182');
    });

    it('should handle DOI extraction errors', async () => {
      mockValidateDoi.mockReturnValue({
        isValid: true,
        normalizedDoi: '10.1000/182'
      });

      mockExtractDoiMetadata.mockRejectedValue(new Error('DOI not found'));

      const request: MetadataExtractionRequest = {
        source: '10.1000/182',
        type: 'doi',
        conversationId: 'test-conversation'
      };

      const response = await engine.extractMetadata(request);

      expect(response.success).toBe(false);
      expect(response.error).toBe('DOI not found');
      expect(response.extractionTime).toBeGreaterThan(0);
    });
  });

  describe('URL extraction', () => {
    it('should successfully extract metadata from URL', async () => {
      const mockMetadata = {
        title: 'Test Web Page',
        authors: [{ firstName: 'Jane', lastName: 'Smith' }],
        confidence: 0.7,
        url: 'https://example.com/article'
      };

      mockValidateAndSanitizeUrl.mockReturnValue({
        isValid: true,
        sanitizedUrl: 'https://example.com/article'
      });

      mockExtractUrlMetadata.mockResolvedValue(mockMetadata);

      const request: MetadataExtractionRequest = {
        source: 'https://example.com/article',
        type: 'url',
        conversationId: 'test-conversation'
      };

      const response = await engine.extractMetadata(request);

      expect(response.success).toBe(true);
      expect(response.metadata).toEqual(mockMetadata);
      expect(response.extractionTime).toBeGreaterThan(0);
      expect(mockExtractUrlMetadata).toHaveBeenCalledWith('https://example.com/article');
    });

    it('should handle URL extraction errors', async () => {
      mockValidateAndSanitizeUrl.mockReturnValue({
        isValid: true,
        sanitizedUrl: 'https://example.com/article'
      });

      mockExtractUrlMetadata.mockRejectedValue(new Error('Failed to fetch URL'));

      const request: MetadataExtractionRequest = {
        source: 'https://example.com/article',
        type: 'url',
        conversationId: 'test-conversation'
      };

      const response = await engine.extractMetadata(request);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Failed to fetch URL');
    });
  });

  describe('Auto-detection', () => {
    it('should auto-detect and extract from DOI', async () => {
      const mockMetadata = {
        title: 'Auto-detected DOI Article',
        confidence: 0.9,
        doi: '10.1000/182'
      };

      mockValidateDoi.mockReturnValue({
        isValid: true,
        normalizedDoi: '10.1000/182'
      });

      mockExtractDoiMetadata.mockResolvedValue(mockMetadata);

      const request: MetadataExtractionRequest = {
        source: 'doi:10.1000/182',
        type: 'doi', // Correct type for DOI
        conversationId: 'test-conversation'
      };

      const response = await engine.extractMetadata(request);

      expect(response.success).toBe(true);
      expect(response.metadata).toEqual(mockMetadata);
      expect(mockExtractDoiMetadata).toHaveBeenCalled();
      expect(mockExtractUrlMetadata).not.toHaveBeenCalled();
    });

    it('should auto-detect and extract from URL when DOI fails', async () => {
      const mockUrlMetadata = {
        title: 'Fallback URL Article',
        confidence: 0.6,
        url: 'https://example.com/article'
      };

      // Mock DOI validation to succeed but extraction to fail
      mockValidateDoi.mockReturnValue({
        isValid: true,
        normalizedDoi: '10.1000/182'
      });
      mockExtractDoiMetadata.mockRejectedValue(new Error('DOI not found'));

      // Mock URL validation and extraction to succeed
      mockValidateAndSanitizeUrl.mockReturnValue({
        isValid: true,
        sanitizedUrl: 'https://example.com/article'
      });
      mockExtractUrlMetadata.mockResolvedValue(mockUrlMetadata);

      const request: MetadataExtractionRequest = {
        source: 'https://example.com/article',
        type: 'url',
        conversationId: 'test-conversation'
      };

      // Create engine with fallback enabled
      const engineWithFallback = new MetadataExtractionEngine({
        fallbackToAlternateMethod: true
      });

      const response = await engineWithFallback.extractMetadata(request);

      expect(response.success).toBe(true);
      expect(response.metadata).toEqual(mockUrlMetadata);
    });

    it('should handle invalid source that is neither URL nor DOI', async () => {
      mockValidateDoi.mockReturnValue({
        isValid: false,
        error: 'Invalid DOI format'
      });

      mockValidateAndSanitizeUrl.mockReturnValue({
        isValid: false,
        error: 'Invalid URL format'
      });

      const request = {
        source: 'invalid-source',
        conversationId: 'test-conversation'
      } as MetadataExtractionRequest;

      const response = await engine.extractMetadata(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('neither a valid URL nor a valid DOI');
    });
  });

  describe('Retry logic', () => {
    it('should retry failed extractions', async () => {
      const mockMetadata = {
        title: 'Retry Success',
        confidence: 0.8,
        doi: '10.1000/182'
      };

      mockValidateDoi.mockReturnValue({
        isValid: true,
        normalizedDoi: '10.1000/182'
      });

      // First call fails, second succeeds
      mockExtractDoiMetadata
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockMetadata);

      const engineWithRetry = new MetadataExtractionEngine({
        retryAttempts: 1
      });

      const request: MetadataExtractionRequest = {
        source: '10.1000/182',
        type: 'doi',
        conversationId: 'test-conversation'
      };

      const response = await engineWithRetry.extractMetadata(request);

      expect(response.success).toBe(true);
      expect(response.metadata).toEqual(mockMetadata);
      expect(mockExtractDoiMetadata).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      mockValidateDoi.mockReturnValue({
        isValid: true,
        normalizedDoi: '10.1000/182'
      });

      mockExtractDoiMetadata.mockRejectedValue(new Error('Invalid DOI format'));

      const engineWithRetry = new MetadataExtractionEngine({
        retryAttempts: 2
      });

      const request: MetadataExtractionRequest = {
        source: '10.1000/182',
        type: 'doi',
        conversationId: 'test-conversation'
      };

      const response = await engineWithRetry.extractMetadata(request);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid DOI format');
      expect(mockExtractDoiMetadata).toHaveBeenCalledTimes(1); // No retry
    });
  });

  describe('Confidence threshold', () => {
    it('should reject metadata below confidence threshold', async () => {
      const lowConfidenceMetadata = {
        title: 'Low Confidence Article',
        confidence: 0.05, // Below default threshold of 0.1
        doi: '10.1000/182'
      };

      mockValidateDoi.mockReturnValue({
        isValid: true,
        normalizedDoi: '10.1000/182'
      });

      mockExtractDoiMetadata.mockResolvedValue(lowConfidenceMetadata);

      const request: MetadataExtractionRequest = {
        source: '10.1000/182',
        type: 'doi',
        conversationId: 'test-conversation'
      };

      const response = await engine.extractMetadata(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('confidence');
      expect(response.error).toContain('below minimum threshold');
    });

    it('should accept metadata above custom confidence threshold', async () => {
      const mediumConfidenceMetadata = {
        title: 'Medium Confidence Article',
        confidence: 0.3,
        doi: '10.1000/182'
      };

      mockValidateDoi.mockReturnValue({
        isValid: true,
        normalizedDoi: '10.1000/182'
      });

      mockExtractDoiMetadata.mockResolvedValue(mediumConfidenceMetadata);

      const engineWithLowThreshold = new MetadataExtractionEngine({
        minConfidenceThreshold: 0.2
      });

      const request: MetadataExtractionRequest = {
        source: '10.1000/182',
        type: 'doi',
        conversationId: 'test-conversation'
      };

      const response = await engineWithLowThreshold.extractMetadata(request);

      expect(response.success).toBe(true);
      expect(response.metadata).toEqual(mediumConfidenceMetadata);
    });
  });

  describe('Batch extraction', () => {
    it('should extract metadata from multiple sources', async () => {
      const mockDoiMetadata = {
        title: 'DOI Article',
        confidence: 0.9,
        doi: '10.1000/182'
      };

      const mockUrlMetadata = {
        title: 'URL Article',
        confidence: 0.7,
        url: 'https://example.com/article'
      };

      mockValidateDoi.mockReturnValue({
        isValid: true,
        normalizedDoi: '10.1000/182'
      });

      mockValidateAndSanitizeUrl.mockReturnValue({
        isValid: true,
        sanitizedUrl: 'https://example.com/article'
      });

      mockExtractDoiMetadata.mockResolvedValue(mockDoiMetadata);
      mockExtractUrlMetadata.mockResolvedValue(mockUrlMetadata);

      const requests: MetadataExtractionRequest[] = [
        {
          source: '10.1000/182',
          type: 'doi',
          conversationId: 'test-conversation'
        },
        {
          source: 'https://example.com/article',
          type: 'url',
          conversationId: 'test-conversation'
        }
      ];

      const responses = await engine.extractMultipleMetadata(requests);

      expect(responses).toHaveLength(2);
      expect(responses[0].success).toBe(true);
      expect(responses[0].metadata?.title).toBe('DOI Article');
      expect(responses[1].success).toBe(true);
      expect(responses[1].metadata?.title).toBe('URL Article');
    });
  });

  describe('Source validation', () => {
    it('should validate DOI source', async () => {
      mockValidateDoi.mockReturnValue({
        isValid: true,
        normalizedDoi: '10.1000/182'
      });

      const result = await engine.validateSource('10.1000/182');

      expect(result.isValid).toBe(true);
      expect(result.detectedType).toBe('doi');
      expect(result.error).toBeUndefined();
    });

    it('should validate URL source', async () => {
      mockValidateDoi.mockReturnValue({
        isValid: false,
        error: 'Invalid DOI format'
      });

      mockValidateAndSanitizeUrl.mockReturnValue({
        isValid: true,
        sanitizedUrl: 'https://example.com/article'
      });

      const result = await engine.validateSource('https://example.com/article');

      expect(result.isValid).toBe(true);
      expect(result.detectedType).toBe('url');
      expect(result.error).toBeUndefined();
    });

    it('should handle invalid source', async () => {
      mockValidateDoi.mockReturnValue({
        isValid: false,
        error: 'Invalid DOI format'
      });

      mockValidateAndSanitizeUrl.mockReturnValue({
        isValid: false,
        error: 'Invalid URL format'
      });

      const result = await engine.validateSource('invalid-source');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('neither a valid URL nor a valid DOI');
    });
  });

  describe('Configuration', () => {
    it('should return extraction statistics', () => {
      const stats = engine.getExtractionStats();

      expect(stats.defaultTimeout).toBe(15000);
      expect(stats.defaultRetryAttempts).toBe(2);
      expect(stats.minConfidenceThreshold).toBe(0.1);
      expect(stats.fallbackEnabled).toBe(true);
    });

    it('should update options', () => {
      engine.updateOptions({
        timeout: 20000,
        minConfidenceThreshold: 0.5
      });

      const stats = engine.getExtractionStats();
      expect(stats.defaultTimeout).toBe(20000);
      expect(stats.minConfidenceThreshold).toBe(0.5);
      expect(stats.defaultRetryAttempts).toBe(2); // Unchanged
    });
  });

  describe('Convenience functions', () => {
    it('should extract metadata using convenience function', async () => {
      const mockMetadata = {
        title: 'Convenience Test',
        confidence: 0.8,
        doi: '10.1000/182'
      };

      mockValidateDoi.mockReturnValue({
        isValid: true,
        normalizedDoi: '10.1000/182'
      });

      mockExtractDoiMetadata.mockResolvedValue(mockMetadata);

      const response = await extractMetadata('10.1000/182', 'doi', 'test-conversation');

      expect(response.success).toBe(true);
      expect(response.metadata).toEqual(mockMetadata);
    });

    it('should validate source using convenience function', async () => {
      mockValidateDoi.mockReturnValue({
        isValid: true,
        normalizedDoi: '10.1000/182'
      });

      const result = await validateMetadataSource('10.1000/182');

      expect(result.isValid).toBe(true);
      expect(result.detectedType).toBe('doi');
    });
  });

  describe('Default instance', () => {
    it('should provide default instance', () => {
      expect(defaultMetadataExtractionEngine).toBeInstanceOf(MetadataExtractionEngine);
    });
  });
});