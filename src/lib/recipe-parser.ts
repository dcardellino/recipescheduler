import { parseHTML } from "linkedom";
import { parseIngredient } from "@/lib/ingredient-parser";
import { parseISODuration } from "@/lib/ingredient-normalizer";
import { classifyIngredient } from "@/lib/ingredient-categorizer";
import type { RecipeFormInput } from "@/lib/schemas/recipe";

export type ParsedRecipe = Omit<RecipeFormInput, "rating" | "notes" | "tagNames"> & {
  rating: number | null;
  notes: null;
  tagNames: string[];
};

export type ParseFailure =
  | { ok: false; code: "fetch_failed" }
  | { ok: false; code: "no_recipe"; fallbackTitle: string | null };

export type ParseSuccess = {
  ok: true;
  recipe: ParsedRecipe;
  rawImageUrl: string | null;
};

export type ParseResult = ParseSuccess | ParseFailure;

const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 5_000_000;

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_BYTES) return null;
    return new TextDecoder("utf-8").decode(buffer);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRecipeFromUrl(url: string): Promise<ParseResult> {
  const html = await fetchHtml(url);
  if (html === null) {
    return { ok: false, code: "fetch_failed" };
  }
  return parseHtml(html, url);
}

export function parseHtml(html: string, sourceUrl: string): ParseResult {
  const { document } = parseHTML(html);

  const scripts = document.querySelectorAll(
    'script[type="application/ld+json"]',
  );
  const recipeNode = findRecipeNode(scripts);

  const pageTitle = getPageTitle(document);

  if (!recipeNode) {
    return { ok: false, code: "no_recipe", fallbackTitle: pageTitle };
  }

  const rawImageUrl = extractImageUrl(recipeNode) ?? extractOgImage(document);
  const recipe = mapRecipe(recipeNode, sourceUrl, pageTitle);

  return { ok: true, recipe, rawImageUrl };
}

function findRecipeNode(
  scripts: ArrayLike<Element>,
): Record<string, unknown> | null {
  for (let i = 0; i < scripts.length; i++) {
    const raw = scripts[i].textContent;
    if (!raw) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(stripJsonComments(raw));
    } catch {
      continue;
    }
    const node = findRecipeInValue(parsed);
    if (node) return node;
  }
  return null;
}

function stripJsonComments(input: string): string {
  // Some sites embed trailing HTML comments or whitespace around JSON-LD.
  return input.trim().replace(/^<!--/, "").replace(/-->$/, "").trim();
}

function findRecipeInValue(
  value: unknown,
): Record<string, unknown> | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findRecipeInValue(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  if (isRecipeType(obj["@type"])) return obj;
  if (obj["@graph"]) {
    const found = findRecipeInValue(obj["@graph"]);
    if (found) return found;
  }
  return null;
}

function isRecipeType(type: unknown): boolean {
  if (typeof type === "string") return type === "Recipe";
  if (Array.isArray(type)) return type.some((t) => t === "Recipe");
  return false;
}

function getPageTitle(
  document: Document | { querySelector(sel: string): Element | null },
): string | null {
  const titleEl = document.querySelector("title");
  const text = titleEl?.textContent?.trim();
  return text ? text : null;
}

function extractImageUrl(recipe: Record<string, unknown>): string | null {
  const image = recipe["image"];
  const url = firstImageUrl(image);
  return url;
}

function firstImageUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = firstImageUrl(item);
      if (url) return url;
    }
    return null;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url;
    if (typeof obj["@id"] === "string") return obj["@id"] as string;
    if (typeof obj.contentUrl === "string") return obj.contentUrl as string;
  }
  return null;
}

function extractOgImage(
  document: { querySelector(sel: string): Element | null },
): string | null {
  const meta = document.querySelector('meta[property="og:image"]');
  const content = meta?.getAttribute?.("content")?.trim();
  return content ? content : null;
}

function mapRecipe(
  recipe: Record<string, unknown>,
  sourceUrl: string,
  pageTitleFallback: string | null,
): ParsedRecipe {
  const title =
    stringOrNull(recipe["name"]) ?? pageTitleFallback ?? "Importiertes Rezept";

  const description =
    stringOrNull(recipe["description"])?.trim().slice(0, 2000) ?? null;

  const servings = coerceServings(recipe["recipeYield"]);

  const prepMinutes = parseISODuration(stringOrNull(recipe["prepTime"]));
  const cookMinutes = parseISODuration(stringOrNull(recipe["cookTime"]));

  const rawIngredients = toStringArray(recipe["recipeIngredient"]);
  const ingredients = rawIngredients.map((raw) => {
    const parsed = parseIngredient(raw);
    const name = parsed.name || raw;
    return {
      name: name.slice(0, 200),
      quantity: parsed.quantity,
      unit: parsed.unit ? parsed.unit.slice(0, 50) : null,
      note: parsed.note ? parsed.note.slice(0, 200) : null,
      category: classifyIngredient(name),
    };
  });

  const steps = extractSteps(recipe["recipeInstructions"]).map((text) => ({
    text: text.slice(0, 2000),
  }));

  const tagNames = extractKeywords(recipe["keywords"])
    .concat(extractKeywords(recipe["recipeCategory"]))
    .concat(extractKeywords(recipe["recipeCuisine"]))
    .map((t) => t.slice(0, 60))
    .filter(Boolean)
    .slice(0, 50);

  return {
    title: title.slice(0, 200),
    description,
    sourceUrl: sourceUrl.slice(0, 1000),
    imageUrl: null, // set later after image download
    servings,
    prepMinutes,
    cookMinutes,
    rating: null,
    notes: null,
    ingredients: ingredients.length > 0
      ? ingredients
      : [
          {
            name: "",
            quantity: null,
            unit: null,
            note: null,
            category: "andere" as const,
          },
        ],
    steps,
    tagNames,
    components: [],
  } as ParsedRecipe;
}

function stringOrNull(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function coerceServings(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return clampServings(Math.round(raw));
  }
  if (typeof raw === "string") {
    const match = raw.match(/\d+/);
    if (match) return clampServings(Number(match[0]));
  }
  return 2;
}

function clampServings(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 2;
  if (n > 99) return 99;
  return n;
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v : null))
      .filter((v): v is string => Boolean(v && v.trim()))
      .map((v) => v.trim());
  }
  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function extractSteps(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") {
    return stripHtml(value)
      .split(/\n+|(?<=[.!?])\s+(?=[A-ZÄÖÜ])/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(value)) {
    const out: string[] = [];
    for (const item of value) {
      out.push(...extractSteps(item));
    }
    return out;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // HowToSection with itemListElement
    if (obj["@type"] === "HowToSection" && obj["itemListElement"]) {
      return extractSteps(obj["itemListElement"]);
    }
    // HowToStep with text or name
    const text = stringOrNull(obj["text"]) ?? stringOrNull(obj["name"]);
    if (text) return [stripHtml(text).trim()].filter(Boolean);
  }
  return [];
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|div|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function extractKeywords(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value
      .flatMap((v) => extractKeywords(v))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}
