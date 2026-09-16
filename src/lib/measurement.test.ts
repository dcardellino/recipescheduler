import { describe, expect, it } from "vitest";
import {
  convertMeasure,
  convertTemperaturesInText,
  formatMeasure,
  formatQuantity,
  roundQuantity,
  scaleAndConvert,
  scaleQuantity,
  servingsFactor,
} from "@/lib/measurement";

describe("roundQuantity", () => {
  it("rounds large amounts to whole numbers", () => {
    expect(roundQuantity(333.333)).toBe(333);
    expect(roundQuantity(1000.6)).toBe(1001);
  });

  it("keeps one decimal in the mid range and two below ten", () => {
    expect(roundQuantity(16.666)).toBe(16.7);
    expect(roundQuantity(3.14159)).toBe(3.14);
    expect(roundQuantity(0.333)).toBe(0.33);
  });
});

describe("scaleQuantity", () => {
  it("scales by the given factor", () => {
    expect(scaleQuantity(250, 2)).toBe(500);
    expect(scaleQuantity(250, 0.5)).toBe(125);
    expect(scaleQuantity(1, 1 / 3)).toBe(0.33);
  });

  it("leaves amounts without a quantity alone", () => {
    expect(scaleQuantity(null, 2)).toBeNull();
  });

  it("ignores nonsensical factors", () => {
    expect(scaleQuantity(200, 0)).toBe(200);
    expect(scaleQuantity(200, -1)).toBe(200);
  });
});

describe("servingsFactor", () => {
  it("is the ratio of target to base servings", () => {
    expect(servingsFactor(6, 4)).toBe(1.5);
  });

  it("falls back to 1 for invalid servings", () => {
    expect(servingsFactor(4, 0)).toBe(1);
    expect(servingsFactor(0, 4)).toBe(1);
  });
});

describe("convertMeasure — metric to imperial", () => {
  it("converts grams to ounces and pounds", () => {
    expect(convertMeasure({ quantity: 100, unit: "g" }, "imperial")).toEqual({
      quantity: 3.53,
      unit: "oz",
    });
    expect(convertMeasure({ quantity: 500, unit: "g" }, "imperial")).toEqual({
      quantity: 1.1,
      unit: "lb",
    });
    expect(convertMeasure({ quantity: 1, unit: "kg" }, "imperial")).toEqual({
      quantity: 2.2,
      unit: "lb",
    });
  });

  it("converts millilitres to teaspoons, tablespoons and cups", () => {
    expect(convertMeasure({ quantity: 5, unit: "ml" }, "imperial")).toEqual({
      quantity: 1.01,
      unit: "tsp",
    });
    expect(convertMeasure({ quantity: 30, unit: "ml" }, "imperial")).toEqual({
      quantity: 2.03,
      unit: "tbsp",
    });
    expect(convertMeasure({ quantity: 240, unit: "ml" }, "imperial")).toEqual({
      quantity: 1.01,
      unit: "cup",
    });
    expect(convertMeasure({ quantity: 1, unit: "l" }, "imperial")).toEqual({
      quantity: 4.23,
      unit: "cup",
    });
  });

  it("renames spoon units instead of converting them", () => {
    expect(convertMeasure({ quantity: 2, unit: "EL" }, "imperial")).toEqual({
      quantity: 2,
      unit: "tbsp",
    });
    expect(convertMeasure({ quantity: 1, unit: "TL" }, "imperial")).toEqual({
      quantity: 1,
      unit: "tsp",
    });
  });

  it("renames Tasse to cup", () => {
    expect(convertMeasure({ quantity: 2, unit: "Tasse" }, "imperial")).toEqual({
      quantity: 2,
      unit: "cup",
    });
  });
});

describe("convertMeasure — imperial to metric", () => {
  it("converts ounces and pounds to grams and kilograms", () => {
    expect(convertMeasure({ quantity: 4, unit: "oz" }, "metric")).toEqual({
      quantity: 113,
      unit: "g",
    });
    expect(convertMeasure({ quantity: 2, unit: "lb" }, "metric")).toEqual({
      quantity: 907,
      unit: "g",
    });
    expect(convertMeasure({ quantity: 3, unit: "lb" }, "metric")).toEqual({
      quantity: 1.36,
      unit: "kg",
    });
  });

  it("converts cups and fluid ounces to millilitres", () => {
    expect(convertMeasure({ quantity: 1, unit: "cup" }, "metric")).toEqual({
      quantity: 237,
      unit: "ml",
    });
    expect(convertMeasure({ quantity: 8, unit: "fl oz" }, "metric")).toEqual({
      quantity: 237,
      unit: "ml",
    });
    expect(convertMeasure({ quantity: 5, unit: "cups" }, "metric")).toEqual({
      quantity: 1.18,
      unit: "l",
    });
  });

  it("converts inches to centimetres", () => {
    expect(convertMeasure({ quantity: 2, unit: "inch" }, "metric")).toEqual({
      quantity: 5.08,
      unit: "cm",
    });
  });
});

