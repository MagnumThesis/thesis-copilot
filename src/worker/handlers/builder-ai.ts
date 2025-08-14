import { Context } from "hono";
import { getSupabase, SupabaseEnv } from "../lib/supabase";
import { Env } from "../types/env";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

import { getGoogleGenerativeAIKey } from "../lib/api-keys";
import { createAIContextManager } from "../lib/ai-context-manager";
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
    
    // Create AI prompt for content generation
    const aiPrompt = `You are an AI assistant helping with thesis proposal writing. Generate content based on the user's prompt while maintaining academic tone and style.

${formattedContext}

## User Prompt
${prompt}

## Instructions
- Generate content that directly addresses the user's prompt
- Maintain academic writing style appropriate for thesis proposals
- Use markdown formatting for structure
- Ensure content integrates well with existing document structure
- If idea definitions are available, incorporate them naturally when relevant
- Keep the response focused and concise
- Do not include explanatory text about what you're doing, just provide the requested content

Generate the content:`;

    // Generate AI response
    const { text, usage } = await generateText({
      model: google("gemini-1.5-flash-latest"),
      prompt: aiPrompt,
    });
    
    const processingTime = Date.now() - startTime;
    
    return c.json({
      success: true,
      content: text,
      metadata: {
        tokensUsed: usage?.totalTokens || 0,
        processingTime
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
    
    // Create AI prompt for content continuation
    const aiPrompt = `You are an AI assistant helping with thesis proposal writing. Continue the content from where the user left off, maintaining consistency with the existing text.

${formattedContext}

## Content Analysis
**Content before cursor:** ${beforeCursor.slice(-300)}
**Content after cursor:** ${afterCursor.slice(0, 100)}
${selectedText ? `**Selected text for context:** ${selectedText}` : ''}

## Instructions
- Continue writing from the cursor position naturally
- Maintain the same writing style, tone, and academic level as the existing content
- Ensure logical flow and coherence with preceding content
- Use appropriate markdown formatting consistent with the document
- If idea definitions are available, incorporate them when relevant
- Generate 1-3 paragraphs of continuation content
- Do not repeat content that already exists
- Do not include explanatory text, just provide the continuation

Continue the content:`;

    // Generate AI response
    const { text, usage } = await generateText({
      model: google("gemini-1.5-flash-latest"),
      prompt: aiPrompt,
    });
    
    const processingTime = Date.now() - startTime;
    
    return c.json({
      success: true,
      content: text,
      metadata: {
        tokensUsed: usage?.totalTokens || 0,
        processingTime
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
    const { selectedText, modificationType, documentContent, conversationId }: AIModifyRequest = body;
    
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
    
    // Create modification-specific instructions
    const modificationInstructions = getModificationInstructions(modificationType);
    
    // Create AI prompt for text modification
    const aiPrompt = `You are an AI assistant helping with thesis proposal writing. Modify the selected text according to the specified modification type while maintaining academic standards.

${formattedContext}

## Selected Text to Modify
"${selectedText}"

## Modification Type: ${modificationType}
${modificationInstructions}

## Instructions
- Apply the specified modification to the selected text only
- Maintain academic writing style and tone
- Preserve markdown formatting where appropriate
- Ensure the modified text fits well within the document context
- If idea definitions are available, incorporate them when relevant
- Do not include explanatory text, just provide the modified content
- The output should be a direct replacement for the selected text

Modified content:`;

    // Generate AI response
    const { text, usage } = await generateText({
      model: google("gemini-1.5-flash-latest"),
      prompt: aiPrompt,
    });
    
    const processingTime = Date.now() - startTime;
    
    return c.json({
      success: true,
      content: text,
      metadata: {
        tokensUsed: usage?.totalTokens || 0,
        processingTime
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
function getModificationInstructions(modificationType: ModificationType): string {
  switch (modificationType) {
    case ModificationType.REWRITE:
      return "Rewrite the text to improve clarity, flow, and academic quality while preserving the original meaning and key points.";
    
    case ModificationType.EXPAND:
      return "Expand the text by adding more detail, examples, explanations, or supporting information while maintaining the original structure and meaning.";
    
    case ModificationType.SUMMARIZE:
      return "Summarize the text to capture the essential points in a more concise form while preserving the key information and academic tone.";
    
    case ModificationType.IMPROVE_CLARITY:
      return "Improve the clarity and readability of the text by simplifying complex sentences, improving word choice, and enhancing logical flow.";
    
    default:
      return "Improve the text according to general academic writing best practices.";
  }
}