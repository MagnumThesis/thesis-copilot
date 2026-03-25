import { Hono } from "hono";
import { SupabaseEnv, getSupabase } from "../lib/supabase";
import { Env } from "../types/env";
import { getUserIdFromToken } from "../lib/auth-utils";

type IdeaContext = {
  Bindings: Env & SupabaseEnv;
};

const app = new Hono<IdeaContext>();

// Helper to check chat ownership
async function verifyChatOwnership(supabase: any, chatId: string, userId: string) {
  const { data, error } = await supabase
    .from("chats")
    .select("user_id")
    .eq("id", chatId)
    .single();

  if (error || !data || data.user_id !== userId) {
    return false;
  }
  return true;
}

// POST /api/ideas - Create a new idea
app.post("/", async (c) => {
  const supabase = getSupabase(c.env);
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Authentication required" }, 401);
  const userId = await getUserIdFromToken(token, c.env.SUPABASE_JWT_SECRET);
  if (!userId) return c.json({ error: "Invalid token" }, 401);

  const { title, description, conversationid } = await c.req.json<{
    title: string;
    description: string;
    conversationid?: string;
  }>();

  if (!title || !description) {
    return c.json({ error: "Title and description are required" }, 400);
  }

  if (!conversationid) {
    return c.json({ error: "Conversation ID is required" }, 400);
  }

  // SECURITY: Verify user owns the conversation (chat)
  const isOwner = await verifyChatOwnership(supabase, conversationid, userId);
  if (!isOwner) {
    return c.json({ error: "Forbidden: You do not have permission to add ideas to this conversation." }, 403);
  }

  const { data, error } = await supabase
    .from("ideas")
    .insert([
      { title, description, conversationid },
    ])
    .select("*");

  if (error) {
    console.error("Error creating idea:", error);
    return c.json({ error: "Failed to create idea" , message: error}, 500);
  }

  return c.json(data[0], 201);
});

// GET /api/ideas - Get all ideas
app.get("/", async (c) => {
  const supabase = getSupabase(c.env);
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Authentication required" }, 401);
  const userId = await getUserIdFromToken(token, c.env.SUPABASE_JWT_SECRET);
  if (!userId) return c.json({ error: "Invalid token" }, 401);

  const conversationId = c.req.query("conversationId");

  if (conversationId) {
    // SECURITY: Verify user owns the specific conversation
    const isOwner = await verifyChatOwnership(supabase, conversationId, userId);
    if (!isOwner) {
      return c.json({ error: "Forbidden: You do not have permission to access these ideas." }, 403);
    }

    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .eq("conversationid", conversationId);

    if (error) {
      console.error("Error fetching ideas:", error);
      return c.json({ error: "Failed to fetch ideas" }, 500);
    }
    return c.json(data);
  } else {
    // SECURITY: Fetch only ideas belonging to user's chats
    // 1. Get user's chats
    const { data: userChats, error: chatsError } = await supabase
      .from("chats")
      .select("id")
      .eq("user_id", userId);

    if (chatsError) {
      console.error("Error fetching user chats:", chatsError);
      return c.json({ error: "Failed to fetch ideas" }, 500);
    }

    if (!userChats || userChats.length === 0) {
      return c.json([]); // No chats = no ideas
    }

    const chatIds = userChats.map((c: any) => c.id);

    // 2. Get ideas for those chats
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .in("conversationid", chatIds);

    if (error) {
      console.error("Error fetching ideas:", error);
      return c.json({ error: "Failed to fetch ideas" }, 500);
    }
    return c.json(data);
  }
});

