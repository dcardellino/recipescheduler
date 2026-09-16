import { z } from "zod";
import { ingredientCategoryEnum } from "@/lib/schemas/recipe";
import type { ParsedRecipe } from "@/lib/recipe-parser";

export type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export type ProviderInput = {
  captionText?: string | null;
  /**
   * How the prompt introduces `captionText`, e.g. "Instagram-Bildunterschrift"
   * or "Eingefügter Rezepttext". Defaults to a neutral label.
   */
  contentLabel?: string | null;
  imageBuffer?: Buffer | null;
  imageMediaType?: ImageMediaType | null;
  /** Origin of the content; null for text pasted straight into the app. */
  sourceUrl: string | null;
  fallbackTitle?: string | null;
};

export const DEFAULT_CONTENT_LABEL = "Rezept-Inhalt";

export type ProviderResult =
  | { ok: true; recipe: ParsedRecipe; tokensUsed: number }
  | { ok: false; tokensUsed: number };

export const aiIngredientSchema = z.object({
  name: z.string().trim().min(1).max(200),
  quantity: z.number().nonnegative().max(99999).nullable().optional(),
  unit: z.string().trim().max(50).nullable().optional(),
  note: z.string().trim().max(200).nullable().optional(),
  category: ingredientCategoryEnum,
});

export const aiStepSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export const aiRecipeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  servings: z.number().int().min(1).max(99),
  prepMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  cookMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  ingredients: z.array(aiIngredientSchema),
  steps: z.array(aiStepSchema),
  tagNames: z.array(z.string().trim().min(1).max(60)).max(50),
});

export type AiRecipeData = z.infer<typeof aiRecipeSchema>;

export const SYSTEM_PROMPT = `Du extrahierst Kochrezepte aus Social-Media-Posts (Instagram, Facebook, TikTok, YouTube, Pinterest), aus eingefügtem Rezepttext (z.B. aus Notizen-Apps, Google Docs, Notion, Evernote oder Paprika-Exporten) und aus Bildern — für eine deutschsprachige Rezept-App.

Regeln:
- Nutze ausschließlich Informationen, die im gegebenen Text oder Bild tatsächlich vorkommen. Erfinde keine Zutaten, Mengen oder Schritte.
- Wenn eine Angabe fehlt (z.B. Zeiten, Beschreibung), lass das Feld leer bzw. null statt zu raten. Ausnahme: "servings" muss immer eine Zahl sein — schätze 2, wenn nichts angegeben ist.
- "category" pro Zutat muss exakt einer der vorgegebenen Enum-Werte sein; wähle die beste Übereinstimmung, im Zweifel "andere".
- Enthält der Inhalt kein erkennbares Rezept (z.B. reiner Werbetext ohne Zutaten/Zubereitung), rufe das Tool trotzdem auf, aber lasse "ingredients" und "steps" leere Arrays.
- Strukturüberschriften aus Export-Formaten (z.B. "Ingredients:", "Directions:", "Zutaten:", "Zubereitung:", "Servings: 4") sind Metadaten, keine Zutaten oder Schritte — werte sie aus, übernimm sie aber nicht als Listeneintrag.
- Antworte auf Deutsch, außer der Originaltext liegt bereits auf Deutsch vor — dann übernimm ihn möglichst unverändert.
- Wandle britische/US-amerikanische Maßeinheiten ins metrische System um (cups, oz, lb, fl oz, inch) — passe dabei Zahl UND Einheit gemeinsam an, benenne nicht nur die Einheit um. Näherungswerte sind in Ordnung, sinnvoll runden. Richtwerte: 1 cup Mehl ≈ 120 g, 1 cup Zucker ≈ 200 g, 1 cup Butter ≈ 227 g, 1 cup Flüssigkeit ≈ 240 ml, 1 oz ≈ 28 g, 1 fl oz ≈ 30 ml, 1 lb ≈ 450 g, 1 inch ≈ 2,5 cm. EL/TL (tablespoon/teaspoon) bleiben als Löffelmaß bestehen, nicht in ml umrechnen. Fahrenheit-Temperaturen im Zubereitungstext (z.B. "375°F") in Celsius umrechnen (Formel: (°F − 32) × 5/9) und den Text entsprechend anpassen (z.B. "Bei 190°C backen").`;

/**
 * Maps validated tool/response output to the app's ParsedRecipe shape. Shared
 * by every provider so extraction results are indistinguishable downstream.
 * Returns null if there's no usable recipe content (no ingredients).
 */
export function buildParsedRecipe(
  data: AiRecipeData,
  sourceUrl: string | null,
): ParsedRecipe | null {
  if (data.ingredients.length === 0) {
    return null;
  }

  return {
    title: data.title.slice(0, 200),
    description: data.description?.trim() ? data.description.slice(0, 2000) : null,
    sourceUrl: sourceUrl ? sourceUrl.slice(0, 1000) : null,
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
}
