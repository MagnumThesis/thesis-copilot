import { Context } from "hono";
import { getSupabase, SupabaseEnv } from "../lib/supabase";
import { Env } from "../types/env";
import { generateObject } from "ai";
import { z } from "zod";
import { onError } from "../lib/utils";
import { getGoogleGenerativeAIKey } from "../lib/api-keys";
import { withModelFallback } from "../lib/model-fallback";

interface RegenerateIdeaTitleRequest {
  ideaId: number;
  description: string;
  conversationId?: string;
}

export async function regenerateIdeaTitleHandler(
  c: Context<{ Bindings: Env & SupabaseEnv }>
) {
  try {
    const body = await c.req.json();
    const { ideaId, description, conversationId }: RegenerateIdeaTitleRequest = body;
    
    if (!ideaId) {
      return c.json({ error: "ideaId is required." }, 400);
    }
    
    if (!description) {
      return c.json({ error: "description is required to generate a title." }, 400);
    }
    
    const apiKey = getGoogleGenerativeAIKey(c);
    if (!apiKey) {
      return c.json({ error: "API key is missing." }, 500);
    }
    
    const supabase = getSupabase(c.env);
    
    // Optionally fetch conversation context for better title generation
    let conversationContext = "";
    if (conversationId) {
      const { data: messages } = await supabase
        .from("messages")
        .select("content, role")
        .eq("chat_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(10);
        
      if (messages && messages.length > 0) {
        conversationContext = `\n\nConversation context:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`;
      }
    }
    
    const prompt = `Generate a concise, descriptive title for the following thesis idea description. The title should be:
- Clear and specific (3-8 words)
- Capture the main concept or research focus
- Be suitable as a thesis topic title

Idea description:
${description}${conversationContext}

Generate a single, compelling title for this idea.`;
    
    // Use model fallback for rate limiting
    const { object } = await withModelFallback(apiKey, async (google, modelName) => {
      console.log(`Regenerate Idea Title: Using model ${modelName}`);
      return await generateObject({
        model: google(modelName),
        schema: z.object({
          title: z.string().min(1, "Title is required").max(100, "Title should be under 100 characters")
        }),
        prompt: prompt,
      });
    });
    
    // Update the idea in the database
    const { data: updatedIdea, error: updateError } = await supabase
      .from("ideas")
      .update({ 
        title: object.title,
        updated_at: new Date().toISOString()
      })
      .eq("id", ideaId)
      .select()
      .single();
      
    if (updateError) {
      console.error("Failed to update idea title in database:", updateError);
      // Still return the generated title even if DB update fails
      return c.json({ 
        title: object.title,
        saved: false,
        error: "Title generated but failed to save to database"
      });
    }
    
    return c.json({ 
      title: object.title,
      saved: true,
      idea: updatedIdea
    });
  } catch (err: unknown) {
    console.error("Error in /api/regenerate-idea-title:", err);
    return onError(c, err);
  }
}
