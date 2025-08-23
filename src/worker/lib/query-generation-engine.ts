import { ExtractedContent } from '../../lib/ai-types';

/**
 * Query Generation Engine
 * Generates optimized search queries from extracted content for academic search
 */

export interface SearchQuery {
  id: string;
  query: string;
  originalContent: ExtractedContent[];
  generatedAt: Date;
  confidence: number;
  keywords: string[];
  topics: string[];
  queryType: 'basic' | 'advanced' | 'combined';
  optimization: QueryOptimization;
}

export interface QueryOptimization {
  breadthScore: number; // 0-1, where 0.5 is optimal breadth
  specificityScore: number; // 0-1, higher is more specific
  academicRelevance: number; // 0-1, higher is more academic
  suggestions: string[];
  alternativeQueries: string[];
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  confidence: number;
}

export interface QueryGenerationOptions {
  maxKeywords?: number;
  maxTopics?: number;
  includeAlternatives?: boolean;
  optimizeForAcademic?: boolean;
  combineStrategy?: 'union' | 'intersection' | 'weighted';
}

export class QueryGenerationEngine {
  private readonly academicTerms = new Set([
    'research', 'study', 'analysis', 'methodology', 'framework', 'approach',
    'theory', 'model', 'system', 'process', 'development', 'implementation',
    'evaluation', 'assessment', 'investigation', 'examination', 'exploration',
    'findings', 'results', 'conclusion', 'evidence', 'data', 'empirical',
    'systematic', 'comprehensive', 'comparative', 'experimental', 'qualitative',
    'quantitative', 'statistical', 'analytical', 'theoretical', 'practical'
  ]);

