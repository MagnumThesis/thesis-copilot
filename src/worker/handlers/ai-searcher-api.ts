import { Hono } from "hono";
import { Context } from "hono";
import { Env } from "../types/env";

// Import modular route handlers
import { handleSearchRoute, handleExtractRoute } from "../routes/search-routes";
import { 
  handleGenerateQueryRoute, 
  handleRefineQueryRoute, 
  handleValidateQueryRoute, 
  handleCombineQueriesRoute,
  handleContentPreviewRoute,
  handleExtractContentRoute 
} from "../routes/query-routes";
import { 
  handleGetHistoryRoute, 
  handleClearHistoryRoute, 
  handleExportHistoryRoute,
  handleGetHistoryStatsRoute,
  handleGetContentUsageRoute,
  handleGetSuccessTrackingRoute,
  handleGetNextBatchRoute,
  handleGetSearchSessionDetailsRoute 
} from "../routes/history-routes";
import { 
  handleGetAnalyticsRoute, 
  handleGetTrendingRoute, 
  handleGetStatisticsRoute,
  handleGetPerformanceMetricsRoute,
  handleClearCacheRoute,
  handleGetQueryPerformanceRoute,
  handleGetSuccessRateTrackingRoute,
  handleGetContentSourceEffectivenessRoute,
  handleTrackResultActionRoute,
  handleRecordFeedbackRoute,
  handleHealthRoute 
} from "../routes/analytics-routes";

// Import middleware
import { ValidationMiddleware } from "../middleware/validation-middleware";
import { ErrorMiddleware } from "../middleware/error-middleware";

// Import existing API modules for sub-routes
import feedbackApi from "./ai-searcher-feedback";
import learningApi from "./ai-searcher-learning";

// Define SupabaseEnv type locally since it's not exported from supabase.ts
export type SupabaseEnv = {
  SUPABASE_URL: string;
  SUPABASE_ANON: string;
};

// Type for the Hono context
type AISearcherContext = {
  Bindings: Env & SupabaseEnv;
};

// Create Hono app instance
const app = new Hono<AISearcherContext>();

// Helper function to convert Hono context to our modular context
function convertContext(honoContext: Context<AISearcherContext>): any {
  return {
    request: {
      body: honoContext.req.json(),
      url: honoContext.req.url,
      method: honoContext.req.method,
      headers: honoContext.req.header() || {},
      query: honoContext.req.query(),
      params: honoContext.req.param(),
    },
    status: (code: number) => honoContext.status(code as any),
    env: honoContext.env, // Pass through environment variables
  };
}

// Search and Extract routes (modular)
app.post("/search", async (c) => {
  try {
    const body = await c.req.json();
    const ctx = {
      request: { body },
      env: c.env
    };
    const response = await handleSearchRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.post("/extract", async (c) => {
  try {
    const body = await c.req.json();
    const ctx = {
      request: { body },
      env: c.env
    };
    const response = await handleExtractRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

// Query routes (modular)
app.post("/generate-query", async (c) => {
  try {
    const body = await c.req.json();
    const ctx = {
      request: { body },
      env: c.env
    };
    const response = await handleGenerateQueryRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.post("/extract-content", async (c) => {
  try {
    const body = await c.req.json();
    const ctx = {
      request: { body },
      env: c.env
    };
    const response = await handleExtractContentRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.post("/content-preview", async (c) => {
  try {
    const body = await c.req.json();
    const ctx = {
      request: { body },
      env: c.env
    };
    const response = await handleContentPreviewRoute(ctx);
    // Transform response to include success flag at top level
    return c.json({
      success: response.metadata?.success !== false,
      extractedContent: response.extractedContent,
      preview: response.preview,
      error: response.metadata?.error
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.post("/validate-query", async (c) => {
  try {
    const body = await c.req.json();
    const ctx = {
      request: { body },
      env: c.env
    };
    const response = await handleValidateQueryRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.post("/combine-queries", async (c) => {
  try {
    const body = await c.req.json();
    const ctx = {
      request: { body },
      env: c.env
    };
    const response = await handleCombineQueriesRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.post("/refine-query", async (c) => {
  try {
    const body = await c.req.json();
    const ctx = {
      request: { body },
      env: c.env
    };
    const response = await handleRefineQueryRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

// History routes (modular)
app.get("/history", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleGetHistoryRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.get("/history/stats", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleGetHistoryStatsRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.get("/history/content-usage", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleGetContentUsageRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.get("/history/export", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleExportHistoryRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.delete("/history", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleClearHistoryRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.get("/results/next-batch", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleGetNextBatchRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.get("/session/:sessionId", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleGetSearchSessionDetailsRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

// Analytics routes (modular)
app.get("/analytics", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleGetAnalyticsRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.get("/analytics/query-performance", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleGetQueryPerformanceRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.get("/analytics/success-rate-tracking", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleGetSuccessRateTrackingRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.post("/analytics/success-tracking", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleGetSuccessTrackingRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.get("/analytics/content-source-effectiveness", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleGetContentSourceEffectivenessRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.post("/track-result-action", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleTrackResultActionRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.post("/feedback", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleRecordFeedbackRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.get("/trending", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleGetTrendingRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.get("/statistics", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleGetStatisticsRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.get("/performance/metrics", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleGetPerformanceMetricsRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.post("/performance/clear-cache", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleClearCacheRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

app.get("/health", async (c) => {
  try {
    const ctx = convertContext(c);
    const response = await handleHealthRoute(ctx);
    return c.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, error: errorMessage }, 500);
  }
});

// Feedback API routes (existing sub-modules)
app.route("/feedback", feedbackApi);

// Learning API routes (existing sub-modules)
app.route("/learning", learningApi);

// Export Hono app as default
export default app;
