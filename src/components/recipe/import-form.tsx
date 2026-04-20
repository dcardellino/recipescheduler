"use client";

import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecipeForm } from "@/components/recipe/recipe-form";
import type { RecipeFormInput } from "@/lib/schemas/recipe";

type ImportFormProps = {
  availableTags: { id: string; name: string }[];
  onFallback: (title: string | null) => void;
};

type ImportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; recipe: Partial<RecipeFormInput> };

type ImportErrorBody = {
  error?: string;
  code?: string;
  fallbackTitle?: string | null;
};

export function ImportForm({ availableTags, onFallback }: ImportFormProps) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<ImportState>({ status: "idle" });

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setState({ status: "loading" });
    try {
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const body = (await res.json()) as
        | {
            recipe: Partial<RecipeFormInput>;
            imageSourceUrl?: string | null;
            imageError?: string | null;
          }
        | ImportErrorBody;

      if (!res.ok) {
        const errBody = body as ImportErrorBody;
        const message = errBody.error ?? "Import fehlgeschlagen.";
        toast.error(message);

        if (res.status === 422 && errBody.code === "no_recipe") {
          onFallback(errBody.fallbackTitle ?? null);
        }

        setState({ status: "idle" });
        return;
      }

      const successBody = body as {
        recipe: Partial<RecipeFormInput>;
        imageSourceUrl?: string | null;
        imageError?: string | null;
      };
      toast.success("Rezept geladen. Prüfe die Daten und speichere.");
      if (successBody.imageError) {
        toast.warning(
          `Foto konnte nicht geladen werden (${successBody.imageError}). Du kannst manuell ein Bild hochladen.`,
        );
      }
      setState({ status: "success", recipe: successBody.recipe });
    } catch (err) {
      console.error(err);
      toast.error("Import fehlgeschlagen.");
      setState({ status: "idle" });
    }
  }

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          Rezept aus <span className="font-medium break-all">{url}</span>{" "}
          geladen. Du kannst alles bearbeiten, bevor du speicherst.
        </div>
        <RecipeForm
          mode="create"
          availableTags={availableTags}
          defaultValues={state.recipe}
        />
      </div>
    );
  }

  const loading = state.status === "loading";

  return (
    <form onSubmit={handleImport} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipe-url">Rezept-URL</Label>
        <div className="flex gap-2">
          <Input
            id="recipe-url"
            type="url"
            required
            placeholder="https://www.chefkoch.de/rezepte/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !url.trim()}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Laden
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Paste eine URL von Chefkoch, NYT Cooking, Kitchen Stories, BBC Good
          Food oder einfachbacken.de. Wir laden Titel, Zutaten, Schritte und
          Foto. Du kannst danach alles bearbeiten.
        </p>
      </div>
    </form>
  );
}
