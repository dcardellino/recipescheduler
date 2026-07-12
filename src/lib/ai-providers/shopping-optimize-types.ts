import { z } from "zod";
import { INGREDIENT_CATEGORIES, ingredientCategoryEnum } from "@/lib/schemas/recipe";

export type ShoppingOptimizeItemInput = {
  index: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string;
};

export type ShoppingOptimizeResult =
  | { ok: true; optimization: AiShoppingOptimizeData; tokensUsed: number }
  | { ok: false; tokensUsed: number };

export const aiShoppingOptimizeSchema = z.object({
  renames: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      cleanName: z.string().trim().min(1).max(200),
    }),
  ),
  merges: z.array(
    z.object({
      keepIndex: z.number().int().nonnegative(),
      mergeIndices: z.array(z.number().int().nonnegative()).min(1),
    }),
  ),
  categoryFixes: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      category: ingredientCategoryEnum,
    }),
  ),
});

export type AiShoppingOptimizeData = z.infer<typeof aiShoppingOptimizeSchema>;

export const SHOPPING_OPTIMIZE_SYSTEM_PROMPT = `Du bekommst eine bereits automatisch zusammengestellte Einkaufsliste (Name, Menge, Einheit, Kategorie, jeweils mit einem Index) für eine deutschsprachige Rezept-App und sollst sie feinschleifen.

Aufgaben:
1. "renames": Entferne Zubereitungshinweise aus dem Anzeigenamen (z.B. "Zwiebel, fein gehackt" → "Zwiebel", "Tomaten (in Scheiben)" → "Tomaten"), ohne die Produktbedeutung zu verändern. Nur Einträge zurückgeben, die tatsächlich geändert werden müssen.
2. "merges": Schlage vor, welche Indizes dasselbe Produkt sind und zusammengeführt werden sollten (z.B. "Knoblauchzehe" und "Knoblauch, gehackt"). Gib pro Gruppe einen "keepIndex" (der Index, dessen Name erhalten bleibt) und die übrigen "mergeIndices" an. Schlage nur Zusammenführungen vor, bei denen du dir sicher bist, dass es sich um dasselbe Einkaufsprodukt handelt.
3. "categoryFixes": Nur für Einträge mit category "andere" — schlage die passendste Kategorie aus der festen Liste vor.

Strikte Regeln:
- Erfinde keine neuen Artikel und referenziere ausschließlich die vorgegebenen Indizes.
- Ändere oder berechne NIEMALS Mengen oder Einheiten — das übernimmt die App.
- "category" muss exakt einer dieser Werte sein: ${INGREDIENT_CATEGORIES.join(", ")}.
- Wenn du für eine Aufgabe keine sinnvollen Vorschläge hast, gib ein leeres Array zurück.`;
