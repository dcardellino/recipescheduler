import { describe, it, expect } from "vitest";
import {
  normalizeUnit,
  parseQuantity,
  parseISODuration,
} from "./ingredient-normalizer";

describe("normalizeUnit", () => {
  it("returns null for empty input", () => {
    expect(normalizeUnit(null)).toBeNull();
    expect(normalizeUnit(undefined)).toBeNull();
    expect(normalizeUnit("")).toBeNull();
    expect(normalizeUnit("  ")).toBeNull();
  });

  it("maps German spoon variants to canonical form", () => {
    expect(normalizeUnit("EL")).toBe("EL");
    expect(normalizeUnit("el")).toBe("EL");
    expect(normalizeUnit("Esslöffel")).toBe("EL");
    expect(normalizeUnit("esslöffel")).toBe("EL");
    expect(normalizeUnit("TL")).toBe("TL");
    expect(normalizeUnit("Teelöffel")).toBe("TL");
  });

  it("maps English spoon variants to German", () => {
    expect(normalizeUnit("tbsp")).toBe("EL");
    expect(normalizeUnit("tablespoon")).toBe("EL");
    expect(normalizeUnit("tablespoons")).toBe("EL");
    expect(normalizeUnit("tsp")).toBe("TL");
    expect(normalizeUnit("teaspoon")).toBe("TL");
  });

  it("maps weight units", () => {
    expect(normalizeUnit("g")).toBe("g");
    expect(normalizeUnit("Gramm")).toBe("g");
    expect(normalizeUnit("gram")).toBe("g");
    expect(normalizeUnit("kg")).toBe("kg");
    expect(normalizeUnit("Kilogramm")).toBe("kg");
  });

  it("maps volume units", () => {
    expect(normalizeUnit("ml")).toBe("ml");
    expect(normalizeUnit("Milliliter")).toBe("ml");
    expect(normalizeUnit("l")).toBe("l");
    expect(normalizeUnit("Liter")).toBe("l");
    expect(normalizeUnit("cup")).toBe("Tasse");
    expect(normalizeUnit("Tasse")).toBe("Tasse");
  });

  it("maps count / bunch / pack", () => {
    expect(normalizeUnit("Stück")).toBe("Stück");
    expect(normalizeUnit("Stk.")).toBe("Stück");
    expect(normalizeUnit("Prise")).toBe("Prise");
    expect(normalizeUnit("pinch")).toBe("Prise");
    expect(normalizeUnit("Bund")).toBe("Bund");
    expect(normalizeUnit("Zehe")).toBe("Zehe");
    expect(normalizeUnit("clove")).toBe("Zehe");
    expect(normalizeUnit("Dose")).toBe("Dose");
    expect(normalizeUnit("Päckchen")).toBe("Pck.");
  });

  it("passes through unknown units unchanged (trimmed)", () => {
    expect(normalizeUnit("Schuss")).toBe("Schuss");
    expect(normalizeUnit("  Handvoll  ")).toBe("Handvoll");
  });
});

describe("parseQuantity", () => {
  it("parses plain integers and decimals", () => {
    expect(parseQuantity("2")).toBe(2);
    expect(parseQuantity("0.5")).toBe(0.5);
    expect(parseQuantity("1.25")).toBe(1.25);
  });

  it("parses German decimal comma", () => {
    expect(parseQuantity("1,5")).toBe(1.5);
    expect(parseQuantity("0,25")).toBe(0.25);
  });

  it("parses simple fractions", () => {
    expect(parseQuantity("1/2")).toBe(0.5);
    expect(parseQuantity("3/4")).toBe(0.75);
    expect(parseQuantity("1 / 2")).toBe(0.5);
  });

  it("parses mixed numbers", () => {
    expect(parseQuantity("1 1/2")).toBe(1.5);
    expect(parseQuantity("2 3/4")).toBe(2.75);
  });

  it("parses unicode fractions", () => {
    expect(parseQuantity("½")).toBe(0.5);
    expect(parseQuantity("¼")).toBe(0.25);
    expect(parseQuantity("1½")).toBe(1.5);
    expect(parseQuantity("2¾")).toBe(2.75);
  });

  it("parses ranges by taking the lower bound", () => {
    expect(parseQuantity("1-2")).toBe(1);
    expect(parseQuantity("2–3")).toBe(2);
    expect(parseQuantity("1,5-2")).toBe(1.5);
  });

  it("returns null for non-numeric input", () => {
    expect(parseQuantity("etwas")).toBeNull();
    expect(parseQuantity("")).toBeNull();
    expect(parseQuantity("1/0")).toBeNull();
  });

  it("rounds to two decimal places", () => {
    expect(parseQuantity("1/3")).toBe(0.33);
    expect(parseQuantity("2/3")).toBe(0.67);
  });
});

describe("parseISODuration", () => {
  it("parses minutes", () => {
    expect(parseISODuration("PT30M")).toBe(30);
    expect(parseISODuration("PT45M")).toBe(45);
  });

  it("parses hours + minutes", () => {
    expect(parseISODuration("PT1H")).toBe(60);
    expect(parseISODuration("PT1H30M")).toBe(90);
    expect(parseISODuration("PT2H15M")).toBe(135);
  });

  it("rounds seconds into minutes", () => {
    expect(parseISODuration("PT90S")).toBe(2);
  });

  it("returns null for invalid input", () => {
    expect(parseISODuration(null)).toBeNull();
    expect(parseISODuration(undefined)).toBeNull();
    expect(parseISODuration("")).toBeNull();
    expect(parseISODuration("30 minutes")).toBeNull();
    expect(parseISODuration("PT0M")).toBeNull();
  });
});
