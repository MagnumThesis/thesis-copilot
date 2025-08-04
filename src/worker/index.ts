import { Hono } from "hono";
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { google } from "@ai-sdk/google";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));


app.post('/', async (c) => {
  // Get the request body from the Hono context
  const { messages }: { messages: UIMessage[] } = await c.req.json();

  // Create the streaming text result
  const result = streamText({
    model:  google('gemini-2.5-flash'),
    messages: convertToModelMessages(messages),
  });

  // Use the ai library's helper to convert the stream to a Hono-compatible response
  return result.toUIMessageStreamResponse();
});

export default app;
