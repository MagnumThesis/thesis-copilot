/**
 * Example usage of AI Context Manager in backend handlers
 * This demonstrates how the context manager integrates with AI processing
 */

import { Context } from "hono";
import { getSupabase, SupabaseEnv } from "./supabase";
import { Env } from "../types/env";
import { createAIContextManager } from "./ai-context-manager";
import { AIPromptRequest, AIResponse } from "../../lib/ai-types";

/**
 * Example handler showing AI context manager integration
 * This would be used in the actual Builder AI handler
 */
export async function exampleAIPromptHandler(
  c: Context<{ Bindings: Env & SupabaseEnv }>
): Promise<Response> {
  try {
    const body = await c.req.json();
    const { prompt, documentContent, cursorPosition, conversationId }: AIPromptRequest = body;
    
    if (!prompt || !conversationId) {
      return c.json({ error: "Prompt and conversationId are required." }, 400);
    }
    
    const supabase = getSupabase(c.env);
    const contextManager = createAIContextManager(supabase);
    
    // Build comprehensive context for AI processing
    const documentContext = await contextManager.buildContext(
      documentContent,
      conversationId,
      cursorPosition
    );
    
    // Format context for AI consumption
    const formattedContext = contextManager.formatContextForAI(documentContext);
    
    // This is where you would integrate with your AI service
    // For example, using Google Generative AI:
    /*
    const google = createGoogleGenerativeAI({ apiKey: getGoogleGenerativeAIKey(c) });
    
    const aiPrompt = `
    Context:
    ${formattedContext}
    
    User Request: ${prompt}
    
    Please generate relevant content based on the context and user request. 
    Maintain academic tone and integrate with existing ideas when appropriate.
    Format the response as markdown.
    `;
    
    const { text } = await generateText({
      model: google("gemini-1.5-flash-latest"),
      prompt: aiPrompt,
    });
    */
    
    // Log context for debugging (remove in production)
    console.log('AI Context prepared:', formattedContext.substring(0, 200) + '...');
    
    // Mock response for demonstration
    const mockResponse: AIResponse = {
      success: true,
      content: `Generated content based on prompt: "${prompt}" with context from "${documentContext.conversationTitle}"`,
      metadata: {
        tokensUsed: 150,
        processingTime: 1200
      }
    };
    
    return c.json(mockResponse);
  } catch (error) {
    console.error("Error in AI prompt handler:", error);
    return c.json({ 
      success: false, 
      error: "Failed to process AI request" 
    }, 500);
  }
}

/**
 * Example of context-aware content continuation
 */
export async function exampleAIContinueHandler(
  c: Context<{ Bindings: Env & SupabaseEnv }>
): Promise<Response> {
  try {
    const body = await c.req.json();
    const { documentContent, cursorPosition, selectedText, conversationId } = body;
    
    const supabase = getSupabase(c.env);
    const contextManager = createAIContextManager(supabase);
    
    // Build context with cursor position and selected text
    const documentContext = await contextManager.buildContext(
      documentContent,
      conversationId,
      cursorPosition,
      selectedText
    );
    
    // Get the text around cursor for better continuation
    const beforeCursor = documentContent.substring(Math.max(0, cursorPosition - 200), cursorPosition);
    const afterCursor = documentContent.substring(cursorPosition, cursorPosition + 200);
    
    // Format context for continuation-specific AI prompt
    const formattedContext = contextManager.formatContextForAI(documentContext);
    
    // Log context for debugging (remove in production)
    console.log('Continuation context:', { beforeCursor: beforeCursor.slice(-50), afterCursor: afterCursor.slice(0, 50) });
    console.log('Full context prepared:', formattedContext.substring(0, 200) + '...');
    
    // This would integrate with AI service for content continuation
    const mockResponse: AIResponse = {
      success: true,
      content: `Continued content based on context around cursor position ${cursorPosition}`,
      metadata: {
        tokensUsed: 120,
        processingTime: 900
      }
    };
    
    return c.json(mockResponse);
  } catch (error) {
    console.error("Error in AI continue handler:", error);
    return c.json({ 
      success: false, 
      error: "Failed to continue content" 
    }, 500);
  }
}