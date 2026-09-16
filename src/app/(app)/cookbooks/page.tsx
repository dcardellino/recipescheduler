import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CookbookCard } from "@/components/cookbook/cookbook-card";
import { CookbookFormDialog } from "@/components/cookbook/cookbook-form-dialog";
import { listCookbooks } from "@/lib/queries/cookbooks";

export const metadata = {
  title: "Kochbücher",
};

export default async function CookbooksPage() {
  const cookbooks = await listCookbooks();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Sammlungen"
        title="Kochbücher"
        meta={`${cookbooks.length} ${cookbooks.length === 1 ? "Kochbuch" : "Kochbücher"}`}
        actions={<CookbookFormDialog mode="create" />}
      />

      {cookbooks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border bg-muted/20 py-14 text-center">
          <BookOpen className="size-10 text-muted-foreground" />
          <p className="font-heading text-lg">Noch keine Kochbücher</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Sortiere deine Rezepte nach Mahlzeit, Gang, Küche oder
            Ernährungsform — ein Rezept darf in mehreren Kochbüchern liegen.
          </p>
          <CookbookFormDialog mode="create" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cookbooks.map((cookbook) => (
            <CookbookCard key={cookbook.id} cookbook={cookbook} />
          ))}
        </div>
      )}
    </div>
  );
}
