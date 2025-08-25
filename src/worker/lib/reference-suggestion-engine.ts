import { ScholarSearchResult, ReferenceMetadata, ReferenceSuggestion, SuggestionRanking } from '../../lib/ai-types';
import { ExtractedContent } from '../../lib/ai-types';
import * as stringSimilarity from 'string-similarity';

/**
 * Reference Suggestion Engine
 * Analyzes search results and ranks reference suggestions
 */

interface SimilarityScore {
  textSimilarity: number;
  keywordMatch: number;
  topicOverlap: number;
  overall: number;
}

interface QualityMetrics {
  citationScore: number;
  recencyScore: number;
  authorAuthority: number;
  journalQuality: number;
  overall: number;
}

export class ReferenceSuggestionEngine {
  private readonly academicDomains = new Set([
    'scholar.google.com',
    'pubmed.ncbi.nlm.nih.gov',
    'ieee.org',
    'acm.org',
    'springer.com',
    'wiley.com',
    'elsevier.com',
    'nature.com',
    'science.org',
    'jstor.org'
  ]);

  private readonly highImpactJournals = new Set([
    'Nature',
    'Science',
    'Cell',
    'The Lancet',
    'New England Journal of Medicine',
    'JAMA',
    'Proceedings of the National Academy of Sciences',
    'Journal of the American Chemical Society',
    'Physical Review Letters'
  ]);

