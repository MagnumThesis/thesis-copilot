import { Hono } from "hono";
import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages } from 'ai';

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.post('/', async (c) => {
  // Get the request body from the Hono context
  const { messages }: { messages: UIMessage[] } = await c.req.json();

  // Create the streaming text result
  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToModelMessages(messages),
  });

  // Use the ai library's helper to convert the stream to a Hono-compatible response
  return result.toUIMessageStreamResponse();
});

export default app;
