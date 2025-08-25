/**
 * URL Metadata Extractor
 * Extracts bibliographic metadata from web pages using Open Graph and Dublin Core metadata
 */

import { ReferenceMetadata, ReferenceType, Author } from '../../lib/ai-types.js';

// URL validation regex patterns
const URL_PATTERNS = {
  HTTP: /^https?:\/\//i,
  DOMAIN: /^https?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/,
  ACADEMIC: /\.(edu|org|gov)$/i,
  JOURNAL: /\.(springer|elsevier|wiley|nature|science|ieee|acm)\./i
};

// Metadata extraction patterns
const META_PATTERNS = {
  // Open Graph patterns
  OG_TITLE: /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/gi,
  OG_DESCRIPTION: /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/gi,
  OG_URL: /<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/gi,
  OG_SITE_NAME: /<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/gi,
  OG_TYPE: /<meta\s+property=["']og:type["']\s+content=["']([^"']+)["']/gi,
  
  // Dublin Core patterns
  DC_TITLE: /<meta\s+name=["']DC\.title["']\s+content=["']([^"']+)["']/gi,
  DC_CREATOR: /<meta\s+name=["']DC\.creator["']\s+content=["']([^"']+)["']/gi,
  DC_DATE: /<meta\s+name=["']DC\.date["']\s+content=["']([^"']+)["']/gi,
  DC_PUBLISHER: /<meta\s+name=["']DC\.publisher["']\s+content=["']([^"']+)["']/gi,
  DC_DESCRIPTION: /<meta\s+name=["']DC\.description["']\s+content=["']([^"']+)["']/gi,
  DC_IDENTIFIER: /<meta\s+name=["']DC\.identifier["']\s+content=["']([^"']+)["']/gi,
  
  // Standard HTML meta patterns
  TITLE: /<title[^>]*>([^<]+)<\/title>/gi,
  DESCRIPTION: /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/gi,
  AUTHOR: /<meta\s+name=["']author["']\s+content=["']([^"']+)["']/gi,
  KEYWORDS: /<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/gi,
  
  // Academic-specific patterns
  CITATION_TITLE: /<meta\s+name=["']citation_title["']\s+content=["']([^"']+)["']/gi,
  CITATION_AUTHOR: /<meta\s+name=["']citation_author["']\s+content=["']([^"']+)["']/gi,
  CITATION_DATE: /<meta\s+name=["']citation_date["']\s+content=["']([^"']+)["']/gi,
  CITATION_JOURNAL: /<meta\s+name=["']citation_journal_title["']\s+content=["']([^"']+)["']/gi,
  CITATION_VOLUME: /<meta\s+name=["']citation_volume["']\s+content=["']([^"']+)["']/gi,
  CITATION_ISSUE: /<meta\s+name=["']citation_issue["']\s+content=["']([^"']+)["']/gi,
  CITATION_PAGES: /<meta\s+name=["']citation_firstpage["']\s+content=["']([^"']+)["']/gi,
  CITATION_DOI: /<meta\s+name=["']citation_doi["']\s+content=["']([^"']+)["']/gi,
  CITATION_PUBLISHER: /<meta\s+name=["']citation_publisher["']\s+content=["']([^"']+)["']/gi
};

/**
 * Validates and sanitizes a URL
 */
export function validateAndSanitizeUrl(url: string): { isValid: boolean; sanitizedUrl?: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required and must be a string' };
  }

  // Trim whitespace
  const trimmedUrl = url.trim();
  
  if (!trimmedUrl) {
    return { isValid: false, error: 'URL cannot be empty' };
  }

  // Add protocol if missing
  let sanitizedUrl = trimmedUrl;
  if (!URL_PATTERNS.HTTP.test(sanitizedUrl)) {
    sanitizedUrl = `https://${sanitizedUrl}`;
  }

  // Validate URL format
  if (!URL_PATTERNS.DOMAIN.test(sanitizedUrl)) {
    return { isValid: false, error: 'Invalid URL format' };
  }

  // Additional validation using URL constructor
  try {
    const urlObj = new URL(sanitizedUrl);
    
    // Check for suspicious protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }

    // Check for localhost or private IPs (basic security)
    if (urlObj.hostname === 'localhost' || 
        urlObj.hostname.startsWith('127.') || 
        urlObj.hostname.startsWith('192.168.') ||
        urlObj.hostname.startsWith('10.') ||
        urlObj.hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      return { isValid: false, error: 'Private or local URLs are not allowed' };
    }

    return { isValid: true, sanitizedUrl: urlObj.toString() };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Extracts metadata value using regex pattern
 */
function extractMetaValue(html: string, pattern: RegExp): string | null {
  const match = pattern.exec(html);
  return match ? match[1].trim() : null;
}

/**
 * Extracts all metadata values using regex pattern
 */
function extractAllMetaValues(html: string, pattern: RegExp): string[] {
  const values: string[] = [];
  let match;
  
  // Reset regex lastIndex to ensure we get all matches
  pattern.lastIndex = 0;
  
  while ((match = pattern.exec(html)) !== null) {
    if (match[1] && match[1].trim()) {
      values.push(match[1].trim());
    }
  }
  
  return values;
}

/**
 * Parses author names from various formats
 */
function parseAuthors(authorStrings: string[]): Author[] {
  const authors: Author[] = [];
  
  for (const authorString of authorStrings) {
    if (!authorString || !authorString.trim()) continue;
    
    // Check if this looks like a "Last, First" format first
    if (authorString.includes(',') && !authorString.match(/[,;].*[,;]/)) {
      // Single author in "Last, First" format
      const parsed = parseAuthorName(authorString);
      if (parsed) {
        authors.push(parsed);
      }
    } else {
      // Split multiple authors if separated by common delimiters
      const individualAuthors = authorString.split(/[,;]|and\s+|\s+&\s+/i)
        .map(a => a.trim())
        .filter(a => a.length > 0);
      
      for (const author of individualAuthors) {
        const parsed = parseAuthorName(author);
        if (parsed) {
          authors.push(parsed);
        }
      }
    }
  }
  
  return authors;
}

/**
 * Parses a single author name into components
 */
function parseAuthorName(name: string): Author | null {
  if (!name || !name.trim()) return null;
  
  const trimmed = name.trim();
  
  // Handle "Last, First Middle" format
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      const lastName = parts[0];
      const firstParts = parts[1].split(/\s+/);
      const firstName = firstParts[0] || '';
      const middleName = firstParts.slice(1).join(' ') || undefined;
      
      return {
        firstName: middleName ? `${firstName} ${middleName}` : firstName,
        lastName,
        middleName: undefined // Store full first name including middle in firstName
      };
    }
  }
  
  // Handle "First Middle Last" format
  const nameParts = trimmed.split(/\s+/);
  if (nameParts.length === 1) {
    return {
      firstName: '',
      lastName: nameParts[0]
    };
  } else if (nameParts.length === 2) {
    return {
      firstName: nameParts[0],
      lastName: nameParts[1]
    };
  } else if (nameParts.length >= 3) {
    return {
      firstName: nameParts[0],
      middleName: nameParts.slice(1, -1).join(' '),
      lastName: nameParts[nameParts.length - 1]
    };
  }
  
  return null;
}

/**
 * Parses date from various formats
 */
function parseDate(dateString: string): Date | null {
  if (!dateString || !dateString.trim()) return null;
  
  const trimmed = dateString.trim();
  
  // Try parsing as ISO date first
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  // Try parsing year only
  const yearMatch = trimmed.match(/(\d{4})/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year >= 1900 && year <= new Date().getFullYear() + 1) {
      return new Date(year, 0, 1);
    }
  }
  
  return null;
}

/**
 * Determines reference type based on URL and metadata
 */
function determineReferenceType(url: string, metadata: any): ReferenceType {
  const urlLower = url.toLowerCase();
  
  // Check for academic journals
  if (URL_PATTERNS.JOURNAL.test(urlLower) || metadata.journal) {
    return ReferenceType.JOURNAL_ARTICLE;
  }
  
  // Check for thesis/dissertation first (more specific)
  if (metadata.type === 'thesis' || urlLower.includes('thesis') || urlLower.includes('dissertation')) {
    return ReferenceType.THESIS;
  }
  
  // Check for academic institutions
  if (URL_PATTERNS.ACADEMIC.test(urlLower)) {
    if (urlLower.includes('conference') || urlLower.includes('proceedings')) {
      return ReferenceType.CONFERENCE_PAPER;
    }
    return ReferenceType.REPORT;
  }
  
  // Check for books
  if (metadata.isbn || urlLower.includes('book') || urlLower.includes('isbn')) {
    return ReferenceType.BOOK;
  }
  
  // Default to website
  return ReferenceType.WEBSITE;
}

/**
 * Calculates confidence score based on extracted metadata quality
 */
function calculateConfidence(metadata: any): number {
  let score = 0.3; // Base score for successful extraction
  
  // Title is essential
  if (metadata.title) score += 0.3;
  
  // Authors add credibility
  if (metadata.authors && metadata.authors.length > 0) score += 0.2;
  
  // Publication date is important
  if (metadata.publicationDate) score += 0.1;
  
  // Academic metadata increases confidence
  if (metadata.journal) score += 0.1;
  if (metadata.doi) score += 0.1;
  if (metadata.publisher) score += 0.05;
  
  // Volume/issue information
  if (metadata.volume || metadata.issue) score += 0.05;
  
  return Math.min(score, 1.0);
}

/**
 * Extracts metadata from HTML content
 */
export function parseHtmlMetadata(html: string, originalUrl: string): ReferenceMetadata {
  const metadata: any = {};
  
  // Extract title (priority: citation_title > og:title > DC.title > title)
  metadata.title = 
    extractMetaValue(html, META_PATTERNS.CITATION_TITLE) ||
    extractMetaValue(html, META_PATTERNS.OG_TITLE) ||
    extractMetaValue(html, META_PATTERNS.DC_TITLE) ||
    extractMetaValue(html, META_PATTERNS.TITLE);
  
  // Extract authors
  const authorStrings = [
    ...extractAllMetaValues(html, META_PATTERNS.CITATION_AUTHOR),
    ...extractAllMetaValues(html, META_PATTERNS.DC_CREATOR),
    ...extractAllMetaValues(html, META_PATTERNS.AUTHOR)
  ];
  metadata.authors = parseAuthors(authorStrings);
  
  // Extract publication date
  const dateString = 
    extractMetaValue(html, META_PATTERNS.CITATION_DATE) ||
    extractMetaValue(html, META_PATTERNS.DC_DATE);
  metadata.publicationDate = dateString ? parseDate(dateString) : null;
  
  // Extract journal information
  metadata.journal = extractMetaValue(html, META_PATTERNS.CITATION_JOURNAL);
  metadata.volume = extractMetaValue(html, META_PATTERNS.CITATION_VOLUME);
  metadata.issue = extractMetaValue(html, META_PATTERNS.CITATION_ISSUE);
  metadata.pages = extractMetaValue(html, META_PATTERNS.CITATION_PAGES);
  
  // Extract publisher
  metadata.publisher = 
    extractMetaValue(html, META_PATTERNS.CITATION_PUBLISHER) ||
    extractMetaValue(html, META_PATTERNS.DC_PUBLISHER) ||
    extractMetaValue(html, META_PATTERNS.OG_SITE_NAME);
  
  // Extract DOI
  metadata.doi = 
    extractMetaValue(html, META_PATTERNS.CITATION_DOI) ||
    extractMetaValue(html, META_PATTERNS.DC_IDENTIFIER);
  
  // Extract ISBN (check if DC.identifier contains ISBN)
  const identifier = extractMetaValue(html, META_PATTERNS.DC_IDENTIFIER);
  if (identifier && identifier.toLowerCase().includes('isbn')) {
    metadata.isbn = identifier;
  }
  
  // Extract description/abstract
  metadata.abstract = 
    extractMetaValue(html, META_PATTERNS.OG_DESCRIPTION) ||
    extractMetaValue(html, META_PATTERNS.DC_DESCRIPTION) ||
    extractMetaValue(html, META_PATTERNS.DESCRIPTION);
  
  // Extract keywords
  const keywordsString = extractMetaValue(html, META_PATTERNS.KEYWORDS);
  metadata.keywords = keywordsString ? 
    keywordsString.split(/[,;]/).map(k => k.trim()).filter(k => k.length > 0) : 
    [];
  
  // Set URL
  metadata.url = originalUrl;
  
  // Determine reference type
  metadata.type = determineReferenceType(originalUrl, metadata);
  
  // Calculate confidence score
  metadata.confidence = calculateConfidence(metadata);
  
  return metadata as ReferenceMetadata;
}

/**
 * Fetches and extracts metadata from a URL
 */
export async function extractUrlMetadata(url: string): Promise<ReferenceMetadata> {
  // Validate and sanitize URL
  const validation = validateAndSanitizeUrl(url);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid URL');
  }
  
  const sanitizedUrl = validation.sanitizedUrl!;
  
  try {
    // Fetch the webpage
    const response = await fetch(sanitizedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ThesisCopilot/1.0; +https://thesiscopilot.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      // Set reasonable timeout
      signal: AbortSignal.timeout(10000) // 10 seconds
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error('URL does not point to an HTML document');
    }
    
    // Get HTML content
    const html = await response.text();
    
    if (!html || html.trim().length === 0) {
      throw new Error('Empty response from URL');
    }
    
    // Extract metadata
    const metadata = parseHtmlMetadata(html, sanitizedUrl);
    
    // Ensure minimum metadata quality
    if (!metadata.title && !metadata.authors?.length) {
      // Try fallback extraction methods
      const fallbackMetadata = extractFallbackMetadata(html, sanitizedUrl);
      return { ...metadata, ...fallbackMetadata };
    }
    
    return metadata;
    
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract metadata from URL: ${error.message}`);
    }
    throw new Error('Failed to extract metadata from URL: Unknown error');
  }
}

/**
 * Fallback metadata extraction for pages with minimal structured data
 */
function extractFallbackMetadata(html: string, url: string): Partial<ReferenceMetadata> {
  const metadata: Partial<ReferenceMetadata> = {};
  
  // Try to extract title from various sources
  if (!metadata.title) {
    // Try h1 tags
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      metadata.title = h1Match[1].trim();
    } else {
      // Use URL as last resort
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
        if (pathParts.length > 0) {
          metadata.title = pathParts[pathParts.length - 1]
            .replace(/[-_]/g, ' ')
            .replace(/\.[^.]*$/, '') // Remove file extension
            .replace(/\b\w/g, l => l.toUpperCase()); // Title case
        }
      } catch {
        metadata.title = 'Untitled Document';
      }
    }
  }
  
  // Set confidence lower for fallback extraction
  metadata.confidence = 0.2;
  
  return metadata;
}