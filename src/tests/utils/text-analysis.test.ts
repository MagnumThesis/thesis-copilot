import { describe, it, expect } from 'vitest';
import {
  analyzeText,
  extractKeywords,
  extractKeyPhrases,
  extractTopics,
  generateSearchQuery
} from '@/utils/text-analysis';
import { ExtractedContent } from '@/lib/ai-types';

describe('text-analysis utils', () => {
  describe('analyzeText', () => {
    it('should correctly analyze standard academic text', () => {
      const text = 'The research study provides a comprehensive analysis of the system development. This process is beneficial.';
      const result = analyzeText(text);

      expect(result.content).toBe('The research study provides a comprehensive analysis of the system development. This process is beneficial.');
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.sentenceCount).toBe(2);
      expect(result.keywords).toContain('research');
      expect(result.topics).toContain('research');
      expect(result.sentiment).toBeGreaterThanOrEqual(0);
      expect(result.sentiment).toBeLessThanOrEqual(1);
      expect(result.readabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.readabilityScore).toBeLessThanOrEqual(1);
    });

    it('should handle empty string', () => {
      const result = analyzeText('');
      expect(result.content).toBe('');
      expect(result.wordCount).toBe(0);
      expect(result.sentenceCount).toBe(0);
      expect(result.keywords).toEqual([]);
    });

    it('should handle text with only whitespace', () => {
      const result = analyzeText('   \n  \t ');
      expect(result.content).toBe('');
      expect(result.wordCount).toBe(0);
      expect(result.sentenceCount).toBe(0);
    });

    it('should handle text with only special characters', () => {
      // cleanText replaces non-word/non-space/non-punctuation with space,
      // but some characters like ! are preserved if they are in [^\w\s.,!?-] exclusion
      // Wait, [^\w\s.,!?-] means it keeps \w, \s, ., ,, !, ?, -
      const result = analyzeText('@#$%^&*()');
      expect(result.content).toBe('');
      expect(result.wordCount).toBe(0);
      expect(result.sentenceCount).toBe(0);
    });
  });

  describe('extractKeywords', () => {
    it('should filter out stop words', () => {
      const tokens = ['the', 'analysis', 'and', 'the', 'research', 'is', 'good'];
      const keywords = extractKeywords(tokens);

      expect(keywords).toContain('analysis');
      expect(keywords).toContain('research');
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('and');
      expect(keywords).not.toContain('is');
    });

    it('should sort by frequency', () => {
      const tokens = ['data', 'data', 'research', 'data', 'research', 'analysis'];
      const keywords = extractKeywords(tokens);

      expect(keywords[0]).toBe('data');
      expect(keywords[1]).toBe('research');
      expect(keywords[2]).toBe('analysis');
    });

    it('should limit to top 20 keywords', () => {
      const tokens = Array.from({ length: 30 }, (_, i) => `word${i}`);
      const keywords = extractKeywords(tokens);
      expect(keywords.length).toBeLessThanOrEqual(20);
    });
  });

  describe('extractKeyPhrases', () => {
    it('should extract meaningful bigrams and trigrams', () => {
      const text = 'Academic research methodology is essential for system development.';
      const phrases = extractKeyPhrases(text);

      expect(phrases).toContain('Academic research');
      expect(phrases).toContain('research methodology');
      expect(phrases).toContain('system development');
      expect(phrases).toContain('Academic research methodology');
    });

    it('should exclude phrases starting or ending with stop words', () => {
      const text = 'The research of the system';
      const phrases = extractKeyPhrases(text);

      // "The research", "research of", "of the", "the system" are potential bigrams
      // "The" and "of" are stop words.
      expect(phrases).not.toContain('The research');
      expect(phrases).not.toContain('research of');
      expect(phrases).not.toContain('of the');
      expect(phrases).not.toContain('the system');
    });
  });

  describe('extractTopics', () => {
    it('should identify specific academic terms', () => {
      const tokens = ['This', 'methodology', 'is', 'part', 'of', 'our', 'analysis'];
      const topics = extractTopics(tokens);

      expect(topics).toContain('methodology');
      expect(topics).toContain('analysis');
    });

    it('should identify noun-noun phrases', () => {
      const tokens = ['The', 'system', 'development', 'is', 'complete'];
      // 'system' and 'development' are both considered nouns by the heuristic
      const topics = extractTopics(tokens);

      expect(topics).toContain('system development');
    });
  });

  describe('generateSearchQuery', () => {
    it('should combine keywords and topics into an academic query', () => {
      const extractedContent: ExtractedContent = {
        keywords: ['quantum', 'computing', 'physics'],
        topics: ['quantum mechanics', 'analysis'],
        keyPhrases: ['quantum computing research'],
        confidence: 0.9
      };

      const query = generateSearchQuery(extractedContent);

      expect(query).toContain('"quantum"');
      expect(query).toContain('"computing"');
      expect(query).toContain('"physics"');
      expect(query).toContain('"quantum mechanics"');
      expect(query).toContain('"analysis"');
      expect(query).toContain(' AND ');
    });

    it('should include key phrases that contain keywords', () => {
      const extractedContent: ExtractedContent = {
        keywords: ['ai'],
        topics: ['technology'],
        keyPhrases: ['ai development', 'unrelated phrase'],
        confidence: 0.8
      };

      const query = generateSearchQuery(extractedContent);

      expect(query).toContain('"ai development"');
      expect(query).not.toContain('"unrelated phrase"');
    });

    it('should handle missing fields in ExtractedContent', () => {
      const extractedContent: ExtractedContent = {
        confidence: 0.5
      };

      const query = generateSearchQuery(extractedContent);
      expect(query).toBe('');
    });
  });
});
