/**
 * Concern Analysis Engine
 * AI-powered content analysis engine for identifying proofreading concerns
 */

import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { 
  ProofreadingConcern,
  ConcernCategory,
  ConcernSeverity,
  ConcernStatus,
  ContentLocation,
  IdeaDefinition,
  ContentAnalysis,
  StructureAnalysis,
  StyleAnalysis,
  ConsistencyAnalysis,
  CompletenessAnalysis,
  StyleIssue,
  TerminologyIssue,
  CitationIssue,
  FormattingIssue,
  FlowAnalysis,
  HeadingAnalysis
} from '../../lib/ai-types';

export interface ConcernAnalysisEngine {
  analyzeContent(content: string, ideaDefinitions: IdeaDefinition[], conversationId: string): Promise<ProofreadingConcern[]>;
  categorizeContent(content: string): Promise<ContentAnalysis>;
  validateAcademicStyle(content: string): Promise<StyleAnalysis>;
}

export class ConcernAnalysisEngineImpl implements ConcernAnalysisEngine {
  constructor(private apiKey: string) {}

  /**
   * Main analysis method that generates proofreading concerns
   */
  async analyzeContent(
    content: string, 
    ideaDefinitions: IdeaDefinition[], 
    conversationId: string
  ): Promise<ProofreadingConcern[]> {
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required for analysis');
    }

