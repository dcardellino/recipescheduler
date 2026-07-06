import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "@/components/recipe/recipe-card";
import type { RecipeListItem } from "@/lib/queries/recipes";

type RecipeGridProps = {
  recipes: RecipeListItem[];
  isFiltered: boolean;
};

export function RecipeGrid({ recipes, isFiltered }: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border bg-muted/20 py-14 text-center">
        <BookOpen className="size-10 text-muted-foreground" />
        {isFiltered ? (
          <>
            <p className="text-sm text-muted-foreground">
              Keine Rezepte gefunden. Passe Suche oder Filter an.
            </p>
          </>
        ) : (
          <>
            <p className="font-heading text-lg">Noch keine Rezepte</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Leg dein erstes Rezept an — manuell mit Zutaten, Schritten und
              einem Foto.
            </p>
            <Button render={<Link href="/recipes/new" />}>
              <Plus className="size-4" />
              Erstes Rezept anlegen
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((r) => (
        <RecipeCard key={r.id} {...r} />
      ))}
    </div>
  );
}
