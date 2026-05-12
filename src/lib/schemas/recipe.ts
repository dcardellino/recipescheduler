import { z } from "zod";

export const INGREDIENT_CATEGORIES = [
  "gemuese",
  "obst",
  "fleisch_fisch",
  "milchprodukte",
  "tiefkuehl",
  "trocken_backen",
  "konserven",
  "gewuerze",
  "getraenke",
  "brot_backwaren",
  "suessigkeiten",
  "haushalt",
  "andere",
] as const;

export const ingredientCategoryEnum = z.enum(INGREDIENT_CATEGORIES);
export type IngredientCategoryValue = z.infer<typeof ingredientCategoryEnum>;

export const INGREDIENT_CATEGORY_LABELS: Record<IngredientCategoryValue, string> =
  {
    gemuese: "Gemüse",
    obst: "Obst",
    fleisch_fisch: "Fleisch & Fisch",
    milchprodukte: "Milchprodukte",
    tiefkuehl: "Tiefkühl",
    trocken_backen: "Trocken & Backen",
    konserven: "Konserven",
    gewuerze: "Gewürze",
    getraenke: "Getränke",
    brot_backwaren: "Brot & Backwaren",
    suessigkeiten: "Süßigkeiten",
    haushalt: "Haushalt",
    andere: "Andere",
  };

export const SORT_OPTIONS = ["recent", "title", "rating"] as const;
export const sortOptionEnum = z.enum(SORT_OPTIONS);
export type SortOption = z.infer<typeof sortOptionEnum>;

const trimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximal ${max} Zeichen.`);

export const ingredientSchema = z.object({
  name: trimmedString(200).min(1, "Name ist erforderlich."),
  quantity: z
    .number({ error: "Menge muss eine Zahl sein." })
    .nonnegative("Menge darf nicht negativ sein.")
    .max(99999, "Menge zu groß.")
    .optional()
    .nullable(),
  unit: trimmedString(50).optional().nullable(),
  note: trimmedString(200).optional().nullable(),
  category: ingredientCategoryEnum,
});
export type IngredientInput = z.infer<typeof ingredientSchema>;

export const stepSchema = z.object({
  text: trimmedString(2000).min(1, "Schritt darf nicht leer sein."),
});
export type StepInput = z.infer<typeof stepSchema>;

export const componentSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  name: trimmedString(100).min(1, "Name ist erforderlich."),
  position: z.number().int().min(0),
  ingredients: z.array(ingredientSchema),
});
export type ComponentInput = z.input<typeof componentSchema>;

const tagNamesSchema = z
  .array(trimmedString(60).min(1, "Tag darf nicht leer sein."))
  .max(50, "Maximal 50 Tags pro Rezept.")
  .transform((names) => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const raw of names) {
      const key = raw.toLocaleLowerCase("de-DE");
      if (!seen.has(key)) {
        seen.add(key);
        result.push(raw);
      }
    }
    return result;
  });

const recipeComponentsSchema = z
  .array(componentSchema)
  .optional()
  .default([]);

export const recipeFormSchema = z.object({
  title: trimmedString(200).min(1, "Titel ist erforderlich."),
  description: trimmedString(2000).optional().nullable(),
  sourceUrl: z
    .string()
    .trim()
    .url("Ungültige URL.")
    .max(1000)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  imageUrl: z
    .string()
    .trim()
    .refine(
      (v) => v.startsWith("/") || /^https?:\/\//i.test(v),
      "Ungültige Bild-URL.",
    )
    .max(2000)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  servings: z
    .number({ error: "Portionen müssen eine Zahl sein." })
    .int("Portionen müssen ganzzahlig sein.")
    .min(1, "Mindestens 1 Portion.")
    .max(99, "Maximal 99 Portionen."),
  prepMinutes: z
    .number()
    .int()
    .min(0)
    .max(1440, "Maximal 24 Stunden.")
    .optional()
    .nullable(),
  cookMinutes: z
    .number()
    .int()
    .min(0)
    .max(1440, "Maximal 24 Stunden.")
    .optional()
    .nullable(),
  rating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .nullable(),
  notes: trimmedString(5000).optional().nullable(),
  ingredients: z
    .array(ingredientSchema)
    .min(1, "Mindestens eine Zutat."),
  steps: z.array(stepSchema),
  tagNames: tagNamesSchema,
  components: recipeComponentsSchema,
});

export type RecipeFormInput = z.infer<typeof recipeFormSchema>;
export type RecipeFormValues = z.input<typeof recipeFormSchema>;

export const updateRecipeSchema = recipeFormSchema.extend({
  id: z.string().uuid("Ungültige ID."),
});
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
