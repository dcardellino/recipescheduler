"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { catForTag } from "@/lib/category-colors";
import { cn } from "@/lib/utils";

type TagFilterProps = {
  tags: { id: string; name: string }[];
  selectedIds: string[];
};

export function TagFilter({ tags, selectedIds }: TagFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = new Set(selectedIds);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const params = new URLSearchParams(searchParams);
    if (next.size === 0) params.delete("tags");
    else params.set("tags", Array.from(next).join(","));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams);
    params.delete("tags");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => {
        const isActive = selected.has(t.id);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => toggle(t.id)}
            className="outline-none"
          >
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={cn(
                "cursor-pointer gap-1 transition-opacity",
                !isActive && "hover:opacity-80",
              )}
            >
              <span className={cn("size-1.5 shrink-0 rounded-full", catForTag(t.name).dot)} />
              {t.name}
            </Badge>
          </button>
        );
      })}
      {selected.size > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="ml-1 text-xs text-muted-foreground hover:text-foreground"
        >
          zurücksetzen
        </button>
      )}
    </div>
  );
}
