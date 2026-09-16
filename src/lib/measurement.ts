import { normalizeUnit } from "@/lib/ingredient-normalizer";

/**
 * Scaling ingredient amounts to a different serving size and converting
 * between the metric and the US/imperial system. Pure functions — shared by
 * the recipe detail view (client) and any server-side formatting.
 */

export const MEASUREMENT_SYSTEMS = ["metric", "imperial"] as const;
export type MeasurementSystem = (typeof MEASUREMENT_SYSTEMS)[number];

export const MEASUREMENT_SYSTEM_LABELS: Record<MeasurementSystem, string> = {
  metric: "Metrisch",
  imperial: "US / Imperial",
};

export type Measure = {
  quantity: number | null;
  unit: string | null;
};

// --- Rounding -------------------------------------------------------------

/**
 * Rounds to a precision that stays readable in a recipe: large amounts become
 * whole numbers, small ones keep enough decimals to survive scaling.
 */
export function roundQuantity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const abs = Math.abs(value);
  if (abs >= 100) return Math.round(value);
  if (abs >= 10) return round(value, 1);
  return round(value, 2);
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// --- Scaling --------------------------------------------------------------

/** Scales a single amount by `factor` (e.g. 6 servings / 4 servings = 1.5). */
export function scaleQuantity(
  quantity: number | null,
  factor: number,
): number | null {
  if (quantity === null || !Number.isFinite(quantity)) return null;
  if (!Number.isFinite(factor) || factor <= 0) return quantity;
  return roundQuantity(quantity * factor);
}

/** Servings factor, guarding against zero/negative recipe servings. */
export function servingsFactor(
  targetServings: number,
  baseServings: number,
): number {
  if (!Number.isFinite(baseServings) || baseServings <= 0) return 1;
  if (!Number.isFinite(targetServings) || targetServings <= 0) return 1;
  return targetServings / baseServings;
}

// --- Unit conversion ------------------------------------------------------

const GRAMS_PER: Record<string, number> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const MILLILITERS_PER: Record<string, number> = {
  ml: 1,
  cl: 10,
  dl: 100,
  l: 1000,
  "fl oz": 29.5735,
  cup: 236.588,
  Tasse: 236.588,
  pint: 473.176,
  quart: 946.353,
};

const CENTIMETERS_PER: Record<string, number> = {
  mm: 0.1,
  cm: 1,
  inch: 2.54,
};

/** Spoon units are treated as equivalent across systems (EL ≈ tbsp, TL ≈ tsp). */
const SPOON_EQUIVALENTS: Record<string, { metric: string; imperial: string }> = {
  EL: { metric: "EL", imperial: "tbsp" },
  TL: { metric: "TL", imperial: "tsp" },
  tbsp: { metric: "EL", imperial: "tbsp" },
  tsp: { metric: "TL", imperial: "tsp" },
};

// "Tasse" counts as imperial here: it is volumetric cup measuring, so asking
// for metric should turn it into millilitres rather than leave it as-is.
const IMPERIAL_ONLY = new Set([
  "oz",
  "lb",
  "fl oz",
  "cup",
  "Tasse",
  "pint",
  "quart",
  "inch",
]);
const METRIC_ONLY = new Set(["mg", "g", "kg", "ml", "cl", "dl", "l", "mm", "cm"]);

/**
 * Canonicalises a raw unit string for conversion. Builds on
 * `normalizeUnit` (which maps German/English spellings onto the app's
 * canonical set) and additionally recognises the US units the converter emits.
 */
export function canonicalUnit(raw: string | null | undefined): string | null {
  const normalized = normalizeUnit(raw);
  if (!normalized) return null;
  const key = normalized.toLocaleLowerCase("en-US").replace(/\./g, "").trim();
  switch (key) {
    case "fl oz":
    case "floz":
    case "fluid ounce":
    case "fluid ounces":
      return "fl oz";
    case "cup":
    case "cups":
      return "cup";
    case "pint":
    case "pints":
    case "pt":
      return "pint";
    case "quart":
    case "quarts":
    case "qt":
      return "quart";
    case "inch":
    case "inches":
    case "in":
      return "inch";
    case "mm":
      return "mm";
    case "cm":
      return "cm";
    case "tbsp":
      return "tbsp";
    case "tsp":
      return "tsp";
    default:
      return normalized;
  }
}

