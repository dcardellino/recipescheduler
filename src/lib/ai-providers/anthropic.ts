import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { INGREDIENT_CATEGORIES } from "@/lib/schemas/recipe";
import { SYSTEM_PROMPT, aiRecipeSchema, buildParsedRecipe } from "@/lib/ai-providers/types";
import type { ProviderInput, ProviderResult } from "@/lib/ai-providers/types";
import {
  SHOPPING_OPTIMIZE_SYSTEM_PROMPT,
  aiShoppingOptimizeSchema,
} from "@/lib/ai-providers/shopping-optimize-types";
import type {
  ShoppingOptimizeItemInput,
  ShoppingOptimizeResult,
} from "@/lib/ai-providers/shopping-optimize-types";

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 4096;
const RECIPE_TOOL_NAME = "return_recipe";
const SHOPPING_OPTIMIZE_TOOL_NAME = "return_optimization";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

const RECIPE_TOOL: Anthropic.Tool = {
  name: RECIPE_TOOL_NAME,
  description:
    "Gibt ein aus einem Instagram-Rezept-Post extrahiertes, strukturiertes Kochrezept zurück.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Titel des Gerichts." },
      description: {
        type: ["string", "null"],
        description: "Kurze Beschreibung, falls im Text vorhanden.",
      },
      servings: {
        type: "integer",
        description: "Anzahl Portionen. Falls nicht angegeben, 2 schätzen.",
      },
      prepMinutes: {
        type: ["integer", "null"],
        description: "Vorbereitungszeit in Minuten, falls angegeben.",
      },
      cookMinutes: {
        type: ["integer", "null"],
        description: "Koch-/Backzeit in Minuten, falls angegeben.",
      },
      ingredients: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            quantity: { type: ["number", "null"] },
            unit: { type: ["string", "null"] },
            note: { type: ["string", "null"] },
            category: { type: "string", enum: INGREDIENT_CATEGORIES },
          },
          required: ["name", "category"],
        },
      },
      steps: {
        type: "array",
        items: {
          type: "object",
          properties: { text: { type: "string" } },
          required: ["text"],
        },
      },
      tagNames: {
        type: "array",
        items: { type: "string" },
        description: "Passende Stichworte, z.B. Küche oder Kategorie (maximal 6).",
      },
    },
    required: ["title", "servings", "ingredients", "steps", "tagNames"],
  },
};

export async function extractRecipeAnthropic(input: ProviderInput): Promise<ProviderResult> {
  const contentBlocks: Anthropic.ContentBlockParam[] = [];

  if (input.imageBuffer && input.imageMediaType) {
    contentBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: input.imageMediaType,
        data: input.imageBuffer.toString("base64"),
      },
    });
  }

  const textParts: string[] = [];
  if (input.captionText) {
    textParts.push(`Instagram-Bildunterschrift:\n${input.captionText}`);
  }
  if (input.fallbackTitle) {
    textParts.push(`Post-Titel (Fallback, falls sonst nichts brauchbar ist): ${input.fallbackTitle}`);
  }
  textParts.push(
    "Extrahiere das Rezept aus dem obigen Inhalt und rufe das Tool return_recipe auf.",
  );
  contentBlocks.push({ type: "text", text: textParts.join("\n\n") });

  let response: Anthropic.Message;
  try {
    response = await getClient().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: [RECIPE_TOOL],
      tool_choice: { type: "tool", name: RECIPE_TOOL_NAME },
      messages: [{ role: "user", content: contentBlocks }],
    });
  } catch (err) {
    console.error("[ai-providers/anthropic] request failed", err);
    return { ok: false, tokensUsed: 0 };
  }

  const tokensUsed =
    (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === RECIPE_TOOL_NAME,
  );
  if (!toolUse) {
    console.warn("[ai-providers/anthropic] no tool_use block in response");
    return { ok: false, tokensUsed };
  }

  const parsed = aiRecipeSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    console.warn("[ai-providers/anthropic] tool output failed validation", parsed.error.flatten());
    return { ok: false, tokensUsed };
  }

  const recipe = buildParsedRecipe(parsed.data, input.sourceUrl);
  if (!recipe) {
    // No usable recipe content could be extracted.
    return { ok: false, tokensUsed };
  }

  return { ok: true, recipe, tokensUsed };
}

const SHOPPING_OPTIMIZE_TOOL: Anthropic.Tool = {
  name: SHOPPING_OPTIMIZE_TOOL_NAME,
  description: "Gibt Feinschliff-Vorschläge für eine Einkaufsliste zurück.",
  input_schema: {
    type: "object",
    properties: {
      renames: {
        type: "array",
        items: {
          type: "object",
          properties: {
            index: { type: "integer" },
            cleanName: { type: "string" },
          },
          required: ["index", "cleanName"],
        },
      },
      merges: {
        type: "array",
        items: {
          type: "object",
          properties: {
            keepIndex: { type: "integer" },
            mergeIndices: { type: "array", items: { type: "integer" } },
          },
          required: ["keepIndex", "mergeIndices"],
        },
      },
      categoryFixes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            index: { type: "integer" },
            category: { type: "string", enum: INGREDIENT_CATEGORIES },
          },
          required: ["index", "category"],
        },
      },
    },
    required: ["renames", "merges", "categoryFixes"],
  },
};

export async function optimizeShoppingListAnthropic(
  items: ShoppingOptimizeItemInput[],
): Promise<ShoppingOptimizeResult> {
  const text = `Einkaufsliste:\n${JSON.stringify(items)}\n\nAnalysiere die Liste und rufe das Tool ${SHOPPING_OPTIMIZE_TOOL_NAME} auf.`;

  let response: Anthropic.Message;
  try {
    response = await getClient().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SHOPPING_OPTIMIZE_SYSTEM_PROMPT,
      tools: [SHOPPING_OPTIMIZE_TOOL],
      tool_choice: { type: "tool", name: SHOPPING_OPTIMIZE_TOOL_NAME },
      messages: [{ role: "user", content: text }],
    });
  } catch (err) {
    console.error("[ai-providers/anthropic] shopping optimize request failed", err);
    return { ok: false, tokensUsed: 0 };
  }

  const tokensUsed =
    (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === SHOPPING_OPTIMIZE_TOOL_NAME,
  );
  if (!toolUse) {
    console.warn("[ai-providers/anthropic] no tool_use block in shopping optimize response");
    return { ok: false, tokensUsed };
  }

  const parsed = aiShoppingOptimizeSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    console.warn(
      "[ai-providers/anthropic] shopping optimize tool output failed validation",
      parsed.error.flatten(),
    );
    return { ok: false, tokensUsed };
  }

  return { ok: true, optimization: parsed.data, tokensUsed };
}
