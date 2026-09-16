import { z } from "zod";

export const cookbookFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name ist erforderlich.")
    .max(80, "Maximal 80 Zeichen."),
  description: z
    .string()
    .trim()
    .max(300, "Maximal 300 Zeichen.")
    .optional()
    .nullable(),
});
export type CookbookFormInput = z.infer<typeof cookbookFormSchema>;

export const updateCookbookSchema = cookbookFormSchema.extend({
  id: z.string().uuid("Ungültige ID."),
});
export type UpdateCookbookInput = z.infer<typeof updateCookbookSchema>;

export const setRecipeCookbooksSchema = z.object({
  recipeId: z.string().uuid("Ungültige Rezept-ID."),
  cookbookIds: z.array(z.string().uuid()).max(50, "Maximal 50 Kochbücher."),
});
export type SetRecipeCookbooksInput = z.infer<typeof setRecipeCookbooksSchema>;

/**
 * Starting points offered when creating the first cookbooks — the dimensions
 * people actually sort recipes by: meal, course, cuisine and diet.
 */
export const COOKBOOK_SUGGESTIONS = [
  "Frühstück",
  "Mittagessen",
  "Abendessen",
  "Desserts",
  "Vorspeisen",
  "Suppen",
  "Vegetarisch",
  "Vegan",
  "Italienisch",
  "Asiatisch",
  "Meal Prep",
  "Schnelle Küche",
] as const;
