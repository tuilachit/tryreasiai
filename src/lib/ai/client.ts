import "server-only";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * Server-only OpenAI provider for the Vercel AI SDK.
 * Import this only from Server Actions, Route Handlers, or other server-only code
 * so `OPENAI_API_KEY` never reaches the client bundle.
 */
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** OpenAI model for all structured meal-plan / recipe calls (`generateObject`). */
export const REASI_OPENAI_MODEL = "gpt-5.4-mini";
