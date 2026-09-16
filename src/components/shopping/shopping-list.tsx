"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { AddCustomItem } from "@/components/shopping/add-custom-item";
import { CategoryGroup } from "@/components/shopping/category-group";
import { ItemRow } from "@/components/shopping/item-row";
import { ProgressBar } from "@/components/shopping/progress-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ShoppingListView } from "@/lib/queries/shopping";

type ShoppingListProps = {
  list: ShoppingListView;
  readOnly?: boolean;
};

const GROUPINGS = ["category", "recipe"] as const;
type Grouping = (typeof GROUPINGS)[number];

const GROUPING_LABELS: Record<Grouping, string> = {
  category: "Gang",
  recipe: "Rezept",
};

export function ShoppingList({ list, readOnly = false }: ShoppingListProps) {
  const [grouping, setGrouping] = useState<Grouping>("category");

  return (
    <div className="flex flex-col gap-3">
      <ProgressBar done={list.done} total={list.total} />

      {list.total > 0 && (
        <div className="flex items-center justify-end gap-2">
          <ArrowUpDown className="size-3.5 text-muted-foreground" />
          <label
            htmlFor="shopping-grouping"
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground"
          >
            Sortieren nach
          </label>
          <Select
            value={grouping}
            onValueChange={(value) => setGrouping(value as Grouping)}
          >
            <SelectTrigger id="shopping-grouping" size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GROUPINGS.map((value) => (
                <SelectItem key={value} value={value}>
                  {GROUPING_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {list.total === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-8 text-center text-sm text-muted-foreground">
          Noch keine Einträge.
        </p>
      ) : grouping === "category" ? (
        <div className="flex flex-col gap-3">
          {list.itemsByCategory.map((group) => (
            <CategoryGroup
              key={group.category}
              category={group.category}
              items={group.items}
              readOnly={readOnly}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.itemsByRecipe.map((group) => (
            <section
              key={group.recipeId ?? "__none__"}
              className="rounded-md border border-border bg-card"
            >
              <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                <h2 className="truncate font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                  {group.recipeId ? (
                    <Link
                      href={`/recipes/${group.recipeId}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {group.title}
                    </Link>
                  ) : (
                    group.title
                  )}
                </h2>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {group.items.filter((i) => i.checked).length}/
                  {group.items.length}
                </span>
              </header>
              <ul className="flex flex-col py-1">
                {group.items.map((item) => (
                  <ItemRow key={item.id} item={item} readOnly={readOnly} />
                ))}
              </ul>
            </section>
          ))}
          <p className="px-1 text-xs text-muted-foreground">
            Zutaten, die in mehreren Rezepten vorkommen, stehen unter jedem
            davon — abgehakt wird dabei immer derselbe Eintrag.
          </p>
        </div>
      )}

      {!readOnly && <AddCustomItem shoppingListId={list.id} />}
    </div>
  );
}
