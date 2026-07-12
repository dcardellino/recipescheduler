import { optimizeShoppingListAnthropic } from "@/lib/ai-providers/anthropic";
import { optimizeShoppingListGemini } from "@/lib/ai-providers/gemini";
import type {
  ShoppingOptimizeItemInput,
  ShoppingOptimizeResult,
} from "@/lib/ai-providers/shopping-optimize-types";

export type { ShoppingOptimizeItemInput, ShoppingOptimizeResult };

/**
 * Dispatches to the active AI provider (env var AI_PROVIDER, default
 * "anthropic") for shopping-list optimization. No automatic fallback
 * between providers — switching is a deliberate deploy-time config choice.
 */
export async function optimizeShoppingListWithAiProvider(
  items: ShoppingOptimizeItemInput[],
): Promise<ShoppingOptimizeResult> {
  const provider = process.env.AI_PROVIDER === "gemini" ? "gemini" : "anthropic";
  return provider === "gemini"
    ? optimizeShoppingListGemini(items)
    : optimizeShoppingListAnthropic(items);
}
