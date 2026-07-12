import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));

describe("extractRecipeAnthropic", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    mockCreate.mockReset();
    vi.resetModules();
  });

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalKey;
  });

  function toolUseResponse(input: unknown, usage = { input_tokens: 100, output_tokens: 50 }) {
    return {
      content: [{ type: "tool_use", name: "return_recipe", input }],
      usage,
    };
  }

  it("returns a validated recipe when the tool output is well-formed", async () => {
    mockCreate.mockResolvedValue(
      toolUseResponse({
        title: "Creamy Garlic Pasta",
        description: "Schnelle Pasta mit Knoblauch.",
        servings: 2,
        prepMinutes: 10,
        cookMinutes: 15,
        ingredients: [
          { name: "Spaghetti", quantity: 500, unit: "g", note: null, category: "trocken_backen" },
          { name: "Knoblauch", quantity: 2, unit: null, note: null, category: "gemuese" },
        ],
        steps: [{ text: "Pasta kochen." }, { text: "Knoblauch anbraten." }],
        tagNames: ["Pasta", "Schnell"],
      }),
    );

    const { extractRecipeAnthropic } = await import("./anthropic");
    const result = await extractRecipeAnthropic({
      captionText: "Creamy Garlic Pasta – 500g Spaghetti, 2 Knoblauchzehen...",
      sourceUrl: "https://www.instagram.com/p/abc123/",
      fallbackTitle: "foodblog on Instagram",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.title).toBe("Creamy Garlic Pasta");
    expect(result.recipe.servings).toBe(2);
    expect(result.recipe.ingredients).toHaveLength(2);
    expect(result.recipe.ingredients[0].category).toBe("trocken_backen");
    expect(result.recipe.sourceUrl).toBe("https://www.instagram.com/p/abc123/");
    expect(result.tokensUsed).toBe(150);
  });

  it("fails gracefully when the tool output has an invalid category (hallucination guard)", async () => {
    mockCreate.mockResolvedValue(
      toolUseResponse({
        title: "Mystery Dish",
        servings: 2,
        ingredients: [{ name: "Etwas", category: "nicht_existierende_kategorie" }],
        steps: [{ text: "Kochen." }],
        tagNames: [],
      }),
    );

    const { extractRecipeAnthropic } = await import("./anthropic");
    const result = await extractRecipeAnthropic({
      captionText: "Ein Rezept mit komischer Kategorie...",
      sourceUrl: "https://www.instagram.com/p/abc123/",
      fallbackTitle: null,
    });

    expect(result.ok).toBe(false);
  });

  it("fails gracefully when no ingredients could be extracted", async () => {
    mockCreate.mockResolvedValue(
      toolUseResponse({
        title: "Werbepost ohne Rezept",
        servings: 2,
        ingredients: [],
        steps: [],
        tagNames: [],
      }),
    );

    const { extractRecipeAnthropic } = await import("./anthropic");
    const result = await extractRecipeAnthropic({
      captionText: "Kauft unser neues Kochbuch!",
      sourceUrl: "https://www.instagram.com/p/abc123/",
      fallbackTitle: null,
    });

    expect(result.ok).toBe(false);
  });

  it("fails gracefully when no tool_use block is returned", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "Ich kann das nicht extrahieren." }],
      usage: { input_tokens: 20, output_tokens: 10 },
    });

    const { extractRecipeAnthropic } = await import("./anthropic");
    const result = await extractRecipeAnthropic({
      captionText: "...",
      sourceUrl: "https://www.instagram.com/p/abc123/",
      fallbackTitle: null,
    });

    expect(result.ok).toBe(false);
    expect(result.tokensUsed).toBe(30);
  });

  it("fails gracefully when the Anthropic API call throws", async () => {
    mockCreate.mockRejectedValue(new Error("rate limited"));

    const { extractRecipeAnthropic } = await import("./anthropic");
    const result = await extractRecipeAnthropic({
      captionText: "...",
      sourceUrl: "https://www.instagram.com/p/abc123/",
      fallbackTitle: null,
    });

    expect(result.ok).toBe(false);
    expect(result.tokensUsed).toBe(0);
  });
});

describe("optimizeShoppingListAnthropic", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    mockCreate.mockReset();
    vi.resetModules();
  });

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalKey;
  });

  function toolUseResponse(input: unknown, usage = { input_tokens: 80, output_tokens: 20 }) {
    return {
      content: [{ type: "tool_use", name: "return_optimization", input }],
      usage,
    };
  }

  it("returns a validated optimization when the tool output is well-formed", async () => {
    mockCreate.mockResolvedValue(
      toolUseResponse({
        renames: [{ index: 0, cleanName: "Zwiebel" }],
        merges: [{ keepIndex: 1, mergeIndices: [2] }],
        categoryFixes: [{ index: 3, category: "gewuerze" }],
      }),
    );

    const { optimizeShoppingListAnthropic } = await import("./anthropic");
    const result = await optimizeShoppingListAnthropic([
      { index: 0, name: "Zwiebel, fein gehackt", quantity: 1, unit: "Stück", category: "gemuese" },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.optimization.renames).toEqual([{ index: 0, cleanName: "Zwiebel" }]);
    expect(result.optimization.merges).toEqual([{ keepIndex: 1, mergeIndices: [2] }]);
    expect(result.tokensUsed).toBe(100);
  });

  it("fails gracefully when the tool output has an invalid category", async () => {
    mockCreate.mockResolvedValue(
      toolUseResponse({
        renames: [],
        merges: [],
        categoryFixes: [{ index: 0, category: "nicht_existierende_kategorie" }],
      }),
    );

    const { optimizeShoppingListAnthropic } = await import("./anthropic");
    const result = await optimizeShoppingListAnthropic([
      { index: 0, name: "Etwas", quantity: null, unit: null, category: "andere" },
    ]);

    expect(result.ok).toBe(false);
  });

  it("fails gracefully when no tool_use block is returned", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "Keine Vorschläge." }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    const { optimizeShoppingListAnthropic } = await import("./anthropic");
    const result = await optimizeShoppingListAnthropic([]);

    expect(result.ok).toBe(false);
    expect(result.tokensUsed).toBe(15);
  });

  it("fails gracefully when the Anthropic API call throws", async () => {
    mockCreate.mockRejectedValue(new Error("rate limited"));

    const { optimizeShoppingListAnthropic } = await import("./anthropic");
    const result = await optimizeShoppingListAnthropic([]);

    expect(result.ok).toBe(false);
    expect(result.tokensUsed).toBe(0);
  });
});
