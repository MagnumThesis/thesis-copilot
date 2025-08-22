/**
 * Metadata Extraction Engine
 * Coordinates between URL and DOI extraction, handles confidence scoring and fallbacks
 */

import { ReferenceMetadata, MetadataExtractionRequest, MetadataExtractionResponse } from '../../lib/ai-types.js';
import { extractUrlMetadata, validateAndSanitizeUrl } from './url-metadata-extractor.js';
import { extractDoiMetadata, validateDoi } from './doi-metadata-extractor.js';

/**
 * Extraction result with timing and source information
 */
interface ExtractionResult {
  metadata: ReferenceMetadata;
  extractionTime: number;
  source: string;
  method: 'url' | 'doi';
}

/**
 * Extraction options for fine-tuning behavior
 */
interface ExtractionOptions {
  timeout?: number; // Maximum time to spend on extraction (ms)
  retryAttempts?: number; // Number of retry attempts for failed extractions
  fallbackToAlternateMethod?: boolean; // Try alternate method if primary fails
  minConfidenceThreshold?: number; // Minimum confidence score to accept result
}

/**
 * Default extraction options
 */
const DEFAULT_OPTIONS: Required<ExtractionOptions> = {
  timeout: 15000, // 15 seconds
  retryAttempts: 2,
  fallbackToAlternateMethod: true,
  minConfidenceThreshold: 0.1
};

/**
 * Main Metadata Extraction Engine class
 */
export class MetadataExtractionEngine {
  private options: Required<ExtractionOptions>;

