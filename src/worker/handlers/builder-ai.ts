import { Context } from "hono";
import { getSupabase, SupabaseEnv } from "../lib/supabase";
import { Env } from "../types/env";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

import { getGoogleGenerativeAIKey } from "../lib/api-keys";
import { createAIContextManager } from "../lib/ai-context-manager";
import { AcademicContextAnalyzer } from "../lib/academic-context-analyzer";
import { 
  AIPromptRequest, 
  AIContinueRequest, 
  AIModifyRequest, 
  AIResponse,
  ModificationType 
} from "../../lib/ai-types";

/**
 * Builder AI Handler - Prompt Mode
 * Handles AI content generation based on user prompts
 */
export async function builderAIPromptHandler(
  c: Context<{ Bindings: Env & SupabaseEnv }>
): Promise<Response> {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json();
    const { prompt, documentContent, cursorPosition, conversationId }: AIPromptRequest = body;
    
    // Validate required fields
    if (!prompt || !conversationId) {
      return c.json({ 
        success: false, 
        error: "Prompt and conversationId are required." 
      } as AIResponse, 400);
    }
    
    const supabase = getSupabase(c.env);
    const contextManager = createAIContextManager(supabase);
    
    // Build context for AI processing
    const context = await contextManager.buildContext(
      documentContent || "", 
      conversationId, 
      cursorPosition
    );
    
    const formattedContext = contextManager.formatContextForAI(context);
    
    // Get AI API key
    const apiKey = getGoogleGenerativeAIKey(c);
    if (!apiKey) {
      return c.json({ 
        success: false, 
        error: "AI service is currently unavailable." 
      } as AIResponse, 500);
    }
    
    const google = createGoogleGenerativeAI({ apiKey });
    
    // Get academic writing guidelines
    const academicGuidelines = contextManager.getAcademicWritingGuidelines(context);
    
    // Create AI prompt for content generation with academic context
    const aiPrompt = `You are an AI assistant helping with thesis proposal writing. Generate content based on the user's prompt while maintaining strict academic standards and integrating with existing context.

${formattedContext}

## Academic Writing Guidelines
${academicGuidelines}

## User Prompt
${prompt}

## Instructions
- Generate content that directly addresses the user's prompt
- STRICTLY maintain academic writing style appropriate for the detected academic level and discipline
- Use markdown formatting that matches the existing document structure
- Ensure content integrates seamlessly with existing document structure and thesis sections
- If idea definitions are available, incorporate them naturally and accurately when relevant
- If citations are present in the document, maintain the same citation format
- Preserve any existing academic terminology and key concepts
- Keep the response focused, substantive, and academically rigorous
- Do not include explanatory text about what you're doing, just provide the requested content
- Ensure the generated content contributes meaningfully to the thesis proposal

Generate the content:`;

    // Generate AI response
    const { text, usage } = await generateText({
      model: google("gemini-1.5-flash-latest"),
      prompt: aiPrompt,
    });
    
    // Validate academic quality of generated content
    let academicValidation;
    if (context.academicContext) {
      academicValidation = AcademicContextAnalyzer.validateAcademicContent(text, context.academicContext);
    }
    
    const processingTime = Date.now() - startTime;
    
    return c.json({
      success: true,
      content: text,
      metadata: {
        tokensUsed: usage?.totalTokens || 0,
        processingTime,
        academicValidation
      }
    } as AIResponse);
    
  } catch (err: unknown) {
    console.error("Error in builder AI prompt handler:", err);
    const processingTime = Date.now() - startTime;
    
    return c.json({
      success: false,
      error: "Failed to generate content. Please try again.",
      metadata: {
        tokensUsed: 0,
        processingTime
      }
    } as AIResponse, 500);
  }
}

/**
 * Builder AI Handler - Continue Mode
 * Handles AI content continuation based on cursor position and context
 */
