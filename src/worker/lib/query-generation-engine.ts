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

export interface QueryRefinement {
  breadthAnalysis: BreadthAnalysis;
  alternativeTerms: AlternativeTerms;
  validationResults: ValidationResult;
  optimizationRecommendations: OptimizationRecommendation[];
  refinedQueries: RefinedQuery[];
}

export interface BreadthAnalysis {
  breadthScore: number; // 0-1, where 0.5 is optimal
  classification: 'too_narrow' | 'optimal' | 'too_broad';
  reasoning: string;
  termCount: number;
  specificityLevel: 'very_specific' | 'specific' | 'moderate' | 'broad' | 'very_broad';
  suggestions: BreadthSuggestion[];
}

export interface BreadthSuggestion {
  type: 'broaden' | 'narrow' | 'refocus';
  suggestion: string;
  reasoning: string;
  impact: 'low' | 'medium' | 'high';
}

export interface AlternativeTerms {
  synonyms: TermSuggestion[];
  relatedTerms: TermSuggestion[];
  broaderTerms: TermSuggestion[];
  narrowerTerms: TermSuggestion[];
  academicVariants: TermSuggestion[];
}

export interface TermSuggestion {
  term: string;
  confidence: number;
  reasoning: string;
  category: 'synonym' | 'related' | 'broader' | 'narrower' | 'academic';
  originalTerm?: string;
}

export interface OptimizationRecommendation {
  type: 'add_term' | 'remove_term' | 'replace_term' | 'add_operator' | 'restructure';
  description: string;
  impact: 'low' | 'medium' | 'high';
  priority: number;
  beforeQuery: string;
  afterQuery: string;
  reasoning: string;
}

export interface RefinedQuery {
  query: string;
  refinementType: 'broadened' | 'narrowed' | 'refocused' | 'academic_enhanced' | 'operator_optimized';
  confidence: number;
  expectedResults: 'fewer' | 'similar' | 'more';
  description: string;
  changes: QueryChange[];
}

export interface QueryChange {
  type: 'added' | 'removed' | 'replaced' | 'reordered';
  element: string;
  reasoning: string;
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
   * Perform comprehensive query refinement analysis
   */
  refineQuery(query: string, originalContent: ExtractedContent[]): QueryRefinement {
    const breadthAnalysis = this.analyzeBreadth(query, originalContent);
    const alternativeTerms = this.generateAlternativeTerms(query, originalContent);
    const validationResults = this.validateQuery(query);
    const optimizationRecommendations = this.generateOptimizationRecommendations(query, breadthAnalysis);
    const refinedQueries = this.generateRefinedQueries(query, breadthAnalysis, alternativeTerms);

    return {
      breadthAnalysis,
      alternativeTerms,
      validationResults,
      optimizationRecommendations,
      refinedQueries
    };
  }

  /**
   * Analyze query breadth to determine if it's too narrow, optimal, or too broad
   */
  private analyzeBreadth(query: string, originalContent: ExtractedContent[]): BreadthAnalysis {
    const queryTerms = this.extractQueryTerms(query);
    const termCount = queryTerms.length;
    const hasQuotes = query.includes('"');
    const hasAndOperators = (query.match(/AND/g) || []).length;
    const hasOrOperators = (query.match(/OR/g) || []).length;
    
    // Calculate breadth score (0 = very narrow, 1 = very broad, 0.5 = optimal)
    let breadthScore = 0.5;
    
    // Adjust based on term count
    if (termCount <= 1) breadthScore -= 0.4;
    else if (termCount <= 2) breadthScore -= 0.2;
    else if (termCount >= 8) breadthScore += 0.3;
    
    // Adjust based on operators
    if (hasAndOperators > hasOrOperators) breadthScore -= 0.1;
    else if (hasOrOperators > hasAndOperators) breadthScore += 0.1;
    
    // Adjust based on quoted phrases (more specific)
    if (hasQuotes) breadthScore -= 0.2;
    
    // Adjust based on academic specificity
    const academicTerms = queryTerms.filter(term => this.academicTerms.has(term.toLowerCase()));
    if (academicTerms.length / termCount > 0.5) breadthScore -= 0.1;
    
    breadthScore = Math.max(0, Math.min(1, breadthScore));
    
    // Classify breadth
    let classification: 'too_narrow' | 'optimal' | 'too_broad';
    if (breadthScore < 0.3) classification = 'too_narrow';
    else if (breadthScore > 0.7) classification = 'too_broad';
    else classification = 'optimal';
    
    // Determine specificity level
    let specificityLevel: 'very_specific' | 'specific' | 'moderate' | 'broad' | 'very_broad';
    if (breadthScore < 0.2) specificityLevel = 'very_specific';
    else if (breadthScore < 0.4) specificityLevel = 'specific';
    else if (breadthScore < 0.6) specificityLevel = 'moderate';
    else if (breadthScore < 0.8) specificityLevel = 'broad';
    else specificityLevel = 'very_broad';
    
    // Generate reasoning
    let reasoning = `Query has ${termCount} terms with breadth score of ${breadthScore.toFixed(2)}. `;
    if (classification === 'too_narrow') {
      reasoning += 'This query may be too restrictive and could miss relevant results.';
    } else if (classification === 'too_broad') {
      reasoning += 'This query may return too many irrelevant results.';
    } else {
      reasoning += 'This query appears to have good balance between specificity and breadth.';
    }
    
    // Generate suggestions
    const suggestions = this.generateBreadthSuggestions(classification, termCount, hasQuotes, hasAndOperators, hasOrOperators);
    
    return {
      breadthScore,
      classification,
      reasoning,
      termCount,
      specificityLevel,
      suggestions
    };
  }

