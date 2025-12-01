import { Hono } from "hono";
import { SupabaseEnv, getSupabase } from "../lib/supabase"; // Import getSupabase
import { Env } from "../types/env";


// Type for the Hono context, including Supabase client
type IdeaContext = {
  Bindings: Env & SupabaseEnv;
};

const app = new Hono<IdeaContext>();

// Get the Supabase client
const supabase = getSupabase();

// POST /api/ideas - Create a new idea
app.post("/", async (c) => {
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


  const { data, error } = await supabase
    .from("ideas")
    .insert([
      { title, description, conversationid },
    ])
    .select("*"); // Select the inserted row to return it

  if (error) {
    console.error("Error creating idea:", error);
    return c.json({ error: "Failed to create idea" , message: error}, 500);
  }

  return c.json(data[0], 201); // Return the created idea
});

// GET /api/ideas - Get all ideas
app.get("/", async (c) => {
  // Extract conversationId from query parameters
  const conversationId = c.req.query("conversationId");

  // Build the query based on whether conversationId is provided
  let query = supabase.from("ideas").select("*");
  
  // Filter by conversationId if provided
  if (conversationId) {
    query = query.eq("conversationid", conversationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching ideas:", error);
    return c.json({ error: "Failed to fetch ideas" }, 500);
  }

  return c.json(data);
});

// GET /api/ideas/:id - Get a specific idea by ID
app.get("/:id", async (c) => {
  const id = c.req.param("id");

  const numId = parseInt(id, 10);
  const { data, error } = await supabase.from("ideas").select("*").eq("id", numId).single(); // Use single() for a single row

  if (error) {
    console.error(`Error fetching idea with id ${id}:`, error);
    // Handle not found case specifically
    if (error.message.includes("No rows found")) {
      return c.json({ error: `Idea with id ${id} not found` }, 404);
    }
    return c.json({ error: `Failed to fetch idea with id ${id}` }, 500);
  }

  return c.json(data);
});

// PATCH /api/ideas/:id - Update an idea by ID
app.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const updates = await c.req.json<{
    title?: string;
    description?: string;
    conversationid?: string;
  }>();

  // Ensure at least one field is being updated
  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No update fields provided" }, 400);
  }

  const numId = parseInt(id, 10);
  const { data, error } = await supabase
    .from("ideas")
    .update(updates)
    .eq("id", numId)
    .select("*");

  if (error) {
    console.error(`Error updating idea with id ${id}:`, error);
    return c.json({ error: `Failed to update idea with id ${id}` }, 500);
  }

  if (!data || data.length === 0) {
    return c.json({ error: `Idea with id ${id} not found` }, 404);
  }

  return c.json(data[0]); // Return the updated idea
});

// DELETE /api/ideas/:id - Delete an idea by ID
app.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const numId = parseInt(id, 10);
  const { error } = await supabase.from("ideas").delete().eq("id", numId);

  if (error) {
    console.error(`Error deleting idea with id ${id}:`, error);
    return c.json({ error: `Failed to delete idea with id ${id}` }, 500);
  }

  return c.json({ message: `Idea with id ${id} deleted successfully` });
});

export default app;
