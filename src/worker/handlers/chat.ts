import { UIMessage, streamText, convertToModelMessages } from 'ai';
import { getSupabase, SupabaseEnv } from "../supabase";
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { Env } from '../types/env';
import { Context } from 'hono';
import { onError } from '../lib/utils';

export async function chatHandler(c: Context<{ Bindings: Env & SupabaseEnv }>) {
    try {
        const { messages, chatId }: { messages: UIMessage[]; chatId?: string } = await c.req.json();
        const supabase = getSupabase(c.env);

        const keylocal = import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY;
        const keywrangler = c.env.GOOGLE_GENERATIVE_AI_API_KEY;

        const apiKey = keywrangler || keylocal;
        if (!apiKey) {
            return c.json({ error: 'API key is missing.' }, 500);
        }

        // Save the user message to the database if chatId is provided
        if (chatId && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'user') {
                const { error: insertError } = await supabase
                    .from("messages")
                    .insert({ chat_id: chatId, role: lastMessage.role, content: lastMessage.parts, message_id: lastMessage.id });
                if (insertError) {
                    console.error("Failed to save user message:", insertError);
                }
            }
        }

        const google = createGoogleGenerativeAI({
            apiKey: apiKey,
        });

        const result = streamText({
            model: google("gemini-2.5-flash-lite"),
            tools: {
                google_search: google.tools.googleSearch({}),
                url_context: google.tools.urlContext({}),

            },
            system: "You're an assitant that will help the user come up or suggest ideas for thesis proposal and provide steps to complete the user's desired proposal. Your idea suggestions must be a list, with very minimal descriptions. Only provide in-depth detail when the user is interested in a particular idea",
            messages: convertToModelMessages(messages),
            onError: (e) => {
                throw (e);
            },
            onFinish: async (result) => {
                // Save the assistant's response to the database if chatId is provided
                if (chatId) {
                    const { error: insertError } = await supabase
                        .from("messages")
                        .insert({ chat_id: chatId, role: 'assistant', content: result.response.messages[0].content, message_id: result.response.id });
                    if (insertError) {
                        console.error("Failed to save assistant message:", insertError);
                    }
                }

            }
        });

        return result.toUIMessageStreamResponse();
    } catch (err: any) {
        console.error('Error in /api/chat:', err);
        return onError(c, err)
    }
}