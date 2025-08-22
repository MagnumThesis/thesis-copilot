/**
 * DOI Metadata Extractor
 * Extracts bibliographic metadata from DOIs using CrossRef API
 */

import { ReferenceMetadata, ReferenceType, Author } from '../../lib/ai-types.js';

// DOI validation regex
const DOI_PATTERN = /^10\.\d{4,}\/[^\s]+$/;

// CrossRef API configuration
const CROSSREF_API_BASE = 'https://api.crossref.org/works/';
const CROSSREF_HEADERS = {
  'User-Agent': 'ThesisCopilot/1.0 (https://thesiscopilot.com; mailto:support@thesiscopilot.com)',
  'Accept': 'application/json'
};

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

/**
 * Validates DOI format
 */
export function validateDoi(doi: string): { isValid: boolean; normalizedDoi?: string; error?: string } {
  if (!doi || typeof doi !== 'string') {
    return { isValid: false, error: 'DOI is required and must be a string' };
  }

  // Trim whitespace and normalize
  let normalizedDoi = doi.trim();
  
  if (!normalizedDoi) {
    return { isValid: false, error: 'DOI cannot be empty' };
  }

  // Remove common prefixes if present
  normalizedDoi = normalizedDoi
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
    .replace(/^doi:/, '')
    .replace(/^DOI:/, '');

  // Validate DOI format
  if (!DOI_PATTERN.test(normalizedDoi)) {
    return { isValid: false, error: 'Invalid DOI format. DOI should be in format 10.xxxx/xxxxx' };
  }

  return { isValid: true, normalizedDoi };
}

/**
 * Maps CrossRef work type to our ReferenceType
 */
function mapCrossRefTypeToReferenceType(crossRefType: string): ReferenceType {
  const typeMap: Record<string, ReferenceType> = {
    'journal-article': ReferenceType.JOURNAL_ARTICLE,
    'book': ReferenceType.BOOK,
    'book-chapter': ReferenceType.BOOK_CHAPTER,
    'proceedings-article': ReferenceType.CONFERENCE_PAPER,
    'conference-paper': ReferenceType.CONFERENCE_PAPER,
    'dissertation': ReferenceType.THESIS,
    'report': ReferenceType.REPORT,
    'patent': ReferenceType.PATENT,
    'other': ReferenceType.OTHER
  };

  return typeMap[crossRefType] || ReferenceType.OTHER;
}

/**
 * Parses CrossRef author data into our Author format
 */
function parseCrossRefAuthors(crossRefAuthors: Record<string, unknown>[]): Author[] {
  if (!Array.isArray(crossRefAuthors)) {
    return [];
  }

  return crossRefAuthors
    .filter(author => author && (author.given || author.family))
    .map(author => ({
      firstName: (author.given as string) || '',
      lastName: (author.family as string) || '',
      middleName: undefined,
      suffix: (author.suffix as string) || undefined
    }));
}

/**
 * Parses CrossRef date parts into a Date object
 */
function parseCrossRefDate(dateParts: number[][]): Date | null {
  if (!Array.isArray(dateParts) || dateParts.length === 0) {
    return null;
  }

  const firstDate = dateParts[0];
  if (!Array.isArray(firstDate) || firstDate.length === 0) {
    return null;
  }

  const year = firstDate[0];
  const month = firstDate[1] || 1;
  const day = firstDate[2] || 1;

  // Validate date components
  if (year < 1000 || year > new Date().getFullYear() + 10) {
    return null;
  }

  try {
    return new Date(year, month - 1, day);
  } catch {
    return null;
  }
}

/**
 * Extracts page information from CrossRef data
 */
function extractPages(crossRefWork: Record<string, unknown>): string | undefined {
  if (crossRefWork.page) {
    return String(crossRefWork.page);
  }

  // Try to construct from first and last page
  const firstPage = crossRefWork['first-page'];
  const lastPage = crossRefWork['last-page'];

  if (firstPage && lastPage) {
    return `${firstPage}-${lastPage}`;
  } else if (firstPage) {
    return String(firstPage);
  }

  return undefined;
}

/**
 * Calculates confidence score based on CrossRef data completeness
 */
function calculateDoiConfidence(crossRefWork: Record<string, unknown>): number {
  let score = 0.8; // Base score for successful DOI resolution

  // Essential fields
  if (crossRefWork.title && Array.isArray(crossRefWork.title) && crossRefWork.title.length > 0) score += 0.1;
  if (crossRefWork.author && Array.isArray(crossRefWork.author) && crossRefWork.author.length > 0) score += 0.05;

  // Publication details
  if (crossRefWork['published-print'] || crossRefWork['published-online']) score += 0.02;
  if (crossRefWork['container-title'] && Array.isArray(crossRefWork['container-title']) && crossRefWork['container-title'].length > 0) score += 0.02;
  if (crossRefWork.publisher) score += 0.01;

  return Math.min(score, 1.0);
}

/**
 * Transforms CrossRef work data into our ReferenceMetadata format
 */
