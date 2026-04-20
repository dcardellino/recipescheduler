"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { mealPlanEntry, recipe, shoppingList } from "@/db/schema";
import { requireHousehold, requireHouseholdAccess } from "@/lib/authz";
import { getWeekStart, parseISODate, toISODate } from "@/lib/date";
import {
  addMealPlanEntrySchema,
  updateServingsSchema,
  type AddMealPlanEntryInput,
  type UpdateServingsInput,
} from "@/lib/schemas/week";
import { generateShoppingList } from "@/actions/shopping";

async function syncShoppingListIfExists(
  householdId: string,
  entryDate: string,
): Promise<void> {
  const weekStartIso = toISODate(getWeekStart(parseISODate(entryDate)));
  const [list] = await db
    .select({ id: shoppingList.id })
    .from(shoppingList)
    .where(
      and(
        eq(shoppingList.householdId, householdId),
        eq(shoppingList.weekStartDate, weekStartIso),
      ),
    )
    .limit(1);
  if (list) {
    await generateShoppingList({ weekStartDate: weekStartIso });
  }
}

export async function addMealPlanEntry(
  input: AddMealPlanEntryInput,
): Promise<{ id: string }> {
  const ctx = await requireHousehold();
  const data = addMealPlanEntrySchema.parse(input);

  const [recipeRow] = await db
    .select({ householdId: recipe.householdId, servings: recipe.servings })
    .from(recipe)
    .where(eq(recipe.id, data.recipeId))
    .limit(1);

  if (!recipeRow) throw new Error("Rezept nicht gefunden.");
  requireHouseholdAccess(ctx, recipeRow.householdId);

  const [inserted] = await db
    .insert(mealPlanEntry)
    .values({
      householdId: ctx.householdId,
      recipeId: data.recipeId,
      date: data.date,
      mealType: data.mealType,
      servings: data.servings ?? recipeRow.servings,
      notes: data.notes ?? null,
    })
    .returning({ id: mealPlanEntry.id });

  revalidatePath("/week");
  return { id: inserted.id };
}

export async function removeMealPlanEntry(id: string): Promise<void> {
  const ctx = await requireHousehold();

  const [existing] = await db
    .select({ householdId: mealPlanEntry.householdId, date: mealPlanEntry.date })
    .from(mealPlanEntry)
    .where(eq(mealPlanEntry.id, id))
    .limit(1);

  if (!existing) return;
  requireHouseholdAccess(ctx, existing.householdId);

  await db.delete(mealPlanEntry).where(eq(mealPlanEntry.id, id));
  await syncShoppingListIfExists(ctx.householdId, existing.date);
  revalidatePath("/week");
}

export async function updateServings(
  input: UpdateServingsInput,
): Promise<void> {
  const ctx = await requireHousehold();
  const data = updateServingsSchema.parse(input);

  const [entry] = await db
    .select({ date: mealPlanEntry.date })
    .from(mealPlanEntry)
    .where(
      and(
        eq(mealPlanEntry.id, data.id),
        eq(mealPlanEntry.householdId, ctx.householdId),
      ),
    )
    .limit(1);

  await db
    .update(mealPlanEntry)
    .set({ servings: data.servings })
    .where(
      and(
        eq(mealPlanEntry.id, data.id),
        eq(mealPlanEntry.householdId, ctx.householdId),
      ),
    );

  if (entry) {
    await syncShoppingListIfExists(ctx.householdId, entry.date);
  }
  revalidatePath("/week");
}