describe("convertMeasure — passthrough cases", () => {
  it("leaves countable units untouched", () => {
    for (const unit of ["Stück", "Prise", "Bund", "Zehe", "Dose"]) {
      expect(convertMeasure({ quantity: 2, unit }, "imperial")).toEqual({
        quantity: 2,
        unit,
      });
    }
  });

  it("leaves amounts without a unit untouched", () => {
    expect(convertMeasure({ quantity: 3, unit: null }, "imperial")).toEqual({
      quantity: 3,
      unit: null,
    });
  });

  it("keeps the original unit when there is no quantity to convert", () => {
    expect(convertMeasure({ quantity: null, unit: "g" }, "imperial")).toEqual({
      quantity: null,
      unit: "g",
    });
  });

  it("is a no-op when the unit already matches the target system", () => {
    expect(convertMeasure({ quantity: 250, unit: "g" }, "metric")).toEqual({
      quantity: 250,
      unit: "g",
    });
    expect(convertMeasure({ quantity: 4, unit: "oz" }, "imperial")).toEqual({
      quantity: 4,
      unit: "oz",
    });
  });
});

describe("scaleAndConvert", () => {
  it("scales before converting", () => {
    expect(
      scaleAndConvert({ quantity: 250, unit: "g" }, 2, "imperial"),
    ).toEqual({ quantity: 1.1, unit: "lb" });
  });

  it("doubles a metric amount and promotes the unit", () => {
    expect(scaleAndConvert({ quantity: 600, unit: "ml" }, 2, "metric")).toEqual({
      quantity: 1.2,
      unit: "l",
    });
  });

  it("leaves the stored unit alone at factor 1", () => {
    expect(scaleAndConvert({ quantity: 1200, unit: "ml" }, 1, "metric")).toEqual({
      quantity: 1200,
      unit: "ml",
    });
  });
});

describe("formatQuantity", () => {
  it("renders US volumes as fractions", () => {
    expect(formatQuantity(0.5, "cup")).toBe("½");
    expect(formatQuantity(1.5, "cup")).toBe("1 ½");
    expect(formatQuantity(0.33, "tsp")).toBe("⅓");
    expect(formatQuantity(1.01, "cup")).toBe("1");
  });

  it("renders metric amounts as German decimals", () => {
    expect(formatQuantity(250, "g")).toBe("250");
    expect(formatQuantity(1.5, "l")).toBe("1,5");
  });

  it("returns an empty string when there is no quantity", () => {
    expect(formatQuantity(null, "g")).toBe("");
  });

  it("falls back to decimals when no fraction is close enough", () => {
    expect(formatQuantity(1.19, "cup")).toBe("1,19");
  });
});

describe("formatMeasure", () => {
  it("joins quantity and unit", () => {
    expect(formatMeasure({ quantity: 250, unit: "g" })).toBe("250 g");
    expect(formatMeasure({ quantity: 1.5, unit: "cup" })).toBe("1 ½ cup");
  });

  it("handles missing parts", () => {
    expect(formatMeasure({ quantity: null, unit: "Prise" })).toBe("Prise");
    expect(formatMeasure({ quantity: 2, unit: null })).toBe("2");
    expect(formatMeasure({ quantity: null, unit: null })).toBe("");
  });
});

describe("convertTemperaturesInText", () => {
  it("converts Celsius to the familiar Fahrenheit oven steps", () => {
    expect(
      convertTemperaturesInText("Bei 180 °C etwa 25 Minuten backen.", "imperial"),
    ).toBe("Bei 350°F etwa 25 Minuten backen.");
    expect(convertTemperaturesInText("220°C Umluft", "imperial")).toBe(
      "425°F Umluft",
    );
  });

  it("converts Fahrenheit to Celsius", () => {
    expect(convertTemperaturesInText("Preheat to 350°F", "metric")).toBe(
      "Preheat to 175°C",
    );
  });

  it("leaves text without temperatures alone", () => {
    const text = "Zwiebeln in feine Würfel schneiden.";
    expect(convertTemperaturesInText(text, "imperial")).toBe(text);
    expect(convertTemperaturesInText(text, "metric")).toBe(text);
  });

  it("does not touch temperatures already in the target system", () => {
    expect(convertTemperaturesInText("Bei 180 °C backen.", "metric")).toBe(
      "Bei 180 °C backen.",
    );
  });
});
