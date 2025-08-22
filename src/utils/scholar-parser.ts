import { ScholarSearchResult } from '../lib/ai-types';

/**
 * Google Scholar HTML Parser
 * Parses Google Scholar search results from HTML
 */

export interface ScholarParseResult {
  results: ScholarSearchResult[];
  totalResults: number;
  hasNextPage: boolean;
}

/**
 * Parse Google Scholar search results HTML
 */
export function parseScholarResults(html: string): ScholarParseResult {
  const results: ScholarSearchResult[] = [];

  try {
    // Extract individual search result blocks
    const resultBlocks = extractResultBlocks(html);

    for (const block of resultBlocks) {
      const result = parseResultBlock(block);
      if (result) {
        results.push(result);
      }
    }

    const totalResults = extractTotalResults(html);
    const hasNextPage = hasNextPageLink(html);

    return {
      results,
      totalResults,
      hasNextPage
    };
  } catch (error) {
    console.error('Error parsing Google Scholar results:', error);
    return {
      results: [],
      totalResults: 0,
      hasNextPage: false
    };
  }
}

/**
 * Extract individual result blocks from HTML
 */
function extractResultBlocks(html: string): string[] {
  // Google Scholar results are typically in div elements with class "gs_r gs_or gs_scl"
  // This is a simplified pattern - in reality, Google Scholar HTML structure can vary
  const resultPattern = /<div[^>]*class="[^"]*gs_r[^"]*"[^>]*>(.*?)<\/div>/gs;
  const blocks: string[] = [];
  let match;

  while ((match = resultPattern.exec(html)) !== null) {
    blocks.push(match[1]);
  }

  return blocks;
}

/**
 * Parse individual result block
 */
function parseResultBlock(block: string): ScholarSearchResult | null {
  try {
    const title = extractTitle(block);
    const authors = extractAuthors(block);
    const journal = extractJournal(block);
    const year = extractYear(block);
    const citations = extractCitations(block);
    const url = extractUrl(block);
    const doi = extractDOI(block);
    const abstract = extractAbstract(block);
    const fullTextUrl = extractFullTextUrl(block);

    if (!title || !url) {
      return null;
    }

    return {
      title,
      authors,
      journal,
      year,
      citations,
      url,
      doi,
      abstract,
      fullTextUrl
    };
  } catch (error) {
    console.error('Error parsing result block:', error);
    return null;
  }
}

/**
 * Extract title from result block
 */
function extractTitle(block: string): string | undefined {
  // Look for title in h3 or a tags
  const titlePatterns = [
    /<h3[^>]*class="[^"]*gs_rt[^"]*"[^>]*><a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/s,
    /<a[^>]*href="([^"]*)"[^>]*class="[^"]*gs_rt[^"]*"[^>]*>(.*?)<\/a>/s,
    /<h3[^>]*><a[^>]*>(.*?)<\/a>/s
  ];

  for (const pattern of titlePatterns) {
    const match = block.match(pattern);
    if (match) {
      const title = match[2] || match[1];
      return cleanHtml(title).replace(/^\[.*?\]\s*/, ''); // Remove [PDF], [HTML] etc.
    }
  }

  return undefined;
}

/**
 * Extract authors from result block
 */
function extractAuthors(block: string): string[] {
  // Look for authors in div with class gs_a
  const authorPattern = /<div[^>]*class="[^"]*gs_a[^"]*"[^>]*>(.*?)<\/div>/s;
  const match = block.match(authorPattern);

  if (match) {
    const authorText = cleanHtml(match[1]);
    // Split by common separators and clean
    return authorText
      .split(/[,;&-]/)
      .map(author => author.trim())
      .filter(author => author.length > 0 && !/^\d{4}/.test(author)); // Remove years
  }

  return [];
}

/**
 * Extract journal/conference info
 */
function extractJournal(block: string): string | undefined {
  // Look for journal info in the same div as authors
  const journalPattern = /<div[^>]*class="[^"]*gs_a[^"]*"[^>]*>.*?(?:- )?([^,-]*\d{4}[^,-]*)[^<]*/s;
  const match = block.match(journalPattern);

  if (match) {
    const journal = match[1].trim();
    return journal.length > 0 ? journal : undefined;
  }

  return undefined;
}

