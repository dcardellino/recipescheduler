import { normalizeUnit } from "@/lib/ingredient-normalizer";
import {
  INGREDIENT_CATEGORIES,
  type IngredientCategoryValue,
} from "@/lib/schemas/recipe";

export type RawIngredient = {
  name: string;
  quantity: number | null;
  unit: string | null;
  category: IngredientCategoryValue;
  sourceRecipeId: string;
  servingsFactor: number;
};

export type AggregatedItem = {
  name: string;
  quantity: number | null;
  unit: string | null;
  category: IngredientCategoryValue;
  sourceRecipeIds: string[];
};

// Base units for conversion
const GRAM_UNITS: Record<string, number> = {
  g: 1,
  kg: 1000,
  mg: 0.001,
};

const MILLILITER_UNITS: Record<string, number> = {
  ml: 1,
  cl: 10,
  dl: 100,
  l: 1000,
};

// Spoon equivalents in teaspoons (TL)
const SPOON_UNITS: Record<string, number> = {
  TL: 1,
  EL: 3,
};

function unitFamily(
  unit: string | null | undefined,
): { base: "g" | "ml" | "TL" | null; factor: number } {
  if (!unit) return { base: null, factor: 1 };
  if (GRAM_UNITS[unit] !== undefined) {
    return { base: "g", factor: GRAM_UNITS[unit] };
  }
  if (MILLILITER_UNITS[unit] !== undefined) {
    return { base: "ml", factor: MILLILITER_UNITS[unit] };
  }
  if (SPOON_UNITS[unit] !== undefined) {
    return { base: "TL", factor: SPOON_UNITS[unit] };
  }
  return { base: null, factor: 1 };
}

function normalizeNameKey(name: string): string {
  return name.trim().toLocaleLowerCase("de-DE");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function promoteUnit(
  base: "g" | "ml" | "TL",
  totalInBase: number,
): { quantity: number; unit: string } {
  if (base === "g") {
    if (totalInBase >= 1000) {
      return { quantity: round2(totalInBase / 1000), unit: "kg" };
    }
    return { quantity: round2(totalInBase), unit: "g" };
  }
  if (base === "ml") {
    if (totalInBase >= 1000) {
      return { quantity: round2(totalInBase / 1000), unit: "l" };
    }
    return { quantity: round2(totalInBase), unit: "ml" };
  }
  // TL base
  if (totalInBase >= 3) {
    const el = totalInBase / 3;
    if (Number.isInteger(el) || Math.abs(el - Math.round(el)) < 0.01) {
      return { quantity: round2(el), unit: "EL" };
    }
  }
  return { quantity: round2(totalInBase), unit: "TL" };
}

type Group = {
  nameKey: string;
  displayName: string;
  base: "g" | "ml" | "TL" | null;
  unitWhenNoBase: string | null;
  totalInBase: number;
  hasQuantity: boolean;
  noQuantityCount: number;
  categoryCounts: Map<IngredientCategoryValue, number>;
  sourceRecipeIds: Set<string>;
  firstCategory: IngredientCategoryValue;
};

function mostCommonCategory(group: Group): IngredientCategoryValue {
  let best: IngredientCategoryValue = group.firstCategory;
  let bestCount = -1;
  for (const [cat, count] of group.categoryCounts) {
    if (count > bestCount) {
      best = cat;
      bestCount = count;
    }
  }
  return best;
}

const CATEGORY_ORDER: Record<IngredientCategoryValue, number> =
  INGREDIENT_CATEGORIES.reduce(
    (acc, cat, idx) => {
      acc[cat] = idx;
      return acc;
    },
    {} as Record<IngredientCategoryValue, number>,
  );

export function aggregateIngredients(
  ingredients: RawIngredient[],
): AggregatedItem[] {
  const groups = new Map<string, Group>();

  for (const ing of ingredients) {
    const nameKey = normalizeNameKey(ing.name);
    if (!nameKey) continue;

    const normalizedUnit = normalizeUnit(ing.unit);
    const family = unitFamily(normalizedUnit);

    const groupKey =
      family.base !== null
        ? `${nameKey}|__${family.base}`
        : `${nameKey}|${normalizedUnit ?? ""}`;

    let group = groups.get(groupKey);
    if (!group) {
      group = {
        nameKey,
        displayName: ing.name.trim(),
        base: family.base,
        unitWhenNoBase: family.base === null ? normalizedUnit : null,
        totalInBase: 0,
        hasQuantity: false,
        noQuantityCount: 0,
        categoryCounts: new Map(),
        sourceRecipeIds: new Set(),
        firstCategory: ing.category,
      };
      groups.set(groupKey, group);
    }

    if (ing.quantity !== null && Number.isFinite(ing.quantity)) {
      const scaled = ing.quantity * ing.servingsFactor * family.factor;
      group.totalInBase += scaled;
      group.hasQuantity = true;
    } else {
      group.noQuantityCount += 1;
    }

    group.categoryCounts.set(
      ing.category,
      (group.categoryCounts.get(ing.category) ?? 0) + 1,
    );
    group.sourceRecipeIds.add(ing.sourceRecipeId);
  }

  const results: AggregatedItem[] = [];
  for (const group of groups.values()) {
    let quantity: number | null = null;
    let unit: string | null = null;

    if (group.hasQuantity) {
      if (group.base !== null) {
        const promoted = promoteUnit(group.base, group.totalInBase);
        quantity = promoted.quantity;
        unit = promoted.unit;
      } else {
        quantity = round2(group.totalInBase);
        unit = group.unitWhenNoBase;
      }
    } else {
      unit = group.base
        ? promoteUnit(group.base, 0).unit
        : group.unitWhenNoBase;
    }

    results.push({
      name: group.displayName,
      quantity,
      unit,
      category: mostCommonCategory(group),
      sourceRecipeIds: Array.from(group.sourceRecipeIds),
    });
  }

  results.sort((a, b) => {
    const catDiff = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
    if (catDiff !== 0) return catDiff;
    return a.name.localeCompare(b.name, "de-DE");
  });

  return results;
}
