import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseHtml } from "./recipe-parser";

function loadFixture(name: string): string {
  return readFileSync(join(process.cwd(), "test/fixtures", name), "utf-8");
}

const BASIC_RECIPE_HTML = `<!doctype html>
<html><head>
<title>Pasta Pomodoro | Kochbuch</title>
<meta property="og:image" content="https://example.com/og.jpg" />
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Recipe",
  name: "Pasta Pomodoro",
  description: "Klassischer italienischer Klassiker.",
  image: ["https://example.com/pomodoro.jpg"],
  recipeYield: 4,
  prepTime: "PT15M",
  cookTime: "PT25M",
  recipeIngredient: [
    "500 g Spaghetti",
    "2 EL Olivenöl",
    "2 Knoblauchzehen",
    "800 g passierte Tomaten",
    "Salz",
    "frischer Basilikum",
  ],
  recipeInstructions: [
    { "@type": "HowToStep", text: "Wasser aufkochen und salzen." },
    { "@type": "HowToStep", text: "Knoblauch in Öl anschwitzen." },
    { "@type": "HowToStep", text: "Tomaten zugeben und 15 Min köcheln." },
    { "@type": "HowToStep", text: "Pasta abgießen und mit Sauce mischen." },
  ],
  keywords: "Pasta, Italienisch, schnell",
})}
</script>
</head><body></body></html>`;

