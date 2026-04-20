"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ImportForm } from "@/components/recipe/import-form";
import { RecipeForm } from "@/components/recipe/recipe-form";
import type { RecipeFormInput } from "@/lib/schemas/recipe";

type NewRecipeTabsProps = {
  availableTags: { id: string; name: string }[];
};

export function NewRecipeTabs({ availableTags }: NewRecipeTabsProps) {
  const [tab, setTab] = useState<string>("import");
  const [manualDefaults, setManualDefaults] = useState<
    Partial<RecipeFormInput> | undefined
  >(undefined);

  function handleFallback(title: string | null) {
    if (title) {
      setManualDefaults({ title });
    }
    setTab("manual");
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
      <TabsList>
        <TabsTrigger value="import">Importieren</TabsTrigger>
        <TabsTrigger value="manual">Manuell</TabsTrigger>
      </TabsList>
      <TabsContent value="import" className="pt-6">
        <ImportForm
          availableTags={availableTags}
          onFallback={handleFallback}
        />
      </TabsContent>
      <TabsContent value="manual" className="pt-6">
        <RecipeForm
          key={manualDefaults?.title ?? "manual"}
          mode="create"
          availableTags={availableTags}
          defaultValues={manualDefaults}
        />
      </TabsContent>
    </Tabs>
  );
}
