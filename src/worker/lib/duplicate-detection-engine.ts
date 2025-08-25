/**
 * Duplicate Detection Engine
 * Handles detection and merging of duplicate search results
 */

import { ScholarSearchResult } from '../../lib/ai-types';

// Simple string similarity implementation as fallback
const calculateStringSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

export interface DuplicateGroup {
  primary: ScholarSearchResult;
  duplicates: ScholarSearchResult[];
  confidence: number;
  mergeStrategy: 'doi' | 'title_author' | 'url' | 'fuzzy_match';
}

export interface DuplicateDetectionOptions {
  titleSimilarityThreshold: number; // 0.0 to 1.0
  authorSimilarityThreshold: number; // 0.0 to 1.0
  enableFuzzyMatching: boolean;
  strictDOIMatching: boolean;
  mergeStrategy: 'keep_highest_quality' | 'keep_most_complete' | 'manual_review';
}

export interface MergedResult extends ScholarSearchResult {
  mergedFrom: string[]; // IDs of merged results
  mergeConfidence: number;
  conflictingFields: string[];
}

export interface DuplicateConflict {
  field: keyof ScholarSearchResult;
  values: Array<{
    value: any;
    source: string;
    confidence: number;
  }>;
  suggestedResolution: any;
}

export class DuplicateDetectionEngine {
  private options: DuplicateDetectionOptions;

  constructor(options: Partial<DuplicateDetectionOptions> = {}) {
    this.options = {
      titleSimilarityThreshold: 0.85,
      authorSimilarityThreshold: 0.8,
      enableFuzzyMatching: true,
      strictDOIMatching: true,
      mergeStrategy: 'keep_highest_quality',
      ...options
    };
  }

  /**
   * Detect duplicate groups in search results
   */
  detectDuplicates(results: ScholarSearchResult[]): DuplicateGroup[] {
    const duplicateGroups: DuplicateGroup[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < results.length; i++) {
      if (processed.has(i)) continue;

      const primary = results[i];
      const duplicates: ScholarSearchResult[] = [];
      let mergeStrategy: DuplicateGroup['mergeStrategy'] = 'fuzzy_match';
      let maxConfidence = 0;

      for (let j = i + 1; j < results.length; j++) {
        if (processed.has(j)) continue;

        const candidate = results[j];
        const duplicateResult = this.areDuplicates(primary, candidate);

        if (duplicateResult.isDuplicate) {
          duplicates.push(candidate);
          processed.add(j);
          
          if (duplicateResult.confidence > maxConfidence) {
            maxConfidence = duplicateResult.confidence;
            mergeStrategy = duplicateResult.strategy;
          }
        }
      }

      if (duplicates.length > 0) {
        duplicateGroups.push({
          primary,
          duplicates,
          confidence: maxConfidence,
          mergeStrategy
        });
        processed.add(i);
      }
    }

    return duplicateGroups;
  }

  /**
   * Check if two results are duplicates
   */
  private areDuplicates(result1: ScholarSearchResult, result2: ScholarSearchResult): {
    isDuplicate: boolean;
    confidence: number;
    strategy: DuplicateGroup['mergeStrategy'];
  } {
    // 1. DOI matching (highest confidence)
    if (result1.doi && result2.doi) {
      const doi1 = this.normalizeDOI(result1.doi);
      const doi2 = this.normalizeDOI(result2.doi);
      
      if (doi1 === doi2) {
        return {
          isDuplicate: true,
          confidence: 1.0,
          strategy: 'doi'
        };
      }
    }

    // 2. URL matching (high confidence)
    if (result1.url && result2.url) {
      const url1 = this.normalizeURL(result1.url);
      const url2 = this.normalizeURL(result2.url);
      
      if (url1 === url2) {
        return {
          isDuplicate: true,
          confidence: 0.95,
          strategy: 'url'
        };
      }
    }

    // 3. Title and author matching
    const titleSimilarity = this.calculateTitleSimilarity(result1.title, result2.title);
    const authorSimilarity = this.calculateAuthorSimilarity(result1.authors, result2.authors);



    if (titleSimilarity >= this.options.titleSimilarityThreshold && 
        authorSimilarity >= this.options.authorSimilarityThreshold) {
      const confidence = (titleSimilarity + authorSimilarity) / 2;
      return {
        isDuplicate: true,
        confidence,
        strategy: 'title_author'
      };
    }

    // 4. Fuzzy matching (if enabled)
    if (this.options.enableFuzzyMatching) {
      const fuzzyScore = this.calculateFuzzyMatchScore(result1, result2);
      if (fuzzyScore >= 0.8) { // Lower threshold for fuzzy matching
        return {
          isDuplicate: true,
          confidence: fuzzyScore,
          strategy: 'fuzzy_match'
        };
      }
    }

    return {
      isDuplicate: false,
      confidence: 0,
      strategy: 'fuzzy_match'
    };
  }

