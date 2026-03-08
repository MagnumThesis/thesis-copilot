import { UIMessage, streamText, convertToModelMessages } from 'ai';
import { getSupabase, SupabaseEnv } from "../lib/supabase";
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { Env } from '../types/env';
import { Context } from 'hono';
import { onError } from '../lib/utils';
import { getGoogleGenerativeAIKey } from '../lib/api-keys';
import { getAuthContext } from '../middleware/auth-middleware';
import { getUserIdFromToken } from '../lib/auth-utils';
import { GEMINI_MODELS, isRateLimitError, type GeminiModel } from '../lib/model-fallback';

// Chat models in order of preference (for streaming)
const CHAT_MODELS: GeminiModel[] = [
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];

/**
 * Check if an error is a network/fetch error
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("fetch failed") ||
      message.includes("network") ||
      message.includes("econnrefused") ||
      message.includes("enotfound") ||
      message.includes("timeout") ||
      message.includes("socket") ||
      message.includes("connection")
    );
  }
  return false;
}

/**
 * Get a user-friendly error message based on error type
 */
function getErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return "Unable to connect to the AI service. Please check your internet connection and try again.";
  }
  if (isRateLimitError(error)) {
    return "The AI service is currently busy. Please try again in a moment.";
  }
  if (error instanceof Error) {
    // Don't expose internal error details to users
    if (error.message.includes("API key")) {
      return "AI service configuration error. Please contact support.";
    }
    return "An unexpected error occurred. Please try again.";
  }
  return "An unexpected error occurred. Please try again.";
}

export async function chatHandler(c: Context<{ Bindings: Env & SupabaseEnv }>) {
    try {
        const { messages, chatId }: { messages: UIMessage[]; chatId?: string } = await c.req.json();
        const supabase = getSupabase(c.env);

        const authContext = getAuthContext(c);
        if (!authContext?.token) {
            return c.json({ error: 'Authentication required' }, 401);
        }

        const userId = await getUserIdFromToken(authContext.token, c.env.SUPABASE_JWT_SECRET || "");
        if (!userId) {
            return c.json({ error: 'Invalid authentication token' }, 401);
        }

        // If chatId is provided, verify it belongs to the user
        if (chatId) {
            const { data: chatData, error: chatError } = await supabase
                .from('chats')
                .select('user_id')
                .eq('id', chatId)
                .single();

            if (chatError || !chatData) {
                return c.json({ error: 'Chat not found' }, 404);
            }

            if (chatData.user_id !== userId) {
                return c.json({ error: 'Unauthorized access to chat' }, 403);
            }
        }

        const apiKey = getGoogleGenerativeAIKey(c);
        if (!apiKey) {
            return c.json({ error: 'API key is missing.' }, 500);
        }

        // Save the user message to the database if chatId is provided
        if (chatId && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'user') {
                const contentStr = lastMessage.parts ? JSON.stringify(lastMessage.parts) : '';
                const { error: insertError } = await supabase
                    .from("messages")
                    .insert({ chat_id: chatId, role: lastMessage.role, content: contentStr, message_id: lastMessage.id });
                if (insertError) {
                    console.error("Failed to save user message:", insertError);
                }
            }
        }

        const google = createGoogleGenerativeAI({
            apiKey: apiKey,
        });

        // Try models with fallback on rate limit
        let lastError: unknown;
        for (const modelName of CHAT_MODELS) {
            try {
                console.log(`Chat: Attempting with model ${modelName}`);
                
                const result = streamText({
                    model: google(modelName),
                    tools: {
                        // Disable built-in tools to avoid configuration issues
                        // google_search: google.tools.googleSearch(),
                        // url_context: google.tools.urlContext(),
                    },
                    system: "You're an assitant that will help the user come up or suggest ideas for thesis proposal and provide steps to complete the user's desired proposal. Your idea suggestions must be a list, with very minimal descriptions. Only provide in-depth detail when the user is interested in a particular idea",
                    messages: convertToModelMessages(messages),
                    onError: (e) => {
                        // Log the error but don't throw - let the stream handle it gracefully
                        console.error(`Stream error with model ${modelName}:`, e);
                    },
                    onFinish: async (result) => {
                        // Save the assistant's response to the database if chatId is provided
                        if (chatId) {
                            const responseContent = result.response.messages[0]?.content;
                            const contentStr = typeof responseContent === 'string' ? responseContent : JSON.stringify(responseContent);
                            const { error: insertError } = await supabase
                                .from("messages")
                                .insert({ chat_id: chatId, role: 'assistant', content: contentStr, message_id: result.response.id });
                            if (insertError) {
                                console.error("Failed to save assistant message:", insertError);
                            }
                        }
                    }
                });

                // Convert to response and wrap with error handling
                const response = result.toUIMessageStreamResponse();
                
                // Create a new response that wraps the stream with error handling
                const originalBody = response.body;
                if (!originalBody) {
                    return response;
                }

                const transformStream = new TransformStream({
                    async transform(chunk, controller) {
                        controller.enqueue(chunk);
                    },
                    flush(controller) {
                        controller.terminate();
                    }
                });

                const wrappedBody = originalBody.pipeThrough(transformStream);
                
                return new Response(wrappedBody, {
                    headers: response.headers,
                    status: response.status,
                    statusText: response.statusText
                });
            } catch (error) {
                lastError = error;
                console.error(`Chat error with model ${modelName}:`, error);
                
                if (isRateLimitError(error)) {
                    console.warn(`Chat: Rate limited on ${modelName}, trying next model...`);
                    await new Promise(resolve => setTimeout(resolve, 300));
                    continue;
                }
                
                // For network errors, try next model as well
                if (isNetworkError(error)) {
                    console.warn(`Chat: Network error on ${modelName}, trying next model...`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    continue;
                }
                
                // For other errors, break and return error response
                break;
            }
        }

        // All models exhausted or non-retryable error
        const errorMessage = getErrorMessage(lastError);
        console.error("Chat handler: All attempts failed", lastError);
        
        return c.json({ 
            error: errorMessage,
            code: isNetworkError(lastError) ? 'NETWORK_ERROR' : 
                  isRateLimitError(lastError) ? 'RATE_LIMITED' : 'UNKNOWN_ERROR'
        }, isRateLimitError(lastError) ? 429 : 500);
    } catch (err: any) {
        console.error('Error in /api/chat:', err);
        
        // Provide user-friendly error response
        const errorMessage = getErrorMessage(err);
        const errorCode = isNetworkError(err) ? 'NETWORK_ERROR' : 
                          isRateLimitError(err) ? 'RATE_LIMITED' : 'UNKNOWN_ERROR';
        
        return c.json({ 
            error: errorMessage,
            code: errorCode
        }, isRateLimitError(err) ? 429 : 500);
    }
}