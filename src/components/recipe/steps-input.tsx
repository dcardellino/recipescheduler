"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { RecipeFormValues } from "@/lib/schemas/recipe";

export function StepsInput() {
  const { control, register, formState } = useFormContext<RecipeFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "steps",
  });

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Noch keine Schritte. Füge die Zubereitung hinzu.
        </p>
      )}
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex gap-2 rounded-md border border-border bg-card p-3"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-rust/10 text-sm font-medium text-accent-rust">
              {index + 1}
            </span>
            <div className="flex-1">
              <Textarea
                rows={2}
                placeholder="Schritt beschreiben…"
                aria-label={`Schritt ${index + 1}`}
                {...register(`steps.${index}.text`)}
              />
              {formState.errors.steps?.[index]?.text && (
                <p className="mt-1 text-xs text-destructive">
                  {formState.errors.steps[index]?.text?.message as string}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
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
                aria-label="Schritt entfernen"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ text: "" })}
      >
        <Plus className="size-4" />
        Schritt hinzufügen
      </Button>
    </div>
  );
}