  /**
   * Merge duplicate results into a single result
   */
  mergeDuplicates(group: DuplicateGroup): MergedResult {
    const allResults = [group.primary, ...group.duplicates];
    const conflicts: DuplicateConflict[] = [];
    
    // Start with the primary result as base
    const merged: MergedResult = {
      ...group.primary,
      mergedFrom: allResults.map((r, i) => `result_${i}`),
      mergeConfidence: group.confidence,
      conflictingFields: []
    };

    // Merge fields based on strategy
    switch (this.options.mergeStrategy) {
      case 'keep_highest_quality':
        this.mergeByQuality(merged, allResults, conflicts);
        break;
      case 'keep_most_complete':
        this.mergeByCompleteness(merged, allResults, conflicts);
        break;
      case 'manual_review':
        this.identifyConflicts(merged, allResults, conflicts);
        break;
    }

    // Store conflicting fields for UI resolution
    merged.conflictingFields = conflicts.map(c => c.field as string);

    return merged;
  }

  /**
   * Merge by selecting highest quality values
   */
  private mergeByQuality(merged: MergedResult, results: ScholarSearchResult[], conflicts: DuplicateConflict[]): void {
    // DOI: prefer non-empty, valid DOI
    const validDOIs = results.filter(r => r.doi && this.isValidDOI(r.doi));
    if (validDOIs.length > 0) {
      merged.doi = validDOIs[0].doi;
    }

    // Citations: use highest count
    const citationCounts = results.map(r => r.citations || 0);
    merged.citations = Math.max(...citationCounts);

    // Year: prefer most recent if reasonable, otherwise most common
    const years = results.filter(r => r.year).map(r => r.year!);
    if (years.length > 0) {
      merged.year = this.selectBestYear(years);
    }

    // Abstract: prefer longest non-empty abstract
    const abstracts = results.filter(r => r.abstract && r.abstract.trim().length > 0);
    if (abstracts.length > 0) {
      merged.abstract = abstracts.reduce((longest, current) => 
        current.abstract!.length > longest.abstract!.length ? current : longest
      ).abstract;
    }

    // Journal: prefer non-empty journal names
    const journals = results.filter(r => r.journal && r.journal.trim().length > 0);
    if (journals.length > 0) {
      merged.journal = journals[0].journal;
    }

    // Authors: merge and deduplicate
    merged.authors = this.mergeAuthors(results.map(r => r.authors));

    // Keywords: merge and deduplicate
    const allKeywords = results.flatMap(r => r.keywords || []);
    merged.keywords = [...new Set(allKeywords)];

    // Confidence and relevance: use weighted average
    const confidences = results.map(r => r.confidence);
    const relevanceScores = results.map(r => r.relevance_score);
    
    merged.confidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    merged.relevance_score = relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length;
  }

