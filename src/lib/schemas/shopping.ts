import { z } from "zod";
import { ingredientCategoryEnum } from "@/lib/schemas/recipe";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum.");

export const generateShoppingListSchema = z.object({
  weekStartDate: isoDate,
});
export type GenerateShoppingListInput = z.infer<
  typeof generateShoppingListSchema
>;

export const toggleItemSchema = z.object({
  id: z.string().uuid(),
  checked: z.boolean(),
});
export type ToggleItemInput = z.infer<typeof toggleItemSchema>;

export const addCustomItemSchema = z.object({
  shoppingListId: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(1, "Name ist erforderlich.")
    .max(200, "Maximal 200 Zeichen."),
  quantity: z
    .number()
    .nonnegative()
    .max(99999)
    .optional()
    .nullable(),
  unit: z.string().trim().max(50).optional().nullable(),
  category: ingredientCategoryEnum.default("andere"),
});
export type AddCustomItemInput = z.infer<typeof addCustomItemSchema>;

export const deleteItemSchema = z.object({ id: z.string().uuid() });
export type DeleteItemInput = z.infer<typeof deleteItemSchema>;