  /**
   * Generate suggestions for improving query breadth
   */
  private generateBreadthSuggestions(
    classification: 'too_narrow' | 'optimal' | 'too_broad',
    termCount: number,
    hasQuotes: boolean,
    hasAndOperators: number,
    hasOrOperators: number
  ): BreadthSuggestion[] {
    const suggestions: BreadthSuggestion[] = [];
    
    if (classification === 'too_narrow') {
      if (termCount <= 2) {
        suggestions.push({
          type: 'broaden',
          suggestion: 'Add related terms or synonyms to capture more relevant results',
          reasoning: 'Query has very few terms which may be overly restrictive',
          impact: 'high'
        });
      }
      
      if (hasAndOperators > 2) {
        suggestions.push({
          type: 'broaden',
          suggestion: 'Replace some AND operators with OR to include alternative terms',
          reasoning: 'Multiple AND operators create very restrictive conditions',
          impact: 'medium'
        });
      }
      
      if (hasQuotes) {
        suggestions.push({
          type: 'broaden',
          suggestion: 'Remove quotes from some phrases to allow for variations',
          reasoning: 'Quoted phrases require exact matches which may be too restrictive',
          impact: 'medium'
        });
      }
    } else if (classification === 'too_broad') {
      if (termCount >= 8) {
        suggestions.push({
          type: 'narrow',
          suggestion: 'Focus on the most important 3-5 terms to improve precision',
          reasoning: 'Too many terms can dilute search focus',
          impact: 'high'
        });
      }
      
      if (hasOrOperators > hasAndOperators) {
        suggestions.push({
          type: 'narrow',
          suggestion: 'Use AND operators to require multiple concepts simultaneously',
          reasoning: 'OR operators create broad conditions that may include irrelevant results',
          impact: 'medium'
        });
      }
      
      suggestions.push({
        type: 'narrow',
        suggestion: 'Add specific academic terms or methodological keywords',
        reasoning: 'More specific terminology will help filter results',
        impact: 'medium'
      });
    } else {
      suggestions.push({
        type: 'refocus',
        suggestion: 'Query appears well-balanced, consider minor adjustments based on initial results',
        reasoning: 'Current breadth seems appropriate for academic search',
        impact: 'low'
      });
    }
    
    return suggestions;
  }

