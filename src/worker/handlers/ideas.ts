import { Hono } from "hono";
import { SupabaseEnv, getSupabase } from "../lib/supabase"; // Import getSupabase
import { Env } from "../types/env";

// Define the structure of an idea, matching the frontend interface
interface IdeaDefinition {
  id: number;
  title: string;
  description: string;
  conversationId?: string;
}

// Type for the Hono context, including Supabase client
type IdeaContext = {
  Bindings: Env & SupabaseEnv;
};

const app = new Hono<IdeaContext>();

// Get the Supabase client
const supabase = getSupabase();

// POST /api/ideas - Create a new idea
app.post("/", async (c) => {
  const { title, description, conversationId } = await c.req.json<{
    title: string;
    description: string;
    conversationId?: string;
  }>();

  if (!title || !description) {
    return c.json({ error: "Title and description are required" }, 400);
  }

  const { data, error } = await supabase
    .from("ideas")
    .insert([
      { title, description, conversationId },
    ])
    .select("*"); // Select the inserted row to return it

  if (error) {
    console.error("Error creating idea:", error);
    return c.json({ error: "Failed to create idea" }, 500);
  }

  return c.json(data[0], 201); // Return the created idea
});

// GET /api/ideas - Get all ideas
app.get("/", async (c) => {
  const { data, error } = await supabase.from("ideas").select("*");

  if (error) {
    console.error("Error fetching ideas:", error);
    return c.json({ error: "Failed to fetch ideas" }, 500);
  }

  return c.json(data);
});

// GET /api/ideas/:id - Get a specific idea by ID
app.get("/:id", async (c) => {
  const id = c.req.param("id");

  const { data, error } = await supabase.from("ideas").select("*").eq("id", id).single(); // Use single() for a single row

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
    conversationId?: string;
  }>();

  // Ensure at least one field is being updated
  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No update fields provided" }, 400);
  }

  const { data, error } = await supabase
    .from("ideas")
    .update(updates)
    .eq("id", id)
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

  const { error } = await supabase.from("ideas").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting idea with id ${id}:`, error);
    return c.json({ error: `Failed to delete idea with id ${id}` }, 500);
  }

  return c.json({ message: `Idea with id ${id} deleted successfully` });
});

export default app;
