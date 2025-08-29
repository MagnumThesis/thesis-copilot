/**
 * Unit tests for TitleFormatter
 */

import { describe, it, expect } from 'vitest';
import { TitleFormatter } from '../title-formatter';

describe('TitleFormatter', () => {
  const sampleTitle = 'The Impact of Climate Change on Marine Ecosystems';
  const journalTitle = 'Journal of Environmental Science';
  const longTitle = 'This Is a Very Long Title That Should Be Truncated When Creating Short Titles for Inline Citations';

  describe('formatMLA', () => {
    it('should format article title in quotes', () => {
      const result = TitleFormatter.formatMLA(sampleTitle, false);
      expect(result).toBe('"The Impact of Climate Change on Marine Ecosystems"');
    });

    it('should format journal title in italics', () => {
      const result = TitleFormatter.formatMLA(journalTitle, true);
      expect(result).toBe('*Journal of Environmental Science*');
    });

    it('should return empty string for empty title', () => {
      const result = TitleFormatter.formatMLA('', false);
      expect(result).toBe('');
    });
  });

  describe('formatChicago', () => {
    it('should format article title in quotes', () => {
      const result = TitleFormatter.formatChicago(sampleTitle, false);
      expect(result).toBe('"The Impact of Climate Change on Marine Ecosystems"');
    });

    it('should format journal title in italics', () => {
      const result = TitleFormatter.formatChicago(journalTitle, true);
      expect(result).toBe('*Journal of Environmental Science*');
    });
  });

  describe('formatHarvard', () => {
    it('should format article title in single quotes', () => {
      const result = TitleFormatter.formatHarvard(sampleTitle, false);
      expect(result).toBe("'The Impact of Climate Change on Marine Ecosystems'");
    });

    it('should format journal title in italics', () => {
      const result = TitleFormatter.formatHarvard(journalTitle, true);
      expect(result).toBe('*Journal of Environmental Science*');
    });
  });

  describe('formatAPA', () => {
    it('should format article title in sentence case', () => {
      const result = TitleFormatter.formatAPA(sampleTitle, false);
      expect(result).toBe('The impact of climate change on marine ecosystems');
    });

    it('should format journal title in italics (preserving title case)', () => {
      const result = TitleFormatter.formatAPA(journalTitle, true);
      expect(result).toBe('*Journal of Environmental Science*');
    });

    it('should handle title with colon correctly', () => {
      const titleWithColon = 'Climate Change: A Global Perspective on Environmental Impact';
      const result = TitleFormatter.formatAPA(titleWithColon, false);
      expect(result).toBe('Climate change: A global perspective on environmental impact');
    });
  });

  describe('toSentenceCase', () => {
    it('should convert to sentence case', () => {
      const result = TitleFormatter.toSentenceCase('THE IMPACT OF CLIMATE CHANGE');
      expect(result).toBe('The impact of climate change');
    });

    it('should handle titles with colons', () => {
      const titleWithColon = 'Climate Change: A Global Crisis';
      const result = TitleFormatter.toSentenceCase(titleWithColon);
      expect(result).toBe('Climate change: A global crisis');
    });

    it('should handle empty string', () => {
      const result = TitleFormatter.toSentenceCase('');
      expect(result).toBe('');
    });

    it('should handle single word', () => {
      const result = TitleFormatter.toSentenceCase('CLIMATE');
      expect(result).toBe('Climate');
    });
  });

  describe('toTitleCase', () => {
    it('should convert to title case', () => {
      const result = TitleFormatter.toTitleCase('the impact of climate change on marine ecosystems');
      expect(result).toBe('The Impact of Climate Change on Marine Ecosystems');
    });

    it('should not capitalize minor words in the middle', () => {
      const result = TitleFormatter.toTitleCase('a study of climate change and its effects');
      expect(result).toBe('A Study of Climate Change and Its Effects');
    });

    it('should capitalize minor words at the beginning and end', () => {
      const result = TitleFormatter.toTitleCase('of mice and men');
      expect(result).toBe('Of Mice and Men');
    });

    it('should handle empty string', () => {
      const result = TitleFormatter.toTitleCase('');
      expect(result).toBe('');
    });

    it('should handle single word', () => {
      const result = TitleFormatter.toTitleCase('climate');
      expect(result).toBe('Climate');
    });
  });

  describe('createShortTitle', () => {
    it('should return full title if under max length', () => {
      const shortTitle = 'Short Title';
      const result = TitleFormatter.createShortTitle(shortTitle, 50);
      expect(result).toBe('Short Title');
    });

    it('should truncate long title with ellipsis', () => {
      const result = TitleFormatter.createShortTitle(longTitle, 50);
      expect(result).toContain('...');
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('should truncate at word boundary when possible', () => {
      const result = TitleFormatter.createShortTitle(longTitle, 30);
      // Should truncate and add ellipsis
      expect(result).toContain('...');
      expect(result.length).toBeLessThanOrEqual(30);
    });

    it('should use default max length of 50', () => {
      const result = TitleFormatter.createShortTitle(longTitle);
      expect(result).toContain('...');
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('should handle empty string', () => {
      const result = TitleFormatter.createShortTitle('');
      expect(result).toBe('');
    });

    it('should handle very short max length', () => {
      const result = TitleFormatter.createShortTitle('Hello World', 5);
      expect(result).toBe('He...');
    });
  });

  describe('formatPages', () => {
    it('should format single page for APA', () => {
      const result = TitleFormatter.formatPages('123', 'apa');
      expect(result).toBe('p. 123');
    });

    it('should format page range for APA', () => {
      const result = TitleFormatter.formatPages('123-145', 'apa');
      expect(result).toBe('pp. 123-145');
    });

    it('should format page range with en dash for APA', () => {
      const result = TitleFormatter.formatPages('123–145', 'apa');
      expect(result).toBe('pp. 123–145');
    });

    it('should format single page for Harvard', () => {
      const result = TitleFormatter.formatPages('123', 'harvard');
      expect(result).toBe('p. 123');
    });

    it('should format page range for Harvard', () => {
      const result = TitleFormatter.formatPages('123-145', 'harvard');
      expect(result).toBe('pp. 123-145');
    });

    it('should format pages for MLA (plain)', () => {
      const result = TitleFormatter.formatPages('123-145', 'mla');
      expect(result).toBe('123-145');
    });

    it('should format pages for Chicago (plain)', () => {
      const result = TitleFormatter.formatPages('123-145', 'chicago');
      expect(result).toBe('123-145');
    });

    it('should return empty string for undefined pages', () => {
      const result = TitleFormatter.formatPages(undefined, 'apa');
      expect(result).toBe('');
    });

    it('should use default APA style', () => {
      const result = TitleFormatter.formatPages('123');
      expect(result).toBe('p. 123');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined title in formatMLA', () => {
      const result = TitleFormatter.formatMLA(undefined as any, false);
      expect(result).toBe('');
    });

    it('should handle very long title in createShortTitle', () => {
      const veryLongTitle = 'A'.repeat(200);
      const result = TitleFormatter.createShortTitle(veryLongTitle, 20);
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result).toContain('...');
    });

    it('should handle title with only spaces', () => {
      const result = TitleFormatter.toTitleCase('   ');
      expect(result).toBe('   ');
    });

    it('should handle complex page ranges', () => {
      const result = TitleFormatter.formatPages('123-145, 200-210', 'apa');
      expect(result).toBe('pp. 123-145, 200-210');
    });
  });
});
