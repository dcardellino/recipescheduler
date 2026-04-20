import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { shoppingList, shoppingListItem } from "@/db/schema";
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

export type ShoppingListView = {
  id: string;
  weekStartDate: string;
  createdAt: Date;
  itemsByCategory: { category: IngredientCategoryValue; items: ShoppingItem[] }[];
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
