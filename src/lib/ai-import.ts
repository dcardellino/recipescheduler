import { extractRecipeAnthropic } from "@/lib/ai-providers/anthropic";
import { extractRecipeGemini } from "@/lib/ai-providers/gemini";
import type { ProviderInput, ProviderResult } from "@/lib/ai-providers/types";

export type { ProviderInput as AiExtractInput, ProviderResult as AiExtractResult };

/**
 * Dispatches to the active AI provider (env var AI_PROVIDER, default
 * "anthropic") for Instagram recipe extraction. No automatic fallback
 * between providers — switching is a deliberate deploy-time config choice.
 */
export async function extractRecipeFromInstagram(input: ProviderInput): Promise<ProviderResult> {
  const provider = process.env.AI_PROVIDER === "gemini" ? "gemini" : "anthropic";
  return provider === "gemini" ? extractRecipeGemini(input) : extractRecipeAnthropic(input);
}
