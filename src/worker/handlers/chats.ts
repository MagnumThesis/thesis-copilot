import { Context } from 'hono';
import { getSupabase, SupabaseEnv } from '../lib/supabase';
import { Env } from '../types/env';
import { getUserIdFromToken } from '../lib/auth-utils';

export async function getChatsHandler(c: Context<{ Bindings: Env & SupabaseEnv }>) {
    const supabase = getSupabase(c.env);

    // Get userId from Authorization header
    const authHeader = c.req.header('Authorization');
    let userId: string | null = null;

    if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        userId = await getUserIdFromToken(token);
    }

    // If no userId, return empty list
    if (!userId) {
        return c.json([]);
    }

    const { data, error } = await supabase
        .from("chats")
        .select("id, name")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Failed to fetch chats:", error);
        return c.json({ error: "Failed to fetch chats" }, 500);
    }

    return c.json(data);
}

export async function createChatHandler(c: Context<{ Bindings: Env & SupabaseEnv }>) {
    const supabase = getSupabase(c.env);
    const body = await c.req.json();

    // Get userId from Authorization header
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
        return c.json({ error: "Authentication required" }, 401);
    }

    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return c.json({ error: "Invalid token" }, 401);
    }

    if (!body.name || typeof body.name !== "string") {
        return c.json({ error: "Name is required." }, 400);
    }

    const { data, error } = await supabase
        .from("chats")
        .insert({ name: body.name, user_id: userId })
        .select("id, name")
        .single();

    if (error) {
        console.error("Failed to create chat:", error);
        return c.json({ error: "Failed to create chat" }, 500);
    }

    return c.json(data, 201);
}

export async function deleteChatHandler(c: Context<{ Bindings: Env & SupabaseEnv }>) {
    const chatId = c.req.param("id");
    const supabase = getSupabase(c.env);

    // Get userId from Authorization header
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
        return c.json({ error: "Authentication required" }, 401);
    }

    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return c.json({ error: "Invalid token" }, 401);
    }

    // Verify chat exists
    const { data: chatData } = await supabase
        .from("chats")
        .select("*")
        .eq("id", chatId)
        .single();

    if (!chatData) {
        return c.json({ error: "Chat not found" }, 404);
    }

    // First delete messages related to this chat
    const { error: msgErr } = await supabase
        .from("messages")
        .delete()
        .eq("chat_id", chatId);

    if (msgErr) {
        return c.json({ error: "Failed to delete messages for chat" }, 500);
    }

    // Then delete the chat
    const { error: chatErr } = await supabase
        .from("chats")
        .delete()
        .eq("id", chatId);

    if (chatErr) {
        console.error("Failed to delete chat:", chatErr);
        return c.json({ error: "Failed to delete chat" }, 500);
    }

    return c.json({ success: true });
}

export async function updateChatHandler(c: Context<{ Bindings: Env & SupabaseEnv }>) {
    const chatId = c.req.param("id");
    const { name } = await c.req.json();
    const supabase = getSupabase(c.env);

    // Get userId from Authorization header
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
        return c.json({ error: "Authentication required" }, 401);
    }

    const userId = await getUserIdFromToken(token);
    if (!userId) {
        return c.json({ error: "Invalid token" }, 401);
    }

    // Verify chat exists
    const { data: chatData } = await supabase
        .from("chats")
        .select("*")
        .eq("id", chatId)
        .single();

    if (!chatData) {
        return c.json({ error: "Chat not found" }, 404);
    }

    if (!name || typeof name !== "string") {
        return c.json({ error: "Chat name is required." }, 400);
    }

    const { data, error } = await supabase
        .from("chats")
        .update({ name })
        .eq("id", chatId)
        .select("id, name")
        .single();

    if (error) {
        console.error("Failed to update chat name:", error);
        return c.json({ error: "Failed to update chat name." }, 500);
    }

    return c.json(data);
}