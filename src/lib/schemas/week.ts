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

/** Order meals are shown in within a day. */
export const MEAL_TYPE_ORDER: Record<MealTypeValue, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
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

export const updateMealTypeSchema = z.object({
  id: z.string().uuid(),
  mealType: mealTypeEnum,
});
export type UpdateMealTypeInput = z.infer<typeof updateMealTypeSchema>;

export const weekParamSchema = z
  .string()
  .regex(/^\d{4}-W\d{1,2}$/, "Ungültiger Wochenparameter.");