function systemOfUnit(unit: string): MeasurementSystem | null {
  if (IMPERIAL_ONLY.has(unit)) return "imperial";
  if (METRIC_ONLY.has(unit)) return "metric";
  return null;
}

/**
 * Converts one amount into the target measurement system. Units that have no
 * counterpart (Stück, Prise, Bund …) are returned untouched, as are amounts
 * without a quantity.
 */
export function convertMeasure(
  measure: Measure,
  target: MeasurementSystem,
): Measure {
  const unit = canonicalUnit(measure.unit);
  if (!unit) return { quantity: measure.quantity, unit: measure.unit };

  const spoon = SPOON_EQUIVALENTS[unit];
  if (spoon) {
    return { quantity: measure.quantity, unit: spoon[target] };
  }

  // "Tasse" is metric-ish in German recipes but identical to a US cup; only
  // rename it when the reader asked for imperial.
  if (unit === "Tasse" && target === "imperial") {
    return { quantity: measure.quantity, unit: "cup" };
  }

  const sourceSystem = systemOfUnit(unit);
  if (sourceSystem === null || sourceSystem === target) {
    return { quantity: measure.quantity, unit: measure.unit };
  }

  if (measure.quantity === null || !Number.isFinite(measure.quantity)) {
    // Without a number there is nothing to convert; keep the original label so
    // we never claim "500 g" turned into an unlabelled amount.
    return { quantity: measure.quantity, unit: measure.unit };
  }

  if (GRAMS_PER[unit] !== undefined) {
    return convertWeight(measure.quantity * GRAMS_PER[unit], target);
  }
  if (MILLILITERS_PER[unit] !== undefined) {
    return convertVolume(measure.quantity * MILLILITERS_PER[unit], target);
  }
  if (CENTIMETERS_PER[unit] !== undefined) {
    return convertLength(measure.quantity * CENTIMETERS_PER[unit], target);
  }

  return { quantity: measure.quantity, unit: measure.unit };
}

function convertWeight(grams: number, target: MeasurementSystem): Measure {
  if (target === "metric") {
    if (grams >= 1000) return { quantity: roundQuantity(grams / 1000), unit: "kg" };
    return { quantity: roundQuantity(grams), unit: "g" };
  }
  if (grams >= GRAMS_PER.lb) {
    return { quantity: roundQuantity(grams / GRAMS_PER.lb), unit: "lb" };
  }
  return { quantity: roundQuantity(grams / GRAMS_PER.oz), unit: "oz" };
}

function convertVolume(ml: number, target: MeasurementSystem): Measure {
  if (target === "metric") {
    if (ml >= 1000) return { quantity: roundQuantity(ml / 1000), unit: "l" };
    return { quantity: roundQuantity(ml), unit: "ml" };
  }
  if (ml < 15) {
    return { quantity: roundQuantity(ml / 4.92892), unit: "tsp" };
  }
  if (ml < 60) {
    return { quantity: roundQuantity(ml / 14.7868), unit: "tbsp" };
  }
  return { quantity: roundQuantity(ml / MILLILITERS_PER.cup), unit: "cup" };
}

function convertLength(cm: number, target: MeasurementSystem): Measure {
  if (target === "metric") {
    return { quantity: roundQuantity(cm), unit: "cm" };
  }
  return { quantity: roundQuantity(cm / CENTIMETERS_PER.inch), unit: "inch" };
}

/**
 * Promotes or demotes an amount inside its own system so a scaled recipe reads
 * naturally ("1200 ml" → "1,2 l"). Only applied after scaling: at factor 1 the
 * detail view must show exactly the unit that was saved.
 */
export function promoteWithinSystem(measure: Measure): Measure {
  const unit = canonicalUnit(measure.unit);
  if (!unit || measure.quantity === null || !Number.isFinite(measure.quantity)) {
    return measure;
  }

  const system = systemOfUnit(unit);
  if (system === null) return measure;

  if (GRAMS_PER[unit] !== undefined) {
    return convertWeight(measure.quantity * GRAMS_PER[unit], system);
  }
  if (MILLILITERS_PER[unit] !== undefined) {
    return convertVolume(measure.quantity * MILLILITERS_PER[unit], system);
  }
  return measure;
}

