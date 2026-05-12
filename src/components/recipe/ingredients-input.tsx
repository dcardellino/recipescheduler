"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INGREDIENT_CATEGORIES,
  INGREDIENT_CATEGORY_LABELS,
  type RecipeFormValues,
} from "@/lib/schemas/recipe";

export function IngredientsInput() {
  const { control, register, formState } = useFormContext<RecipeFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "ingredients",
  });

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Füge mindestens eine Zutat hinzu.
        </p>
      )}
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-md border border-border bg-card p-3"
          >
            <div className="grid grid-cols-[60px_60px_1fr_auto] gap-2 sm:grid-cols-[80px_80px_1fr_160px_auto]">
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="Menge"
                aria-label="Menge"
                {...register(`ingredients.${index}.quantity`, {
                  setValueAs: (v) =>
                    v === "" || v === null ? null : Number(v),
                })}
              />
              <Input
                placeholder="Einheit"
                aria-label="Einheit"
                {...register(`ingredients.${index}.unit`)}
              />
              <Input
                placeholder="Zutat"
                aria-label="Zutat"
                {...register(`ingredients.${index}.name`)}
              />
              <div className="col-span-1 hidden sm:block">
                <CategorySelect index={index} />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                  aria-label="Nach oben"
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label="Nach unten"
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => remove(index)}
                  aria-label="Zutat entfernen"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:hidden">
              <CategorySelect index={index} />
            </div>
            <Input
              placeholder="Notiz (z.B. klein gewürfelt)"
              className="mt-2"
              aria-label="Notiz"
              {...register(`ingredients.${index}.note`)}
            />
            {formState.errors.ingredients?.[index]?.name && (
              <p className="mt-1 text-xs text-destructive">
                {formState.errors.ingredients[index]?.name?.message as string}
              </p>
            )}
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            name: "",
            quantity: null,
            unit: null,
            note: null,
            category: "andere",
          })
        }
      >
        <Plus className="size-4" />
        Zutat hinzufügen
      </Button>
      {formState.errors.ingredients?.root?.message && (
        <p className="text-xs text-destructive">
          {formState.errors.ingredients.root.message as string}
        </p>
      )}
    </div>
  );
}

function CategorySelect({ index }: { index: number }) {
  const { setValue, watch } = useFormContext<RecipeFormValues>();
  const value = watch(`ingredients.${index}.category`);
  return (
    <Select
      value={value}
      onValueChange={(v) =>
        setValue(
          `ingredients.${index}.category`,
          v as RecipeFormValues["ingredients"][number]["category"],
          { shouldDirty: true },
        )
      }
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Kategorie" />
      </SelectTrigger>
      <SelectContent>
        {INGREDIENT_CATEGORIES.map((cat) => (
          <SelectItem key={cat} value={cat}>
            {INGREDIENT_CATEGORY_LABELS[cat]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
