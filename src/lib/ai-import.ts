import { extractRecipeAnthropic } from "@/lib/ai-providers/anthropic";
import { extractRecipeGemini } from "@/lib/ai-providers/gemini";
import type { ProviderInput, ProviderResult } from "@/lib/ai-providers/types";

export type { ProviderInput as AiExtractInput, ProviderResult as AiExtractResult };

/**
 * Dispatches to the active AI provider (env var AI_PROVIDER, default
 * "anthropic") for recipe extraction from social posts, pasted text or a
 * preview image. No automatic fallback between providers — switching is a
 * deliberate deploy-time config choice.
 */
export async function extractRecipeFromContent(
  input: ProviderInput,
): Promise<ProviderResult> {
  const provider = process.env.AI_PROVIDER === "gemini" ? "gemini" : "anthropic";
  return provider === "gemini" ? extractRecipeGemini(input) : extractRecipeAnthropic(input);
}

/** True when the configured provider has an API key available. */
export function isAiImportConfigured(): boolean {
  return process.env.AI_PROVIDER === "gemini"
    ? Boolean(process.env.GEMINI_API_KEY)
    : Boolean(process.env.ANTHROPIC_API_KEY);
}
