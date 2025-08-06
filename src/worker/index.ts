import { Context, Hono } from "hono";
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

interface Env {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  OPENROUTER_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.post('/api/chat', async (c) => {
  try {
    const { messages }: { messages: UIMessage[] } = await c.req.json();

    const keylocal = import.meta.env.VITE_OPENROUTER_API_KEY;
    const keywrangler = c.env.OPENROUTER_API_KEY;

    const apiKey = keywrangler || keylocal;
    if (!apiKey) {
      return c.json({ error: 'API key is missing.' }, 500);
    }

    const openrouter = createOpenRouter({
      apiKey: apiKey,
    });

    const result = streamText({
      model: openrouter.chat("google/gemini-2.0-flash-exp:free"),
      system: "You're an assitant that will help the user come up or suggest ideas for thesis proposal and provide steps to complete the user's desired proposal. Your idea suggestions must be a list, with very minimal descriptions. Only provide in-depth detail when the user is interested in a particular idea",
      messages: convertToModelMessages(messages),
      onError: (e) => {
        throw (e);
      }
    });
    c

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    return onError(c, err)
  }
});

function onError(c: Context<{Bindings: Env;}>, err: any) {
  return c.json(
    { error: 'An error occurred while processing your request.', details: err.message || String(err) },
    500
  );
}





export default app;
