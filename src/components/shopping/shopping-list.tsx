import { AddCustomItem } from "@/components/shopping/add-custom-item";
import { CategoryGroup } from "@/components/shopping/category-group";
import { OptimizeShoppingListButton } from "@/components/shopping/optimize-shopping-list-button";
import { ProgressBar } from "@/components/shopping/progress-bar";
import type { ShoppingListView } from "@/lib/queries/shopping";

type ShoppingListProps = {
  list: ShoppingListView;
  readOnly?: boolean;
};

export function ShoppingList({ list, readOnly = false }: ShoppingListProps) {
  return (
    <div className="flex flex-col gap-3">
      <ProgressBar done={list.done} total={list.total} />
      {list.total === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-8 text-center text-sm text-muted-foreground">
          Noch keine Einträge.
        </p>
      ) : (
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
      )}
      {!readOnly && list.total > 0 && (
        <OptimizeShoppingListButton listId={list.id} />
      )}
      {!readOnly && <AddCustomItem shoppingListId={list.id} />}
    </div>
  );
}
