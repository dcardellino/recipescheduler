import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RecipeGrid } from "@/components/recipe/recipe-grid";
import { CookbookFormDialog } from "@/components/cookbook/cookbook-form-dialog";
import { DeleteCookbookDialog } from "@/components/cookbook/delete-cookbook-dialog";
import { getCookbook } from "@/lib/queries/cookbooks";

export default async function CookbookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookbook = await getCookbook(id);
  if (!cookbook) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/cookbooks"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Zurück zu den Kochbüchern
      </Link>

      <PageHeader
        eyebrow="Kochbuch"
        title={cookbook.name}
        meta={`${cookbook.recipes.length} ${cookbook.recipes.length === 1 ? "Rezept" : "Rezepte"}`}
        actions={
          <div className="flex gap-2">
            <CookbookFormDialog
              mode="edit"
              cookbook={{
                id: cookbook.id,
                name: cookbook.name,
                description: cookbook.description,
              }}
            />
            <DeleteCookbookDialog
              cookbookId={cookbook.id}
              cookbookName={cookbook.name}
            />
          </div>
        }
      />

      {cookbook.description && (
        <p className="text-sm text-muted-foreground">{cookbook.description}</p>
      )}

      {cookbook.recipes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border bg-muted/20 py-14 text-center">
          <p className="font-heading text-lg">Noch keine Rezepte</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Öffne ein Rezept in deiner Library und ordne es über „Kochbücher“
            diesem Kochbuch zu.
          </p>
          <Link
            href="/recipes"
            className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-2.5 font-mono text-xs font-medium uppercase tracking-[0.08em] text-primary-foreground transition-colors hover:bg-accent-rust hover:text-on-accent"
          >
            Zur Library
          </Link>
        </div>
      ) : (
        <RecipeGrid recipes={cookbook.recipes} isFiltered={false} />
      )}
    </div>
  );
}
