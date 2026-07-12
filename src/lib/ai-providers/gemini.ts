import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import type { Part, Schema } from "@google/genai";
import { INGREDIENT_CATEGORIES } from "@/lib/schemas/recipe";
import { SYSTEM_PROMPT, aiRecipeSchema, buildParsedRecipe } from "@/lib/ai-providers/types";
import type { ProviderInput, ProviderResult } from "@/lib/ai-providers/types";

// Google renames/replaces model IDs fairly often; override via GEMINI_MODEL if
// this default drifts out of date. Current list: https://ai.google.dev/gemini-api/docs/models
const DEFAULT_MODEL = "gemini-3-flash";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

const RECIPE_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Titel des Gerichts." },
    description: {
      type: Type.STRING,
      nullable: true,
      description: "Kurze Beschreibung, falls im Text vorhanden.",
    },
    servings: {
      type: Type.INTEGER,
      description: "Anzahl Portionen. Falls nicht angegeben, 2 schätzen.",
    },
    prepMinutes: {
      type: Type.INTEGER,
      nullable: true,
      description: "Vorbereitungszeit in Minuten, falls angegeben.",
    },
    cookMinutes: {
      type: Type.INTEGER,
      nullable: true,
      description: "Koch-/Backzeit in Minuten, falls angegeben.",
    },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quantity: { type: Type.NUMBER, nullable: true },
          unit: { type: Type.STRING, nullable: true },
          note: { type: Type.STRING, nullable: true },
          category: { type: Type.STRING, enum: [...INGREDIENT_CATEGORIES] },
        },
        required: ["name", "category"],
      },
    },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { text: { type: Type.STRING } },
        required: ["text"],
      },
    },
    tagNames: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Passende Stichworte, z.B. Küche oder Kategorie (maximal 6).",
    },
  },
  required: ["title", "servings", "ingredients", "steps", "tagNames"],
};

export async function extractRecipeGemini(input: ProviderInput): Promise<ProviderResult> {
  const parts: Part[] = [];

  if (input.imageBuffer && input.imageMediaType) {
    parts.push({
      inlineData: {
        data: input.imageBuffer.toString("base64"),
        mimeType: input.imageMediaType,
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
  textParts.push("Extrahiere das Rezept aus dem obigen Inhalt als JSON gemäß dem vorgegebenen Schema.");
  parts.push({ text: textParts.join("\n\n") });

  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

  let responseText: string | undefined;
  let tokensUsed = 0;
  try {
    const response = await getClient().models.generateContent({
      model,
      contents: parts,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RECIPE_RESPONSE_SCHEMA,
      },
    });
    responseText = response.text;
    tokensUsed =
      (response.usageMetadata?.promptTokenCount ?? 0) +
      (response.usageMetadata?.candidatesTokenCount ?? 0);
  } catch (err) {
    console.error("[ai-providers/gemini] request failed", err);
    return { ok: false, tokensUsed: 0 };
  }

  if (!responseText) {
    console.warn("[ai-providers/gemini] empty response text");
    return { ok: false, tokensUsed };
  }

  let rawData: unknown;
  try {
    rawData = JSON.parse(responseText);
  } catch (err) {
    console.warn("[ai-providers/gemini] response was not valid JSON", err);
    return { ok: false, tokensUsed };
  }

  const parsed = aiRecipeSchema.safeParse(rawData);
  if (!parsed.success) {
    console.warn("[ai-providers/gemini] response failed validation", parsed.error.flatten());
    return { ok: false, tokensUsed };
  }

  const recipe = buildParsedRecipe(parsed.data, input.sourceUrl);
  if (!recipe) {
    // No usable recipe content could be extracted.
    return { ok: false, tokensUsed };
  }

  return { ok: true, recipe, tokensUsed };
}
