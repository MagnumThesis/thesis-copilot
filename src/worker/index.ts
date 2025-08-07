import { Hono } from "hono";
import { SupabaseEnv } from "./lib/supabase";
import { Env } from "./types/env";
import { chatHandler } from "./handlers/chat";
import { getChatsHandler, createChatHandler, deleteChatHandler, updateChatHandler } from "./handlers/chats";
import { getMessagesHandler } from "./handlers/messages";
import { generateTitleHandler } from "./handlers/generate-title";

const app = new Hono<{ Bindings: Env & SupabaseEnv }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// Chat
app.post('/api/chat', chatHandler);

// Chats
app.get("/api/chats", getChatsHandler);
app.post("/api/chats", createChatHandler);
app.delete("/api/chats/:id", deleteChatHandler);
app.patch("/api/chats/:id", updateChatHandler);

// Messages
app.get("/api/chats/:id/messages", getMessagesHandler);

// Other
app.post("/api/generate-title", generateTitleHandler);

export default app;