/** Scales first, then converts — the order the recipe view applies them in. */
export function scaleAndConvert(
  measure: Measure,
  factor: number,
  target: MeasurementSystem,
): Measure {
  const scaled: Measure = {
    quantity: scaleQuantity(measure.quantity, factor),
    unit: measure.unit,
  };
  const converted = convertMeasure(scaled, target);
  return factor === 1 ? converted : promoteWithinSystem(converted);
}

// --- Formatting -----------------------------------------------------------

const FRACTIONS: { value: number; glyph: string }[] = [
  { value: 1 / 8, glyph: "⅛" },
  { value: 1 / 4, glyph: "¼" },
  { value: 1 / 3, glyph: "⅓" },
  { value: 1 / 2, glyph: "½" },
  { value: 2 / 3, glyph: "⅔" },
  { value: 3 / 4, glyph: "¾" },
];

const FRACTION_UNITS = new Set([
  "cup",
  "Tasse",
  "tbsp",
  "tsp",
  "EL",
  "TL",
  "lb",
  "inch",
  "pint",
  "quart",
]);

const FRACTION_TOLERANCE = 0.03;

/**
 * Renders an amount the way a cook expects to read it: US volumes as
 * fractions ("1 ½ cup"), metric amounts as German decimals ("237,5 ml").
 */
export function formatQuantity(
  quantity: number | null,
  unit?: string | null,
): string {
  if (quantity === null || !Number.isFinite(quantity)) return "";

  const canonical = canonicalUnit(unit);
  if (canonical && FRACTION_UNITS.has(canonical)) {
    const asFraction = toFractionString(quantity);
    if (asFraction !== null) return asFraction;
  }

  if (Number.isInteger(quantity)) return quantity.toString();
  return quantity.toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

function toFractionString(value: number): string | null {
  if (value <= 0) return null;
  const whole = Math.floor(value);
  const remainder = value - whole;

  if (remainder < FRACTION_TOLERANCE) {
    return whole > 0 ? whole.toString() : null;
  }

  const match = FRACTIONS.find(
    (f) => Math.abs(remainder - f.value) <= FRACTION_TOLERANCE,
  );
  if (!match) return null;

  return whole > 0 ? `${whole} ${match.glyph}` : match.glyph;
}

/** Full "1 ½ cup" / "250 g" label; empty string when there is nothing to show. */
export function formatMeasure(measure: Measure): string {
  const quantity = formatQuantity(measure.quantity, measure.unit);
  return [quantity, measure.unit ?? ""].filter(Boolean).join(" ").trim();
}

// --- Temperatures in step texts ------------------------------------------

const CELSIUS_PATTERN = /(\d+(?:[.,]\d+)?)\s*°\s*C\b/g;
const FAHRENHEIT_PATTERN = /(\d+(?:[.,]\d+)?)\s*°\s*F\b/g;

/**
 * Rewrites oven temperatures inside a preparation step so they match the
 * selected system. Rounded to 5 degrees — that's how ovens are labelled.
 */
export function convertTemperaturesInText(
  text: string,
  target: MeasurementSystem,
): string {
  if (target === "imperial") {
    return text.replace(CELSIUS_PATTERN, (_match, raw: string) => {
      const celsius = Number(raw.replace(",", "."));
      if (!Number.isFinite(celsius)) return _match;
      return `${roundFahrenheit((celsius * 9) / 5 + 32)}°F`;
    });
  }
  return text.replace(FAHRENHEIT_PATTERN, (_match, raw: string) => {
    const fahrenheit = Number(raw.replace(",", "."));
    if (!Number.isFinite(fahrenheit)) return _match;
    return `${roundTo5(((fahrenheit - 32) * 5) / 9)}°C`;
  });
}

function roundTo5(value: number): number {
  return Math.round(value / 5) * 5;
}

/**
 * Oven dials in the US are marked in 25°F steps, so 180°C reads as the
 * familiar 350°F instead of a literal 356°F.
 */
function roundFahrenheit(value: number): number {
  if (value >= 200) return Math.round(value / 25) * 25;
  return roundTo5(value);
}
