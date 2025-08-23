import { describe, it, expect } from 'vitest';
import { GoogleScholarClient } from '../worker/lib/google-scholar-client';

describe('Google Scholar HTML Parser', () => {
  let client: GoogleScholarClient;

  beforeEach(() => {
    client = new GoogleScholarClient();
  });

  describe('Title Extraction', () => {
    it('should extract titles from standard Google Scholar format', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="https://example.com/paper">Machine Learning in Natural Language Processing</a>
            </h3>
            <div class="gs_a">Smith, J. - Journal of AI, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Machine Learning in Natural Language Processing');
    });

    it('should extract titles with HTML entities', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Title with &amp; HTML &lt;entities&gt; &quot;quotes&quot; &#39;apostrophes&#39;</a>
            </h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].title).toBe('Title with & HTML <entities> "quotes" \'apostrophes\'');
    });

    it('should handle titles with nested HTML tags', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Title with <em>emphasis</em> and <strong>bold</strong> text</a>
            </h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].title).toBe('Title with emphasis and bold text');
    });

    it('should handle alternative title formats', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3><a href="#">Simple Format Title</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
          </div>
        </div>
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <a href="#" class="gs_rt">Direct Link Title</a>
            <div class="gs_a">Author, B. - Journal, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Simple Format Title');
      expect(results[1].title).toBe('Direct Link Title');
    });
  });

  describe('Author Extraction', () => {
    it('should extract multiple authors correctly', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Smith, J., Johnson, A., Williams, B. - Journal of Science, 2023 - example.com</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].authors).toEqual(['Smith, J.', 'Johnson, A.', 'Williams, B.']);
    });

    it('should handle authors with complex names', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Van Der Berg, J.P., O'Connor, M.A., Smith-Jones, K. - Journal, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      // The current implementation splits by comma, so these will be separate entries
      expect(results[0].authors).toContain('Van Der Berg, J.P.');
      expect(results[0].authors).toContain('O\'Connor, M.A.');
      expect(results[0].authors).toContain('Smith-Jones, K.');
    });

    it('should handle single author', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Single Author - Journal of Research, 2023 - domain.com</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].authors).toEqual(['Single Author']);
    });

    it('should handle authors with initials', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Smith, J, Johnson, A.B, Williams, C.D.E - Journal, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].authors).toContain('Smith, J');
      expect(results[0].authors).toContain('Johnson, A.B');
      expect(results[0].authors).toContain('Williams, C.D.E');
    });

    it('should filter out non-author content', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Smith, J., 123, Johnson, A. - Journal, 2023 - domain.com</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].authors).not.toContain('123');
      expect(results[0].authors).toContain('Smith, J.');
      expect(results[0].authors).toContain('Johnson, A.');
    });
  });

  describe('Journal Extraction', () => {
    it('should extract journal names correctly', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Nature Machine Intelligence, 2023 - nature.com</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].journal).toBe('Nature Machine Intelligence');
    });

    it('should handle conference proceedings', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Proceedings of the 2023 Conference on AI, 2023 - acm.org</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].journal).toBe('Proceedings of the 2023 Conference on AI');
    });

    it('should handle journal names with special characters', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - IEEE Transactions on Pattern Analysis & Machine Intelligence, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].journal).toBe('IEEE Transactions on Pattern Analysis & Machine Intelligence');
    });

    it('should handle missing journal information', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - 2023 - domain.com</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].journal).toBeUndefined();
    });
  });

  describe('Year Extraction', () => {
    it('should extract publication years correctly', () => {
      const testCases = [
        { html: 'Author, A. - Journal, 2023 - domain.com', expected: 2023 },
        { html: 'Author, A. - Journal, 1995 - domain.com', expected: 1995 },
        { html: 'Author, A. - Journal, 2024 - domain.com', expected: 2024 },
      ];

      testCases.forEach(({ html: authorInfo, expected }) => {
        const html = `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
              <div class="gs_a">${authorInfo}</div>
            </div>
          </div>
        `;

        const results = client.parseResults(html);
        expect(results[0].year).toBe(expected);
      });
    });

    it('should handle invalid years', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, 1800 - domain.com</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].year).toBeUndefined();
    });

    it('should handle future years within reasonable bounds', () => {
      const nextYear = new Date().getFullYear() + 1;
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, ${nextYear} - domain.com</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].year).toBe(nextYear);
    });

    it('should reject unreasonable future years', () => {
      const farFuture = new Date().getFullYear() + 10;
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, ${farFuture} - domain.com</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].year).toBeUndefined();
    });
  });

  describe('Citation Count Extraction', () => {
    it('should extract citation counts from various formats', () => {
      const testCases = [
        { pattern: 'Cited by 123', expected: 123 },
        { pattern: 'Citations: 456', expected: 456 },
        { pattern: 'cited by 789', expected: 789 },
        { pattern: 'CITED BY 999', expected: 999 },
      ];

      testCases.forEach(({ pattern, expected }) => {
        const html = `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
              <div class="gs_a">Author, A. - Journal, 2023</div>
              <div class="gs_fl">${pattern}</div>
            </div>
          </div>
        `;

        const results = client.parseResults(html);
        expect(results[0].citations).toBe(expected);
      });
    });

    it('should handle zero citations', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
            <div class="gs_fl">Cited by 0</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].citations).toBe(0);
    });

    it('should handle missing citation information', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].citations).toBeUndefined();
    });

    it('should handle large citation counts', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
            <div class="gs_fl">Cited by 12345</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].citations).toBe(12345);
    });
  });

  describe('DOI Extraction and Validation', () => {
    it('should extract DOIs from URLs', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="https://doi.org/10.1038/s41586-023-06004-9">Test Paper</a>
            </h3>
            <div class="gs_a">Author, A. - Nature, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].doi).toBe('10.1038/s41586-023-06004-9');
    });

    it('should extract DOIs from text content', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
            <span class="gs_rs">Abstract text with DOI: 10.1109/TPAMI.2023.1234567</span>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].doi).toBe('10.1109/TPAMI.2023.1234567');
    });

    it('should validate DOI format', () => {
      const validDOIs = [
        '10.1038/nature12373',
        '10.1109/TPAMI.2023.1234567',
        '10.1145/3394486.3403043',
        '10.48550/arXiv.2301.07041',
        '10.1000/182'
      ];

      validDOIs.forEach(doi => {
        const html = `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://doi.org/${doi}">Test Paper</a>
              </h3>
              <div class="gs_a">Author, A. - Journal, 2023</div>
            </div>
          </div>
        `;

        const results = client.parseResults(html);
        expect(results[0].doi).toBe(doi);
      });
    });

    it('should handle multiple DOI formats in content', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
            <span class="gs_rs">
              This paper references DOI:10.1038/nature12373 and also mentions 
              https://doi.org/10.1109/TPAMI.2023.1234567 in the text.
            </span>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      // Should extract the first valid DOI found
      expect(results[0].doi).toMatch(/^10\.\d+\/.+/);
    });

    it('should handle missing DOI gracefully', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].doi).toBeUndefined();
    });
  });

  describe('Abstract Extraction', () => {
    it('should extract abstracts from gs_rs spans', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
            <span class="gs_rs">
              This is a comprehensive study that explores the applications of machine learning 
              in natural language processing tasks, with particular focus on transformer architectures.
            </span>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].abstract).toContain('comprehensive study');
      expect(results[0].abstract).toContain('machine learning');
      expect(results[0].abstract).toContain('transformer architectures');
    });

    it('should extract abstracts from gs_rs divs', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
            <div class="gs_rs">
              Abstract content in a div element instead of span.
            </div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].abstract).toBe('Abstract content in a div element instead of span.');
    });

    it('should clean HTML from abstracts', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
            <span class="gs_rs">
              Abstract with <em>emphasis</em> and <strong>bold</strong> text, 
              plus &amp; HTML entities &lt;like&gt; these.
            </span>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].abstract).toBe('Abstract with emphasis and bold text, plus & HTML entities <like> these.');
    });

    it('should handle missing abstracts', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].abstract).toBeUndefined();
    });

    it('should filter out very short abstracts', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
            <span class="gs_rs">Short</span>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].abstract).toBeUndefined();
    });

    it('should handle abstracts with line breaks and whitespace', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
            <span class="gs_rs">
              
              This abstract has    multiple   spaces
              and line breaks that should be normalized.
              
            </span>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].abstract).toBe('This abstract has multiple spaces and line breaks that should be normalized.');
    });
  });

  describe('URL Extraction', () => {
    it('should extract direct URLs', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="https://example.com/paper.pdf">Test Paper</a>
            </h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].url).toBe('https://example.com/paper.pdf');
    });

    it('should handle Google Scholar redirect URLs', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="/scholar_url?url=https%3A//example.com/paper.pdf&hl=en">Test Paper</a>
            </h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].url).toBe('https://example.com/paper.pdf');
    });

    it('should handle malformed redirect URLs', () => {
      const html = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="/scholar_url?invalid=format">Test Paper</a>
            </h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(html);
      expect(results[0].url).toBe('/scholar_url?invalid=format');
    });
  });

  describe('Confidence and Relevance Scoring', () => {
    it('should calculate confidence based on available metadata', () => {
      const completeHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Complete Paper with All Metadata</a></h3>
            <div class="gs_a">Smith, J., Johnson, A. - Nature Machine Intelligence, 2023</div>
            <span class="gs_rs">Comprehensive abstract with detailed information about the research.</span>
            <div class="gs_fl">Cited by 123</div>
          </div>
        </div>
      `;

      const minimalHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Minimal Paper Title</a></h3>
            <div class="gs_a">Author Name - 2023</div>
          </div>
        </div>
      `;

      const completeResults = client.parseResults(completeHtml);
      const minimalResults = client.parseResults(minimalHtml);

      expect(completeResults).toHaveLength(1);
      expect(minimalResults).toHaveLength(1);
      expect(completeResults[0]).toBeDefined();
      expect(minimalResults[0]).toBeDefined();
      expect(completeResults[0].confidence).toBeGreaterThan(minimalResults[0].confidence);
      expect(completeResults[0].confidence).toBeGreaterThan(0.5);
      expect(minimalResults[0].confidence).toBeLessThan(0.8);
    });

    it('should calculate relevance score based on content quality', () => {
      const detailedHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Detailed Research Paper on Advanced Machine Learning Techniques</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
            <span class="gs_rs">
              This comprehensive research paper presents novel approaches to machine learning 
              with extensive experimental validation and theoretical analysis of the proposed methods.
            </span>
          </div>
        </div>
      `;

      const basicHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Short Title</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
          </div>
        </div>
      `;

      const detailedResults = client.parseResults(detailedHtml);
      const basicResults = client.parseResults(basicHtml);

      expect(detailedResults[0].relevance_score).toBeGreaterThan(basicResults[0].relevance_score);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle completely malformed HTML', () => {
      const malformedHtml = '<div><incomplete><html>structure';
      const results = client.parseResults(malformedHtml);
      expect(results).toEqual([]);
    });

    it('should handle empty result blocks', () => {
      const emptyHtml = `
        <div class="gs_r gs_or gs_scl">
        </div>
      `;
      const results = client.parseResults(emptyHtml);
      expect(results).toEqual([]);
    });

    it('should handle results with only title but no authors', () => {
      const titleOnlyHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Title Only Paper</a></h3>
          </div>
        </div>
      `;
      const results = client.parseResults(titleOnlyHtml);
      expect(results).toEqual([]);
    });

    it('should handle Unicode characters in content', () => {
      const unicodeHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Título con caracteres especiales: αβγ 中文 العربية</a></h3>
            <div class="gs_a">García, J.M., Müller, K. - Revista Científica, 2023</div>
            <span class="gs_rs">Resumen con caracteres Unicode: ñáéíóú çüß</span>
          </div>
        </div>
      `;

      const results = client.parseResults(unicodeHtml);
      expect(results[0].title).toContain('αβγ 中文 العربية');
      // The current parsing splits by comma, so these will be separate entries
      expect(results[0].authors).toContain('García');
      expect(results[0].authors).toContain('J.M.');
      expect(results[0].authors).toContain('Müller');
      expect(results[0].authors).toContain('K.');
      expect(results[0].abstract).toContain('ñáéíóú çüß');
    });

    it('should handle very long content gracefully', () => {
      const longTitle = 'A'.repeat(500);
      const longAbstract = 'This is a very long abstract. ' + 'B'.repeat(1000);
      
      const longContentHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">${longTitle}</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
            <span class="gs_rs">${longAbstract}</span>
          </div>
        </div>
      `;

      const results = client.parseResults(longContentHtml);
      expect(results[0].title).toBe(longTitle);
      expect(results[0].abstract).toBe(longAbstract);
    });

    it('should handle mixed valid and invalid results', () => {
      const mixedHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Valid Paper</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
          </div>
        </div>
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Invalid Paper</a></h3>
            <!-- Missing authors -->
          </div>
        </div>
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Another Valid Paper</a></h3>
            <div class="gs_a">Author, B. - Journal, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(mixedHtml);
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Valid Paper');
      expect(results[1].title).toBe('Another Valid Paper');
    });
  });
});