  /**
   * Merge by selecting most complete values
   */
  private mergeByCompleteness(merged: MergedResult, results: ScholarSearchResult[], conflicts: DuplicateConflict[]): void {
    // For each field, prefer the most complete (non-empty) value
    const fields: (keyof ScholarSearchResult)[] = [
      'doi', 'url', 'abstract', 'journal', 'year', 'citations', 'keywords'
    ];

    for (const field of fields) {
      const nonEmptyValues = results
        .map(r => r[field])
        .filter(value => value !== undefined && value !== null && value !== '');

      if (nonEmptyValues.length > 0) {
        if (field === 'keywords' && Array.isArray(nonEmptyValues[0])) {
          // Merge arrays
          const allKeywords = nonEmptyValues.flat() as string[];
          (merged as any)[field] = [...new Set(allKeywords)];
        } else if (field === 'citations') {
          // Use highest citation count
          (merged as any)[field] = Math.max(...(nonEmptyValues as number[]));
        } else {
          // Use first non-empty value
          (merged as any)[field] = nonEmptyValues[0];
        }
      }
    }

    // Special handling for authors
    merged.authors = this.mergeAuthors(results.map(r => r.authors));
  }

  /**
   * Identify conflicts for manual review
   */
  private identifyConflicts(merged: MergedResult, results: ScholarSearchResult[], conflicts: DuplicateConflict[]): void {
    const fields: (keyof ScholarSearchResult)[] = [
      'title', 'authors', 'journal', 'year', 'doi', 'url', 'abstract', 'citations'
    ];

    for (const field of fields) {
      const values = results.map((r, i) => ({
        value: r[field],
        source: `result_${i}`,
        confidence: r.confidence
      })).filter(v => v.value !== undefined && v.value !== null);

      if (values.length > 1) {
        const uniqueValues = this.getUniqueValues(values, field);
        
        if (uniqueValues.length > 1) {
          conflicts.push({
            field,
            values: uniqueValues,
            suggestedResolution: this.suggestResolution(uniqueValues, field)
          });
        }
      }
    }
  }

  /**
   * Calculate title similarity using string similarity
   */
  private calculateTitleSimilarity(title1: string, title2: string): number {
    const normalized1 = this.normalizeTitle(title1);
    const normalized2 = this.normalizeTitle(title2);
    
    if (normalized1 === normalized2) {
      return 1.0;
    }
    
    return calculateStringSimilarity(normalized1, normalized2);
  }

