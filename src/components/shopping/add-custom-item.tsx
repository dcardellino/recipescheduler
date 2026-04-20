"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addCustomItem } from "@/actions/shopping";
import {
  INGREDIENT_CATEGORIES,
  INGREDIENT_CATEGORY_LABELS,
  type IngredientCategoryValue,
} from "@/lib/schemas/recipe";

type AddCustomItemProps = {
  shoppingListId: string;
};

export function AddCustomItem({ shoppingListId }: AddCustomItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] =
    useState<IngredientCategoryValue>("andere");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setQuantity("");
    setUnit("");
    setCategory("andere");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name ist erforderlich.");
      return;
    }
    startTransition(async () => {
      try {
        const parsedQuantity = quantity
          ? Number(quantity.replace(",", "."))
          : null;
        await addCustomItem({
          shoppingListId,
          name: trimmed,
          quantity:
            parsedQuantity != null && Number.isFinite(parsedQuantity)
              ? parsedQuantity
              : null,
          unit: unit.trim() || null,
          category,
        });
        toast.success("Hinzugefügt.");
        reset();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Hinzufügen fehlgeschlagen.",
        );
      }
    });
  }

  if (!expanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(true)}
        className="w-full"
      >
        <Plus />
        Eigenes Item hinzufügen
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Name (z.B. Klopapier)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="flex-1"
        />
        <Input
          placeholder="Menge"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          inputMode="decimal"
          className="sm:w-24"
        />
        <Input
          placeholder="Einheit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="sm:w-24"
        />
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as IngredientCategoryValue)}
        >
          <SelectTrigger size="sm" className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INGREDIENT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {INGREDIENT_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            reset();
            setExpanded(false);
          }}
          disabled={isPending}
        >
          Abbrechen
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          Hinzufügen
        </Button>
      </div>
    </form>
  );
}
