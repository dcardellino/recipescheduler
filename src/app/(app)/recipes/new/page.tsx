import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
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
      <PageHeader eyebrow="Neu" title="Neues Rezept" />
      <NewRecipeTabs availableTags={tags} />
    </div>
  );
}
