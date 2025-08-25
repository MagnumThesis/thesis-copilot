import { Hono } from "hono";
import { SupabaseEnv } from "../lib/supabase";
import { Env } from "../types/env";
import referencerAPIApp from "./referencer-api";

// Type for the Hono context
type ReferencerContext = {
  Bindings: Env & SupabaseEnv;
};

const app = new Hono<ReferencerContext>();

// Mount the referencer API app
app.route("/", referencerAPIApp);

export default app;