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
  type IngredientCategoryValue,
  type RecipeFormValues,
} from "@/lib/schemas/recipe";

export function ComponentsInput() {
  const { control, formState } = useFormContext<RecipeFormValues>();
  const { fields: componentFields, append: appendComponent, remove: removeComponent } =
    useFieldArray({
      control,
      name: "components",
    });

  return (
    <div className="space-y-4">
      {componentFields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Noch keine Teig-Komponenten. Füge z.B. einen Vorteig oder ein Kochstück hinzu.
        </p>
      )}

      {componentFields.map((componentField, componentIndex) => (
        <ComponentSection
          key={componentField.id}
          componentIndex={componentIndex}
          onRemove={() => removeComponent(componentIndex)}
        />
      ))}

      {formState.errors.components?.root?.message && (
        <p className="text-xs text-destructive">
          {formState.errors.components.root.message}
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          appendComponent({
            id: undefined,
            name: "",
            position: componentFields.length,
            ingredients: [],
          })
        }
      >
        <Plus className="size-4" />
        Teig-Komponente hinzufügen
      </Button>
    </div>
  );
}

function ComponentSection({
  componentIndex,
  onRemove,
}: {
  componentIndex: number;
  onRemove: () => void;
}) {
  const { control, register, formState } = useFormContext<RecipeFormValues>();
  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient, move: moveIngredient } =
    useFieldArray({
      control,
      name: `components.${componentIndex}.ingredients`,
    });

  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Name der Komponente (z.B. Vorteig)"
          aria-label="Komponentenname"
          className="font-medium"
          {...register(`components.${componentIndex}.name`)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label="Komponente entfernen"
          className="shrink-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
          Entfernen
        </Button>
      </div>

      {formState.errors.components?.[componentIndex]?.name && (
        <p className="text-xs text-destructive">
          {formState.errors.components[componentIndex]?.name?.message}
        </p>
      )}

      <div className="space-y-2 pl-2 border-l-2 border-border">
        {ingredientFields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Noch keine Zutaten in dieser Komponente.
          </p>
        )}

        {ingredientFields.map((ingredientField, ingredientIndex) => (
          <ComponentIngredientRow
            key={ingredientField.id}
            componentIndex={componentIndex}
            ingredientIndex={ingredientIndex}
            onRemove={() => removeIngredient(ingredientIndex)}
            move={moveIngredient}
            index={ingredientIndex}
            total={ingredientFields.length}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          appendIngredient({
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
    </div>
  );
}

function ComponentIngredientRow({
  componentIndex,
  ingredientIndex,
  onRemove,
  move,
  index,
  total,
}: {
  componentIndex: number;
  ingredientIndex: number;
  onRemove: () => void;
  move: (from: number, to: number) => void;
  index: number;
  total: number;
}) {
  const { register, formState } = useFormContext<RecipeFormValues>();
  const namePrefix = `components.${componentIndex}.ingredients.${ingredientIndex}` as const;

  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="grid grid-cols-[60px_60px_1fr_auto] gap-2 sm:grid-cols-[80px_80px_1fr_160px_auto]">
        <Input
          type="number"
          step="0.1"
          min="0"
          placeholder="Menge"
          aria-label="Menge"
          {...register(`${namePrefix}.quantity`, {
            setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
          })}
        />
        <Input
          placeholder="Einheit"
          aria-label="Einheit"
          {...register(`${namePrefix}.unit`)}
        />
        <Input
          placeholder="Zutat"
          aria-label="Zutat"
          {...register(`${namePrefix}.name`)}
        />
        <div className="col-span-1 hidden sm:block">
          <ComponentCategorySelect
            componentIndex={componentIndex}
            ingredientIndex={ingredientIndex}
          />
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
            disabled={index === total - 1}
            onClick={() => move(index, index + 1)}
            aria-label="Nach unten"
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={onRemove}
            aria-label="Zutat entfernen"
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:hidden">
        <ComponentCategorySelect
          componentIndex={componentIndex}
          ingredientIndex={ingredientIndex}
        />
      </div>
      <Input
        placeholder="Notiz (z.B. klein gewürfelt)"
        className="mt-2"
        aria-label="Notiz"
        {...register(`${namePrefix}.note`)}
      />
      {formState.errors.components?.[componentIndex]?.ingredients?.[ingredientIndex]
        ?.name && (
        <p className="mt-1 text-xs text-destructive">
          {
            formState.errors.components[componentIndex]?.ingredients?.[ingredientIndex]
              ?.name?.message as string
          }
        </p>
      )}
    </div>
  );
}

function ComponentCategorySelect({
  componentIndex,
  ingredientIndex,
}: {
  componentIndex: number;
  ingredientIndex: number;
}) {
  const { setValue, watch } = useFormContext<RecipeFormValues>();
  const value = watch(
    `components.${componentIndex}.ingredients.${ingredientIndex}.category`,
  );
  return (
    <Select
      value={value}
      onValueChange={(v) =>
        setValue(
          `components.${componentIndex}.ingredients.${ingredientIndex}.category`,
          v as IngredientCategoryValue,
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
