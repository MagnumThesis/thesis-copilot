import { ExtractedContent } from '../lib/ai-types';

/**
 * Text Analysis Utilities for AI Searcher
 * Handles content analysis, keyword extraction, and topic identification
 */

export interface TextAnalysis {
  content: string;
  keywords: string[];
  keyPhrases: string[];
  topics: string[];
  sentiment: number; // 0-1 scale, 0.5 is neutral
  readabilityScore: number; // 0-1 scale
  wordCount: number;
  sentenceCount: number;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can'
]);

const ACADEMIC_TERMS = new Set([
  'research', 'study', 'analysis', 'methodology', 'results', 'conclusion',
  'theory', 'model', 'framework', 'approach', 'system', 'process',
  'development', 'implementation', 'evaluation', 'assessment'
]);

const POSITIVE_WORDS = new Set(['good', 'great', 'excellent', 'effective', 'successful', 'beneficial', 'positive']);
const NEGATIVE_WORDS = new Set(['bad', 'poor', 'ineffective', 'unsuccessful', 'harmful', 'negative', 'problematic']);

const COMMON_NOUNS = new Set([
  'research', 'study', 'analysis', 'method', 'system', 'model', 'theory',
  'process', 'development', 'implementation', 'evaluation', 'assessment',
  'approach', 'framework', 'result', 'conclusion', 'data', 'information'
]);

/**
 * Analyze text content and extract relevant information
 */
export function analyzeText(content: string): TextAnalysis {
  const cleanedContent = cleanText(content);
  const tokens = tokenize(cleanedContent);
  const sentences = cleanedContent.split(/[.!?]+/).filter(s => s.trim().length > 0);

  return {
    content: cleanedContent,
    keywords: extractKeywords(tokens),
    keyPhrases: extractKeyPhrases(cleanedContent),
    topics: extractTopics(tokens),
    sentiment: analyzeSentiment(cleanedContent),
    readabilityScore: calculateReadability(cleanedContent),
    wordCount: tokens.length,
    sentenceCount: sentences.length
  };
}

/**
 * Extract keywords from tokenized content
 */
export function extractKeywords(tokens: string[]): string[] {
  // Remove stop words
  const filteredTokens = tokens.filter(token => !STOP_WORDS.has(token.toLowerCase()));

  // Calculate term frequency
  const termFreq: Record<string, number> = {};
  filteredTokens.forEach(token => {
    const normalized = token.toLowerCase();
    termFreq[normalized] = (termFreq[normalized] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  return Object.entries(termFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([term]) => term);
}

/**
 * Extract key phrases using n-grams
 */
export function extractKeyPhrases(content: string): string[] {
  const tokens = tokenize(content);
  const phrases: string[] = [];

  // Extract bigrams
  for (let i = 0; i < tokens.length - 1; i++) {
    const firstWord = tokens[i].toLowerCase();
    const secondWord = tokens[i+1].toLowerCase();
    if (!STOP_WORDS.has(firstWord) && !STOP_WORDS.has(secondWord)) {
      phrases.push(`${tokens[i]} ${tokens[i + 1]}`);
    }
  }

  // Extract trigrams
  for (let i = 0; i < tokens.length - 2; i++) {
    const firstWord = tokens[i].toLowerCase();
    const lastWord = tokens[i+2].toLowerCase();
    if (!STOP_WORDS.has(firstWord) && !STOP_WORDS.has(lastWord)) {
      phrases.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
    }
  }

  return phrases.slice(0, 15);
}

/**
 * Extract topics from content
 */
export function extractTopics(tokens: string[]): string[] {
  // Simple topic extraction based on noun phrases and common academic terms
  const topics = new Set<string>();

  tokens.forEach((token, index) => {
    const lowerToken = token.toLowerCase();

    // Add academic terms
    if (ACADEMIC_TERMS.has(lowerToken)) {
      topics.add(token);
    }

    // Add potential noun phrases
    if (index < tokens.length - 1) {
      const nextToken = tokens[index + 1];
      if (isNoun(token) && isNoun(nextToken)) {
        topics.add(`${token} ${nextToken}`);
      }
    }
  });

  return Array.from(topics).slice(0, 10);
}

/**
 * Generate search query from extracted content
 */
export function generateSearchQuery(extractedContent: ExtractedContent): string {
  const { keywords, topics, keyPhrases } = extractedContent;

  // Combine keywords and topics, removing duplicates
  const searchTerms = [...new Set([...(keywords || []).slice(0, 5), ...(topics || []).slice(0, 3)])];

  // Add key phrases if they contain important terms
  const importantPhrases = (keyPhrases || []).filter(phrase =>
    phrase.split(' ').some(word => (keywords || []).includes(word.toLowerCase()))
  ).slice(0, 2);

  const allTerms = [...searchTerms, ...importantPhrases];

  // Join with appropriate operators for academic search
  return allTerms
    .map(term => `"${term}"`)
    .join(' AND ');
}

/**
 * Clean and normalize text content
 */
function cleanText(content: string): string {
  return content
    .replace(/\s+/g, ' ') // normalize whitespace
    .replace(/[^\w\s.,!?-]/g, ' ') // remove special characters
    .trim();
}

/**
 * Tokenize text into words
 */
function tokenize(content: string): string[] {
  return content
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length > 0);
}

/**
 * Analyze sentiment of content
 */
function analyzeSentiment(content: string): number {
  // Simple sentiment analysis using positive/negative word lists
  const tokens = tokenize(content.toLowerCase());
  let positiveCount = 0;
  let negativeCount = 0;

  tokens.forEach(token => {
    if (POSITIVE_WORDS.has(token)) positiveCount++;
    if (NEGATIVE_WORDS.has(token)) negativeCount++;
  });

  const total = positiveCount + negativeCount;
  if (total === 0) return 0.5;

  return (positiveCount / total + 1) / 2; // Scale to 0-1
}

/**
 * Calculate readability score
 */
function calculateReadability(content: string): number {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = tokenize(content);
  const avgWordsPerSentence = words.length / sentences.length;

  // Simple readability based on average sentence length
  // Shorter sentences are generally more readable
  const score = Math.max(0, 1 - (avgWordsPerSentence - 15) / 20);
  return Math.max(0, Math.min(1, score));
}

/**
 * Simple noun detection (basic implementation)
 */
function isNoun(word: string): boolean {
  // This is a very basic implementation
  // In a real-world scenario, you'd want to use a proper POS tagger
  return COMMON_NOUNS.has(word.toLowerCase()) ||
         word.length > 3; // Rough heuristic for proper nouns
}
