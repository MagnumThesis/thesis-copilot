import { Context } from 'hono';
import { getSupabase, SupabaseEnv } from '../lib/supabase';
import { Env } from '../types/env';

export async function getMessagesHandler(c: Context<{ Bindings: Env & SupabaseEnv }>) {
    const chatId = c.req.param("id");
    const supabase = getSupabase(c.env);

    const { data, error } = await supabase
        .from("messages")
        .select("message_id, role, content")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Failed to fetch messages:", error);
        return c.json({ error: "Failed to fetch messages" }, 500);
    }

    // Convert to UIMessage format
    const uiMessages = data.map((msg) => ({
        id: msg.message_id,
        role: msg.role as "user" | "assistant", // Assuming role is either 'user' or 'assistant'
        content: msg.content,
    }));

    return c.json(uiMessages);
}