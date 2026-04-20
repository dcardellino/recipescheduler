import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DayEntry } from "@/components/week/day-entry";
import { RecipePicker } from "@/components/week/recipe-picker";
import {
  formatShortWeekday,
  formatDayNumber,
  isSameDay,
} from "@/lib/date";
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

  return (
    <section
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-card p-2",
        isToday ? "border-primary/40" : "border-border",
        variant === "list" && "sm:p-3",
      )}
    >
      <header className="flex items-baseline justify-between gap-2 px-1">
        <div>
          <div
            className={cn(
              "text-xs font-medium uppercase",
              isToday ? "text-primary" : "text-muted-foreground",
            )}
          >
            {formatShortWeekday(day.date)}
          </div>
          <div className="text-sm">{formatDayNumber(day.date)}</div>
        </div>
        {isToday && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Heute
          </span>
        )}
      </header>

      <div className="flex flex-col gap-1.5">
        {day.entries.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">
            Keine Rezepte
          </p>
        ) : (
          day.entries.map((entry) => (
            <DayEntry key={entry.id} entry={entry} />
          ))
        )}
      </div>

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