// GET /api/ideas/:id - Get a specific idea by ID
app.get("/:id", async (c) => {
  const supabase = getSupabase(c.env);
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Authentication required" }, 401);
  const userId = await getUserIdFromToken(token, c.env.SUPABASE_JWT_SECRET);
  if (!userId) return c.json({ error: "Invalid token" }, 401);

  const id = c.req.param("id");
  const numId = parseInt(id, 10);

  const { data, error } = await supabase.from("ideas").select("*").eq("id", numId).single();

  if (error) {
    console.error(`Error fetching idea with id ${id}:`, error);
    if (error.message.includes("No rows found")) {
      return c.json({ error: `Idea with id ${id} not found` }, 404);
    }
    return c.json({ error: `Failed to fetch idea with id ${id}` }, 500);
  }

  // SECURITY: Verify user owns the idea's conversation
  if (data.conversationid) {
    const isOwner = await verifyChatOwnership(supabase, data.conversationid, userId);
    if (!isOwner) {
      return c.json({ error: "Forbidden: You do not have permission to access this idea." }, 403);
    }
  }

  return c.json(data);
});

// PATCH /api/ideas/:id - Update an idea by ID
app.patch("/:id", async (c) => {
  const supabase = getSupabase(c.env);
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Authentication required" }, 401);
  const userId = await getUserIdFromToken(token, c.env.SUPABASE_JWT_SECRET);
  if (!userId) return c.json({ error: "Invalid token" }, 401);

  const id = c.req.param("id");
  const numId = parseInt(id, 10);

  // SECURITY: Fetch idea first to check ownership
  const { data: existingIdea, error: fetchError } = await supabase
    .from("ideas")
    .select("conversationid")
    .eq("id", numId)
    .single();

  if (fetchError || !existingIdea) {
    return c.json({ error: `Idea with id ${id} not found` }, 404);
  }

  if (existingIdea.conversationid) {
    const isOwner = await verifyChatOwnership(supabase, existingIdea.conversationid, userId);
    if (!isOwner) {
      return c.json({ error: "Forbidden: You do not have permission to update this idea." }, 403);
    }
  }

  const updates = await c.req.json<{
    title?: string;
    description?: string;
    conversationid?: string;
  }>();

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No update fields provided" }, 400);
  }

  // If moving to another conversation, verify ownership of target conversation
  if (updates.conversationid && updates.conversationid !== existingIdea.conversationid) {
    const isTargetOwner = await verifyChatOwnership(supabase, updates.conversationid, userId);
    if (!isTargetOwner) {
      return c.json({ error: "Forbidden: You do not have permission to move idea to target conversation." }, 403);
    }
  }

  const { data, error } = await supabase
    .from("ideas")
    .update(updates)
    .eq("id", numId)
    .select("*");

  if (error) {
    console.error(`Error updating idea with id ${id}:`, error);
    return c.json({ error: `Failed to update idea with id ${id}` }, 500);
  }

  return c.json(data[0]);
});

// DELETE /api/ideas/:id - Delete an idea by ID
app.delete("/:id", async (c) => {
  const supabase = getSupabase(c.env);
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Authentication required" }, 401);
  const userId = await getUserIdFromToken(token, c.env.SUPABASE_JWT_SECRET);
  if (!userId) return c.json({ error: "Invalid token" }, 401);

  const id = c.req.param("id");
  const numId = parseInt(id, 10);
  
  // SECURITY: Fetch idea first to check ownership
  const { data: existingIdea, error: fetchError } = await supabase
    .from("ideas")
    .select("conversationid")
    .eq("id", numId)
    .single();

  if (fetchError || !existingIdea) {
    console.error(`Idea with id ${id} not found:`, fetchError);
    return c.json({ error: `Idea with id ${id} not found` }, 404);
  }

  if (existingIdea.conversationid) {
    const isOwner = await verifyChatOwnership(supabase, existingIdea.conversationid, userId);
    if (!isOwner) {
      return c.json({ error: "Forbidden: You do not have permission to delete this idea." }, 403);
    }
  }

  const { data: deletedData, error } = await supabase
    .from("ideas")
    .delete()
    .eq("id", numId)
    .select("id");

  if (error) {
    console.error(`Error deleting idea with id ${id}:`, error);
    return c.json({ error: `Failed to delete idea with id ${id}` }, 500);
  }

  if (!deletedData || deletedData.length === 0) {
    console.error(`Delete operation did not affect any rows for idea ${id}`);
    return c.json({ error: `Failed to delete idea with id ${id}. No rows affected.` }, 500);
  }

  return c.json({ message: `Idea with id ${id} deleted successfully` });
});

export default app;
