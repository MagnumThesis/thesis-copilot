import { Context } from "hono";
import { getSupabase, SupabaseEnv } from "../lib/supabase";
import { Env } from "../types/env";
import { generateObject } from "ai";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ModelMessage } from "ai";
import { onError } from "../lib/utils";
import { getGoogleGenerativeAIKey } from "../lib/api-keys";

export async function generateTitleHandler(
  c: Context<{ Bindings: Env & SupabaseEnv }>
) {
  try {
    const { chatId } = await c.req.json();
    const supabase = getSupabase(c.env);
    if (!chatId) {
      return c.json({ error: "chatId is required." }, 400);
    }
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
    const { object } = await generateObject({
      model: google("gemini-1.5-flash-latest"),
      schema: z.object({ title: z.string() }),
      prompt:
        "Generate a short, concise title for the following conversation that is less than 5 words. The title should be based on the main topic of the conversation. \n Here is the conversation:" +
        JSON.stringify(modelMessages),
    });
    return c.json({ title: object.title });
  } catch (err: any) {
    console.error("Error in /api/generate-title:", err);
    return onError(c, err);
  }
}
