import "server-only";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  recipe,
  recipeIngredient,
  recipeStep,
  recipeTag,
  tag,
} from "@/db/schema";
import { requireHousehold } from "@/lib/authz";
import type { SortOption } from "@/lib/schemas/recipe";

export type RecipeListItem = {
  id: string;
  title: string;
  imageUrl: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  rating: number | null;
  createdAt: Date;
  tags: { id: string; name: string }[];
};

export type ListRecipesParams = {
  q?: string;
  tagIds?: string[];
  sort?: SortOption;
};

export async function listRecipes(
  params: ListRecipesParams = {},
): Promise<RecipeListItem[]> {
  const { householdId } = await requireHousehold();
  const { q, tagIds, sort = "recent" } = params;

  const conditions = [eq(recipe.householdId, householdId)];

  if (q && q.trim().length > 0) {
    const pattern = `%${q.trim()}%`;
    const ingredientMatch = sql`EXISTS (SELECT 1 FROM ${recipeIngredient} WHERE ${recipeIngredient.recipeId} = ${recipe.id} AND ${recipeIngredient.name} ILIKE ${pattern})`;
    conditions.push(
      or(ilike(recipe.title, pattern), ingredientMatch) as NonNullable<
        ReturnType<typeof or>
      >,
    );
  }

  if (tagIds && tagIds.length > 0) {
    const tagIdList = sql.join(
      tagIds.map((id) => sql`${id}::uuid`),
      sql`, `,
    );
    const tagMatch = sql`(
      SELECT COUNT(DISTINCT ${recipeTag.tagId})
      FROM ${recipeTag}
      WHERE ${recipeTag.recipeId} = ${recipe.id}
        AND ${recipeTag.tagId} IN (${tagIdList})
    ) = ${tagIds.length}`;
    conditions.push(tagMatch as NonNullable<ReturnType<typeof or>>);
  }

  const orderBy = (() => {
    switch (sort) {
      case "title":
        return [asc(recipe.title)];
      case "rating":
        return [desc(sql`COALESCE(${recipe.rating}, 0)`), desc(recipe.createdAt)];
      case "recent":
      default:
        return [desc(recipe.createdAt)];
    }
  })();

  const rows = await db
    .select({
      id: recipe.id,
      title: recipe.title,
      imageUrl: recipe.imageUrl,
      prepMinutes: recipe.prepMinutes,
      cookMinutes: recipe.cookMinutes,
      rating: recipe.rating,
      createdAt: recipe.createdAt,
    })
    .from(recipe)
    .where(and(...conditions))
    .orderBy(...orderBy);

  if (rows.length === 0) return [];

  const recipeIds = rows.map((r) => r.id);
  const tagRows = await db
    .select({
      recipeId: recipeTag.recipeId,
      id: tag.id,
      name: tag.name,
    })
    .from(recipeTag)
    .innerJoin(tag, eq(recipeTag.tagId, tag.id))
    .where(inArray(recipeTag.recipeId, recipeIds))
    .orderBy(asc(tag.name));

  const tagsByRecipe = new Map<string, { id: string; name: string }[]>();
  for (const row of tagRows) {
    const list = tagsByRecipe.get(row.recipeId) ?? [];
    list.push({ id: row.id, name: row.name });
    tagsByRecipe.set(row.recipeId, list);
  }

  return rows.map((r) => ({
    ...r,
    rating: r.rating ?? null,
    tags: tagsByRecipe.get(r.id) ?? [],
  }));
}

export type RecipeDetail = {
  id: string;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  imageUrl: string | null;
  servings: number;
  prepMinutes: number | null;
  cookMinutes: number | null;
  rating: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  ingredients: {
    id: string;
    position: number;
    quantity: number | null;
    unit: string | null;
    name: string;
    note: string | null;
    category: string;
  }[];
  steps: {
    id: string;
    position: number;
    text: string;
  }[];
  tags: { id: string; name: string }[];
};

export async function getRecipe(id: string): Promise<RecipeDetail | null> {
  const { householdId } = await requireHousehold();

  const [row] = await db
    .select()
    .from(recipe)
    .where(and(eq(recipe.id, id), eq(recipe.householdId, householdId)))
    .limit(1);

  if (!row) return null;

  const [ingredients, steps, tagRows] = await Promise.all([
    db
      .select()
      .from(recipeIngredient)
      .where(eq(recipeIngredient.recipeId, id))
      .orderBy(asc(recipeIngredient.position)),
    db
      .select()
      .from(recipeStep)
      .where(eq(recipeStep.recipeId, id))
      .orderBy(asc(recipeStep.position)),
    db
      .select({ id: tag.id, name: tag.name })
      .from(recipeTag)
      .innerJoin(tag, eq(recipeTag.tagId, tag.id))
      .where(eq(recipeTag.recipeId, id))
      .orderBy(asc(tag.name)),
  ]);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    sourceUrl: row.sourceUrl,
    imageUrl: row.imageUrl,
    servings: row.servings,
    prepMinutes: row.prepMinutes,
    cookMinutes: row.cookMinutes,
    rating: row.rating,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ingredients: ingredients.map((i) => ({
      id: i.id,
      position: i.position,
      quantity: i.quantity,
      unit: i.unit,
      name: i.name,
      note: i.note,
      category: i.category,
    })),
    steps: steps.map((s) => ({ id: s.id, position: s.position, text: s.text })),
    tags: tagRows,
  };
}

export async function listTags(): Promise<{ id: string; name: string }[]> {
  const { householdId } = await requireHousehold();
  return db
    .select({ id: tag.id, name: tag.name })
    .from(tag)
    .where(eq(tag.householdId, householdId))
    .orderBy(asc(tag.name));
}
