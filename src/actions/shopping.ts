"use server";

import { and, asc, between, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  mealPlanEntry,
  recipe,
  recipeIngredient,
  shoppingList,
  shoppingListItem,
} from "@/db/schema";
import { ForbiddenError, requireHousehold, requireHouseholdAccess } from "@/lib/authz";
import { addDays, parseISODate, toISODate } from "@/lib/date";
import {
  addCustomItemSchema,
  deleteItemSchema,
  generateShoppingListSchema,
  toggleItemSchema,
  type AddCustomItemInput,
  type DeleteItemInput,
  type GenerateShoppingListInput,
  type ToggleItemInput,
} from "@/lib/schemas/shopping";
import {
  aggregateIngredients,
  applyOptimization,
  type AggregatedItem,
  type RawIngredient,
} from "@/lib/shopping-list";
import type { IngredientCategoryValue } from "@/lib/schemas/recipe";
import { optimizeShoppingListWithAiProvider } from "@/lib/ai-shopping-optimize";
import {
  getMonthlyAiShoppingOptimizeCount,
  recordAiShoppingOptimizeUsage,
} from "@/lib/ai-usage";

const AI_SHOPPING_OPTIMIZE_MONTHLY_LIMIT = 20;

async function assertItemBelongsToHousehold(
  itemId: string,
  ctx: { householdId: string },
): Promise<string> {
  const [row] = await db
    .select({
      listId: shoppingListItem.shoppingListId,
      listHouseholdId: shoppingList.householdId,
    })
    .from(shoppingListItem)
    .innerJoin(
      shoppingList,
      eq(shoppingListItem.shoppingListId, shoppingList.id),
    )
    .where(eq(shoppingListItem.id, itemId))
    .limit(1);

  if (!row) throw new ForbiddenError("Eintrag nicht gefunden.");
  requireHouseholdAccess(
    { householdId: ctx.householdId, userId: "", role: "member" },
    row.listHouseholdId,
  );
  return row.listId;
}

async function assertListBelongsToHousehold(
  listId: string,
  ctx: { householdId: string },
): Promise<void> {
  const [row] = await db
    .select({ householdId: shoppingList.householdId })
    .from(shoppingList)
    .where(eq(shoppingList.id, listId))
    .limit(1);
  if (!row) throw new ForbiddenError("Liste nicht gefunden.");
  requireHouseholdAccess(
    { householdId: ctx.householdId, userId: "", role: "member" },
    row.householdId,
  );
}

export async function generateShoppingList(
  input: GenerateShoppingListInput,
): Promise<{ id: string }> {
  const ctx = await requireHousehold();
  const { weekStartDate } = generateShoppingListSchema.parse(input);

  const weekStart = parseISODate(weekStartDate);
  const weekEndIso = toISODate(addDays(weekStart, 6));

  const rows = await db
    .select({
      entryId: mealPlanEntry.id,
      entryServings: mealPlanEntry.servings,
      recipeId: recipe.id,
      recipeServings: recipe.servings,
      ingredientName: recipeIngredient.name,
      ingredientQuantity: recipeIngredient.quantity,
      ingredientUnit: recipeIngredient.unit,
      ingredientCategory: recipeIngredient.category,
    })
    .from(mealPlanEntry)
    .innerJoin(recipe, eq(mealPlanEntry.recipeId, recipe.id))
    .innerJoin(
      recipeIngredient,
      eq(recipeIngredient.recipeId, recipe.id),
    )
    .where(
      and(
        eq(mealPlanEntry.householdId, ctx.householdId),
        between(mealPlanEntry.date, weekStartDate, weekEndIso),
      ),
    );

  const raw: RawIngredient[] = rows.map((r) => ({
    name: r.ingredientName,
    quantity: r.ingredientQuantity,
    unit: r.ingredientUnit,
    category: r.ingredientCategory as IngredientCategoryValue,
    sourceRecipeId: r.recipeId,
    servingsFactor:
      r.recipeServings && r.recipeServings > 0
        ? r.entryServings / r.recipeServings
        : 1,
  }));

  const aggregated = aggregateIngredients(raw);

  return db
    .transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: shoppingList.id })
        .from(shoppingList)
        .where(
          and(
            eq(shoppingList.householdId, ctx.householdId),
            eq(shoppingList.weekStartDate, weekStartDate),
          ),
        )
        .limit(1);

      let listId: string;
      if (existing) {
        listId = existing.id;
        await tx
          .delete(shoppingListItem)
          .where(
            and(
              eq(shoppingListItem.shoppingListId, listId),
              eq(shoppingListItem.customAdded, false),
            ),
          );
      } else {
        const [inserted] = await tx
          .insert(shoppingList)
          .values({
            householdId: ctx.householdId,
            weekStartDate,
          })
          .returning({ id: shoppingList.id });
        listId = inserted.id;
      }

      if (aggregated.length > 0) {
        await tx.insert(shoppingListItem).values(
          aggregated.map((item, idx) => ({
            shoppingListId: listId,
            name: item.name,
            quantity: item.quantity ?? null,
            unit: item.unit ?? null,
            category: item.category,
            customAdded: false,
            sourceRecipeIds: item.sourceRecipeIds,
            position: idx,
          })),
        );
      }

      if (existing) {
        const customItems = await tx
          .select({ id: shoppingListItem.id })
          .from(shoppingListItem)
          .where(
            and(
              eq(shoppingListItem.shoppingListId, listId),
              eq(shoppingListItem.customAdded, true),
            ),
          )
          .orderBy(asc(shoppingListItem.position));

        for (let i = 0; i < customItems.length; i++) {
          await tx
            .update(shoppingListItem)
            .set({ position: aggregated.length + i })
            .where(eq(shoppingListItem.id, customItems[i].id));
        }
      }

      return { id: listId };
    })
    .then((result) => {
      revalidatePath("/shopping");
      revalidatePath("/week");
      return result;
    });
}

