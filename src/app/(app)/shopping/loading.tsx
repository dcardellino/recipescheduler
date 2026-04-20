import { Skeleton } from "@/components/ui/skeleton";

function ItemRowSkeleton() {
  return (
    <li className="flex items-center gap-3 px-2 py-2">
      <Skeleton className="size-5 rounded" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="size-6 rounded" />
    </li>
  );
}

function CategoryGroupSkeleton() {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card px-3 py-2">
      <Skeleton className="h-5 w-28 mb-2" />
      <ul>
        <ItemRowSkeleton />
        <ItemRowSkeleton />
        <ItemRowSkeleton />
      </ul>
    </div>
  );
}

export default function ShoppingLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-6 w-32 rounded-full" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex gap-4 border-b pb-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="flex flex-col gap-3">
        <CategoryGroupSkeleton />
        <CategoryGroupSkeleton />
      </div>
    </div>
  );
}
