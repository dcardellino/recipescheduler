import { describe, expect, it } from "vitest";
import {
  ingredientSchema,
  recipeFormSchema,
  stepSchema,
  updateRecipeSchema,
} from "./recipe";

describe("ingredientSchema", () => {
  it("accepts a minimal ingredient", () => {
    const result = ingredientSchema.parse({
      name: "Mehl",
      category: "andere",
    });
    expect(result.name).toBe("Mehl");
    expect(result.category).toBe("andere");
  });

  it("rejects empty name", () => {
    expect(() =>
      ingredientSchema.parse({ name: "", category: "andere" }),
    ).toThrow();
  });

  it("rejects negative quantity", () => {
    expect(() =>
      ingredientSchema.parse({
        name: "Mehl",
        quantity: -1,
        category: "andere",
      }),
    ).toThrow();
  });

  it("trims whitespace from name", () => {
    const result = ingredientSchema.parse({
      name: "  Mehl  ",
      category: "andere",
    });
    expect(result.name).toBe("Mehl");
  });

  it("rejects invalid category", () => {
    expect(() =>
      ingredientSchema.parse({ name: "Mehl", category: "nonsense" }),
    ).toThrow();
  });

  it("requires category", () => {
    expect(() => ingredientSchema.parse({ name: "Mehl" })).toThrow();
  });
});

describe("stepSchema", () => {
  it("accepts non-empty text", () => {
    expect(stepSchema.parse({ text: "Zwiebeln schneiden" }).text).toBe(
      "Zwiebeln schneiden",
    );
  });

  it("rejects empty step", () => {
    expect(() => stepSchema.parse({ text: "   " })).toThrow();
  });
});

describe("recipeFormSchema", () => {
  const validMinimal = {
    title: "Pasta Pomodoro",
    servings: 2,
    ingredients: [{ name: "Tomaten", category: "andere" as const }],
    steps: [],
    tagNames: [],
  };

  it("accepts a valid minimal recipe", () => {
    const parsed = recipeFormSchema.parse(validMinimal);
    expect(parsed.title).toBe("Pasta Pomodoro");
    expect(parsed.servings).toBe(2);
    expect(parsed.ingredients[0].category).toBe("andere");
  });

  it("rejects missing title", () => {
    expect(() =>
      recipeFormSchema.parse({ ...validMinimal, title: "" }),
    ).toThrow();
  });

  it("rejects empty ingredients array", () => {
    expect(() =>
      recipeFormSchema.parse({ ...validMinimal, ingredients: [] }),
    ).toThrow();
  });

  it("rejects rating out of range", () => {
    expect(() =>
      recipeFormSchema.parse({ ...validMinimal, rating: 6 }),
    ).toThrow();
    expect(() =>
      recipeFormSchema.parse({ ...validMinimal, rating: 0 }),
    ).toThrow();
  });

  it("accepts rating in range", () => {
    const parsed = recipeFormSchema.parse({ ...validMinimal, rating: 4 });
    expect(parsed.rating).toBe(4);
  });

  it("rejects oversized title", () => {
    expect(() =>
      recipeFormSchema.parse({
        ...validMinimal,
        title: "x".repeat(201),
      }),
    ).toThrow();
  });

  it("deduplicates tagNames case-insensitively", () => {
    const parsed = recipeFormSchema.parse({
      ...validMinimal,
      tagNames: ["Schnell", "schnell", "Vegetarisch"],
    });
    expect(parsed.tagNames).toHaveLength(2);
    expect(parsed.tagNames[0]).toBe("Schnell");
    expect(parsed.tagNames[1]).toBe("Vegetarisch");
  });

  it("converts empty sourceUrl to null", () => {
    const parsed = recipeFormSchema.parse({ ...validMinimal, sourceUrl: "" });
    expect(parsed.sourceUrl).toBeNull();
  });

  it("rejects invalid sourceUrl", () => {
    expect(() =>
      recipeFormSchema.parse({ ...validMinimal, sourceUrl: "not a url" }),
    ).toThrow();
  });

  it("rejects servings < 1", () => {
    expect(() =>
      recipeFormSchema.parse({ ...validMinimal, servings: 0 }),
    ).toThrow();
  });
});

describe("updateRecipeSchema", () => {
  it("requires an id", () => {
    expect(() =>
      updateRecipeSchema.parse({
        title: "Pasta",
        servings: 2,
        ingredients: [{ name: "Tomaten", category: "andere" as const }],
        steps: [],
        tagNames: [],
      }),
    ).toThrow();
  });

  it("accepts a valid id + payload", () => {
    const parsed = updateRecipeSchema.parse({
      id: "00000000-0000-0000-0000-000000000000",
      title: "Pasta",
      servings: 2,
      ingredients: [{ name: "Tomaten", category: "andere" as const }],
      steps: [],
      tagNames: [],
    });
    expect(parsed.id).toBe("00000000-0000-0000-0000-000000000000");
  });

  it("rejects invalid uuid", () => {
    expect(() =>
      updateRecipeSchema.parse({
        id: "not-a-uuid",
        title: "Pasta",
        servings: 2,
        ingredients: [{ name: "Tomaten", category: "andere" as const }],
        steps: [],
        tagNames: [],
      }),
    ).toThrow();
  });
});
