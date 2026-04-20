import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { NewRecipeTabs } from "@/components/recipe/new-recipe-tabs";
import { listTags } from "@/lib/queries/recipes";

export const metadata = {
  title: "Neues Rezept",
};

export default async function NewRecipePage() {
  const tags = await listTags();

  return (
    <div className="space-y-4">
      <Link
        href="/recipes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Zurück zur Library
      </Link>
      <h1 className="font-heading text-2xl sm:text-3xl">Neues Rezept</h1>
      <NewRecipeTabs availableTags={tags} />
    </div>
  );
}
