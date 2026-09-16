"use client";

import { useState } from "react";
import { ClipboardPaste, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RecipeForm } from "@/components/recipe/recipe-form";
import type { RecipeFormInput } from "@/lib/schemas/recipe";

type TextImportFormProps = {
  availableTags: { id: string; name: string }[];
};

type ImportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; recipe: Partial<RecipeFormInput> };

const MIN_LENGTH = 30;
const MAX_LENGTH = 20_000;

/**
 * Paste a recipe from wherever it lives today — Paprika, Notizen, Google
 * Docs, Notion, Evernote, a chat message — and let the AI structure it.
 */
export function TextImportForm({ availableTags }: TextImportFormProps) {
  const [text, setText] = useState("");
  const [state, setState] = useState<ImportState>({ status: "idle" });

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < MIN_LENGTH) return;

    setState({ status: "loading" });
    try {
      const res = await fetch("/api/recipes/import-text", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const body = (await res.json()) as {
        recipe?: Partial<RecipeFormInput>;
        error?: string;
      };

      if (!res.ok || !body.recipe) {
        toast.error(body.error ?? "Import fehlgeschlagen.");
        setState({ status: "idle" });
        return;
      }

      toast.success("Rezept erkannt. Prüfe die Daten und speichere.");
      setState({ status: "success", recipe: body.recipe });
    } catch (err) {
      console.error(err);
      toast.error("Import fehlgeschlagen.");
      setState({ status: "idle" });
    }
  }

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-accent-rust/30 bg-accent-rust/5 px-4 py-3 text-sm">
          Rezept aus deinem Text erkannt. Prüfe Mengen und Schritte, bevor du
          speicherst.
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
  const tooShort = text.trim().length < MIN_LENGTH;

  return (
    <form onSubmit={handleImport} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipe-text">Rezepttext</Label>
        <Textarea
          id="recipe-text"
          rows={12}
          maxLength={MAX_LENGTH}
          placeholder={
            "Zutaten\n200 g Mehl\n2 Eier\n300 ml Milch\n\nZubereitung\n1. Alles verrühren …"
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Kopier dein Rezept aus Paprika, Notizen, Google Docs, Notion,
            Evernote oder einer Nachricht hier hinein — wir erkennen Titel,
            Zutaten, Mengen und Schritte automatisch.
          </p>
          <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
            {text.trim().length}/{MAX_LENGTH}
          </span>
        </div>
      </div>
      <Button type="submit" disabled={loading || tooShort}>
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ClipboardPaste className="size-4" />
        )}
        Rezept erkennen
      </Button>
    </form>
  );
}
