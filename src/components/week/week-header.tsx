"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addWeeks,
  formatWeekParam,
  formatWeekTitle,
  getWeekStart,
} from "@/lib/date";

type WeekHeaderProps = {
  weekStart: Date;
  children?: React.ReactNode;
};

export function WeekHeader({ weekStart, children }: WeekHeaderProps) {
  const router = useRouter();

  function goTo(offset: number) {
    const target = addWeeks(weekStart, offset);
    router.push(`/week?week=${formatWeekParam(target)}`);
  }

  const today = getWeekStart();
  const isCurrentWeek = formatWeekParam(today) === formatWeekParam(weekStart);

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Vorherige Woche"
          onClick={() => goTo(-1)}
        >
          <ChevronLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Woche</span>
          <h1 className="font-heading text-xl sm:text-2xl leading-tight">
            {formatWeekTitle(weekStart)}
          </h1>
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Nächste Woche"
          onClick={() => goTo(1)}
        >
          <ChevronRight />
        </Button>
        {!isCurrentWeek && (
          <Link
            href="/week"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Heute
          </Link>
        )}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
