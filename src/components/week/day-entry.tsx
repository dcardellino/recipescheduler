"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Loader2, Users, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  removeMealPlanEntry,
  updateServings,
} from "@/actions/week";
import { cn } from "@/lib/utils";
import type { DayEntry as DayEntryData } from "@/lib/queries/week";

type DayEntryProps = {
  entry: DayEntryData;
};

export function DayEntry({ entry }: DayEntryProps) {
  const [servings, setServings] = useState(entry.servings);
  const [isPending, startTransition] = useTransition();

  function commitServings(next: number) {
    if (!Number.isFinite(next) || next < 1 || next > 99) {
      setServings(entry.servings);
      return;
    }
    if (next === entry.servings) return;
    startTransition(async () => {
      try {
        await updateServings({ id: entry.id, servings: next });
      } catch (err) {
        setServings(entry.servings);
        toast.error(
          err instanceof Error ? err.message : "Portionen konnten nicht gespeichert werden.",
        );
      }
    });
  }

  return (
    <article
      className={cn(
        "group flex items-center gap-2 rounded-md border border-border bg-card p-1.5 transition-colors",
        isPending && "opacity-70",
      )}
    >
      <Link
        href={entry.recipe ? `/recipes/${entry.recipe.id}` : "#"}
        className="relative size-10 flex-shrink-0 overflow-hidden rounded bg-muted"
        aria-label={entry.recipe?.title ?? "Rezept gelöscht"}
      >
        {entry.recipe?.imageUrl ? (
          <Image
            src={entry.recipe.imageUrl}
            alt=""
            fill
            sizes="40px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-4" />
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        {entry.recipe ? (
          <Link
            href={`/recipes/${entry.recipe.id}`}
            className="block truncate text-sm font-medium hover:underline"
          >
            {entry.recipe.title}
          </Link>
        ) : (
          <span className="block truncate text-sm italic text-muted-foreground">
            Rezept gelöscht
          </span>
        )}
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3" />
          <Input
            type="number"
            min={1}
            max={99}
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
            onBlur={(e) => commitServings(Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            aria-label="Portionen"
            className="h-6 w-12 px-1 text-xs"
          />
        </div>
      </div>
      <RemoveEntryButton entry={entry} />
    </article>
  );
}

function RemoveEntryButton({ entry }: { entry: DayEntryData }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      try {
        await removeMealPlanEntry(entry.id);
        toast.success("Eintrag entfernt.");
        setOpen(false);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Entfernen fehlgeschlagen.",
        );
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Eintrag entfernen"
            className="opacity-50 group-hover:opacity-100"
          >
            <X />
          </Button>
        }
      />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Eintrag entfernen?</AlertDialogTitle>
          <AlertDialogDescription>
            {entry.recipe?.title
              ? `"${entry.recipe.title}" wird aus dem Wochenplan entfernt.`
              : "Dieser Eintrag wird entfernt."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleRemove();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Entfernen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
