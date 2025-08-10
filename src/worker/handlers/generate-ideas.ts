import { Context } from "hono";
import { getSupabase, SupabaseEnv } from "../lib/supabase";
import { Env } from "../types/env";
import { generateObject } from "ai";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ModelMessage } from "ai";
import { onError } from "../lib/utils";
import { getGoogleGenerativeAIKey } from "../lib/api-keys";

export async function generateIdeasHandler(
  c: Context<{ Bindings: Env & SupabaseEnv }>
) {
  try {
    const { chatId, existingIdeas } = await c.req.json();
    const supabase = getSupabase(c.env);
    
    if (!chatId) {
      return c.json({ error: "chatId is required." }, 400);
    }
    
    // Fetch message history for context
    const { data: messages, error } = await supabase
      .from("messages")
      .select("message_id, role, content")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
      
    if (error) {
      console.error("Failed to fetch messages:", error);
      return c.json({ error: "Failed to fetch messages" }, 500);
    }
    
    const modelMessages: ModelMessage[] = messages.map((msg) => ({
      id: msg.message_id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));
    
    const apiKey = getGoogleGenerativeAIKey(c);
    if (!apiKey) {
      return c.json({ error: "API key is missing." }, 500);
    }
    
    const google = createGoogleGenerativeAI({ apiKey: apiKey });
    
    // Create a prompt that considers existing ideas and message history
    const existingIdeasText = existingIdeas && existingIdeas.length > 0 
      ? `Existing ideas to avoid duplication:\n${existingIdeas.map((idea: any) => `- ${idea.title}: ${idea.description}`).join('\n')}\n\n`
      : '';
      
    const prompt = `Based on the conversation history and the user's interests, generate 3-5 new thesis idea suggestions that are different from the existing ideas provided.
    
${existingIdeasText}Conversation history:
${JSON.stringify(modelMessages)}

Please provide ideas with titles and detailed descriptions. Each idea should be unique and not overlap with the existing ideas. Focus on the user's main interests as shown in the conversation.`;
    
    const { object } = await generateObject({
      model: google("gemini-1.5-flash-latest"),
      schema: z.object({ 
        ideas: z.array(z.object({ 
          title: z.string(),
          description: z.string()
        }))
      }),
      prompt: prompt,
    });
    
    return c.json({ ideas: object.ideas });
  } catch (err: any) {
    console.error("Error in /api/generate-ideas:", err);
    return onError(c, err);
  }
}