  /**
   * Generate alternative and related terms for query enhancement
   */
  private generateAlternativeTerms(query: string, originalContent: ExtractedContent[]): AlternativeTerms {
    const queryTerms = this.extractQueryTerms(query);
    const allContentTerms = originalContent.flatMap(c => [...(c.keywords || []), ...(c.topics || [])]);
    
    const synonyms: TermSuggestion[] = [];
    const relatedTerms: TermSuggestion[] = [];
    const broaderTerms: TermSuggestion[] = [];
    const narrowerTerms: TermSuggestion[] = [];
    const academicVariants: TermSuggestion[] = [];
    
    // Generate synonyms and alternatives for each query term
    queryTerms.forEach(term => {
      const termSynonyms = this.findSynonyms(term);
      synonyms.push(...termSynonyms.map(syn => ({
        term: syn,
        confidence: 0.8,
        reasoning: `Synonym for "${term}"`,
        category: 'synonym' as const,
        originalTerm: term
      })));
      
      const termRelated = this.findRelatedTerms(term, allContentTerms);
      relatedTerms.push(...termRelated.map(rel => ({
        term: rel,
        confidence: 0.7,
        reasoning: `Related to "${term}" based on content context`,
        category: 'related' as const,
        originalTerm: term
      })));
      
      const termBroader = this.findBroaderTerms(term);
      broaderTerms.push(...termBroader.map(broader => ({
        term: broader,
        confidence: 0.6,
        reasoning: `Broader concept encompassing "${term}"`,
        category: 'broader' as const,
        originalTerm: term
      })));
      
      const termNarrower = this.findNarrowerTerms(term);
      narrowerTerms.push(...termNarrower.map(narrower => ({
        term: narrower,
        confidence: 0.7,
        reasoning: `More specific aspect of "${term}"`,
        category: 'narrower' as const,
        originalTerm: term
      })));
      
      const termAcademic = this.findAcademicVariants(term);
      academicVariants.push(...termAcademic.map(academic => ({
        term: academic,
        confidence: 0.9,
        reasoning: `Academic terminology for "${term}"`,
        category: 'academic' as const,
        originalTerm: term
      })));
    });
    
    return {
      synonyms: this.deduplicateTermSuggestions(synonyms).slice(0, 10),
      relatedTerms: this.deduplicateTermSuggestions(relatedTerms).slice(0, 10),
      broaderTerms: this.deduplicateTermSuggestions(broaderTerms).slice(0, 8),
      narrowerTerms: this.deduplicateTermSuggestions(narrowerTerms).slice(0, 8),
      academicVariants: this.deduplicateTermSuggestions(academicVariants).slice(0, 6)
    };
  }

  /**
   * Generate optimization recommendations for the query
   */
  private generateOptimizationRecommendations(query: string, breadthAnalysis: BreadthAnalysis): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const queryTerms = this.extractQueryTerms(query);
    
    // Recommendations based on breadth analysis
    if (breadthAnalysis.classification === 'too_narrow') {
      recommendations.push({
        type: 'add_term',
        description: 'Add broader or alternative terms to increase result coverage',
        impact: 'high',
        priority: 1,
        beforeQuery: query,
        afterQuery: `${query} OR (related terms)`,
        reasoning: 'Query is too restrictive and may miss relevant results'
      });
      
      if (query.includes('AND')) {
        recommendations.push({
          type: 'replace_term',
          description: 'Replace some AND operators with OR to broaden search',
          impact: 'medium',
          priority: 2,
          beforeQuery: query,
          afterQuery: query.replace(/AND/g, 'OR'),
          reasoning: 'Multiple AND conditions create overly restrictive search'
        });
      }
    }
    
    if (breadthAnalysis.classification === 'too_broad') {
      recommendations.push({
        type: 'add_term',
        description: 'Add more specific academic or methodological terms',
        impact: 'high',
        priority: 1,
        beforeQuery: query,
        afterQuery: `${query} AND (methodology OR framework)`,
        reasoning: 'Query needs more specificity to filter irrelevant results'
      });
      
      if (queryTerms.length > 6) {
        recommendations.push({
          type: 'remove_term',
          description: 'Remove less important terms to focus the search',
          impact: 'medium',
          priority: 2,
          beforeQuery: query,
          afterQuery: 'Simplified query with key terms only',
          reasoning: 'Too many terms can dilute search effectiveness'
        });
      }
    }
    
    // Academic enhancement recommendations
    const hasAcademicTerms = queryTerms.some(term => this.academicTerms.has(term.toLowerCase()));
    if (!hasAcademicTerms) {
      recommendations.push({
        type: 'add_term',
        description: 'Add academic context terms for scholarly relevance',
        impact: 'medium',
        priority: 3,
        beforeQuery: query,
        afterQuery: `(${query}) AND (research OR study OR analysis)`,
        reasoning: 'Academic terms improve relevance for scholarly search'
      });
    }
    
    // Operator optimization
    if (!query.includes('AND') && !query.includes('OR') && queryTerms.length > 1) {
      recommendations.push({
        type: 'add_operator',
        description: 'Add search operators to clarify term relationships',
        impact: 'medium',
        priority: 4,
        beforeQuery: query,
        afterQuery: queryTerms.map(t => `"${t}"`).join(' AND '),
        reasoning: 'Search operators improve query precision and control'
      });
    }
    