  /**
   * Generate reference suggestions from search results
   */
  generateSuggestions(
    searchResults: ScholarSearchResult[],
    originalContent: ExtractedContent,
    maxSuggestions: number = 10
  ): ReferenceSuggestion[] {
    const suggestions: ReferenceSuggestion[] = [];

    for (const result of searchResults) {
      const reference = this.convertToReference(result);
      const relevanceScore = this.calculateRelevanceScore(result, originalContent);
      const confidence = this.calculateConfidence(result, originalContent);

      const suggestion: ReferenceSuggestion = {
        reference,
        relevance_score: relevanceScore,
        confidence,
        reasoning: this.generateReasoning(result, originalContent, relevanceScore)
      };

      suggestions.push(suggestion);
    }

    // Mark duplicates
    this.markDuplicates(suggestions);

    // Sort by relevance score
    suggestions.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));

    return suggestions.slice(0, maxSuggestions);
  }

  /**
   * Convert ScholarSearchResult to ReferenceMetadata
   */
  private convertToReference(result: ScholarSearchResult): ReferenceMetadata {
    return {
      title: result.title,
      authors: result.authors,
      publicationDate: result.year ? new Date(result.year, 0, 1) : undefined,
      journal: result.journal,
      url: result.url,
      doi: result.doi,
      abstract: result.abstract,
      keywords: result.keywords || [],
      confidence: 0.8 // Base confidence for Scholar results
    };
  }

  /**
   * Calculate relevance score for a search result
   */
  private calculateRelevanceScore(result: ScholarSearchResult, content: ExtractedContent): number {
    const similarity = this.calculateSimilarity(result, content);
    const quality = this.calculateQuality(result);
    const recency = this.calculateRecencyScore(result.year);

    // Weighted combination
    const score = (
      similarity.overall * 0.5 +
      quality.overall * 0.3 +
      recency * 0.2
    );

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate similarity between result and original content
   */
  private calculateSimilarity(result: ScholarSearchResult, content: ExtractedContent): SimilarityScore {
    // Text similarity using title and abstract
    const resultText = `${result.title} ${result.abstract || ''}`.toLowerCase();
    const contentText = (content.content || '').toLowerCase();

    const textSimilarity = stringSimilarity.compareTwoStrings(resultText, contentText);

    // Keyword matching
    const resultKeywords = this.extractKeywordsFromResult(result);
    const keywordMatch = this.calculateKeywordOverlap(content.keywords || [], resultKeywords);

    // Topic overlap
    const resultTopics = this.extractTopicsFromResult(result);
    const topicOverlap = this.calculateTopicOverlap(content.topics || [], resultTopics);

    // Overall similarity score
    const overall = (textSimilarity * 0.4 + keywordMatch * 0.3 + topicOverlap * 0.3);

    return {
      textSimilarity,
      keywordMatch,
      topicOverlap,
      overall
    };
  }

  /**
   * Calculate quality metrics for a search result
   */
  private calculateQuality(result: ScholarSearchResult): QualityMetrics {
    // Citation score (0-1 scale)
    const citationScore = result.citations ? Math.min(1, Math.log10(result.citations + 1) / 3) : 0;

    // Recency score
    const recencyScore = this.calculateRecencyScore(result.year);

    // Author authority (simplified)
    const authorAuthority = this.calculateAuthorAuthority(result.authors);

    // Journal quality
    const journalQuality = this.calculateJournalQuality(result.journal);

    // Overall quality score
    const overall = (
      citationScore * 0.3 +
      recencyScore * 0.2 +
      authorAuthority * 0.25 +
      journalQuality * 0.25
    );

    return {
      citationScore,
      recencyScore,
      authorAuthority,
      journalQuality,
      overall
    };
  }

  /**
   * Calculate recency score based on publication year
   */
  private calculateRecencyScore(year?: number): number {
    if (!year) return 0.3; // Default for unknown years

    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (age <= 2) return 1.0;      // Very recent
    if (age <= 5) return 0.8;      // Recent
    if (age <= 10) return 0.6;     // Moderately recent
    if (age <= 20) return 0.4;     // Older but relevant
    return 0.2;                    // Very old
  }

  /**
   * Calculate author authority score
   */
  private calculateAuthorAuthority(authors: string[]): number {
    // Simplified scoring based on author count and name recognition
    if (authors.length === 0) return 0;

    let score = 0.5; // Base score

    // More authors might indicate higher quality (collaborative research)
    if (authors.length > 3) score += 0.2;
    else if (authors.length === 1) score -= 0.1; // Single author might be less authoritative

    // Check for academic titles or known patterns
    const hasTitles = authors.some(author =>
      /\b(prof|dr|phd|md)\b/i.test(author)
    );
    if (hasTitles) score += 0.2;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate journal quality score
   */
  private calculateJournalQuality(journal?: string): number {
    if (!journal) return 0.3; // Default for unknown journals

    const journalLower = journal.toLowerCase();

    // Check high-impact journals
    if (this.highImpactJournals.has(journal)) {
      return 1.0;
    }

    // Check for reputable publishers
    if (journalLower.includes('ieee') || journalLower.includes('acm')) {
      return 0.8;
    }

    if (journalLower.includes('springer') || journalLower.includes('wiley') ||
        journalLower.includes('elsevier')) {
      return 0.7;
    }

    // Check for university presses
    if (journalLower.includes('university') || journalLower.includes('press')) {
      return 0.6;
    }

    // Generic academic journal
    if (journalLower.includes('journal') || journalLower.includes('proceedings')) {
      return 0.5;
    }

    return 0.4; // Unknown journal
  }

  /**
   * Extract keywords from search result
   */
  private extractKeywordsFromResult(result: ScholarSearchResult): string[] {
    const text = `${result.title} ${result.abstract || ''}`.toLowerCase();
    const words = text.match(/\b\w{4,}\b/g) || [];

    // Simple keyword extraction - in a real system, you'd use NLP
    const stopWords = new Set(['that', 'with', 'have', 'this', 'will', 'from', 'they', 'been', 'said']);

    return words
      .filter(word => !stopWords.has(word))
      .slice(0, 10); // Top 10 keywords
  }

  /**
   * Extract topics from search result
   */
  private extractTopicsFromResult(result: ScholarSearchResult): string[] {
    const topics: string[] = [];

    // Extract from journal name
    if (result.journal) {
      const journalWords = result.journal.toLowerCase().split(' ');
      topics.push(...journalWords.filter(word => word.length > 3));
    }

    // Extract from title
    const titleWords = result.title.toLowerCase().split(' ');
    topics.push(...titleWords.filter(word => word.length > 5));

    return [...new Set(topics)].slice(0, 5);
  }

  /**
   * Calculate keyword overlap between two sets
   */
  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const set1 = new Set(keywords1.map(k => k.toLowerCase()));
    const set2 = new Set(keywords2.map(k => k.toLowerCase()));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate topic overlap between two sets
   */
  private calculateTopicOverlap(topics1: string[], topics2: string[]): number {
    return this.calculateKeywordOverlap(topics1, topics2);
  }

  /**
   * Calculate overall confidence for a suggestion
   */
  private calculateConfidence(result: ScholarSearchResult, content: ExtractedContent): number {
    let confidence = content.confidence; // Start with content confidence

    // Boost confidence for high-quality sources
    if (result.doi) confidence += 0.1;
    if (result.citations && result.citations > 10) confidence += 0.1;
    if (result.url && this.academicDomains.has(this.extractDomain(result.url))) confidence += 0.1;

    // Reduce confidence for very old or low-quality results
    if (result.year && result.year < 2000) confidence -= 0.2;
    if (!result.abstract) confidence -= 0.1;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  /**
   * Mark duplicate suggestions
   */
  private markDuplicates(suggestions: ReferenceSuggestion[]): void {
    const seen = new Set<string>();

    for (const suggestion of suggestions) {
      const firstAuthor = suggestion.reference.authors?.[0] || '';
      const key = `${suggestion.reference.title}_${firstAuthor}`.toLowerCase();

      if (seen.has(key)) {
        suggestion.isDuplicate = true;
      } else {
        seen.add(key);
      }
    }
  }

  /**
   * Generate reasoning for why this suggestion was made
   */
  private generateReasoning(
    result: ScholarSearchResult,
    content: ExtractedContent,
    score: number
  ): string {
    const reasons: string[] = [];

    if (score > 0.8) reasons.push('Highly relevant to your research topic');
    else if (score > 0.6) reasons.push('Relevant to your research topic');
    else if (score > 0.4) reasons.push('Somewhat related to your research');
    else reasons.push('May contain useful background information');

    if (result.citations && result.citations > 50) {
      reasons.push('Highly cited paper');
    } else if (result.citations && result.citations > 10) {
      reasons.push('Well-cited paper');
    }

    if (result.year && result.year > new Date().getFullYear() - 5) {
      reasons.push('Recent publication');
    }

    if (result.doi) {
      reasons.push('Has DOI for easy access');
    }

    return reasons.join('. ') + '.';
  }

  /**
   * Generate search query from content
   */
  private generateQueryFromContent(content: ExtractedContent): string {
    const keywords = content.keywords || [];
    const topics = content.topics || [];
    const terms = [...keywords.slice(0, 3), ...topics.slice(0, 2)];
    return [...new Set(terms)].join(' AND ');
  }

  /**
   * Get detailed ranking information
   */
  getSuggestionRanking(suggestion: ReferenceSuggestion): SuggestionRanking {
    // This would contain detailed ranking metrics
    // For now, return simplified ranking
    const relevance = suggestion.relevance_score || 0;
    return {
      relevance,
      recency: 0.5,
      citations: 0.5,
      authorAuthority: 0.5,
      overall: relevance
    };
  }

  /**
   * Filter suggestions by criteria
   */
  filterSuggestions(
    suggestions: ReferenceSuggestion[],
    criteria: {
      minScore?: number;
      minYear?: number;
      maxYear?: number;
      excludeDuplicates?: boolean;
      minCitations?: number;
    }
  ): ReferenceSuggestion[] {
    return suggestions.filter(suggestion => {
      const relevanceScore = suggestion.relevance_score || 0;
      if (criteria.minScore && relevanceScore < criteria.minScore) return false;
      if (criteria.excludeDuplicates && suggestion.isDuplicate) return false;
      if (criteria.minCitations && (suggestion.reference.citations || 0) < criteria.minCitations) return false;

      const year = suggestion.reference.publicationDate?.getFullYear();
      if (criteria.minYear && year && year < criteria.minYear) return false;
      if (criteria.maxYear && year && year > criteria.maxYear) return false;

      return true;
    });
  }
}