export async function builderAIContinueHandler(
  c: Context<{ Bindings: Env & SupabaseEnv }>
): Promise<Response> {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json();
    const { documentContent, cursorPosition, selectedText, conversationId }: AIContinueRequest = body;
    
    // Validate required fields
    if (!conversationId) {
      return c.json({ 
        success: false, 
        error: "ConversationId is required." 
      } as AIResponse, 400);
    }
    
    const supabase = getSupabase(c.env);
    const contextManager = createAIContextManager(supabase);
    
    // Build context for AI processing
    const context = await contextManager.buildContext(
      documentContent || "", 
      conversationId, 
      cursorPosition,
      selectedText
    );
    
    const formattedContext = contextManager.formatContextForAI(context);
    
    // Get AI API key
    const apiKey = getGoogleGenerativeAIKey(c);
    if (!apiKey) {
      return c.json({ 
        success: false, 
        error: "AI service is currently unavailable." 
      } as AIResponse, 500);
    }
    
    const google = createGoogleGenerativeAI({ apiKey });
    
    // Analyze content around cursor position for better continuation
    const beforeCursor = (documentContent || "").substring(0, cursorPosition);
    const afterCursor = (documentContent || "").substring(cursorPosition);
    
    // Analyze style and tone consistency
    const styleAnalysis = analyzeWritingStyle(beforeCursor);
    
    // Check if there's sufficient context for continuation
    const contextSufficiency = assessContextSufficiency(beforeCursor, selectedText);
    
    let aiPrompt: string;
    
    // Get academic writing guidelines
    const academicGuidelines = contextManager.getAcademicWritingGuidelines(context);
    
    if (!contextSufficiency.sufficient) {
      // Fallback prompting for insufficient context
      aiPrompt = createFallbackPrompt(formattedContext, contextSufficiency.reason, styleAnalysis, academicGuidelines);
    } else {
      // Standard continuation prompt with style consistency
      aiPrompt = createContinuationPrompt(
        formattedContext, 
        beforeCursor, 
        afterCursor, 
        selectedText, 
        styleAnalysis,
        academicGuidelines
      );
    }

    // Generate AI response
    const { text, usage } = await generateText({
      model: google("gemini-1.5-flash-latest"),
      prompt: aiPrompt,
    });
    
    // Validate academic quality of generated content
    let academicValidation;
    if (context.academicContext) {
      academicValidation = AcademicContextAnalyzer.validateAcademicContent(text, context.academicContext);
    }
    
    const processingTime = Date.now() - startTime;
    
    return c.json({
      success: true,
      content: text,
      metadata: {
        tokensUsed: usage?.totalTokens || 0,
        processingTime,
        contextSufficiency: contextSufficiency.sufficient,
        styleAnalysis: styleAnalysis.summary,
        academicValidation
      }
    } as AIResponse);
    
  } catch (err: unknown) {
    console.error("Error in builder AI continue handler:", err);
    const processingTime = Date.now() - startTime;
    
    return c.json({
      success: false,
      error: "Failed to continue content. Please try again.",
      metadata: {
        tokensUsed: 0,
        processingTime
      }
    } as AIResponse, 500);
  }
}

/**
 * Builder AI Handler - Modify Mode
 * Handles AI text modification based on selected text and modification type
 */