  constructor(options: ExtractionOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Extracts metadata from a source (URL or DOI)
   */
  async extractMetadata(request: MetadataExtractionRequest): Promise<MetadataExtractionResponse> {
    const startTime = Date.now();

    try {
      // Determine extraction method based on source type
      let result: ExtractionResult;

      if (request.type === 'doi') {
        result = await this.extractFromDoi(request.source);
      } else if (request.type === 'url') {
        result = await this.extractFromUrl(request.source);
      } else {
        // Auto-detect source type
        result = await this.autoDetectAndExtract(request.source);
      }

      // Check confidence threshold
      if (result.metadata && result.metadata.confidence < this.options.minConfidenceThreshold) {
        throw new Error(`Extracted metadata confidence (${result.metadata.confidence.toFixed(2)}) below minimum threshold (${this.options.minConfidenceThreshold})`);
      }

      return {
        success: true,
        metadata: result.metadata,
        extractionTime: Math.max(1, Date.now() - startTime), // Ensure at least 1ms
        source: request.source
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown extraction error',
        extractionTime: Math.max(1, Date.now() - startTime), // Ensure at least 1ms
        source: request.source
      };
    }
  }

  /**
   * Auto-detects source type and extracts metadata
   */
  private async autoDetectAndExtract(source: string): Promise<ExtractionResult> {
    const startTime = Date.now();

    // Try to detect if it's a DOI first (more specific)
    const doiValidation = validateDoi(source);
    if (doiValidation.isValid) {
      try {
        const metadata = await this.extractFromDoiWithRetry(doiValidation.normalizedDoi!);
        return {
          metadata,
          extractionTime: Date.now() - startTime,
          source,
          method: 'doi'
        };
      } catch (error) {
        if (!this.options.fallbackToAlternateMethod) {
          throw error;
        }
        // Fall through to URL extraction
      }
    }

    // Try URL extraction
    const urlValidation = validateAndSanitizeUrl(source);
    if (urlValidation.isValid) {
      try {
        const metadata = await this.extractFromUrlWithRetry(urlValidation.sanitizedUrl!);
        return {
          metadata,
          extractionTime: Date.now() - startTime,
          source,
          method: 'url'
        };
      } catch (error) {
        if (doiValidation.isValid && this.options.fallbackToAlternateMethod) {
          // Try DOI as fallback if URL failed
          try {
            const metadata = await this.extractFromDoiWithRetry(doiValidation.normalizedDoi!);
            return {
              metadata,
              extractionTime: Date.now() - startTime,
              source,
              method: 'doi'
            };
          } catch (doiError) {
            // Both methods failed, throw the original URL error
            throw error;
          }
        }
        throw error;
      }
    }

    throw new Error('Source is neither a valid URL nor a valid DOI');
  }

  /**
   * Extracts metadata from DOI with retry logic
   */
  private async extractFromDoi(doi: string): Promise<ExtractionResult> {
    const startTime = Date.now();
    const metadata = await this.extractFromDoiWithRetry(doi);
    
    return {
      metadata,
      extractionTime: Date.now() - startTime,
      source: doi,
      method: 'doi'
    };
  }

  /**
   * Extracts metadata from URL with retry logic
   */
  private async extractFromUrl(url: string): Promise<ExtractionResult> {
    const startTime = Date.now();
    const metadata = await this.extractFromUrlWithRetry(url);
    
    return {
      metadata,
      extractionTime: Date.now() - startTime,
      source: url,
      method: 'url'
    };
  }

  /**
   * DOI extraction with retry logic
   */
  private async extractFromDoiWithRetry(doi: string): Promise<ReferenceMetadata> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.options.retryAttempts; attempt++) {
      try {
        return await this.withTimeout(
          extractDoiMetadata(doi),
          this.options.timeout,
          `DOI extraction timeout after ${this.options.timeout}ms`
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry for certain types of errors
        if (this.isNonRetryableError(lastError)) {
          throw lastError;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.options.retryAttempts) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error('DOI extraction failed after all retry attempts');
  }

  /**
   * URL extraction with retry logic
   */
  private async extractFromUrlWithRetry(url: string): Promise<ReferenceMetadata> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.options.retryAttempts; attempt++) {
      try {
        return await this.withTimeout(
          extractUrlMetadata(url),
          this.options.timeout,
          `URL extraction timeout after ${this.options.timeout}ms`
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry for certain types of errors
        if (this.isNonRetryableError(lastError)) {
          throw lastError;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.options.retryAttempts) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error('URL extraction failed after all retry attempts');
  }

  /**
   * Determines if an error should not be retried
   */
  private isNonRetryableError(error: Error): boolean {
    const nonRetryablePatterns = [
      'Invalid URL format',
      'Invalid DOI format',
      'DOI not found',
      'URL does not point to an HTML document',
      'Private or local URLs are not allowed',
      'No meaningful metadata found'
    ];

    return nonRetryablePatterns.some(pattern => 
      error.message.includes(pattern)
    );
  }

  /**
   * Wraps a promise with a timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>, 
    timeoutMs: number, 
    timeoutMessage: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Delays execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batch extract metadata from multiple sources
   */
  async extractMultipleMetadata(
    requests: MetadataExtractionRequest[]
  ): Promise<MetadataExtractionResponse[]> {
    // Process requests in parallel with concurrency limit
    const concurrencyLimit = 5;
    const results: MetadataExtractionResponse[] = [];

    for (let i = 0; i < requests.length; i += concurrencyLimit) {
      const batch = requests.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map(request => this.extractMetadata(request))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Validates a source without extracting full metadata
   */
  async validateSource(source: string, type?: 'url' | 'doi'): Promise<{
    isValid: boolean;
    detectedType?: 'url' | 'doi';
    error?: string;
  }> {
    try {
      if (type === 'doi' || (!type && validateDoi(source).isValid)) {
        const doiValidation = validateDoi(source);
        return {
          isValid: doiValidation.isValid,
          detectedType: 'doi',
          error: doiValidation.error
        };
      }

      if (type === 'url' || (!type && validateAndSanitizeUrl(source).isValid)) {
        const urlValidation = validateAndSanitizeUrl(source);
        return {
          isValid: urlValidation.isValid,
          detectedType: 'url',
          error: urlValidation.error
        };
      }

      return {
        isValid: false,
        error: 'Source is neither a valid URL nor a valid DOI'
      };

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  /**
   * Gets extraction statistics and performance metrics
   */
  getExtractionStats(): {
    defaultTimeout: number;
    defaultRetryAttempts: number;
    minConfidenceThreshold: number;
    fallbackEnabled: boolean;
  } {
    return {
      defaultTimeout: this.options.timeout,
      defaultRetryAttempts: this.options.retryAttempts,
      minConfidenceThreshold: this.options.minConfidenceThreshold,
      fallbackEnabled: this.options.fallbackToAlternateMethod
    };
  }

  /**
   * Updates extraction options
   */
  updateOptions(newOptions: Partial<ExtractionOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}

/**
 * Default instance for convenience
 */
export const defaultMetadataExtractionEngine = new MetadataExtractionEngine();

/**
 * Convenience function for single metadata extraction
 */
export async function extractMetadata(
  source: string, 
  type?: 'url' | 'doi',
  conversationId?: string
): Promise<MetadataExtractionResponse> {
  const request: MetadataExtractionRequest = {
    source,
    type: type || (validateDoi(source).isValid ? 'doi' : 'url'),
    conversationId: conversationId || 'default'
  };

  return defaultMetadataExtractionEngine.extractMetadata(request);
}

/**
 * Convenience function for source validation
 */
export async function validateMetadataSource(
  source: string, 
  type?: 'url' | 'doi'
): Promise<{ isValid: boolean; detectedType?: 'url' | 'doi'; error?: string }> {
  return defaultMetadataExtractionEngine.validateSource(source, type);
}