import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockGenerateContent = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = { generateContent: mockGenerateContent };
  },
  Type: {
    OBJECT: "OBJECT",
    STRING: "STRING",
    NUMBER: "NUMBER",
    INTEGER: "INTEGER",
    ARRAY: "ARRAY",
  },
}));

describe("extractRecipeGemini", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    mockGenerateContent.mockReset();
    vi.resetModules();
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalKey;
  });

  function jsonResponse(data: unknown, usageMetadata = { promptTokenCount: 100, candidatesTokenCount: 50 }) {
    return { text: JSON.stringify(data), usageMetadata };
  }

  it("returns a validated recipe when the response JSON is well-formed", async () => {
    mockGenerateContent.mockResolvedValue(
      jsonResponse({
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

    const { extractRecipeGemini } = await import("./gemini");
    const result = await extractRecipeGemini({
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

  it("fails gracefully when the response has an invalid category (hallucination guard)", async () => {
    mockGenerateContent.mockResolvedValue(
      jsonResponse({
        title: "Mystery Dish",
        servings: 2,
        ingredients: [{ name: "Etwas", category: "nicht_existierende_kategorie" }],
        steps: [{ text: "Kochen." }],
        tagNames: [],
      }),
    );

    const { extractRecipeGemini } = await import("./gemini");
    const result = await extractRecipeGemini({
      captionText: "Ein Rezept mit komischer Kategorie...",
      sourceUrl: "https://www.instagram.com/p/abc123/",
      fallbackTitle: null,
    });

    expect(result.ok).toBe(false);
  });

  it("fails gracefully when no ingredients could be extracted", async () => {
    mockGenerateContent.mockResolvedValue(
      jsonResponse({
        title: "Werbepost ohne Rezept",
        servings: 2,
        ingredients: [],
        steps: [],
        tagNames: [],
      }),
    );

    const { extractRecipeGemini } = await import("./gemini");
    const result = await extractRecipeGemini({
      captionText: "Kauft unser neues Kochbuch!",
      sourceUrl: "https://www.instagram.com/p/abc123/",
      fallbackTitle: null,
    });

    expect(result.ok).toBe(false);
  });

  it("fails gracefully when the response text is not valid JSON", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "Ich kann das nicht extrahieren.",
      usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 10 },
    });

    const { extractRecipeGemini } = await import("./gemini");
    const result = await extractRecipeGemini({
      captionText: "...",
      sourceUrl: "https://www.instagram.com/p/abc123/",
      fallbackTitle: null,
    });

    expect(result.ok).toBe(false);
    expect(result.tokensUsed).toBe(30);
  });

  it("fails gracefully when the Gemini API call throws", async () => {
    mockGenerateContent.mockRejectedValue(new Error("rate limited"));

    const { extractRecipeGemini } = await import("./gemini");
    const result = await extractRecipeGemini({
      captionText: "...",
      sourceUrl: "https://www.instagram.com/p/abc123/",
      fallbackTitle: null,
    });

    expect(result.ok).toBe(false);
    expect(result.tokensUsed).toBe(0);
  });
});

describe("optimizeShoppingListGemini", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    mockGenerateContent.mockReset();
    vi.resetModules();
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalKey;
  });

  function jsonResponse(data: unknown, usageMetadata = { promptTokenCount: 60, candidatesTokenCount: 15 }) {
    return { text: JSON.stringify(data), usageMetadata };
  }

  it("returns a validated optimization when the response JSON is well-formed", async () => {
    mockGenerateContent.mockResolvedValue(
      jsonResponse({
        renames: [{ index: 0, cleanName: "Zwiebel" }],
        merges: [],
        categoryFixes: [{ index: 1, category: "gewuerze" }],
      }),
    );

    const { optimizeShoppingListGemini } = await import("./gemini");
    const result = await optimizeShoppingListGemini([
      { index: 0, name: "Zwiebel, fein gehackt", quantity: 1, unit: "Stück", category: "gemuese" },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.optimization.renames).toEqual([{ index: 0, cleanName: "Zwiebel" }]);
    expect(result.optimization.categoryFixes).toEqual([{ index: 1, category: "gewuerze" }]);
    expect(result.tokensUsed).toBe(75);
  });

  it("fails gracefully when the response has an invalid category", async () => {
    mockGenerateContent.mockResolvedValue(
      jsonResponse({
        renames: [],
        merges: [],
        categoryFixes: [{ index: 0, category: "nicht_existierende_kategorie" }],
      }),
    );

    const { optimizeShoppingListGemini } = await import("./gemini");
    const result = await optimizeShoppingListGemini([
      { index: 0, name: "Etwas", quantity: null, unit: null, category: "andere" },
    ]);

    expect(result.ok).toBe(false);
  });

  it("fails gracefully when the response text is not valid JSON", async () => {
    mockGenerateContent.mockResolvedValue({
      text: "Keine Vorschläge.",
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
    });

    const { optimizeShoppingListGemini } = await import("./gemini");
    const result = await optimizeShoppingListGemini([]);

    expect(result.ok).toBe(false);
    expect(result.tokensUsed).toBe(15);
  });

  it("fails gracefully when the Gemini API call throws", async () => {
    mockGenerateContent.mockRejectedValue(new Error("rate limited"));

    const { optimizeShoppingListGemini } = await import("./gemini");
    const result = await optimizeShoppingListGemini([]);

    expect(result.ok).toBe(false);
    expect(result.tokensUsed).toBe(0);
  });
});
