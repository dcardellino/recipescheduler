import { describe, it, expect } from "vitest";
import { parseIngredient } from "./ingredient-parser";

describe("parseIngredient", () => {
  it("parses 'quantity unit name'", () => {
    expect(parseIngredient("200 g Mehl")).toEqual({
      name: "Mehl",
      quantity: 200,
      unit: "g",
      note: null,
    });
    expect(parseIngredient("2 EL Olivenöl")).toEqual({
      name: "Olivenöl",
      quantity: 2,
      unit: "EL",
      note: null,
    });
    expect(parseIngredient("0,5 l Milch")).toEqual({
      name: "Milch",
      quantity: 0.5,
      unit: "l",
      note: null,
    });
  });

  it("normalizes English units into German", () => {
    expect(parseIngredient("2 tbsp olive oil")).toEqual({
      name: "olive oil",
      quantity: 2,
      unit: "EL",
      note: null,
    });
    expect(parseIngredient("1 cup flour")).toEqual({
      name: "flour",
      quantity: 1,
      unit: "Tasse",
      note: null,
    });
  });

  it("parses fractions and unicode fractions", () => {
    expect(parseIngredient("1/2 TL Salz")).toEqual({
      name: "Salz",
      quantity: 0.5,
      unit: "TL",
      note: null,
    });
    expect(parseIngredient("½ TL Salz")).toEqual({
      name: "Salz",
      quantity: 0.5,
      unit: "TL",
      note: null,
    });
    expect(parseIngredient("1 1/2 l Wasser")).toEqual({
      name: "Wasser",
      quantity: 1.5,
      unit: "l",
      note: null,
    });
  });

  it("captures parenthetical notes", () => {
    expect(parseIngredient("200 g Mehl (Type 405)")).toEqual({
      name: "Mehl",
      quantity: 200,
      unit: "g",
      note: "Type 405",
    });
  });

  it("captures trailing comma clause as note", () => {
    expect(parseIngredient("1 Zwiebel, fein gewürfelt")).toEqual({
      name: "Zwiebel",
      quantity: 1,
      unit: null,
      note: "fein gewürfelt",
    });
  });

  it("handles no quantity", () => {
    expect(parseIngredient("Salz")).toEqual({
      name: "Salz",
      quantity: null,
      unit: null,
      note: null,
    });
    expect(parseIngredient("etwas Olivenöl")).toEqual({
      name: "etwas Olivenöl",
      quantity: null,
      unit: null,
      note: null,
    });
  });

  it("handles quantity without unit", () => {
    expect(parseIngredient("3 Eier")).toEqual({
      name: "Eier",
      quantity: 3,
      unit: null,
      note: null,
    });
    expect(parseIngredient("2 Zwiebeln")).toEqual({
      name: "Zwiebeln",
      quantity: 2,
      unit: null,
      note: null,
    });
  });

  it("handles ranges by taking lower bound", () => {
    expect(parseIngredient("1-2 EL Olivenöl")).toEqual({
      name: "Olivenöl",
      quantity: 1,
      unit: "EL",
      note: null,
    });
  });

  it("collapses multiple spaces", () => {
    expect(parseIngredient("  200 g    Mehl  ")).toEqual({
      name: "Mehl",
      quantity: 200,
      unit: "g",
      note: null,
    });
  });
});