  private readonly stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ]);

  /**
   * Generate search queries from extracted content
   */
  generateQueries(content: ExtractedContent[], options: QueryGenerationOptions = {}): SearchQuery[] {
    if (!content || content.length === 0) {
      throw new Error('No content provided for query generation');
    }

    const queries: SearchQuery[] = [];
    const queryId = this.generateQueryId();

    if (content.length === 1) {
      // Single source query
      const query = this.generateSingleSourceQuery(content[0], queryId, options);
      queries.push(query);
    } else {
      // Multiple source queries
      const combinedQuery = this.generateCombinedQuery(content, queryId, options);
      queries.push(combinedQuery);

      // Optionally generate individual queries for each source
      if (options.includeAlternatives) {
        content.forEach((item, index) => {
          const individualQuery = this.generateSingleSourceQuery(
            item, 
            `${queryId}-alt-${index}`, 
            options
          );
          queries.push(individualQuery);
        });
      }
    }

    return queries;
  }

  /**
   * Generate query from single content source
   */
  private generateSingleSourceQuery(
    content: ExtractedContent, 
    queryId: string, 
    options: QueryGenerationOptions
  ): SearchQuery {
    const keywords = this.extractRelevantKeywords(content, options.maxKeywords || 8);
    const topics = this.extractRelevantTopics(content, options.maxTopics || 5);
    
    const queryString = this.buildQueryString(keywords, topics, options);
    const optimization = this.optimizeQuery(queryString, keywords, topics);

    return {
      id: queryId,
      query: this.optimizeForGoogleScholar(queryString),
      originalContent: [content],
      generatedAt: new Date(),
      confidence: this.calculateQueryConfidence(content, keywords, topics),
      keywords,
      topics,
      queryType: 'basic',
      optimization
    };
  }

  /**
   * Generate combined query from multiple content sources
   */
  private generateCombinedQuery(
    contents: ExtractedContent[], 
    queryId: string, 
    options: QueryGenerationOptions
  ): SearchQuery {
    const allKeywords = this.combineKeywords(contents, options);
    const allTopics = this.combineTopics(contents, options);
    
    const queryString = this.buildQueryString(allKeywords, allTopics, options);
    const optimization = this.optimizeQuery(queryString, allKeywords, allTopics);

    const avgConfidence = contents.reduce((sum, c) => sum + c.confidence, 0) / contents.length;

    return {
      id: queryId,
      query: this.optimizeForGoogleScholar(queryString),
      originalContent: contents,
      generatedAt: new Date(),
      confidence: avgConfidence,
      keywords: allKeywords,
      topics: allTopics,
      queryType: 'combined',
      optimization
    };
  }

  /**
   * Optimize query for academic search effectiveness
   */
  optimizeQuery(query: string, keywords: string[], topics: string[]): QueryOptimization {
    const analysis = this.analyzeQueryQuality(query, keywords, topics);
    let optimizedQuery = query;
    const suggestions: string[] = [];
    const alternatives: string[] = [];

    // Add academic context if missing
    const hasAcademicTerms = keywords.some(k => this.academicTerms.has(k.toLowerCase())) ||
                            topics.some(t => this.academicTerms.has(t.toLowerCase()));

    if (!hasAcademicTerms && keywords.length > 0) {
      // Add general academic terms to broaden search
      optimizedQuery = `(${optimizedQuery}) AND (research OR study OR analysis)`;
      suggestions.push('Added academic context terms to improve scholarly relevance');
    }

    // Generate alternative queries
    alternatives.push(...this.generateAlternativeQueries(keywords, topics));

    // Optimize for Google Scholar
    optimizedQuery = this.optimizeForGoogleScholar(optimizedQuery);

    // Add suggestions based on analysis
    if (analysis.breadthScore < 0.3) {
      suggestions.push('Query may be too narrow - consider adding broader terms');
    } else if (analysis.breadthScore > 0.7) {
      suggestions.push('Query may be too broad - consider adding more specific terms');
    }

    if (analysis.specificityScore < 0.4) {
      suggestions.push('Consider adding more specific terminology or quoted phrases');
    }

    if (analysis.academicRelevance < 0.5) {
      suggestions.push('Add academic terms like "methodology", "framework", or "empirical"');
    }

    return {
      breadthScore: analysis.breadthScore,
      specificityScore: analysis.specificityScore,
      academicRelevance: analysis.academicRelevance,
      suggestions,
      alternativeQueries: alternatives
    };
  }

  /**
   * Combine queries from multiple sources
   */
  combineQueries(queries: SearchQuery[]): SearchQuery {
    if (queries.length === 0) {
      throw new Error('No queries to combine');
    }

    if (queries.length === 1) {
      return queries[0];
    }

    const combinedKeywords = this.mergeAndRankTerms(
      queries.flatMap(q => q.keywords)
    );

    const combinedTopics = this.mergeAndRankTerms(
      queries.flatMap(q => q.topics)
    );

    const combinedQuery = this.buildQueryString(combinedKeywords, combinedTopics);
    const optimization = this.optimizeQuery(combinedQuery, combinedKeywords, combinedTopics);

    const avgConfidence = queries.reduce((sum, q) => sum + q.confidence, 0) / queries.length;

    return {
      id: this.generateQueryId(),
      query: this.optimizeForGoogleScholar(combinedQuery),
      originalContent: queries.flatMap(q => q.originalContent),
      generatedAt: new Date(),
      confidence: avgConfidence,
      keywords: combinedKeywords,
      topics: combinedTopics,
      queryType: 'combined',
      optimization
    };
  }

  /**
   * Validate query quality and provide suggestions
   */
  validateQuery(query: string): ValidationResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let confidence = 1.0;

    // Check query length
    if (query.length < 10) {
      issues.push('Query is too short and may not be specific enough');
      suggestions.push('Add more specific terms or phrases');
      confidence -= 0.3;
    }

    if (query.length > 200) {
      issues.push('Query is too long and may be overly restrictive');
      suggestions.push('Remove less important terms or use broader concepts');
      confidence -= 0.2;
    }

    // Check for academic relevance
    const hasAcademicTerms = this.containsAcademicTerms(query);
    if (!hasAcademicTerms) {
      suggestions.push('Consider adding academic terms like "research", "study", or "analysis"');
      confidence -= 0.1;
    }

    // Check for proper operators
    if (!query.includes('AND') && !query.includes('OR') && !query.includes('"')) {
      suggestions.push('Consider using search operators (AND, OR) or quoted phrases for better results');
      confidence -= 0.1;
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
      confidence: Math.max(0, confidence)
    };
  }

  /**
   * Extract relevant keywords from content
   */
  private extractRelevantKeywords(content: ExtractedContent, maxKeywords: number): string[] {
    const keywords = content.keywords || [];
    const keyPhrases = content.keyPhrases || [];

    // Combine and filter keywords
    const allTerms = [...keywords, ...keyPhrases]
      .filter(term => term && term.length > 2)
      .filter(term => !this.stopWords.has(term.toLowerCase()))
      .map(term => term.toLowerCase());

    // Remove duplicates and rank by relevance
    const uniqueTerms = [...new Set(allTerms)];
    const rankedTerms = this.rankTermsByRelevance(uniqueTerms, content);

    return rankedTerms.slice(0, maxKeywords);
  }

  /**
   * Extract relevant topics from content
   */
  private extractRelevantTopics(content: ExtractedContent, maxTopics: number): string[] {
    const topics = content.topics || [];
    
    // Filter and rank topics
    const filteredTopics = topics
      .filter(topic => topic && topic.length > 2)
      .filter(topic => !this.stopWords.has(topic.toLowerCase()));

    return filteredTopics.slice(0, maxTopics);
  }

  /**
   * Combine keywords from multiple content sources
   */
  private combineKeywords(contents: ExtractedContent[], options: QueryGenerationOptions): string[] {
    const allKeywords = contents.flatMap(c => c.keywords || []);
    const strategy = options.combineStrategy || 'weighted';

    switch (strategy) {
      case 'union':
        return this.mergeAndRankTerms(allKeywords).slice(0, options.maxKeywords || 10);
      
      case 'intersection':
        return this.findCommonTerms(contents.map(c => c.keywords || []));
      
      case 'weighted':
      default:
        return this.weightedCombineTerms(contents, 'keywords').slice(0, options.maxKeywords || 10);
    }
  }

  /**
   * Combine topics from multiple content sources
   */
  private combineTopics(contents: ExtractedContent[], options: QueryGenerationOptions): string[] {
    const allTopics = contents.flatMap(c => c.topics || []);
    const strategy = options.combineStrategy || 'weighted';

    switch (strategy) {
      case 'union':
        return this.mergeAndRankTerms(allTopics).slice(0, options.maxTopics || 6);
      
      case 'intersection':
        return this.findCommonTerms(contents.map(c => c.topics || []));
      
      case 'weighted':
      default:
        return this.weightedCombineTerms(contents, 'topics').slice(0, options.maxTopics || 6);
    }
  }

  /**
   * Build query string from keywords and topics
   */
  private buildQueryString(keywords: string[], topics: string[], options: QueryGenerationOptions = {}): string {
    if (keywords.length === 0 && topics.length === 0) {
      throw new Error('No keywords or topics available for query generation');
    }

    const queryParts: string[] = [];

    // Add primary keywords as quoted phrases for exact matching
    if (keywords.length > 0) {
      const primaryKeywords = keywords.slice(0, 3).map(k => `"${k}"`);
      queryParts.push(primaryKeywords.join(' AND '));
    }

    // Add topics as broader terms
    if (topics.length > 0) {
      const topicTerms = topics.slice(0, 2).map(t => `"${t}"`);
      if (queryParts.length > 0) {
        queryParts.push(`(${topicTerms.join(' OR ')})`);
      } else {
        queryParts.push(topicTerms.join(' AND '));
      }
    }

    // Add additional keywords as optional terms
    if (keywords.length > 3) {
      const additionalKeywords = keywords.slice(3, 6);
      queryParts.push(`(${additionalKeywords.join(' OR ')})`);
    }

    return queryParts.join(' AND ');
  }

  /**
   * Optimize query specifically for Google Scholar
   */
  private optimizeForGoogleScholar(query: string): string {
    // Google Scholar specific optimizations
    let optimized = query;

    // Ensure proper quoting for phrases
    optimized = optimized.replace(/([a-zA-Z]+\s+[a-zA-Z]+)/g, '"$1"');

    // Remove redundant quotes
    optimized = optimized.replace(/""/g, '"');

    // Limit query length for Google Scholar
    if (optimized.length > 150) {
      const parts = optimized.split(' AND ');
      optimized = parts.slice(0, 3).join(' AND ');
    }

    return optimized;
  }

  /**
   * Rank terms by relevance to content
   */
  private rankTermsByRelevance(terms: string[], content: ExtractedContent): string[] {
    return terms.sort((a, b) => {
      const scoreA = this.calculateTermRelevance(a, content);
      const scoreB = this.calculateTermRelevance(b, content);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate relevance score for a term
   */
  private calculateTermRelevance(term: string, content: ExtractedContent): number {
    let score = 0;

    // Academic term bonus
    if (this.academicTerms.has(term.toLowerCase())) {
      score += 0.3;
    }

    // Length bonus (longer terms are often more specific)
    if (term.length > 6) {
      score += 0.2;
    }

    // Frequency in keywords/topics
    const keywords = content.keywords || [];
    const topics = content.topics || [];
    
    if (keywords.includes(term)) score += 0.4;
    if (topics.includes(term)) score += 0.3;

    return score;
  }

  /**
   * Merge and rank terms, removing duplicates
   */
  private mergeAndRankTerms(terms: string[]): string[] {
    const termCounts: Record<string, number> = {};
    
    terms.forEach(term => {
      const normalized = term.toLowerCase();
      termCounts[normalized] = (termCounts[normalized] || 0) + 1;
    });

    return Object.entries(termCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([term]) => term);
  }

  /**
   * Find common terms across multiple arrays
   */
  private findCommonTerms(termArrays: string[][]): string[] {
    if (termArrays.length === 0) return [];
    if (termArrays.length === 1) return termArrays[0];

    const firstArray = new Set(termArrays[0].map(t => t.toLowerCase()));
    
    return termArrays.slice(1).reduce((common, currentArray) => {
      const currentSet = new Set(currentArray.map(t => t.toLowerCase()));
      return common.filter(term => currentSet.has(term.toLowerCase()));
    }, Array.from(firstArray));
  }

  /**
   * Weighted combination of terms based on content confidence
   */
  private weightedCombineTerms(contents: ExtractedContent[], field: 'keywords' | 'topics'): string[] {
    const weightedTerms: Record<string, number> = {};

    contents.forEach(content => {
      const terms = content[field] || [];
      const weight = content.confidence || 0.5;

      terms.forEach(term => {
        const normalized = term.toLowerCase();
        weightedTerms[normalized] = (weightedTerms[normalized] || 0) + weight;
      });
    });

    return Object.entries(weightedTerms)
      .sort(([, a], [, b]) => b - a)
      .map(([term]) => term);
  }

  /**
   * Calculate confidence score for generated query
   */
  private calculateQueryConfidence(content: ExtractedContent, keywords: string[], topics: string[]): number {
    let confidence = content.confidence || 0.5;

    // Boost confidence based on available terms
    if (keywords.length >= 3) confidence += 0.1;
    if (topics.length >= 2) confidence += 0.1;

    // Boost for academic terms
    const hasAcademicTerms = keywords.some(k => this.academicTerms.has(k.toLowerCase())) ||
                            topics.some(t => this.academicTerms.has(t.toLowerCase()));
    if (hasAcademicTerms) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  /**
   * Check if query contains academic terms
   */
  private containsAcademicTerms(query: string): boolean {
    const queryLower = query.toLowerCase();
    return Array.from(this.academicTerms).some(term => queryLower.includes(term));
  }

  /**
   * Analyze query quality metrics
   */
  private analyzeQueryQuality(query: string, keywords: string[], topics: string[]): {
    breadthScore: number;
    specificityScore: number;
    academicRelevance: number;
  } {
    const termCount = keywords.length + topics.length;
    const queryLength = query.length;
    const hasQuotes = query.includes('"');
    const hasOperators = query.includes('AND') || query.includes('OR');
    
    // Breadth score: balance between too narrow and too broad
    let breadthScore = 0.5;
    if (termCount < 3) breadthScore = 0.2; // Too narrow
    else if (termCount > 8) breadthScore = 0.8; // Too broad
    else breadthScore = 0.3 + (termCount / 10); // Optimal range

    // Specificity score: based on quoted phrases and specific terms
    let specificityScore = 0.3;
    if (hasQuotes) specificityScore += 0.3;
    if (hasOperators) specificityScore += 0.2;
    if (queryLength > 50) specificityScore += 0.2;

    // Academic relevance: based on academic terms
    const academicTermCount = keywords.filter(k => this.academicTerms.has(k.toLowerCase())).length +
                             topics.filter(t => this.academicTerms.has(t.toLowerCase())).length;
    const academicRelevance = Math.min(1.0, academicTermCount / Math.max(1, termCount) + 0.2);

    return {
      breadthScore: Math.min(1.0, breadthScore),
      specificityScore: Math.min(1.0, specificityScore),
      academicRelevance
    };
  }

  /**
   * Generate alternative query formulations
   */
  private generateAlternativeQueries(keywords: string[], topics: string[]): string[] {
    const alternatives: string[] = [];

    if (keywords.length >= 2) {
      // Broader alternative using OR
      const broadQuery = keywords.slice(0, 4).map(k => `"${k}"`).join(' OR ');
      alternatives.push(broadQuery);

      // More specific alternative using AND
      const specificQuery = keywords.slice(0, 3).map(k => `"${k}"`).join(' AND ');
      if (topics.length > 0) {
        alternatives.push(`${specificQuery} AND "${topics[0]}"`);
      }
    }

    if (topics.length >= 2) {
      // Topic-focused alternative
      const topicQuery = topics.slice(0, 2).map(t => `"${t}"`).join(' AND ');
      alternatives.push(topicQuery);
    }

    // Academic-focused alternative
    if (keywords.length > 0) {
      const academicQuery = `"${keywords[0]}" AND (research OR study OR analysis)`;
      alternatives.push(academicQuery);
    }

    return alternatives.slice(0, 3); // Limit to 3 alternatives
  }

  /**
   * Generate unique query ID
   */
  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}