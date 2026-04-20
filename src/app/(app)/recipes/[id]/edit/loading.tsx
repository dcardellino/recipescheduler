import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

function FormSectionSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function EditRecipeLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-8 w-48" />
      <FormSectionSkeleton fields={4} />
      <Separator />
      <Skeleton className="h-6 w-20" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
      <Separator />
      <Skeleton className="h-6 w-28" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Separator />
      <FormSectionSkeleton fields={2} />
      <div className="flex justify-end gap-3">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}
