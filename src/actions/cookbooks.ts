"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { cookbook, cookbookRecipe, recipe } from "@/db/schema";
import {
  requireHousehold,
  requireHouseholdAccess,
  type HouseholdContext,
} from "@/lib/authz";
import {
  cookbookFormSchema,
  setRecipeCookbooksSchema,
  updateCookbookSchema,
  type CookbookFormInput,
  type SetRecipeCookbooksInput,
  type UpdateCookbookInput,
} from "@/lib/schemas/cookbook";

const DUPLICATE_NAME_MESSAGE =
  "Es gibt schon ein Kochbuch mit diesem Namen.";

function isDuplicateNameError(err: unknown): boolean {
  return (
    err instanceof Error &&
    err.message.includes("cookbook_household_name_unique")
  );
}

/** Asserts the cookbook exists and belongs to the caller's household. */
async function requireOwnCookbook(
  ctx: HouseholdContext,
  id: string,
): Promise<void> {
  const [existing] = await db
    .select({ householdId: cookbook.householdId })
    .from(cookbook)
    .where(eq(cookbook.id, id))
    .limit(1);
  if (!existing) throw new Error("Kochbuch nicht gefunden.");
  requireHouseholdAccess(ctx, existing.householdId);
}

/** Asserts the recipe exists and belongs to the caller's household. */
async function requireOwnRecipe(
  ctx: HouseholdContext,
  recipeId: string,
): Promise<void> {
  const [existing] = await db
    .select({ householdId: recipe.householdId })
    .from(recipe)
    .where(eq(recipe.id, recipeId))
    .limit(1);
  if (!existing) throw new Error("Rezept nicht gefunden.");
  requireHouseholdAccess(ctx, existing.householdId);
}

export async function createCookbook(
  input: CookbookFormInput,
): Promise<{ id: string }> {
  const ctx = await requireHousehold();
  const data = cookbookFormSchema.parse(input);

  try {
    const [created] = await db
      .insert(cookbook)
      .values({
        householdId: ctx.householdId,
        name: data.name,
        description: data.description ?? null,
        createdBy: ctx.userId,
      })
      .returning({ id: cookbook.id });

    revalidatePath("/cookbooks");
    return { id: created.id };
  } catch (err) {
    if (isDuplicateNameError(err)) throw new Error(DUPLICATE_NAME_MESSAGE);
    throw err;
  }
}

export async function updateCookbook(
  input: UpdateCookbookInput,
): Promise<void> {
  const ctx = await requireHousehold();
  const data = updateCookbookSchema.parse(input);
  await requireOwnCookbook(ctx, data.id);

  try {
    await db
      .update(cookbook)
      .set({
        name: data.name,
        description: data.description ?? null,
        updatedAt: new Date(),
      })
      .where(eq(cookbook.id, data.id));
  } catch (err) {
    if (isDuplicateNameError(err)) throw new Error(DUPLICATE_NAME_MESSAGE);
    throw err;
  }

  revalidatePath("/cookbooks");
  revalidatePath(`/cookbooks/${data.id}`);
}

/** Deletes the cookbook only — its recipes stay in the library. */
export async function deleteCookbook(id: string): Promise<void> {
  const ctx = await requireHousehold();
  await requireOwnCookbook(ctx, id);

  await db.delete(cookbook).where(eq(cookbook.id, id));
  revalidatePath("/cookbooks");
}

export async function addRecipeToCookbook(
  cookbookId: string,
  recipeId: string,
): Promise<void> {
  const ctx = await requireHousehold();
  await requireOwnCookbook(ctx, cookbookId);
  await requireOwnRecipe(ctx, recipeId);

  await db
    .insert(cookbookRecipe)
    .values({ cookbookId, recipeId })
    .onConflictDoNothing();

  revalidatePath("/cookbooks");
  revalidatePath(`/cookbooks/${cookbookId}`);
  revalidatePath(`/recipes/${recipeId}`);
}

export async function removeRecipeFromCookbook(
  cookbookId: string,
  recipeId: string,
): Promise<void> {
  const ctx = await requireHousehold();
  await requireOwnCookbook(ctx, cookbookId);

  await db
    .delete(cookbookRecipe)
    .where(
      and(
        eq(cookbookRecipe.cookbookId, cookbookId),
        eq(cookbookRecipe.recipeId, recipeId),
      ),
    );

  revalidatePath("/cookbooks");
  revalidatePath(`/cookbooks/${cookbookId}`);
  revalidatePath(`/recipes/${recipeId}`);
}

/**
 * Replaces a recipe's cookbook membership wholesale — what the "Zu Kochbuch
 * hinzufügen" dialog submits after the user ticked its checkboxes.
 */
export async function setRecipeCookbooks(
  input: SetRecipeCookbooksInput,
): Promise<void> {
  const ctx = await requireHousehold();
  const data = setRecipeCookbooksSchema.parse(input);
  await requireOwnRecipe(ctx, data.recipeId);

  // Ignore ids from other households rather than trusting the client's list.
  const ownCookbookIds =
    data.cookbookIds.length > 0
      ? (
          await db
            .select({ id: cookbook.id })
            .from(cookbook)
            .where(
              and(
                eq(cookbook.householdId, ctx.householdId),
                inArray(cookbook.id, data.cookbookIds),
              ),
            )
        ).map((row) => row.id)
      : [];

  await db.transaction(async (tx) => {
    await tx
      .delete(cookbookRecipe)
      .where(eq(cookbookRecipe.recipeId, data.recipeId));

    if (ownCookbookIds.length > 0) {
      await tx.insert(cookbookRecipe).values(
        ownCookbookIds.map((cookbookId) => ({
          cookbookId,
          recipeId: data.recipeId,
        })),
      );
    }
  });

  revalidatePath("/cookbooks");
  revalidatePath(`/recipes/${data.recipeId}`);
}
