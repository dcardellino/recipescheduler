import { GenerateShoppingListButton } from "@/components/week/generate-shopping-list-button";
import { WeekGrid } from "@/components/week/week-grid";
import { WeekHeader } from "@/components/week/week-header";
import {
  formatWeekParam,
  getWeekStart,
  parseWeekParam,
  toISODate,
} from "@/lib/date";
import { listRecipes, listTags } from "@/lib/queries/recipes";
import { shoppingListExistsForWeek } from "@/lib/queries/shopping";
import { getWeek } from "@/lib/queries/week";

type SearchParams = Promise<{ week?: string }>;

export default async function WeekPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { week } = await searchParams;
  const weekStart = parseWeekParam(week) ?? getWeekStart();
  const weekStartIso = toISODate(weekStart);

  const [days, recipes, tags, listExists] = await Promise.all([
    getWeek(weekStart),
    listRecipes(),
    listTags(),
    shoppingListExistsForWeek(weekStart),
  ]);

  const totalEntries = days.reduce((acc, d) => acc + d.entries.length, 0);

  return (
    <section className="flex flex-col gap-4">
      <WeekHeader weekStart={weekStart}>
        <GenerateShoppingListButton
          weekStartDate={weekStartIso}
          listExists={listExists}
          entriesCount={totalEntries}
        />
      </WeekHeader>
      <WeekGrid days={days} recipes={recipes} availableTags={tags} />
    </section>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { week } = await searchParams;
  const weekStart = parseWeekParam(week) ?? getWeekStart();
  return { title: `Wochenplan · KW ${formatWeekParam(weekStart).split("W")[1]}` };
}
