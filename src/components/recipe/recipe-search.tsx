"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type RecipeSearchProps = {
  initialValue: string;
};

export function RecipeSearch({ initialValue }: RecipeSearchProps) {
  const [value, setValue] = useState(initialValue);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value.trim().length > 0) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // We intentionally omit searchParams from deps — including it resets on every URL change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, pathname, router]);

  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Rezepte durchsuchen…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-8 pr-8"
        aria-label="Suche"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Suche löschen"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
