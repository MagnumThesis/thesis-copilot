import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Gemini models to try in order of preference
 * Will fallback to the next model if rate limited (429 error)
 */
export const GEMINI_MODELS = [
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash", 
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number];

/**
 * Check if an error is a rate limit error (429)
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("429") ||
      message.includes("resource_exhausted") ||
      message.includes("rate limit") ||
      message.includes("quota exceeded") ||
      message.includes("too many requests")
    );
  }
  
  // Check for response-like objects
  if (typeof error === "object" && error !== null) {
    const err = error as any;
    if (err.status === 429 || err.code === 429) return true;
    if (err.error?.code === 429) return true;
    if (typeof err.message === "string" && err.message.includes("429")) return true;
  }
  
  return false;
}

/**
 * Execute an AI operation with automatic model fallback on rate limit errors
 * @param apiKey - Google API key
 * @param operation - Function that takes a model and returns a promise
 * @param startModelIndex - Index of the model to start with (default: 0)
 * @returns The result of the operation
 */
export async function withModelFallback<T>(
  apiKey: string,
  operation: (google: ReturnType<typeof createGoogleGenerativeAI>, modelName: GeminiModel) => Promise<T>,
  startModelIndex: number = 0
): Promise<T> {
  const google = createGoogleGenerativeAI({ apiKey });
  let lastError: unknown;
  
  for (let i = startModelIndex; i < GEMINI_MODELS.length; i++) {
    const modelName = GEMINI_MODELS[i];
    
    try {
      console.log(`Attempting AI operation with model: ${modelName}`);
      const result = await operation(google, modelName);
      return result;
    } catch (error) {
      lastError = error;
      
      if (isRateLimitError(error)) {
        console.warn(`Rate limited on ${modelName}, trying next model...`);
        
        // Add a small delay before trying next model
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      
      // If it's not a rate limit error, throw immediately
      throw error;
    }
  }
  
  // All models exhausted
  console.error("All Gemini models exhausted due to rate limiting");
  throw lastError || new Error("All Gemini models are currently rate limited. Please try again later.");
}

/**
 * Create a model instance with fallback support
 * This is a simpler version that returns the model to use
 */
export function getGeminiModel(
  google: ReturnType<typeof createGoogleGenerativeAI>,
  preferredModel: GeminiModel = "gemini-2.0-flash-exp"
) {
  return google(preferredModel);
}
