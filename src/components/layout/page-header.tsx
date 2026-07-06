import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  meta,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        {eyebrow ? (
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="font-heading text-3xl leading-tight tracking-tight">
          {title}
        </h1>
      </div>
      {meta || actions ? (
        <div className="flex shrink-0 items-center gap-3">
          {meta ? (
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              {meta}
            </span>
          ) : null}
          {actions}
        </div>
      ) : null}
    </header>
  );
}