    // Structure optimization
    if (query.length > 150) {
      recommendations.push({
        type: 'restructure',
        description: 'Simplify query structure for better search engine compatibility',
        impact: 'low',
        priority: 5,
        beforeQuery: query,
        afterQuery: 'Restructured shorter query',
        reasoning: 'Very long queries may not be processed effectively by search engines'
      });
    }
    
    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Generate refined query variations
   */
  private generateRefinedQueries(query: string, breadthAnalysis: BreadthAnalysis, alternativeTerms: AlternativeTerms): RefinedQuery[] {
    const refinedQueries: RefinedQuery[] = [];
    const queryTerms = this.extractQueryTerms(query);
    
    // Broadened version
    if (breadthAnalysis.classification === 'too_narrow' || breadthAnalysis.classification === 'optimal') {
      const broaderQuery = this.createBroadenedQuery(query, alternativeTerms);
      refinedQueries.push({
        query: broaderQuery,
        refinementType: 'broadened',
        confidence: 0.8,
        expectedResults: 'more',
        description: 'Broadened version using synonyms and related terms',
        changes: [{
          type: 'added',
          element: 'alternative terms',
          reasoning: 'Added synonyms and related terms to capture more results'
        }]
      });
    }
    
    // Narrowed version
    if (breadthAnalysis.classification === 'too_broad' || breadthAnalysis.classification === 'optimal') {
      const narrowerQuery = this.createNarrowedQuery(query, alternativeTerms);
      refinedQueries.push({
        query: narrowerQuery,
        refinementType: 'narrowed',
        confidence: 0.9,
        expectedResults: 'fewer',
        description: 'Narrowed version with more specific terms',
        changes: [{
          type: 'added',
          element: 'specific terms',
          reasoning: 'Added more specific academic terms for precision'
        }]
      });
    }
    
    // Academic enhanced version
    const academicQuery = this.createAcademicEnhancedQuery(query, alternativeTerms);
    refinedQueries.push({
      query: academicQuery,
      refinementType: 'academic_enhanced',
      confidence: 0.85,
      expectedResults: 'similar',
      description: 'Enhanced with academic terminology',
      changes: [{
        type: 'added',
        element: 'academic terms',
        reasoning: 'Added academic variants to improve scholarly relevance'
      }]
    });
    
    // Operator optimized version
    const operatorQuery = this.createOperatorOptimizedQuery(query);
    refinedQueries.push({
      query: operatorQuery,
      refinementType: 'operator_optimized',
      confidence: 0.75,
      expectedResults: 'similar',
      description: 'Optimized search operators and structure',
      changes: [{
        type: 'replaced',
        element: 'search operators',
        reasoning: 'Optimized operator usage for better search control'
      }]
    });
    
    // Refocused version (balanced approach)
    if (breadthAnalysis.classification !== 'optimal') {
      const refocusedQuery = this.createRefocusedQuery(query, alternativeTerms, breadthAnalysis);
      refinedQueries.push({
        query: refocusedQuery,
        refinementType: 'refocused',
        confidence: 0.9,
        expectedResults: 'similar',
        description: 'Balanced refinement addressing breadth issues',
        changes: [{
          type: 'replaced',
          element: 'query structure',
          reasoning: 'Rebalanced query to achieve optimal breadth'
        }]
      });
    }
    
    return refinedQueries;
  }

  // Helper methods for query refinement

