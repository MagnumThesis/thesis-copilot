/**
 * Academic Context Analyzer
 * Analyzes document content for academic structure, tone, and citation formats
 */

import { 
  AcademicContext, 
  ThesisStructure, 
  ThesisSection, 
  CitationFormat, 
  AcademicValidationResult 
} from '../../lib/ai-types';

export class AcademicContextAnalyzer {
  
  /**
   * Analyze document for academic context
   */
  static analyzeAcademicContext(content: string, conversationTitle: string): AcademicContext {
    const thesisStructure = this.analyzeThesisStructure(content);
    const citationFormat = this.detectCitationFormat(content);
    const academicTone = this.analyzeAcademicTone(content, conversationTitle);
    const keyTerms = this.extractKeyTerms(content);
    const researchMethodology = this.detectResearchMethodology(content);

    return {
      thesisStructure,
      citationFormat,
      academicTone,
      keyTerms,
      researchMethodology
    };
  }

  /**
   * Analyze thesis proposal structure
   */
  private static analyzeThesisStructure(content: string): ThesisStructure {
    const standardSections: ThesisSection[] = [
      { name: 'Abstract', level: 1, required: true, present: false },
      { name: 'Introduction', level: 1, required: true, present: false },
      { name: 'Literature Review', level: 1, required: true, present: false },
      { name: 'Methodology', level: 1, required: true, present: false },
      { name: 'Research Questions', level: 2, required: true, present: false },
      { name: 'Hypothesis', level: 2, required: false, present: false },
      { name: 'Expected Results', level: 1, required: false, present: false },
      { name: 'Timeline', level: 1, required: false, present: false },
      { name: 'References', level: 1, required: true, present: false },
      { name: 'Bibliography', level: 1, required: false, present: false }
    ];

    // Extract headings from content
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: { level: number; text: string }[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2].trim()
      });
    }

    // Check which standard sections are present
    standardSections.forEach(section => {
      const found = headings.some(heading => 
        heading.text.toLowerCase().includes(section.name.toLowerCase()) ||
        section.name.toLowerCase().includes(heading.text.toLowerCase())
      );
      section.present = found;
      if (found) {
        const matchingHeading = headings.find(h => 
          h.text.toLowerCase().includes(section.name.toLowerCase())
        );
        if (matchingHeading) {
          section.content = this.extractSectionContent(content, matchingHeading.text);
        }
      }
    });

    // Calculate completeness
    const requiredSections = standardSections.filter(s => s.required);
    const presentRequired = requiredSections.filter(s => s.present);
    const completeness = presentRequired.length / requiredSections.length;

    // Determine current section based on cursor position or last heading
    const currentSection = headings.length > 0 ? headings[headings.length - 1].text : undefined;

    return {
      sections: standardSections,
      currentSection,
      completeness
    };
  }

  /**
   * Detect citation format in document
   */
  private static detectCitationFormat(content: string): CitationFormat {
    const citationPatterns = {
      APA: [
        /\([A-Za-z]+,\s*\d{4}\)/g, // (Author, 2023)
        /\([A-Za-z]+\s*&\s*[A-Za-z]+,\s*\d{4}\)/g, // (Author & Author, 2023)
        /[A-Za-z]+\s*\(\d{4}\)/g // Author (2023)
      ],
      MLA: [
        /\([A-Za-z]+\s+\d+\)/g, // (Author 123)
        /[A-Za-z]+\s+\d+/g // Author 123
      ],
      Chicago: [
        /\^\d+/g, // ^1 (footnote style)
        /\(\d+\)/g // (1) (note style)
      ],
      Harvard: [
        /\([A-Za-z]+\s*\d{4}:\s*\d+\)/g, // (Author 2023: 123)
        /\([A-Za-z]+,\s*\d{4},\s*p\.\s*\d+\)/g // (Author, 2023, p. 123)
      ],
      IEEE: [
        /\[\d+\]/g, // [1]
        /\[\d+,\s*\d+\]/g // [1, 2]
      ]
    };

    let detectedStyle: CitationFormat['style'] = 'Unknown';
    let maxMatches = 0;
    const examples: string[] = [];

    Object.entries(citationPatterns).forEach(([style, patterns]) => {
      let totalMatches = 0;
      patterns.forEach(pattern => {
        const matches = content.match(pattern) || [];
        totalMatches += matches.length;
        if (matches.length > 0) {
          examples.push(...matches.slice(0, 3)); // Add up to 3 examples
        }
      });

      if (totalMatches > maxMatches) {
        maxMatches = totalMatches;
        detectedStyle = style as CitationFormat['style'];
      }
    });

    return {
      style: detectedStyle,
      detected: maxMatches > 0,
      examples: [...new Set(examples)].slice(0, 5) // Remove duplicates, limit to 5
    };
  }

  /**
   * Analyze academic tone and level
   */
  private static analyzeAcademicTone(content: string, conversationTitle: string): AcademicContext['academicTone'] {
    const words = content.toLowerCase().split(/\s+/);
    
    // Academic vocabulary indicators
    const academicTerms = [
      'research', 'study', 'analysis', 'methodology', 'findings', 'conclusion',
      'hypothesis', 'literature', 'framework', 'theoretical', 'empirical',
      'investigation', 'examination', 'assessment', 'evaluation', 'systematic',
      'comprehensive', 'significant', 'substantial', 'considerable', 'furthermore',
      'however', 'therefore', 'consequently', 'moreover', 'nevertheless'
    ];

    const undergraduateTerms = ['project', 'assignment', 'course', 'class', 'basic', 'simple'];
    const graduateTerms = ['thesis', 'dissertation', 'advanced', 'complex', 'sophisticated'];
    const doctoralTerms = ['doctoral', 'phd', 'original', 'contribution', 'novel', 'innovative'];

    // Count academic terms
    const academicCount = words.filter(word => 
      academicTerms.some(term => word.includes(term))
    ).length;

    // Determine academic level
    const undergraduateCount = words.filter(word => 
      undergraduateTerms.some(term => word.includes(term))
    ).length;
    const graduateCount = words.filter(word => 
      graduateTerms.some(term => word.includes(term))
    ).length;
    const doctoralCount = words.filter(word => 
      doctoralTerms.some(term => word.includes(term))
    ).length;

    let level: 'undergraduate' | 'graduate' | 'doctoral' = 'undergraduate';
    if (doctoralCount > 0 || conversationTitle.toLowerCase().includes('phd')) {
      level = 'doctoral';
    } else if (graduateCount > undergraduateCount || conversationTitle.toLowerCase().includes('master')) {
      level = 'graduate';
    }

    // Calculate formality score
    const formalityScore = Math.min(academicCount / Math.max(words.length / 100, 1), 1);

    // Detect discipline from content and title
    const disciplines = {
      'computer science': ['algorithm', 'software', 'programming', 'data', 'machine learning'],
      'psychology': ['behavior', 'cognitive', 'mental', 'psychological', 'therapy'],
      'biology': ['organism', 'cell', 'genetic', 'species', 'evolution'],
      'business': ['market', 'management', 'strategy', 'organization', 'economic'],
      'education': ['learning', 'teaching', 'student', 'curriculum', 'pedagogy'],
      'engineering': ['design', 'system', 'technical', 'optimization', 'performance']
    };

    let discipline = 'general';
    let maxDisciplineScore = 0;

    Object.entries(disciplines).forEach(([disc, terms]) => {
      const score = terms.filter(term => 
        content.toLowerCase().includes(term) || conversationTitle.toLowerCase().includes(term)
      ).length;
      if (score > maxDisciplineScore) {
        maxDisciplineScore = score;
        discipline = disc;
      }
    });

    return {
      level,
      discipline,
      formalityScore
    };
  }

  /**
   * Extract key academic terms from content
   */
  private static extractKeyTerms(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);

    // Extract words that are likely key terms (longer, not stop words, appear multiple times)
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length > 4 && !stopWords.has(cleaned)) {
        wordFreq.set(cleaned, (wordFreq.get(cleaned) || 0) + 1);
      }
    });

    // Return top key terms
    return Array.from(wordFreq.entries())
      .filter(([_, freq]) => freq > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, _]) => word);
  }

  /**
   * Detect research methodology from content
   */
  private static detectResearchMethodology(content: string): string | undefined {
    const methodologies = {
      'quantitative': ['statistical', 'survey', 'experiment', 'measurement', 'data analysis', 'correlation'],
      'qualitative': ['interview', 'observation', 'case study', 'ethnography', 'phenomenology', 'grounded theory'],
      'mixed methods': ['mixed method', 'triangulation', 'sequential', 'concurrent'],
      'systematic review': ['systematic review', 'meta-analysis', 'literature review'],
      'experimental': ['experiment', 'control group', 'randomized', 'treatment', 'intervention']
    };

    const contentLower = content.toLowerCase();
    let detectedMethodology: string | undefined;
    let maxScore = 0;

    Object.entries(methodologies).forEach(([method, keywords]) => {
      const score = keywords.filter(keyword => contentLower.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedMethodology = method;
      }
    });

    return maxScore > 0 ? detectedMethodology : undefined;
  }

  /**
   * Validate academic content quality
   */
  static validateAcademicContent(content: string, academicContext: AcademicContext): AcademicValidationResult {
    const words = content.toLowerCase().split(/\s+/);
    
    // Check academic tone
    const academicTerms = [
      'research', 'study', 'analysis', 'methodology', 'findings', 'conclusion',
      'hypothesis', 'literature', 'framework', 'theoretical', 'empirical'
    ];
    
    const academicTermCount = words.filter(word => 
      academicTerms.some(term => word.includes(term))
    ).length;
    
    const toneScore = Math.min(academicTermCount / Math.max(words.length / 50, 1), 1);
    
    // Identify style issues
    const styleIssues: string[] = [];
    const suggestions: string[] = [];
    
    // Check for informal language
    const informalTerms = ['really', 'pretty', 'quite', 'sort of', 'kind of', 'basically', 'actually'];
    const informalCount = words.filter(word => informalTerms.includes(word)).length;
    
    if (informalCount > 0) {
      styleIssues.push('Contains informal language');
      suggestions.push('Replace informal terms with more academic alternatives');
    }
    
    // Check for first person usage (often discouraged in academic writing)
    const firstPersonTerms = ['i', 'me', 'my', 'we', 'us', 'our'];
    const firstPersonCount = words.filter(word => firstPersonTerms.includes(word)).length;
    
    if (firstPersonCount > words.length * 0.02) { // More than 2% first person
      styleIssues.push('Excessive use of first person');
      suggestions.push('Consider using passive voice or third person perspective');
    }
    
    // Check sentence length (academic writing often has longer, complex sentences)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    
    if (avgSentenceLength < 15) {
      styleIssues.push('Sentences may be too short for academic writing');
      suggestions.push('Consider combining related ideas into more complex sentences');
    }
    
    // Check for citations if academic context suggests they should be present
    if (academicContext.citationFormat.detected === false && words.length > 200) {
      styleIssues.push('No citations detected in substantial content');
      suggestions.push('Consider adding citations to support claims and arguments');
    }
    
    const isAcademic = toneScore > 0.3 && styleIssues.length < 3;
    
    return {
      isAcademic,
      toneScore,
      styleIssues,
      suggestions,
      citationFormat: academicContext.citationFormat
    };
  }

  /**
   * Extract content for a specific section
   */
  private static extractSectionContent(content: string, sectionTitle: string): string {
    const lines = content.split('\n');
    const sectionIndex = lines.findIndex(line => 
      line.toLowerCase().includes(sectionTitle.toLowerCase())
    );
    
    if (sectionIndex === -1) return '';
    
    // Find the next section or end of document
    let endIndex = lines.length;
    for (let i = sectionIndex + 1; i < lines.length; i++) {
      if (lines[i].match(/^#{1,6}\s+/)) {
        endIndex = i;
        break;
      }
    }
    
    return lines.slice(sectionIndex + 1, endIndex).join('\n').trim();
  }
}