  /**
   * Calculate author similarity
   */
  private calculateAuthorSimilarity(authors1: string[], authors2: string[]): number {
    if (authors1.length === 0 || authors2.length === 0) {
      return authors1.length === authors2.length ? 1.0 : 0.5;
    }

    const normalized1 = authors1.map(a => this.normalizeAuthor(a));
    const normalized2 = authors2.map(a => this.normalizeAuthor(a));

    // Calculate Jaccard similarity
    const set1 = new Set(normalized1);
    const set2 = new Set(normalized2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate fuzzy match score considering multiple factors
   */
  private calculateFuzzyMatchScore(result1: ScholarSearchResult, result2: ScholarSearchResult): number {
    const titleSim = this.calculateTitleSimilarity(result1.title, result2.title);
    const authorSim = this.calculateAuthorSimilarity(result1.authors, result2.authors);
    
    // Year similarity (closer years get higher scores)
    let yearSim = 1.0;
    if (result1.year && result2.year) {
      const yearDiff = Math.abs(result1.year - result2.year);
      yearSim = Math.max(0, 1 - (yearDiff / 5)); // 5-year tolerance
    }

    // Journal similarity
    let journalSim = 0.5; // neutral if one is missing
    if (result1.journal && result2.journal) {
      journalSim = calculateStringSimilarity(
        result1.journal.toLowerCase(),
        result2.journal.toLowerCase()
      );
    }

    // Weighted combination
    return (titleSim * 0.4) + (authorSim * 0.3) + (yearSim * 0.2) + (journalSim * 0.1);
  }

  /**
   * Normalize DOI for comparison
   */
  private normalizeDOI(doi: string): string {
    return doi.toLowerCase()
      .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
      .replace(/^doi:/, '')
      .trim();
  }

  /**
   * Normalize URL for comparison
   */
  private normalizeURL(url: string): string {
    return url.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .replace(/www\./, '');
  }

  /**
   * Normalize title for comparison
   */
  private normalizeTitle(title: string): string {
    return title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize author name for comparison
   */
  private normalizeAuthor(author: string): string {
    return author.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Validate DOI format
   */
  private isValidDOI(doi: string): boolean {
    const doiPattern = /^10\.\d{4,}\/[^\s]+$/;
    const normalizedDOI = this.normalizeDOI(doi);
    return doiPattern.test(normalizedDOI);
  }

  /**
   * Select best year from multiple options
   */
  private selectBestYear(years: number[]): number {
    const currentYear = new Date().getFullYear();
    const validYears = years.filter(y => y >= 1900 && y <= currentYear + 1);
    
    if (validYears.length === 0) return years[0];
    if (validYears.length === 1) return validYears[0];

    // Return most common year, or most recent if all different
    const yearCounts = validYears.reduce((acc, year) => {
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const maxCount = Math.max(...Object.values(yearCounts));
    const mostCommonYears = Object.keys(yearCounts)
      .filter(year => yearCounts[parseInt(year)] === maxCount)
      .map(year => parseInt(year));

    return Math.max(...mostCommonYears);
  }

  /**
   * Merge author arrays, removing duplicates
   */
  private mergeAuthors(authorArrays: string[][]): string[] {
    const allAuthors = authorArrays.flat();
    const normalizedAuthors = new Map<string, string>();

    for (const author of allAuthors) {
      if (author && author.trim()) {
        const normalized = this.normalizeAuthor(author);
        if (!normalizedAuthors.has(normalized)) {
          normalizedAuthors.set(normalized, author);
        }
      }
    }

    return Array.from(normalizedAuthors.values());
  }

  /**
   * Get unique values for conflict resolution
   */
  private getUniqueValues(values: Array<{value: any; source: string; confidence: number}>, field: keyof ScholarSearchResult): Array<{value: any; source: string; confidence: number}> {
    const uniqueMap = new Map<string, {value: any; source: string; confidence: number}>();

    for (const item of values) {
      const key = this.getValueKey(item.value, field);
      if (!uniqueMap.has(key) || uniqueMap.get(key)!.confidence < item.confidence) {
        uniqueMap.set(key, item);
      }
    }

    return Array.from(uniqueMap.values());
  }

  /**
   * Generate a key for value comparison
   */
  private getValueKey(value: any, field: keyof ScholarSearchResult): string {
    if (Array.isArray(value)) {
      return JSON.stringify(value.sort());
    }
    if (typeof value === 'string') {
      return field === 'title' ? this.normalizeTitle(value) : value.toLowerCase();
    }
    return String(value);
  }

  /**
   * Suggest resolution for conflicting values
   */
  private suggestResolution(values: Array<{value: any; source: string; confidence: number}>, field: keyof ScholarSearchResult): any {
    // Sort by confidence, highest first
    const sorted = values.sort((a, b) => b.confidence - a.confidence);
    
    // For most fields, suggest highest confidence value
    if (field === 'citations') {
      // For citations, suggest highest number
      return Math.max(...values.map(v => v.value as number));
    }
    
    if (field === 'authors' || field === 'keywords') {
      // For arrays, suggest merged unique values
      const allValues = values.flatMap(v => v.value as string[]);
      return [...new Set(allValues)];
    }

    return sorted[0].value;
  }

  /**
   * Remove duplicates from search results
   */
  removeDuplicates(results: ScholarSearchResult[]): ScholarSearchResult[] {
    const duplicateGroups = this.detectDuplicates(results);
    const mergedResults: ScholarSearchResult[] = [];
    const processedIndices = new Set<number>();

    // Add merged results
    for (const group of duplicateGroups) {
      const merged = this.mergeDuplicates(group);
      mergedResults.push(merged);
      
      // Mark all results in this group as processed
      const allResults = [group.primary, ...group.duplicates];
      for (const result of allResults) {
        const index = results.indexOf(result);
        if (index !== -1) {
          processedIndices.add(index);
        }
      }
    }

    // Add non-duplicate results
    for (let i = 0; i < results.length; i++) {
      if (!processedIndices.has(i)) {
        mergedResults.push(results[i]);
      }
    }

    return mergedResults;
  }
}