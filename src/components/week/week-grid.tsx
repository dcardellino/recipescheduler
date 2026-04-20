import { DayColumn } from "@/components/week/day-column";
import type { WeekDay } from "@/lib/queries/week";
import type { RecipeListItem } from "@/lib/queries/recipes";

type WeekGridProps = {
  days: WeekDay[];
  recipes: RecipeListItem[];
  availableTags: { id: string; name: string }[];
};

export function WeekGrid({ days, recipes, availableTags }: WeekGridProps) {
  return (
    <>
      <div className="hidden gap-3 md:grid md:grid-cols-7">
        {days.map((day) => (
          <DayColumn
            key={day.iso}
            day={day}
            recipes={recipes}
            availableTags={availableTags}
          />
        ))}
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {days.map((day) => (
          <DayColumn
            key={day.iso}
            day={day}
            recipes={recipes}
            availableTags={availableTags}
            variant="list"
          />
        ))}
      </div>
    </>
  );
}
