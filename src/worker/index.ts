import { Context, Hono } from "hono";
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { getSupabase, SupabaseEnv } from "./supabase";

interface Env {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  OPENROUTER_API_KEY: string;
}

const app = new Hono<{ Bindings: Env & SupabaseEnv }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.post('/api/chat', async (c) => {
  try {
    const { messages }: { messages: UIMessage[] } = await c.req.json();

    const keylocal = import.meta.env.VITE_OPENROUTER_API_KEY;
    const keywrangler = c.env.OPENROUTER_API_KEY;

    const apiKey = keywrangler || keylocal;
    if (!apiKey) {
      return c.json({ error: 'API key is missing.' }, 500);
    }

    const openrouter = createOpenRouter({
      apiKey: apiKey,
    });

    const result = streamText({
      model: openrouter.chat("google/gemini-2.0-flash-exp:free"),
      system: "You're an assitant that will help the user come up or suggest ideas for thesis proposal and provide steps to complete the user's desired proposal. Your idea suggestions must be a list, with very minimal descriptions. Only provide in-depth detail when the user is interested in a particular idea",
      messages: convertToModelMessages(messages),
      onError: (e) => {
        throw (e);
      }
    });
    c

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    return onError(c, err)
  }
});

function onError(c: Context<{Bindings: Env & SupabaseEnv;}>, err: any) {
  return c.json(
    { error: 'An error occurred while processing your request.', details: err.message || String(err) },
    500
  );
}

//get chat list(only names and ids)
app.get("/api/chats", async (c) => {
  const supabase = getSupabase(c.env);

  const { data, error } = await supabase
    .from("chats")
    .select("id, name")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch chats:", error);
    return c.json({ error: "Failed to fetch chats" }, 500);
  }

  return c.json(data);
});

// POST /api/chats - Create new chat
app.post("/api/chats", async (c) => {
  const supabase = getSupabase(c.env);
  const body = await c.req.json();

  if (!body.name || typeof body.name !== "string") {
    return c.json({ error: "Name is required." }, 400);
  }

  const { data, error } = await supabase
    .from("chats")
    .insert({ name: body.name })
    .select("id, name")
    .single();

  if (error) {
    console.error("Failed to create chat:", error);
    return c.json({ error: "Failed to create chat" }, 500);
  }

  return c.json(data, 201);
});

// DELETE /api/chats/:id - Delete chat and its messages
app.delete("/api/chats/:id", async (c) => {
  const chatId = c.req.param("id");
  const supabase = getSupabase(c.env);

  // First delete messages related to this chat
  const { error: msgErr } = await supabase
    .from("messages")
    .delete()
    .eq("chat_id", chatId);

  if (msgErr) {
    console.error("Failed to delete messages:", msgErr);
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
});

// PATCH /api/chats/:id - Update chat name
app.patch("/api/chats/:id", async (c) => {
  const chatId = c.req.param("id");
  const { name } = await c.req.json();
  const supabase = getSupabase(c.env);

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
});




//get history(takes chat id and returns the history in the same format with the ai sdk )

export default app;