export async function builderAIModifyHandler(
  c: Context<{ Bindings: Env & SupabaseEnv }>
): Promise<Response> {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json();
    const { selectedText, modificationType, documentContent, conversationId, customPrompt }: AIModifyRequest = body;
    
    // Validate required fields
    if (!selectedText || !modificationType || !conversationId) {
      return c.json({ 
        success: false, 
        error: "Selected text, modification type, and conversationId are required." 
      } as AIResponse, 400);
    }
    
    // Validate modification type
    if (!Object.values(ModificationType).includes(modificationType)) {
      return c.json({ 
        success: false, 
        error: "Invalid modification type." 
      } as AIResponse, 400);
    }
    
    const supabase = getSupabase(c.env);
    const contextManager = createAIContextManager(supabase);
    
    // Build context for AI processing
    const context = await contextManager.buildContext(
      documentContent || "", 
      conversationId, 
      0,
      selectedText
    );
    
    const formattedContext = contextManager.formatContextForAI(context);
    
    // Get AI API key
    const apiKey = getGoogleGenerativeAIKey(c);
    if (!apiKey) {
      return c.json({ 
        success: false, 
        error: "AI service is currently unavailable." 
      } as AIResponse, 500);
    }
    
    const google = createGoogleGenerativeAI({ apiKey });
    
    // Get academic writing guidelines
    const academicGuidelines = contextManager.getAcademicWritingGuidelines(context);
    
    // Create modification-specific instructions
    const modificationInstructions = getModificationInstructions(modificationType, customPrompt);
    
    // Create AI prompt for text modification with academic context
    const aiPrompt = `You are an AI assistant helping with thesis proposal writing. Modify the selected text according to the specified modification type while maintaining strict academic standards and document consistency.

${formattedContext}

## Academic Writing Guidelines
${academicGuidelines}

## Selected Text to Modify
"${selectedText}"

## Modification Type: ${modificationType}
${modificationInstructions}

## Instructions
- Apply the specified modification to the selected text only
- STRICTLY maintain academic writing style and tone appropriate for the detected academic level
- Preserve markdown formatting where appropriate and maintain document structure consistency
- Ensure the modified text fits seamlessly within the document context and thesis structure
- If idea definitions are available, incorporate them accurately when relevant
- If citations are present in the original text, maintain or improve the citation format
- Preserve any academic terminology and key concepts from the original text
- Ensure the modification enhances the academic quality and rigor of the content
- Do not include explanatory text, just provide the modified content
- The output should be a direct replacement for the selected text that maintains academic integrity

Modified content:`;

    // Generate AI response
    const { text, usage } = await generateText({
      model: google("gemini-1.5-flash-latest"),
      prompt: aiPrompt,
    });
    
    // Validate academic quality of generated content
    let academicValidation;
    if (context.academicContext) {
      academicValidation = AcademicContextAnalyzer.validateAcademicContent(text, context.academicContext);
    }
    
    const processingTime = Date.now() - startTime;
    
    return c.json({
      success: true,
      content: text,
      metadata: {
        tokensUsed: usage?.totalTokens || 0,
        processingTime,
        academicValidation
      }
    } as AIResponse);
    
  } catch (err: unknown) {
    console.error("Error in builder AI modify handler:", err);
    const processingTime = Date.now() - startTime;
    
    return c.json({
      success: false,
      error: "Failed to modify content. Please try again.",
      metadata: {
        tokensUsed: 0,
        processingTime
      }
    } as AIResponse, 500);
  }
}

/**
 * Get modification-specific instructions for AI prompts
 */
function getModificationInstructions(modificationType: ModificationType, customPrompt?: string): string {
  switch (modificationType) {
    case ModificationType.REWRITE:
      return "Rewrite the text to improve clarity, flow, and academic quality while preserving the original meaning and key points.";
    
    case ModificationType.EXPAND:
      return "Expand the text by adding more detail, examples, explanations, or supporting information while maintaining the original structure and meaning.";
    
    case ModificationType.SUMMARIZE:
      return "Summarize the text to capture the essential points in a more concise form while preserving the key information and academic tone.";
    
    case ModificationType.IMPROVE_CLARITY:
      return "Improve the clarity and readability of the text by simplifying complex sentences, improving word choice, and enhancing logical flow.";
    
    case ModificationType.PROMPT:
      return customPrompt || "Modify the text according to the provided instructions.";
    
    default:
      return "Improve the text according to general academic writing best practices.";
  }
}

/**
 * Writing style analysis interface
 */
interface WritingStyleAnalysis {
  tone: 'formal' | 'informal' | 'academic' | 'conversational' | 'mixed';
  complexity: 'simple' | 'moderate' | 'complex';
  sentenceLength: 'short' | 'medium' | 'long' | 'varied';
  vocabulary: 'basic' | 'intermediate' | 'advanced' | 'technical';
  structure: 'linear' | 'hierarchical' | 'narrative' | 'analytical';
  summary: string;
}

/**
 * Context sufficiency assessment interface
 */
interface ContextSufficiency {
  sufficient: boolean;
  reason: string;
  suggestions: string[];
}

/**
 * Analyze writing style and tone from existing content
 */
