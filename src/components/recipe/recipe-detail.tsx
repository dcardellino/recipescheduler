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
import { INGREDIENT_CATEGORY_LABELS } from "@/lib/schemas/recipe";
import type { RecipeDetail as RecipeDetailData } from "@/lib/queries/recipes";
import { cn } from "@/lib/utils";

type RecipeDetailProps = {
  recipe: RecipeDetailData;
};

function formatQuantity(quantity: number | null, unit: string | null): string {
  if (quantity == null && !unit) return "";
  const q =
    quantity != null
      ? Number.isInteger(quantity)
        ? quantity.toString()
        : quantity.toLocaleString("de-DE", { maximumFractionDigits: 2 })
      : "";
  return [q, unit ?? ""].filter(Boolean).join(" ");
}

export function RecipeDetail({ recipe }: RecipeDetailProps) {
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
                      ? "fill-primary text-primary"
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
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="size-3" />
              Quelle
            </a>
          )}
        </div>
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.map((t) => (
              <Badge key={t.id} variant="secondary">
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
        <DeleteRecipeDialog recipeId={recipe.id} recipeTitle={recipe.title} />
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.3fr]">
        <section className="space-y-3">
          <h2 className="font-heading text-xl">Zutaten</h2>
          {recipe.components.length > 0 ? (
            // Render components with grouped ingredients
            <div className="space-y-4">
              {recipe.components.map((component) => (
                <div key={component.id} className="space-y-2">
                  <h3 className="font-medium text-sm">{component.name}</h3>
                  <div className="border-t-2 border-dashed border-border/60 mb-2" />
                  {component.ingredients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Keine Zutaten für diese Komponente.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 text-sm">
                      {component.ingredients.map((ing) => (
                        <li
                          key={ing.id}
                          className="flex justify-between gap-3 border-b border-border/60 pb-1.5 last:border-0"
                        >
                          <div>
                            <span className="font-medium">{ing.name}</span>
                            {ing.note && (
                              <span className="text-muted-foreground">
                                {" "}
                                — {ing.note}
                              </span>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {
                                INGREDIENT_CATEGORY_LABELS[
                                  ing.category as keyof typeof INGREDIENT_CATEGORY_LABELS
                                ]
                              }
                            </div>
                          </div>
                          <span className="shrink-0 text-muted-foreground tabular-nums">
                            {formatQuantity(ing.quantity, ing.unit)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {/* Render ungrouped ingredients as "Weitere Zutaten" if any */}
              {recipe.ingredients.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Weitere Zutaten</h3>
                  <div className="border-t-2 border-dashed border-border/60 mb-2" />
                  <ul className="space-y-1.5 text-sm">
                    {recipe.ingredients.map((ing) => (
                      <li
                        key={ing.id}
                        className="flex justify-between gap-3 border-b border-border/60 pb-1.5 last:border-0"
                      >
                        <div>
                          <span className="font-medium">{ing.name}</span>
                          {ing.note && (
                            <span className="text-muted-foreground">
                              {" "}
                              — {ing.note}
                            </span>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {
                              INGREDIENT_CATEGORY_LABELS[
                                ing.category as keyof typeof INGREDIENT_CATEGORY_LABELS
                              ]
                            }
                          </div>
                        </div>
                        <span className="shrink-0 text-muted-foreground tabular-nums">
                          {formatQuantity(ing.quantity, ing.unit)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : // Backward compatibility: render ungrouped ingredients as before
          recipe.ingredients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine Zutaten angelegt.
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {recipe.ingredients.map((ing) => (
                <li
                  key={ing.id}
                  className="flex justify-between gap-3 border-b border-border/60 pb-1.5 last:border-0"
                >
                  <div>
                    <span className="font-medium">{ing.name}</span>
                    {ing.note && (
                      <span className="text-muted-foreground">
                        {" "}
                        — {ing.note}
                      </span>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {
                        INGREDIENT_CATEGORY_LABELS[
                          ing.category as keyof typeof INGREDIENT_CATEGORY_LABELS
                        ]
                      }
                    </div>
                  </div>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {formatQuantity(ing.quantity, ing.unit)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl">Zubereitung</h2>
          {recipe.steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine Schritte angelegt.
            </p>
          ) : (
            <ol className="space-y-4">
              {recipe.steps.map((step, i) => (
                <li key={step.id} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {i + 1}
                  </span>
                  <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

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
