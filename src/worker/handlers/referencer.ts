import { Hono } from "hono";
import { SupabaseEnv } from "../lib/supabase";
import { Env } from "../types/env";
import { referencerAPIHandler } from "./referencer-api";

// Type for the Hono context
type ReferencerContext = {
  Bindings: Env & SupabaseEnv;
};

const app = new Hono<ReferencerContext>();

// Reference CRUD operations
app.post("/references", (c) => referencerAPIHandler.createReference(c));
app.get("/references/:conversationId", (c) => referencerAPIHandler.getReferencesForConversation(c));
app.get("/reference/:referenceId", (c) => referencerAPIHandler.getReferenceById(c));
app.put("/references/:referenceId", (c) => referencerAPIHandler.updateReference(c));
app.delete("/references/:referenceId", (c) => referencerAPIHandler.deleteReference(c));

// Metadata and citation operations
app.post("/extract-metadata", (c) => referencerAPIHandler.extractMetadata(c));
app.post("/format-citation", (c) => referencerAPIHandler.formatCitation(c));
app.post("/generate-bibliography", (c) => referencerAPIHandler.generateBibliography(c));

export default app;