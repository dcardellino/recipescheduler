const UNIT_MAP: Record<string, string> = {
  // Weight
  g: "g",
  gr: "g",
  gramm: "g",
  gram: "g",
  grams: "g",
  kg: "kg",
  kilo: "kg",
  kilos: "kg",
  kilogramm: "kg",
  kilogram: "kg",
  kilograms: "kg",
  mg: "mg",
  milligramm: "mg",
  milligram: "mg",
  lb: "lb",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",

  // Volume
  ml: "ml",
  milliliter: "ml",
  millilitre: "ml",
  milliliters: "ml",
  l: "l",
  liter: "l",
  litre: "l",
  liters: "l",
  litres: "l",
  cl: "cl",
  centiliter: "cl",
  centilitre: "cl",
  dl: "dl",
  deziliter: "dl",
  cup: "Tasse",
  cups: "Tasse",
  tasse: "Tasse",
  tassen: "Tasse",

  // Spoons
  el: "EL",
  "el.": "EL",
  esslöffel: "EL",
  esslöffeln: "EL",
  esslöffels: "EL",
  tbsp: "EL",
  tablespoon: "EL",
  tablespoons: "EL",
  tl: "TL",
  "tl.": "TL",
  teelöffel: "TL",
  teelöffeln: "TL",
  tsp: "TL",
  teaspoon: "TL",
  teaspoons: "TL",
  msp: "Msp.",
  "msp.": "Msp.",
  messerspitze: "Msp.",

  // Count / bunch / pack
  stück: "Stück",
  stk: "Stück",
  "stk.": "Stück",
  stueck: "Stück",
  piece: "Stück",
  pieces: "Stück",
  pcs: "Stück",
  prise: "Prise",
  prisen: "Prise",
  pinch: "Prise",
  pinches: "Prise",
  bund: "Bund",
  bunch: "Bund",
  bunches: "Bund",
  zehe: "Zehe",
  zehen: "Zehe",
  clove: "Zehe",
  cloves: "Zehe",
  dose: "Dose",
  dosen: "Dose",
  can: "Dose",
  cans: "Dose",
  packung: "Pck.",
  packungen: "Pck.",
  pck: "Pck.",
  "pck.": "Pck.",
  pack: "Pck.",
  packet: "Pck.",
  paket: "Pck.",
  päckchen: "Pck.",
  beutel: "Beutel",
  sachet: "Beutel",
  flasche: "Flasche",
  flaschen: "Flasche",
  bottle: "Flasche",
  glas: "Glas",
  gläser: "Glas",
  jar: "Glas",
  scheibe: "Scheibe",
  scheiben: "Scheibe",
  slice: "Scheibe",
  slices: "Scheibe",
  blatt: "Blatt",
  blätter: "Blatt",
  leaf: "Blatt",
  leaves: "Blatt",
  tropfen: "Tropfen",
  drop: "Tropfen",
  drops: "Tropfen",
};

export function normalizeUnit(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const key = trimmed.toLocaleLowerCase("de-DE");
  return UNIT_MAP[key] ?? trimmed;
}

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 0.25,
  "¾": 0.75,
  "⅕": 0.2,
  "⅖": 0.4,
  "⅗": 0.6,
  "⅘": 0.8,
  "⅙": 1 / 6,
  "⅚": 5 / 6,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

export function parseQuantity(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Unicode fraction alone
  if (UNICODE_FRACTIONS[trimmed] !== undefined) {
    return round2(UNICODE_FRACTIONS[trimmed]);
  }

  // Mixed number with unicode fraction: "1½"
  const mixedUnicode = trimmed.match(/^(\d+)([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/);
  if (mixedUnicode) {
    return round2(
      Number(mixedUnicode[1]) + UNICODE_FRACTIONS[mixedUnicode[2]],
    );
  }

  // Plain fraction "1/2" or "3/4"
  const fraction = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const num = Number(fraction[1]);
    const den = Number(fraction[2]);
    if (den === 0) return null;
    return round2(num / den);
  }

  // Mixed number "1 1/2"
  const mixed = trimmed.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const num = Number(mixed[2]);
    const den = Number(mixed[3]);
    if (den === 0) return null;
    return round2(whole + num / den);
  }

  // Range "1-2" or "1–2" → take the lower bound
  const range = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*[-–]\s*\d+(?:[.,]\d+)?$/);
  if (range) {
    return round2(Number(range[1].replace(",", ".")));
  }

  // Plain number with dot or comma decimal
  const decimal = trimmed.replace(",", ".");
  const num = Number(decimal);
  if (!Number.isFinite(num)) return null;
  return round2(num);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function parseISODuration(input: string | null | undefined): number | null {
  if (!input) return null;
  const match = input.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const total = hours * 60 + minutes + Math.round(seconds / 60);
  return total > 0 ? total : null;
}
