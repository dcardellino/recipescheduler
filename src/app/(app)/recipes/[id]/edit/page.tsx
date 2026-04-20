import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { RecipeForm } from "@/components/recipe/recipe-form";
import { getRecipe, listTags } from "@/lib/queries/recipes";
import type { RecipeFormInput } from "@/lib/schemas/recipe";
import type { IngredientCategory } from "@/db/schema";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [recipe, tags] = await Promise.all([getRecipe(id), listTags()]);
  if (!recipe) notFound();

  const defaultValues: RecipeFormInput = {
    title: recipe.title,
    description: recipe.description,
    sourceUrl: recipe.sourceUrl,
    imageUrl: recipe.imageUrl,
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    rating: recipe.rating,
    notes: recipe.notes,
    ingredients:
      recipe.ingredients.length > 0
        ? recipe.ingredients.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            note: i.note,
            category: i.category as IngredientCategory,
          }))
        : [
            {
              name: "",
              quantity: null,
              unit: null,
              note: null,
              category: "andere",
            },
          ],
    steps: recipe.steps.map((s) => ({ text: s.text })),
    tagNames: recipe.tags.map((t) => t.name),
  };

  return (
    <div className="space-y-4">
      <Link
        href={`/recipes/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Zurück zum Rezept
      </Link>
      <h1 className="font-heading text-2xl sm:text-3xl">Rezept bearbeiten</h1>
      <RecipeForm
        mode="edit"
        recipeId={id}
        defaultValues={defaultValues}
        availableTags={tags}
      />
    </div>
  );
}
