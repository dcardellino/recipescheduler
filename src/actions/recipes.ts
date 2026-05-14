"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  recipe,
  recipeComponent,
  recipeIngredient,
  recipeStep,
  recipeTag,
  tag,
} from "@/db/schema";
import { requireHousehold, requireHouseholdAccess } from "@/lib/authz";
import {
  recipeFormSchema,
  type RecipeFormValues,
} from "@/lib/schemas/recipe";

async function upsertTagNames(
  tx: typeof db,
  householdId: string,
  names: string[],
): Promise<string[]> {
  if (names.length === 0) return [];
  await tx
    .insert(tag)
    .values(names.map((name) => ({ householdId, name })))
    .onConflictDoNothing({ target: [tag.householdId, tag.name] });
  const lowerNames = names.map((n) => n.toLocaleLowerCase("de-DE"));
  const rows = await tx
    .select({ id: tag.id })
    .from(tag)
    .where(
      and(
        eq(tag.householdId, householdId),
        sql`lower(${tag.name}) IN (${sql.join(
          lowerNames.map((n) => sql`${n}`),
          sql`, `,
        )})`,
      ),
    );
  return rows.map((r) => r.id);
}

export async function createRecipe(
  input: RecipeFormValues,
): Promise<{ id: string }> {
  const ctx = await requireHousehold();
  const data = recipeFormSchema.parse(input);

  return db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(recipe)
      .values({
        householdId: ctx.householdId,
        title: data.title,
        description: data.description ?? null,
        sourceUrl: data.sourceUrl ?? null,
        imageUrl: data.imageUrl ?? null,
        servings: data.servings,
        prepMinutes: data.prepMinutes ?? null,
        cookMinutes: data.cookMinutes ?? null,
        rating: data.rating ?? null,
        notes: data.notes ?? null,
        createdBy: ctx.userId,
      })
      .returning({ id: recipe.id });

    const recipeId = inserted.id;

    if (data.components.length > 0) {
      for (const comp of data.components) {
        const [insertedComp] = await tx
          .insert(recipeComponent)
          .values({
            recipeId,
            name: comp.name,
            position: comp.position,
          })
          .returning({ id: recipeComponent.id });

        if (comp.ingredients.length > 0) {
          await tx.insert(recipeIngredient).values(
            comp.ingredients.map((ing, idx) => ({
              recipeId,
              componentId: insertedComp.id,
              position: idx,
              quantity: ing.quantity ?? null,
              unit: ing.unit ?? null,
              name: ing.name,
              note: ing.note ?? null,
              category: ing.category,
            })),
          );
        }
      }
    }

    if (data.ingredients.length > 0) {
      await tx.insert(recipeIngredient).values(
        data.ingredients.map((ing, idx) => ({
          recipeId,
          componentId: null,
          position: idx,
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          name: ing.name,
          note: ing.note ?? null,
          category: ing.category,
        })),
      );
    }

    if (data.steps.length > 0) {
      await tx.insert(recipeStep).values(
        data.steps.map((step, idx) => ({
          recipeId,
          position: idx,
          text: step.text,
        })),
      );
    }

    if (data.tagNames.length > 0) {
      const tagIds = await upsertTagNames(
        tx as unknown as typeof db,
        ctx.householdId,
        data.tagNames,
      );
      if (tagIds.length > 0) {
        await tx
          .insert(recipeTag)
          .values(tagIds.map((tagId) => ({ recipeId, tagId })))
          .onConflictDoNothing();
      }
    }

    return { id: recipeId };
  }).then((result) => {
    revalidatePath("/recipes");
    return result;
  });
}

export async function updateRecipe(
  id: string,
  input: RecipeFormValues,
): Promise<{ id: string }> {
  const ctx = await requireHousehold();
  const data = recipeFormSchema.parse(input);

  const [existing] = await db
    .select({ householdId: recipe.householdId })
    .from(recipe)
    .where(eq(recipe.id, id))
    .limit(1);

  if (!existing) throw new Error("Rezept nicht gefunden.");
  requireHouseholdAccess(ctx, existing.householdId);

  await db.transaction(async (tx) => {
    await tx
      .update(recipe)
      .set({
        title: data.title,
        description: data.description ?? null,
        sourceUrl: data.sourceUrl ?? null,
        imageUrl: data.imageUrl ?? null,
        servings: data.servings,
        prepMinutes: data.prepMinutes ?? null,
        cookMinutes: data.cookMinutes ?? null,
        rating: data.rating ?? null,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(recipe.id, id));

    await tx
      .delete(recipeIngredient)
      .where(eq(recipeIngredient.recipeId, id));
    await tx
      .delete(recipeComponent)
      .where(eq(recipeComponent.recipeId, id));
    await tx.delete(recipeStep).where(eq(recipeStep.recipeId, id));
    await tx.delete(recipeTag).where(eq(recipeTag.recipeId, id));

    if (data.components.length > 0) {
      for (const comp of data.components) {
        const [insertedComp] = await tx
          .insert(recipeComponent)
          .values({
            recipeId: id,
            name: comp.name,
            position: comp.position,
          })
          .returning({ id: recipeComponent.id });

        if (comp.ingredients.length > 0) {
          await tx.insert(recipeIngredient).values(
            comp.ingredients.map((ing, idx) => ({
              recipeId: id,
              componentId: insertedComp.id,
              position: idx,
              quantity: ing.quantity ?? null,
              unit: ing.unit ?? null,
              name: ing.name,
              note: ing.note ?? null,
              category: ing.category,
            })),
          );
        }
      }
    }

    if (data.ingredients.length > 0) {
      await tx.insert(recipeIngredient).values(
        data.ingredients.map((ing, idx) => ({
          recipeId: id,
          componentId: null,
          position: idx,
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          name: ing.name,
          note: ing.note ?? null,
          category: ing.category,
        })),
      );
    }

    if (data.steps.length > 0) {
      await tx.insert(recipeStep).values(
        data.steps.map((step, idx) => ({
          recipeId: id,
          position: idx,
          text: step.text,
        })),
      );
    }

    if (data.tagNames.length > 0) {
      const tagIds = await upsertTagNames(
        tx as unknown as typeof db,
        ctx.householdId,
        data.tagNames,
      );
      if (tagIds.length > 0) {
        await tx
          .insert(recipeTag)
          .values(tagIds.map((tagId) => ({ recipeId: id, tagId })))
          .onConflictDoNothing();
      }
    }
  });

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  return { id };
}

export async function deleteRecipe(id: string): Promise<void> {
  const ctx = await requireHousehold();

  const [existing] = await db
    .select({ householdId: recipe.householdId })
    .from(recipe)
    .where(eq(recipe.id, id))
    .limit(1);

  if (!existing) return;
  requireHouseholdAccess(ctx, existing.householdId);

  await db.delete(recipe).where(eq(recipe.id, id));
  revalidatePath("/recipes");
}
