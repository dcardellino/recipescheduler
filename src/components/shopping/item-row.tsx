"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { deleteItem, toggleItemChecked } from "@/actions/shopping";
import { cn } from "@/lib/utils";
import type { ShoppingItem } from "@/lib/queries/shopping";

type ItemRowProps = {
  item: ShoppingItem;
  readOnly?: boolean;
};

function formatQuantity(q: number): string {
  if (Number.isInteger(q)) return String(q);
  return q.toFixed(q < 1 ? 2 : 1).replace(/\.?0+$/, "");
}

export function ItemRow({ item, readOnly = false }: ItemRowProps) {
  const [optimisticChecked, setOptimisticChecked] = useState(item.checked);
  const [isPending, startTransition] = useTransition();

  function handleToggle(next: boolean) {
    if (readOnly) return;
    const prev = optimisticChecked;
    setOptimisticChecked(next);
    startTransition(async () => {
      try {
        await toggleItemChecked({ id: item.id, checked: next });
      } catch (err) {
        setOptimisticChecked(prev);
        toast.error(
          err instanceof Error ? err.message : "Status konnte nicht gespeichert werden.",
        );
      }
    });
  }

  function handleDelete() {
    if (readOnly) return;
    startTransition(async () => {
      try {
        await deleteItem({ id: item.id });
        toast.success("Eintrag gelöscht.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Löschen fehlgeschlagen.",
        );
      }
    });
  }

  const hasQuantity = item.quantity != null;

  return (
    <li
      className={cn(
        "group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/40",
        optimisticChecked && "opacity-60",
        isPending && "opacity-70",
      )}
    >
      <Checkbox
        checked={optimisticChecked}
        onCheckedChange={(c) => handleToggle(Boolean(c))}
        disabled={readOnly}
        aria-label={item.name}
      />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate text-sm",
            optimisticChecked && "line-through decoration-muted-foreground",
          )}
        >
          {item.name}
          {item.customAdded && (
            <span className="ml-2 rounded-full bg-secondary/40 px-1.5 py-0.5 text-[10px] text-secondary-foreground">
              manuell
            </span>
          )}
        </div>
        {(hasQuantity || item.unit) && (
          <div className="text-xs text-muted-foreground">
            {hasQuantity && item.quantity != null
              ? formatQuantity(item.quantity)
              : ""}
            {item.unit ? ` ${item.unit}` : ""}
          </div>
        )}
      </div>
      {!readOnly && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleDelete}
          aria-label="Eintrag löschen"
          className="opacity-60 md:opacity-0 md:group-hover:opacity-70 focus-visible:opacity-100 hover:opacity-100"
        >
          <Trash2 />
        </Button>
      )}
    </li>
  );
}
