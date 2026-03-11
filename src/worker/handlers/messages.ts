import { Context } from 'hono';
import { getSupabase, SupabaseEnv } from '../lib/supabase';
import { Env } from '../types/env';
import { getUserIdFromToken } from '../lib/auth-utils';

export async function getMessagesHandler(c: Context<{ Bindings: Env & SupabaseEnv }>) {
    const chatId = c.req.param("id");
    const supabase = getSupabase(c.env);

    // Get userId from Authorization header
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        return c.json({ error: "Authentication required" }, 401);
    }

    const userId = await getUserIdFromToken(token, c.env.SUPABASE_JWT_SECRET);
    if (!userId) {
        return c.json({ error: "Invalid token" }, 401);
    }

    // SECURITY: Verify chat belongs to authenticated user to prevent IDOR
    const { data: chatData, error: chatError } = await supabase
        .from("chats")
        .select("id")
        .eq("id", chatId)
        .eq("user_id", userId)
        .single();

    if (chatError || !chatData) {
        return c.json({ error: "Chat not found or access denied." }, 403);
    }

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