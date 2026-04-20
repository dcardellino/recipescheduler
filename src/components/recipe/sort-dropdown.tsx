"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SortOption } from "@/lib/schemas/recipe";

type SortDropdownProps = {
  value: SortOption;
};

const LABELS: Record<SortOption, string> = {
  recent: "Zuletzt hinzugefügt",
  title: "Titel A–Z",
  rating: "Bewertung",
};

export function SortDropdown({ value }: SortDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(next: SortOption) {
    const params = new URLSearchParams(searchParams);
    if (next === "recent") params.delete("sort");
    else params.set("sort", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
      <SelectTrigger className="w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="recent">{LABELS.recent}</SelectItem>
        <SelectItem value="title">{LABELS.title}</SelectItem>
        <SelectItem value="rating">{LABELS.rating}</SelectItem>
      </SelectContent>
    </Select>
  );
}
