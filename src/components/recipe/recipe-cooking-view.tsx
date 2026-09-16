"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INGREDIENT_CATEGORY_LABELS } from "@/lib/schemas/recipe";
import {
  convertTemperaturesInText,
  formatMeasure,
  scaleAndConvert,
  servingsFactor,
  type MeasurementSystem,
} from "@/lib/measurement";
import type {
  RecipeDetail,
  RecipeIngredient,
  RecipeStep,
} from "@/lib/queries/recipes";
import { cn } from "@/lib/utils";

type RecipeCookingViewProps = {
  servings: number;
  components: RecipeDetail["components"];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
};

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 99;

/**
 * Ingredients and preparation steps with the two reader-side controls that
 * never touch the stored recipe: scaling to a different serving count and
 * switching between metric and US units.
 */
export function RecipeCookingView({
  servings: baseServings,
  components,
  ingredients,
  steps,
}: RecipeCookingViewProps) {
  const [servings, setServings] = useState(baseServings);
  const [system, setSystem] = useState<MeasurementSystem>("metric");

  const factor = servingsFactor(servings, baseServings);
  const isModified = servings !== baseServings || system !== "metric";

  const displayedSteps = useMemo(
    () =>
      steps.map((step) => ({
        ...step,
        text: convertTemperaturesInText(step.text, system),
      })),
    [steps, system],
  );

  function changeServings(delta: number) {
    setServings((current) =>
      Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, current + delta)),
    );
  }

  function reset() {
    setServings(baseServings);
    setSystem("metric");
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.3fr]">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-xl">Zutaten</h2>
          {isModified && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="size-3.5" />
              Zurücksetzen
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/20 p-1.5">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => changeServings(-1)}
              disabled={servings <= MIN_SERVINGS}
              aria-label="Eine Portion weniger"
            >
              <Minus />
            </Button>
            <span className="min-w-[6.5rem] text-center text-sm tabular-nums">
              {servings} {servings === 1 ? "Portion" : "Portionen"}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => changeServings(1)}
              disabled={servings >= MAX_SERVINGS}
              aria-label="Eine Portion mehr"
            >
              <Plus />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() =>
              setSystem((s) => (s === "metric" ? "imperial" : "metric"))
            }
            aria-pressed={system === "imperial"}
          >
            <ArrowLeftRight className="size-3.5" />
            {system === "metric" ? "In US-Maße" : "In metrische Maße"}
          </Button>
        </div>

        {components.length > 0 ? (
          <div className="space-y-4">
            {components.map((component) => (
              <div key={component.id} className="space-y-2">
                <h3 className="text-sm font-medium">{component.name}</h3>
                <div className="mb-2 border-t-2 border-dashed border-border/60" />
                {component.ingredients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Keine Zutaten für diese Komponente.
                  </p>
                ) : (
                  <IngredientList
                    ingredients={component.ingredients}
                    factor={factor}
                    system={system}
                  />
                )}
              </div>
            ))}
            {ingredients.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Weitere Zutaten</h3>
                <div className="mb-2 border-t-2 border-dashed border-border/60" />
                <IngredientList
                  ingredients={ingredients}
                  factor={factor}
                  system={system}
                />
              </div>
            )}
          </div>
        ) : ingredients.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keine Zutaten angelegt.
          </p>
        ) : (
          <IngredientList
            ingredients={ingredients}
            factor={factor}
            system={system}
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl">Zubereitung</h2>
        {displayedSteps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keine Schritte angelegt.
          </p>
        ) : (
          <ol className="space-y-4">
            {displayedSteps.map((step, i) => (
              <li key={step.id} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-rust/10 text-sm font-medium text-accent-rust">
                  {i + 1}
                </span>
                <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function IngredientList({
  ingredients,
  factor,
  system,
}: {
  ingredients: RecipeIngredient[];
  factor: number;
  system: MeasurementSystem;
}) {
  return (
    <ul className="space-y-1.5 text-sm">
      {ingredients.map((ing) => {
        const measure = scaleAndConvert(
          { quantity: ing.quantity, unit: ing.unit },
          factor,
          system,
        );
        return (
          <li
            key={ing.id}
            className="flex justify-between gap-3 border-b border-border/60 pb-1.5 last:border-0"
          >
            <div>
              <span className="font-medium">{ing.name}</span>
              {ing.note && (
                <span className="text-muted-foreground"> — {ing.note}</span>
              )}
              <div className="text-xs text-muted-foreground">
                {
                  INGREDIENT_CATEGORY_LABELS[
                    ing.category as keyof typeof INGREDIENT_CATEGORY_LABELS
                  ]
                }
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 tabular-nums text-muted-foreground",
                factor !== 1 && "text-accent-rust",
              )}
            >
              {formatMeasure(measure)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
