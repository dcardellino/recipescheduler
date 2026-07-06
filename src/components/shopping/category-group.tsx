import { ItemRow } from "@/components/shopping/item-row";
import {
  INGREDIENT_CATEGORY_LABELS,
  type IngredientCategoryValue,
} from "@/lib/schemas/recipe";
import type { ShoppingItem } from "@/lib/queries/shopping";
import { catForCategory } from "@/lib/category-colors";
import { cn } from "@/lib/utils";

type CategoryGroupProps = {
  category: IngredientCategoryValue;
  items: ShoppingItem[];
  readOnly?: boolean;
};

export function CategoryGroup({
  category,
  items,
  readOnly,
}: CategoryGroupProps) {
  if (items.length === 0) return null;
  const label = INGREDIENT_CATEGORY_LABELS[category];
  const doneCount = items.filter((i) => i.checked).length;
  const cat = catForCategory(category);

  return (
    <section className="rounded-md border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className={cn("flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground")}>
          <span className={cn("size-2 shrink-0 rounded-full", cat.dot)} />
          {label}
        </h2>
        <span className="text-xs text-muted-foreground">
          {doneCount}/{items.length}
        </span>
      </header>
      <ul className="flex flex-col py-1">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} readOnly={readOnly} />
        ))}
      </ul>
    </section>
  );
}
