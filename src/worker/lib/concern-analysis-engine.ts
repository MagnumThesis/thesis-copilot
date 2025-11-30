/**
 * Concern Analysis Engine
 * AI-powered content analysis engine for identifying proofreading concerns
 */

// AI imports (used for optional AI-powered analysis)
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { 
  ProofreadingConcern,
  ConcernCategory,
  ConcernSeverity,
  ConcernStatus,
  ContentLocation,

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
import { proofreaderPerformanceMonitor } from '../../lib/proofreader-performance-monitor';

/**
 * Interface for the concern analysis engine
 */
export interface ConcernAnalysisEngine {
  analyzeContent(content: string, conversationId: string): Promise<ProofreadingConcern[]>;
}

/**
 * Implementation of the concern analysis engine
 */
class ConcernAnalysisEngineImpl implements ConcernAnalysisEngine {
  private apiKey?: string;
  private googleClient?: ReturnType<typeof createGoogleGenerativeAI>;

  constructor(_apiKey: string) {
    // Store API key and initialize Google generative client when available
    this.apiKey = _apiKey;
    try {
      if (this.apiKey) {
        this.googleClient = createGoogleGenerativeAI({ apiKey: this.apiKey });
      }
    } catch (err) {
      console.warn('Failed to initialize Google Generative AI client:', err);
      this.googleClient = undefined;
    }
  }

  /**
   * Main method to analyze content and generate proofreading concerns
   */
  async analyzeContent(content: string, conversationId: string): Promise<ProofreadingConcern[]> {
    try {
      // Record performance metric
      proofreaderPerformanceMonitor.startMeasure('content-analysis');

      // Attempt AI-powered analysis (non-fatal). We'll merge AI and rule-based concerns.
      let aiConcerns: ProofreadingConcern[] = [];
      if (this.googleClient) {
        try {
          aiConcerns = await this.generateConcernsWithAI(content, conversationId) || [];
        } catch (aiError) {
          console.warn('AI-based analysis failed, continuing with rule-based analysis:', aiError);
          aiConcerns = [];
        }
      }

      // Perform comprehensive content analysis (rule-based)
      const analysis = await this.performContentAnalysis(content);
      const ruleConcerns = this.generateConcerns(analysis, conversationId);

      // Merge AI and rule-based concerns, giving a union to prioritization/deduplication
      const combined = [...(aiConcerns || []), ...(ruleConcerns || [])];
      const finalConcerns = this.prioritizeAndDeduplicateConcerns(combined);

      proofreaderPerformanceMonitor.endMeasure('content-analysis');

      return finalConcerns;
    } catch (error) {
      console.error('Error in concern analysis:', error);
      return [];
    }
  }

  /**
   * Use the Google Generative AI to produce structured concerns.
   * Returns an array of ProofreadingConcern with an AI marker in the explanation.
   */
  private async generateConcernsWithAI(content: string, conversationId: string): Promise<ProofreadingConcern[]> {
    if (!this.googleClient) throw new Error('AI client not initialized');

    // Define a simple schema for the expected response
    const ConcernItemSchema = z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
      severity: z.string(),
      suggestions: z.array(z.string()).optional()
    });

    const ResponseSchema = z.object({
      concerns: z.array(ConcernItemSchema)
    });

    const prompt = `You are an academic writing assistant. Analyze the following document and return a JSON object with a 'concerns' array. Each concern should include: title (short), description (detailed), category (one of structure, clarity, coherence, style, academic_tone, citation, completeness, terminology), severity (low, medium, high, critical), and suggestions (array of short action items). Return ONLY valid JSON that matches the schema. Document:\n\n${content}`;

    const { object } = await generateObject({
      model: this.googleClient('gemini-2.0-flash'),
      schema: ResponseSchema,
      prompt
    });

    const parsed = object as any;
    const items = parsed.concerns || [];

    const mapped: ProofreadingConcern[] = items.map((it: any) => ({
      id: crypto.randomUUID(),
      text: it.description || it.title,
      category: (it.category || 'structure') as any,
      severity: (it.severity || 'medium') as any,
      status: ConcernStatus.TO_BE_DONE,
      suggestions: it.suggestions || [],
      relatedIdeas: [],
      position: { start: 0, end: 0 },
      explanation: `(AI-generated) ${it.description || it.title}`,
      aiGenerated: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: it.title,
      description: it.description,
      location: {},
      conversationId
    }));

    return mapped;
  }

  /**
   * Perform comprehensive content analysis
   */
  private async performContentAnalysis(content: string): Promise<ContentAnalysis> {
    const [structure, style, consistency, completeness] = await Promise.all([
      this.analyzeStructure(content),
      this.analyzeStyle(content),
      this.analyzeConsistency(content),
      this.analyzeCompleteness(content)
    ]);

    return {
      clarity: style?.clarityScore || 0.5,
      coherence: structure?.sectionFlow?.coherenceScore || 0.5,
      academicTone: style?.academicTone || 0.5,
      readability: style?.clarityScore || 0.5,
      issues: [],
      structure,
      style,
      consistency,
      completeness
    };
  }

  /**
   * Analyze document structure
   */
  private async analyzeStructure(content: string): Promise<StructureAnalysis> {
    const lines = content.split('\n');
    const headings = lines.filter(line => line.match(/^#{1,6}\s+/));
    
    // Check for introduction and conclusion
    const hasIntroduction = this.checkForIntroduction(content);
    const hasConclusion = this.checkForConclusion(content);
    
    // Analyze heading hierarchy
    const headingHierarchy = this.analyzeHeadingHierarchy(headings);
    
    // Analyze section flow
    const sectionFlow = this.analyzeSectionFlow(content);
    
    return {
      headingStructure: [], // Simple implementation
      paragraphFlow: [], // Simple implementation
      sectionBalance: 0.5, // Simple implementation
      logicalProgression: 0.5, // Simple implementation
      issues: [],
      hasIntroduction,
      hasConclusion,
      headingHierarchy,
      sectionFlow
    };
  }

  /**
   * Check for introduction section
   */
  private checkForIntroduction(content: string): boolean {
    const introIndicators = [
      /^#{1,3}\s*introduction\s*$/im,
      /^#{1,3}\s*overview\s*$/im,
      /^#{1,3}\s*background\s*$/im,
      /^\s*this\s+(paper|document|thesis|proposal)/im,
      /^\s*the\s+purpose\s+of\s+this/im
    ];

    // If any explicit heading or phrase matches, we have an introduction
    if (introIndicators.some(pattern => pattern.test(content))) {
      return true;
    }

    // Otherwise, detect a lead paragraph that functions as an introduction.
    // Look at the first two paragraphs and check for keywords or sufficient length.
    const paragraphs = content.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    const leadParas = paragraphs.slice(0, 2);

    const introKeywords = [
      'purpose', 'aim', 'objective', 'objectives', 'motivation', 'research question',
      'this study', 'this paper', 'this proposal', 'we propose', 'we investigate', 'the focus of this'
    ];

    for (const p of leadParas) {
      const pLower = p.toLowerCase();

      // If paragraph is long enough (>= 40 words) and appears at the start, treat as intro
      const wordCount = p.split(/\s+/).filter(w => w.length > 0).length;
      if (wordCount >= 40) return true;

      // If paragraph contains multiple intro keywords, treat as intro
      const found = introKeywords.filter(k => pLower.includes(k));
      if (found.length >= 1) return true; // one strong keyword is enough
    }

    return false;
  }

  /**
   * Check for conclusion section
   */
  private checkForConclusion(content: string): boolean {
    const conclusionIndicators = [
      /^#{1,3}\s*conclusion\s*$/im,
      /^#{1,3}\s*summary\s*$/im,
      /^#{1,3}\s*final\s+thoughts\s*$/im,
      /in\s+conclusion/im,
      /to\s+summarize/im
    ];
    
    return conclusionIndicators.some(pattern => pattern.test(content));
  }

  /**
   * Analyze heading hierarchy
   */
  private analyzeHeadingHierarchy(headings: string[]): { properHierarchy: boolean } {
    const levels = headings.map(heading => {
      const match = heading.match(/^(#{1,6})/);
      return match ? match[1].length : 1;
    });
    
    let properHierarchy = true;
    let previousLevel = 0;
    
    for (const level of levels) {
      if (level > previousLevel + 1) {
        properHierarchy = false;
        break;
      }
      previousLevel = level;
    }
    
    const headingTexts = headings.map(h => h.replace(/^#{1,6}\s+/, ''));
    const consistentFormatting = this.checkHeadingFormatConsistency(headingTexts);
    
    return {
      properHierarchy
    };
  }

  /**
   * Analyze section flow
   */
  private analyzeSectionFlow(content: string): { coherenceScore: number } {
    const sections = this.extractSections(content);
    const logicalProgression = this.checkLogicalProgression(sections);
    const coherenceScore = this.analyzeCoherencePatterns(content).score;
    
    return {
      coherenceScore
    };
  }

  /**
   * Analyze writing style
   */
  private async analyzeStyle(content: string): Promise<StyleAnalysis> {
    const academicTone = this.calculateAcademicTone(content);
    const formalityLevel = this.calculateFormalityLevel(content);
    const clarityScore = this.calculateClarityScore(content);
    const styleIssues = this.checkAcademicRegister(content);
    
    return {
      academicTone,
      consistency: 0.5, // Simple implementation
      formality: formalityLevel,
      styleIssues,
      suggestions: [],
      clarityScore,
      formalityLevel
    };
  }

  /**
   * Calculate academic tone score
   */
  private calculateAcademicTone(content: string): number {
    const academicTerms = [
      'research', 'analysis', 'methodology', 'findings', 'conclusion',
      'hypothesis', 'theory', 'evidence', 'data', 'study', 'investigation',
      'examination', 'evaluation', 'assessment', 'framework', 'approach'
    ];
    
    const contentLower = content.toLowerCase();
    const wordCount = content.split(/\s+/).length;
    const academicTermCount = academicTerms.filter(term => 
      contentLower.includes(term)
    ).length;
    
    return Math.min(academicTermCount / Math.max(wordCount / 100, 1), 1);
  }

  /**
   * Calculate formality level
   */
  private calculateFormalityLevel(content: string): number {
    const informalTerms = [
      'really', 'pretty', 'quite', 'sort of', 'kind of', 'basically',
      'actually', 'totally', 'super', 'very', 'a lot', 'lots of',
      'tons of', 'bunch of', 'okay', 'ok'
    ];
    
    const contentLower = content.toLowerCase();
    const wordCount = content.split(/\s+/).length;
    const informalCount = informalTerms.filter(term => 
      contentLower.includes(term)
    ).length;
    
    return Math.max(0, 1 - (informalCount / Math.max(wordCount / 50, 1)));
  }

  /**
   * Calculate clarity score
   */
  private calculateClarityScore(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, sentence) => 
      sum + sentence.split(/\s+/).length, 0) / sentences.length;
    
    // Penalize very long sentences (over 25 words)
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 25).length;
    const longSentenceRatio = longSentences / sentences.length;
    
    // Ideal sentence length is around 15-20 words
    const lengthScore = avgSentenceLength > 25 ? 0.5 : 
                       avgSentenceLength > 20 ? 0.7 : 
                       avgSentenceLength < 10 ? 0.6 : 1.0;
    
    return Math.max(0, lengthScore - (longSentenceRatio * 0.5));
  }

  /**
   * Analyze consistency across the document
   */
  private async analyzeConsistency(content: string): Promise<ConsistencyAnalysis> {
    const terminologyConsistency = this.analyzeTerminologyConsistency(content);
    const citationConsistency = this.analyzeCitationConsistency(content);
    const formattingConsistency = this.analyzeFormattingConsistency(content);
    
    return {
      terminologyConsistency,
      citationConsistency,
      formattingConsistency,
      overallScore: 0.5 // Simple implementation
    };
  }

  /**
   * Analyze terminology consistency
   */
  private analyzeTerminologyConsistency(content: string): TerminologyIssue[] {
    const issues: TerminologyIssue[] = [];
    
    // Common terminology variations to check
    const terminologyPairs = [
      ['data set', 'dataset'],
      ['e-mail', 'email'],
      ['web site', 'website'],
      ['on-line', 'online'],
      ['co-operate', 'cooperate']
    ];
    
    terminologyPairs.forEach(([variant1, variant2]) => {
      const hasVariant1 = content.toLowerCase().includes(variant1);
      const hasVariant2 = content.toLowerCase().includes(variant2);
      
      if (hasVariant1 && hasVariant2) {
        issues.push({
          term: `${variant1}/${variant2}`,
          inconsistentUsage: [variant1, variant2],
          suggestedStandardization: variant2, // Prefer the more modern form
          locations: [], // Simple implementation
          severity: ConcernSeverity.MEDIUM
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
    
    // Check for different citation formats
    const apaStyle = /\([A-Za-z]+[,\s]*\d{4}\)/g;
    const mlaStyle = /\([A-Za-z]+\s+\d+\)/g;
    const chicagoStyle = /\^\d+/g;
    const bracketStyle = /\[\d+\]/g;
    
    const apaCount = (content.match(apaStyle) || []).length;
    const mlaCount = (content.match(mlaStyle) || []).length;
    const chicagoCount = (content.match(chicagoStyle) || []).length;
    const bracketCount = (content.match(bracketStyle) || []).length;
    
    const totalCitations = apaCount + mlaCount + chicagoCount + bracketCount;
    
    if (totalCitations === 0) {
      issues.push({
        type: 'missing',
        description: 'No citations found in the document',
        suggestion: 'Add proper citations to support your arguments'
      });
    } else {
      const stylesUsed = [
        apaCount > 0 ? 'APA' : null,
        mlaCount > 0 ? 'MLA' : null,
        chicagoCount > 0 ? 'Chicago' : null,
        bracketCount > 0 ? 'Numbered' : null
      ].filter(Boolean);
      
      if (stylesUsed.length > 1) {
        issues.push({
          type: 'style_inconsistency',
          description: `Multiple citation styles detected: ${stylesUsed.join(', ')}`,
          suggestion: 'Use a consistent citation style throughout the document'
        });
      }
    }
    
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
   * Enhanced document completeness analysis with detailed feedback
   */
  private analyzeCompleteness(content: string): CompletenessAnalysis {
    // Recommended sections for a research proposal (relaxed thresholds vs full thesis)
    const requiredSections = [
      { 
        name: 'introduction', 
        aliases: ['intro', 'background', 'overview'], 
        critical: true,
        minWords: 100,
        description: 'Should establish context, problem statement, and objectives'
      },
      {
        name: 'literature review',
        aliases: ['related work', 'prior research', 'theoretical framework'],
        critical: false,
        minWords: 250,
        description: 'Should summarize relevant research and identify gaps (concise for proposals)'
      },
      {
        name: 'methodology',
        aliases: ['methods', 'approach', 'research design'],
        critical: true,
        minWords: 200,
        description: 'Should outline the research approach, data collection, and analysis plan (concise)'
      },
      {
        name: 'research questions',
        aliases: ['research problem', 'objectives', 'aims'],
        critical: true,
        minWords: 50,
        description: 'Should clearly state specific research questions or hypotheses'
      },
      {
        name: 'significance',
        aliases: ['importance', 'contribution', 'impact'],
        critical: false,
        minWords: 100,
        description: 'Should explain the importance and potential impact of the research'
      },
      {
        name: 'timeline',
        aliases: ['schedule', 'plan', 'milestones'],
        critical: false,
        minWords: 50,
        description: 'A brief timeline or plan for the proposed research'
      },
      {
        name: 'limitations',
        aliases: ['constraints', 'scope'],
        critical: false,
        minWords: 50,
        description: 'A short acknowledgement of scope and limitations'
      }
    ];

    const contentLower = content.toLowerCase();
    const sections = this.extractSections(content);

    // Check for missing sections with alias support
    const missingSections: string[] = [];
    const foundSections: string[] = [];

    requiredSections.forEach(section => {
      const allNames = [section.name, ...section.aliases];
      const isFound = allNames.some(name =>
        contentLower.includes(name) ||
        sections.some(s => s.title.toLowerCase().includes(name))
      );

      if (!isFound) {
        if (section.critical) {
          missingSections.push(section.name);
        }
      } else {
        foundSections.push(section.name);
      }
    });

    // Enhanced insufficient detail analysis with specific feedback
    const insufficientDetail: string[] = [];

    sections.forEach(section => {
      const sectionName = section.title.toLowerCase();
      const matchedRequirement = requiredSections.find(req =>
        req.name === sectionName || req.aliases.some(alias => sectionName.includes(alias))
      );

      if (matchedRequirement) {
        const wordCount = section.content.split(/\s+/).filter(w => w.length > 0).length;

        if (wordCount < matchedRequirement.minWords) {
          insufficientDetail.push(
            `${section.title} (${wordCount} words, needs ${matchedRequirement.minWords}+): ${matchedRequirement.description}`
          );
        }
      }
    });

    // Check for specific content requirements
    const contentRequirements = this.checkContentRequirements(content);

    // Enhanced completeness scoring
    const criticalSections = requiredSections.filter(s => s.critical);
    const foundCritical = criticalSections.filter(s => foundSections.includes(s.name));
    const sectionScore = foundCritical.length / criticalSections.length;

    const adequateDetailSections = sections.filter(s => {
      const wordCount = s.content.split(/\s+/).filter(w => w.length > 0).length;
      return wordCount >= 100; // Minimum threshold
    });
    const detailScore = sections.length > 0 ? adequateDetailSections.length / sections.length : 0;

    const contentScore = contentRequirements.score;

    const completenessScore = (sectionScore * 0.5 + detailScore * 0.3 + contentScore * 0.2);

    // Check for content quality indicators (only for content that seems incomplete)
    if (sections.length < 4 || completenessScore < 0.6) {
      const qualityIssues = this.analyzeContentQuality(content, sections);
      // Only add quality issues if the content is significantly lacking
      if (qualityIssues.length > 0 && completenessScore < 0.5) {
        insufficientDetail.push(...qualityIssues);
      }
    }

    // Add content requirement issues to missing sections
    contentRequirements.missing.forEach(missing => {
      if (!missingSections.includes(missing)) {
        missingSections.push(missing);
      }
    });

    return {
      missingElements: missingSections,
      completenessScore,
      suggestions: [],
      missingSections,
      insufficientDetail
    };
  }

  /**
   * Check for specific content requirements
   */
  private checkContentRequirements(content: string): { score: number, missing: string[] } {
    const contentLower = content.toLowerCase();
    const missing: string[] = [];
    let foundCount = 0;
    const totalRequirements = 8;

    // Check for thesis statement
    const hasThesisStatement = /thesis\s+statement|main\s+argument|central\s+claim|research\s+hypothesis/.test(contentLower);
    if (!hasThesisStatement) missing.push('thesis statement or main argument');
    else foundCount++;

    // Check for research questions
    const hasResearchQuestions = /research\s+question|research\s+problem|what\s+is|how\s+does|why\s+do/.test(contentLower);
    if (!hasResearchQuestions) missing.push('clear research questions');
    else foundCount++;

    // Check for literature citations
    const hasCitations = /\([A-Za-z]+[,\s]*\d{4}\)|\[\d+\]|\^\d+/.test(content);
    if (!hasCitations) missing.push('literature citations');
    else foundCount++;

    // Check for methodology description
    const hasMethodology = /method|approach|data\s+collection|analysis|survey|interview|experiment/.test(contentLower);
    if (!hasMethodology) missing.push('research methodology description');
    else foundCount++;

    // Check for significance/contribution
    const hasSignificance = /significance|important|contribution|impact|benefit|advance/.test(contentLower);
    if (!hasSignificance) missing.push('research significance or contribution');
    else foundCount++;

    // Check for scope/limitations
    const hasScope = /scope|limitation|constraint|boundary|exclude/.test(contentLower);
    if (!hasScope) missing.push('research scope or limitations');
    else foundCount++;

    // Check for timeline/plan
    const hasTimeline = /timeline|schedule|plan|phase|month|week|semester|year/.test(contentLower);
    if (!hasTimeline) missing.push('research timeline or plan');
    else foundCount++;

    // Check for expected outcomes
    const hasOutcomes = /outcome|result|finding|conclusion|expect|anticipate/.test(contentLower);
    if (!hasOutcomes) missing.push('expected outcomes or results');
    else foundCount++;

    return {
      score: foundCount / totalRequirements,
      missing
    };
  }

  /**
   * Generate concerns from analysis results
   */
  private generateConcerns(analysis: ContentAnalysis, conversationId: string): ProofreadingConcern[] {
    const concerns: ProofreadingConcern[] = [];
    
    // Generate structure concerns
    if (analysis.structure) {
      concerns.push(...this.generateStructureConcerns(analysis.structure, conversationId));
    }
    
    // Generate style concerns
    if (analysis.style) {
      concerns.push(...this.generateStyleConcerns(analysis.style, conversationId));
    }
    
    // Generate consistency concerns
    if (analysis.consistency) {
      concerns.push(...this.generateConsistencyConcerns(analysis.consistency, conversationId));
    }
    
    // Generate completeness concerns
    if (analysis.completeness) {
      concerns.push(...this.generateCompletenessConcerns(analysis.completeness, conversationId));
    }
    
    return concerns;
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

    if (structure.headingHierarchy && !structure.headingHierarchy.properHierarchy) {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.STRUCTURE,
        severity: ConcernSeverity.MEDIUM,
        title: 'Improper Heading Hierarchy',
        description: 'The document has issues with heading hierarchy that may confuse readers.',
        suggestions: ['Ensure heading levels follow a logical progression (H1 → H2 → H3)', 'Avoid skipping heading levels']
      }));
    }

    if (structure.sectionFlow && structure.sectionFlow.coherenceScore < 0.5) {
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
        category: ConcernCategory.ACADEMIC_TONE,
        severity: ConcernSeverity.HIGH,
        title: 'Insufficient Academic Tone',
        description: 'The writing style may not be sufficiently academic for a thesis proposal.',
        suggestions: ['Use more formal academic vocabulary', 'Incorporate discipline-specific terminology', 'Avoid colloquial expressions']
      }));
    }

    if (style.formalityLevel && style.formalityLevel < 0.4) {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.ACADEMIC_TONE,
        severity: ConcernSeverity.MEDIUM,
        title: 'Informal Language Usage',
        description: 'The document contains informal language that may not be appropriate for academic writing.',
        suggestions: ['Replace informal terms with formal alternatives', 'Use academic transition words', 'Maintain consistent formal tone']
      }));
    }

    if (style.clarityScore && style.clarityScore < 0.6) {
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
        category: ConcernCategory.CITATION,
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

    if (completeness.missingSections && completeness.missingSections.length > 0) {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.COMPLETENESS,
        severity: ConcernSeverity.HIGH,
        title: 'Missing Required Sections',
        description: `The following required sections are missing: ${completeness.missingSections?.join(', ')}`,
        suggestions: ['Add the missing sections to complete the proposal structure', 'Ensure all required components are addressed for a proposal']
      }));
    }

    if (completeness.insufficientDetail && completeness.insufficientDetail.length > 0) {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.COMPLETENESS,
        severity: ConcernSeverity.MEDIUM,
        title: 'Insufficient Detail in Sections',
        description: `The following sections need more development: ${completeness.insufficientDetail?.join(', ')}`,
        suggestions: ['Expand these sections with more detailed content appropriate for a proposal', 'Provide concise examples or planned approaches']
      }));
    }

    if (completeness.completenessScore < 0.5) {
      concerns.push(this.createConcern({
        conversationId,
        category: ConcernCategory.COMPLETENESS,
        severity: ConcernSeverity.HIGH,
        title: 'Overall Completeness Issues',
        description: 'The document appears to be incomplete and needs significant development.',
        suggestions: ['Review proposal requirements and ensure all components are addressed', 'Develop existing sections to clarify the planned work']
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
      text: params.description,
      category: params.category,
      severity: params.severity,
      status: ConcernStatus.TO_BE_DONE,
      suggestions: params.suggestions || [],
      relatedIdeas: [],
      position: { start: 0, end: 0 }, // Simple implementation
      explanation: params.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: params.title,
      description: params.description,
      location: params.location,
      conversationId: params.conversationId
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

  // Removed unused helper methods

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
    // Enhanced check for logical section ordering
    const expectedOrder = ['introduction', 'literature', 'methodology', 'results', 'discussion', 'conclusion'];
    const sectionTitles = sections.map(s => s.title.toLowerCase());

    // If we have fewer than 3 sections, consider it poor progression
    if (sections.length < 3) {
      return false;
    }

    let lastIndex = -1;
    let foundSections = 0;

    for (const title of sectionTitles) {
      const currentIndex = expectedOrder.findIndex(expected => title.includes(expected));
      if (currentIndex !== -1) {
        foundSections++;
        if (currentIndex < lastIndex) {
          return false; // Out of order
        }
        lastIndex = currentIndex;
      }
    }

    // If we found sections but they're out of order, return false
    // Also check if conclusion comes before introduction
    const hasIntro = sectionTitles.some(title => title.includes('introduction'));
    const hasConclusion = sectionTitles.some(title => title.includes('conclusion'));
    const introIndex = sectionTitles.findIndex(title => title.includes('introduction'));
    const conclusionIndex = sectionTitles.findIndex(title => title.includes('conclusion'));

    if (hasIntro && hasConclusion && introIndex > conclusionIndex) {
      return false;
    }

    return foundSections >= 2; // Need at least 2 ordered sections for good progression
  }

  private mapStyleIssueToCategory(issueType: string): ConcernCategory {
    switch (issueType) {
      case 'tone':
      case 'formality':
        return ConcernCategory.ACADEMIC_TONE;
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
           this.calculateStringSimilarity(concern1.title || '', concern2.title || '') > 0.7;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity
    const set1 = new Set(str1.toLowerCase().split(' '));
    const set2 = new Set(str2.toLowerCase().split(' '));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  // Removed unused helper method

  /**
   * Analyze content quality for completeness assessment
   */
  private analyzeContentQuality(content: string, sections: Array<{title: string, content: string}>): string[] {
    const issues: string[] = [];

    // Check for depth of analysis indicators
    const depthIndicators = [
      'analysis', 'examination', 'investigation', 'exploration', 'evaluation',
      'comparison', 'synthesis', 'interpretation', 'discussion', 'critique'
    ];

    const contentLower = content.toLowerCase();
    const depthCount = depthIndicators.filter(indicator =>
      contentLower.includes(indicator)
    ).length;

    if (depthCount < 3 && content.length > 500) {
      issues.push('Limited analytical depth - consider adding more analysis, evaluation, and critical discussion');
    }

    // Check for evidence and examples
    const evidenceIndicators = [
      'for example', 'for instance', 'such as', 'including', 'specifically',
      'data shows', 'results indicate', 'evidence suggests', 'studies demonstrate'
    ];

    const evidenceCount = evidenceIndicators.filter(indicator =>
      contentLower.includes(indicator)
    ).length;

    if (evidenceCount < 2 && content.length > 800) {
      issues.push('Limited use of examples and evidence - add specific examples and supporting data');
    }

    // Check for critical thinking indicators
    const criticalThinkingIndicators = [
      'however', 'although', 'despite', 'nevertheless', 'on the other hand',
      'alternatively', 'in contrast', 'conversely', 'whereas', 'while'
    ];

    const criticalCount = criticalThinkingIndicators.filter(indicator =>
      contentLower.includes(indicator)
    ).length;
    
    if (criticalCount < 2 && content.length > 600) {
      issues.push('Limited critical analysis - consider adding contrasting viewpoints and alternative perspectives');
    }

    // Check section balance
    if (sections.length > 2) {
      const wordCounts = sections.map(s => s.content.split(/\s+/).filter(w => w.length > 0).length);
      const maxWords = Math.max(...wordCounts);
      const minWords = Math.min(...wordCounts);

      if (maxWords > minWords * 3) {
        issues.push('Unbalanced section development - some sections are significantly longer than others');
      }
    }

    return issues;
  }

  /**
   * Check academic register appropriateness
   */
  private checkAcademicRegister(content: string): StyleIssue[] {
    const issues: StyleIssue[] = [];
    const contentLower = content.toLowerCase();

    // Check for contractions
    const contractions = ["don't", "won't", "can't", "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't", "hadn't"];
    const foundContractions = contractions.filter(contraction =>
      contentLower.includes(contraction)
    );

    if (foundContractions.length > 0) {
      issues.push({
        type: 'formality',
        description: `Found contractions: ${foundContractions.join(', ')}`,
        suggestion: 'Avoid contractions in academic writing. Use full forms: "do not" instead of "don\'t", "cannot" instead of "can\'t"'
      });
    }

    // Check for colloquialisms
    const colloquialisms = [
      'a bunch of', 'a lot of', 'tons of', 'loads of', 'heaps of',
      'kind of', 'sort of', 'pretty much', 'way too', 'super',
      'awesome', 'cool', 'neat', 'weird', 'crazy', 'insane'
    ];

    const foundColloquialisms = colloquialisms.filter(term =>
      contentLower.includes(term)
    );

    if (foundColloquialisms.length > 0) {
      issues.push({
        type: 'tone',
        description: `Colloquial expressions found: ${foundColloquialisms.slice(0, 3).join(', ')}`,
        suggestion: 'Replace colloquial expressions with formal academic language: "numerous" instead of "a bunch of", "significantly" instead of "way too"'
      });
    }

    // Check for appropriate academic phrases
    const academicPhrases = [
      'it is argued that', 'it can be seen that', 'it is evident that',
      'research suggests', 'studies indicate', 'evidence demonstrates',
      'furthermore', 'moreover', 'in addition', 'consequently'
    ];

    const foundAcademicPhrases = academicPhrases.filter(phrase =>
      contentLower.includes(phrase)
    ).length;

    if (foundAcademicPhrases < 2 && content.length > 500) {
      issues.push({
        type: 'tone',
        description: 'Limited use of academic phrases and expressions',
        suggestion: 'Incorporate more academic phrases: "It is argued that...", "Research suggests...", "Furthermore...", "Consequently..."'
      });
    }

    return issues;
  }

  /**
   * Enhanced coherence analysis with specific feedback on logical connections
   */
  private analyzeCoherencePatterns(content: string): { score: number, issues: string[], suggestions: string[] } {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for logical connectors
    const logicalConnectors = [
      'therefore', 'thus', 'consequently', 'as a result', 'hence',
      'however', 'nevertheless', 'nonetheless', 'on the contrary', 'conversely',
      'furthermore', 'moreover', 'additionally', 'in addition', 'similarly',
      'for example', 'for instance', 'specifically', 'namely', 'in particular',
      'first', 'second', 'third', 'finally', 'in conclusion', 'to summarize'
    ];

    const connectorCount = sentences.filter(sentence =>
      logicalConnectors.some(connector =>
        sentence.toLowerCase().includes(connector)
      )
    ).length;

    const connectorRatio = connectorCount / Math.max(sentences.length, 1);

    if (connectorRatio < 0.2 && sentences.length > 5) {
      issues.push('Limited use of logical connectors between ideas');
      suggestions.push('Add transitional phrases to show relationships between ideas (e.g., "Furthermore," "However," "As a result")');
    }

    // Check for topic sentence patterns
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    let weakTopicSentences = 0;

    paragraphs.forEach(paragraph => {
      const firstSentence = paragraph.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length < 50) {
        weakTopicSentences++;
      }
    });

    if (weakTopicSentences > paragraphs.length * 0.5) {
      issues.push('Many paragraphs lack strong topic sentences');
      suggestions.push('Begin each paragraph with a clear topic sentence that introduces the main idea');
    }

    // Calculate overall coherence score
    const coherenceScore = Math.max(0, 1 - (issues.length * 0.3));

    return { score: coherenceScore, issues, suggestions };
  }
}

/**
 * Factory function to create concern analysis engine
 */
export function createConcernAnalysisEngine(apiKey: string): ConcernAnalysisEngine {
  return new ConcernAnalysisEngineImpl(apiKey);
}