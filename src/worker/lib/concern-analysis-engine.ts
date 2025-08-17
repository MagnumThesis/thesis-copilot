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
import { proofreaderPerformanceMonitor } from '../../lib/proofreader-performance-monitor';
import { string } from "zod";
import { string } from "zod";
import { number } from "zod";
import { number } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { number } from "zod";
import { string } from "zod";
import { string } from "zod";
import { boolean } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { boolean } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { any } from "zod";
import { any } from "zod";
import { string } from "zod";
import { string } from "zod";
import { boolean } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { number } from "zod";
import { number } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { boolean } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { boolean } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { boolean } from "zod";
import { string } from "zod";
import { string } from "zod";
import { boolean } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { number } from "zod";
import { boolean } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { boolean } from "zod";
import { string } from "zod";
import { boolean } from "zod";
import { string } from "zod";
import { string } from "zod";
import { string } from "zod";
import { boolean } from "zod";
import { boolean } from "zod";
import { boolean } from "zod";
import { boolean } from "zod";

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

    return await proofreaderPerformanceMonitor.measureAsync(
      'full_content_analysis',
      async () => {
        // Perform comprehensive content analysis
        const contentAnalysis = await proofreaderPerformanceMonitor.measureAsync(
          'content_categorization',
          () => this.categorizeContent(content),
          { contentLength: content.length, ideaCount: ideaDefinitions.length }
        );
        
        // Generate AI-powered concerns
        const aiConcerns = await proofreaderPerformanceMonitor.measureAsync(
          'ai_concern_generation',
          () => this.generateAIConcerns(content, ideaDefinitions, contentAnalysis.result),
          { contentLength: content.length, ideaCount: ideaDefinitions.length }
        );
        
        // Generate structure-based concerns
        const structureConcerns = proofreaderPerformanceMonitor.measureSync(
          'structure_concern_generation',
          () => this.generateStructureConcerns(contentAnalysis.result.structure, conversationId),
          { operation: 'structure_analysis' }
        );
        
        // Generate style-based concerns
        const styleConcerns = proofreaderPerformanceMonitor.measureSync(
          'style_concern_generation',
          () => this.generateStyleConcerns(contentAnalysis.result.style, conversationId),
          { operation: 'style_analysis' }
        );
        
        // Generate consistency concerns
        const consistencyConcerns = proofreaderPerformanceMonitor.measureSync(
          'consistency_concern_generation',
          () => this.generateConsistencyConcerns(contentAnalysis.result.consistency, conversationId),
          { operation: 'consistency_analysis' }
        );
        
        // Generate completeness concerns
        const completenessConcerns = proofreaderPerformanceMonitor.measureSync(
          'completeness_concern_generation',
          () => this.generateCompletenessConcerns(contentAnalysis.result.completeness, conversationId),
          { operation: 'completeness_analysis' }
        );
        
        // Combine all concerns
        const allConcerns = [
          ...aiConcerns.result,
          ...structureConcerns.result,
          ...styleConcerns.result,
          ...consistencyConcerns.result,
          ...completenessConcerns.result
        ];
        
        // Remove duplicates and prioritize concerns
        return proofreaderPerformanceMonitor.measureSync(
          'concern_deduplication',
          () => this.prioritizeAndDeduplicateConcerns(allConcerns),
          { totalConcerns: allConcerns.length }
        ).result;
      },
      { 
        contentLength: content.length, 
        ideaCount: ideaDefinitions.length,
        conversationId 
      }
    ).then(result => result.result).catch(error => {
      console.error('Error in concern analysis:', error);
      throw new Error(`Failed to analyze content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    });
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
   * Validate academic style and tone with comprehensive analysis and specific feedback
   */
  async validateAcademicStyle(content: string): Promise<StyleAnalysis> {
    const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Enhanced academic tone analysis with expanded vocabulary
    const academicTerms = [
      'research', 'study', 'analysis', 'methodology', 'findings', 'conclusion',
      'hypothesis', 'literature', 'framework', 'theoretical', 'empirical',
      'investigation', 'examination', 'assessment', 'evaluation', 'systematic',
      'significant', 'substantial', 'comprehensive', 'extensive', 'rigorous',
      'demonstrate', 'indicate', 'suggest', 'reveal', 'establish', 'confirm',
      'propose', 'examine', 'investigate', 'analyze', 'synthesize', 'critique',
      'conceptual', 'paradigm', 'phenomenon', 'implications', 'correlation',
      'causation', 'variables', 'validity', 'reliability', 'generalizability',
      'statistical', 'qualitative', 'quantitative', 'longitudinal', 'cross-sectional',
      'meta-analysis', 'systematic review', 'peer-reviewed', 'scholarly', 'academic'
    ];
    
    const academicCount = words.filter(word => 
      academicTerms.some(term => word.includes(term))
    ).length;
    const academicTone = Math.min(academicCount / Math.max(words.length / 80, 1), 1);
    
    // Enhanced formality analysis
    const formalTerms = [
      'furthermore', 'however', 'therefore', 'consequently', 'moreover',
      'nevertheless', 'accordingly', 'subsequently', 'additionally',
      'specifically', 'particularly', 'notably', 'significantly', 'importantly',
      'alternatively', 'conversely', 'similarly', 'likewise', 'nonetheless'
    ];
    const informalTerms = [
      'really', 'pretty', 'quite', 'sort of', 'kind of', 'basically',
      'actually', 'totally', 'super', 'very', 'a lot', 'lots of',
      'tons of', 'bunch of', 'okay', 'ok', 'yeah', 'yep', 'nope'
    ];
    
    const formalCount = words.filter(word => formalTerms.includes(word)).length;
    const informalCount = words.filter(word => informalTerms.includes(word)).length;
    const formalityLevel = Math.max(0, Math.min(1, (formalCount - informalCount * 2) / Math.max(words.length / 100, 1) + 0.6));
    
    // Enhanced clarity analysis
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 25).length;
    const veryLongSentences = sentences.filter(s => s.split(/\s+/).length > 35).length;
    const shortSentences = sentences.filter(s => s.split(/\s+/).length < 8).length;
    
    // Calculate readability factors
    const complexWords = words.filter(word => word.length > 6).length;
    const complexityRatio = complexWords / Math.max(words.length, 1);
    
    const clarityScore = Math.max(0, 1 - 
      (longSentences / Math.max(sentences.length, 1)) * 0.3 - 
      (veryLongSentences / Math.max(sentences.length, 1)) * 0.5 - 
      Math.max(0, (avgSentenceLength - 20) / 30) * 0.2 -
      Math.max(0, complexityRatio - 0.3) * 0.3
    );
    
    // Comprehensive style issue detection with specific feedback
    const styleIssues: StyleIssue[] = [];
    
    // Check for informal language with specific examples and targeted suggestions
    if (informalCount > 0) {
      const foundInformal = words.filter(word => informalTerms.includes(word));
      const informalExamples = foundInformal.slice(0, 5).join(', ');
      const replacementSuggestions = this.getInformalReplacements(foundInformal.slice(0, 3));
      
      styleIssues.push({
        type: 'tone',
        description: `Found ${informalCount} informal terms: ${informalExamples}${foundInformal.length > 5 ? '...' : ''}`,
        suggestion: `Replace informal language with academic alternatives: ${replacementSuggestions}. Maintain consistent formal tone throughout the document.`
      });
    }
    
    // Check for hedging language appropriateness
    const hedgingTerms = ['might', 'could', 'possibly', 'perhaps', 'maybe', 'seems', 'appears'];
    const hedgingCount = words.filter(word => hedgingTerms.includes(word)).length;
    const hedgingRatio = hedgingCount / Math.max(words.length, 1);
    
    if (hedgingRatio > 0.02) {
      styleIssues.push({
        type: 'tone',
        description: `Excessive hedging language (${(hedgingRatio * 100).toFixed(1)}% of text) may weaken academic arguments`,
        suggestion: 'Balance cautious language with confident assertions. Use hedging strategically for uncertain claims, but state established facts directly.'
      });
    } else if (hedgingRatio < 0.005 && words.length > 200) {
      styleIssues.push({
        type: 'tone',
        description: 'Limited use of hedging language may make claims appear overstated',
        suggestion: 'Consider using appropriate hedging (e.g., "suggests", "indicates", "appears to") for claims that require qualification.'
      });
    }
    
    // Check for excessive first person with context
    const firstPersonCount = words.filter(word => ['i', 'me', 'my', 'we', 'us', 'our'].includes(word)).length;
    const firstPersonRatio = firstPersonCount / Math.max(words.length, 1);
    if (firstPersonRatio > 0.015) {
      styleIssues.push({
        type: 'formality',
        description: `Excessive use of first person pronouns (${(firstPersonRatio * 100).toFixed(1)}% of text)`,
        suggestion: 'Consider using passive voice ("it was found that...") or third person perspective ("the researcher examined...")'
      });
    }
    
    // Check for sentence length issues with specific feedback
    if (veryLongSentences > 0) {
      styleIssues.push({
        type: 'clarity',
        description: `${veryLongSentences} sentences exceed 35 words, which may impair readability`,
        suggestion: 'Break down complex sentences using semicolons, or split into multiple sentences for clarity'
      });
    } else if (longSentences > sentences.length * 0.4) {
      styleIssues.push({
        type: 'clarity',
        description: `${Math.round((longSentences / sentences.length) * 100)}% of sentences are over 25 words`,
        suggestion: 'Consider shortening some sentences to improve readability and flow'
      });
    }
    
    // Check for sentence variety
    if (shortSentences > sentences.length * 0.6) {
      styleIssues.push({
        type: 'sentence_structure',
        description: 'Many sentences are very short, which may create choppy flow',
        suggestion: 'Vary sentence length by combining related ideas with conjunctions or subordinate clauses'
      });
    }
    
    // Check for weak vocabulary with specific examples
    const weakWords = words.filter(word => ['thing', 'stuff', 'good', 'bad', 'nice', 'big', 'small', 'get', 'got', 'make', 'do'].includes(word));
    if (weakWords.length > 0) {
      const uniqueWeak = [...new Set(weakWords)];
      styleIssues.push({
        type: 'wordChoice',
        description: `Use of vague terms: ${uniqueWeak.slice(0, 5).join(', ')}${uniqueWeak.length > 5 ? '...' : ''}`,
        suggestion: 'Replace vague terms with precise academic vocabulary (e.g., "significant" instead of "big", "obtain" instead of "get")'
      });
    }
    
    // Check for repetitive language patterns
    const wordFrequency = new Map<string, number>();
    words.forEach(word => {
      if (word.length > 4) {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      }
    });
    
    const overusedWords = Array.from(wordFrequency.entries())
      .filter(([word, count]) => count > Math.max(3, words.length / 100) && !academicTerms.includes(word))
      .map(([word]) => word);
    
    if (overusedWords.length > 0) {
      styleIssues.push({
        type: 'wordChoice',
        description: `Repetitive use of words: ${overusedWords.slice(0, 3).join(', ')}`,
        suggestion: 'Use synonyms and varied vocabulary to avoid repetition and maintain reader interest'
      });
    }
    
    // Enhanced passive voice analysis
    const passiveIndicators = ['was', 'were', 'been', 'being'];
    const passiveCount = words.filter(word => passiveIndicators.includes(word)).length;
    const passiveRatio = passiveCount / Math.max(sentences.length, 1);
    
    if (passiveRatio > 0.8) {
      styleIssues.push({
        type: 'sentence_structure',
        description: `Excessive passive voice usage (${(passiveRatio * 100).toFixed(0)}% of sentences)`,
        suggestion: 'Balance passive voice with active constructions. Use active voice for clarity: "The researcher analyzed" instead of "The data was analyzed"'
      });
    } else if (passiveRatio < 0.2 && sentences.length > 5) {
      styleIssues.push({
        type: 'sentence_structure',
        description: 'Limited use of passive voice may be inappropriate for academic writing',
        suggestion: 'Academic writing often requires some passive voice for objectivity. Consider: "The results were analyzed" when the actor is less important than the action'
      });
    }
    
    // Check for nominalization overuse
    const nominalizationSuffixes = ['tion', 'sion', 'ment', 'ness', 'ity', 'ance', 'ence'];
    const nominalizations = words.filter(word => 
      nominalizationSuffixes.some(suffix => word.endsWith(suffix)) && word.length > 6
    );
    const nominalizationRatio = nominalizations.length / Math.max(words.length, 1);
    
    if (nominalizationRatio > 0.15) {
      styleIssues.push({
        type: 'wordChoice',
        description: `Heavy use of nominalizations (${(nominalizationRatio * 100).toFixed(1)}% of words) may reduce clarity`,
        suggestion: 'Consider using verbs instead of nominalizations: "analyze" instead of "conduct an analysis", "decide" instead of "make a decision"'
      });
    }
    
    // Check for academic register appropriateness
    const academicRegisterIssues = this.checkAcademicRegister(content);
    styleIssues.push(...academicRegisterIssues);

    return {
      academicTone,
      formalityLevel,
      clarityScore,
      styleIssues
    };
  }

  /**
   * Generate AI-powered concerns using Google Generative AI with optimized prompts
   */
  private async generateAIConcerns(
    content: string, 
    ideaDefinitions: IdeaDefinition[], 
    contentAnalysis: ContentAnalysis
  ): Promise<ProofreadingConcern[]> {
    const google = createGoogleGenerativeAI({ apiKey: this.apiKey });
    
    // Optimize content length for faster processing
    const optimizedContent = this.optimizeContentForAI(content);
    
    // Build optimized context for AI analysis
    const ideaContext = this.buildOptimizedIdeaContext(ideaDefinitions);
    const analysisContext = this.formatOptimizedAnalysisContext(contentAnalysis);
    
    // Use optimized prompt for faster processing
    const prompt = this.buildOptimizedPrompt(ideaContext, analysisContext, optimizedContent);
    
    try {
      const result = await generateText({
        model: google("gemini-1.5-flash-latest"),
        prompt: prompt,
        // Optimize generation parameters for speed
        maxTokens: 2000, // Limit response length for faster processing
        temperature: 0.3, // Lower temperature for more focused responses
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
   * Optimize content for AI processing to improve speed
   */
  private optimizeContentForAI(content: string): string {
    // If content is short enough, return as-is
    if (content.length <= 8000) {
      return content;
    }

    // Extract key structural elements
    const lines = content.split('\n');
    const headings = lines.filter(line => line.match(/^#{1,6}\s+/));
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    
    // Keep headings and sample paragraphs for structure analysis
    const structuralContent = headings.join('\n');
    
    // Keep first and last paragraphs, and sample middle content
    const sampleParagraphs = [
      ...paragraphs.slice(0, 3), // First 3 paragraphs
      '...[content sample]...',
      ...paragraphs.slice(-3) // Last 3 paragraphs
    ];
    
    const optimizedContent = structuralContent + '\n\n' + sampleParagraphs.join('\n\n');
    
    // If still too long, truncate more aggressively
    if (optimizedContent.length > 8000) {
      return optimizedContent.substring(0, 7500) + '\n\n[Content truncated for analysis efficiency]';
    }
    
    return optimizedContent;
  }

  /**
   * Build optimized idea context for faster processing
   */
  private buildOptimizedIdeaContext(ideaDefinitions: IdeaDefinition[]): string {
    if (ideaDefinitions.length === 0) {
      return 'No idea definitions available.';
    }

    // Limit to most relevant ideas and truncate descriptions
    const relevantIdeas = ideaDefinitions
      .slice(0, 10) // Limit to 10 most relevant ideas
      .map(idea => ({
        title: idea.title,
        description: idea.description.length > 200 
          ? idea.description.substring(0, 200) + '...'
          : idea.description
      }));

    return `Key concepts: ${relevantIdeas.map(idea => `${idea.title}: ${idea.description}`).join(' | ')}`;
  }

  /**
   * Format optimized analysis context for faster processing
   */
  private formatOptimizedAnalysisContext(contentAnalysis: ContentAnalysis): string {
    const issues = [];
    
    // Structure issues
    if (!contentAnalysis.structure.hasIntroduction) {
      issues.push('Missing introduction');
    }
    if (!contentAnalysis.structure.hasConclusion) {
      issues.push('Missing conclusion');
    }
    if (contentAnalysis.structure.sectionFlow.flowIssues.length > 0) {
      issues.push('Flow issues detected');
    }

    // Style issues
    if (contentAnalysis.style.academicTone < 0.3) {
      issues.push('Low academic tone');
    }
    if (contentAnalysis.style.clarityScore < 0.6) {
      issues.push('Clarity concerns');
    }

    return issues.length > 0 ? `Pre-analysis findings: ${issues.join(', ')}` : 'No major structural issues detected';
  }

  /**
   * Build optimized prompt for faster AI processing
   */
  private buildOptimizedPrompt(ideaContext: string, analysisContext: string, content: string): string {
    // Use shorter, more focused prompt for better performance
    const promptTemplate = content.length > 5000 
      ? this.buildLongContentPrompt(ideaContext, analysisContext, content)
      : this.buildShortContentPrompt(ideaContext, analysisContext, content);
    
    return promptTemplate;
  }

  /**
   * Optimized prompt for short content (faster processing)
   */
  private buildShortContentPrompt(ideaContext: string, analysisContext: string, content: string): string {
    return `Analyze academic text for concerns. ${ideaContext ? `Context: ${ideaContext}` : ''}

Text: ${content}

Return JSON array with 3-5 key issues:
[{"category":"CLARITY|COHERENCE|STRUCTURE|ACADEMIC_STYLE|CONSISTENCY","severity":"low|medium|high|critical","title":"Brief title","description":"Issue description","suggestions":["Fix 1","Fix 2"]}]

Focus on critical issues only.`;
  }

  /**
   * Optimized prompt for long content (structured analysis)
   */
  private buildLongContentPrompt(ideaContext: string, analysisContext: string, content: string): string {
    return `Academic proofreader: Analyze thesis content for key concerns.

${ideaContext ? `Context: ${ideaContext}` : ''}
${analysisContext ? `Pre-analysis: ${analysisContext}` : ''}

Content:
${content}

Find 3-5 critical issues in categories: CLARITY, COHERENCE, STRUCTURE, ACADEMIC_STYLE, CONSISTENCY.

Return JSON array:
[{"category":"CLARITY","severity":"medium","title":"Issue title","description":"Brief description","suggestions":["Fix 1","Fix 2"]}]

Focus on actionable, high-impact concerns only.`;
  }

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
   * Analyze document structure with comprehensive organization checking
   */
  private async analyzeStructure(content: string): Promise<StructureAnalysis> {
    const lines = content.split('\n');
    const headings = lines.filter(line => line.match(/^#{1,6}\s+/));
    
    // Enhanced introduction detection
    const hasIntroduction = this.detectIntroduction(content, headings);
    
    // Enhanced conclusion detection  
    const hasConclusion = this.detectConclusion(content, headings);
    
    // Comprehensive section flow analysis
    const sectionFlow = this.analyzeSectionFlow(content, headings);
    
    // Enhanced heading hierarchy analysis
    const headingHierarchy = this.analyzeHeadingHierarchy(headings);
    
    return {
      hasIntroduction,
      hasConclusion,
      sectionFlow,
      headingHierarchy
    };
  }

  /**
   * Enhanced introduction detection
   */
  private detectIntroduction(content: string, headings: string[]): boolean {
    const contentLower = content.toLowerCase();
    
    // Check for explicit introduction headings
    const hasIntroHeading = headings.some(h => {
      const heading = h.toLowerCase();
      return heading.includes('introduction') || 
             heading.includes('intro') ||
             heading.includes('background') ||
             heading.includes('overview');
    });
    
    // Check for introduction indicators in content
    const introIndicators = [
      'this thesis', 'this research', 'this study', 'this paper',
      'the purpose of', 'the aim of', 'the objective',
      'research question', 'research problem', 'thesis statement'
    ];
    
    const hasIntroContent = introIndicators.some(indicator => 
      contentLower.includes(indicator)
    );
    
    return hasIntroHeading || hasIntroContent;
  }

  /**
   * Enhanced conclusion detection
   */
  private detectConclusion(content: string, headings: string[]): boolean {
    const contentLower = content.toLowerCase();
    
    // Check for explicit conclusion headings
    const hasConclusionHeading = headings.some(h => {
      const heading = h.toLowerCase();
      return heading.includes('conclusion') || 
             heading.includes('summary') ||
             heading.includes('final') ||
             heading.includes('discussion') ||
             heading.includes('implications');
    });
    
    // Check for conclusion indicators in content
    const conclusionIndicators = [
      'in conclusion', 'to conclude', 'in summary', 'to summarize',
      'finally', 'ultimately', 'overall', 'in closing',
      'future research', 'implications', 'recommendations'
    ];
    
    const hasConclusionContent = conclusionIndicators.some(indicator => 
      contentLower.includes(indicator)
    );
    
    return hasConclusionHeading || hasConclusionContent;
  }

  /**
   * Analyze section flow and logical progression with enhanced feedback
   */
  private analyzeSectionFlow(content: string, headings: string[]): FlowAnalysis {
    const sections = this.extractSections(content);
    
    // Check for logical progression with detailed analysis
    const logicalProgression = this.checkLogicalProgression(sections);
    
    // Enhanced transition analysis with categorization (excluding common words like "also")
    const transitionCategories = {
      addition: ['furthermore', 'moreover', 'additionally', 'in addition', 'besides'],
      contrast: ['however', 'nevertheless', 'nonetheless', 'in contrast', 'on the other hand', 'conversely'],
      causation: ['therefore', 'consequently', 'as a result', 'thus', 'hence', 'accordingly'],
      sequence: ['next', 'then', 'finally', 'subsequently'],
      example: ['for example', 'for instance', 'specifically', 'namely', 'in particular'],
      summary: ['in conclusion', 'to summarize', 'in summary', 'overall', 'in brief']
    };
    
    const words = content.toLowerCase().split(/\s+/);
    const allTransitions = Object.values(transitionCategories).flat();
    
    // Check for transition words in the content more accurately with word boundaries
    let transitionCount = 0;
    allTransitions.forEach(transition => {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${transition.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(content)) {
        transitionCount++;
      }
    });
    
    // Adjust calculation to be more sensitive to lack of transitions
    // For content without clear sections, use sentence count as basis
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const expectedTransitions = sections.length > 1 ? Math.max(sections.length - 1, 1) : Math.max(Math.floor(sentences.length / 3), 1);
    const transitionQuality = Math.min(transitionCount / expectedTransitions, 1);
    
    // Analyze transition variety
    const usedCategories = Object.entries(transitionCategories).filter(([_, transitions]) =>
      transitions.some(transition => content.toLowerCase().includes(transition))
    ).length;
    
    const transitionVariety = usedCategories / Object.keys(transitionCategories).length;
    
    // Enhanced coherence analysis
    const coherenceAnalysis = this.analyzeCoherencePatterns(content);
    const coherenceScore = (logicalProgression ? 0.4 : 0.1) + (transitionQuality * 0.4) + (coherenceAnalysis.score * 0.2);
    
    // Comprehensive flow issues identification
    const flowIssues: string[] = [];
    
    if (!logicalProgression) {
      const sectionTitles = sections.map(s => s.title).join(' → ');
      flowIssues.push(`Sections may not follow logical progression: ${sectionTitles}`);
    }
    
    if (transitionQuality < 0.3) {
      flowIssues.push('Limited use of transition words between ideas. Consider adding more connective phrases.');
    }
    
    if (transitionVariety < 0.4) {
      flowIssues.push('Limited variety in transition types. Use different types of transitions (contrast, causation, addition, etc.)');
    }
    
    if (sections.length > 0 && sections.some(s => s.content.length < 100)) {
      const shortSections = sections.filter(s => s.content.length < 100).map(s => s.title);
      flowIssues.push(`Underdeveloped sections: ${shortSections.join(', ')}`);
    }
    
    // Add coherence-specific issues
    flowIssues.push(...coherenceAnalysis.issues);
    
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
    
    // Check hierarchy levels - extract actual heading levels
    const levels = headings.map(h => {
      const match = h.match(/^(#{1,6})/);
      return match ? match[1].length : 1;
    });
    
    let properHierarchy = true;
    
    // Check for skipped levels
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
   * Enhanced terminology consistency analysis
   */
  private analyzeTerminologyConsistency(content: string): TerminologyIssue[] {
    const issues: TerminologyIssue[] = [];
    
    // Find potential terminology variations with better cleaning
    const words = content.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();
    
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length > 3 && !this.isCommonWord(cleaned)) {
        wordFreq.set(cleaned, (wordFreq.get(cleaned) || 0) + 1);
      }
    });
    
    // Look for similar terms that might be inconsistent
    const frequentWords = Array.from(wordFreq.entries())
      .filter(([_, freq]) => freq > 1)
      .map(([word, _]) => word);
    
    // Comprehensive academic term groups for consistency checking
    const academicTermGroups = [
      ['methodology', 'method', 'approach', 'technique'],
      ['analysis', 'analyze', 'analytical', 'examination'],
      ['research', 'study', 'investigation', 'inquiry'],
      ['framework', 'model', 'structure', 'paradigm'],
      ['data', 'information', 'evidence', 'findings'],
      ['participant', 'subject', 'respondent', 'interviewee'],
      ['questionnaire', 'survey', 'instrument', 'tool'],
      ['significant', 'important', 'crucial', 'critical'],
      ['demonstrate', 'show', 'indicate', 'reveal'],
      ['literature', 'research', 'studies', 'scholarship']
    ];
    
    // Check for British vs American spelling inconsistencies
    const spellingVariations = [
      ['analyze', 'analyse'],
      ['organization', 'organisation'],
      ['realize', 'realise'],
      ['behavior', 'behaviour'],
      ['color', 'colour'],
      ['center', 'centre'],
      ['defense', 'defence']
    ];
    
    // Check academic term consistency
    academicTermGroups.forEach(group => {
      const foundTerms = group.filter(term => frequentWords.includes(term));
      if (foundTerms.length > 1) {
        // Determine most frequent term as standard
        const termCounts = foundTerms.map(term => ({
          term,
          count: wordFreq.get(term) || 0
        }));
        const mostFrequent = termCounts.reduce((max, current) => 
          current.count > max.count ? current : max
        );
        
        issues.push({
          term: group[0], // Use the primary term from the group
          inconsistentUsage: foundTerms,
          suggestedStandardization: mostFrequent.term,
          locations: this.findTermLocations(content, foundTerms)
        });
      }
    });
    
    // Check spelling consistency
    spellingVariations.forEach(([american, british]) => {
      const hasAmerican = frequentWords.includes(american);
      const hasBritish = frequentWords.includes(british);
      
      if (hasAmerican && hasBritish) {
        const americanCount = wordFreq.get(american) || 0;
        const britishCount = wordFreq.get(british) || 0;
        const preferred = americanCount >= britishCount ? american : british;
        
        issues.push({
          term: american,
          inconsistentUsage: [american, british],
          suggestedStandardization: preferred,
          locations: this.findTermLocations(content, [american, british])
        });
      }
    });
    
    // Check for acronym consistency
    const acronymIssues = this.checkAcronymConsistency(content);
    issues.push(...acronymIssues);
    
    return issues;
  }

  /**
   * Check if a word is a common word that should be ignored
   */
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
      'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
      'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy',
      'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use', 'way', 'will',
      'with', 'that', 'this', 'have', 'from', 'they', 'know', 'want', 'been',
      'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just',
      'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them',
      'well', 'were', 'what', 'your'
    ];
    return commonWords.includes(word);
  }

  /**
   * Find locations of terms in content
   */
  private findTermLocations(content: string, terms: string[]): ContentLocation[] {
    const locations: ContentLocation[] = [];
    const lines = content.split('\n');
    
    terms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        // Find which line this match is on
        let lineNumber = 0;
        let charCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
          if (charCount + lines[i].length >= match.index) {
            lineNumber = i + 1;
            break;
          }
          charCount += lines[i].length + 1; // +1 for newline
        }
        
        // Get context around the match
        const contextStart = Math.max(0, match.index - 30);
        const contextEnd = Math.min(content.length, match.index + term.length + 30);
        const context = content.substring(contextStart, contextEnd);
        
        locations.push({
          paragraph: lineNumber,
          startPosition: match.index,
          endPosition: match.index + term.length,
          context: context.trim()
        });
      }
    });
    
    return locations;
  }

  /**
   * Check acronym consistency
   */
  private checkAcronymConsistency(content: string): TerminologyIssue[] {
    const issues: TerminologyIssue[] = [];
    
    // Find potential acronyms (2-6 uppercase letters)
    const acronymRegex = /\b[A-Z]{2,6}\b/g;
    const acronyms = content.match(acronymRegex) || [];
    const acronymFreq = new Map<string, number>();
    
    acronyms.forEach(acronym => {
      acronymFreq.set(acronym, (acronymFreq.get(acronym) || 0) + 1);
    });
    
    // Check if acronyms are properly defined
    const frequentAcronyms = Array.from(acronymFreq.entries())
      .filter(([_, freq]) => freq > 1)
      .map(([acronym, _]) => acronym);
    
    frequentAcronyms.forEach(acronym => {
      // Look for definition pattern: "Full Name (ACRONYM)" or "ACRONYM (Full Name)"
      const definitionPattern1 = new RegExp(`([A-Z][a-z\\s]+)\\s*\\(${acronym}\\)`, 'g');
      const definitionPattern2 = new RegExp(`${acronym}\\s*\\(([A-Z][a-z\\s]+)\\)`, 'g');
      
      const hasDefinition = definitionPattern1.test(content) || definitionPattern2.test(content);
      
      if (!hasDefinition && acronym.length > 2) {
        issues.push({
          term: acronym,
          inconsistentUsage: [acronym],
          suggestedStandardization: `${acronym} (define on first use)`,
          locations: this.findTermLocations(content, [acronym])
        });
      }
    });
    
    return issues;
  }

  /**
   * Enhanced citation consistency analysis with comprehensive checking
   */
  private analyzeCitationConsistency(content: string): CitationIssue[] {
    const issues: CitationIssue[] = [];
    
    // Enhanced citation format detection with more comprehensive patterns
    const citationPatterns = {
      APA: {
        pattern: /\([A-Za-z][A-Za-z\s&,]+,\s*\d{4}[a-z]?(?:,\s*p\.\s*\d+)?\)/g,
        examples: ['(Smith, 2020)', '(Johnson & Brown, 2019, p. 45)']
      },
      MLA: {
        pattern: /\([A-Za-z][A-Za-z\s]+\s+\d+(?:-\d+)?\)/g,
        examples: ['(Smith 123)', '(Johnson 45-67)']
      },
      Chicago: {
        pattern: /\^\d+|\(\d+\)/g,
        examples: ['^1', '(1)']
      },
      IEEE: {
        pattern: /\[\d+(?:-\d+)?(?:,\s*\d+)*\]/g,
        examples: ['[1]', '[1-3]', '[1, 5, 7]']
      },
      Harvard: {
        pattern: /\([A-Za-z][A-Za-z\s&,]+\s+\d{4}[a-z]?\)/g,
        examples: ['(Smith 2020)', '(Johnson & Brown 2019)']
      }
    };
    
    const foundFormats: Array<{format: string, count: number, examples: string[]}> = [];
    
    Object.entries(citationPatterns).forEach(([format, {pattern, examples}]) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        foundFormats.push({
          format,
          count: matches.length,
          examples: matches.slice(0, 3) // First 3 examples
        });
      }
    });
    
    // Check for multiple citation formats
    if (foundFormats.length > 1) {
      const formatDetails = foundFormats.map(f => `${f.format} (${f.count} instances)`).join(', ');
      issues.push({
        type: 'style_inconsistency',
        description: `Multiple citation formats detected: ${formatDetails}`,
        suggestion: `Choose one consistent format. Most common: ${foundFormats[0].format}. Ensure all citations follow the same style guide (APA, MLA, Chicago, etc.)`
      });
    }
    
    // Check for citation density and distribution
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const totalCitations = foundFormats.reduce((sum, format) => sum + format.count, 0);
    const citationDensity = totalCitations / Math.max(wordCount / 100, 1); // Citations per 100 words
    
    if (wordCount > 500 && citationDensity < 1) {
      issues.push({
        type: 'missing',
        description: `Low citation density (${citationDensity.toFixed(1)} citations per 100 words). Academic writing typically requires more frequent citation of sources`,
        suggestion: 'Increase citation frequency to support claims and demonstrate engagement with existing literature. Aim for 2-4 citations per 100 words in literature-heavy sections'
      });
    }
    
    // Comprehensive claim indicators for missing citations
    const claimIndicators = [
      'research shows', 'studies indicate', 'according to', 'evidence suggests',
      'it has been found', 'previous work', 'literature suggests', 'scholars argue',
      'research demonstrates', 'findings reveal', 'data shows', 'analysis indicates',
      'experts believe', 'researchers found', 'studies confirm', 'evidence demonstrates',
      'investigations show', 'surveys indicate', 'experiments reveal', 'observations suggest',
      'research establishes', 'studies prove', 'literature demonstrates', 'scholars maintain',
      'empirical evidence shows', 'statistical analysis reveals', 'meta-analysis indicates',
      'systematic review shows', 'longitudinal studies demonstrate', 'cross-sectional research',
      'qualitative research suggests', 'quantitative analysis reveals', 'case studies show',
      'experimental results indicate', 'observational studies demonstrate', 'survey data shows'
    ];
    
    // Check for missing citations with better context analysis
    claimIndicators.forEach(indicator => {
      const regex = new RegExp(indicator, 'gi');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const startPos = match.index;
        const endPos = Math.min(content.length, startPos + 150);
        const followingText = content.substring(startPos, endPos);
        
        // Look for any citation format within following text
        const hasCitation = foundFormats.some(format => 
          citationPatterns[format.format as keyof typeof citationPatterns].pattern.test(followingText)
        );
        
        if (!hasCitation) {
          // Get context for better feedback
          const contextStart = Math.max(0, startPos - 20);
          const contextEnd = Math.min(content.length, startPos + 80);
          const context = content.substring(contextStart, contextEnd).trim();
          
          issues.push({
            type: 'missing',
            description: `Claim "${indicator}" lacks citation support`,
            suggestion: 'Add appropriate citation to support this claim',
            location: {
              startPosition: startPos,
              endPosition: startPos + indicator.length,
              context: context
            }
          });
        }
      }
    });
    
    // Check for incomplete citations
    if (foundFormats.length > 0) {
      const primaryFormat = foundFormats[0];
      
      // Check for malformed citations based on primary format
      if (primaryFormat.format === 'APA') {
        const malformedAPA = /\([A-Za-z]+\s*\d{4}\)/g; // Missing comma
        const malformed = content.match(malformedAPA);
        if (malformed && malformed.length > 0) {
          issues.push({
            type: 'format',
            description: `${malformed.length} APA citations missing comma between author and year`,
            suggestion: 'Use format: (Author, Year) instead of (Author Year)'
          });
        }
      }
      
      // Check for missing page numbers in direct quotes
      const quotePattern = /"[^"]{20,}"/g;
      let quoteMatch;
      
      while ((quoteMatch = quotePattern.exec(content)) !== null) {
        const quote = quoteMatch[0];
        const quoteIndex = quoteMatch.index;
        const afterQuote = content.substring(quoteIndex + quote.length, quoteIndex + quote.length + 100);
        
        // Look for page numbers in various formats
        const hasPageNumber = /p\.\s*\d+|pp\.\s*\d+-\d+|:\s*\d+/.test(afterQuote);
        
        // Also check if there's a citation with page number
        const hasCitationWithPage = /\([^)]*,\s*p\.\s*\d+\)|\([^)]*:\s*\d+\)/.test(afterQuote);
        
        if (!hasPageNumber && !hasCitationWithPage) {
          issues.push({
            type: 'incomplete',
            description: 'Direct quote lacks page number citation',
            suggestion: 'Add page numbers for direct quotes (e.g., p. 123)',
            location: {
              startPosition: quoteIndex,
              endPosition: quoteIndex + quote.length,
              context: quote.substring(0, 50) + '...'
            }
          });
        }
      }
    }
    
    // Check for reference list consistency
    const hasReferenceSection = this.checkForReferenceSection(content);
    if (!hasReferenceSection && foundFormats.length > 0) {
      issues.push({
        type: 'missing',
        description: 'Citations found but no reference list detected',
        suggestion: 'Add a References/Bibliography section listing all cited sources'
      });
    }
    
    return issues;
  }

  /**
   * Check for reference section
   */
  private checkForReferenceSection(content: string): boolean {
    const referenceSectionIndicators = [
      /^#{1,3}\s*references?\s*$/im,
      /^#{1,3}\s*bibliography\s*$/im,
      /^#{1,3}\s*works?\s+cited\s*$/im,
      /^#{1,3}\s*literature\s+cited\s*$/im
    ];
    
    return referenceSectionIndicators.some(pattern => pattern.test(content));
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
    // Comprehensive required sections for thesis proposals with detailed requirements
    const requiredSections = [
      { 
        name: 'introduction', 
        aliases: ['intro', 'background', 'overview'], 
        critical: true,
        minWords: 200,
        description: 'Should establish context, state the problem, and outline objectives'
      },
      { 
        name: 'literature review', 
        aliases: ['related work', 'prior research', 'theoretical framework'], 
        critical: true,
        minWords: 400,
        description: 'Should synthesize existing research and identify gaps'
      },
      { 
        name: 'methodology', 
        aliases: ['methods', 'approach', 'research design'], 
        critical: true,
        minWords: 300,
        description: 'Should detail research approach, data collection, and analysis methods'
      },
      { 
        name: 'research questions', 
        aliases: ['research problem', 'objectives', 'aims'], 
        critical: true,
        minWords: 100,
        description: 'Should clearly state specific research questions or hypotheses'
      },
      { 
        name: 'significance', 
        aliases: ['importance', 'contribution', 'impact'], 
        critical: false,
        minWords: 150,
        description: 'Should explain the importance and potential impact of the research'
      },
      { 
        name: 'timeline', 
        aliases: ['schedule', 'plan', 'milestones'], 
        critical: false,
        minWords: 100,
        description: 'Should provide realistic timeline for research completion'
      },
      { 
        name: 'limitations', 
        aliases: ['constraints', 'scope'], 
        critical: false,
        minWords: 100,
        description: 'Should acknowledge research limitations and scope boundaries'
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
      missingSections,
      insufficientDetail,
      completenessScore
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
      // Clean response for better parsing
      const cleanedResponse = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      // Try to extract JSON array from the response
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsed) ? parsed : [];
      }
      
      // Try parsing the entire response as JSON
      try {
        const parsed = JSON.parse(cleanedResponse);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // Continue to fallback parsing
      }
      
      // Fallback: parse line by line for malformed JSON
      const lines = cleanedResponse.split('\n').filter(line => line.trim());
      const concerns = [];
      
      for (const line of lines) {
        if (line.includes('"category"') && line.includes('"severity"')) {
          try {
            // Try to fix common JSON issues
            let fixedLine = line.trim();
            if (!fixedLine.startsWith('{')) {
              fixedLine = '{' + fixedLine;
            }
            if (!fixedLine.endsWith('}')) {
              fixedLine = fixedLine + '}';
            }
            
            const concern = JSON.parse(fixedLine);
            if (concern.category && concern.severity && concern.title) {
              concerns.push(concern);
            }
          } catch {
            // Skip invalid lines
          }
        }
      }
      
      return concerns;
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

  /**
   * Get specific replacement suggestions for informal terms
   */
  private getInformalReplacements(informalTerms: string[]): string {
    const replacements: Record<string, string> = {
      'really': 'significantly/substantially',
      'pretty': 'considerably/notably',
      'quite': 'rather/somewhat',
      'sort of': 'somewhat/partially',
      'kind of': 'somewhat/partially',
      'basically': 'essentially/fundamentally',
      'actually': 'in fact/indeed',
      'totally': 'completely/entirely',
      'super': 'extremely/highly',
      'very': 'highly/considerably',
      'a lot': 'numerous/substantial',
      'lots of': 'numerous/many',
      'tons of': 'numerous/extensive',
      'bunch of': 'several/multiple',
      'okay': 'acceptable/adequate',
      'ok': 'acceptable/adequate'
    };

    return informalTerms
      .map(term => `"${term}" → "${replacements[term] || 'formal alternative'}"`)
      .join(', ');
  }

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