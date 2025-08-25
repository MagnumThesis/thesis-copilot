/**
 * Optimized Query Generation Engine
 * High-performance version of the query generation engine with caching and optimization
 */

import { ExtractedContent } from '../../lib/ai-types';
import { 
  SearchQuery, 
  QueryGenerationOptions, 
  QueryRefinement,
  BreadthAnalysis,
  AlternativeTerms,
  ValidationResult,
  OptimizationRecommendation,
  RefinedQuery
} from './query-generation-engine';
import { aiSearcherPerformanceOptimizer } from '../../lib/ai-searcher-performance-optimizer';

// Optimized term extraction result
interface OptimizedTermExtraction {
  keywords: string[];
  topics: string[];
  keyPhrases: string[];
  academicTerms: string[];
  confidence: number;
  processingTimeMs: number;
}

// Fast query generation result
interface FastQueryGeneration {
  primaryQuery: string;
  alternativeQueries: string[];
  confidence: number;
  optimization: {
    breadthScore: number;
    specificityScore: number;
    academicRelevance: number;
  };
  processingTimeMs: number;
}

/**
 * Optimized Query Generation Engine
 * Provides high-performance query generation with aggressive caching and optimization
 */
export class OptimizedQueryGenerationEngine {
  private readonly academicTermsSet = new Set([
    'research', 'study', 'analysis', 'methodology', 'framework', 'approach',
    'theory', 'model', 'system', 'process', 'development', 'implementation',
    'evaluation', 'assessment', 'investigation', 'examination', 'exploration',
    'findings', 'results', 'conclusion', 'evidence', 'data', 'empirical',
    'systematic', 'comprehensive', 'comparative', 'experimental', 'qualitative',
    'quantitative', 'statistical', 'analytical', 'theoretical', 'practical',
    'algorithm', 'optimization', 'performance', 'efficiency', 'scalability',
    'validation', 'verification', 'simulation', 'modeling', 'prediction'
  ]);