  private extractQueryTerms(query: string): string[] {
    // Extract meaningful terms from query, excluding operators and quotes
    return query
      .replace(/[()]/g, ' ')
      .replace(/\s+(AND|OR)\s+/gi, ' ')
      .replace(/"/g, '')
      .split(/\s+/)
      .filter(term => term.length > 2 && !this.stopWords.has(term.toLowerCase()))
      .map(term => term.toLowerCase())
      .filter((term, index, array) => array.indexOf(term) === index); // Remove duplicates
  }

  private findSynonyms(term: string): string[] {
    // Simple synonym mapping - in a real implementation, this would use a thesaurus API
    const synonymMap: Record<string, string[]> = {
      'research': ['study', 'investigation', 'inquiry', 'examination'],
      'analysis': ['evaluation', 'assessment', 'review', 'examination'],
      'method': ['approach', 'technique', 'procedure', 'methodology'],
      'framework': ['model', 'structure', 'system', 'architecture'],
      'development': ['creation', 'construction', 'building', 'formation'],
      'implementation': ['execution', 'deployment', 'application', 'realization'],
      'evaluation': ['assessment', 'analysis', 'appraisal', 'review'],
      'system': ['framework', 'structure', 'platform', 'architecture']
    };
    
    return synonymMap[term.toLowerCase()] || [];
  }

  private findRelatedTerms(term: string, contentTerms: string[]): string[] {
    // Find terms that frequently appear with the given term in content
    return contentTerms
      .filter(contentTerm => 
        contentTerm.toLowerCase() !== term.toLowerCase() &&
        contentTerm.length > 2 &&
        !this.stopWords.has(contentTerm.toLowerCase())
      )
      .slice(0, 5);
  }

  private findBroaderTerms(term: string): string[] {
    // Map specific terms to broader concepts
    const broaderMap: Record<string, string[]> = {
      'algorithm': ['computation', 'method', 'approach'],
      'database': ['system', 'technology', 'storage'],
      'neural network': ['machine learning', 'artificial intelligence', 'computation'],
      'regression': ['statistics', 'analysis', 'modeling'],
      'optimization': ['improvement', 'enhancement', 'method']
    };
    
    return broaderMap[term.toLowerCase()] || [];
  }

  private findNarrowerTerms(term: string): string[] {
    // Map broad terms to more specific concepts
    const narrowerMap: Record<string, string[]> = {
      'machine learning': ['neural networks', 'deep learning', 'supervised learning'],
      'analysis': ['statistical analysis', 'data analysis', 'regression analysis'],
      'system': ['database system', 'operating system', 'information system'],
      'method': ['algorithm', 'technique', 'procedure'],
      'learning': ['supervised learning', 'unsupervised learning', 'reinforcement learning'],
      'research': ['empirical research', 'experimental research', 'qualitative research'],
      'study': ['case study', 'longitudinal study', 'cross-sectional study']
    };
    
    return narrowerMap[term.toLowerCase()] || [];
  }

  private findAcademicVariants(term: string): string[] {
    // Map common terms to academic equivalents
    const academicMap: Record<string, string[]> = {
      'study': ['research', 'investigation', 'empirical study'],
      'method': ['methodology', 'approach', 'technique'],
      'result': ['findings', 'outcomes', 'conclusions'],
      'problem': ['challenge', 'issue', 'research question'],
      'solution': ['approach', 'methodology', 'framework']
    };
    
    return academicMap[term.toLowerCase()] || [];
  }

  private deduplicateTermSuggestions(suggestions: TermSuggestion[]): TermSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = suggestion.term.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private createBroadenedQuery(originalQuery: string, alternativeTerms: AlternativeTerms): string {
    const queryTerms = this.extractQueryTerms(originalQuery);
    const synonyms = alternativeTerms.synonyms.slice(0, 3).map(s => s.term);
    
    if (synonyms.length > 0) {
      return `(${originalQuery}) OR (${synonyms.map(s => `"${s}"`).join(' OR ')})`;
    }
    
    return originalQuery;
  }

  private createNarrowedQuery(originalQuery: string, alternativeTerms: AlternativeTerms): string {
    const academicTerms = alternativeTerms.academicVariants.slice(0, 2).map(a => a.term);
    
    if (academicTerms.length > 0) {
      return `(${originalQuery}) AND (${academicTerms.map(t => `"${t}"`).join(' OR ')})`;
    }
    
    return `(${originalQuery}) AND (methodology OR framework)`;
  }

  private createAcademicEnhancedQuery(originalQuery: string, alternativeTerms: AlternativeTerms): string {
    const academicVariants = alternativeTerms.academicVariants.slice(0, 2).map(a => a.term);
    
    if (academicVariants.length > 0) {
      return originalQuery.replace(/\b\w+\b/g, (match) => {
        const academic = academicVariants.find(a => a.toLowerCase().includes(match.toLowerCase()));
        return academic ? `"${academic}"` : match;
      });
    }
    
    return `(${originalQuery}) AND (research OR study)`;
  }

  private createOperatorOptimizedQuery(originalQuery: string): string {
    const terms = this.extractQueryTerms(originalQuery);
    
    if (terms.length <= 1) return originalQuery;
    
    // Create a balanced structure with primary and secondary terms
    const primaryTerms = terms.slice(0, 2);
    const secondaryTerms = terms.slice(2, 4);
    
    let optimized = primaryTerms.map(t => `"${t}"`).join(' AND ');
    
    if (secondaryTerms.length > 0) {
      optimized += ` AND (${secondaryTerms.map(t => `"${t}"`).join(' OR ')})`;
    }
    
    return optimized;
  }

  private createRefocusedQuery(originalQuery: string, alternativeTerms: AlternativeTerms, breadthAnalysis: BreadthAnalysis): string {
    if (breadthAnalysis.classification === 'too_narrow') {
      return this.createBroadenedQuery(originalQuery, alternativeTerms);
    } else if (breadthAnalysis.classification === 'too_broad') {
      return this.createNarrowedQuery(originalQuery, alternativeTerms);
    }
    
    return originalQuery;
  }

  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}