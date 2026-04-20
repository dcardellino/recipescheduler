import { Skeleton } from "@/components/ui/skeleton";

function DayColumnSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-2">
      <div className="flex items-baseline justify-between px-1">
        <Skeleton className="h-3 w-6" />
        <Skeleton className="h-4 w-10" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 rounded-md p-1.5">
          <Skeleton className="size-10 rounded shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md p-1.5">
          <Skeleton className="size-10 rounded shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </div>
      <Skeleton className="h-7 w-full rounded-md" />
    </div>
  );
}

export default function WeekLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="size-8 rounded-md" />
        </div>
        <Skeleton className="h-9 w-44 rounded-md" />
      </div>
      <div className="hidden md:grid md:grid-cols-7 md:gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <DayColumnSkeleton key={i} />
        ))}
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-2 rounded-md bg-muted/30 p-2">
              <Skeleton className="size-10 rounded shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