function analyzeWritingStyle(content: string): WritingStyleAnalysis {
  const words = content.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Analyze tone based on vocabulary and structure
  const academicKeywords = ['research', 'study', 'analysis', 'methodology', 'findings', 'conclusion', 'hypothesis', 'literature', 'framework', 'theoretical'];
  const formalKeywords = ['furthermore', 'however', 'therefore', 'consequently', 'moreover', 'nevertheless', 'accordingly'];
  const informalKeywords = ['really', 'pretty', 'quite', 'sort of', 'kind of', 'basically', 'actually'];
  
  const academicCount = words.filter(word => academicKeywords.some(keyword => word.includes(keyword))).length;
  const formalCount = words.filter(word => formalKeywords.some(keyword => word.includes(keyword))).length;
  const informalCount = words.filter(word => informalKeywords.some(keyword => word.includes(keyword))).length;
  
  let tone: WritingStyleAnalysis['tone'] = 'mixed';
  if (academicCount > formalCount && academicCount > informalCount) {
    tone = 'academic';
  } else if (formalCount > informalCount) {
    tone = 'formal';
  } else if (informalCount > 0) {
    tone = 'informal';
  } else {
    tone = 'conversational';
  }
  
  // Analyze sentence complexity
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
  let sentenceLength: WritingStyleAnalysis['sentenceLength'] = 'medium';
  if (avgSentenceLength < 10) {
    sentenceLength = 'short';
  } else if (avgSentenceLength > 20) {
    sentenceLength = 'long';
  } else if (sentences.some(s => s.split(/\s+/).length < 8) && sentences.some(s => s.split(/\s+/).length > 15)) {
    sentenceLength = 'varied';
  }
  
  // Analyze vocabulary complexity
  const complexWords = words.filter(word => word.length > 8).length;
  const complexityRatio = words.length > 0 ? complexWords / words.length : 0;
  let vocabulary: WritingStyleAnalysis['vocabulary'] = 'intermediate';
  if (complexityRatio > 0.3) {
    vocabulary = 'advanced';
  } else if (complexityRatio > 0.2 || academicCount > 0) {
    vocabulary = 'technical';
  } else if (complexityRatio < 0.1) {
    vocabulary = 'basic';
  }
  
  // Analyze overall complexity
  let complexity: WritingStyleAnalysis['complexity'] = 'moderate';
  if (avgSentenceLength > 18 && complexityRatio > 0.25) {
    complexity = 'complex';
  } else if (avgSentenceLength < 12 && complexityRatio < 0.15) {
    complexity = 'simple';
  }
  
  // Analyze structure based on headings and organization
  const hasHeadings = content.includes('#');
  const hasLists = content.includes('-') || content.includes('*') || /\d+\./.test(content);
  let structure: WritingStyleAnalysis['structure'] = 'linear';
  if (hasHeadings && hasLists) {
    structure = 'hierarchical';
  } else if (academicCount > 0 && formalCount > 0) {
    structure = 'analytical';
  } else if (content.includes('first') || content.includes('then') || content.includes('finally')) {
    structure = 'narrative';
  }
  
  const summary = `${tone} tone with ${complexity} complexity, ${sentenceLength} sentences, and ${vocabulary} vocabulary in a ${structure} structure`;
  
  return {
    tone,
    complexity,
    sentenceLength,
    vocabulary,
    structure,
    summary
  };
}

/**
 * Assess whether there's sufficient context for content continuation
 */
function assessContextSufficiency(beforeCursor: string, selectedText?: string): ContextSufficiency {
  const wordCount = beforeCursor.trim().split(/\s+/).filter(word => word.length > 0).length;
  const hasStructure = beforeCursor.includes('#') || beforeCursor.includes('\n\n');
  const hasSubstantiveContent = wordCount > 10;
  
  // Check for incomplete sentences or thoughts
  const endsWithIncomplete = /[,;:]$/.test(beforeCursor.trim()) || 
                            beforeCursor.trim().endsWith('and') ||
                            beforeCursor.trim().endsWith('or') ||
                            beforeCursor.trim().endsWith('but');
  
  const suggestions: string[] = [];
  
  // Insufficient context scenarios
  if (wordCount < 5) {
    return {
      sufficient: false,
      reason: 'Very little content to continue from',
      suggestions: [
        'Add more initial content to establish context',
        'Provide a clear starting point or topic',
        'Consider using prompt mode instead for initial content generation'
      ]
    };
  }
  
  if (wordCount < 20 && !hasStructure && !selectedText) {
    suggestions.push('Add more context about the topic or direction');
    suggestions.push('Provide section headings to guide continuation');
    suggestions.push('Select relevant text to provide additional context');
  }
  
  if (!hasSubstantiveContent && !selectedText) {
    return {
      sufficient: false,
      reason: 'Insufficient substantive content for meaningful continuation',
      suggestions: [
        'Develop the current ideas further before continuing',
        'Add more specific details or examples',
        'Clarify the main points or arguments'
      ]
    };
  }
  
  // Context is sufficient
  return {
    sufficient: true,
    reason: 'Adequate context available for continuation',
    suggestions: []
  };
}

