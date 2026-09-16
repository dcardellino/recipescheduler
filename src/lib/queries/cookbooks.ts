import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { cookbook, cookbookRecipe, recipe, recipeTag, tag } from "@/db/schema";
import { requireHousehold } from "@/lib/authz";
import type { RecipeListItem } from "@/lib/queries/recipes";

export type CookbookListItem = {
  id: string;
  name: string;
  description: string | null;
  recipeCount: number;
  /** Up to four recipe photos for the cover mosaic. */
  coverImageUrls: string[];
};

export type CookbookDetail = {
  id: string;
  name: string;
  description: string | null;
  recipes: RecipeListItem[];
};

const COVER_IMAGE_COUNT = 4;

export async function listCookbooks(): Promise<CookbookListItem[]> {
  const { householdId } = await requireHousehold();

  const books = await db
    .select({
      id: cookbook.id,
      name: cookbook.name,
      description: cookbook.description,
      recipeCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${cookbookRecipe}
        WHERE ${cookbookRecipe.cookbookId} = ${cookbook.id}
      )`,
    })
    .from(cookbook)
    .where(eq(cookbook.householdId, householdId))
    .orderBy(asc(cookbook.name));

  if (books.length === 0) return [];

  const coverRows = await db
    .select({
      cookbookId: cookbookRecipe.cookbookId,
      imageUrl: recipe.imageUrl,
      addedAt: cookbookRecipe.addedAt,
    })
    .from(cookbookRecipe)
    .innerJoin(recipe, eq(cookbookRecipe.recipeId, recipe.id))
    .where(
      inArray(
        cookbookRecipe.cookbookId,
        books.map((b) => b.id),
      ),
    )
    .orderBy(desc(cookbookRecipe.addedAt));

  const coversByCookbook = new Map<string, string[]>();
  for (const row of coverRows) {
    if (!row.imageUrl) continue;
    const covers = coversByCookbook.get(row.cookbookId) ?? [];
    if (covers.length >= COVER_IMAGE_COUNT) continue;
    covers.push(row.imageUrl);
    coversByCookbook.set(row.cookbookId, covers);
  }

  return books.map((b) => ({
    ...b,
    coverImageUrls: coversByCookbook.get(b.id) ?? [],
  }));
}

export async function getCookbook(id: string): Promise<CookbookDetail | null> {
  const { householdId } = await requireHousehold();

  const [book] = await db
    .select()
    .from(cookbook)
    .where(and(eq(cookbook.id, id), eq(cookbook.householdId, householdId)))
    .limit(1);

  if (!book) return null;

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
    .from(cookbookRecipe)
    .innerJoin(recipe, eq(cookbookRecipe.recipeId, recipe.id))
    .where(eq(cookbookRecipe.cookbookId, id))
    .orderBy(asc(cookbookRecipe.position), desc(cookbookRecipe.addedAt));

  const recipeIds = rows.map((r) => r.id);
  const tagsByRecipe = new Map<string, { id: string; name: string }[]>();
  if (recipeIds.length > 0) {
    const tagRows = await db
      .select({ recipeId: recipeTag.recipeId, id: tag.id, name: tag.name })
      .from(recipeTag)
      .innerJoin(tag, eq(recipeTag.tagId, tag.id))
      .where(inArray(recipeTag.recipeId, recipeIds))
      .orderBy(asc(tag.name));
    for (const row of tagRows) {
      const list = tagsByRecipe.get(row.recipeId) ?? [];
      list.push({ id: row.id, name: row.name });
      tagsByRecipe.set(row.recipeId, list);
    }
  }

  return {
    id: book.id,
    name: book.name,
    description: book.description,
    recipes: rows.map((r) => ({
      ...r,
      rating: r.rating ?? null,
      tags: tagsByRecipe.get(r.id) ?? [],
    })),
  };
}

/** The household's cookbooks plus which of them already hold this recipe. */
export async function listCookbooksForRecipe(recipeId: string): Promise<{
  cookbooks: { id: string; name: string }[];
  selectedIds: string[];
}> {
  const { householdId } = await requireHousehold();

  const [books, memberships] = await Promise.all([
    db
      .select({ id: cookbook.id, name: cookbook.name })
      .from(cookbook)
      .where(eq(cookbook.householdId, householdId))
      .orderBy(asc(cookbook.name)),
    db
      .select({ cookbookId: cookbookRecipe.cookbookId })
      .from(cookbookRecipe)
      .innerJoin(cookbook, eq(cookbookRecipe.cookbookId, cookbook.id))
      .where(
        and(
          eq(cookbookRecipe.recipeId, recipeId),
          eq(cookbook.householdId, householdId),
        ),
      ),
  ]);

  return {
    cookbooks: books,
    selectedIds: memberships.map((m) => m.cookbookId),
  };
}
