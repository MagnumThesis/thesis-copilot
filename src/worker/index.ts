import { Hono } from "hono";
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { createGoogleGenerativeAI } from "@ai-sdk/google";

interface Env {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.post('/api/chat', async (c) => {
  try {
    const { messages }: { messages: UIMessage[] } = await c.req.json();

    // Fallback to process.env for local testing without wrangler
    const keylocal = import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY;
    const keywrangler = c.env.GOOGLE_GENERATIVE_AI_API_KEY;

    const apiKey = keywrangler || keylocal;
    if (!apiKey) {
      return c.json({ error: 'API key is missing.' }, 500);
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages: convertToModelMessages(messages),
    });


    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    console.error('Error in /api/chat:', err);

    return c.json(
      { error: 'An error occurred while processing your request.', details: err.message || String(err) },
      500
    );
  }
});


export default app;