function transformCrossRefWork(crossRefWork: Record<string, unknown>, doi: string): ReferenceMetadata {
  const metadata: ReferenceMetadata = {
    confidence: calculateDoiConfidence(crossRefWork)
  };

  // Extract title
  if (crossRefWork.title && Array.isArray(crossRefWork.title) && crossRefWork.title.length > 0) {
    metadata.title = String(crossRefWork.title[0]);
  }

  // Extract authors
  if (crossRefWork.author && Array.isArray(crossRefWork.author)) {
    metadata.authors = parseCrossRefAuthors(crossRefWork.author as Record<string, unknown>[]);
  }

  // Extract publication date
  const publishedDate = crossRefWork['published-print'] || crossRefWork['published-online'];
  if (publishedDate && typeof publishedDate === 'object' && publishedDate !== null) {
    const pubDate = publishedDate as Record<string, unknown>;
    if (pubDate['date-parts'] && Array.isArray(pubDate['date-parts'])) {
      metadata.publicationDate = parseCrossRefDate(pubDate['date-parts'] as number[][]) || undefined;
    }
  }

  // Extract journal/container information
  if (crossRefWork['container-title'] && Array.isArray(crossRefWork['container-title']) && crossRefWork['container-title'].length > 0) {
    metadata.journal = String(crossRefWork['container-title'][0]);
  }

  // Extract volume and issue
  if (typeof crossRefWork.volume === 'string') {
    metadata.volume = crossRefWork.volume;
  }
  if (typeof crossRefWork.issue === 'string') {
    metadata.issue = crossRefWork.issue;
  }

  // Extract pages
  metadata.pages = extractPages(crossRefWork);

  // Extract publisher
  if (typeof crossRefWork.publisher === 'string') {
    metadata.publisher = crossRefWork.publisher;
  }

  // Extract ISBN (for books)
  if (crossRefWork.ISBN && Array.isArray(crossRefWork.ISBN) && crossRefWork.ISBN.length > 0) {
    metadata.isbn = String(crossRefWork.ISBN[0]);
  }

  // Set DOI
  metadata.doi = doi;

  // Extract abstract if available
  if (typeof crossRefWork.abstract === 'string') {
    metadata.abstract = crossRefWork.abstract;
  }

  // Extract keywords/subjects
  if (crossRefWork.subject && Array.isArray(crossRefWork.subject)) {
    metadata.keywords = crossRefWork.subject as string[];
  }

  // Determine reference type
  if (typeof crossRefWork.type === 'string') {
    metadata.type = mapCrossRefTypeToReferenceType(crossRefWork.type);
  }

  return metadata;
}

/**
 * Fetches metadata from CrossRef API for a given DOI
 */
export async function extractDoiMetadata(doi: string): Promise<ReferenceMetadata> {
  // Validate DOI
  const validation = validateDoi(doi);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid DOI');
  }

  const normalizedDoi = validation.normalizedDoi!;

  try {
    // Construct CrossRef API URL
    const apiUrl = `${CROSSREF_API_BASE}${encodeURIComponent(normalizedDoi)}`;

    // Make request to CrossRef API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: CROSSREF_HEADERS,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`DOI not found: ${normalizedDoi}`);
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`CrossRef API error: ${response.status} ${response.statusText}`);
      }
    }

    // Parse response
    const data = await response.json() as { message?: Record<string, unknown> };

    if (!data || !data.message) {
      throw new Error('Invalid response from CrossRef API');
    }

    // Transform CrossRef data to our format
    const metadata = transformCrossRefWork(data.message, normalizedDoi);

    // Validate that we got meaningful data
    if (!metadata.title && !metadata.authors?.length) {
      throw new Error('No meaningful metadata found for DOI');
    }

    return metadata;

  } catch (error) {
    if (error instanceof Error) {
      // Re-throw known errors
      if (error.message.includes('DOI not found') || 
          error.message.includes('Rate limit') ||
          error.message.includes('CrossRef API error') ||
          error.message.includes('No meaningful metadata')) {
        throw error;
      }
      
      // Handle network and parsing errors
      if (error.name === 'AbortError') {
        throw new Error('Request timeout while fetching DOI metadata');
      }
      
      throw new Error(`Failed to extract DOI metadata: ${error.message}`);
    }
    
    throw new Error('Failed to extract DOI metadata: Unknown error');
  }
}

/**
 * Batch extract metadata for multiple DOIs
 */
export async function extractMultipleDoiMetadata(dois: string[]): Promise<Array<{ doi: string; metadata?: ReferenceMetadata; error?: string }>> {
  const results = await Promise.allSettled(
    dois.map(async (doi) => {
      try {
        const metadata = await extractDoiMetadata(doi);
        return { doi, metadata };
      } catch (error) {
        return { 
          doi, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        doi: dois[index],
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
      };
    }
  });
}

/**
 * Checks if a DOI is accessible (without fetching full metadata)
 */
export async function checkDoiAccessibility(doi: string): Promise<{ accessible: boolean; error?: string }> {
  const validation = validateDoi(doi);
  if (!validation.isValid) {
    return { accessible: false, error: validation.error };
  }

  const normalizedDoi = validation.normalizedDoi!;

  try {
    const apiUrl = `${CROSSREF_API_BASE}${encodeURIComponent(normalizedDoi)}`;
    
    const response = await fetch(apiUrl, {
      method: 'HEAD', // Use HEAD request for faster check
      headers: CROSSREF_HEADERS,
      signal: AbortSignal.timeout(5000) // Shorter timeout for accessibility check
    });

    return { accessible: response.ok };

  } catch (error) {
    return { 
      accessible: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