/**
 * Create fallback prompt for insufficient context scenarios
 */
function createFallbackPrompt(
  formattedContext: string,
  insufficiencyReason: string,
  styleAnalysis: WritingStyleAnalysis,
  academicGuidelines: string
): string {
  return `You are an AI assistant helping with thesis proposal writing. The user wants to continue their content, but there may be insufficient context for a natural continuation.

${formattedContext}

## Academic Writing Guidelines
${academicGuidelines}

## Context Assessment
**Issue:** ${insufficiencyReason}
**Detected Style:** ${styleAnalysis.summary}

## Fallback Instructions
Since there's limited context for continuation, please:
1. Generate content that could logically follow based on available context
2. Maintain the detected writing style: ${styleAnalysis.tone} tone with ${styleAnalysis.complexity} complexity
3. Use ${styleAnalysis.vocabulary} vocabulary appropriate for academic writing
4. Structure the content in a ${styleAnalysis.structure} manner
5. STRICTLY follow the academic writing guidelines provided
6. If the existing content suggests a topic, expand on that topic with academic rigor
7. If no clear topic is evident, provide general academic content that could fit in a thesis proposal
8. Generate 1-2 paragraphs that establish a foundation for further development
9. Use appropriate markdown formatting that matches the document structure
10. If idea definitions are available, incorporate them when relevant
11. Maintain any existing citation format and academic conventions
12. Do not include explanatory text about the lack of context

Generate continuation content:`;
}

/**
 * Create standard continuation prompt with style consistency
 */
function createContinuationPrompt(
  formattedContext: string,
  beforeCursor: string,
  afterCursor: string,
  selectedText: string | undefined,
  styleAnalysis: WritingStyleAnalysis,
  academicGuidelines: string
): string {
  return `You are an AI assistant helping with thesis proposal writing. Continue the content from where the user left off, maintaining strict consistency with the existing text style and tone while adhering to academic standards.

${formattedContext}

## Academic Writing Guidelines
${academicGuidelines}

## Content Analysis
**Content before cursor:** ${beforeCursor.slice(-300)}
**Content after cursor:** ${afterCursor.slice(0, 100)}
${selectedText ? `**Selected text for context:** ${selectedText}` : ''}

## Style Consistency Requirements
**Detected Style:** ${styleAnalysis.summary}
- **Tone:** Maintain ${styleAnalysis.tone} tone throughout
- **Complexity:** Keep ${styleAnalysis.complexity} complexity level
- **Sentence Length:** Use ${styleAnalysis.sentenceLength} sentences consistent with existing content
- **Vocabulary:** Employ ${styleAnalysis.vocabulary} vocabulary level
- **Structure:** Follow ${styleAnalysis.structure} organizational pattern

## Continuation Instructions
- Continue writing from the cursor position naturally and seamlessly
- Maintain EXACT consistency with the detected writing style and tone
- STRICTLY follow the academic writing guidelines provided
- Ensure logical flow and coherence with preceding content
- Use markdown formatting that matches the existing document structure
- If idea definitions are available, incorporate them naturally and accurately when relevant
- If citations are present, maintain the same citation format and style
- Generate 1-3 paragraphs of continuation content that advances the thesis argument
- Do not repeat content that already exists
- Do not change the established writing style, tone, or academic level
- Do not include explanatory text, just provide the continuation
- Ensure the continuation feels like it was written by the same author with academic rigor

Continue the content:`;
}