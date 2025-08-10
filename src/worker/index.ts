import { Hono } from "hono";
import { SupabaseEnv } from "./lib/supabase";
import { Env } from "./types/env";
import { chatHandler } from "./handlers/chat";
import { getChatsHandler, createChatHandler, deleteChatHandler, updateChatHandler } from "./handlers/chats";
import { getMessagesHandler } from "./handlers/messages";
import { generateTitleHandler } from "./handlers/generate-title";
import { generateIdeasHandler } from "./handlers/generate-ideas";
import ideasRouter from "./handlers/ideas"; // Import the ideas router

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

// Ideas CRUD
app.route('/api/ideas', ideasRouter); // Mount the ideas router

// Other
app.post("/api/generate-title", generateTitleHandler);
app.post("/api/generate-ideas", generateIdeasHandler);

export default app;
