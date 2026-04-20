import { normalizeUnit, parseQuantity } from "@/lib/ingredient-normalizer";

export type ParsedIngredient = {
  name: string;
  quantity: number | null;
  unit: string | null;
  note: string | null;
};

const QUANTITY_TOKEN =
  /^(\d+\s+\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?\s*[-–]\s*\d+(?:[.,]\d+)?|\d+\s*\/\s*\d+|\d+[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|\d+(?:[.,]\d+)?|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/;

// Known unit words we will peel off as unit token if they appear right after
// the quantity. Lowercased. Includes multi-word like "msp.".
const UNIT_TOKENS = new Set([
  "g",
  "gr",
  "gramm",
  "kg",
  "kilo",
  "kilogramm",
  "mg",
  "ml",
  "l",
  "liter",
  "cl",
  "dl",
  "el",
  "el.",
  "esslöffel",
  "tbsp",
  "tbsp.",
  "tbsps",
  "tablespoon",
  "tablespoons",
  "tl",
  "tl.",
  "teelöffel",
  "tsp",
  "tsp.",
  "tsps",
  "teaspoon",
  "teaspoons",
  "oz",
  "ounce",
  "ounces",
  "lb",
  "lbs",
  "pound",
  "pounds",
  "msp",
  "msp.",
  "messerspitze",
  "stück",
  "stk",
  "stk.",
  "piece",
  "pieces",
  "prise",
  "prisen",
  "pinch",
  "bund",
  "bunch",
  "zehe",
  "zehen",
  "clove",
  "cloves",
  "dose",
  "dosen",
  "can",
  "packung",
  "packungen",
  "pck",
  "pck.",
  "päckchen",
  "pack",
  "beutel",
  "flasche",
  "flaschen",
  "glas",
  "gläser",
  "scheibe",
  "scheiben",
  "slice",
  "slices",
  "blatt",
  "blätter",
  "tropfen",
  "cup",
  "cups",
  "tasse",
  "tassen",
]);

export function parseIngredient(raw: string): ParsedIngredient {
  const input = raw.trim().replace(/\s+/g, " ");
  if (!input) {
    return { name: "", quantity: null, unit: null, note: null };
  }

  // Pull out parenthetical note. Only the first one.
  let note: string | null = null;
  let working = input;
  const noteMatch = working.match(/\(([^)]+)\)/);
  if (noteMatch) {
    note = noteMatch[1].trim();
    working = (working.slice(0, noteMatch.index ?? 0) +
      working.slice((noteMatch.index ?? 0) + noteMatch[0].length)).trim();
    working = working.replace(/\s+/g, " ");
  }

  // Peel off leading quantity.
  let quantity: number | null = null;
  const qtyMatch = working.match(QUANTITY_TOKEN);
  if (qtyMatch && qtyMatch.index === 0) {
    quantity = parseQuantity(qtyMatch[0]);
    working = working.slice(qtyMatch[0].length).trimStart();
  }

  // Peel off unit if next token is a known unit.
  let unit: string | null = null;
  if (quantity !== null) {
    const parts = working.split(" ");
    if (parts.length > 0) {
      const candidate = parts[0].toLocaleLowerCase("de-DE");
      if (UNIT_TOKENS.has(candidate)) {
        unit = normalizeUnit(parts[0]);
        working = parts.slice(1).join(" ").trimStart();
      }
    }
  }

  // Strip leading "von" / "of" fillers.
  working = working.replace(/^(von|of)\s+/i, "").trim();

  // If there's a trailing comma-separated clause, treat it as the note when no
  // parenthetical was captured. e.g. "Zwiebel, fein gewürfelt"
  if (!note) {
    const commaIdx = working.indexOf(",");
    if (commaIdx !== -1) {
      const after = working.slice(commaIdx + 1).trim();
      if (after) note = after;
      working = working.slice(0, commaIdx).trim();
    }
  }

  return {
    name: working,
    quantity,
    unit,
    note,
  };
}
