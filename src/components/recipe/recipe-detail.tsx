import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  ExternalLink,
  ImageOff,
  Pencil,
  Star,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DeleteRecipeDialog } from "@/components/recipe/delete-recipe-dialog";
import { CookbookPicker } from "@/components/cookbook/cookbook-picker";
import { RecipeCookingView } from "@/components/recipe/recipe-cooking-view";
import type { RecipeDetail as RecipeDetailData } from "@/lib/queries/recipes";
import { catForTag } from "@/lib/category-colors";
import { cn } from "@/lib/utils";

type RecipeDetailProps = {
  recipe: RecipeDetailData;
  cookbooks: { id: string; name: string }[];
  selectedCookbookIds: string[];
};

export function RecipeDetail({
  recipe,
  cookbooks,
  selectedCookbookIds,
}: RecipeDetailProps) {
  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);

  return (
    <article className="space-y-6">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
        {recipe.imageUrl ? (
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-cover"
            priority
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-16" />
          </div>
        )}
      </div>

      <header className="space-y-3">
        <h1 className="font-heading text-3xl sm:text-4xl">{recipe.title}</h1>
        {recipe.description && (
          <p className="text-muted-foreground">{recipe.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="size-4" />
            {recipe.servings} {recipe.servings === 1 ? "Portion" : "Portionen"}
          </span>
          {totalMinutes > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-4" />
              {totalMinutes} min
              {recipe.prepMinutes != null && recipe.cookMinutes != null && (
                <span className="text-xs">
                  ({recipe.prepMinutes} Vorb. + {recipe.cookMinutes} Kochen)
                </span>
              )}
            </span>
          )}
          {recipe.rating != null && (
            <span className="inline-flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={cn(
                    "size-4",
                    n <= (recipe.rating ?? 0)
                      ? "fill-accent-rust text-accent-rust"
                      : "text-muted-foreground",
                  )}
                />
              ))}
            </span>
          )}
          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent-rust hover:underline"
            >
              <ExternalLink className="size-3" />
              Quelle
            </a>
          )}
        </div>
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.map((t) => (
              <Badge key={t.id} variant="secondary" className="gap-1">
                <span className={cn("size-1.5 shrink-0 rounded-full", catForTag(t.name).dot)} />
                {t.name}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          render={<Link href={`/recipes/${recipe.id}/edit`} />}
        >
          <Pencil className="size-4" />
          Bearbeiten
        </Button>
        <CookbookPicker
          recipeId={recipe.id}
          cookbooks={cookbooks}
          selectedIds={selectedCookbookIds}
        />
        <DeleteRecipeDialog recipeId={recipe.id} recipeTitle={recipe.title} />
      </div>

      <Separator />

      <RecipeCookingView
        servings={recipe.servings}
        components={recipe.components}
        ingredients={recipe.ingredients}
        steps={recipe.steps}
      />

      {recipe.notes && (
        <>
          <Separator />
          <section className="space-y-2">
            <h2 className="font-heading text-xl">Notizen</h2>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {recipe.notes}
            </p>
          </section>
        </>
      )}
    </article>
  );
}