/**
 * Extract year from result block
 */
function extractYear(block: string): number | undefined {
  const yearPattern = /\b(19|20)\d{2}\b/;
  const match = block.match(yearPattern);
  return match ? parseInt(match[0]) : undefined;
}

/**
 * Extract citation count
 */
function extractCitations(block: string): number | undefined {
  // Look for "Cited by X" pattern
  const citePattern = /Cited by (\d+)/i;
  const match = block.match(citePattern);
  return match ? parseInt(match[1]) : undefined;
}

/**
 * Extract URL from result block
 */
function extractUrl(block: string): string {
  // Look for the main title link
  const urlPatterns = [
    /<h3[^>]*><a[^>]*href="([^"]*)"[^>]*>/s,
    /<a[^>]*href="([^"]*)"[^>]*class="[^"]*gs_rt[^"]*"[^>]*>/s
  ];

  for (const pattern of urlPatterns) {
    const match = block.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // Fallback to a generic Google Scholar URL
  return 'https://scholar.google.com/';
}

/**
 * Extract DOI if available
 */
function extractDOI(block: string): string | undefined {
  const doiPattern = /\b10\.\d{4,9}\/[^\s]+/;
  const match = block.match(doiPattern);
  return match ? match[0] : undefined;
}

/**
 * Extract abstract/snippet
 */
function extractAbstract(block: string): string | undefined {
  // Look for abstract/snippet in div with class gs_rs
  const abstractPattern = /<div[^>]*class="[^"]*gs_rs[^"]*"[^>]*>(.*?)<\/div>/s;
  const match = block.match(abstractPattern);

  if (match) {
    const abstract = cleanHtml(match[1]);
    return abstract.length > 10 ? abstract : undefined;
  }

  return undefined;
}

/**
 * Extract full text URL if available
 */
function extractFullTextUrl(block: string): string | undefined {
  // Look for full text links
  const fullTextPatterns = [
    /\[PDF\]\s*<a[^>]*href="([^"]*)"[^>]*>/i,
    /\[HTML\]\s*<a[^>]*href="([^"]*)"[^>]*>/i,
    /<a[^>]*href="([^"]*)"[^>]*>Full text/i
  ];

  for (const pattern of fullTextPatterns) {
    const match = block.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Extract total number of results
 */
function extractTotalResults(html: string): number {
  const totalPattern = /About ([\d,]+) results?/i;
  const match = html.match(totalPattern);

  if (match) {
    return parseInt(match[1].replace(/,/g, ''));
  }

  return 0;
}

/**
 * Check if there's a next page link
 */
function hasNextPageLink(html: string): boolean {
  const nextPagePattern = /<a[^>]*href="[^"]*"[^>]*>Next<\/a>/i;
  return nextPagePattern.test(html);
}

/**
 * Clean HTML tags and entities
 */
function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Remove non-breaking spaces
    .replace(/&[^;]+;/g, ' ') // Remove other HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Create mock results for testing/development
 */
export function createMockScholarResults(query: string): ScholarParseResult {
  const mockResults: ScholarSearchResult[] = [
    {
      title: `Advanced Research on ${query}`,
      authors: ['Smith, J.', 'Johnson, A.', 'Williams, B.'],
      journal: 'Journal of Advanced Studies',
      year: 2023,
      citations: 45,
      url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
      abstract: `This comprehensive study explores various aspects of ${query} with particular focus on practical applications and theoretical foundations.`
    },
    {
      title: `Current Trends in ${query} Research`,
      authors: ['Brown, M.', 'Davis, K.'],
      journal: 'International Journal of Research',
      year: 2022,
      citations: 32,
      url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query + ' trends')}`,
      doi: '10.1234/example.doi',
      abstract: `An analysis of current research trends and future directions in ${query} based on extensive literature review.`
    },
    {
      title: `Methodological Approaches to ${query}`,
      authors: ['Taylor, R.', 'Anderson, L.', 'Martinez, S.'],
      journal: 'Journal of Methodology',
      year: 2021,
      citations: 67,
      url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query + ' methodology')}`,
      abstract: `This paper presents various methodological approaches and frameworks for studying ${query} in academic settings.`
    }
  ];

  return {
    results: mockResults,
    totalResults: mockResults.length,
    hasNextPage: false
  };
}