type OptimizableItem = AggregatedItem & { id: string; checked: boolean };

export async function optimizeShoppingListWithAi(listId: string): Promise<void> {
  const ctx = await requireHousehold();
  await assertListBelongsToHousehold(listId, ctx);

  const usageCount = await getMonthlyAiShoppingOptimizeCount(ctx.householdId);
  if (usageCount >= AI_SHOPPING_OPTIMIZE_MONTHLY_LIMIT) {
    throw new Error(
      "KI-Optimierungs-Limit für diesen Monat erreicht. Die Liste bleibt unverändert.",
    );
  }

  const rows = await db
    .select()
    .from(shoppingListItem)
    .where(
      and(
        eq(shoppingListItem.shoppingListId, listId),
        eq(shoppingListItem.customAdded, false),
      ),
    )
    .orderBy(asc(shoppingListItem.position));

  if (rows.length === 0) return;

  const items: OptimizableItem[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    quantity: r.quantity,
    unit: r.unit,
    category: r.category as IngredientCategoryValue,
    sourceRecipeIds: r.sourceRecipeIds,
    checked: r.checked,
  }));

  const result = await optimizeShoppingListWithAiProvider(
    items.map((item, index) => ({
      index,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
    })),
  );

  await recordAiShoppingOptimizeUsage(
    ctx.householdId,
    ctx.userId,
    result.ok,
    result.tokensUsed,
  );

  if (!result.ok) {
    throw new Error("KI-Optimierung ist fehlgeschlagen. Versuch's später erneut.");
  }

  const optimized = applyOptimization(
    items as unknown as AggregatedItem[],
    result.optimization,
  ) as unknown as OptimizableItem[];

  const keptIds = new Set(optimized.map((item) => item.id));
  const removedIds = rows
    .map((r) => r.id)
    .filter((id) => !keptIds.has(id));

  await db.transaction(async (tx) => {
    if (removedIds.length > 0) {
      await tx
        .delete(shoppingListItem)
        .where(inArray(shoppingListItem.id, removedIds));
    }

    for (let i = 0; i < optimized.length; i++) {
      const item = optimized[i];
      await tx
        .update(shoppingListItem)
        .set({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          sourceRecipeIds: item.sourceRecipeIds,
          position: i,
        })
        .where(eq(shoppingListItem.id, item.id));
    }

    const customItems = await tx
      .select({ id: shoppingListItem.id })
      .from(shoppingListItem)
      .where(
        and(
          eq(shoppingListItem.shoppingListId, listId),
          eq(shoppingListItem.customAdded, true),
        ),
      )
      .orderBy(asc(shoppingListItem.position));

    for (let i = 0; i < customItems.length; i++) {
      await tx
        .update(shoppingListItem)
        .set({ position: optimized.length + i })
        .where(eq(shoppingListItem.id, customItems[i].id));
    }
  });

  revalidatePath("/shopping");
}

export async function toggleItemChecked(
  input: ToggleItemInput,
): Promise<void> {
  const ctx = await requireHousehold();
  const data = toggleItemSchema.parse(input);
  await assertItemBelongsToHousehold(data.id, ctx);

  await db
    .update(shoppingListItem)
    .set({ checked: data.checked })
    .where(eq(shoppingListItem.id, data.id));

  revalidatePath("/shopping");
}

export async function addCustomItem(
  input: AddCustomItemInput,
): Promise<{ id: string }> {
  const ctx = await requireHousehold();
  const data = addCustomItemSchema.parse(input);
  await assertListBelongsToHousehold(data.shoppingListId, ctx);

  const [maxRow] = await db
    .select({
      max: sql<number>`COALESCE(MAX(${shoppingListItem.position}), -1)`,
    })
    .from(shoppingListItem)
    .where(eq(shoppingListItem.shoppingListId, data.shoppingListId));

  const nextPosition = (maxRow?.max ?? -1) + 1;

  const [inserted] = await db
    .insert(shoppingListItem)
    .values({
      shoppingListId: data.shoppingListId,
      name: data.name,
      quantity: data.quantity ?? null,
      unit: data.unit ?? null,
      category: data.category,
      customAdded: true,
      sourceRecipeIds: [],
      position: nextPosition,
    })
    .returning({ id: shoppingListItem.id });

  revalidatePath("/shopping");
  return { id: inserted.id };
}

export async function deleteItem(input: DeleteItemInput): Promise<void> {
  const ctx = await requireHousehold();
  const data = deleteItemSchema.parse(input);
  await assertItemBelongsToHousehold(data.id, ctx);

  await db.delete(shoppingListItem).where(eq(shoppingListItem.id, data.id));
  revalidatePath("/shopping");
}

export async function deleteShoppingList(listId: string): Promise<void> {
  const ctx = await requireHousehold();
  await assertListBelongsToHousehold(listId, ctx);

  await db.delete(shoppingList).where(eq(shoppingList.id, listId));
  revalidatePath("/shopping");
}
