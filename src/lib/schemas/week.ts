import { z } from "zod";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export const mealTypeEnum = z.enum(MEAL_TYPES);
export type MealTypeValue = z.infer<typeof mealTypeEnum>;

export const MEAL_TYPE_LABELS: Record<MealTypeValue, string> = {
  breakfast: "Frühstück",
  lunch: "Mittagessen",
  dinner: "Abendessen",
  snack: "Snack",
};

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum.");

const servings = z
  .number({ error: "Portionen müssen eine Zahl sein." })
  .int("Portionen müssen ganzzahlig sein.")
  .min(1, "Mindestens 1 Portion.")
  .max(99, "Maximal 99 Portionen.");

export const addMealPlanEntrySchema = z.object({
  recipeId: z.string().uuid("Ungültige Rezept-ID."),
  date: isoDate,
  mealType: mealTypeEnum.default("dinner"),
  servings: servings.optional(),
  notes: z.string().trim().max(500).optional().nullable(),
});
export type AddMealPlanEntryInput = z.infer<typeof addMealPlanEntrySchema>;

export const updateServingsSchema = z.object({
  id: z.string().uuid(),
  servings,
});
export type UpdateServingsInput = z.infer<typeof updateServingsSchema>;

export const weekParamSchema = z
  .string()
  .regex(/^\d{4}-W\d{1,2}$/, "Ungültiger Wochenparameter.");
