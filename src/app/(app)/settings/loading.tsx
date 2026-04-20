import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-9 w-32" />
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
        <Skeleton className="h-5 w-40" />
        <Separator />
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full max-w-sm" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
        <Skeleton className="h-5 w-28" />
        <Separator />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}