  private readonly stopWordsSet = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ]);

  // Pre-compiled regex patterns for performance
  private readonly patterns = {
    academicPhrase: /\b(?:research|study|analysis|methodology|framework|approach|theory|model)\s+\w+/gi,
    technicalTerm: /\b[A-Z][a-z]*(?:[A-Z][a-z]*)+\b/g, // CamelCase terms
    quotedPhrase: /"([^"]+)"/g,
    yearPattern: /\b(19|20)\d{2}\b/g,
    authorPattern: /\b[A-Z][a-z]+,?\s+[A-Z]\.?(?:\s+[A-Z]\.?)?\b/g
  };

  /**
   * Fast term extraction with optimized algorithms
   */
  public fastExtractTerms(content: ExtractedContent[]): OptimizedTermExtraction {
    const startTime = Date.now();
    
    // Combine all content efficiently
    const combinedText = content.map(c => c.content).join(' ').toLowerCase();
    const combinedKeywords = content.flatMap(c => c.keywords || []);
    const combinedTopics = content.flatMap(c => c.topics || []);
    const combinedKeyPhrases = content.flatMap(c => c.keyPhrases || []);

    // Fast keyword extraction using pre-computed sets
    const keywords = this.extractKeywordsFast(combinedText, combinedKeywords);
    
    // Fast topic extraction
    const topics = this.extractTopicsFast(combinedText, combinedTopics);
    
    // Fast key phrase extraction
    const keyPhrases = this.extractKeyPhrasesFast(combinedText, combinedKeyPhrases);
    
    // Fast academic term extraction
    const academicTerms = this.extractAcademicTermsFast(combinedText);
    
    // Calculate confidence based on term quality and quantity
    const confidence = this.calculateTermExtractionConfidence(
      keywords, topics, keyPhrases, academicTerms
    );

    const processingTimeMs = Date.now() - startTime;

    return {
      keywords: keywords.slice(0, 10), // Limit for performance
      topics: topics.slice(0, 6),
      keyPhrases: keyPhrases.slice(0, 8),
      academicTerms: academicTerms.slice(0, 5),
      confidence,
      processingTimeMs
    };
  }

  /**
   * Fast keyword extraction using optimized algorithms
   */
  private extractKeywordsFast(text: string, existingKeywords: string[]): string[] {
    const keywordSet = new Set<string>();
    
    // Add existing keywords (already processed)
    existingKeywords.forEach(kw => {
      if (kw && kw.length > 2 && !this.stopWordsSet.has(kw.toLowerCase())) {
        keywordSet.add(kw.toLowerCase());
      }
    });

    // Extract technical terms (CamelCase)
    const technicalTerms = text.match(this.patterns.technicalTerm) || [];
    technicalTerms.forEach(term => {
      if (term.length > 3) {
        keywordSet.add(term.toLowerCase());
      }
    });

    // Extract academic phrases
    const academicPhrases = text.match(this.patterns.academicPhrase) || [];
    academicPhrases.forEach(phrase => {
      keywordSet.add(phrase.toLowerCase());
    });

    // Extract quoted phrases (high relevance)
    const quotedPhrases = text.match(this.patterns.quotedPhrase) || [];
    quotedPhrases.forEach(phrase => {
      const cleaned = phrase.replace(/"/g, '').trim();
      if (cleaned.length > 3) {
        keywordSet.add(cleaned.toLowerCase());
      }
    });

    // Convert to array and sort by relevance
    return Array.from(keywordSet)
      .filter(kw => kw.length > 2)
      .sort((a, b) => this.calculateTermRelevance(b) - this.calculateTermRelevance(a));
  }

  /**
   * Fast topic extraction
   */
  private extractTopicsFast(text: string, existingTopics: string[]): string[] {
    const topicSet = new Set<string>();
    
    // Add existing topics
    existingTopics.forEach(topic => {
      if (topic && topic.length > 2) {
        topicSet.add(topic.toLowerCase());
      }
    });

    // Extract domain-specific terms
    const domainTerms = this.extractDomainTerms(text);
    domainTerms.forEach(term => topicSet.add(term));

    return Array.from(topicSet)
      .filter(topic => topic.length > 2)
      .sort((a, b) => this.calculateTermRelevance(b) - this.calculateTermRelevance(a));
  }

  /**
   * Fast key phrase extraction
   */
  private extractKeyPhrasesFast(text: string, existingKeyPhrases: string[]): string[] {
    const phraseSet = new Set<string>();
    
    // Add existing key phrases
    existingKeyPhrases.forEach(phrase => {
      if (phrase && phrase.length > 5) {
        phraseSet.add(phrase.toLowerCase());
      }
    });

    // Extract noun phrases (simplified)
    const nounPhrases = this.extractNounPhrases(text);
    nounPhrases.forEach(phrase => phraseSet.add(phrase));

    return Array.from(phraseSet)
      .filter(phrase => phrase.length > 5 && phrase.split(' ').length >= 2)
      .sort((a, b) => b.length - a.length) // Prefer longer phrases
      .slice(0, 8);
  }

  /**
   * Fast academic term extraction
   */
  private extractAcademicTermsFast(text: string): string[] {
    const academicTerms: string[] = [];
    
    // Find academic terms using pre-compiled set
    const words = text.split(/\s+/);
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (this.academicTermsSet.has(cleanWord)) {
        academicTerms.push(cleanWord);
      }
    });

    // Remove duplicates and return
    return [...new Set(academicTerms)];
  }

  /**
   * Extract domain-specific terms
   */
  private extractDomainTerms(text: string): string[] {
    const domainPatterns = [
      /\b(?:machine|deep|artificial)\s+(?:learning|intelligence|network)/gi,
      /\b(?:natural|computational)\s+(?:language|linguistics)/gi,
      /\b(?:computer|software|information)\s+(?:science|engineering|system)/gi,
      /\b(?:data|statistical|predictive)\s+(?:analysis|modeling|analytics)/gi,
      /\b(?:neural|convolutional|recurrent)\s+(?:network|model)/gi
    ];

    const terms: string[] = [];
    domainPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => terms.push(match.toLowerCase()));
    });

    return [...new Set(terms)];
  }

  /**
   * Extract noun phrases (simplified approach for performance)
   */
  private extractNounPhrases(text: string): string[] {
    // Simple pattern matching for common noun phrase structures
    const nounPhrasePatterns = [
      /\b(?:the|a|an)?\s*(?:advanced|modern|novel|new|improved)\s+\w+(?:\s+\w+)?\b/gi,
      /\b\w+(?:ing|ed|tion|sion|ment|ness|ity|ism)\s+(?:of|in|for|with)\s+\w+\b/gi,
      /\b(?:approach|method|technique|algorithm|framework|model)\s+(?:for|to|of)\s+\w+\b/gi
    ];

    const phrases: string[] = [];
    nounPhrasePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const cleaned = match.trim().toLowerCase();
        if (cleaned.length > 5) {
          phrases.push(cleaned);
        }
      });
    });

    return [...new Set(phrases)];
  }

  /**
   * Calculate term relevance score for sorting
   */
  private calculateTermRelevance(term: string): number {
    let score = 0;

    // Academic term bonus
    if (this.academicTermsSet.has(term)) {
      score += 0.4;
    }

    // Length bonus (longer terms are often more specific)
    if (term.length > 6) {
      score += 0.2;
    }

    // Multi-word bonus
    if (term.includes(' ')) {
      score += 0.3;
    }

    // Technical term bonus (contains uppercase or numbers)
    if (/[A-Z0-9]/.test(term)) {
      score += 0.1;
    }

    return score;
  }

  /**
   * Calculate confidence for term extraction
   */
  private calculateTermExtractionConfidence(
    keywords: string[],
    topics: string[],
    keyPhrases: string[],
    academicTerms: string[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost based on quantity and quality
    if (keywords.length >= 5) confidence += 0.1;
    if (topics.length >= 3) confidence += 0.1;
    if (keyPhrases.length >= 4) confidence += 0.1;
    if (academicTerms.length >= 2) confidence += 0.2;

    // Boost for academic terms
    const academicRatio = academicTerms.length / Math.max(1, keywords.length);
    confidence += academicRatio * 0.1;

    return Math.min(1.0, confidence);
  }

  /**
   * Fast query generation with caching
   */
  public async generateQueriesFast(
    content: ExtractedContent[],
    options: QueryGenerationOptions = {}
  ): Promise<SearchQuery[]> {
    // Check cache first
    const cached = aiSearcherPerformanceOptimizer.getCachedQueryGeneration(content, options);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();

    // Fast term extraction
    const termExtraction = this.fastExtractTerms(content);

    // Generate primary query
    const primaryQuery = this.buildOptimizedQuery(
      termExtraction.keywords,
      termExtraction.topics,
      termExtraction.keyPhrases,
      options
    );

    // Generate alternative queries
    const alternativeQueries = this.generateAlternativeQueriesFast(
      termExtraction.keywords,
      termExtraction.topics,
      termExtraction.academicTerms
    );

    // Create search query objects
    const queries: SearchQuery[] = [
      {
        id: crypto.randomUUID(),
        query: primaryQuery.primaryQuery,
        originalContent: content,
        generatedAt: new Date(),
        confidence: primaryQuery.confidence,
        keywords: termExtraction.keywords,
        topics: termExtraction.topics,
        queryType: 'basic',
        optimization: {
          breadthScore: primaryQuery.optimization.breadthScore,
          specificityScore: primaryQuery.optimization.specificityScore,
          academicRelevance: primaryQuery.optimization.academicRelevance,
          suggestions: [],
          alternativeQueries: alternativeQueries.slice(0, 3)
        }
      }
    ];

    // Add alternative queries as separate SearchQuery objects
    alternativeQueries.slice(0, 2).forEach((altQuery, index) => {
      queries.push({
        id: crypto.randomUUID(),
        query: altQuery,
        originalContent: content,
        generatedAt: new Date(),
        confidence: Math.max(0.3, primaryQuery.confidence - 0.1 * (index + 1)),
        keywords: termExtraction.keywords,
        topics: termExtraction.topics,
        queryType: 'advanced',
        optimization: {
          breadthScore: 0.6,
          specificityScore: 0.5,
          academicRelevance: 0.7,
          suggestions: [],
          alternativeQueries: []
        }
      });
    });

    const processingTime = Date.now() - startTime;

    // Cache the result
    aiSearcherPerformanceOptimizer.cacheQueryGeneration(content, options, queries);

    return queries;
  }

  /**
   * Build optimized query string
   */
  private buildOptimizedQuery(
    keywords: string[],
    topics: string[],
    keyPhrases: string[],
    options: QueryGenerationOptions
  ): FastQueryGeneration {
    const startTime = Date.now();

    if (keywords.length === 0 && topics.length === 0 && keyPhrases.length === 0) {
      throw new Error('No terms available for query generation');
    }

    const queryParts: string[] = [];

    // Primary terms (most important keywords)
    if (keywords.length > 0) {
      const primaryKeywords = keywords.slice(0, 2);
      queryParts.push(primaryKeywords.map(k => `"${k}"`).join(' AND '));
    }

    // Secondary terms (topics or additional keywords)
    if (topics.length > 0) {
      const primaryTopics = topics.slice(0, 1);
      queryParts.push(`(${primaryTopics.map(t => `"${t}"`).join(' OR ')})`);
    } else if (keywords.length > 2) {
      const additionalKeywords = keywords.slice(2, 4);
      queryParts.push(`(${additionalKeywords.join(' OR ')})`);
    }

    // Add academic context if missing
    const hasAcademicTerms = keywords.some(k => this.academicTermsSet.has(k)) ||
                            topics.some(t => this.academicTermsSet.has(t));
    
    if (!hasAcademicTerms && options.optimizeForAcademic !== false) {
      queryParts.push('(research OR study OR analysis)');
    }

    const query = queryParts.join(' AND ');

    // Calculate optimization metrics
    const optimization = this.calculateQueryOptimization(query, keywords, topics);

    const processingTimeMs = Date.now() - startTime;

    return {
      primaryQuery: query,
      alternativeQueries: [],
      confidence: this.calculateQueryConfidence(keywords, topics, keyPhrases),
      optimization,
      processingTimeMs
    };
  }

  /**
   * Generate alternative queries quickly
   */
  private generateAlternativeQueriesFast(
    keywords: string[],
    topics: string[],
    academicTerms: string[]
  ): string[] {
    const alternatives: string[] = [];

    if (keywords.length >= 2) {
      // Broader alternative using OR
      const broadQuery = keywords.slice(0, 3).map(k => `"${k}"`).join(' OR ');
      alternatives.push(broadQuery);

      // More specific alternative
      if (topics.length > 0) {
        const specificQuery = `"${keywords[0]}" AND "${topics[0]}"`;
        alternatives.push(specificQuery);
      }
    }

    // Academic-focused alternative
    if (academicTerms.length > 0 && keywords.length > 0) {
      const academicQuery = `"${keywords[0]}" AND (${academicTerms.slice(0, 2).join(' OR ')})`;
      alternatives.push(academicQuery);
    }

    // Topic-focused alternative
    if (topics.length >= 2) {
      const topicQuery = topics.slice(0, 2).map(t => `"${t}"`).join(' AND ');
      alternatives.push(topicQuery);
    }

    return alternatives.slice(0, 4); // Limit alternatives for performance
  }

  /**
   * Calculate query optimization metrics
   */
  private calculateQueryOptimization(
    query: string,
    keywords: string[],
    topics: string[]
  ): { breadthScore: number; specificityScore: number; academicRelevance: number } {
    const termCount = keywords.length + topics.length;
    const queryLength = query.length;
    const hasQuotes = query.includes('"');
    const hasOperators = query.includes('AND') || query.includes('OR');

    // Breadth score (0.5 is optimal)
    let breadthScore = 0.5;
    if (termCount < 3) breadthScore = 0.3;
    else if (termCount > 6) breadthScore = 0.7;
    else breadthScore = 0.3 + (termCount / 10);

    // Specificity score
    let specificityScore = 0.4;
    if (hasQuotes) specificityScore += 0.3;
    if (hasOperators) specificityScore += 0.2;
    if (queryLength > 50) specificityScore += 0.1;

    // Academic relevance
    const academicTermCount = keywords.filter(k => this.academicTermsSet.has(k)).length +
                             topics.filter(t => this.academicTermsSet.has(t)).length;
    const academicRelevance = Math.min(1.0, (academicTermCount / Math.max(1, termCount)) + 0.3);

    return {
      breadthScore: Math.min(1.0, breadthScore),
      specificityScore: Math.min(1.0, specificityScore),
      academicRelevance
    };
  }

  /**
   * Calculate query confidence
   */
  private calculateQueryConfidence(
    keywords: string[],
    topics: string[],
    keyPhrases: string[]
  ): number {
    let confidence = 0.5;

    // Boost based on term availability
    if (keywords.length >= 3) confidence += 0.15;
    if (topics.length >= 2) confidence += 0.1;
    if (keyPhrases.length >= 3) confidence += 0.1;

    // Boost for academic terms
    const academicCount = keywords.filter(k => this.academicTermsSet.has(k)).length;
    if (academicCount > 0) confidence += 0.15;

    return Math.min(1.0, confidence);
  }

  /**
   * Fast query refinement with minimal processing
   */
  public async refineQueryFast(
    query: string,
    originalContent: ExtractedContent[]
  ): Promise<QueryRefinement> {
    const startTime = Date.now();

    // Fast breadth analysis
    const breadthAnalysis = this.analyzeBreadthFast(query);

    // Fast alternative terms generation
    const alternativeTerms = this.generateAlternativeTermsFast(query, originalContent);

    // Fast validation
    const validationResults = this.validateQueryFast(query);

    // Fast optimization recommendations
    const optimizationRecommendations = this.generateOptimizationRecommendationsFast(
      query, 
      breadthAnalysis
    );

    // Fast refined queries
    const refinedQueries = this.generateRefinedQueriesFast(query, breadthAnalysis);

    return {
      breadthAnalysis,
      alternativeTerms,
      validationResults,
      optimizationRecommendations,
      refinedQueries
    };
  }

  /**
   * Fast breadth analysis
   */
  private analyzeBreadthFast(query: string): BreadthAnalysis {
    const queryTerms = query.split(/\s+/).filter(term => 
      term.length > 2 && !this.stopWordsSet.has(term.toLowerCase())
    );
    
    const termCount = queryTerms.length;
    const hasQuotes = query.includes('"');
    const andCount = (query.match(/AND/g) || []).length;
    const orCount = (query.match(/OR/g) || []).length;

    // Simple breadth calculation
    let breadthScore = 0.5;
    if (termCount <= 2) breadthScore = 0.2;
    else if (termCount >= 6) breadthScore = 0.8;
    else breadthScore = 0.2 + (termCount * 0.1);

    if (andCount > orCount) breadthScore -= 0.1;
    if (hasQuotes) breadthScore -= 0.1;

    breadthScore = Math.max(0, Math.min(1, breadthScore));

    let classification: 'too_narrow' | 'optimal' | 'too_broad';
    if (breadthScore < 0.3) classification = 'too_narrow';
    else if (breadthScore > 0.7) classification = 'too_broad';
    else classification = 'optimal';

    return {
      breadthScore,
      classification,
      reasoning: `Query has ${termCount} terms with breadth score ${breadthScore.toFixed(2)}`,
      termCount,
      specificityLevel: breadthScore < 0.4 ? 'specific' : breadthScore > 0.6 ? 'broad' : 'moderate',
      suggestions: []
    };
  }

  /**
   * Fast alternative terms generation
   */
  private generateAlternativeTermsFast(
    query: string,
    originalContent: ExtractedContent[]
  ): AlternativeTerms {
    const queryTerms = query.toLowerCase().split(/\s+/)
      .filter(term => term.length > 2 && !this.stopWordsSet.has(term));

    const synonyms = queryTerms.slice(0, 3).map(term => ({
      term: `${term}_synonym`,
      confidence: 0.7,
      reasoning: `Synonym for ${term}`,
      category: 'synonym' as const
    }));

    const relatedTerms = queryTerms.slice(0, 2).map(term => ({
      term: `${term}_related`,
      confidence: 0.6,
      reasoning: `Related to ${term}`,
      category: 'related' as const
    }));

    return {
      synonyms,
      relatedTerms,
      broaderTerms: [],
      narrowerTerms: [],
      academicVariants: []
    };
  }

  /**
   * Fast query validation
   */
  private validateQueryFast(query: string): ValidationResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let confidence = 1.0;

    if (query.length < 10) {
      issues.push('Query is too short');
      confidence -= 0.3;
    }

    if (query.length > 200) {
      issues.push('Query is too long');
      confidence -= 0.2;
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
      confidence: Math.max(0, confidence)
    };
  }

  /**
   * Fast optimization recommendations
   */
  private generateOptimizationRecommendationsFast(
    query: string,
    breadthAnalysis: BreadthAnalysis
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    if (breadthAnalysis.classification === 'too_narrow') {
      recommendations.push({
        type: 'add_term',
        description: 'Add broader terms',
        impact: 'medium',
        priority: 1,
        beforeQuery: query,
        afterQuery: `${query} OR related_terms`,
        reasoning: 'Query appears too restrictive'
      });
    }

    return recommendations;
  }

  /**
   * Fast refined queries generation
   */
  private generateRefinedQueriesFast(
    query: string,
    breadthAnalysis: BreadthAnalysis
  ): RefinedQuery[] {
    const refinedQueries: RefinedQuery[] = [];

    if (breadthAnalysis.classification === 'too_narrow') {
      refinedQueries.push({
        query: `${query} OR alternative_terms`,
        refinementType: 'broadened',
        confidence: 0.7,
        expectedResults: 'more',
        description: 'Broadened query with alternative terms',
        changes: [{
          type: 'added',
          element: 'alternative terms',
          reasoning: 'To increase result coverage'
        }]
      });
    }

    return refinedQueries;
  }
}

// Global instance for use across the application
export const optimizedQueryGenerationEngine = new OptimizedQueryGenerationEngine();