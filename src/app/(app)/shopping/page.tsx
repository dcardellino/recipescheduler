import Link from "next/link";
import { parseISO } from "date-fns";
import { ShoppingBasket } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryList } from "@/components/shopping/history-list";
import { ShoppingList } from "@/components/shopping/shopping-list";
import { formatWeekTitle, getWeekStart } from "@/lib/date";
import {
  getShoppingList,
  getShoppingListForWeek,
  listShoppingListHistory,
} from "@/lib/queries/shopping";

type SearchParams = Promise<{ list?: string }>;

export default async function ShoppingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { list: listId } = await searchParams;

  if (listId) {
    const list = await getShoppingList(listId);
    if (!list) {
      return (
        <section className="flex flex-col gap-3">
          <h1 className="font-heading text-2xl sm:text-3xl">Einkaufsliste</h1>
          <p className="text-sm text-muted-foreground">
            Diese Liste existiert nicht mehr.
          </p>
          <Link href="/shopping" className="text-sm text-accent-rust underline">
            Zurück zur aktuellen Liste
          </Link>
        </section>
      );
    }
    const weekStart = parseISO(list.weekStartDate);
    return (
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <Link
            href="/shopping"
            className="text-xs text-muted-foreground hover:underline"
          >
            ← Zurück zum Verlauf
          </Link>
          <h1 className="font-heading text-2xl">
            {formatWeekTitle(weekStart)}
          </h1>
        </header>
        <ShoppingList list={list} />
      </section>
    );
  }

  const weekStart = getWeekStart();
  const [currentList, history] = await Promise.all([
    getShoppingListForWeek(weekStart),
    listShoppingListHistory(8),
  ]);

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Einkauf"
        title="Einkaufsliste"
        meta={formatWeekTitle(weekStart)}
      />

      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Aktuell</TabsTrigger>
          <TabsTrigger value="history">Verlauf</TabsTrigger>
        </TabsList>
        <TabsContent value="current" className="pt-4">
          {currentList ? (
            <ShoppingList list={currentList} />
          ) : (
            <EmptyState />
          )}
        </TabsContent>
        <TabsContent value="history" className="pt-4">
          <HistoryList lists={history} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 py-14 text-center">
      <ShoppingBasket className="size-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Plane zuerst Rezepte in deiner Woche, dann generiere eine
        Einkaufsliste.
      </p>
      <Link
        href="/week"
        className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-2.5 font-mono text-xs font-medium uppercase tracking-[0.08em] text-primary-foreground transition-colors hover:bg-accent-rust hover:text-on-accent"
      >
        Zum Wochenplan
      </Link>
    </div>
  );
}
