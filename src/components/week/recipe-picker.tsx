"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Clock, ImageOff, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addMealPlanEntry } from "@/actions/week";
import { formatDayLabel } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { RecipeListItem } from "@/lib/queries/recipes";

type RecipePickerProps = {
  date: Date;
  isoDate: string;
  recipes: RecipeListItem[];
  availableTags: { id: string; name: string }[];
  trigger?: React.ReactElement;
};

export function RecipePicker({
  date,
  isoDate,
  recipes,
  availableTags,
  trigger,
}: RecipePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const [pendingRecipeId, setPendingRecipeId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("de-DE");
    return recipes.filter((r) => {
      if (q.length > 0 && !r.title.toLocaleLowerCase("de-DE").includes(q)) {
        return false;
      }
      if (activeTagIds.length > 0) {
        const tagIds = new Set(r.tags.map((t) => t.id));
        for (const id of activeTagIds) {
          if (!tagIds.has(id)) return false;
        }
      }
      return true;
    });
  }, [recipes, query, activeTagIds]);

  function toggleTag(id: string) {
    setActiveTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function pickRecipe(recipeId: string) {
    setPendingRecipeId(recipeId);
    startTransition(async () => {
      try {
        await addMealPlanEntry({
          recipeId,
          date: isoDate,
          mealType: "dinner",
        });
        toast.success("Zum Wochenplan hinzugefügt.");
        setOpen(false);
        setQuery("");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Hinzufügen fehlgeschlagen.",
        );
      } finally {
        setPendingRecipeId(null);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          trigger ?? (
            <Button variant="outline" size="sm" className="w-full">
              <Plus />
              Rezept
            </Button>
          )
        }
      />
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b">
          <SheetTitle>Rezept hinzufügen</SheetTitle>
          <SheetDescription>{formatDayLabel(date)}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rezepte durchsuchen…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </div>
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((t) => {
                const active = activeTagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted",
                    )}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col gap-1 px-2 pb-4">
            {filtered.length === 0 ? (
              <p className="px-2 py-10 text-center text-sm text-muted-foreground">
                Keine Rezepte gefunden.
              </p>
            ) : (
              filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => pickRecipe(r.id)}
                  disabled={isPending}
                  className="group flex items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none disabled:opacity-60"
                >
                  <div className="relative size-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                    {r.imageUrl ? (
                      <Image
                        src={r.imageUrl}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {r.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      {(r.prepMinutes ?? 0) + (r.cookMinutes ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" />
                          {(r.prepMinutes ?? 0) + (r.cookMinutes ?? 0)} min
                        </span>
                      )}
                      {r.tags.slice(0, 2).map((t) => (
                        <Badge
                          key={t.id}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {t.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {pendingRecipeId === r.id ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Plus className="size-4 text-muted-foreground group-hover:text-foreground" />
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
