import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeGrid } from "@/components/recipe/recipe-grid";
import { RecipeSearch } from "@/components/recipe/recipe-search";
import { TagFilter } from "@/components/recipe/tag-filter";
import { SortDropdown } from "@/components/recipe/sort-dropdown";
import { listRecipes, listTags } from "@/lib/queries/recipes";
import { sortOptionEnum } from "@/lib/schemas/recipe";

export const metadata = {
  title: "Rezept-Library",
};

type SearchParams = Promise<{
  q?: string;
  tags?: string;
  sort?: string;
}>;

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const tagIds = params.tags
    ? params.tags.split(",").filter(Boolean)
    : undefined;
  const sortParsed = sortOptionEnum.safeParse(params.sort);
  const sort = sortParsed.success ? sortParsed.data : "recent";

  const [recipes, tags] = await Promise.all([
    listRecipes({ q, tagIds, sort }),
    listTags(),
  ]);

  const isFiltered = Boolean(q || (tagIds && tagIds.length > 0));

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl">Library</h1>
        <Button render={<Link href="/recipes/new" />}>
          <Plus className="size-4" />
          Neues Rezept
        </Button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <RecipeSearch initialValue={q ?? ""} />
        <SortDropdown value={sort} />
      </div>

      {tags.length > 0 && (
        <TagFilter tags={tags} selectedIds={tagIds ?? []} />
      )}

      <RecipeGrid recipes={recipes} isFiltered={isFiltered} />
    </div>
  );
}