    try {
      // Perform comprehensive content analysis
      const contentAnalysis = await this.categorizeContent(content);
      
      // Generate AI-powered concerns
      const aiConcerns = await this.generateAIConcerns(content, ideaDefinitions, contentAnalysis);
      
      // Generate structure-based concerns
      const structureConcerns = this.generateStructureConcerns(contentAnalysis.structure, conversationId);
      
      // Generate style-based concerns
      const styleConcerns = this.generateStyleConcerns(contentAnalysis.style, conversationId);
      
      // Generate consistency concerns
      const consistencyConcerns = this.generateConsistencyConcerns(contentAnalysis.consistency, conversationId);
      
      // Generate completeness concerns
      const completenessConcerns = this.generateCompletenessConcerns(contentAnalysis.completeness, conversationId);
      
      // Combine all concerns
      const allConcerns = [
        ...aiConcerns,
        ...structureConcerns,
        ...styleConcerns,
        ...consistencyConcerns,
        ...completenessConcerns
      ];
      
      // Remove duplicates and prioritize concerns
      return this.prioritizeAndDeduplicateConcerns(allConcerns);
      
    } catch (error) {
      console.error('Error in concern analysis:', error);
      throw new Error(`Failed to analyze content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Categorize content into different analysis dimensions
   */
  async categorizeContent(content: string): Promise<ContentAnalysis> {
    const structure = await this.analyzeStructure(content);
    const style = await this.validateAcademicStyle(content);
    const consistency = this.analyzeConsistency(content);
    const completeness = this.analyzeCompleteness(content);

    return {
      structure,
      style,
      consistency,
      completeness
    };
  }

  /**
   * Validate academic style and tone
   */
  async validateAcademicStyle(content: string): Promise<StyleAnalysis> {
    const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Calculate academic tone score
    const academicTerms = [
      'research', 'study', 'analysis', 'methodology', 'findings', 'conclusion',
      'hypothesis', 'literature', 'framework', 'theoretical', 'empirical',
      'investigation', 'examination', 'assessment', 'evaluation', 'systematic'
    ];
    
    const academicCount = words.filter(word => 
      academicTerms.some(term => word.includes(term))
    ).length;
    const academicTone = Math.min(academicCount / Math.max(words.length / 100, 1), 1);
    
    // Calculate formality level
    const formalTerms = [
      'furthermore', 'however', 'therefore', 'consequently', 'moreover',
      'nevertheless', 'accordingly', 'subsequently', 'additionally'
    ];
    const informalTerms = [
      'really', 'pretty', 'quite', 'sort of', 'kind of', 'basically',
      'actually', 'totally', 'super', 'very'
    ];
    
    const formalCount = words.filter(word => formalTerms.includes(word)).length;
    const informalCount = words.filter(word => informalTerms.includes(word)).length;
    const formalityLevel = Math.max(0, Math.min(1, (formalCount - informalCount) / Math.max(words.length / 100, 1) + 0.5));
    
    // Calculate clarity score based on sentence length and complexity
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 25).length;
    const clarityScore = Math.max(0, 1 - (longSentences / Math.max(sentences.length, 1)) - Math.max(0, (avgSentenceLength - 20) / 30));
    
    // Identify style issues
    const styleIssues: StyleIssue[] = [];
    
    // Check for informal language
    if (informalCount > 0) {
      styleIssues.push({
        type: 'tone',
        description: `Found ${informalCount} informal terms that may not be appropriate for academic writing`,
        suggestion: 'Replace informal language with more academic alternatives'
      });
    }
    
    // Check for excessive first person
    const firstPersonCount = words.filter(word => ['i', 'me', 'my', 'we', 'us', 'our'].includes(word)).length;
    if (firstPersonCount > words.length * 0.02) {
      styleIssues.push({
        type: 'formality',
        description: 'Excessive use of first person pronouns',
        suggestion: 'Consider using passive voice or third person perspective'
      });
    }
    
    // Check for overly long sentences
    if (longSentences > sentences.length * 0.3) {
      styleIssues.push({
        type: 'clarity',
        description: 'Many sentences are too long and may be difficult to follow',
        suggestion: 'Break down complex sentences into shorter, clearer statements'
      });
    }
    
    // Check for word choice issues
    const weakWords = words.filter(word => ['thing', 'stuff', 'good', 'bad', 'nice', 'big', 'small'].includes(word)).length;
    if (weakWords > 0) {
      styleIssues.push({
        type: 'wordChoice',
        description: 'Use of vague or weak descriptive words',
        suggestion: 'Replace vague terms with more specific, academic vocabulary'
      });
    }

    return {
      academicTone,
      formalityLevel,
      clarityScore,
      styleIssues
    };
  }

  /**
   * Generate AI-powered concerns using Google Generative AI
   */
  private async generateAIConcerns(
    content: string, 
    ideaDefinitions: IdeaDefinition[], 
    contentAnalysis: ContentAnalysis
  ): Promise<ProofreadingConcern[]> {
    const google = createGoogleGenerativeAI({ apiKey: this.apiKey });
    
    // Build context for AI analysis
    const ideaContext = ideaDefinitions.length > 0 
      ? ideaDefinitions.map(idea => `**${idea.title}:** ${idea.description}`).join('\n')
      : 'No idea definitions available';
    
    const analysisContext = this.formatAnalysisContext(contentAnalysis);
    
    const prompt = `You are an expert academic proofreader analyzing a thesis proposal. Identify specific concerns that need attention, focusing on academic writing quality and thesis-specific issues.

## Idea Definitions Context
${ideaContext}

## Current Analysis Results
${analysisContext}

## Content to Analyze
${content}

## Instructions
Analyze the content and identify specific concerns in the following categories:
- CLARITY: Issues with unclear explanations, ambiguous statements, or confusing language
- COHERENCE: Problems with logical flow, argument structure, or connection between ideas
- STRUCTURE: Issues with organization, section flow, or hierarchical problems
- ACADEMIC_STYLE: Problems with tone, formality, or academic writing conventions
- CONSISTENCY: Inconsistent terminology, formatting, or argumentation
- COMPLETENESS: Missing information, insufficient detail, or gaps in argumentation
- CITATIONS: Missing, incorrect, or inconsistent citations and references
- GRAMMAR: Grammatical errors, punctuation issues, or syntax problems
- TERMINOLOGY: Incorrect or inconsistent use of technical terms

For each concern, provide:
1. A clear, specific title (max 80 characters)
2. A detailed description of the issue
3. The severity level (low, medium, high, critical)
4. Specific suggestions for improvement
5. Location information if applicable

Focus on issues that would impact the academic quality and credibility of the thesis proposal. Be specific and actionable in your feedback.

Return your analysis as a JSON array of concerns with this exact structure:
[
  {
    "category": "CLARITY",
    "severity": "medium",
    "title": "Specific issue title",
    "description": "Detailed description of the concern",
    "suggestions": ["Specific suggestion 1", "Specific suggestion 2"],
    "location": {
      "section": "Section name if identifiable",
      "context": "Relevant text excerpt"
    }
  }
]

Provide 3-8 most important concerns. Focus on quality over quantity.`;

    try {
      const result = await generateText({
        model: google("gemini-1.5-flash-latest"),
        prompt: prompt,
      });

      // Parse AI response
      const aiResponse = this.parseAIResponse(result.text);
      
      // Convert to ProofreadingConcern objects
      return aiResponse.map(concern => this.createConcernFromAI(concern));
      
    } catch (error) {
      console.error('AI concern generation failed:', error);
      // Return empty array rather than failing the entire analysis
      return [];
    }
  }

  /**
   * Analyze document structure
   */
  private async analyzeStructure(content: string): Promise<StructureAnalysis> {
    const lines = content.split('\n');
    const headings = lines.filter(line => line.match(/^#{1,6}\s+/));
    
    // Check for introduction and conclusion
    const hasIntroduction = headings.some(h => 
      h.toLowerCase().includes('introduction') || 
      h.toLowerCase().includes('intro')
    );
    const hasConclusion = headings.some(h => 
      h.toLowerCase().includes('conclusion') || 
      h.toLowerCase().includes('summary') ||
      h.toLowerCase().includes('final')
    );
    
    // Analyze section flow
    const sectionFlow = this.analyzeSectionFlow(content, headings);
    
    // Analyze heading hierarchy
    const headingHierarchy = this.analyzeHeadingHierarchy(headings);
    
    return {
      hasIntroduction,
      hasConclusion,
      sectionFlow,
      headingHierarchy
    };
  }

  /**
   * Analyze section flow and logical progression
   */
  private analyzeSectionFlow(content: string, _headings: string[]): FlowAnalysis {
    const sections = this.extractSections(content);
    
    // Check for logical progression
    const logicalProgression = this.checkLogicalProgression(sections);
    
    // Analyze transition quality
    const transitionWords = [
      'however', 'furthermore', 'moreover', 'therefore', 'consequently',
      'additionally', 'similarly', 'in contrast', 'on the other hand'
    ];
    
    const words = content.toLowerCase().split(/\s+/);
    const transitionCount = words.filter(word => 
      transitionWords.some(transition => word.includes(transition))
    ).length;
    const transitionQuality = Math.min(transitionCount / Math.max(sections.length, 1) / 2, 1);
    
    // Calculate coherence score
    const coherenceScore = (logicalProgression ? 0.6 : 0.3) + (transitionQuality * 0.4);
    
    // Identify flow issues
    const flowIssues: string[] = [];
    if (!logicalProgression) {
      flowIssues.push('Sections may not follow a logical progression');
    }
    if (transitionQuality < 0.3) {
      flowIssues.push('Limited use of transition words between ideas');
    }
    if (sections.length > 0 && sections.some(s => s.content.length < 100)) {
      flowIssues.push('Some sections appear to be underdeveloped');
    }
    
    return {
      logicalProgression,
      transitionQuality,
      coherenceScore,
      flowIssues
    };
  }

  /**
   * Analyze heading hierarchy and structure
   */
  private analyzeHeadingHierarchy(headings: string[]): HeadingAnalysis {
    if (headings.length === 0) {
      return {
        properHierarchy: false,
        consistentFormatting: false,
        descriptiveHeadings: false,
        hierarchyIssues: ['No headings found in document']
      };
    }
    
    const hierarchyIssues: string[] = [];
    
    // Check hierarchy levels
    const levels = headings.map(h => h.match(/^(#{1,6})/)?.[1].length || 1);
    let properHierarchy = true;
    
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i-1] + 1) {
        properHierarchy = false;
        hierarchyIssues.push('Heading levels skip intermediate levels');
        break;
      }
    }
    
    // Check consistent formatting
    const headingTexts = headings.map(h => h.replace(/^#{1,6}\s+/, ''));
    const consistentFormatting = this.checkHeadingFormatConsistency(headingTexts);
    if (!consistentFormatting) {
      hierarchyIssues.push('Inconsistent heading formatting or capitalization');
    }
    
    // Check descriptive headings
    const descriptiveHeadings = headingTexts.every(text => 
      text.length > 3 && !text.match(/^(section|part|chapter)\s*\d+$/i)
    );
    if (!descriptiveHeadings) {
      hierarchyIssues.push('Some headings are not descriptive enough');
    }
    
    return {
      properHierarchy,
      consistentFormatting,
      descriptiveHeadings,
      hierarchyIssues
    };
  }

  /**
   * Analyze consistency across the document
   */
  private analyzeConsistency(content: string): ConsistencyAnalysis {
    const terminologyConsistency = this.analyzeTerminologyConsistency(content);
    const citationConsistency = this.analyzeCitationConsistency(content);
    const formattingConsistency = this.analyzeFormattingConsistency(content);
    
    return {
      terminologyConsistency,
      citationConsistency,
      formattingConsistency
    };
  }

  /**
   * Analyze terminology consistency
   */
  private analyzeTerminologyConsistency(content: string): TerminologyIssue[] {
    const issues: TerminologyIssue[] = [];
    
    // Find potential terminology variations
    const words = content.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();
    
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length > 4) {
        wordFreq.set(cleaned, (wordFreq.get(cleaned) || 0) + 1);
      }
    });
    
    // Look for similar terms that might be inconsistent
    const frequentWords = Array.from(wordFreq.entries())
      .filter(([_, freq]) => freq > 1)
      .map(([word, _]) => word);
    
    // Simple similarity check for common academic terms
    const academicTermGroups = [
      ['methodology', 'method', 'approach'],
      ['analysis', 'analyze', 'analytical'],
      ['research', 'study', 'investigation'],
      ['framework', 'model', 'structure']
    ];
    
    academicTermGroups.forEach(group => {
      const foundTerms = group.filter(term => frequentWords.includes(term));
      if (foundTerms.length > 1) {
        issues.push({
          term: group[0],
          inconsistentUsage: foundTerms,
          suggestedStandardization: foundTerms[0],
          locations: [] // Would need more complex parsing to find exact locations
        });
      }
    });
    
    return issues;
  }

  /**
   * Analyze citation consistency
   */
  private analyzeCitationConsistency(content: string): CitationIssue[] {
    const issues: CitationIssue[] = [];
    
    // Detect different citation formats
    const citationPatterns = {
      APA: /\([A-Za-z]+,\s*\d{4}\)/g,
      MLA: /\([A-Za-z]+\s+\d+\)/g,
      Chicago: /\^\d+/g,
      IEEE: /\[\d+\]/g
    };
    
    const foundFormats: string[] = [];
    Object.entries(citationPatterns).forEach(([format, pattern]) => {
      if (content.match(pattern)) {
        foundFormats.push(format);
      }
    });
    
    if (foundFormats.length > 1) {
      issues.push({
        type: 'style_inconsistency',
        description: `Multiple citation formats detected: ${foundFormats.join(', ')}`,
        suggestion: 'Use a consistent citation format throughout the document'
      });
    }
    
    // Check for missing citations in claims
    const claimIndicators = [
      'research shows', 'studies indicate', 'according to', 'evidence suggests',
      'it has been found', 'previous work', 'literature suggests'
    ];
    
    claimIndicators.forEach(indicator => {
      const regex = new RegExp(indicator, 'gi');
      const matches = content.match(regex);
      if (matches) {
        // Simple check: look for citation within 50 characters after claim
        matches.forEach(() => {
          const indicatorIndex = content.toLowerCase().indexOf(indicator);
          const followingText = content.substring(indicatorIndex, indicatorIndex + 100);
          const hasCitation = /\([A-Za-z]+[,\s]*\d{4}\)|\[\d+\]|\^\d+/.test(followingText);
          
          if (!hasCitation) {
            issues.push({
              type: 'missing',
              description: `Claim "${indicator}" may need citation support`,
              suggestion: 'Add appropriate citation to support this claim'
            });
          }
        });
      }
    });
    
    return issues;
  }

  /**
   * Analyze formatting consistency
   */
  private analyzeFormattingConsistency(content: string): FormattingIssue[] {
    const issues: FormattingIssue[] = [];
    
    // Check for inconsistent spacing
    if (content.includes('  ') || content.includes('\t')) {
      issues.push({
        type: 'spacing',
        description: 'Inconsistent spacing detected (multiple spaces or tabs)',
        suggestion: 'Use consistent single spaces between words'
      });
    }
    
    // Check for inconsistent list formatting
    const listPatterns = [/^\s*[-*+]\s+/gm, /^\s*\d+\.\s+/gm];
    const listTypes = listPatterns.map(pattern => content.match(pattern)?.length || 0);
    
    if (listTypes.filter(count => count > 0).length > 1) {
      issues.push({
        type: 'numbering',
        description: 'Mixed list formatting styles detected',
        suggestion: 'Use consistent list formatting throughout the document'
      });
    }
    
    return issues;
  }

  /**
   * Analyze document completeness
   */
  private analyzeCompleteness(content: string): CompletenessAnalysis {
    const requiredSections = [
      'introduction', 'literature review', 'methodology', 'research questions'
    ];
    
    const contentLower = content.toLowerCase();
    const missingSections = requiredSections.filter(section => 
      !contentLower.includes(section)
    );
    
    // Check for insufficient detail
    const sections = this.extractSections(content);
    const insufficientDetail = sections
      .filter(section => section.content.length < 200)
      .map(section => section.title);
    
    // Calculate completeness score
    const sectionScore = (requiredSections.length - missingSections.length) / requiredSections.length;
    const detailScore = sections.length > 0 ? 
      sections.filter(s => s.content.length >= 200).length / sections.length : 0;
    const completenessScore = (sectionScore + detailScore) / 2;
    
    return {
      missingSections,
      insufficientDetail,
      completenessScore
    };
  }

  /**
   * Generate structure-based concerns
   */
  private generateStructureConcerns(structure: StructureAnalysis, conversationId: string): ProofreadingConcern[] {
    const concerns: ProofreadingConcern[] = [];
    
    if (!structure.hasIntroduction) {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.STRUCTURE,
        severity: ConcernSeverity.HIGH,
        title: 'Missing Introduction Section',
        description: 'The document appears to lack a clear introduction section, which is essential for establishing context and objectives.',
        suggestions: ['Add an introduction section that outlines the research problem, objectives, and structure']
      }));
    }
    
    if (!structure.hasConclusion) {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.STRUCTURE,
        severity: ConcernSeverity.MEDIUM,
        title: 'Missing Conclusion Section',
        description: 'The document lacks a conclusion or summary section to wrap up the main points.',
        suggestions: ['Add a conclusion section that summarizes key points and future directions']
      }));
    }
    
    if (!structure.headingHierarchy.properHierarchy) {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.STRUCTURE,
        severity: ConcernSeverity.MEDIUM,
        title: 'Improper Heading Hierarchy',
        description: 'The document has issues with heading hierarchy that may confuse readers.',
        suggestions: ['Ensure heading levels follow a logical progression (H1 → H2 → H3)', 'Avoid skipping heading levels']
      }));
    }
    
    if (structure.sectionFlow.coherenceScore < 0.5) {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.COHERENCE,
        severity: ConcernSeverity.MEDIUM,
        title: 'Poor Section Flow',
        description: 'The logical flow between sections could be improved for better coherence.',
        suggestions: ['Add transition sentences between sections', 'Ensure each section builds logically on the previous one']
      }));
    }
    
    return concerns;
  }

  /**
   * Generate style-based concerns
   */
  private generateStyleConcerns(style: StyleAnalysis, conversationId: string): ProofreadingConcern[] {
    const concerns: ProofreadingConcern[] = [];
    
    if (style.academicTone < 0.3) {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.ACADEMIC_STYLE,
        severity: ConcernSeverity.HIGH,
        title: 'Insufficient Academic Tone',
        description: 'The writing style may not be sufficiently academic for a thesis proposal.',
        suggestions: ['Use more formal academic vocabulary', 'Incorporate discipline-specific terminology', 'Avoid colloquial expressions']
      }));
    }
    
    if (style.formalityLevel < 0.4) {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.ACADEMIC_STYLE,
        severity: ConcernSeverity.MEDIUM,
        title: 'Informal Language Usage',
        description: 'The document contains informal language that may not be appropriate for academic writing.',
        suggestions: ['Replace informal terms with formal alternatives', 'Use academic transition words', 'Maintain consistent formal tone']
      }));
    }
    
    if (style.clarityScore < 0.6) {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.CLARITY,
        severity: ConcernSeverity.MEDIUM,
        title: 'Clarity Issues',
        description: 'Some sentences may be too complex or unclear, affecting readability.',
        suggestions: ['Break down overly complex sentences', 'Use clearer, more direct language', 'Ensure each sentence has a clear purpose']
      }));
    }
    
    // Add concerns for specific style issues
    style.styleIssues.forEach(issue => {
      const severity = issue.type === 'clarity' ? ConcernSeverity.MEDIUM : ConcernSeverity.LOW;
      concerns.push(this.createConcern({
        conversationId,
        category: this.mapStyleIssueToCategory(issue.type),
        severity,
        title: this.formatStyleIssueTitle(issue.type),
        description: issue.description,
        suggestions: issue.suggestion ? [issue.suggestion] : []
      }));
    });
    
    return concerns;
  }

  /**
   * Generate consistency concerns
   */
  private generateConsistencyConcerns(consistency: ConsistencyAnalysis, conversationId: string): ProofreadingConcern[] {
    const concerns: ProofreadingConcern[] = [];
    
    consistency.terminologyConsistency.forEach(issue => {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.TERMINOLOGY,
        severity: ConcernSeverity.LOW,
        title: `Inconsistent Use of "${issue.term}"`,
        description: `The term "${issue.term}" is used inconsistently throughout the document.`,
        suggestions: [`Standardize usage to "${issue.suggestedStandardization}"`, 'Review all instances for consistency']
      }));
    });
    
    consistency.citationConsistency.forEach(issue => {
      const severity = issue.type === 'missing' ? ConcernSeverity.HIGH : ConcernSeverity.MEDIUM;
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.CITATIONS,
        severity,
        title: this.formatCitationIssueTitle(issue.type),
        description: issue.description,
        suggestions: issue.suggestion ? [issue.suggestion] : []
      }));
    });
    
    consistency.formattingConsistency.forEach(issue => {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.STRUCTURE,
        severity: ConcernSeverity.LOW,
        title: this.formatFormattingIssueTitle(issue.type),
        description: issue.description,
        suggestions: issue.suggestion ? [issue.suggestion] : []
      }));
    });
    
    return concerns;
  }

  /**
   * Generate completeness concerns
   */
  private generateCompletenessConcerns(completeness: CompletenessAnalysis, conversationId: string): ProofreadingConcern[] {
    const concerns: ProofreadingConcern[] = [];
    
    if (completeness.missingSections.length > 0) {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.COMPLETENESS,
        severity: ConcernSeverity.HIGH,
        title: 'Missing Required Sections',
        description: `The following required sections are missing: ${completeness.missingSections.join(', ')}`,
        suggestions: ['Add the missing sections to complete the thesis structure', 'Ensure all required components are addressed']
      }));
    }
    
    if (completeness.insufficientDetail.length > 0) {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.COMPLETENESS,
        severity: ConcernSeverity.MEDIUM,
        title: 'Insufficient Detail in Sections',
        description: `The following sections need more development: ${completeness.insufficientDetail.join(', ')}`,
        suggestions: ['Expand these sections with more detailed content', 'Provide more examples and explanations']
      }));
    }
    
    if (completeness.completenessScore < 0.5) {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.COMPLETENESS,
        severity: ConcernSeverity.HIGH,
        title: 'Overall Completeness Issues',
        description: 'The document appears to be incomplete and needs significant development.',
        suggestions: ['Review thesis requirements and ensure all components are addressed', 'Develop existing sections more thoroughly']
      }));
    }
    
    return concerns;
  }

  /**
   * Helper methods for concern generation
   */
  private createConcern(params: {
    conversationId: string;
    category: ConcernCategory;
    severity: ConcernSeverity;
    title: string;
    description: string;
    suggestions?: string[];
    location?: ContentLocation;
  }): ProofreadingConcern {
    return {
      id: crypto.randomUUID(),
      conversationId: params.conversationId,
      category: params.category,
      severity: params.severity,
      title: params.title,
      description: params.description,
      location: params.location,
      suggestions: params.suggestions || [],
      relatedIdeas: [],
      status: ConcernStatus.TO_BE_DONE,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private checkHeadingFormatConsistency(headingTexts: string[]): boolean {
    // Simple check for consistent capitalization
    const titleCase = headingTexts.filter(text => 
      text.charAt(0) === text.charAt(0).toUpperCase()
    );
    const sentenceCase = headingTexts.filter(text => 
      text.split(' ').every(word => word.charAt(0) === word.charAt(0).toUpperCase())
    );
    
    return titleCase.length >= headingTexts.length * 0.8 || 
           sentenceCase.length >= headingTexts.length * 0.8;
  }

  private formatAnalysisContext(analysis: ContentAnalysis): string {
    return `Structure: ${analysis.structure.hasIntroduction ? 'Has intro' : 'Missing intro'}, ${analysis.structure.hasConclusion ? 'Has conclusion' : 'Missing conclusion'}
Style: Academic tone ${(analysis.style.academicTone * 100).toFixed(0)}%, Formality ${(analysis.style.formalityLevel * 100).toFixed(0)}%
Completeness: ${(analysis.completeness.completenessScore * 100).toFixed(0)}%`;
  }

  private parseAIResponse(responseText: string): any[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return [];
    }
  }

  private createConcernFromAI(aiConcern: any): ProofreadingConcern {
    return {
      id: crypto.randomUUID(),
      conversationId: '', // Will be set by caller
      category: ConcernCategory[aiConcern.category as keyof typeof ConcernCategory] || ConcernCategory.CLARITY,
      severity: ConcernSeverity[aiConcern.severity.toUpperCase() as keyof typeof ConcernSeverity] || ConcernSeverity.MEDIUM,
      title: aiConcern.title,
      description: aiConcern.description,
      location: aiConcern.location,
      suggestions: aiConcern.suggestions || [],
      relatedIdeas: [],
      status: ConcernStatus.TO_BE_DONE,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private extractSections(content: string): Array<{title: string, content: string}> {
    const lines = content.split('\n');
    const sections: Array<{title: string, content: string}> = [];
    let currentSection = { title: 'Introduction', content: '' };
    
    for (const line of lines) {
      if (line.match(/^#{1,6}\s+/)) {
        if (currentSection.content.trim()) {
          sections.push(currentSection);
        }
        currentSection = { title: line.replace(/^#{1,6}\s+/, ''), content: '' };
      } else {
        currentSection.content += line + '\n';
      }
    }
    
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  private checkLogicalProgression(sections: Array<{title: string, content: string}>): boolean {
    // Simple check for logical section ordering
    const expectedOrder = ['introduction', 'literature', 'methodology', 'results', 'discussion', 'conclusion'];
    const sectionTitles = sections.map(s => s.title.toLowerCase());
    
    let lastIndex = -1;
    for (const title of sectionTitles) {
      const currentIndex = expectedOrder.findIndex(expected => title.includes(expected));
      if (currentIndex !== -1) {
        if (currentIndex < lastIndex) {
          return false;
        }
        lastIndex = currentIndex;
      }
    }
    
    return true;
  }

  private mapStyleIssueToCategory(issueType: string): ConcernCategory {
    switch (issueType) {
      case 'tone':
      case 'formality':
        return ConcernCategory.ACADEMIC_STYLE;
      case 'clarity':
        return ConcernCategory.CLARITY;
      case 'wordChoice':
        return ConcernCategory.TERMINOLOGY;
      case 'sentence_structure':
        return ConcernCategory.STRUCTURE;
      default:
        return ConcernCategory.CLARITY;
    }
  }

  private formatStyleIssueTitle(issueType: string): string {
    switch (issueType) {
      case 'tone':
        return 'Inappropriate Tone';
      case 'formality':
        return 'Informal Language';
      case 'clarity':
        return 'Clarity Issues';
      case 'wordChoice':
        return 'Word Choice Issues';
      case 'sentence_structure':
        return 'Sentence Structure Problems';
      default:
        return 'Style Issue';
    }
  }

  private formatCitationIssueTitle(issueType: string): string {
    switch (issueType) {
      case 'missing':
        return 'Missing Citations';
      case 'format':
        return 'Citation Format Issues';
      case 'incomplete':
        return 'Incomplete Citations';
      case 'style_inconsistency':
        return 'Inconsistent Citation Style';
      default:
        return 'Citation Issue';
    }
  }

  private formatFormattingIssueTitle(issueType: string): string {
    switch (issueType) {
      case 'spacing':
        return 'Spacing Issues';
      case 'indentation':
        return 'Indentation Problems';
      case 'numbering':
        return 'Numbering Inconsistencies';
      case 'alignment':
        return 'Alignment Issues';
      default:
        return 'Formatting Issue';
    }
  }

  private prioritizeAndDeduplicateConcerns(concerns: ProofreadingConcern[]): ProofreadingConcern[] {
    // Remove duplicates based on title similarity
    const uniqueConcerns = concerns.filter((concern, index, array) => 
      array.findIndex(c => this.areConcernsSimilar(c, concern)) === index
    );
    
    // Sort by severity (critical first) then by category
    return uniqueConcerns.sort((a, b) => {
      const severityOrder = [ConcernSeverity.CRITICAL, ConcernSeverity.HIGH, ConcernSeverity.MEDIUM, ConcernSeverity.LOW];
      const severityDiff = severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
      if (severityDiff !== 0) return severityDiff;
      return a.category.localeCompare(b.category);
    });
  }

  private areConcernsSimilar(concern1: ProofreadingConcern, concern2: ProofreadingConcern): boolean {
    // Simple similarity check based on title and category
    return concern1.category === concern2.category && 
           this.calculateStringSimilarity(concern1.title, concern2.title) > 0.7;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity
    const set1 = new Set(str1.toLowerCase().split(' '));
    const set2 = new Set(str2.toLowerCase().split(' '));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }
}

/**
 * Factory function to create concern analysis engine
 */
export function createConcernAnalysisEngine(apiKey: string): ConcernAnalysisEngine {
  return new ConcernAnalysisEngineImpl(apiKey);
}