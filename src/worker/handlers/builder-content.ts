import { Hono } from "hono";
import { Context } from "hono";
import { getSupabase, SupabaseEnv } from "../lib/supabase";
import { Env } from "../types/env";

/**
 * Save Builder content to database
 * POST /api/builder-content
 */
export async function saveBuilderContentHandler(
  c: Context<{ Bindings: Env & SupabaseEnv }>
): Promise<Response> {
  try {
    const { conversationId, content } = await c.req.json();

    // Validate required fields
    if (!conversationId || typeof conversationId !== 'string') {
      return c.json({ success: false, error: "conversationId is required" }, 400);
    }

    if (content === undefined || content === null) {
      return c.json({ success: false, error: "content is required" }, 400);
    }

    const supabase = getSupabase(c.env);

    // Upsert the content (insert or update if exists)
    const { error } = await supabase
      .from('builder_content')
      .upsert({
        conversation_id: conversationId,
        content: content,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'conversation_id'
      });

    if (error) {
      console.error('Database error saving Builder content:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving Builder content:', error);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
}

/**
 * Get Builder content from database
 * GET /api/builder-content/:conversationId
 */
export async function getBuilderContentHandler(
  c: Context<{ Bindings: Env & SupabaseEnv }>
): Promise<Response> {
  try {
    const conversationId = c.req.param('conversationId');

    if (!conversationId) {
      return c.json({ success: false, error: "conversationId is required" }, 400);
    }

    const supabase = getSupabase(c.env);

    const { data, error } = await supabase
      .from('builder_content')
      .select('content, updated_at')
      .eq('conversation_id', conversationId)
      .single();

    if (error) {
      // If no content found, return null instead of error
      if (error.code === 'PGRST116') {
        return c.json({
          success: true,
          content: null,
          updated_at: null
        });
      }
      console.error('Database error retrieving Builder content:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({
      success: true,
      content: data.content,
      updated_at: data.updated_at
    });
  } catch (error) {
    console.error('Error retrieving Builder content:', error);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
}

/**
 * Delete Builder content from database
 * DELETE /api/builder-content/:conversationId
 */
export async function deleteBuilderContentHandler(
  c: Context<{ Bindings: Env & SupabaseEnv }>
): Promise<Response> {
  try {
    const conversationId = c.req.param('conversationId');

    if (!conversationId) {
      return c.json({ success: false, error: "conversationId is required" }, 400);
    }

    const supabase = getSupabase(c.env);

    const { error } = await supabase
      .from('builder_content')
      .delete()
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Database error deleting Builder content:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting Builder content:', error);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
}

// Create router for Builder content endpoints
const app = new Hono<{ Bindings: Env & SupabaseEnv }>();

app.post("/", saveBuilderContentHandler);
app.get("/:conversationId", getBuilderContentHandler);
app.delete("/:conversationId", deleteBuilderContentHandler);

export default app;
