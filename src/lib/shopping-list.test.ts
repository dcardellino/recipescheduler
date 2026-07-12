import { describe, it, expect } from "vitest";
import {
  aggregateIngredients,
  applyOptimization,
  type AggregatedItem,
  type RawIngredient,
} from "./shopping-list";
import type { AiShoppingOptimizeData } from "./ai-providers/shopping-optimize-types";

function ing(
  partial: Partial<RawIngredient> & Pick<RawIngredient, "name">,
): RawIngredient {
  return {
    quantity: 1,
    unit: null,
    category: "andere",
    sourceRecipeId: "r1",
    servingsFactor: 1,
    ...partial,
  };
}

describe("aggregateIngredients", () => {
  it("returns empty list for no input", () => {
    expect(aggregateIngredients([])).toEqual([]);
  });

  it("keeps a single ingredient as-is", () => {
    const result = aggregateIngredients([
      ing({ name: "Mehl", quantity: 200, unit: "g", category: "trocken_backen" }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "Mehl",
      quantity: 200,
      unit: "g",
      category: "trocken_backen",
      sourceRecipeIds: ["r1"],
    });
  });

  it("sums the same ingredient with the same unit", () => {
    const result = aggregateIngredients([
      ing({ name: "Zwiebel", quantity: 2, unit: "Stück", category: "gemuese" }),
      ing({
        name: "Zwiebel",
        quantity: 3,
        unit: "Stück",
        category: "gemuese",
        sourceRecipeId: "r2",
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "Zwiebel",
      quantity: 5,
      unit: "Stück",
    });
    expect(result[0].sourceRecipeIds.sort()).toEqual(["r1", "r2"]);
  });

  it("converts compatible weight units (100g + 0.2kg = 300g)", () => {
    const result = aggregateIngredients([
      ing({ name: "Mehl", quantity: 100, unit: "g", category: "trocken_backen" }),
      ing({
        name: "Mehl",
        quantity: 0.2,
        unit: "kg",
        category: "trocken_backen",
        sourceRecipeId: "r2",
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(300);
    expect(result[0].unit).toBe("g");
  });

  it("promotes to kg when total ≥ 1000 g", () => {
    const result = aggregateIngredients([
      ing({ name: "Kartoffeln", quantity: 800, unit: "g", category: "gemuese" }),
      ing({
        name: "Kartoffeln",
        quantity: 700,
        unit: "g",
        category: "gemuese",
        sourceRecipeId: "r2",
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(1.5);
    expect(result[0].unit).toBe("kg");
  });

  it("promotes to liter when total ≥ 1000 ml", () => {
    const result = aggregateIngredients([
      ing({ name: "Milch", quantity: 500, unit: "ml", category: "milchprodukte" }),
      ing({
        name: "Milch",
        quantity: 0.75,
        unit: "l",
        category: "milchprodukte",
        sourceRecipeId: "r2",
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(1.25);
    expect(result[0].unit).toBe("l");
  });

  it("normalizes spellings like 'Esslöffel' and sums with EL", () => {
    const result = aggregateIngredients([
      ing({ name: "Olivenöl", quantity: 1, unit: "EL", category: "trocken_backen" }),
      ing({
        name: "Olivenöl",
        quantity: 2,
        unit: "Esslöffel",
        category: "trocken_backen",
        sourceRecipeId: "r2",
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(3);
    expect(result[0].unit).toBe("EL");
  });

  it("converts TL to EL when the sum is a whole number of EL", () => {
    const result = aggregateIngredients([
      ing({ name: "Zucker", quantity: 3, unit: "TL", category: "trocken_backen" }),
      ing({
        name: "Zucker",
        quantity: 3,
        unit: "TL",
        category: "trocken_backen",
        sourceRecipeId: "r2",
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(2);
    expect(result[0].unit).toBe("EL");
  });

  it("keeps incompatible units separate", () => {
    const result = aggregateIngredients([
      ing({ name: "Olivenöl", quantity: 1, unit: "EL", category: "trocken_backen" }),
      ing({
        name: "Olivenöl",
        quantity: 50,
        unit: "ml",
        category: "trocken_backen",
        sourceRecipeId: "r2",
      }),
    ]);
    expect(result).toHaveLength(2);
  });

  it("scales quantities by the servings factor", () => {
    const result = aggregateIngredients([
      ing({
        name: "Mehl",
        quantity: 200,
        unit: "g",
        category: "trocken_backen",
        servingsFactor: 2,
      }),
    ]);
    expect(result[0].quantity).toBe(400);
  });

  it("keeps the item without quantity when quantity is missing", () => {
    const result = aggregateIngredients([
      ing({
        name: "Salz",
        quantity: null,
        unit: "Prise",
        category: "gewuerze",
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBeNull();
    expect(result[0].unit).toBe("Prise");
  });

  it("picks the most common category on conflict", () => {
    const result = aggregateIngredients([
      ing({ name: "Tomate", quantity: 2, unit: "Stück", category: "gemuese" }),
      ing({
        name: "Tomate",
        quantity: 1,
        unit: "Stück",
        category: "konserven",
        sourceRecipeId: "r2",
      }),
      ing({
        name: "Tomate",
        quantity: 1,
        unit: "Stück",
        category: "gemuese",
        sourceRecipeId: "r3",
      }),
    ]);
    expect(result[0].category).toBe("gemuese");
  });

  it("sorts by PRD category order then by name", () => {
    const result = aggregateIngredients([
      ing({ name: "Zucker", quantity: 100, unit: "g", category: "trocken_backen" }),
      ing({ name: "Apfel", quantity: 2, unit: "Stück", category: "obst" }),
      ing({ name: "Zwiebel", quantity: 1, unit: "Stück", category: "gemuese" }),
      ing({ name: "Karotte", quantity: 2, unit: "Stück", category: "gemuese" }),
    ]);
    expect(result.map((r) => r.name)).toEqual([
      "Karotte",
      "Zwiebel",
      "Apfel",
      "Zucker",
    ]);
  });

  it("deduplicates source recipe IDs", () => {
    const result = aggregateIngredients([
      ing({ name: "Mehl", quantity: 100, unit: "g", sourceRecipeId: "r1" }),
      ing({ name: "Mehl", quantity: 50, unit: "g", sourceRecipeId: "r1" }),
    ]);
    expect(result[0].sourceRecipeIds).toEqual(["r1"]);
  });

  it("collapses items with no unit and quantity", () => {
    const result = aggregateIngredients([
      ing({ name: "Knoblauch", quantity: null, unit: null, category: "gemuese" }),
      ing({
        name: "Knoblauch",
        quantity: null,
        unit: null,
        category: "gemuese",
        sourceRecipeId: "r2",
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBeNull();
    expect(result[0].sourceRecipeIds).toHaveLength(2);
  });
});

function item(partial: Partial<AggregatedItem> & Pick<AggregatedItem, "name">): AggregatedItem {
  return {
    quantity: null,
    unit: null,
    category: "andere",
    sourceRecipeIds: ["r1"],
    ...partial,
  };
}

function optimization(
  partial: Partial<AiShoppingOptimizeData> = {},
): AiShoppingOptimizeData {
  return { renames: [], merges: [], categoryFixes: [], ...partial };
}

describe("applyOptimization", () => {
  it("renames an item without touching quantity or unit", () => {
    const result = applyOptimization(
      [item({ name: "Zwiebel, fein gehackt", quantity: 2, unit: "Stück" })],
      optimization({ renames: [{ index: 0, cleanName: "Zwiebel" }] }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "Zwiebel",
      quantity: 2,
      unit: "Stück",
    });
  });

  it("merges items with compatible units and sums quantities", () => {
    const result = applyOptimization(
      [
        item({ name: "Knoblauch", quantity: 100, unit: "g", sourceRecipeIds: ["r1"] }),
        item({
          name: "Knoblauchzehen",
          quantity: 50,
          unit: "g",
          sourceRecipeIds: ["r2"],
        }),
      ],
      optimization({ merges: [{ keepIndex: 0, mergeIndices: [1] }] }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: "Knoblauch", quantity: 150, unit: "g" });
    expect(result[0].sourceRecipeIds.sort()).toEqual(["r1", "r2"]);
  });

  it("skips a merge suggestion with incompatible units", () => {
    const result = applyOptimization(
      [
        item({ name: "Zwiebel", quantity: 2, unit: "Stück" }),
        item({ name: "Zwiebel", quantity: 300, unit: "g" }),
      ],
      optimization({ merges: [{ keepIndex: 0, mergeIndices: [1] }] }),
    );
    expect(result).toHaveLength(2);
  });

  it("applies a category fix only when the item is currently 'andere'", () => {
    const result = applyOptimization(
      [
        item({ name: "Zitronengras", category: "andere" }),
        item({ name: "Karotte", category: "gemuese" }),
      ],
      optimization({
        categoryFixes: [
          { index: 0, category: "gewuerze" },
          { index: 1, category: "obst" },
        ],
      }),
    );
    expect(result.find((r) => r.name === "Zitronengras")?.category).toBe("gewuerze");
    expect(result.find((r) => r.name === "Karotte")?.category).toBe("gemuese");
  });

  it("ignores merge indices that are out of range or self-referencing", () => {
    const result = applyOptimization(
      [item({ name: "Mehl", quantity: 200, unit: "g" })],
      optimization({ merges: [{ keepIndex: 0, mergeIndices: [0, 99] }] }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(200);
  });
});