describe("parseHtml", () => {
  it("extracts a direct Recipe node", () => {
    const result = parseHtml(BASIC_RECIPE_HTML, "https://example.com/pomodoro");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.title).toBe("Pasta Pomodoro");
    expect(result.recipe.description).toContain("italienischer");
    expect(result.recipe.servings).toBe(4);
    expect(result.recipe.prepMinutes).toBe(15);
    expect(result.recipe.cookMinutes).toBe(25);
    expect(result.recipe.sourceUrl).toBe("https://example.com/pomodoro");
    expect(result.recipe.ingredients).toHaveLength(6);
    expect(result.recipe.ingredients[0]).toEqual({
      name: "Spaghetti",
      quantity: 500,
      unit: "g",
      note: null,
      category: "trocken_backen",
    });
    expect(result.recipe.ingredients[1]).toEqual({
      name: "Olivenöl",
      quantity: 2,
      unit: "EL",
      note: null,
      category: "konserven",
    });
    expect(result.recipe.ingredients[2].category).toBe("gemuese");
    expect(result.recipe.ingredients[4]).toEqual({
      name: "Salz",
      quantity: null,
      unit: null,
      note: null,
      category: "gewuerze",
    });
    expect(result.recipe.steps).toHaveLength(4);
    expect(result.recipe.steps[0].text).toContain("aufkochen");
    expect(result.recipe.tagNames).toEqual(["Pasta", "Italienisch", "schnell"]);
    expect(result.rawImageUrl).toBe("https://example.com/pomodoro.jpg");
  });

  it("finds Recipe nested inside @graph", () => {
    const html = `<!doctype html><html><head>
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", name: "Site" },
    {
      "@type": "Recipe",
      name: "Lasagne",
      recipeIngredient: ["200 g Hackfleisch"],
      recipeInstructions: "Alles zusammenmixen.",
      recipeYield: 2,
    },
  ],
})}
</script></head><body></body></html>`;
    const result = parseHtml(html, "https://example.com/lasagne");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.title).toBe("Lasagne");
    expect(result.recipe.ingredients[0].name).toBe("Hackfleisch");
    expect(result.recipe.ingredients[0].category).toBe("fleisch_fisch");
  });

  it("handles @type as an array containing 'Recipe'", () => {
    const html = `<!doctype html><html><head>
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": ["Recipe", "Thing"],
  name: "Curry",
  recipeYield: "2 servings",
  recipeIngredient: ["1 Zwiebel"],
  recipeInstructions: "Kochen.",
})}
</script></head><body></body></html>`;
    const result = parseHtml(html, "https://example.com/curry");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.title).toBe("Curry");
    expect(result.recipe.servings).toBe(2);
  });

  it("parses recipeInstructions as HTML blob", () => {
    const html = `<!doctype html><html><head>
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Recipe",
  name: "Suppe",
  recipeIngredient: ["Wasser"],
  recipeInstructions:
    "<p>Wasser kochen.</p><p>Gemüse hinzufügen.</p><p>Servieren.</p>",
})}
</script></head><body></body></html>`;
    const result = parseHtml(html, "https://example.com/suppe");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("falls back to og:image when JSON-LD image is missing", () => {
    const html = `<!doctype html><html><head>
<meta property="og:image" content="https://example.com/og.jpg" />
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Recipe",
  name: "Etwas",
  recipeIngredient: ["Salz"],
  recipeInstructions: "Tun.",
})}
</script></head><body></body></html>`;
    const result = parseHtml(html, "https://example.com/etwas");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rawImageUrl).toBe("https://example.com/og.jpg");
  });

  it("returns no_recipe with <title> fallback when no JSON-LD present", () => {
    const html = `<!doctype html><html><head>
<title>Ein Blog-Post</title>
</head><body><p>Kein Rezept hier.</p></body></html>`;
    const result = parseHtml(html, "https://example.com/blog");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("no_recipe");
    if (result.code !== "no_recipe") return;
    expect(result.fallbackTitle).toBe("Ein Blog-Post");
  });

  it("returns no_recipe when JSON-LD has no Recipe type", () => {
    const html = `<!doctype html><html><head>
<title>Article</title>
<script type="application/ld+json">
${JSON.stringify({ "@type": "Article", headline: "News" })}
</script></head><body></body></html>`;
    const result = parseHtml(html, "https://example.com/article");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("no_recipe");
  });

  describe("real-site fixtures", () => {
    it("parses Chefkoch (Recipe at root, German units)", () => {
      const result = parseHtml(
        loadFixture("chefkoch.html"),
        "https://www.chefkoch.de/rezepte/1410581248868622/",
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.recipe.title).toBe("Klassische Spaghetti Bolognese");
      expect(result.recipe.servings).toBe(4);
      expect(result.recipe.prepMinutes).toBe(20);
      expect(result.recipe.cookMinutes).toBe(40);
      expect(result.recipe.ingredients.length).toBe(11);
      const byName = Object.fromEntries(
        result.recipe.ingredients.map((i) => [i.name, i]),
      );
      expect(byName["Spaghetti"].quantity).toBe(500);
      expect(byName["Spaghetti"].unit).toBe("g");
      expect(byName["Rinderhackfleisch"].category).toBe("fleisch_fisch");
      expect(byName["Olivenöl"].unit).toBe("EL");
      expect(byName["Olivenöl"].category).toBe("konserven");
      expect(byName["passierte Tomaten"].category).toBe("konserven");
      expect(byName["Rotwein"].category).toBe("getraenke");
      expect(result.recipe.steps.length).toBe(6);
      expect(result.recipe.tagNames).toContain("Italienisch");
      expect(result.rawImageUrl).toContain("chefkoch");
    });

    it("parses einfachbacken (Recipe inside @graph)", () => {
      const result = parseHtml(
        loadFixture("einfachbacken.html"),
        "https://www.einfachbacken.de/marmorkuchen",
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.recipe.title).toContain("Marmorkuchen");
      expect(result.recipe.servings).toBe(12);
      const byName = Object.fromEntries(
        result.recipe.ingredients.map((i) => [i.name, i]),
      );
      expect(byName["Weizenmehl"].category).toBe("trocken_backen");
      expect(byName["Butter"].category).toBe("milchprodukte");
      expect(byName["Eier"].quantity).toBe(4);
      expect(byName["Eier"].category).toBe("milchprodukte");
    });

    it("parses Kitchen Stories (English, HowToStep with name)", () => {
      const result = parseHtml(
        loadFixture("kitchen-stories.html"),
        "https://www.kitchenstories.com/en/recipes/carbonara",
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.recipe.title).toBe("Spaghetti Carbonara");
      expect(result.recipe.servings).toBe(4);
      const byName = Object.fromEntries(
        result.recipe.ingredients.map((i) => [i.name, i]),
      );
      expect(byName["spaghetti"].unit).toBe("g");
      // English "tsp" → German "TL"
      expect(byName["black pepper"].unit).toBe("TL");
      expect(byName["parmesan"].category).toBe("milchprodukte");
      expect(result.recipe.steps.length).toBe(5);
    });

    it("parses NYT Cooking (@type as array, imperial units)", () => {
      const result = parseHtml(
        loadFixture("nyt-cooking.html"),
        "https://cooking.nytimes.com/recipes/1022835",
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.recipe.title).toBe("Simple Tomato Sauce");
      expect(result.recipe.servings).toBe(6);
      const byName = Object.fromEntries(
        result.recipe.ingredients.map((i) => [i.name, i]),
      );
      // "3 tablespoons olive oil" → EL, olive oil
      expect(byName["olive oil"].unit).toBe("EL");
      expect(byName["olive oil"].quantity).toBe(3);
      // "1/2 teaspoon salt" → TL, 0.5
      expect(byName["salt"].unit).toBe("TL");
      expect(byName["salt"].quantity).toBe(0.5);
      expect(byName["salt"].category).toBe("gewuerze");
      expect(result.recipe.steps.length).toBe(4);
    });

    it("parses BBC Good Food (real page)", () => {
      const result = parseHtml(
        loadFixture("bbc-good-food.html"),
        "https://www.bbcgoodfood.com/recipes/classic-lasagne",
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.recipe.title.toLowerCase()).toContain("lasagne");
      expect(result.recipe.ingredients.length).toBeGreaterThan(5);
      expect(result.recipe.steps.length).toBeGreaterThan(2);
      expect(result.recipe.sourceUrl).toContain("bbcgoodfood");
    });
  });

  it("extracts image from object with url field", () => {
    const html = `<!doctype html><html><head>
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Recipe",
  name: "X",
  image: { "@type": "ImageObject", url: "https://example.com/x.jpg" },
  recipeIngredient: ["Salz"],
  recipeInstructions: "Tun.",
})}
</script></head><body></body></html>`;
    const result = parseHtml(html, "https://example.com/x");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rawImageUrl).toBe("https://example.com/x.jpg");
  });
});
