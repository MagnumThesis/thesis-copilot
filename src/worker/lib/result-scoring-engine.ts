/**
 * Result Scoring Engine
 * Provides comprehensive relevance and quality scoring for search results
 */

import { ScholarSearchResult, ExtractedContent } from '../../lib/ai-types';
import * as stringSimilarity from 'string-similarity';

export interface ScoringResult {
  relevanceScore: number;
  qualityScore: number;
  confidenceScore: number;
  overallScore: number;
  breakdown: ScoringBreakdown;
}

export interface ScoringBreakdown {
  relevance: {
    textSimilarity: number;
    keywordMatch: number;
    topicOverlap: number;
    semanticSimilarity: number;
  };
  quality: {
    citationScore: number;
    recencyScore: number;
    authorAuthority: number;
    journalQuality: number;
    completenessScore: number;
  };
  confidence: {
    metadataCompleteness: number;
    sourceReliability: number;
    extractionQuality: number;
  };
}

export interface RankedResult extends ScholarSearchResult {
  relevanceScore: number;
  qualityScore: number;
  confidenceScore: number;
  overallScore: number;
  scoringBreakdown: ScoringBreakdown;
  rank: number;
}

export interface ScoringWeights {
  relevance: number;
  quality: number;
  confidence: number;
}

export class ResultScoringEngine {
  private readonly defaultWeights: ScoringWeights = {
    relevance: 0.5,
    quality: 0.3,
    confidence: 0.2
  };

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
    'jstor.org',
    'arxiv.org',
    'researchgate.net'
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
    'Physical Review Letters',
    'Nature Medicine',
    'Nature Biotechnology',
    'Nature Genetics',
    'Cell Metabolism',
    'Immunity',
    'Neuron'
  ]);

  private readonly stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'among', 'that', 'this', 'these', 'those', 'is',
    'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can'
  ]);

  /**
   * Score a single search result for relevance and quality
   */
  scoreResult(
    result: ScholarSearchResult,
    content: ExtractedContent,
    weights: Partial<ScoringWeights> = {}
  ): ScoringResult {
    const finalWeights = { ...this.defaultWeights, ...weights };

    const relevanceScore = this.scoreRelevance(result, content);
    const qualityScore = this.scoreQuality(result);
    const confidenceScore = this.calculateConfidence(result);

    const overallScore = (
      relevanceScore * finalWeights.relevance +
      qualityScore * finalWeights.quality +
      confidenceScore * finalWeights.confidence
    );

    return {
      relevanceScore,
      qualityScore,
      confidenceScore,
      overallScore: Math.max(0, Math.min(1, overallScore)),
      breakdown: this.generateScoringBreakdown(result, content)
    };
  }

  /**
   * Score relevance based on content similarity
   */
  scoreRelevance(result: ScholarSearchResult, content: ExtractedContent): number {
    const textSimilarity = this.calculateTextSimilarity(result, content);
    const keywordMatch = this.calculateKeywordMatch(result, content);
    const topicOverlap = this.calculateTopicOverlap(result, content);
    const semanticSimilarity = this.calculateSemanticSimilarity(result, content);

    // Weighted combination of similarity metrics
    const relevanceScore = (
      textSimilarity * 0.3 +
      keywordMatch * 0.3 +
      topicOverlap * 0.25 +
      semanticSimilarity * 0.15
    );

    return Math.max(0, Math.min(1, relevanceScore));
  }

  /**
   * Calculate quality metrics based on citation count, journal, and publication date
   */
  scoreQuality(result: ScholarSearchResult): number {
    const citationScore = this.calculateCitationScore(result.citations || 0);
    const recencyScore = this.calculateRecencyScore(result.year);
    const authorAuthority = this.calculateAuthorAuthority(result.authors);
    const journalQuality = this.calculateJournalQuality(result.journal);
    const completenessScore = this.calculateCompletenessScore(result);

    // Weighted combination of quality metrics
    const qualityScore = (
      citationScore * 0.3 +
      recencyScore * 0.2 +
      authorAuthority * 0.2 +
      journalQuality * 0.2 +
      completenessScore * 0.1
    );

    return Math.max(0, Math.min(1, qualityScore));
  }

  /**
   * Calculate confidence score for search result reliability
   */
  calculateConfidence(result: ScholarSearchResult): number {
    const metadataCompleteness = this.calculateMetadataCompleteness(result);
    const sourceReliability = this.calculateSourceReliability(result);
    const extractionQuality = this.calculateExtractionQuality(result);

    // Weighted combination of confidence factors
    const confidenceScore = (
      metadataCompleteness * 0.4 +
      sourceReliability * 0.4 +
      extractionQuality * 0.2
    );

    return Math.max(0.1, Math.min(1, confidenceScore));
  }

  /**
   * Rank multiple results by their scores
   */
  rankResults(
    results: ScholarSearchResult[],
    content: ExtractedContent,
    weights?: Partial<ScoringWeights>
  ): RankedResult[] {
    const scoredResults = results.map(result => {
      const scoring = this.scoreResult(result, content, weights);
      return {
        ...result,
        relevanceScore: scoring.relevanceScore,
        qualityScore: scoring.qualityScore,
        confidenceScore: scoring.confidenceScore,
        overallScore: scoring.overallScore,
        scoringBreakdown: scoring.breakdown,
        rank: 0 // Will be set after sorting
      };
    });

    // Sort by overall score (descending)
    scoredResults.sort((a, b) => b.overallScore - a.overallScore);

    // Assign ranks
    scoredResults.forEach((result, index) => {
      result.rank = index + 1;
    });

    return scoredResults;
  }

  /**
   * Apply quality metrics to results
   */
  applyQualityMetrics(results: ScholarSearchResult[]): ScholarSearchResult[] {
    return results.map(result => ({
      ...result,
      confidence: this.calculateConfidence(result),
      relevance_score: result.relevance_score || 0.5
    }));
  }

  // Private helper methods

  private calculateTextSimilarity(result: ScholarSearchResult, content: ExtractedContent): number {
    const resultText = this.normalizeText(`${result.title} ${result.abstract || ''}`);
    const contentText = this.normalizeText(content.content || '');

    if (!resultText || !contentText) return 0;

    // Use a more generous similarity calculation for academic text
    const similarity = stringSimilarity.compareTwoStrings(resultText, contentText);
    
    // Boost similarity if there are common academic terms
    const resultWords = resultText.split(' ').filter(w => w.length > 4);
    const contentWords = contentText.split(' ').filter(w => w.length > 4);
    const commonWords = resultWords.filter(w => contentWords.includes(w));
    
    if (commonWords.length > 0) {
      const wordBoost = Math.min(0.3, commonWords.length * 0.1);
      return Math.min(1, similarity + wordBoost);
    }

    return similarity;
  }

  private calculateKeywordMatch(result: ScholarSearchResult, content: ExtractedContent): number {
    const resultKeywords = this.extractKeywords(result);
    const contentKeywords = content.keywords || [];

    if (resultKeywords.length === 0 || contentKeywords.length === 0) return 0;

    const resultSet = new Set(resultKeywords.map(k => k.toLowerCase()));
    const contentSet = new Set(contentKeywords.map(k => k.toLowerCase()));

    const intersection = new Set([...resultSet].filter(x => contentSet.has(x)));
    const union = new Set([...resultSet, ...contentSet]);

    return intersection.size / union.size;
  }

  private calculateTopicOverlap(result: ScholarSearchResult, content: ExtractedContent): number {
    const resultTopics = this.extractTopics(result);
    const contentTopics = content.topics || [];

    if (resultTopics.length === 0 || contentTopics.length === 0) return 0;

    const resultSet = new Set(resultTopics.map(t => t.toLowerCase()));
    const contentSet = new Set(contentTopics.map(t => t.toLowerCase()));

    const intersection = new Set([...resultSet].filter(x => contentSet.has(x)));
    const union = new Set([...resultSet, ...contentSet]);

    return intersection.size / union.size;
  }

  private calculateSemanticSimilarity(result: ScholarSearchResult, content: ExtractedContent): number {
    // Simplified semantic similarity based on common academic terms
    const resultTerms = this.extractAcademicTerms({ content: result.abstract || result.title || '' });
    const contentTerms = this.extractAcademicTerms({ content: content.content || '' });

    if (resultTerms.length === 0 || contentTerms.length === 0) return 0;

    const resultSet = new Set(resultTerms);
    const contentSet = new Set(contentTerms);

    const intersection = new Set([...resultSet].filter(x => contentSet.has(x)));
    
    return intersection.size / Math.max(resultSet.size, contentSet.size);
  }

  private calculateCitationScore(citations: number): number {
    if (citations === 0) return 0.1;
    
    // Logarithmic scaling for citation count
    // 1-10 citations: 0.2-0.5
    // 11-50 citations: 0.5-0.7
    // 51-100 citations: 0.7-0.8
    // 100+ citations: 0.8-1.0
    
    if (citations <= 10) return 0.2 + (citations / 10) * 0.3;
    if (citations <= 50) return 0.5 + ((citations - 10) / 40) * 0.2;
    if (citations <= 100) return 0.7 + ((citations - 50) / 50) * 0.1;
    
    return Math.min(1.0, 0.8 + Math.log10(citations / 100) * 0.2);
  }

  private calculateRecencyScore(year?: number): number {
    if (!year) return 0.3;

    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (age <= 1) return 1.0;      // Very recent
    if (age <= 3) return 0.9;      // Recent
    if (age <= 5) return 0.8;      // Moderately recent
    if (age <= 10) return 0.6;     // Somewhat recent
    if (age <= 15) return 0.4;     // Older but still relevant
    if (age <= 25) return 0.3;     // Old but potentially valuable
    
    return 0.2;                    // Very old
  }

  private calculateAuthorAuthority(authors: string[]): number {
    if (authors.length === 0) return 0.2;

    let score = 0.4; // Base score

    // Multiple authors often indicate collaborative research
    if (authors.length >= 3 && authors.length <= 8) {
      score += 0.2;
    } else if (authors.length > 8) {
      score += 0.1; // Too many authors might indicate lower individual contribution
    } else if (authors.length === 1) {
      score -= 0.1; // Single author might be less authoritative in some fields
    }

    // Check for academic titles or credentials
    const hasCredentials = authors.some(author =>
      /\b(prof|professor|dr|phd|md|ph\.d|m\.d)\b/i.test(author)
    );
    if (hasCredentials) score += 0.2;

    // Check for institutional affiliations (simplified)
    const hasInstitution = authors.some(author =>
      /\b(university|institute|college|lab|laboratory)\b/i.test(author)
    );
    if (hasInstitution) score += 0.1;

    return Math.max(0.1, Math.min(1, score));
  }

  private calculateJournalQuality(journal?: string): number {
    if (!journal) return 0.3;

    const journalLower = journal.toLowerCase();

    // High-impact journals
    if (this.highImpactJournals.has(journal)) {
      return 1.0;
    }

    // Tier 1: Top-tier publishers and conferences
    if (journalLower.includes('nature') && !journalLower.includes('communications')) {
      return 0.95;
    }
    if (journalLower.includes('science') && journalLower.includes('journal')) {
      return 0.9;
    }

    // Tier 2: Reputable technical publishers
    if (journalLower.includes('ieee') || journalLower.includes('acm')) {
      return 0.85;
    }

    // Tier 3: Major academic publishers
    if (journalLower.includes('springer') || journalLower.includes('wiley') ||
        journalLower.includes('elsevier') || journalLower.includes('taylor')) {
      return 0.75;
    }

    // Tier 4: University presses and society journals
    if (journalLower.includes('university') || journalLower.includes('press') ||
        journalLower.includes('society') || journalLower.includes('association')) {
      return 0.65;
    }

    // Tier 5: Conference proceedings
    if (journalLower.includes('proceedings') || journalLower.includes('conference') ||
        journalLower.includes('symposium') || journalLower.includes('workshop')) {
      return 0.6;
    }

    // Tier 6: Generic academic journals
    if (journalLower.includes('journal') || journalLower.includes('review') ||
        journalLower.includes('letters') || journalLower.includes('communications')) {
      return 0.5;
    }

    // Tier 7: Preprints and working papers
    if (journalLower.includes('arxiv') || journalLower.includes('preprint') ||
        journalLower.includes('working paper')) {
      return 0.4;
    }

    return 0.3; // Unknown or unrecognized journal (lower score)
  }

  private calculateCompletenessScore(result: ScholarSearchResult): number {
    let score = 0;
    let maxScore = 0;

    // Essential fields
    if (result.title) { score += 2; maxScore += 2; }
    if (result.authors && result.authors.length > 0) { score += 2; maxScore += 2; }

    // Important fields
    if (result.year) { score += 1; maxScore += 1; }
    if (result.journal) { score += 1; maxScore += 1; }
    if (result.abstract) { score += 1; maxScore += 1; }

    // Valuable fields
    if (result.doi) { score += 0.5; maxScore += 0.5; }
    if (result.url) { score += 0.5; maxScore += 0.5; }
    if (result.citations !== undefined) { score += 0.5; maxScore += 0.5; }

    return maxScore > 0 ? score / maxScore : 0;
  }

  private calculateMetadataCompleteness(result: ScholarSearchResult): number {
    return this.calculateCompletenessScore(result);
  }

  private calculateSourceReliability(result: ScholarSearchResult): number {
    let score = 0.5; // Base score

    // Check if URL is from academic domain
    if (result.url) {
      const domain = this.extractDomain(result.url);
      if (this.academicDomains.has(domain)) {
        score += 0.3;
      } else if (domain.includes('edu') || domain.includes('ac.')) {
        score += 0.2;
      }
    }

    // DOI indicates peer review
    if (result.doi) {
      score += 0.2;
    }

    // Journal publication indicates peer review
    if (result.journal && !result.journal.toLowerCase().includes('preprint')) {
      score += 0.1;
    }

    return Math.max(0.1, Math.min(1, score));
  }

  private calculateExtractionQuality(result: ScholarSearchResult): number {
    let score = 0.5; // Lower base score for more realistic confidence

    // Penalize if confidence is explicitly low
    if (result.confidence !== undefined && result.confidence < 0.5) {
      score -= 0.2;
    }

    // Boost if all key fields are present and well-formatted
    if (result.title && result.authors && result.authors.length > 0 && result.year) {
      score += 0.3;
    }

    // Check for formatting issues
    if (result.title && (result.title.length < 10 || result.title.includes('...'))) {
      score -= 0.2;
    }

    // Penalize missing essential fields more heavily
    if (!result.title || result.authors.length === 0) {
      score -= 0.3;
    }

    return Math.max(0.1, Math.min(1, score));
  }

  private generateScoringBreakdown(result: ScholarSearchResult, content: ExtractedContent): ScoringBreakdown {
    return {
      relevance: {
        textSimilarity: this.calculateTextSimilarity(result, content),
        keywordMatch: this.calculateKeywordMatch(result, content),
        topicOverlap: this.calculateTopicOverlap(result, content),
        semanticSimilarity: this.calculateSemanticSimilarity(result, content)
      },
      quality: {
        citationScore: this.calculateCitationScore(result.citations || 0),
        recencyScore: this.calculateRecencyScore(result.year),
        authorAuthority: this.calculateAuthorAuthority(result.authors),
        journalQuality: this.calculateJournalQuality(result.journal),
        completenessScore: this.calculateCompletenessScore(result)
      },
      confidence: {
        metadataCompleteness: this.calculateMetadataCompleteness(result),
        sourceReliability: this.calculateSourceReliability(result),
        extractionQuality: this.calculateExtractionQuality(result)
      }
    };
  }

  // Utility methods

  private normalizeText(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractKeywords(result: ScholarSearchResult): string[] {
    const text = `${result.title} ${result.abstract || ''}`;
    const words = this.normalizeText(text)
      .split(' ')
      .filter(word => word.length >= 4 && !this.stopWords.has(word));

    // Return unique keywords, limited to top 15
    return [...new Set(words)].slice(0, 15);
  }

  private extractTopics(result: ScholarSearchResult): string[] {
    const topics: string[] = [];

    // Extract from journal name
    if (result.journal) {
      const journalWords = this.normalizeText(result.journal)
        .split(' ')
        .filter(word => word.length > 3 && !this.stopWords.has(word));
      topics.push(...journalWords);
    }

    // Extract significant terms from title
    if (result.title) {
      const titleWords = this.normalizeText(result.title)
        .split(' ')
        .filter(word => word.length > 5 && !this.stopWords.has(word));
      topics.push(...titleWords);
    }

    return [...new Set(topics)].slice(0, 8);
  }

  private extractAcademicTerms(content: { content?: string }): string[] {
    const academicPatterns = [
      /\b\w*ology\b/g,      // -ology terms
      /\b\w*tion\b/g,       // -tion terms
      /\b\w*ment\b/g,       // -ment terms
      /\b\w*ness\b/g,       // -ness terms
      /\b\w*ism\b/g,        // -ism terms
      /\b\w*ity\b/g,        // -ity terms
      /\b\w{6,}\b/g         // Long words (6+ chars)
    ];

    const text = this.normalizeText(content.content || '');
    const terms: string[] = [];

    academicPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      terms.push(...matches.filter(term => !this.stopWords.has(term)));
    });

    return [...new Set(terms)].slice(0, 10);
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return '';
    }
  }
}