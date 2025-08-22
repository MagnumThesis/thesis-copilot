import { Hono } from "hono";
import { SupabaseEnv } from "./lib/supabase";
import { Env } from "./types/env";
import { chatHandler } from "./handlers/chat";
import { getChatsHandler, createChatHandler, deleteChatHandler, updateChatHandler } from "./handlers/chats";
import { getMessagesHandler } from "./handlers/messages";
import { generateTitleHandler } from "./handlers/generate-title";
import { generateIdeasHandler } from "./handlers/generate-ideas";
import { builderAIPromptHandler, builderAIContinueHandler, builderAIModifyHandler } from "./handlers/builder-ai";
import { 
  proofreaderAnalysisHandler, 
  getConcernsHandler, 
  updateConcernStatusHandler, 
  getConcernStatisticsHandler 
} from "./handlers/proofreader-ai";
import ideasRouter from "./handlers/ideas"; // Import the ideas router
import referencerRouter from "./handlers/referencer"; // Import the referencer router

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

// Builder AI endpoints
app.post("/api/builder/ai/prompt", builderAIPromptHandler);
app.post("/api/builder/ai/continue", builderAIContinueHandler);
app.post("/api/builder/ai/modify", builderAIModifyHandler);

// Proofreader AI endpoints
app.post("/api/proofreader/analyze", proofreaderAnalysisHandler);
app.get("/api/proofreader/concerns/:conversationId", getConcernsHandler);
app.put("/api/proofreader/concerns/:concernId/status", updateConcernStatusHandler);
app.get("/api/proofreader/statistics/:conversationId", getConcernStatisticsHandler);

// Referencer endpoints
app.route('/api/referencer', referencerRouter); // Mount the referencer router

// Other
app.post("/api/generate-title", generateTitleHandler);
app.post("/api/generate-ideas", generateIdeasHandler);

export default app;
