import "server-only";
import { and, asc, between, eq } from "drizzle-orm";
import { db } from "@/db";
import { mealPlanEntry, recipe } from "@/db/schema";
import { requireHousehold } from "@/lib/authz";
import { addDays, getWeekDays, toISODate } from "@/lib/date";
import type { MealType } from "@/db/schema";

export type DayEntry = {
  id: string;
  date: string;
  mealType: MealType;
  servings: number;
  notes: string | null;
  recipe: {
    id: string;
    title: string;
    imageUrl: string | null;
    prepMinutes: number | null;
    cookMinutes: number | null;
    defaultServings: number;
  } | null;
};

export type WeekDay = {
  date: Date;
  iso: string;
  entries: DayEntry[];
};

export async function getWeek(weekStart: Date): Promise<WeekDay[]> {
  const { householdId } = await requireHousehold();

  const weekStartIso = toISODate(weekStart);
  const weekEndIso = toISODate(addDays(weekStart, 6));

  const rows = await db
    .select({
      id: mealPlanEntry.id,
      date: mealPlanEntry.date,
      mealType: mealPlanEntry.mealType,
      servings: mealPlanEntry.servings,
      notes: mealPlanEntry.notes,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      recipeImageUrl: recipe.imageUrl,
      recipePrepMinutes: recipe.prepMinutes,
      recipeCookMinutes: recipe.cookMinutes,
      recipeServings: recipe.servings,
    })
    .from(mealPlanEntry)
    .leftJoin(recipe, eq(mealPlanEntry.recipeId, recipe.id))
    .where(
      and(
        eq(mealPlanEntry.householdId, householdId),
        between(mealPlanEntry.date, weekStartIso, weekEndIso),
      ),
    )
    .orderBy(asc(mealPlanEntry.date), asc(mealPlanEntry.createdAt));

  const entriesByDate = new Map<string, DayEntry[]>();
  for (const row of rows) {
    const list = entriesByDate.get(row.date) ?? [];
    list.push({
      id: row.id,
      date: row.date,
      mealType: row.mealType,
      servings: row.servings,
      notes: row.notes,
      recipe: row.recipeId
        ? {
            id: row.recipeId,
            title: row.recipeTitle ?? "",
            imageUrl: row.recipeImageUrl,
            prepMinutes: row.recipePrepMinutes,
            cookMinutes: row.recipeCookMinutes,
            defaultServings: row.recipeServings ?? 2,
          }
        : null,
    });
    entriesByDate.set(row.date, list);
  }

  return getWeekDays(weekStart).map((d) => {
    const iso = toISODate(d);
    return { date: d, iso, entries: entriesByDate.get(iso) ?? [] };
  });
}
