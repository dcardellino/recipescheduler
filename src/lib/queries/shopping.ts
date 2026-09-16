import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { recipe, shoppingList, shoppingListItem } from "@/db/schema";
import { requireHousehold } from "@/lib/authz";
import { toISODate } from "@/lib/date";
import {
  INGREDIENT_CATEGORIES,
  type IngredientCategoryValue,
} from "@/lib/schemas/recipe";

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: IngredientCategoryValue;
  checked: boolean;
  customAdded: boolean;
  sourceRecipeIds: string[];
  position: number;
};

export type ShoppingRecipeGroup = {
  /** null for the catch-all group of manually added items. */
  recipeId: string | null;
  title: string;
  items: ShoppingItem[];
};

export type ShoppingListView = {
  id: string;
  weekStartDate: string;
  createdAt: Date;
  itemsByCategory: { category: IngredientCategoryValue; items: ShoppingItem[] }[];
  itemsByRecipe: ShoppingRecipeGroup[];
  total: number;
  done: number;
};

const CATEGORY_ORDER: Record<IngredientCategoryValue, number> =
  INGREDIENT_CATEGORIES.reduce(
    (acc, cat, idx) => {
      acc[cat] = idx;
      return acc;
    },
    {} as Record<IngredientCategoryValue, number>,
  );

async function loadListItems(listId: string): Promise<ShoppingItem[]> {
  const rows = await db
    .select()
    .from(shoppingListItem)
    .where(eq(shoppingListItem.shoppingListId, listId))
    .orderBy(asc(shoppingListItem.position));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    quantity: r.quantity,
    unit: r.unit,
    category: r.category as IngredientCategoryValue,
    checked: r.checked,
    customAdded: r.customAdded,
    sourceRecipeIds: r.sourceRecipeIds,
    position: r.position,
  }));
}

function groupByCategory(
  items: ShoppingItem[],
): ShoppingListView["itemsByCategory"] {
  const map = new Map<IngredientCategoryValue, ShoppingItem[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return Array.from(map.entries())
    .sort(
      ([a], [b]) => (CATEGORY_ORDER[a] ?? 99) - (CATEGORY_ORDER[b] ?? 99),
    )
    .map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.position - b.position),
    }));
}

const NO_RECIPE_GROUP_TITLE = "Ohne Rezept";

/**
 * Groups items by the recipes they came from. An ingredient that several
 * recipes share is listed under each of them — that is what makes the view
 * useful when you drop a recipe from the plan — so the group counts add up to
 * more than the list total.
 */
async function groupByRecipe(
  householdId: string,
  items: ShoppingItem[],
): Promise<ShoppingRecipeGroup[]> {
  const recipeIds = Array.from(
    new Set(items.flatMap((item) => item.sourceRecipeIds)),
  );

  const titles = new Map<string, string>();
  if (recipeIds.length > 0) {
    const rows = await db
      .select({ id: recipe.id, title: recipe.title })
      .from(recipe)
      .where(
        and(
          eq(recipe.householdId, householdId),
          inArray(recipe.id, recipeIds),
        ),
      );
    for (const row of rows) titles.set(row.id, row.title);
  }

  const groups = new Map<string, ShoppingRecipeGroup>();
  const ungrouped: ShoppingItem[] = [];

  for (const item of items) {
    // A deleted recipe leaves its id behind on the item; treat that like an
    // item without a source rather than inventing a group for it.
    const sources = item.sourceRecipeIds.filter((id) => titles.has(id));
    if (sources.length === 0) {
      ungrouped.push(item);
      continue;
    }
    for (const recipeId of sources) {
      const group = groups.get(recipeId) ?? {
        recipeId,
        title: titles.get(recipeId) as string,
        items: [],
      };
      group.items.push(item);
      groups.set(recipeId, group);
    }
  }

  const result = Array.from(groups.values()).sort((a, b) =>
    a.title.localeCompare(b.title, "de-DE"),
  );
  for (const group of result) {
    group.items.sort((a, b) => a.position - b.position);
  }

  if (ungrouped.length > 0) {
    result.push({
      recipeId: null,
      title: NO_RECIPE_GROUP_TITLE,
      items: ungrouped.sort((a, b) => a.position - b.position),
    });
  }

  return result;
}

export async function getShoppingListForWeek(
  weekStartDate: Date,
): Promise<ShoppingListView | null> {
  const { householdId } = await requireHousehold();
  const iso = toISODate(weekStartDate);

  const [list] = await db
    .select()
    .from(shoppingList)
    .where(
      and(
        eq(shoppingList.householdId, householdId),
        eq(shoppingList.weekStartDate, iso),
      ),
    )
    .limit(1);

  if (!list) return null;

  const items = await loadListItems(list.id);
  return {
    id: list.id,
    weekStartDate: list.weekStartDate,
    createdAt: list.createdAt,
    itemsByCategory: groupByCategory(items),
    itemsByRecipe: await groupByRecipe(householdId, items),
    total: items.length,
    done: items.filter((i) => i.checked).length,
  };
}

export async function getShoppingList(
  listId: string,
): Promise<ShoppingListView | null> {
  const { householdId } = await requireHousehold();

  const [list] = await db
    .select()
    .from(shoppingList)
    .where(
      and(
        eq(shoppingList.id, listId),
        eq(shoppingList.householdId, householdId),
      ),
    )
    .limit(1);

  if (!list) return null;

  const items = await loadListItems(list.id);
  return {
    id: list.id,
    weekStartDate: list.weekStartDate,
    createdAt: list.createdAt,
    itemsByCategory: groupByCategory(items),
    itemsByRecipe: await groupByRecipe(householdId, items),
    total: items.length,
    done: items.filter((i) => i.checked).length,
  };
}

export type ShoppingListSummary = {
  id: string;
  weekStartDate: string;
  createdAt: Date;
  total: number;
  done: number;
};

export async function listShoppingListHistory(
  limit = 8,
): Promise<ShoppingListSummary[]> {
  const { householdId } = await requireHousehold();

  const lists = await db
    .select()
    .from(shoppingList)
    .where(eq(shoppingList.householdId, householdId))
    .orderBy(desc(shoppingList.weekStartDate))
    .limit(limit);

  if (lists.length === 0) return [];

  const summaries: ShoppingListSummary[] = [];
  for (const l of lists) {
    const items = await db
      .select({ checked: shoppingListItem.checked })
      .from(shoppingListItem)
      .where(eq(shoppingListItem.shoppingListId, l.id));
    summaries.push({
      id: l.id,
      weekStartDate: l.weekStartDate,
      createdAt: l.createdAt,
      total: items.length,
      done: items.filter((i) => i.checked).length,
    });
  }
  return summaries;
}

export async function shoppingListExistsForWeek(
  weekStartDate: Date,
): Promise<boolean> {
  const { householdId } = await requireHousehold();
  const iso = toISODate(weekStartDate);
  const [row] = await db
    .select({ id: shoppingList.id })
    .from(shoppingList)
    .where(
      and(
        eq(shoppingList.householdId, householdId),
        eq(shoppingList.weekStartDate, iso),
      ),
    )
    .limit(1);
  return !!row;
}
