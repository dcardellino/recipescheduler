import type { IngredientCategoryValue } from "@/lib/schemas/recipe";

/**
 * The 8 muted "category" colours from the Atlas design system. In
 * recipescheduler they encode shopping categories and recipe tags (Atlas
 * used them for life "areas"). Kept as a small closed set so every colour
 * reads as part of the same calm, editorial palette.
 */
export type CatColor =
  | "rust"
  | "forest"
  | "navy"
  | "gold"
  | "maroon"
  | "teal"
  | "violet"
  | "stone";

type CatClassSet = { text: string; bg: string; border: string; dot: string };

/**
 * Static class map. Tailwind v4 purges classes it cannot see as literal
 * strings, so we must NEVER build `bg-cat-${color}` dynamically — every
 * utility a component might use has to appear verbatim here.
 */
export const CAT_CLASSES: Record<CatColor, CatClassSet> = {
  rust: {
    text: "text-cat-rust",
    bg: "bg-cat-rust",
    border: "border-cat-rust",
    dot: "bg-cat-rust",
  },
  forest: {
    text: "text-cat-forest",
    bg: "bg-cat-forest",
    border: "border-cat-forest",
    dot: "bg-cat-forest",
  },
  navy: {
    text: "text-cat-navy",
    bg: "bg-cat-navy",
    border: "border-cat-navy",
    dot: "bg-cat-navy",
  },
  gold: {
    text: "text-cat-gold",
    bg: "bg-cat-gold",
    border: "border-cat-gold",
    dot: "bg-cat-gold",
  },
  maroon: {
    text: "text-cat-maroon",
    bg: "bg-cat-maroon",
    border: "border-cat-maroon",
    dot: "bg-cat-maroon",
  },
  teal: {
    text: "text-cat-teal",
    bg: "bg-cat-teal",
    border: "border-cat-teal",
    dot: "bg-cat-teal",
  },
  violet: {
    text: "text-cat-violet",
    bg: "bg-cat-violet",
    border: "border-cat-violet",
    dot: "bg-cat-violet",
  },
  stone: {
    text: "text-cat-stone",
    bg: "bg-cat-stone",
    border: "border-cat-stone",
    dot: "bg-cat-stone",
  },
};

const CAT_ORDER: CatColor[] = [
  "rust",
  "forest",
  "navy",
  "gold",
  "maroon",
  "teal",
  "violet",
  "stone",
];

/**
 * Fixed, meaningful colour per shopping category. Source of truth for the
 * keys: the `ingredientCategory` enum in src/db/schema.ts.
 */
export const CATEGORY_CAT_COLOR: Record<IngredientCategoryValue, CatColor> = {
  gemuese: "forest",
  obst: "rust",
  fleisch_fisch: "maroon",
  milchprodukte: "gold",
  tiefkuehl: "teal",
  trocken_backen: "stone",
  konserven: "navy",
  gewuerze: "violet",
  getraenke: "teal",
  brot_backwaren: "gold",
  suessigkeiten: "violet",
  haushalt: "stone",
  andere: "navy",
};

/** Deterministic hash → cat colour, for arbitrary free-text recipe tags. */
export function catColorForKey(key: string): CatColor {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return CAT_ORDER[hash % CAT_ORDER.length];
}

/** Class set for a recipe tag (hashed by lowercased name). */
export function catForTag(name: string): CatClassSet {
  return CAT_CLASSES[catColorForKey(name.toLowerCase())];
}

/** Class set for a shopping category (fixed mapping). */
export function catForCategory(category: IngredientCategoryValue): CatClassSet {
  return CAT_CLASSES[CATEGORY_CAT_COLOR[category]];
}
