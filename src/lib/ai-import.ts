import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { INGREDIENT_CATEGORIES, ingredientCategoryEnum } from "@/lib/schemas/recipe";
import type { ParsedRecipe } from "@/lib/recipe-parser";

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 4096;
const RECIPE_TOOL_NAME = "return_recipe";

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

const aiIngredientSchema = z.object({
  name: z.string().trim().min(1).max(200),
  quantity: z.number().nonnegative().max(99999).nullable().optional(),
  unit: z.string().trim().max(50).nullable().optional(),
  note: z.string().trim().max(200).nullable().optional(),
  category: ingredientCategoryEnum,
});

const aiStepSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

const aiRecipeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  servings: z.number().int().min(1).max(99),
  prepMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  cookMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  ingredients: z.array(aiIngredientSchema),
  steps: z.array(aiStepSchema),
  tagNames: z.array(z.string().trim().min(1).max(60)).max(50),
});

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

const SYSTEM_PROMPT = `Du extrahierst Kochrezepte aus Instagram-Post-Inhalten (Bildunterschrift und/oder Bild) für eine deutschsprachige Rezept-App.

Regeln:
- Nutze ausschließlich Informationen, die im gegebenen Text oder Bild tatsächlich vorkommen. Erfinde keine Zutaten, Mengen oder Schritte.
- Wenn eine Angabe fehlt (z.B. Zeiten, Beschreibung), lass das Feld leer bzw. null statt zu raten. Ausnahme: "servings" muss immer eine Zahl sein — schätze 2, wenn nichts angegeben ist.
- "category" pro Zutat muss exakt einer der vorgegebenen Enum-Werte sein; wähle die beste Übereinstimmung, im Zweifel "andere".
- Enthält der Inhalt kein erkennbares Rezept (z.B. reiner Werbetext ohne Zutaten/Zubereitung), rufe das Tool trotzdem auf, aber lasse "ingredients" und "steps" leere Arrays.
- Antworte auf Deutsch, außer der Originaltext liegt bereits auf Deutsch vor — dann übernimm ihn möglichst unverändert.`;

export type AiExtractInput = {
  captionText?: string | null;
  imageBuffer?: Buffer | null;
  imageMediaType?: Anthropic.Base64ImageSource["media_type"] | null;
  sourceUrl: string;
  fallbackTitle?: string | null;
};

export type AiExtractResult =
  | { ok: true; recipe: ParsedRecipe; tokensUsed: number }
  | { ok: false; tokensUsed: number };

export async function extractRecipeFromInstagram(
  input: AiExtractInput,
): Promise<AiExtractResult> {
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
    console.error("[ai-import] Anthropic request failed", err);
    return { ok: false, tokensUsed: 0 };
  }

  const tokensUsed =
    (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === RECIPE_TOOL_NAME,
  );
  if (!toolUse) {
    console.warn("[ai-import] no tool_use block in Anthropic response");
    return { ok: false, tokensUsed };
  }

  const parsed = aiRecipeSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    console.warn("[ai-import] tool output failed validation", parsed.error.flatten());
    return { ok: false, tokensUsed };
  }

  const data = parsed.data;
  if (data.ingredients.length === 0) {
    // No usable recipe content could be extracted.
    return { ok: false, tokensUsed };
  }

  const recipe: ParsedRecipe = {
    title: data.title.slice(0, 200),
    description: data.description?.trim() ? data.description.slice(0, 2000) : null,
    sourceUrl: input.sourceUrl.slice(0, 1000),
    imageUrl: null,
    servings: data.servings,
    prepMinutes: data.prepMinutes ?? null,
    cookMinutes: data.cookMinutes ?? null,
    rating: null,
    notes: null,
    ingredients: data.ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity ?? null,
      unit: ing.unit ?? null,
      note: ing.note ?? null,
      category: ing.category,
    })),
    steps: data.steps.map((s) => ({ text: s.text })),
    tagNames: data.tagNames.slice(0, 50),
    components: [],
  };

  return { ok: true, recipe, tokensUsed };
}
