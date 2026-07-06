import Link from "next/link";
import { format, getISOWeek, parseISO } from "date-fns";
import { de } from "date-fns/locale/de";
import { ChevronRight } from "lucide-react";
import type { ShoppingListSummary } from "@/lib/queries/shopping";

type HistoryListProps = {
  lists: ShoppingListSummary[];
};

export function HistoryList({ lists }: HistoryListProps) {
  if (lists.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-10 text-center text-sm text-muted-foreground">
        Noch keine früheren Listen.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {lists.map((list) => {
        const weekStart = parseISO(list.weekStartDate);
        const kw = getISOWeek(weekStart);
        const href = `/shopping?list=${list.id}`;
        return (
          <li key={list.id}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">KW {kw}</div>
                <div className="text-xs text-muted-foreground">
                  ab {format(weekStart, "d. MMM yyyy", { locale: de })}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {list.done}/{list.total}
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
