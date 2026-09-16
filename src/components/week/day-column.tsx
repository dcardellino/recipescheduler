import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DayEntry } from "@/components/week/day-entry";
import { RecipePicker } from "@/components/week/recipe-picker";
import {
  formatShortWeekday,
  formatDayNumber,
  isSameDay,
} from "@/lib/date";
import {
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ORDER,
  type MealTypeValue,
} from "@/lib/schemas/week";
import { catForMealType } from "@/lib/category-colors";
import { cn } from "@/lib/utils";
import type { WeekDay } from "@/lib/queries/week";
import type { RecipeListItem } from "@/lib/queries/recipes";

type DayColumnProps = {
  day: WeekDay;
  recipes: RecipeListItem[];
  availableTags: { id: string; name: string }[];
  variant?: "grid" | "list";
};

export function DayColumn({
  day,
  recipes,
  availableTags,
  variant = "grid",
}: DayColumnProps) {
  const today = new Date();
  const isToday = isSameDay(day.date, today);

  // Only meals that actually have entries get a heading — an empty day stays
  // as quiet as it was before meal types existed.
  const meals = MEAL_TYPES.map((mealType) => ({
    mealType,
    entries: day.entries.filter((e) => e.mealType === mealType),
  }))
    .filter((group) => group.entries.length > 0)
    .sort((a, b) => MEAL_TYPE_ORDER[a.mealType] - MEAL_TYPE_ORDER[b.mealType]);

  return (
    <section
      className={cn(
        "flex flex-col gap-2 rounded-md border bg-card p-2",
        isToday ? "border-accent-rust/50" : "border-border",
        variant === "list" && "sm:p-3",
      )}
    >
      <header className="flex items-baseline justify-between gap-2 px-1">
        <div>
          <div
            className={cn(
              "text-xs font-mono uppercase tracking-[0.08em]",
              isToday ? "text-accent-rust" : "text-muted-foreground",
            )}
          >
            {formatShortWeekday(day.date)}
          </div>
          <div className="text-sm">{formatDayNumber(day.date)}</div>
        </div>
        {isToday && (
          <span className="rounded-sm bg-accent-rust/10 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.08em] text-accent-rust">
            Heute
          </span>
        )}
      </header>

      {meals.length === 0 ? (
        <p className="px-1 py-2 text-xs text-muted-foreground">Keine Rezepte</p>
      ) : (
        <div className="flex flex-col gap-3">
          {meals.map((group) => (
            <MealGroup
              key={group.mealType}
              mealType={group.mealType}
              day={day}
              entries={group.entries}
              recipes={recipes}
              availableTags={availableTags}
            />
          ))}
        </div>
      )}

      <RecipePicker
        date={day.date}
        isoDate={day.iso}
        recipes={recipes}
        availableTags={availableTags}
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="w-full border border-dashed border-border text-muted-foreground hover:text-foreground"
          >
            <Plus />
            Rezept
          </Button>
        }
      />
    </section>
  );
}

function MealGroup({
  mealType,
  day,
  entries,
  recipes,
  availableTags,
}: {
  mealType: MealTypeValue;
  day: WeekDay;
  entries: WeekDay["entries"];
  recipes: RecipeListItem[];
  availableTags: { id: string; name: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-1 px-1">
        <h3 className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              catForMealType(mealType).dot,
            )}
          />
          {MEAL_TYPE_LABELS[mealType]}
        </h3>
        <RecipePicker
          date={day.date}
          isoDate={day.iso}
          recipes={recipes}
          availableTags={availableTags}
          defaultMealType={mealType}
          trigger={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Rezept zu ${MEAL_TYPE_LABELS[mealType]} hinzufügen`}
              className="text-muted-foreground hover:text-foreground"
            >
              <Plus />
            </Button>
          }
        />
      </div>
      {entries.map((entry) => (
        <DayEntry key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
