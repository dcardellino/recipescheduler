"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookMarked, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCookbook, setRecipeCookbooks } from "@/actions/cookbooks";

type CookbookPickerProps = {
  recipeId: string;
  cookbooks: { id: string; name: string }[];
  selectedIds: string[];
};

/**
 * Assigns a recipe to cookbooks. Ticking is local state; one save writes the
 * whole membership at once, and a new cookbook can be created inline so the
 * first assignment doesn't need a detour.
 */
export function CookbookPicker({
  recipeId,
  cookbooks: initialCookbooks,
  selectedIds: initialSelectedIds,
}: CookbookPickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cookbooks, setCookbooks] = useState(initialCookbooks);
  const [selected, setSelected] = useState<string[]>(initialSelectedIds);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  function handleOpenChange(next: boolean) {
    if (next) {
      setSelected(initialSelectedIds);
      setNewName("");
    }
    setOpen(next);
  }

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setIsCreating(true);
    try {
      const { id } = await createCookbook({ name, description: null });
      setCookbooks((prev) =>
        [...prev, { id, name }].sort((a, b) =>
          a.name.localeCompare(b.name, "de-DE"),
        ),
      );
      setSelected((prev) => [...prev, id]);
      setNewName("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Anlegen fehlgeschlagen.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await setRecipeCookbooks({ recipeId, cookbookIds: selected });
      toast.success("Kochbücher aktualisiert.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <BookMarked className="size-4" />
            Kochbücher
            {initialSelectedIds.length > 0 && ` (${initialSelectedIds.length})`}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zu Kochbüchern hinzufügen</DialogTitle>
          <DialogDescription>
            Ein Rezept kann in beliebig vielen Kochbüchern liegen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {cookbooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Kochbücher. Leg unten dein erstes an.
            </p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {cookbooks.map((book) => (
                <li key={book.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/40">
                    <Checkbox
                      checked={selected.includes(book.id)}
                      onCheckedChange={() => toggle(book.id)}
                    />
                    <span className="truncate text-sm">{book.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2 border-t border-border pt-4">
            <Label htmlFor="new-cookbook-name">Neues Kochbuch</Label>
            <div className="flex gap-2">
              <Input
                id="new-cookbook-name"
                placeholder="z.B. Desserts"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleCreate();
                  }
                }}
                disabled={isCreating}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCreate}
                disabled={isCreating || newName.trim().length === 0}
              >
                {isCreating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Anlegen
              </Button>
            </div>
          </div>

          <Button
            type="button"
            className="w-full"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
