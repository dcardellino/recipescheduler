import { cn } from "@/lib/utils";

type ProgressBarProps = {
  done: number;
  total: number;
  className?: string;
};

export function ProgressBar({ done, total, className }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex flex-col gap-1 rounded-md border border-border bg-card/95 px-3 py-2 backdrop-blur",
        className,
      )}
    >
      <div className="flex items-center justify-between text-sm">
        <span>
          {done} von {total} erledigt
        </span>
        <span
          className={cn(
            "text-xs text-muted-foreground",
            allDone && "text-accent-rust",
          )}
        >
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-sm bg-muted">
        <div
          className={cn(
            "h-full rounded-sm transition-all",
            allDone ? "bg-success" : "bg-accent-rust",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
